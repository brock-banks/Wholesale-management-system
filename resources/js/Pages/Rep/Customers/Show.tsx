import RepLayout from '@/Layouts/RepLayout';
import { Head, Link } from '@inertiajs/react';
import { useMoney } from '@/hooks/useMoney';

interface BillRow {
    id: number;
    invoice_number: string;
    bill_date: string;
    grand_total: string;
    paid_amount: string;
    status: string;
}

interface OrderRow {
    id: number;
    order_number: string;
    order_date: string;
    status: string;
}

interface Customer {
    id: number;
    code: string;
    name: string;
    phone: string | null;
    address: string | null;
    current_balance: string;
    credit_limit: string;
    notes: string | null;
}

interface Props {
    customer: Customer;
    bills: BillRow[];
    orders: OrderRow[];
}

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending', reviewing: 'Reviewing', confirmed: 'Confirmed',
    on_hold: 'On hold', invoiced: 'Invoiced', cancelled: 'Cancelled',
    draft: 'Draft', posted: 'Posted',
};

export default function RepCustomerShow({ customer, bills, orders }: Props) {
    const { format: fmt } = useMoney();
    const balance = parseFloat(customer.current_balance);
    const balanceTone = balance > 0 ? 'text-danger' : balance < 0 ? 'text-success' : 'text-ink-700';

    return (
        <RepLayout
            title={customer.name}
            actions={
                <Link
                    href={`${route('rep.orders.create')}?customer_id=${customer.id}`}
                    className="bg-primary-700 hover:bg-primary-800 text-white px-3 py-1.5 rounded text-xs font-medium"
                >
                    New order
                </Link>
            }
        >
            <Head title={customer.name} />

            <div className="bg-white border border-ink-200 rounded-lg p-4 mb-3">
                <p className="ref text-xs">{customer.code}</p>
                {customer.phone && <p className="text-sm text-ink-700 mono mt-1">{customer.phone}</p>}
                {customer.address && <p className="text-sm text-ink-500 mt-1">{customer.address}</p>}
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-ink-100">
                    <div>
                        <p className="text-xs text-ink-500">Current balance</p>
                        <p className={`text-md font-medium money ${balanceTone}`}>{fmt(balance)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-ink-500">Credit limit</p>
                        <p className="text-md font-medium money text-ink-700">{fmt(customer.credit_limit)}</p>
                    </div>
                </div>
                {customer.notes && (
                    <div className="mt-3 p-2 bg-ink-50 rounded text-xs text-ink-600">{customer.notes}</div>
                )}
            </div>

            <Section title="Recent invoices" empty={bills.length === 0}>
                <div className="space-y-1.5">
                    {bills.map((b) => {
                        const due = parseFloat(b.grand_total) - parseFloat(b.paid_amount);
                        return (
                            <div key={b.id} className="flex items-center justify-between bg-ink-50 rounded px-3 py-2">
                                <div>
                                    <p className="ref text-xs">{b.invoice_number}</p>
                                    <p className="text-xs text-ink-500">{b.bill_date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm money font-medium text-ink-900">{fmt(b.grand_total, { withCurrency: false })}</p>
                                    {due > 0 ? (
                                        <p className="text-xs text-danger money">due {fmt(due, { withCurrency: false })}</p>
                                    ) : (
                                        <p className="text-xs text-success">paid</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Section>

            <Section title="Recent orders" empty={orders.length === 0}>
                <div className="space-y-1.5">
                    {orders.map((o) => (
                        <Link
                            key={o.id}
                            href={route('rep.orders.show', o.id)}
                            className="flex items-center justify-between bg-ink-50 hover:bg-ink-100 rounded px-3 py-2"
                        >
                            <div>
                                <p className="ref text-xs text-primary-700">{o.order_number}</p>
                                <p className="text-xs text-ink-500">{o.order_date}</p>
                            </div>
                            <span className="text-xs text-ink-700">{STATUS_LABEL[o.status] ?? o.status}</span>
                        </Link>
                    ))}
                </div>
            </Section>
        </RepLayout>
    );
}

function Section({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-ink-200 rounded-lg p-4 mb-3">
            <h2 className="text-sm font-medium text-ink-900 mb-2">{title}</h2>
            {empty ? <p className="text-xs text-ink-500 text-center py-3">No records yet.</p> : children}
        </div>
    );
}
