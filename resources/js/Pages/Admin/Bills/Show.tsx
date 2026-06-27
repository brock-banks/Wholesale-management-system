import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Bill } from '@/types';
import { useConfirm } from '@/hooks/useConfirm';

const METHOD_LABEL: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    check: 'Check',
    bank: 'Bank',
    debit: 'On account',
};

export default function BillsShow({ bill }: { bill: Bill }) {
    const due = parseFloat(bill.grand_total) - parseFloat(bill.paid_amount);
    const { confirm, dialog } = useConfirm();

    const cancel = () => {
        confirm({
            title: `Cancel ${bill.invoice_number}?`,
            message: 'Stock will be returned to inventory and ledger entries will be reversed. This cannot be undone.',
            confirmLabel: 'Cancel invoice',
            onConfirm: () => router.delete(route('admin.bills.destroy', bill.id)),
        });
    };

    const statusBadge = () => {
        if (bill.status === 'cancelled') return <span className="badge badge-cancelled">Cancelled</span>;
        if (due <= 0.01) return <span className="badge badge-paid">Paid</span>;
        if (parseFloat(bill.paid_amount) > 0) return <span className="badge badge-partial">Partial</span>;
        return <span className="badge badge-unpaid">Unpaid</span>;
    };

    return (
        <AdminLayout
            title={bill.invoice_number}
            actions={
                <div className="flex gap-2">
                    <a
                        href={route('admin.bills.pdf', bill.id)}
                        target="_blank"
                        className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium"
                    >
                        PDF
                    </a>
                    {bill.status === 'posted' && (
                        <Link
                            href={`${route('admin.returns.create')}?bill_id=${bill.id}`}
                            className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium"
                        >
                            Record return
                        </Link>
                    )}
                    <Link
                        href={`${route('admin.bills.create')}?from_bill=${bill.id}`}
                        className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium"
                    >
                        Duplicate
                    </Link>
                    {bill.status !== 'cancelled' && (
                        <button
                            onClick={cancel}
                            className="bg-danger-bg hover:bg-red-100 text-danger-text px-4 py-2 rounded text-sm font-medium"
                        >
                            Cancel bill
                        </button>
                    )}
                </div>
            }
        >
            <Head title={bill.invoice_number} />
            {dialog}

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                    <Section>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-xl font-medium text-ink-900">{bill.invoice_number}</p>
                                <p className="text-sm text-ink-500 mt-1 money">
                                    {bill.bill_date} · {bill.location?.name}
                                </p>
                            </div>
                            {statusBadge()}
                        </div>
                        <div className="border-t border-ink-200 pt-3 text-sm">
                            <p className="text-ink-500 mb-1">Customer</p>
                            <p className="text-ink-900">
                                <span className="ref text-ink-500 mr-1">{bill.customer?.code}</span>
                                {bill.customer?.name}
                            </p>
                            {bill.customer?.phone && <p className="text-ink-600 money mt-0.5">{bill.customer.phone}</p>}
                            {bill.customer?.address && <p className="text-ink-600 mt-0.5">{bill.customer.address}</p>}
                        </div>
                        {bill.notes && (
                            <div className="border-t border-ink-200 pt-3 mt-3 text-sm">
                                <p className="text-ink-500 mb-1">Notes</p>
                                <p className="text-ink-700">{bill.notes}</p>
                            </div>
                        )}
                    </Section>

                    <Section title="Items">
                        <table className="w-full text-sm">
                            <thead className="bg-ink-50 text-ink-500 text-xs">
                                <tr>
                                    <th className="text-left font-medium px-3 py-2">Item</th>
                                    <th className="text-right font-medium px-3 py-2">Unit</th>
                                    <th className="text-right font-medium px-3 py-2">Qty</th>
                                    <th className="text-right font-medium px-3 py-2">Disc.</th>
                                    <th className="text-right font-medium px-3 py-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bill.items?.map((it) => (
                                    <tr key={it.id} className="border-t border-ink-200">
                                        <td className="px-3 py-2">
                                            <div className="text-ink-900">{it.product_name}</div>
                                            <div className="text-xs text-ink-500 ref">{it.product_sku}</div>
                                        </td>
                                        <td className="px-3 py-2 text-right money text-ink-700">{it.unit_price}</td>
                                        <td className="px-3 py-2 text-right money text-ink-900">{it.quantity}</td>
                                        <td className="px-3 py-2 text-right money text-ink-500">
                                            {parseFloat(it.discount_amount) > 0 ? it.discount_amount : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-right money font-medium text-ink-900">{it.line_total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Section>

                    <Section title="Payments">
                        {!bill.allocations || bill.allocations.length === 0 ? (
                            <p className="text-sm text-ink-500 py-4 text-center">No payments recorded yet.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-ink-50 text-ink-500 text-xs">
                                    <tr>
                                        <th className="text-left font-medium px-3 py-2">Receipt</th>
                                        <th className="text-left font-medium px-3 py-2">Date</th>
                                        <th className="text-left font-medium px-3 py-2">Method</th>
                                        <th className="text-left font-medium px-3 py-2">Reference</th>
                                        <th className="text-right font-medium px-3 py-2">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bill.allocations.map((a) => (
                                        <tr key={a.id} className="border-t border-ink-200">
                                            <td className="px-3 py-2 ref">
                                                <Link href={route('admin.payments.show', a.payment_id)} className="hover:underline">
                                                    {a.payment?.payment_number}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-2 money text-ink-600">{a.payment?.payment_date}</td>
                                            <td className="px-3 py-2 text-ink-700">{METHOD_LABEL[a.payment?.method ?? ''] ?? a.payment?.method}</td>
                                            <td className="px-3 py-2 text-ink-600 text-xs">
                                                {a.payment?.check_number
                                                    ? `Check ${a.payment.check_number} · ${a.payment.bank_name || ''}`
                                                    : a.payment?.reference || '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right money-pos">{a.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {bill.status !== 'cancelled' && due > 0 && (
                            <div className="mt-4 pt-3 border-t border-ink-200">
                                <Link
                                    href={`${route('admin.payments.create')}?customer_id=${bill.customer_id}`}
                                    className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium inline-block"
                                >
                                    Record payment
                                </Link>
                            </div>
                        )}
                    </Section>
                </div>

                <div>
                    <Section title="Summary">
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="text-ink-500 py-1">Subtotal</td>
                                    <td className="text-right money py-1">{bill.subtotal}</td>
                                </tr>
                                <tr>
                                    <td className="text-ink-500 py-1">Discount</td>
                                    <td className="text-right money py-1">
                                        {parseFloat(bill.discount_amount) > 0 ? `- ${bill.discount_amount}` : '—'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-ink-500 py-1">Tax</td>
                                    <td className="text-right money py-1">{bill.tax_total}</td>
                                </tr>
                                <tr className="border-t border-ink-200">
                                    <td className="text-ink-900 font-medium pt-2">Grand total</td>
                                    <td className="text-right money font-medium pt-2 text-base">{bill.grand_total}</td>
                                </tr>
                                <tr>
                                    <td className="text-ink-500 py-1">Paid</td>
                                    <td className="text-right money-pos py-1">{bill.paid_amount}</td>
                                </tr>
                                <tr>
                                    <td className="text-ink-900 font-medium py-1">Balance due</td>
                                    <td className={`text-right money font-medium py-1 ${due > 0 ? 'text-danger' : 'text-success'}`}>
                                        {due > 0 ? due.toFixed(2) : '0.00'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </Section>
                </div>
            </div>
        </AdminLayout>
    );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-ink-200 rounded-lg">
            {title && (
                <div className="px-4 py-2.5 border-b border-ink-200">
                    <h2 className="text-sm font-medium text-ink-900">{title}</h2>
                </div>
            )}
            <div className="p-4">{children}</div>
        </div>
    );
}
