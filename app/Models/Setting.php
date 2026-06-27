<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['key', 'value', 'updated_at'];

    public static function get(string $key, $default = null)
    {
        return Cache::rememberForever("setting.$key", fn () => static::find($key)?->value ?? $default);
    }

    public static function set(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value, 'updated_at' => now()]);
        Cache::forget("setting.$key");
    }

    public static function all_keyed(): array
    {
        return static::all()->pluck('value', 'key')->all();
    }
}
