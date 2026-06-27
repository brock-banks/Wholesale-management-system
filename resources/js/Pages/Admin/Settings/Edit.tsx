import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface SettingsData {
    business_name: string;
    business_address: string | null;
    business_phone: string | null;
    business_tax_id: string | null;
    currency_code: string;
    default_tax_rate: string | number;
    invoice_prefix: string;
    business_logo_url: string | null;
}

export default function SettingsEdit({ settings }: { settings: SettingsData }) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm<{
        business_name: string;
        business_address: string;
        business_phone: string;
        business_tax_id: string;
        currency_code: string;
        default_tax_rate: string | number;
        invoice_prefix: string;
        business_logo: File | null;
        remove_logo: boolean;
        _method: string;
    }>({
        business_name: settings.business_name ?? '',
        business_address: settings.business_address ?? '',
        business_phone: settings.business_phone ?? '',
        business_tax_id: settings.business_tax_id ?? '',
        currency_code: settings.currency_code ?? 'PKR',
        default_tax_rate: settings.default_tax_rate ?? 0,
        invoice_prefix: settings.invoice_prefix ?? 'INV',
        business_logo: null,
        remove_logo: false,
        _method: 'patch',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.settings.update'), { forceFormData: true });
    };

    return (
        <AdminLayout title="Settings">
            <Head title="Settings" />
            <form onSubmit={submit} className="bg-white border border-ink-200 rounded-lg p-6 max-w-2xl">
                <h2 className="text-md font-medium text-ink-900 mb-4">Business profile</h2>

                <Field label="Business name" error={errors.business_name}>
                    <input value={data.business_name} onChange={(e) => setData('business_name', e.target.value)} className="input" />
                </Field>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <Field label="Phone" error={errors.business_phone}>
                        <input value={data.business_phone} onChange={(e) => setData('business_phone', e.target.value)} className="input" />
                    </Field>
                    <Field label="Tax ID" error={errors.business_tax_id}>
                        <input value={data.business_tax_id} onChange={(e) => setData('business_tax_id', e.target.value)} className="input-mono input" />
                    </Field>
                </div>
                <div className="mt-4">
                    <Field label="Address" error={errors.business_address}>
                        <input value={data.business_address} onChange={(e) => setData('business_address', e.target.value)} className="input" />
                    </Field>
                </div>

                <h2 className="text-md font-medium text-ink-900 mt-6 mb-4 pt-4 border-t border-ink-200">Logo</h2>
                <div className="flex items-start gap-4">
                    <div className="w-32 h-20 border border-ink-200 rounded bg-ink-50 flex items-center justify-center overflow-hidden">
                        {settings.business_logo_url && !data.remove_logo && !data.business_logo ? (
                            <img src={settings.business_logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                        ) : data.business_logo ? (
                            <span className="text-xs text-ink-500 px-2 text-center">New: {data.business_logo.name}</span>
                        ) : (
                            <span className="text-xs text-ink-400">No logo</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/gif,image/webp"
                            onChange={(e) => {
                                setData('business_logo', e.target.files?.[0] ?? null);
                                setData('remove_logo', false);
                            }}
                            className="block text-sm text-ink-700"
                        />
                        <p className="text-xs text-ink-500 mt-1">PNG/JPG/GIF/WebP up to 2 MB. Shown on invoice and statement PDFs.</p>
                        {settings.business_logo_url && !data.business_logo && (
                            <label className="inline-flex items-center gap-2 mt-2 text-xs text-ink-600">
                                <input
                                    type="checkbox"
                                    checked={data.remove_logo}
                                    onChange={(e) => setData('remove_logo', e.target.checked)}
                                />
                                Remove current logo
                            </label>
                        )}
                        {errors.business_logo && <p className="text-xs text-danger mt-1">{errors.business_logo}</p>}
                    </div>
                </div>

                <h2 className="text-md font-medium text-ink-900 mt-6 mb-4 pt-4 border-t border-ink-200">Money &amp; invoicing</h2>
                <div className="grid grid-cols-3 gap-4">
                    <Field label="Currency code" error={errors.currency_code} helper="Used in PDF headers">
                        <input value={data.currency_code} onChange={(e) => setData('currency_code', e.target.value.toUpperCase())} className="input-mono input" maxLength={8} />
                    </Field>
                    <Field label="Default tax %" error={errors.default_tax_rate}>
                        <input type="number" step="0.01" value={data.default_tax_rate} onChange={(e) => setData('default_tax_rate', e.target.value)} className="input money text-right" />
                    </Field>
                    <Field label="Invoice prefix" error={errors.invoice_prefix} helper="e.g. INV → INV-2026-0001">
                        <input value={data.invoice_prefix} onChange={(e) => setData('invoice_prefix', e.target.value.toUpperCase())} className="input-mono input" maxLength={16} />
                    </Field>
                </div>

                <div className="mt-6 pt-4 border-t border-ink-200 flex items-center gap-3">
                    <button type="submit" disabled={processing} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
                        Save settings
                    </button>
                    {recentlySuccessful && <span className="text-xs text-success">Saved</span>}
                </div>
            </form>
        </AdminLayout>
    );
}

function Field({ label, children, error, helper }: { label: string; children: React.ReactNode; error?: string; helper?: string }) {
    return (
        <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">{label}</label>
            {children}
            {helper && !error && <p className="text-xs text-ink-500 mt-1">{helper}</p>}
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
}
