import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

interface SupplierOpt { id: number; code: string; name: string; current_balance: string }
interface LocationOpt { id: number; code: string; name: string; is_default: boolean }
interface ProductOpt { id: number; sku: string; name: string; unit: string; cost_price: string }
interface LineItem { product_id: number; product_name: string; product_sku: string; unit: string; unit_cost: number; ordered_qty: number }

export default function PurchasesCreate({ suppliers, locations, products }: { suppliers: SupplierOpt[]; locations: LocationOpt[]; products: ProductOpt[] }) {
    const today = new Date().toISOString().slice(0, 10);
    const { data, setData, post, processing, errors } = useForm({
        supplier_id: '' as number | '',
        location_id: locations.find((l) => l.is_default)?.id ?? locations[0]?.id ?? 0,
        po_date: today,
        expected_date: '',
        freight: 0,
        other_charges: 0,
        notes: '',
        items: [] as LineItem[],
    });
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return products.slice(0, 20);
        return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 20);
    }, [search, products]);

    const add = (p: ProductOpt) => {
        const idx = data.items.findIndex((l) => l.product_id === p.id);
        if (idx >= 0) {
            setData('items', data.items.map((l, i) => i === idx ? { ...l, ordered_qty: l.ordered_qty + 1 } : l));
            return;
        }
        setData('items', [...data.items, {
            product_id: p.id, product_name: p.name, product_sku: p.sku, unit: p.unit,
            unit_cost: parseFloat(p.cost_price), ordered_qty: 1,
        }]);
    };

    const updateLine = (idx: number, key: 'unit_cost' | 'ordered_qty', value: number) =>
        setData('items', data.items.map((l, i) => i === idx ? { ...l, [key]: value } : l));
    const removeLine = (idx: number) => setData('items', data.items.filter((_, i) => i !== idx));

    const subtotal = data.items.reduce((s, l) => s + l.unit_cost * l.ordered_qty, 0);
    const total = subtotal + (Number(data.freight) || 0) + (Number(data.other_charges) || 0);
    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const submit = (e: FormEvent) => { e.preventDefault(); post(route('admin.purchases.store')); };

    return (
        <AdminLayout title="New purchase order">
            <Head title="New PO" />
            <form onSubmit={submit} className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                    <Section title="Supplier & dates">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-2">
                                <Field label="Supplier" error={errors.supplier_id}>
                                    <select value={data.supplier_id} onChange={(e) => setData('supplier_id', e.target.value ? Number(e.target.value) : '')} className="input">
                                        <option value="">— Select —</option>
                                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
                                    </select>
                                </Field>
                            </div>
                            <Field label="Location" error={errors.location_id}>
                                <select value={data.location_id} onChange={(e) => setData('location_id', Number(e.target.value))} className="input">
                                    {locations.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
                                </select>
                            </Field>
                            <Field label="PO date" error={errors.po_date}>
                                <input type="date" value={data.po_date} onChange={(e) => setData('po_date', e.target.value)} className="input" />
                            </Field>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <Field label="Expected delivery" error={errors.expected_date}>
                                <input type="date" value={data.expected_date} onChange={(e) => setData('expected_date', e.target.value)} className="input" />
                            </Field>
                            <Field label="Notes" error={errors.notes}>
                                <input type="text" value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="input" />
                            </Field>
                        </div>
                    </Section>

                    <Section title="Add products">
                        <input type="text" placeholder="Search by name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} className="input mb-3" />
                        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-auto pr-1">
                            {filtered.length === 0 && <p className="text-sm text-ink-500 col-span-2 py-4 text-center">No products match.</p>}
                            {filtered.map((p) => (
                                <button key={p.id} type="button" onClick={() => add(p)} className="text-left bg-white border border-ink-200 rounded p-2 hover:border-primary-500 hover:bg-primary-50">
                                    <div className="text-sm text-ink-900 truncate">{p.name}</div>
                                    <div className="text-xs text-ink-500 flex items-center justify-between mt-0.5">
                                        <span className="ref">{p.sku}</span>
                                        <span className="money">last cost {p.cost_price}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Section>

                    <Section title={`Order items (${data.items.length})`}>
                        {data.items.length === 0 ? (
                            <p className="text-sm text-ink-500 py-4 text-center">Pick a product to start.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="text-ink-500 text-xs">
                                    <tr className="border-b border-ink-200">
                                        <th className="text-left font-medium pb-2">Item</th>
                                        <th className="text-right font-medium pb-2 w-28">Unit cost</th>
                                        <th className="text-right font-medium pb-2 w-24">Qty</th>
                                        <th className="text-right font-medium pb-2 w-28">Total</th>
                                        <th className="w-8"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map((l, idx) => (
                                        <tr key={l.product_id} className="border-b border-ink-100">
                                            <td className="py-2">
                                                <div className="text-ink-900">{l.product_name}</div>
                                                <div className="text-xs text-ink-500 ref">{l.product_sku}</div>
                                            </td>
                                            <td><input type="number" step="0.01" value={l.unit_cost} onChange={(e) => updateLine(idx, 'unit_cost', Number(e.target.value))} className="input money text-right h-8" /></td>
                                            <td><input type="number" min={1} value={l.ordered_qty} onChange={(e) => updateLine(idx, 'ordered_qty', Number(e.target.value))} className="input money text-right h-8" /></td>
                                            <td className="text-right money font-medium pl-2">{fmt(l.unit_cost * l.ordered_qty)}</td>
                                            <td className="text-center"><button type="button" onClick={() => removeLine(idx)} className="text-ink-400 hover:text-danger">×</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Section>
                </div>

                <div className="space-y-4">
                    <Section title="Totals">
                        <table className="w-full text-sm">
                            <tbody>
                                <tr><td className="text-ink-500 py-1">Subtotal</td><td className="text-right money py-1">{fmt(subtotal)}</td></tr>
                                <tr>
                                    <td className="text-ink-500 py-1">Freight</td>
                                    <td className="py-1"><input type="number" step="0.01" value={data.freight} onChange={(e) => setData('freight', Number(e.target.value))} className="input money text-right h-8 w-full" /></td>
                                </tr>
                                <tr>
                                    <td className="text-ink-500 py-1">Other charges</td>
                                    <td className="py-1"><input type="number" step="0.01" value={data.other_charges} onChange={(e) => setData('other_charges', Number(e.target.value))} className="input money text-right h-8 w-full" /></td>
                                </tr>
                                <tr className="border-t border-ink-200">
                                    <td className="text-ink-900 font-medium pt-2">Grand total</td>
                                    <td className="text-right money font-medium pt-2 text-base">{fmt(total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </Section>

                    <button type="submit" disabled={processing || data.items.length === 0 || !data.supplier_id} className="w-full bg-primary-700 hover:bg-primary-800 text-white px-4 py-3 rounded text-sm font-medium disabled:opacity-50">
                        {processing ? 'Saving…' : `Create PO — ${fmt(total)}`}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-ink-200 rounded-lg">
            <div className="px-4 py-2.5 border-b border-ink-200"><h2 className="text-sm font-medium text-ink-900">{title}</h2></div>
            <div className="p-4">{children}</div>
        </div>
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
