import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface CustomerOpt { id: number; code: string; name: string }
interface LocationOpt { id: number; code: string; name: string; is_default: boolean }
interface BillData {
    id: number; invoice_number: string; customer_id: number; location_id: number;
    items: { product_id: number; product_name: string; product_sku: string; unit_price: string; max_qty: number }[];
}
interface LineItem {
    product_id: number; product_name: string; product_sku: string;
    unit_price: number; quantity: number; max_qty: number;
}

export default function ReturnsCreate({ customers, locations, bill }: { customers: CustomerOpt[]; locations: LocationOpt[]; bill: BillData | null }) {
    const today = new Date().toISOString().slice(0, 10);
    const initialItems: LineItem[] = bill
        ? bill.items.map((i) => ({
              product_id: i.product_id,
              product_name: i.product_name,
              product_sku: i.product_sku,
              unit_price: parseFloat(i.unit_price),
              quantity: 0,
              max_qty: i.max_qty,
          }))
        : [];

    const { data, setData, post, processing, errors } = useForm({
        customer_id: (bill?.customer_id ?? '') as number | '',
        location_id: bill?.location_id ?? locations.find((l) => l.is_default)?.id ?? locations[0]?.id ?? 0,
        bill_id: (bill?.id ?? '') as number | '',
        return_date: today,
        reason: '',
        items: initialItems,
    });

    const [showAll, setShowAll] = useState(true);

    const setQty = (idx: number, qty: number) => {
        const max = data.items[idx].max_qty || Infinity;
        setData('items', data.items.map((it, i) => (i === idx ? { ...it, quantity: Math.max(0, Math.min(qty, max)) } : it)));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const filtered = data.items.filter((i) => i.quantity > 0);
        setData('items', filtered);
        setTimeout(() => post(route('admin.returns.store')), 0);
    };

    const total = data.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <AdminLayout title={bill ? `Return for ${bill.invoice_number}` : 'New return'}>
            <Head title="New return" />

            <form onSubmit={submit} className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                    {bill && (
                        <div className="bg-primary-50 text-primary-800 rounded p-3 text-sm">
                            Returning against bill <span className="ref">{bill.invoice_number}</span>. Quantities are capped at originally billed amounts.
                        </div>
                    )}
                    <div className="bg-white border border-ink-200 rounded-lg p-5">
                        <div className="grid grid-cols-3 gap-4">
                            <Field label="Customer" error={errors.customer_id}>
                                <select
                                    value={data.customer_id}
                                    onChange={(e) => setData('customer_id', e.target.value ? Number(e.target.value) : '')}
                                    className="input"
                                    disabled={!!bill}
                                >
                                    <option value="">— Select —</option>
                                    {customers.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Location" error={errors.location_id}>
                                <select value={data.location_id} onChange={(e) => setData('location_id', Number(e.target.value))} className="input">
                                    {locations.map((l) => <option key={l.id} value={l.id}>{l.code} · {l.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Date" error={errors.return_date}>
                                <input type="date" value={data.return_date} onChange={(e) => setData('return_date', e.target.value)} className="input" />
                            </Field>
                        </div>
                        <div className="mt-4">
                            <Field label="Reason" error={errors.reason}>
                                <input type="text" value={data.reason} onChange={(e) => setData('reason', e.target.value)} className="input" placeholder="Optional" />
                            </Field>
                        </div>
                    </div>

                    <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-ink-200 flex items-center justify-between">
                            <h2 className="text-sm font-medium text-ink-900">Items to return</h2>
                            {bill && (
                                <label className="text-xs text-ink-500 flex items-center gap-2">
                                    <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
                                    Show all items
                                </label>
                            )}
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-ink-50 text-ink-500 text-xs">
                                <tr>
                                    <th className="text-left font-medium px-3 py-2">Item</th>
                                    <th className="text-right font-medium px-3 py-2 w-24">Unit price</th>
                                    <th className="text-right font-medium px-3 py-2 w-28">Return qty</th>
                                    <th className="text-right font-medium px-3 py-2 w-28">Line total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.length === 0 && (
                                    <tr><td colSpan={4} className="px-3 py-8 text-center text-ink-500">No items.</td></tr>
                                )}
                                {data.items.map((it, idx) => {
                                    if (!showAll && it.quantity === 0) return null;
                                    return (
                                        <tr key={idx} className="border-t border-ink-200">
                                            <td className="px-3 py-2">
                                                <div className="text-ink-900">{it.product_name}</div>
                                                <div className="text-xs text-ink-500 ref">{it.product_sku} · max {it.max_qty}</div>
                                            </td>
                                            <td className="px-3 py-2 text-right money text-ink-700">{it.unit_price.toFixed(2)}</td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={it.max_qty}
                                                    value={it.quantity}
                                                    onChange={(e) => setQty(idx, Number(e.target.value))}
                                                    className="input money text-right h-8 w-full"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-right money font-medium text-ink-900">{fmt(it.unit_price * it.quantity)}</td>
                                        </tr>
                                    );
                                })}
                                <tr className="border-t-2 border-ink-300 bg-ink-50">
                                    <td colSpan={3} className="px-3 py-3 text-right text-ink-900 font-medium">Return total</td>
                                    <td className="px-3 py-3 text-right money font-medium money-pos">{fmt(total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <div className="bg-white border border-ink-200 rounded-lg p-4">
                        <p className="text-sm text-ink-500 mb-4">
                            Stock will be returned to the selected location. Customer's ledger will be credited by the return total.
                        </p>
                        <button
                            type="submit"
                            disabled={processing || total <= 0 || !data.customer_id}
                            className="w-full bg-primary-700 hover:bg-primary-800 text-white px-4 py-3 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Saving…' : `Record return — ${fmt(total)}`}
                        </button>
                        <Link href={route('admin.returns.index')} className="block text-center text-ink-600 hover:text-ink-900 px-3 py-2 text-sm mt-2">
                            Cancel
                        </Link>
                    </div>
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
