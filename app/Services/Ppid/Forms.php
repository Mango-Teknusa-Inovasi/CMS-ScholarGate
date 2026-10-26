<?php

namespace App\Services\Ppid;

use App\Models\Ppid\Form;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class Forms
{
    public const KINDS = ['request', 'objection', 'survey', 'guest', 'visit'];

    public static function defaults(string $kind): array
    {
        $field = fn ($key, $label, $type = 'text', $required = true, $options = []) => compact('key', 'label', 'type', 'required', 'options') + ['core' => true, 'step' => 0];
        $identity = [$field('name', 'Nama lengkap'), $field('email', 'Email', 'email'), $field('phone', 'Nomor telepon', 'tel'), $field('address', 'Alamat', 'textarea')];

        return match ($kind) {
            'request' => [...$identity, $field('occupation', 'Pekerjaan'), $field('applicant_type', 'Kategori pemohon', 'select', true, ['Perorangan', 'Badan hukum', 'Kelompok orang']),
                $field('organization', 'Nama organisasi', 'text', false) + ['condition' => ['field' => 'applicant_type', 'operator' => 'not', 'value' => 'Perorangan']],
                $field('identity', 'Bukti identitas sesuai kategori pemohon', 'file'),
                array_replace($field('category', 'Kategori informasi', 'select', true, ['Informasi umum', 'Permintaan data', 'Penerimaan peserta didik']), ['step' => 1]),
                array_replace($field('details', 'Rincian informasi yang dibutuhkan', 'textarea'), ['step' => 1]),
                array_replace($field('purpose', 'Tujuan penggunaan informasi', 'textarea'), ['step' => 1]),
                array_replace($field('access_method', 'Cara memperoleh informasi', 'select', true, ['Melihat/membaca/mendengarkan/mencatat', 'Mendapatkan salinan']), ['step' => 2]),
                array_replace($field('delivery', 'Cara mendapatkan salinan', 'select', true, ['Email', 'Mengambil langsung', 'Pos', 'Kurir']), ['step' => 2]),
                array_replace($field('consent', 'Saya menyatakan informasi yang diberikan benar', 'checkbox'), ['step' => 3])],
            'objection' => [$field('name', 'Nama pengaju'), $field('email', 'Email', 'email'), $field('phone', 'Nomor telepon', 'tel'), $field('reason', 'Alasan keberatan', 'select', true, ['Permohonan ditolak', 'Informasi berkala tidak tersedia', 'Tidak ditanggapi', 'Tanggapan tidak sesuai', 'Informasi tidak dipenuhi', 'Biaya tidak wajar', 'Melebihi tenggat']), $field('details', 'Uraian keberatan', 'textarea'), $field('evidence', 'Bukti pendukung / surat kuasa', 'file', false), $field('consent', 'Saya menyatakan informasi yang diberikan benar', 'checkbox')],
            'survey' => [$field('clarity', 'Kejelasan informasi', 'select', true, ['1', '2', '3', '4']), $field('speed', 'Kecepatan pelayanan', 'select', true, ['1', '2', '3', '4']), $field('courtesy', 'Sikap petugas', 'select', true, ['1', '2', '3', '4']), $field('suggestion', 'Saran perbaikan', 'textarea', false)],
            'guest' => [...$identity, $field('organization', 'Institusi', 'text', false), $field('category', 'Kategori layanan', 'select', true, ['Informasi publik', 'Administrasi', 'Lainnya']), $field('purpose', 'Keperluan', 'textarea')],
            'visit' => [...$identity, $field('organization', 'Institusi'), $field('participants', 'Jumlah peserta', 'number'), $field('date', 'Tanggal kunjungan', 'date'), $field('purpose', 'Tujuan kunjungan', 'textarea')],
            default => abort(404),
        };
    }

    public static function current(string $kind): array
    {
        abort_unless(in_array($kind, self::KINDS), 404);
        $form = Form::where('kind', $kind)->orderByDesc('version')->first();

        return $form ? $form->toArray() : ['kind' => $kind, 'version' => 0, 'active' => true, 'fields' => self::defaults($kind)];
    }

    public static function visible(array $field, array $answers): bool
    {
        $condition = $field['condition'] ?? null;
        if (! $condition) {
            return true;
        }
        $matches = (string) ($answers[$condition['field']] ?? '') === (string) $condition['value'];

        return ($condition['operator'] ?? 'equals') === 'not' ? ! $matches : $matches;
    }

    public static function answers(Request $request, array $schema, bool $offline = false): array
    {
        $input = $request->input('answers', []);
        $rules = [];
        $names = [];
        foreach ($schema['fields'] as $f) {
            $key = $f['key'];
            if (! self::visible($f, $input)) {
                continue;
            }
            $required = $f['required'] && ! ($offline && in_array($key, ['email', 'identity']));
            $prefix = $f['type'] === 'file' ? 'files.' : 'answers.';
            $rule = [$required ? 'required' : 'nullable'];
            $rule = array_merge($rule, match ($f['type']) {
                'file' => ['file', 'max:20480', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx,xls,xlsx,ppt,pptx,txt,csv'],
                'number' => ['numeric', 'min:1'], 'date' => ['date_format:Y-m-d'], 'email' => ['email', 'max:254'],
                'checkbox' => $required ? ['accepted'] : ['boolean'],
                'select' => ['string', Rule::in($f['options'])],
                default => ['string', 'max:10000'],
            });
            $rules[$prefix.$key] = $rule;
            $names[$prefix.$key] = $f['label'];
        }
        $valid = validator($request->all(), $rules, [], $names)->validate();

        return $valid['answers'] ?? [];
    }

    public static function save(string $kind, Request $request): Form
    {
        $data = $request->validate([
            'active' => 'required|boolean', 'fields' => 'required|array|max:60',
            'fields.*.key' => ['required', 'regex:/^[a-z][a-z0-9_]{0,49}$/', 'distinct'],
            'fields.*.label' => 'required|string|max:200',
            'fields.*.type' => ['required', Rule::in(['text', 'textarea', 'number', 'date', 'email', 'tel', 'select', 'checkbox', 'file'])],
            'fields.*.required' => 'required|boolean', 'fields.*.options' => 'present|array|max:100',
            'fields.*.options.*' => 'string|min:1|max:200', 'fields.*.step' => 'required|integer|min:0|max:3',
            'fields.*.hint' => 'nullable|string|max:500', 'fields.*.condition' => 'nullable|array:field,operator,value',
            'fields.*.condition.field' => 'required_with:fields.*.condition|string',
            'fields.*.condition.operator' => ['required_with:fields.*.condition', Rule::in(['equals', 'not'])],
            'fields.*.condition.value' => 'required_with:fields.*.condition|string|max:200',
        ]);
        $indexed = collect($data['fields'])->keyBy('key');
        foreach (self::defaults($kind) as $core) {
            $f = $indexed->get($core['key']);
            if (! $f || $f['type'] !== $core['type'] || ($core['required'] && ! $f['required']) || ($f['condition'] ?? null) !== ($core['condition'] ?? null)) {
                throw ValidationException::withMessages(['fields' => 'Kolom inti '.$core['label'].' harus dipertahankan beserta aturan tampilnya.']);
            }
        }
        $previous = [];
        foreach ($data['fields'] as &$f) {
            $f['core'] = collect(self::defaults($kind))->contains('key', $f['key']);
            if ($f['type'] === 'select' && ! $f['options']) {
                throw ValidationException::withMessages(['fields' => 'Pilihan jawaban tidak boleh kosong.']);
            }
            if (! empty($f['condition']) && (! in_array($f['condition']['field'], $previous) || $f['condition']['field'] === $f['key'])) {
                throw ValidationException::withMessages(['fields' => 'Kondisi tampil harus merujuk kolom sebelumnya.']);
            }
            $previous[] = $f['key'];
        }

        return Form::create($data + ['kind' => $kind, 'version' => (Form::where('kind', $kind)->max('version') ?? 0) + 1]);
    }
}
