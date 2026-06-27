import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { useMoney } from '@/hooks/useMoney';

interface BillRow {
    id: number;
    invoice_number: string;
    bill_date: string;
    grand_total: string;
    status: string;
    created_at: string;
    customer?: { id: number; code: string; name: string };
}

interface PaymentRow {
    id: number;
    payment_number: string;
    payment_date: string;
    amount: string;
    method: string;
    status: string;
    created_at: string;
    customer?: { id: number; code: string; name: string };
}

interface StockRow {
    id: number;
    type: string;
    quantity: number;
    notes: string | null;
    created_at: string;
    product?: { id: number; sku: string; name: string };
    location?: { id: number; code: string; name: string };
}

interface SupplierPaymentRow {
    id: number;
    payment_number: string;
    payment_date: string;
    amount: string;
    method: string;
    created_at: string;
    supplier?: { id: number; code: string; name: string };
}

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string | null;
    commission_rate: number;
    phone: string | null;
    created_at: string;
}

interface Props {
    user: UserData;
    bills: BillRow[];
    payments: PaymentRow[];
    stock_movements: StockRow[];
    supplier_payments: SupplierPaymentRow[];
    stats: {
        customers_assigned?: number;
        orders_taken?: number;
        commission_total?: number;
    };
}

const STOCK_TYPE_LABEL: Record<string, string> = {
    stock_in: 'Stock in', sale: 'Sale', return: 'Return', adjustment: 'Adjustment',
    transfer_out: 'Transfer out', transfer_in: 'Transfer in', reservation: 'Reserved', release: 'Released',
};

