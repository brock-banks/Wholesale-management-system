import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { SupplierPayment } from '@/types';

const METHOD_LABEL: Record<string, string> = { cash: 'Cash', card: 'Card', check: 'Check', bank: 'Bank' };

export default function SupplierPaymentShow({ payment }: { payment: SupplierPayment }) {
    const allocated = (payment.allocations ?? []).reduce((s, a) => s + parseFloat(a.amount), 0);
    const onAccount = parseFloat(payment.amount) - allocated;

    return (
        <AdminLayout title={payment.payment_number}>
            <Head title={payment.payment_number} />
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                    <div className="bg-white border border-ink-200 rounded-lg p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-xl font-medium text-ink-900">{payment.payment_number}</p>
                                <p className="text-sm text-ink-500 mt-1 money">{payment.payment_date}</p>
                            </div>
                            <span className="badge badge-paid">{METHOD_LABEL[payment.method]}</span>
                        </div>
                        <div className="border-t border-ink-200 pt-3 grid grid-cols-2 gap-y-3 text-sm">
                            <div>
                                <p className="text-ink-500 mb-0.5">Supplier</p>
                                <p className="text-ink-900"><span className="ref text-ink-500 mr-1">{payment.supplier?.code}</span>{payment.supplier?.name}</p>
                            </div>
                            <div>
                                <p className="text-ink-500 mb-0.5">Amount</p>
                                <p className="text-ink-900 money font-medium text-base">{payment.amount}</p>
                            </div>
                            {payment.check_number && <>
                                <div><p className="text-ink-500 mb-0.5">Check #</p><p className="ref text-ink-900">{payment.check_number}</p></div>
                                <div><p className="text-ink-500 mb-0.5">Bank · Date</p><p className="text-ink-900">{payment.bank_name || '—'} · <span className="money">{payment.check_date}</span></p></div>
                            </>}
                            {payment.reference && <div className="col-span-2"><p className="text-ink-500 mb-0.5">Reference</p><p className="ref text-ink-900">{payment.reference}</p></div>}
                            {payment.notes && <div className="col-span-2"><p className="text-ink-500 mb-0.5">Notes</p><p className="text-ink-700">{payment.notes}</p></div>}
                        </div>
                    </div>

                    <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-ink-200"><h2 className="text-sm font-medium text-ink-900">Allocated to POs</h2></div>
                        {!payment.allocations || payment.allocations.length === 0 ? (
                            <p className="text-sm text-ink-500 py-6 text-center">Not allocated to any PO — sits as supplier credit.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-ink-50 text-ink-500 text-xs">
                                    <tr>
                                        <th className="text-left font-medium px-3 py-2">PO</th>
                                        <th className="text-right font-medium px-3 py-2">PO total</th>
                                        <th className="text-right font-medium px-3 py-2">Applied</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payment.allocations.map((a) => (
                                        <tr key={a.id} className="border-t border-ink-200">
                                            <td className="px-3 py-2"><Link href={route('admin.purchases.show', a.purchase_order?.id ?? 0)} className="ref hover:underline">{a.purchase_order?.po_number}</Link></td>
                                            <td className="px-3 py-2 text-right money text-ink-700">{a.purchase_order?.total}</td>
                                            <td className="px-3 py-2 text-right money-pos">{a.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div>
                    <div className="bg-white border border-ink-200 rounded-lg p-4">
                        <h2 className="text-sm font-medium text-ink-900 mb-3">Summary</h2>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr><td className="text-ink-500 py-1">Paid out</td><td className="text-right money-pos py-1">{payment.amount}</td></tr>
                                <tr><td className="text-ink-500 py-1">Allocated</td><td className="text-right money py-1">{allocated.toFixed(2)}</td></tr>
                                <tr className="border-t border-ink-200"><td className="text-ink-900 font-medium pt-2">On account</td><td className="text-right money font-medium pt-2 text-ink-700">{onAccount.toFixed(2)}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
