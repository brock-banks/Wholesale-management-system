import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Location, Paginated } from '@/types';

interface ProductOpt {
    id: number;
    sku: string;
    name: string;
}

interface Movement {
    id: number;
    type: string;
    quantity: number;
    notes: string | null;
    created_at: string;
    product?: { id: number; sku: string; name: string };
    location?: { id: number; code: string; name: string };
    user?: { id: number; name: string } | null;
}

interface Props {
    movements: Paginated<Movement>;
    products: ProductOpt[];
    locations: Location[];
    filters: { product: string | null; type: string | null };
}

const TYPE_LABEL: Record<string, string> = {
    stock_in: 'Stock in',
    sale: 'Sale',
    return: 'Return',
    adjustment: 'Adjustment',
    reservation: 'Reserved',
    release: 'Released',
    transfer_out: 'Transfer out',
    transfer_in: 'Transfer in',
};

const TYPE_BADGE: Record<string, string> = {
    stock_in: 'badge-paid',
    sale: 'badge-cancelled',
    return: 'badge-partial',
    adjustment: 'badge-on-hold',
    transfer_out: 'badge-reviewing',
    transfer_in: 'badge-confirmed',
};

type Tab = 'in' | 'transfer' | 'adjust';

export default function StockIndex({ movements, products, locations, filters }: Props) {
    const [tab, setTab] = useState<Tab>('in');

    return (
        <AdminLayout title="Stock operations">
            <Head title="Stock" />

            <div className="bg-white border border-ink-200 rounded-lg p-6 mb-6">
                <div className="flex gap-1 border-b border-ink-200 mb-5">
                    <TabBtn active={tab === 'in'} onClick={() => setTab('in')}>Stock in</TabBtn>
                    <TabBtn active={tab === 'transfer'} onClick={() => setTab('transfer')}>Transfer</TabBtn>
                    <TabBtn active={tab === 'adjust'} onClick={() => setTab('adjust')}>Adjustment</TabBtn>
                </div>

                {tab === 'in' && <StockInForm products={products} locations={locations} />}
                {tab === 'transfer' && <TransferForm products={products} locations={locations} />}
                {tab === 'adjust' && <AdjustForm products={products} locations={locations} />}
            </div>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <div className="p-4 flex gap-3 border-b border-ink-200">
                    <input
                        type="text"
                        placeholder="Filter by product…"
                        defaultValue={filters.product ?? ''}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                router.get(route('admin.stock.index'), { product: (e.target as HTMLInputElement).value, type: filters.type || undefined }, { preserveState: true });
                            }
                        }}
                        className="input flex-1"
                    />
                    <select
                        value={filters.type ?? ''}
                        onChange={(e) =>
                            router.get(route('admin.stock.index'), { product: filters.product || undefined, type: e.target.value || undefined }, { preserveState: true })
                        }
                        className="input w-48"
                    >
                        <option value="">All types</option>
                        {Object.entries(TYPE_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">When</th>
                            <th className="text-left font-medium px-4 py-3">Product</th>
                            <th className="text-left font-medium px-4 py-3">Location</th>
                            <th className="text-center font-medium px-4 py-3">Type</th>
                            <th className="text-right font-medium px-4 py-3">Qty</th>
                            <th className="text-left font-medium px-4 py-3">Notes</th>
                            <th className="text-left font-medium px-4 py-3">By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movements.data.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-500">No movements yet.</td></tr>
                        )}
                        {movements.data.map((m) => (
                            <tr key={m.id} className="border-t border-ink-200">
                                <td className="px-4 py-2 text-ink-600 mono text-xs">{m.created_at}</td>
                                <td className="px-4 py-2">
                                    <div className="text-ink-900">{m.product?.name}</div>
                                    <div className="ref text-xs">{m.product?.sku}</div>
                                </td>
                                <td className="px-4 py-2">
                                    <div className="text-ink-700">{m.location?.name}</div>
                                    <div className="ref text-xs">{m.location?.code}</div>
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <span className={`badge ${TYPE_BADGE[m.type] ?? 'badge-draft'}`}>{TYPE_LABEL[m.type] ?? m.type}</span>
                                </td>
                                <td className={`px-4 py-2 text-right money font-medium ${m.quantity < 0 ? 'text-danger' : 'text-success'}`}>
                                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                                </td>
                                <td className="px-4 py-2 text-ink-600 text-xs">{m.notes ?? '—'}</td>
                                <td className="px-4 py-2 text-ink-600 text-xs">{m.user?.name ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {movements.last_page > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-ink-500">
                    <div>Showing {movements.from}–{movements.to} of {movements.total}</div>
                    <div className="flex gap-1">
                        {movements.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? ''}
                                className={`px-3 py-1.5 rounded ${
                                    link.active ? 'bg-primary-700 text-white' : link.url ? 'border border-ink-200 hover:bg-ink-50' : 'text-ink-400'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                active ? 'border-primary-700 text-primary-800' : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}
        >
            {children}
        </button>
    );
}

function StockInForm({ products, locations }: { products: ProductOpt[]; locations: Location[] }) {
    const defaultLoc = String(locations.find((l) => l.is_default)?.id ?? locations[0]?.id ?? '');
    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: '',
        location_id: defaultLoc,
        quantity: '',
        notes: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.stock.in'), { preserveScroll: true, onSuccess: () => reset('quantity', 'notes') });
    };

    return (
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <Field label="Product" error={errors.product_id}>
                <ProductSelect products={products} value={data.product_id} onChange={(v) => setData('product_id', v)} />
            </Field>
            <Field label="Location" error={errors.location_id}>
                <select value={data.location_id} onChange={(e) => setData('location_id', e.target.value)} className="input">
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.code} · {l.name}</option>)}
                </select>
            </Field>
            <Field label="Quantity" error={errors.quantity}>
                <input type="number" min="1" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} className="input money text-right" />
            </Field>
            <Field label="Notes" error={errors.notes}>
                <input value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Supplier ref, batch, etc." className="input" />
            </Field>
            <div className="col-span-2">
                <button type="submit" disabled={processing} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
                    Record stock-in
                </button>
            </div>
        </form>
    );
}

function TransferForm({ products, locations }: { products: ProductOpt[]; locations: Location[] }) {
    const defaultFrom = String(locations.find((l) => l.is_default)?.id ?? locations[0]?.id ?? '');
    const defaultTo = String(locations[1]?.id ?? locations[0]?.id ?? '');
    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: '',
        from_location_id: defaultFrom,
        to_location_id: defaultTo,
        quantity: '',
        notes: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.stock.transfer'), { preserveScroll: true, onSuccess: () => reset('quantity', 'notes') });
    };

    return (
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <Field label="Product" error={errors.product_id}>
                <ProductSelect products={products} value={data.product_id} onChange={(v) => setData('product_id', v)} />
            </Field>
            <Field label="Quantity" error={errors.quantity}>
                <input type="number" min="1" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} className="input money text-right" />
            </Field>
            <Field label="From location" error={errors.from_location_id}>
                <select value={data.from_location_id} onChange={(e) => setData('from_location_id', e.target.value)} className="input">
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.code} · {l.name}</option>)}
                </select>
            </Field>
            <Field label="To location" error={errors.to_location_id}>
                <select value={data.to_location_id} onChange={(e) => setData('to_location_id', e.target.value)} className="input">
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.code} · {l.name}</option>)}
                </select>
            </Field>
            <Field label="Notes" error={errors.notes}>
                <input value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Reason / vehicle / driver" className="input" />
            </Field>
            <div className="col-span-2">
                <button type="submit" disabled={processing} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
                    Record transfer
                </button>
            </div>
        </form>
    );
}

function AdjustForm({ products, locations }: { products: ProductOpt[]; locations: Location[] }) {
    const defaultLoc = String(locations.find((l) => l.is_default)?.id ?? locations[0]?.id ?? '');
    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: '',
        location_id: defaultLoc,
        quantity: '',
        reason: 'count_correction',
        notes: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.stock.adjust'), { preserveScroll: true, onSuccess: () => reset('quantity', 'notes') });
    };

    return (
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <Field label="Product" error={errors.product_id}>
                <ProductSelect products={products} value={data.product_id} onChange={(v) => setData('product_id', v)} />
            </Field>
            <Field label="Location" error={errors.location_id}>
                <select value={data.location_id} onChange={(e) => setData('location_id', e.target.value)} className="input">
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.code} · {l.name}</option>)}
                </select>
            </Field>
            <Field label="Quantity change" error={errors.quantity} helper="Use a negative number to reduce stock">
                <input type="number" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} className="input money text-right" />
            </Field>
            <Field label="Reason" error={errors.reason}>
                <select value={data.reason} onChange={(e) => setData('reason', e.target.value)} className="input">
                    <option value="count_correction">Count correction</option>
                    <option value="damaged">Damaged</option>
                    <option value="loss">Loss / theft</option>
                    <option value="other">Other</option>
                </select>
            </Field>
            <div className="col-span-2">
                <Field label="Notes" error={errors.notes}>
                    <input value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="input" />
                </Field>
            </div>
            <div className="col-span-2">
                <button type="submit" disabled={processing} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
                    Record adjustment
                </button>
            </div>
        </form>
    );
}

function ProductSelect({ products, value, onChange }: { products: ProductOpt[]; value: string | number; onChange: (v: string) => void }) {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
            <option value="">— Select product —</option>
            {products.map((p) => (
                <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>
            ))}
        </select>
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
