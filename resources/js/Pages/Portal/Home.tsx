import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, Link } from '@inertiajs/react';

interface Props {
    customer: {
        id: number; code: string; name: string;
        phone: string | null; address: string | null;
        current_balance: string; credit_limit: string;
    };
    summary: {
        current_balance: string;
        balance_due: number;
        open_orders: number;
    };
    open_orders: Array<{ id: number; order_number: string; order_date: string; status: string; submitted_at: string | null }>;
    latest_bill: { id: number; invoice_number: string; bill_date: string; grand_total: string; paid_amount: string; status: string } | null;
}

const STATUS_BADGE: Record<string, string> = {
    pending: 'badge-pending',
    reviewing: 'badge-reviewing',
    confirmed: 'badge-confirmed',
    on_hold: 'badge-on-hold',
    invoiced: 'badge-invoiced',
    cancelled: 'badge-cancelled',
};

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending',
    reviewing: 'Reviewing',
    confirmed: 'Confirmed',
    on_hold: 'On hold',
    invoiced: 'Invoiced',
    cancelled: 'Cancelled',
};

export default function PortalHome({ customer, summary, open_orders, latest_bill }: Props) {
    return (
        <CustomerLayout title={`Welcome, ${customer.name}`}>
            <Head title="Home" />

            <div className="grid grid-cols-3 gap-3 mb-6">
                <Tile label="Current balance" value={summary.current_balance} tone="auto" />
                <Tile label="Balance due" value={summary.balance_due.toFixed(2)} tone="danger" />
                <Tile label="Open orders" value={String(summary.open_orders)} tone="ink" />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-ink-200 rounded-lg p-5">
                    <h2 className="text-md font-medium text-ink-900 mb-3">Open orders</h2>
                    {open_orders.length === 0 ? (
                        <p className="text-sm text-ink-500">
                            No active orders.{' '}
                            <Link href={route('portal.catalog')} className="text-primary-700 hover:underline">
                                Browse catalog
                            </Link>
                            .
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {open_orders.map((o) => (
                                <Link
                                    key={o.id}
                                    href={route('portal.orders.show', o.id)}
                                    className="flex items-center justify-between p-3 rounded hover:bg-ink-50 border border-ink-200"
                                >
                                    <div>
                                        <p className="ref text-sm">{o.order_number}</p>
                                        <p className="text-xs text-ink-500 money">{o.order_date}</p>
                                    </div>
                                    <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white border border-ink-200 rounded-lg p-5">
                    <h2 className="text-md font-medium text-ink-900 mb-3">Latest bill</h2>
                    {!latest_bill ? (
                        <p className="text-sm text-ink-500">No bills yet.</p>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="ref text-base">{latest_bill.invoice_number}</p>
                                    <p className="text-xs text-ink-500 money mt-0.5">{latest_bill.bill_date}</p>
                                </div>
                                <p className="text-lg font-medium money text-ink-900">{latest_bill.grand_total}</p>
                            </div>
                            <Link href={route('portal.statement')} className="text-sm text-primary-700 hover:underline">
                                View statement →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </CustomerLayout>
    );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: 'ink' | 'danger' | 'auto' }) {
    const num = parseFloat(value);
    const resolved =
        tone === 'auto' ? (num > 0 ? 'text-danger' : num < 0 ? 'text-success' : 'text-ink-900') :
        tone === 'danger' ? 'text-danger' : 'text-ink-900';
    return (
        <div className="bg-ink-100 rounded p-4">
            <p className="text-xs text-ink-500">{label}</p>
            <p className={`text-xl font-medium mt-1.5 money ${resolved}`}>{value}</p>
        </div>
    );
}
