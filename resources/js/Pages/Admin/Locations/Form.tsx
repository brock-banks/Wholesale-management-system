import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Location } from '@/types';

export default function LocationForm({ location }: { location: Location | null }) {
    const isEdit = !!location;
    const { data, setData, post, put, processing, errors } = useForm({
        code: location?.code ?? '',
        name: location?.name ?? '',
        address: location?.address ?? '',
        phone: location?.phone ?? '',
        is_active: location?.is_active ?? true,
        is_default: location?.is_default ?? false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.locations.update', location!.id));
        } else {
            post(route('admin.locations.store'));
        }
    };

    return (
        <AdminLayout title={isEdit ? `Edit location — ${location!.name}` : 'New location'}>
            <Head title={isEdit ? 'Edit location' : 'New location'} />

            <form onSubmit={submit} className="bg-white border border-ink-200 rounded-lg p-6 max-w-2xl">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="Code" error={errors.code} helper="Short identifier, e.g. MAIN, BR-01">
                        <input
                            type="text"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                            className="input"
                            maxLength={16}
                            autoFocus
                        />
                    </Field>
                    <Field label="Name" error={errors.name}>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="input"
                        />
                    </Field>
                </div>

                <Field label="Address" error={errors.address}>
                    <input
                        type="text"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        className="input"
                    />
                </Field>

                <div className="mt-4">
                    <Field label="Phone" error={errors.phone}>
                        <input
                            type="text"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className="input"
                        />
                    </Field>
                </div>

                <div className="mt-6 space-y-3">
                    <label className="flex items-center gap-2 text-sm text-ink-700">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="rounded border-ink-300 text-primary-700 focus:ring-primary-500"
                        />
                        Active
                    </label>
                    <label className="flex items-center gap-2 text-sm text-ink-700">
                        <input
                            type="checkbox"
                            checked={data.is_default}
                            onChange={(e) => setData('is_default', e.target.checked)}
                            className="rounded border-ink-300 text-primary-700 focus:ring-primary-500"
                        />
                        Set as default location
                    </label>
                </div>

                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-ink-200">
                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                    >
                        {isEdit ? 'Save changes' : 'Create location'}
                    </button>
                    <Link href={route('admin.locations.index')} className="text-ink-600 hover:text-ink-900 px-3 py-2 text-sm">
                        Cancel
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}

function Field({
    label,
    children,
    error,
    helper,
}: {
    label: string;
    children: React.ReactNode;
    error?: string;
    helper?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">{label}</label>
            {children}
            {helper && !error && <p className="text-xs text-ink-500 mt-1">{helper}</p>}
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
}
