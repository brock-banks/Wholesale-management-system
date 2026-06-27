<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    private const KEYS = [
        'business_name',
        'business_address',
        'business_phone',
        'business_tax_id',
        'currency_code',
        'default_tax_rate',
        'invoice_prefix',
        'business_logo_path',
    ];

    public function edit(): Response
    {
        $values = [];
        foreach (self::KEYS as $k) {
            $values[$k] = Setting::get($k, $this->default($k));
        }

        $logoPath = $values['business_logo_path'] ?? null;
        $values['business_logo_url'] = $logoPath ? Storage::disk('public')->url($logoPath) : null;
        unset($values['business_logo_path']);

        return Inertia::render('Admin/Settings/Edit', ['settings' => $values]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'business_name' => ['required', 'string', 'max:160'],
            'business_address' => ['nullable', 'string', 'max:255'],
            'business_phone' => ['nullable', 'string', 'max:64'],
            'business_tax_id' => ['nullable', 'string', 'max:64'],
            'currency_code' => ['required', 'string', 'max:8'],
            'default_tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'invoice_prefix' => ['required', 'string', 'max:16'],
            'business_logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,gif,webp', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
        ]);

        foreach (['business_name', 'business_address', 'business_phone', 'business_tax_id', 'currency_code', 'default_tax_rate', 'invoice_prefix'] as $k) {
            Setting::set($k, (string) ($data[$k] ?? ''));
        }

        if ($request->boolean('remove_logo')) {
            $existing = Setting::get('business_logo_path');
            if ($existing) {
                Storage::disk('public')->delete($existing);
            }
            Setting::set('business_logo_path', null);
        } elseif ($request->hasFile('business_logo')) {
            $existing = Setting::get('business_logo_path');
            if ($existing) {
                Storage::disk('public')->delete($existing);
            }
            $path = $request->file('business_logo')->store('branding', 'public');
            Setting::set('business_logo_path', $path);
        }

        return back()->with('success', 'Settings saved.');
    }

    private function default(string $key): ?string
    {
        return match ($key) {
            'business_name' => config('app.name', 'Wholesale'),
            'currency_code' => 'PKR',
            'default_tax_rate' => '0',
            'invoice_prefix' => 'INV',
            default => null,
        };
    }
}
