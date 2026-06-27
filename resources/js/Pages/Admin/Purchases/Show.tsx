import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import { GoodsReceipt, PurchaseOrder } from '@/types';

const STATUS_BADGE: Record<string, string> = {
    pending: 'badge-pending', partial: 'badge-partial', received: 'badge-paid', cancelled: 'badge-cancelled',
};
const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending', partial: 'Partial', received: 'Received', cancelled: 'Cancelled',
};

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PurchaseShow({ po }: { po: PurchaseOrder }) {
    const items = po.items ?? [];
    const receipts = (po.receipts ?? []) as GoodsReceipt[];
    const due = parseFloat(po.total) - parseFloat(po.paid_amount);
    const [receiveMode, setReceiveMode] = useState(false);

    const initialReceive = useMemo(() =>
        items.reduce((acc, it) => ({
            ...acc,
            [it.id]: { received_qty: Math.max(0, it.ordered_qty - it.received_qty), unit_cost: parseFloat(it.unit_cost) },
        }), {} as Record<number, { received_qty: number; unit_cost: number }>),
        [items]
    );

    const { data, setData, post, processing } = useForm({
        receipt_date: new Date().toISOString().slice(0, 10),
        notes: '',
        items: Object.entries(initialReceive).map(([id, v]) => ({ po_item_id: Number(id), received_qty: v.received_qty, unit_cost: v.unit_cost })),
    });

    const updateReceive = (poItemId: number, key: 'received_qty' | 'unit_cost', value: number) => {
        setData('items', data.items.map((r) => r.po_item_id === poItemId ? { ...r, [key]: value } : r));
    };

    const submitReceive = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.purchases.receive', po.id));
    };

    const canReceive = po.status === 'pending' || po.status === 'partial';

    return (
        <AdminLayout
            title={po.po_number}
            actions={
                <div className="flex gap-2">
                    <a href={route('admin.purchases.pdf', po.id)} target="_blank" className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">PDF</a>
                    {due > 0 && (
                        <Link href={`${route('admin.supplier_payments.create')}?supplier_id=${po.supplier_id}`} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">
                            Pay supplier
                        </Link>
                    )}
                    {canReceive && !receiveMode && (
                        <button onClick={() => setReceiveMode(true)} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium">
                            Receive goods
                        </button>
                    )}
                </div>
            }
        >
            <Head title={po.po_number} />

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                    <div className="bg-white border border-ink-200 rounded-lg p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-xl font-medium text-ink-900">{po.po_number}</p>
                                <p className="text-sm text-ink-500 mt-1 money">{po.po_date} · {po.location?.name}</p>
                            </div>
                            <span className={`badge ${STATUS_BADGE[po.status]}`}>{STATUS_LABEL[po.status]}</span>
                        </div>
                        <div className="border-t border-ink-200 pt-3 text-sm">
                            <p className="text-ink-500 mb-1">Supplier</p>
                            <p className="text-ink-900">
                                <span className="ref text-ink-500 mr-1">{po.supplier?.code}</span>{po.supplier?.name}
                            </p>
                        </div>
                        {po.notes && <div className="border-t border-ink-200 mt-3 pt-3 text-sm"><p className="text-ink-500 mb-1">Notes</p><p className="text-ink-700">{po.notes}</p></div>}
                    </div>

                    <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-ink-200">
                            <h2 className="text-sm font-medium text-ink-900">Order items</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-ink-50 text-ink-500 text-xs">
                                <tr>
                                    <th className="text-left font-medium px-3 py-2">Item</th>
                                    <th className="text-right font-medium px-3 py-2">Unit cost</th>
                                    <th className="text-right font-medium px-3 py-2">Ordered</th>
                                    <th className="text-right font-medium px-3 py-2">Received</th>
                                    <th className="text-right font-medium px-3 py-2">Line total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it) => (
                                    <tr key={it.id} className="border-t border-ink-200">
                                        <td className="px-3 py-2">
                                            <div className="text-ink-900">{it.product_name}</div>
                                            <div className="text-xs text-ink-500 ref">{it.product_sku}</div>
                                        </td>
                                        <td className="px-3 py-2 text-right money text-ink-700">{it.unit_cost}</td>
                                        <td className="px-3 py-2 text-right money text-ink-900">{it.ordered_qty}</td>
                                        <td className={`px-3 py-2 text-right money ${it.received_qty >= it.ordered_qty ? 'text-success' : 'text-warning'}`}>
                                            {it.received_qty} / {it.ordered_qty}
                                        </td>
                                        <td className="px-3 py-2 text-right money font-medium text-ink-900">{it.line_total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {receiveMode && canReceive && (
                        <form onSubmit={submitReceive} className="bg-white border-2 border-primary-500 rounded-lg overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-primary-200 bg-primary-50 flex items-center justify-between">
                                <h2 className="text-sm font-medium text-primary-800">Record goods receipt</h2>
                                <button type="button" onClick={() => setReceiveMode(false)} className="text-xs text-ink-500 hover:text-ink-900">Cancel</button>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-medium text-ink-700 mb-1.5">Receipt date</label>
                                        <input type="date" value={data.receipt_date} onChange={(e) => setData('receipt_date', e.target.value)} className="input" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-ink-700 mb-1.5">Notes</label>
                                        <input type="text" value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="input" />
                                    </div>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="bg-ink-50 text-ink-500 text-xs">
                                        <tr>
                                            <th className="text-left font-medium px-2 py-2">Item</th>
                                            <th className="text-right font-medium px-2 py-2">Remaining</th>
                                            <th className="text-right font-medium px-2 py-2 w-28">Receive qty</th>
                                            <th className="text-right font-medium px-2 py-2 w-28">Final cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((it) => {
                                            const remaining = Math.max(0, it.ordered_qty - it.received_qty);
                                            const row = data.items.find((r) => r.po_item_id === it.id);
                                            return (
                                                <tr key={it.id} className="border-t border-ink-200">
                                                    <td className="px-2 py-2">
                                                        <div className="text-ink-900">{it.product_name}</div>
                                                        <div className="text-xs text-ink-500 ref">{it.product_sku}</div>
                                                    </td>
                                                    <td className="px-2 py-2 text-right money text-ink-700">{remaining}</td>
                                                    <td className="px-2 py-2">
                                                        <input type="number" min={0} max={remaining} value={row?.received_qty ?? 0} onChange={(e) => updateReceive(it.id, 'received_qty', Number(e.target.value))} className="input money text-right h-8 w-full" />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input type="number" step="0.01" value={row?.unit_cost ?? 0} onChange={(e) => updateReceive(it.id, 'unit_cost', Number(e.target.value))} className="input money text-right h-8 w-full" />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <p className="text-xs text-ink-500 mt-3">Stock will be added to {po.location?.name}. Final cost updates the product's last cost.</p>
                                <button type="submit" disabled={processing} className="mt-3 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
                                    Record receipt
                                </button>
                            </div>
                        </form>
                    )}

                    {receipts.length > 0 && (
                        <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-ink-200"><h2 className="text-sm font-medium text-ink-900">Goods receipts</h2></div>
                            <table className="w-full text-sm">
                                <thead className="bg-ink-50 text-ink-500 text-xs">
                                    <tr>
                                        <th className="text-left font-medium px-3 py-2">GRN</th>
                                        <th className="text-left font-medium px-3 py-2">Date</th>
                                        <th className="text-right font-medium px-3 py-2">Items</th>
                                        <th className="text-right font-medium px-3 py-2">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receipts.map((r) => (
                                        <tr key={r.id} className="border-t border-ink-200">
                                            <td className="px-3 py-2 ref">{r.grn_number}</td>
                                            <td className="px-3 py-2 money text-ink-700">{r.receipt_date}</td>
                                            <td className="px-3 py-2 text-right money">{r.items?.length ?? 0}</td>
                                            <td className="px-3 py-2 text-right money font-medium money-pos">{r.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div>
                    <div className="bg-white border border-ink-200 rounded-lg p-4">
                        <h2 className="text-sm font-medium text-ink-900 mb-3">Summary</h2>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr><td className="text-ink-500 py-1">Subtotal</td><td className="text-right money py-1">{po.subtotal}</td></tr>
                                <tr><td className="text-ink-500 py-1">Freight</td><td className="text-right money py-1">{po.freight}</td></tr>
                                <tr><td className="text-ink-500 py-1">Other</td><td className="text-right money py-1">{po.other_charges}</td></tr>
                                <tr className="border-t border-ink-200"><td className="text-ink-900 font-medium pt-2">Grand total</td><td className="text-right money font-medium pt-2 text-base">{po.total}</td></tr>
                                <tr><td className="text-ink-500 py-1">Paid</td><td className="text-right money-pos py-1">{po.paid_amount}</td></tr>
                                <tr><td className="text-ink-900 font-medium py-1">Balance owed</td><td className={`text-right money font-medium py-1 ${due > 0 ? 'text-danger' : 'text-success'}`}>{due > 0 ? due.toFixed(2) : '0.00'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
