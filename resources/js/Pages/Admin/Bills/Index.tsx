import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ChangeEvent, useState } from 'react';
import { Bill, Paginated } from '@/types';

interface Props {
    bills: Paginated<Bill>;
    customers: { id: number; code: string; name: string }[];
    filters: { search: string | null; status: string | null; customer_id: number | null };
}

export default function BillsIndex({ bills, customers, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [customerId, setCustomerId] = useState<number | ''>(filters.customer_id ?? '');

    const applyFilters = (next: { search?: string; status?: string; customer_id?: number | '' }) => {
        router.get(
            route('admin.bills.index'),
            {
                search: next.search ?? search,
                status: (next.status ?? status) || undefined,
                customer_id: (next.customer_id ?? customerId) || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const billStatus = (b: Bill) => {
        if (b.status === 'cancelled') return <span className="badge badge-cancelled">Cancelled</span>;
        if (b.status === 'draft') return <span className="badge badge-draft">Draft</span>;
        const due = parseFloat(b.grand_total) - parseFloat(b.paid_amount);
        if (due <= 0.01) return <span className="badge badge-paid">Paid</span>;
        if (parseFloat(b.paid_amount) > 0) return <span className="badge badge-partial">Partial</span>;
        return <span className="badge badge-unpaid">Unpaid</span>;
    };

    return (
        <AdminLayout
            title="Bills"
            actions={
                <Link
                    href={route('admin.bills.create')}
                    className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    New bill (POS)
                </Link>
            }
        >
            <Head title="Bills" />

            <div className="flex gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search invoice number, customer…"
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                    className="input flex-1"
                />
                <select
                    value={customerId}
                    onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : '';
                        setCustomerId(v);
                        applyFilters({ customer_id: v });
                    }}
                    className="input w-56"
                >
                    <option value="">All customers</option>
                    {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.code} · {c.name}
                        </option>
                    ))}
                </select>
                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        applyFilters({ status: e.target.value });
                    }}
                    className="input w-40"
                >
                    <option value="">All statuses</option>
                    <option value="posted">Posted</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Invoice</th>
                            <th className="text-left font-medium px-4 py-3">Date</th>
                            <th className="text-left font-medium px-4 py-3">Customer</th>
                            <th className="text-right font-medium px-4 py-3">Total</th>
                            <th className="text-right font-medium px-4 py-3">Paid</th>
                            <th className="text-right font-medium px-4 py-3">Due</th>
                            <th className="font-medium px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bills.data.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-ink-500">
                                    No bills yet.{' '}
                                    <Link href={route('admin.bills.create')} className="text-primary-700 hover:underline">
                                        Create the first one
                                    </Link>
                                    .
                                </td>
                            </tr>
                        )}
                        {bills.data.map((b) => {
                            const due = parseFloat(b.grand_total) - parseFloat(b.paid_amount);
                            return (
                                <tr key={b.id} className="border-t border-ink-200 hover:bg-ink-50">
                                    <td className="px-4 py-3">
                                        <Link href={route('admin.bills.show', b.id)} className="ref hover:underline">
                                            {b.invoice_number}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-ink-600 money">{b.bill_date}</td>
                                    <td className="px-4 py-3 text-ink-900">
                                        {b.customer ? (
                                            <>
                                                <span className="ref text-ink-500 mr-1">{b.customer.code}</span>
                                                {b.customer.name}
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right money text-ink-900">{b.grand_total}</td>
                                    <td className="px-4 py-3 text-right money-pos">{b.paid_amount}</td>
                                    <td className={`px-4 py-3 text-right ${due > 0 ? 'money-neg' : 'money-muted'}`}>
                                        {due > 0 ? due.toFixed(2) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center">{billStatus(b)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {bills.last_page > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-ink-500">
                    <div>Showing {bills.from}–{bills.to} of {bills.total}</div>
                    <div className="flex gap-1">
                        {bills.links.map((link, i) => (
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
