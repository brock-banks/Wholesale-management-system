import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface SupplierOpt { id: number; code: string; name: string; current_balance: string }

const METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'check', label: 'Check' },
    { value: 'bank', label: 'Bank' },
] as const;

export default function SupplierPaymentsCreate({ suppliers, selected_supplier_id }: { suppliers: SupplierOpt[]; selected_supplier_id: number | null }) {
    const today = new Date().toISOString().slice(0, 10);
    const { data, setData, post, processing, errors } = useForm({
        supplier_id: selected_supplier_id ?? ('' as number | ''),
        payment_date: today,
        amount: '',
        method: 'bank' as 'cash' | 'card' | 'check' | 'bank',
        reference: '',
        bank_name: '',
        check_number: '',
        check_date: today,
        notes: '',
    });

    const supplier = suppliers.find((s) => s.id === data.supplier_id) || null;
    const submit = (e: FormEvent) => { e.preventDefault(); post(route('admin.supplier_payments.store')); };

    return (
        <AdminLayout title="Pay supplier">
            <Head title="Pay supplier" />
            <form onSubmit={submit} className="bg-white border border-ink-200 rounded-lg p-6 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Supplier" error={errors.supplier_id}>
                        <select value={data.supplier_id} onChange={(e) => setData('supplier_id', e.target.value ? Number(e.target.value) : '')} className="input">
                            <option value="">— Select —</option>
                            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Date" error={errors.payment_date}>
                        <input type="date" value={data.payment_date} onChange={(e) => setData('payment_date', e.target.value)} className="input" />
                    </Field>
                </div>

                {supplier && (
                    <div className="mt-3 bg-ink-50 rounded p-3 text-sm">
                        <span className="text-ink-500">Currently owed: </span>
                        <span className={`money font-medium ${parseFloat(supplier.current_balance) > 0 ? 'text-danger' : 'text-ink-700'}`}>{supplier.current_balance}</span>
                    </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-4">
                    <Field label="Amount" error={errors.amount}>
                        <input type="number" step="0.01" min={0} value={data.amount} onChange={(e) => setData('amount', e.target.value)} className="input money text-right" autoFocus />
                    </Field>
                    <Field label="Method" error={errors.method}>
                        <select value={data.method} onChange={(e) => setData('method', e.target.value as typeof data.method)} className="input">
                            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </Field>
                </div>

                {data.method === 'check' && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        <Field label="Check number" error={errors.check_number}>
                            <input type="text" value={data.check_number} onChange={(e) => setData('check_number', e.target.value)} className="input-mono input" />
                        </Field>
                        <Field label="Bank" error={errors.bank_name}>
                            <input type="text" value={data.bank_name} onChange={(e) => setData('bank_name', e.target.value)} className="input" />
                        </Field>
                        <Field label="Check date" error={errors.check_date}>
                            <input type="date" value={data.check_date} onChange={(e) => setData('check_date', e.target.value)} className="input" />
                        </Field>
                    </div>
                )}
                {(data.method === 'card' || data.method === 'bank') && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <Field label="Reference / Tx ID" error={errors.reference}>
                            <input type="text" value={data.reference} onChange={(e) => setData('reference', e.target.value)} className="input" />
                        </Field>
                        {data.method === 'bank' && (
                            <Field label="Bank" error={errors.bank_name}>
                                <input type="text" value={data.bank_name} onChange={(e) => setData('bank_name', e.target.value)} className="input" />
                            </Field>
                        )}
                    </div>
                )}

                <div className="mt-4">
                    <Field label="Notes" error={errors.notes}>
                        <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={2} className="input h-auto py-2" />
                    </Field>
                </div>

                <p className="text-xs text-ink-500 mt-4">Auto-allocates to the supplier's oldest unpaid POs first.</p>

                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-ink-200">
                    <button type="submit" disabled={processing} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
                        Record payment
                    </button>
                    <Link href={route('admin.supplier_payments.index')} className="text-ink-600 hover:text-ink-900 px-3 py-2 text-sm">Cancel</Link>
                </div>
            </form>
        </AdminLayout>
    );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
    return (
        <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">{label}</label>
            {children}
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
}
