import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface CartItem {
    id: number;
    product_id: number;
    product_name: string;
    product_sku: string;
    unit_price: string;
    requested_qty: number;
}
interface CartData {
    id: number;
    order_number: string;
    customer_notes: string | null;
    items: CartItem[];
}

export default function Cart({ cart }: { cart: CartData | null }) {
    const items = cart?.items ?? [];
    const subtotal = items.reduce((s, i) => s + parseFloat(i.unit_price) * i.requested_qty, 0);

    const { data, setData, post, processing } = useForm({ customer_notes: cart?.customer_notes ?? '' });

    const updateQty = (item: CartItem, qty: number) => {
        if (qty < 0) qty = 0;
        if (qty === 0) {
            router.delete(route('portal.cart.remove', item.id), { preserveScroll: true });
        } else {
            router.patch(route('portal.cart.update', item.id), { quantity: qty }, { preserveScroll: true });
        }
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('portal.cart.submit'));
    };

    const fmt = (n: number) =>
        n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (!cart || items.length === 0) {
        return (
            <CustomerLayout title="Cart">
                <Head title="Cart" />
                <div className="bg-white border border-ink-200 rounded-lg p-12 text-center">
                    <p className="text-ink-500 mb-3">Your cart is empty.</p>
                    <Link
                        href={route('portal.catalog')}
                        className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium inline-block"
                    >
                        Browse catalog
                    </Link>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout title="Cart">
            <Head title="Cart" />

            <form onSubmit={submit} className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-white border border-ink-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-ink-50 text-ink-500 text-xs">
                            <tr>
                                <th className="text-left font-medium px-4 py-3">Item</th>
                                <th className="text-right font-medium px-4 py-3 w-24">Unit price</th>
                                <th className="text-right font-medium px-4 py-3 w-32">Quantity</th>
                                <th className="text-right font-medium px-4 py-3 w-28">Total</th>
                                <th className="w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr key={it.id} className="border-t border-ink-200">
                                    <td className="px-4 py-3">
                                        <div className="text-ink-900">{it.product_name}</div>
                                        <div className="text-xs text-ink-500 ref">{it.product_sku}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right money text-ink-700">{it.unit_price}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => updateQty(it, it.requested_qty - 1)}
                                                className="w-7 h-7 rounded border border-ink-200 hover:bg-ink-50 text-ink-600"
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                min={0}
                                                value={it.requested_qty}
                                                onChange={(e) => updateQty(it, Number(e.target.value))}
                                                className="input money text-right w-14 h-7 text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => updateQty(it, it.requested_qty + 1)}
                                                className="w-7 h-7 rounded border border-ink-200 hover:bg-ink-50 text-ink-600"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right money font-medium text-ink-900">
                                        {fmt(parseFloat(it.unit_price) * it.requested_qty)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => updateQty(it, 0)}
                                            className="text-ink-400 hover:text-danger"
                                            title="Remove"
                                        >
                                            ×
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-4">
                    <div className="bg-white border border-ink-200 rounded-lg p-4">
                        <h2 className="text-md font-medium text-ink-900 mb-3">Estimate</h2>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="text-ink-500 py-1">Items</td>
                                    <td className="text-right py-1 money">{items.length}</td>
                                </tr>
                                <tr className="border-t border-ink-200">
                                    <td className="text-ink-900 font-medium pt-2">Estimated total</td>
                                    <td className="text-right money font-medium pt-2 text-base">{fmt(subtotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="text-xs text-ink-500 mt-3">
                            Admin will review your order and confirm available items before billing.
                        </p>
                    </div>

                    <div className="bg-white border border-ink-200 rounded-lg p-4">
                        <h2 className="text-md font-medium text-ink-900 mb-3">Notes for admin</h2>
                        <textarea
                            value={data.customer_notes}
                            onChange={(e) => setData('customer_notes', e.target.value)}
                            rows={3}
                            placeholder="Optional"
                            className="input h-auto py-2 w-full"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-primary-700 hover:bg-primary-800 text-white px-4 py-3 rounded text-sm font-medium disabled:opacity-50"
                    >
                        {processing ? 'Submitting…' : 'Submit order'}
                    </button>
                </div>
            </form>
        </CustomerLayout>
    );
}
