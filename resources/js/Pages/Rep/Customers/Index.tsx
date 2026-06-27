import RepLayout from '@/Layouts/RepLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useMoney } from '@/hooks/useMoney';

interface Customer {
    id: number;
    code: string;
    name: string;
    phone: string | null;
    address: string | null;
    current_balance: string;
    credit_limit: string;
}

interface Props {
    customers: Customer[];
    filters: { search: string | null };
}

export default function RepCustomersIndex({ customers, filters }: Props) {
    const { format: fmt } = useMoney();
    const [search, setSearch] = useState(filters.search ?? '');

    const apply = (term: string) =>
        router.get(route('rep.customers.index'), { search: term }, { preserveState: true, replace: true });

    return (
        <RepLayout title="My customers">
            <Head title="Customers" />

            <input
                type="search"
                placeholder="Search name, code, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') apply(search);
                }}
                className="input w-full mb-3"
            />

            {customers.length === 0 ? (
                <div className="bg-white border border-ink-200 rounded-lg p-8 text-center">
                    <p className="text-sm text-ink-500">No customers assigned to you yet.</p>
                    <p className="text-xs text-ink-400 mt-1">Ask admin to assign you to a customer.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {customers.map((c) => {
                        const balance = parseFloat(c.current_balance);
                        const balanceTone = balance > 0 ? 'text-danger' : balance < 0 ? 'text-success' : 'text-ink-700';
                        return (
                            <Link
                                key={c.id}
                                href={route('rep.customers.show', c.id)}
                                className="block bg-white border border-ink-200 hover:border-primary-300 rounded-lg p-3"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-ink-900 truncate">{c.name}</p>
                                        <p className="ref text-xs">{c.code}</p>
                                        {c.phone && <p className="text-xs text-ink-500 mt-0.5 mono">{c.phone}</p>}
                                    </div>
                                    <div className="text-right ml-2">
                                        <p className="text-xs text-ink-500">Balance</p>
                                        <p className={`text-sm font-medium money ${balanceTone}`}>{fmt(balance, { withCurrency: false })}</p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </RepLayout>
    );
}
