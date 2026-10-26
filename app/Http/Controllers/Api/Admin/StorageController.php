<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\StorageConfiguration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class StorageController extends Controller
{
    public function show()
    {
        return response()->json(StorageConfiguration::overview());
    }

    public function update(Request $request)
    {
        $rules = ['provider' => 'required|in:public,r2,s3'];
        foreach (['r2', 's3'] as $disk) {
            $rules[$disk] = 'sometimes|array:endpoint,region,bucket,url,folder,private_bucket,key,secret,credentials_set';
            foreach (['region', 'bucket', 'folder', 'private_bucket', 'key', 'secret'] as $key) {
                $rules["$disk.$key"] = 'nullable|string|max:500';
            }
            foreach (['endpoint', 'url'] as $key) {
                $rules["$disk.$key"] = 'nullable|url:http,https|max:2000';
            }
        }
        $data = $request->validate($rules);
        $saved = StorageConfiguration::saved();
        foreach (['r2', 's3'] as $disk) {
            $values = $data[$disk] ?? [];
            unset($values['credentials_set']);
            foreach (['key', 'secret'] as $key) {
                if (empty($values[$key])) {
                    unset($values[$key]);
                }
            }
            $data[$disk] = array_replace($saved[$disk] ?? [], $values);
            if (! empty($data[$disk]['private_bucket']) && $data[$disk]['private_bucket'] === ($data[$disk]['bucket'] ?? config("filesystems.disks.$disk.bucket"))) {
                return response()->json(['message' => 'Bucket privat harus berbeda dari bucket media publik.'], 422);
            }
        }
        Setting::setValue('storage.configuration', Crypt::encryptString(json_encode($data, JSON_THROW_ON_ERROR)), 'storage');
        StorageConfiguration::apply();

        return $this->show();
    }
}
