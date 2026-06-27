import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ChangeEvent, useState } from 'react';
import { Paginated, Payment } from '@/types';

const METHOD_LABEL: Record<Payment['method'], string> = {
    cash: 'Cash',
    card: 'Card',
    check: 'Check',
    bank: 'Bank',
    debit: 'On account',
};

export default function PaymentsIndex({
    payments,
    filters,
}: {
    payments: Paginated<Payment>;
    filters: { search: string | null; method: string | null };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [method, setMethod] = useState(filters.method ?? '');

    const apply = (next: { search?: string; method?: string }) =>
        router.get(
            route('admin.payments.index'),
            {
                search: next.search ?? search,
                method: (next.method ?? method) || undefined,
            },
            { preserveState: true, replace: true },
        );

    const checkBadge = (p: Payment) => {
        if (p.method !== 'check') return null;
        if (p.check_status === 'cleared') return <span className="badge badge-check-cleared">Cleared</span>;
        if (p.check_status === 'bounced') return <span className="badge badge-check-bounced">Bounced</span>;
        return <span className="badge badge-check-pending">Pending</span>;
    };

    return (
        <AdminLayout
            title="Payments"
            actions={
                <Link
                    href={route('admin.payments.create')}
                    className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    Record payment
                </Link>
            }
        >
            <Head title="Payments" />

            <div className="flex gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search receipt number, customer…"
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && apply({ search })}
                    className="input flex-1"
                />
                <select
                    value={method}
                    onChange={(e) => {
                        setMethod(e.target.value);
                        apply({ method: e.target.value });
                    }}
                    className="input w-40"
                >
                    <option value="">All methods</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="check">Check</option>
                    <option value="bank">Bank</option>
                    <option value="debit">On account</option>
                </select>
            </div>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Receipt</th>
                            <th className="text-left font-medium px-4 py-3">Date</th>
                            <th className="text-left font-medium px-4 py-3">Customer</th>
                            <th className="text-left font-medium px-4 py-3">Method</th>
                            <th className="text-right font-medium px-4 py-3">Amount</th>
                            <th className="font-medium px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-ink-500">
                                    No payments yet.
                                </td>
                            </tr>
                        )}
                        {payments.data.map((p) => (
                            <tr key={p.id} className="border-t border-ink-200 hover:bg-ink-50">
                                <td className="px-4 py-3">
                                    <Link href={route('admin.payments.show', p.id)} className="ref hover:underline">
                                        {p.payment_number}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-ink-600 money">{p.payment_date}</td>
                                <td className="px-4 py-3 text-ink-900">
                                    <span className="ref text-ink-500 mr-1">{p.customer?.code}</span>
                                    {p.customer?.name}
                                </td>
                                <td className="px-4 py-3 text-ink-700">{METHOD_LABEL[p.method]}</td>
                                <td className="px-4 py-3 text-right money-pos">{p.amount}</td>
                                <td className="px-4 py-3 text-center">{checkBadge(p) ?? <span className="badge badge-paid">Active</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {payments.last_page > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-ink-500">
                    <div>Showing {payments.from}–{payments.to} of {payments.total}</div>
                    <div className="flex gap-1">
                        {payments.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? ''}
                                className={`px-3 py-1.5 rounded ${
                                    link.active
                                        ? 'bg-primary-700 text-white'
                                        : link.url
                                          ? 'border border-ink-200 hover:bg-ink-50'
                                          : 'text-ink-400'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
