import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ChangeEvent, useState } from 'react';
import { Customer, Paginated } from '@/types';
import { useConfirm } from '@/hooks/useConfirm';

interface Props {
    customers: Paginated<Customer>;
    filters: { search: string | null; status: string | null };
}

export default function CustomersIndex({ customers, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const { confirm, dialog } = useConfirm();

    const applyFilters = (next: { search?: string; status?: string }) => {
        router.get(
            route('admin.customers.index'),
            {
                search: next.search ?? search,
                status: (next.status ?? status) || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleDelete = (c: Customer) => {
        confirm({
            title: 'Delete customer?',
            message: <>This will remove <b>{c.name}</b>. Existing bills and ledger history will be retained but the customer record will be deleted.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('admin.customers.destroy', c.id)),
        });
    };

    const onSearchChange = (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value);
    const onSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') applyFilters({ search });
    };

    const balanceTone = (c: Customer) => {
        const bal = parseFloat(c.current_balance);
        if (bal > 0) return 'money-neg';
        if (bal < 0) return 'money-pos';
        return 'money-muted';
    };

    return (
        <AdminLayout
            title="Customers"
            actions={
                <Link
                    href={route('admin.customers.create')}
                    className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    New customer
                </Link>
            }
        >
            <Head title="Customers" />
            {dialog}

            <div className="flex gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search name, code, phone, email…"
                    value={search}
                    onChange={onSearchChange}
                    onKeyDown={onSearchSubmit}
                    className="input flex-1"
                />
                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        applyFilters({ status: e.target.value });
                    }}
                    className="input w-48"
                >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Code</th>
                            <th className="text-left font-medium px-4 py-3">Name</th>
                            <th className="text-left font-medium px-4 py-3">Phone</th>
                            <th className="text-right font-medium px-4 py-3">Balance</th>
                            <th className="text-right font-medium px-4 py-3">Credit limit</th>
                            <th className="font-medium px-4 py-3">Login</th>
                            <th className="font-medium px-4 py-3">Status</th>
                            <th className="font-medium px-4 py-3 w-32"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.data.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-ink-500">
                                    No customers match these filters.
                                </td>
                            </tr>
                        )}
                        {customers.data.map((c) => (
                            <tr key={c.id} className="border-t border-ink-200">
                                <td className="px-4 py-3 ref">
                                    <Link href={route('admin.customers.show', c.id)} className="text-primary-700 hover:underline">{c.code}</Link>
                                </td>
                                <td className="px-4 py-3 text-ink-900">
                                    <Link href={route('admin.customers.show', c.id)} className="hover:underline">{c.name}</Link>
                                </td>
                                <td className="px-4 py-3 text-ink-600 money">{c.phone || '—'}</td>
                                <td className={`px-4 py-3 text-right ${balanceTone(c)}`}>{c.current_balance}</td>
                                <td className="px-4 py-3 text-right money text-ink-600">
                                    {parseFloat(c.credit_limit) > 0 ? c.credit_limit : '—'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {c.user_id ? (
                                        <span className="badge badge-paid">Enabled</span>
                                    ) : (
                                        <span className="badge badge-draft">No login</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {c.is_active ? (
                                        <span className="badge badge-paid">Active</span>
                                    ) : (
                                        <span className="badge badge-draft">Inactive</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={route('admin.customers.statement', c.id)}
                                        className="text-primary-700 hover:underline mr-3"
                                    >
                                        Statement
                                    </Link>
                                    <Link
                                        href={route('admin.customers.edit', c.id)}
                                        className="text-primary-700 hover:underline mr-3"
                                    >
                                        Edit
                                    </Link>
                                    <button onClick={() => handleDelete(c)} className="text-danger hover:underline">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {customers.last_page > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-ink-500">
                    <div>
                        Showing {customers.from}–{customers.to} of {customers.total}
                    </div>
                    <div className="flex gap-1">
                        {customers.links.map((link, i) => (
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
