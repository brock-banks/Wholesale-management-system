<?php

namespace App\Support;

use App\Models\Setting;

class BusinessSettings
{
    public static function forPdf(): array
    {
        $logoPath = Setting::get('business_logo_path');
        $absolutePath = null;
        if ($logoPath) {
            $candidate = storage_path('app/public/'.$logoPath);
            if (is_file($candidate)) {
                $absolutePath = $candidate;
            }
        }

        return [
            'name' => Setting::get('business_name', config('app.name', 'Wholesale')),
            'address' => Setting::get('business_address', ''),
            'phone' => Setting::get('business_phone', ''),
            'tax_id' => Setting::get('business_tax_id', ''),
            'currency' => Setting::get('currency_code', 'PKR'),
            'logo' => $absolutePath,
        ];
    }

    public static function forInertia(): array
    {
        return [
            'business_name' => Setting::get('business_name', config('app.name', 'Wholesale')),
            'currency_code' => Setting::get('currency_code', 'PKR'),
            'default_tax_rate' => (float) Setting::get('default_tax_rate', 0),
            'invoice_prefix' => Setting::get('invoice_prefix', 'INV'),
        ];
    }

    public static function invoicePrefix(): string
    {
        return Setting::get('invoice_prefix', 'INV');
    }

    public static function currency(): string
    {
        return Setting::get('currency_code', 'PKR');
    }
}