export default function UserActivity({ user, bills, payments, stock_movements, supplier_payments, stats }: Props) {
    const { format: fmt } = useMoney();
    const isRep = user.role === 'sales_rep';

    return (
        <AdminLayout
            title={`Activity — ${user.name}`}
            actions={
                <Link
                    href={route('admin.users.edit', user.id)}
                    className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium"
                >
                    Edit user
                </Link>
            }
        >
            <Head title={`Activity · ${user.name}`} />

            <div className="bg-white border border-ink-200 rounded-lg p-5 mb-4">
                <div className="grid grid-cols-4 gap-6 text-sm">
                    <div>
                        <p className="text-xs text-ink-500 mb-0.5">Email</p>
                        <p className="ref">{user.email}</p>
                    </div>
                    <div>
                        <p className="text-xs text-ink-500 mb-0.5">Role</p>
                        <p className="text-ink-900 capitalize">{user.role?.replace('_', ' ')}</p>
                    </div>
                    <div>
                        <p className="text-xs text-ink-500 mb-0.5">Phone</p>
                        <p className="text-ink-900 mono">{user.phone || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-ink-500 mb-0.5">Joined</p>
                        <p className="text-ink-900 mono">{user.created_at}</p>
                    </div>
                </div>
            </div>

            {isRep && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <Tile label="Customers assigned" value={String(stats.customers_assigned ?? 0)} />
                    <Tile label="Orders taken" value={String(stats.orders_taken ?? 0)} />
                    <Tile label={`Lifetime commission (${user.commission_rate.toFixed(2)}%)`} value={fmt(stats.commission_total ?? 0)} tone="success" />
                </div>
            )}

            <div className="grid grid-cols-2 gap-6">
                <Section title={`Bills created (${bills.length})`}>
                    {bills.length === 0 ? <Empty /> : (
                        <table className="w-full text-sm">
                            <thead className="text-xs text-ink-500">
                                <tr>
                                    <th className="text-left font-medium pb-2">Invoice</th>
                                    <th className="text-left font-medium pb-2">Customer</th>
                                    <th className="text-right font-medium pb-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map((b) => (
                                    <tr key={b.id} className="border-t border-ink-100">
                                        <td className="py-2">
                                            <Link href={route('admin.bills.show', b.id)} className="ref text-primary-700 hover:underline">{b.invoice_number}</Link>
                                            <div className="text-xs text-ink-500 mono">{b.created_at}</div>
                                        </td>
                                        <td className="py-2 text-ink-700">{b.customer?.name ?? '—'}</td>
                                        <td className="py-2 text-right money font-medium">{fmt(b.grand_total, { withCurrency: false })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Section>

                <Section title={`Payments recorded (${payments.length})`}>
                    {payments.length === 0 ? <Empty /> : (
                        <table className="w-full text-sm">
                            <thead className="text-xs text-ink-500">
                                <tr>
                                    <th className="text-left font-medium pb-2">Payment</th>
                                    <th className="text-left font-medium pb-2">Customer</th>
                                    <th className="text-right font-medium pb-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p) => (
                                    <tr key={p.id} className="border-t border-ink-100">
                                        <td className="py-2">
                                            <Link href={route('admin.payments.show', p.id)} className="ref text-primary-700 hover:underline">{p.payment_number}</Link>
                                            <div className="text-xs text-ink-500 capitalize">{p.method}{p.status === 'cancelled' ? ' · cancelled' : ''}</div>
                                        </td>
                                        <td className="py-2 text-ink-700">{p.customer?.name ?? '—'}</td>
                                        <td className="py-2 text-right money font-medium text-success">{fmt(p.amount, { withCurrency: false })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Section>

                <Section title={`Stock movements (${stock_movements.length})`}>
                    {stock_movements.length === 0 ? <Empty /> : (
                        <table className="w-full text-sm">
                            <thead className="text-xs text-ink-500">
                                <tr>
                                    <th className="text-left font-medium pb-2">When · Product</th>
                                    <th className="text-left font-medium pb-2">Type</th>
                                    <th className="text-right font-medium pb-2">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stock_movements.map((s) => (
                                    <tr key={s.id} className="border-t border-ink-100">
                                        <td className="py-2">
                                            <div className="text-ink-900">{s.product?.name}</div>
                                            <div className="text-xs text-ink-500 mono">{s.created_at} · {s.location?.code}</div>
                                        </td>
                                        <td className="py-2 text-ink-700 text-xs">{STOCK_TYPE_LABEL[s.type] ?? s.type}</td>
                                        <td className={`py-2 text-right money font-medium ${s.quantity < 0 ? 'text-danger' : 'text-success'}`}>{s.quantity > 0 ? '+' : ''}{s.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Section>

                <Section title={`Supplier payments (${supplier_payments.length})`}>
                    {supplier_payments.length === 0 ? <Empty /> : (
                        <table className="w-full text-sm">
                            <thead className="text-xs text-ink-500">
                                <tr>
                                    <th className="text-left font-medium pb-2">Payment</th>
                                    <th className="text-left font-medium pb-2">Supplier</th>
                                    <th className="text-right font-medium pb-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supplier_payments.map((s) => (
                                    <tr key={s.id} className="border-t border-ink-100">
                                        <td className="py-2">
                                            <Link href={route('admin.supplier_payments.show', s.id)} className="ref text-primary-700 hover:underline">{s.payment_number}</Link>
                                            <div className="text-xs text-ink-500 mono">{s.created_at}</div>
                                        </td>
                                        <td className="py-2 text-ink-700">{s.supplier?.name ?? '—'}</td>
                                        <td className="py-2 text-right money font-medium">{fmt(s.amount, { withCurrency: false })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Section>
            </div>
        </AdminLayout>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-ink-200 rounded-lg p-5">
            <h2 className="text-md font-medium text-ink-900 mb-3">{title}</h2>
            {children}
        </div>
    );
}

function Empty() {
    return <p className="text-sm text-ink-500 text-center py-6">No activity yet.</p>;
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
    const color = tone === 'success' ? 'text-success' : 'text-ink-900';
    return (
        <div className="bg-ink-100 rounded p-4">
            <p className="text-xs text-ink-500">{label}</p>
            <p className={`text-xl font-medium mt-1.5 money ${color}`}>{value}</p>
        </div>
    );
}
