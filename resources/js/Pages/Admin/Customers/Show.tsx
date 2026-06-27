import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Bill, Customer, Order, Payment } from '@/types';
import { useMoney } from '@/hooks/useMoney';

interface LedgerRow {
    id: number;
    entry_date: string;
    type: string;
    debit: string;
    credit: string;
    running_balance: string;
    description: string | null;
}

interface Totals {
    bills_count: number;
    total_sales: number;
    total_paid: number;
    outstanding: number;
}

interface Props {
    customer: Customer;
    bills: Bill[];
    payments: Payment[];
    orders: Order[];
    recent_ledger: LedgerRow[];
    totals: Totals;
}

export default function CustomerShow({ customer, bills, payments, orders, recent_ledger, totals }: Props) {
    const { format: fmt } = useMoney();
    const balance = parseFloat(customer.current_balance);
    const balanceTone = balance > 0 ? 'text-danger' : balance < 0 ? 'text-success' : 'text-ink-600';

    return (
        <AdminLayout
            title={`${customer.code} · ${customer.name}`}
            actions={
                <div className="flex gap-2">
                    <Link
                        href={route('admin.customers.statement', customer.id)}
                        className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium"
                    >
                        Statement
                    </Link>
                    <Link
                        href={route('admin.customers.edit', customer.id)}
                        className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                        Edit
                    </Link>
                </div>
            }
        >
            <Head title={`Customer · ${customer.name}`} />

            <div className="grid grid-cols-4 gap-3 mb-6">
                <Tile label="Current balance" value={fmt(balance)} tone={balanceTone} />
                <Tile label="Credit limit" value={fmt(customer.credit_limit)} />
                <Tile label="Total invoiced" value={fmt(totals.total_sales)} />
                <Tile label="Total paid" value={fmt(totals.total_paid)} tone="text-success" />
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1">
                    <div className="bg-white border border-ink-200 rounded-lg p-5">
                        <h2 className="text-md font-medium text-ink-900 mb-3">Profile</h2>
                        <dl className="space-y-2 text-sm">
                            <Row label="Code" value={customer.code} mono />
                            <Row label="Phone" value={customer.phone || '—'} mono />
                            <Row label="Email" value={customer.email || '—'} />
                            <Row label="Address" value={customer.address || '—'} />
                            <Row label="Opening balance" value={fmt(customer.opening_balance)} />
                            <Row label="Status" value={customer.is_active ? 'Active' : 'Inactive'} />
                            <Row label="Login" value={customer.user_id ? 'Enabled' : 'No login'} />
                        </dl>
                        {customer.notes && (
                            <div className="mt-4 p-3 bg-ink-50 rounded text-sm text-ink-700">
                                {customer.notes}
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-span-2 space-y-6">
                    <Section title="Recent invoices" empty={bills.length === 0}>
                        <table className="w-full text-sm">
                            <thead className="text-xs text-ink-500">
                                <tr>
                                    <th className="text-left font-medium pb-2">Number</th>
                                    <th className="text-left font-medium pb-2">Date</th>
                                    <th className="text-right font-medium pb-2">Total</th>
                                    <th className="text-right font-medium pb-2">Paid</th>
                                    <th className="text-center font-medium pb-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map((b) => {
                                    const due = parseFloat(b.grand_total) - parseFloat(b.paid_amount);
                                    return (
                                        <tr key={b.id} className="border-t border-ink-100">
                                            <td className="py-2">
                                                <Link href={route('admin.bills.show', b.id)} className="ref text-primary-700 hover:underline">
                                                    {b.invoice_number}
                                                </Link>
                                            </td>
                                            <td className="py-2 text-ink-600">{b.bill_date}</td>
                                            <td className="py-2 text-right money">{fmt(b.grand_total, { withCurrency: false })}</td>
                                            <td className="py-2 text-right money text-success">{fmt(b.paid_amount, { withCurrency: false })}</td>
                                            <td className="py-2 text-center">
                                                {b.status === 'cancelled' ? (
                                                    <span className="badge badge-draft">Cancelled</span>
                                                ) : due <= 0.01 ? (
                                                    <span className="badge badge-paid">Paid</span>
                                                ) : parseFloat(b.paid_amount) > 0 ? (
                                                    <span className="badge badge-partial">Partial</span>
                                                ) : (
                                                    <span className="badge badge-unpaid">Unpaid</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Section>

                    <Section title="Recent payments" empty={payments.length === 0}>
                        <table className="w-full text-sm">
                            <thead className="text-xs text-ink-500">
                                <tr>
                                    <th className="text-left font-medium pb-2">Number</th>
                                    <th className="text-left font-medium pb-2">Date</th>
                                    <th className="text-left font-medium pb-2">Method</th>
                                    <th className="text-right font-medium pb-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p) => (
                                    <tr key={p.id} className="border-t border-ink-100">
                                        <td className="py-2">
                                            <Link href={route('admin.payments.show', p.id)} className="ref text-primary-700 hover:underline">
                                                {p.payment_number}
                                            </Link>
                                        </td>
                                        <td className="py-2 text-ink-600">{p.payment_date}</td>
                                        <td className="py-2 text-ink-600 capitalize">{p.method}</td>
                                        <td className="py-2 text-right money text-success">{fmt(p.amount, { withCurrency: false })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Section>

                    {orders.length > 0 && (
                        <Section title="Recent orders" empty={false}>
                            <table className="w-full text-sm">
                                <thead className="text-xs text-ink-500">
                                    <tr>
                                        <th className="text-left font-medium pb-2">Number</th>
                                        <th className="text-left font-medium pb-2">Date</th>
                                        <th className="text-center font-medium pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((o) => (
                                        <tr key={o.id} className="border-t border-ink-100">
                                            <td className="py-2">
                                                <Link href={route('admin.orders.show', o.id)} className="ref text-primary-700 hover:underline">
                                                    {o.order_number}
                                                </Link>
                                            </td>
                                            <td className="py-2 text-ink-600">{o.order_date}</td>
                                            <td className="py-2 text-center capitalize text-ink-700">{o.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Section>
                    )}

                    <Section title="Recent ledger entries" empty={recent_ledger.length === 0}>
                        <table className="w-full text-sm">
                            <thead className="text-xs text-ink-500">
                                <tr>
                                    <th className="text-left font-medium pb-2">Date</th>
                                    <th className="text-left font-medium pb-2">Type</th>
                                    <th className="text-left font-medium pb-2">Description</th>
                                    <th className="text-right font-medium pb-2">Debit</th>
                                    <th className="text-right font-medium pb-2">Credit</th>
                                    <th className="text-right font-medium pb-2">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent_ledger.map((e) => (
                                    <tr key={e.id} className="border-t border-ink-100">
                                        <td className="py-2 text-ink-600 mono">{e.entry_date}</td>
                                        <td className="py-2 capitalize text-ink-700">{e.type}</td>
                                        <td className="py-2 text-ink-600">{e.description ?? '—'}</td>
                                        <td className="py-2 text-right money">{parseFloat(e.debit) > 0 ? fmt(e.debit, { withCurrency: false }) : '—'}</td>
                                        <td className="py-2 text-right money text-success">{parseFloat(e.credit) > 0 ? fmt(e.credit, { withCurrency: false }) : '—'}</td>
                                        <td className="py-2 text-right money font-medium">{fmt(e.running_balance, { withCurrency: false })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Section>
                </div>
            </div>
        </AdminLayout>
    );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: string }) {
    return (
        <div className="bg-ink-100 rounded p-4">
            <p className="text-xs text-ink-500">{label}</p>
            <p className={`text-xl font-medium mt-1.5 money ${tone ?? 'text-ink-900'}`}>{value}</p>
        </div>
    );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex justify-between">
            <dt className="text-ink-500">{label}</dt>
            <dd className={`text-ink-900 ${mono ? 'mono' : ''}`}>{value}</dd>
        </div>
    );
}

function Section({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-ink-200 rounded-lg p-5">
            <h2 className="text-md font-medium text-ink-900 mb-3">{title}</h2>
            {empty ? <p className="text-sm text-ink-500">No records yet.</p> : children}
        </div>
    );
}
