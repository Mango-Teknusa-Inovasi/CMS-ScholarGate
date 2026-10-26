<?php

namespace App\Services\Ppid;

use App\Models\Ppid\Attachment;
use App\Models\Ppid\Configuration;
use App\Models\Ppid\Document;
use App\Models\Ppid\Event;
use App\Models\Ppid\Form;
use App\Models\Ppid\Notice;
use App\Models\Ppid\Submission;
use App\Support\MediaStorage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use ZipArchive;

class Archive
{
    private const MODELS = ['settings' => Configuration::class, 'forms' => Form::class, 'documents' => Document::class, 'submissions' => Submission::class, 'files' => Attachment::class, 'events' => Event::class, 'notifications' => Notice::class];

    public function export(string $password): string
    {
        if (! class_exists(ZipArchive::class) || ! ZipArchive::isEncryptionMethodSupported(ZipArchive::EM_AES_256)) {
            throw ValidationException::withMessages(['backup' => 'Server memerlukan ZIP dengan dukungan AES-256.']);
        }
        $directory = storage_path('app/private/ppid-backups');
        File::ensureDirectoryExists($directory, 0700);
        $path = $directory.'/'.Str::uuid().'.zip';
        $zip = new ZipArchive;
        if ($zip->open($path, ZipArchive::CREATE) !== true) {
            throw new \RuntimeException('Tidak dapat membuat cadangan.');
        }
        $zip->setPassword($password);
        $tables = [];
        $temporary = [];
        try {
            foreach (self::MODELS as $name => $model) {
                $tables[$name] = $model::all()->map(function ($row) {
                    $data = [];
                    foreach (array_keys($row->getAttributes()) as $key) {
                        $value = $row->getAttribute($key);
                        $data[$key] = $value instanceof \DateTimeInterface ? $value->format('Y-m-d H:i:s') : $value;
                    }

                    return $data;
                })->all();
            }
            foreach (Attachment::all() as $f) {
                $temp = tempnam($directory, 'blob');
                $temporary[] = $temp;
                $in = app(FileStore::class)->filesystem($f->disk, $f->storage_location)->readStream($f->object_key);
                $out = fopen($temp, 'wb');
                try {
                    stream_copy_to_stream($in, $out);
                } finally {
                    fclose($in);
                    fclose($out);
                }
                $name = 'files/'.$f->id;
                if (! $zip->addFile($temp, $name) || ! $zip->setEncryptionName($name, ZipArchive::EM_AES_256)) {
                    throw new \RuntimeException('Enkripsi lampiran gagal.');
                }
            }
            $manifest = json_encode(['format' => 'scholargate-ppid', 'version' => 1, 'tables' => $tables], JSON_THROW_ON_ERROR);
            if (strlen($manifest) > 40 * 1024 * 1024 || Attachment::sum('size') > 512 * 1024 * 1024) {
                throw ValidationException::withMessages(['backup' => 'Cadangan melampaui batas pemulihan 40 MB metadata / 512 MB lampiran.']);
            }
            $zip->addFromString('manifest.json', $manifest);
            if (! $zip->setEncryptionName('manifest.json', ZipArchive::EM_AES_256) || ! $zip->close()) {
                throw new \RuntimeException('Enkripsi cadangan gagal.');
            }

            return $path;
        } catch (\Throwable $e) {
            @$zip->close();
            @unlink($path);
            throw $e;
        } finally {
            foreach ($temporary as $temp) {
                @unlink($temp);
            }
        }
    }

    public function restore(string $path, string $password): void
    {
        foreach (['documents', 'submissions', 'files', 'events'] as $name) {
            if (self::MODELS[$name]::exists()) {
                throw ValidationException::withMessages(['backup' => 'Pemulihan hanya tersedia pada modul PPID kosong agar register yang ada tidak tertimpa.']);
            }
        }
        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            throw ValidationException::withMessages(['file' => 'Arsip ZIP tidak valid.']);
        }
        $zip->setPassword($password);
        $stored = [];
        try {
            $stat = $zip->statName('manifest.json');
            if (! $stat || $stat['size'] > 40 * 1024 * 1024) {
                throw ValidationException::withMessages(['file' => 'Manifest cadangan tidak valid atau terlalu besar.']);
            }
            $json = $zip->getFromName('manifest.json');
            $manifest = $json ? json_decode($json, true) : null;
            if (($manifest['format'] ?? '') !== 'scholargate-ppid' || ($manifest['version'] ?? 0) !== 1) {
                throw ValidationException::withMessages(['password' => 'Kata sandi atau format cadangan tidak sesuai.']);
            }
            $total = 0;
            $manifest['tables']['files'] ??= [];
            foreach ($manifest['tables']['files'] as &$row) {
                if (! Str::isUuid($row['id'] ?? '')) {
                    throw ValidationException::withMessages(['file' => 'Identitas lampiran tidak valid.']);
                }
                $stat = $zip->statName('files/'.$row['id']);
                $total += $stat['size'] ?? 0;
                if (! $stat || $stat['size'] > 20 * 1024 * 1024 || $total > 512 * 1024 * 1024) {
                    throw ValidationException::withMessages(['file' => 'Ukuran berkas cadangan melampaui batas.']);
                }
                $bytes = $zip->getFromName('files/'.$row['id']);
                if ($bytes === false || ! hash_equals($row['checksum'], hash('sha256', $bytes))) {
                    throw ValidationException::withMessages(['file' => 'Lampiran rusak atau kata sandi salah.']);
                }
                $disk = MediaStorage::diskName();
                $location = app(FileStore::class)->location($disk, true);
                $key = MediaStorage::prefixPath('ppid/restored/'.Str::uuid(), $disk);
                app(FileStore::class)->filesystem($disk, $location)->put($key, $bytes);
                $stored[] = [$disk, $location, $key];
                $row['disk'] = $disk;
                $row['storage_location'] = $location;
                $row['object_key'] = $key;
                $row['public_disk'] = $row['public_location'] = $row['public_key'] = null;
            }
            unset($row);
            DB::transaction(function () use ($manifest, &$stored) {
                foreach (self::MODELS as $name => $model) {
                    if (in_array($name, ['settings', 'forms'])) {
                        $model::query()->delete();
                    }
                    foreach ($manifest['tables'][$name] ?? [] as $row) {
                        if ($name === 'settings') {
                            $row['data']['enabled'] = false;
                            $row['data']['accepting'] = false;
                        }
                        if ($name === 'documents') {
                            validator($row, ['source_url' => 'nullable|url:http,https'])->validate();
                        }
                        if ($name === 'notifications') {
                            $row['state'] = 'failed';
                        }
                        if (in_array($name, ['forms', 'events', 'notifications'])) {
                            unset($row['id']);
                        }
                        $model::create($row);
                    }
                }
                Configuration::updateOrCreate(['id' => 1], ['data' => array_replace(Settings::get(), ['enabled' => false, 'accepting' => false])]);
                foreach (Document::whereNotNull('published_snapshot')->get() as $d) {
                    foreach (Attachment::where('document_id', $d->id)->whereIn('id', $d->published_snapshot['file_ids'] ?? [])->get() as $f) {
                        app(FileStore::class)->publish($f);
                        $stored[] = [$f->public_disk, $f->public_location, $f->public_key];
                    }
                }
            });
        } catch (\Throwable $e) {
            foreach ($stored as [$disk, $location, $key]) {
                app(FileStore::class)->filesystem($disk, $location)->delete($key);
            } throw $e;
        } finally {
            $zip->close();
        }
    }
}
