import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Payment } from '@/types';
import ConfirmDialog from '@/Components/ConfirmDialog';

const METHOD_LABEL: Record<Payment['method'], string> = {
    cash: 'Cash',
    card: 'Card',
    check: 'Check',
    bank: 'Bank',
    debit: 'On account',
};

export default function PaymentsShow({ payment }: { payment: Payment }) {
    const allocated = (payment.allocations ?? []).reduce(
        (s, a) => s + parseFloat(a.amount),
        0,
    );
    const onAccount = parseFloat(payment.amount) - allocated;
    const [showCancel, setShowCancel] = useState(false);
    const [reason, setReason] = useState('');
    const isCancelled = payment.status === 'cancelled';

    const performCancel = () => {
        setShowCancel(false);
        router.delete(route('admin.payments.cancel', payment.id), { data: { reason } } as never);
    };

    return (
        <AdminLayout
            title={payment.payment_number}
            actions={
                <div className="flex gap-2">
                    <a
                        href={route('admin.payments.pdf', payment.id)}
                        target="_blank"
                        className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium"
                    >
                        Receipt PDF
                    </a>
                    {!isCancelled && (
                        <button
                            onClick={() => setShowCancel(true)}
                            className="bg-danger hover:opacity-90 text-white px-4 py-2 rounded text-sm font-medium"
                        >
                            Cancel payment
                        </button>
                    )}
                </div>
            }
        >
            <Head title={payment.payment_number} />
            <ConfirmDialog
                show={showCancel}
                title={`Cancel ${payment.payment_number}?`}
                message={
                    <div>
                        <p className="mb-3">Allocations will be reversed and a debit ledger entry will be written to restore the customer balance.</p>
                        <label className="block text-xs font-medium text-ink-700 mb-1">Reason (optional)</label>
                        <input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="input w-full"
                            placeholder="e.g. cheque bounced, entered wrong amount"
                        />
                    </div>
                }
                confirmLabel="Cancel payment"
                onConfirm={performCancel}
                onCancel={() => setShowCancel(false)}
            />
            {isCancelled && (
                <div className="bg-ink-50 border border-ink-200 rounded p-3 mb-4 text-sm text-ink-700">
                    <span className="badge badge-cancelled mr-2">Cancelled</span>
                    This payment has been cancelled. Bills it was allocated to have been re-opened.
                </div>
            )}

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                    <Section>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-xl font-medium text-ink-900">{payment.payment_number}</p>
                                <p className="text-sm text-ink-500 mt-1 money">{payment.payment_date}</p>
                            </div>
                            <span className="badge badge-paid">{METHOD_LABEL[payment.method]}</span>
                        </div>
                        <div className="border-t border-ink-200 pt-3 grid grid-cols-2 gap-y-3 text-sm">
                            <div>
                                <p className="text-ink-500 mb-0.5">Customer</p>
                                <p className="text-ink-900">
                                    <span className="ref text-ink-500 mr-1">{payment.customer?.code}</span>
                                    {payment.customer?.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-ink-500 mb-0.5">Amount</p>
                                <p className="text-ink-900 money font-medium text-base">{payment.amount}</p>
                            </div>
                            {payment.check_number && (
                                <>
                                    <div>
                                        <p className="text-ink-500 mb-0.5">Check #</p>
                                        <p className="text-ink-900 ref">{payment.check_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-ink-500 mb-0.5">Bank · Date</p>
                                        <p className="text-ink-900">
                                            {payment.bank_name || '—'} · <span className="money">{payment.check_date}</span>
                                        </p>
                                    </div>
                                </>
                            )}
                            {payment.reference && (
                                <div className="col-span-2">
                                    <p className="text-ink-500 mb-0.5">Reference</p>
                                    <p className="text-ink-900 ref">{payment.reference}</p>
                                </div>
                            )}
                            {payment.due_date && (
                                <div>
                                    <p className="text-ink-500 mb-0.5">Due date</p>
                                    <p className="text-ink-900 money">{payment.due_date}</p>
                                </div>
                            )}
                            {payment.notes && (
                                <div className="col-span-2">
                                    <p className="text-ink-500 mb-0.5">Notes</p>
                                    <p className="text-ink-700">{payment.notes}</p>
                                </div>
                            )}
                        </div>
                    </Section>

                    <Section title="Allocated to bills">
                        {!payment.allocations || payment.allocations.length === 0 ? (
                            <p className="text-sm text-ink-500 py-4 text-center">
                                Not allocated to any bill yet — sits as customer credit.
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-ink-50 text-ink-500 text-xs">
                                    <tr>
                                        <th className="text-left font-medium px-3 py-2">Invoice</th>
                                        <th className="text-right font-medium px-3 py-2">Bill total</th>
                                        <th className="text-right font-medium px-3 py-2">Applied</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payment.allocations.map((a) => (
                                        <tr key={a.id} className="border-t border-ink-200">
                                            <td className="px-3 py-2">
                                                <Link href={route('admin.bills.show', a.bill_id)} className="ref hover:underline">
                                                    {a.bill?.invoice_number}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-2 text-right money text-ink-700">{a.bill?.grand_total}</td>
                                            <td className="px-3 py-2 text-right money-pos">{a.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Section>
                </div>

                <div>
                    <Section title="Summary">
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="text-ink-500 py-1">Total received</td>
                                    <td className="text-right money-pos py-1">{payment.amount}</td>
                                </tr>
                                <tr>
                                    <td className="text-ink-500 py-1">Allocated to bills</td>
                                    <td className="text-right money py-1">{allocated.toFixed(2)}</td>
                                </tr>
                                <tr className="border-t border-ink-200">
                                    <td className="text-ink-900 font-medium pt-2">On account</td>
                                    <td className="text-right money font-medium pt-2 text-ink-700">{onAccount.toFixed(2)}</td>
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
