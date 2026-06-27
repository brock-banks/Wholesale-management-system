import RepLayout from '@/Layouts/RepLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import { useMoney } from '@/hooks/useMoney';

interface CustomerOpt {
    id: number;
    code: string;
    name: string;
    phone: string | null;
    current_balance: string;
    credit_limit: string;
}

interface ProductOpt {
    id: number;
    sku: string;
    name: string;
    unit: string;
    pack_size: number;
    wholesale_price: string;
}

interface LineItem {
    product_id: number;
    product_name: string;
    product_sku: string;
    unit: string;
    unit_price: number;
    quantity: number;
}

interface Props {
    customers: CustomerOpt[];
    products: ProductOpt[];
    selected_customer_id: number | null;
}

export default function RepOrderCreate({ customers, products, selected_customer_id }: Props) {
    const { format: fmt, currency } = useMoney();
    const [search, setSearch] = useState('');

    const { data, setData, post, processing, errors } = useForm<{
        customer_id: number | '';
        notes: string;
        items: LineItem[];
    }>({
        customer_id: selected_customer_id ?? '',
        notes: '',
        items: [],
    });

    const customer = customers.find((c) => c.id === data.customer_id) || null;

    const filtered = useMemo(() => {
        if (!search.trim()) return products.slice(0, 50);
        const q = search.toLowerCase();
        return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 50);
    }, [search, products]);

    const addProduct = (p: ProductOpt) => {
        const existing = data.items.find((i) => i.product_id === p.id);
        if (existing) {
            setData(
                'items',
                data.items.map((i) => (i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i)),
            );
        } else {
            setData('items', [
                ...data.items,
                {
                    product_id: p.id,
                    product_name: p.name,
                    product_sku: p.sku,
                    unit: p.unit,
                    unit_price: parseFloat(p.wholesale_price),
                    quantity: 1,
                },
            ]);
        }
    };

    const setQty = (productId: number, qty: number) => {
        if (qty <= 0) {
            setData('items', data.items.filter((i) => i.product_id !== productId));
            return;
        }
        setData('items', data.items.map((i) => (i.product_id === productId ? { ...i, quantity: qty } : i)));
    };

    const setPrice = (productId: number, price: number) => {
        setData('items', data.items.map((i) => (i.product_id === productId ? { ...i, unit_price: price } : i)));
    };

    const total = data.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('rep.orders.store'));
    };

    return (
        <RepLayout title="New order">
            <Head title="New order" />

            <form onSubmit={submit}>
                <div className="bg-white border border-ink-200 rounded-lg p-3 mb-3">
                    <label className="block text-xs font-medium text-ink-700 mb-1">Customer</label>
                    <select
                        value={data.customer_id}
                        onChange={(e) => setData('customer_id', e.target.value ? Number(e.target.value) : '')}
                        className="input w-full"
                    >
                        <option value="">— Select customer —</option>
                        {customers.map((c) => (
                            <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
                        ))}
                    </select>
                    {errors.customer_id && <p className="text-xs text-danger mt-1">{errors.customer_id}</p>}
                    {customer && (
                        <div className="mt-2 pt-2 border-t border-ink-100 text-xs text-ink-600">
                            <span>Balance: <span className="money">{fmt(customer.current_balance)}</span></span>
                            {parseFloat(customer.credit_limit) > 0 && (
                                <span className="ml-3">Credit limit: <span className="money">{fmt(customer.credit_limit)}</span></span>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white border border-ink-200 rounded-lg p-3 mb-3">
                    <label className="block text-xs font-medium text-ink-700 mb-1">Add products</label>
                    <input
                        type="search"
                        placeholder="Search products by name or SKU…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input w-full"
                    />
                    {search.trim() && (
                        <div className="mt-2 max-h-64 overflow-y-auto border border-ink-100 rounded">
                            {filtered.length === 0 ? (
                                <p className="text-xs text-ink-500 text-center py-3">No matches.</p>
                            ) : (
                                filtered.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => { addProduct(p); setSearch(''); }}
                                        className="flex items-center justify-between w-full text-left px-3 py-2 hover:bg-ink-50 border-b border-ink-100 last:border-b-0"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-ink-900 truncate">{p.name}</p>
                                            <p className="ref text-xs">{p.sku}</p>
                                        </div>
                                        <p className="text-sm money text-ink-700 ml-2">{fmt(p.wholesale_price, { withCurrency: false })}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white border border-ink-200 rounded-lg p-3 mb-3">
                    <h2 className="text-sm font-medium text-ink-900 mb-2">Cart ({data.items.length})</h2>
                    {data.items.length === 0 ? (
                        <p className="text-xs text-ink-500 text-center py-6">Search above to add products.</p>
                    ) : (
                        <div className="space-y-2">
                            {data.items.map((i) => (
                                <div key={i.product_id} className="bg-ink-50 rounded p-2">
                                    <div className="flex items-start justify-between mb-1.5">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-ink-900 truncate">{i.product_name}</p>
                                            <p className="ref text-xs">{i.product_sku}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setQty(i.product_id, 0)}
                                            className="text-danger text-xs ml-2"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <label className="text-xs text-ink-600">
                                            Qty
                                            <input
                                                type="number"
                                                min={1}
                                                value={i.quantity}
                                                onChange={(e) => setQty(i.product_id, parseInt(e.target.value) || 0)}
                                                className="input money text-right w-full mt-0.5"
                                            />
                                        </label>
                                        <label className="text-xs text-ink-600">
                                            Unit price
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={i.unit_price}
                                                onChange={(e) => setPrice(i.product_id, parseFloat(e.target.value) || 0)}
                                                className="input money text-right w-full mt-0.5"
                                            />
                                        </label>
                                        <div className="text-xs text-ink-600">
                                            Line total
                                            <p className="money text-right mt-0.5 text-sm font-medium text-ink-900 py-1.5">{fmt(i.unit_price * i.quantity, { withCurrency: false })}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex items-center justify-between pt-2 border-t border-ink-100 mt-2">
                                <p className="text-sm font-medium text-ink-900">Total</p>
                                <p className="money text-lg font-medium text-ink-900">{currency} {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white border border-ink-200 rounded-lg p-3 mb-3">
                    <label className="block text-xs font-medium text-ink-700 mb-1">Notes (optional)</label>
                    <textarea
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        rows={2}
                        placeholder="Delivery instructions, customer comments, etc."
                        className="input w-full"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing || data.items.length === 0 || !data.customer_id}
                    className="w-full bg-primary-700 hover:bg-primary-800 text-white px-4 py-3 rounded text-sm font-medium disabled:opacity-50"
                >
                    Submit order
                </button>
            </form>
        </RepLayout>
    );
}
