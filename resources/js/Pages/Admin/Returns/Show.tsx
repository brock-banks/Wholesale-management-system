import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

interface ReturnItemRow {
    id: number; product_name: string; product_sku: string;
    unit_price: string; quantity: number; line_total: string;
}
interface ReturnData {
    id: number; return_number: string; return_date: string;
    subtotal: string; total: string; reason: string | null;
    customer?: { id: number; code: string; name: string; phone?: string | null };
    location?: { id: number; code: string; name: string };
    bill?: { id: number; invoice_number: string } | null;
    items?: ReturnItemRow[];
}

export default function ReturnShow({ return: r }: { return: ReturnData }) {
    return (
        <AdminLayout
            title={r.return_number}
            actions={
                <a
                    href={route('admin.returns.pdf', r.id)}
                    target="_blank"
                    className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium"
                >
                    Credit note PDF
                </a>
            }
        >
            <Head title={r.return_number} />
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                    <div className="bg-white border border-ink-200 rounded-lg p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-xl font-medium text-ink-900">{r.return_number}</p>
                                <p className="text-sm text-ink-500 mt-1 money">{r.return_date} · {r.location?.name}</p>
                            </div>
                            <span className="badge badge-confirmed">Recorded</span>
                        </div>
                        <div className="border-t border-ink-200 pt-3 text-sm space-y-2">
                            <p><span className="text-ink-500">Customer: </span>
                                <span className="ref text-ink-500 mr-1">{r.customer?.code}</span>
                                <span className="text-ink-900">{r.customer?.name}</span>
                            </p>
                            {r.bill && (
                                <p><span className="text-ink-500">Against bill: </span>
                                    <Link href={route('admin.bills.show', r.bill.id)} className="ref hover:underline">{r.bill.invoice_number}</Link>
                                </p>
                            )}
                            {r.reason && <p><span className="text-ink-500">Reason: </span><span className="text-ink-700">{r.reason}</span></p>}
                        </div>
                    </div>

                    <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-ink-50 text-ink-500 text-xs">
                                <tr>
                                    <th className="text-left font-medium px-3 py-2">Item</th>
                                    <th className="text-right font-medium px-3 py-2">Unit price</th>
                                    <th className="text-right font-medium px-3 py-2">Qty</th>
                                    <th className="text-right font-medium px-3 py-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {r.items?.map((i) => (
                                    <tr key={i.id} className="border-t border-ink-200">
                                        <td className="px-3 py-2">
                                            <div className="text-ink-900">{i.product_name}</div>
                                            <div className="text-xs text-ink-500 ref">{i.product_sku}</div>
                                        </td>
                                        <td className="px-3 py-2 text-right money text-ink-700">{i.unit_price}</td>
                                        <td className="px-3 py-2 text-right money text-ink-900">{i.quantity}</td>
                                        <td className="px-3 py-2 text-right money font-medium money-pos">{i.line_total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <div className="bg-white border border-ink-200 rounded-lg p-4">
                        <h2 className="text-sm font-medium text-ink-900 mb-3">Summary</h2>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="text-ink-500 py-1">Subtotal</td>
                                    <td className="text-right money py-1">{r.subtotal}</td>
                                </tr>
                                <tr className="border-t border-ink-200">
                                    <td className="text-ink-900 font-medium pt-2">Credited</td>
                                    <td className="text-right money-pos font-medium pt-2 text-base">{r.total}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="text-xs text-ink-500 mt-3">
                            Stock restored to {r.location?.name}. Customer's ledger credited.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
