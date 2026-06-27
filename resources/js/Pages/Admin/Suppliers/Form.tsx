import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Supplier } from '@/types';

export default function SupplierForm({ supplier, next_code }: { supplier: Supplier | null; next_code: string | null }) {
    const isEdit = !!supplier;
    const { data, setData, post, patch, processing, errors } = useForm({
        code: supplier?.code ?? next_code ?? '',
        name: supplier?.name ?? '',
        contact_name: supplier?.contact_name ?? '',
        phone: supplier?.phone ?? '',
        email: supplier?.email ?? '',
        address: supplier?.address ?? '',
        opening_balance: supplier?.opening_balance ?? '0.00',
        is_active: supplier?.is_active ?? true,
        notes: supplier?.notes ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) patch(route('admin.suppliers.update', supplier!.id));
        else post(route('admin.suppliers.store'));
    };

    return (
        <AdminLayout
            title={isEdit ? `Edit supplier — ${supplier!.name}` : 'New supplier'}
            actions={isEdit ? (
                <Link href={route('admin.suppliers.statement', supplier!.id)} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">
                    View statement
                </Link>
            ) : undefined}
        >
            <Head title={isEdit ? 'Edit supplier' : 'New supplier'} />

            <form onSubmit={submit} className="bg-white border border-ink-200 rounded-lg p-6 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Code" error={errors.code}>
                        <input type="text" value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} className="input-mono input" />
                    </Field>
                    <Field label="Name" error={errors.name}>
                        <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="input" autoFocus />
                    </Field>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                    <Field label="Contact person" error={errors.contact_name}>
                        <input type="text" value={data.contact_name} onChange={(e) => setData('contact_name', e.target.value)} className="input" />
                    </Field>
                    <Field label="Phone" error={errors.phone}>
                        <input type="text" value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="input" />
                    </Field>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                    <Field label="Email" error={errors.email}>
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="input" />
                    </Field>
                    <Field label="Address" error={errors.address}>
                        <input type="text" value={data.address} onChange={(e) => setData('address', e.target.value)} className="input" />
                    </Field>
                </div>

                <div className="mt-4">
                    <Field label="Opening balance (we owe them)" error={errors.opening_balance} helper="Positive = you owe them. Negative = they owe you.">
                        <input type="number" step="0.01" value={data.opening_balance} onChange={(e) => setData('opening_balance', e.target.value)} className="input money text-right" />
                    </Field>
                </div>

                {isEdit && (
                    <div className="mt-4 bg-ink-50 rounded p-3 text-sm">
                        <span className="text-ink-500">Current balance: </span>
                        <span className={`money font-medium ${parseFloat(supplier!.current_balance) > 0 ? 'text-danger' : parseFloat(supplier!.current_balance) < 0 ? 'text-success' : 'text-ink-700'}`}>
                            {supplier!.current_balance}
                        </span>
                    </div>
                )}

                <div className="mt-4">
                    <Field label="Notes" error={errors.notes}>
                        <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={2} className="input h-auto py-2" />
                    </Field>
                </div>

                <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm text-ink-700">
                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="rounded border-ink-300 text-primary-700 focus:ring-primary-500" />
                        Active
                    </label>
                </div>

                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-ink-200">
                    <button type="submit" disabled={processing} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
                        {isEdit ? 'Save changes' : 'Create supplier'}
                    </button>
                    <Link href={route('admin.suppliers.index')} className="text-ink-600 hover:text-ink-900 px-3 py-2 text-sm">Cancel</Link>
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
