import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Paginated, Supplier } from '@/types';
import { useConfirm } from '@/hooks/useConfirm';

export default function SuppliersIndex({ suppliers, filters }: { suppliers: Paginated<Supplier>; filters: { search: string | null } }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const { confirm, dialog } = useConfirm();

    const apply = (q: string) => router.get(route('admin.suppliers.index'), { search: q }, { preserveState: true, replace: true });

    const handleDelete = (s: Supplier) => {
        confirm({
            title: 'Delete supplier?',
            message: <>This will remove <b>{s.name}</b>. Existing POs and ledger entries will be retained.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('admin.suppliers.destroy', s.id)),
        });
    };

    const balanceTone = (s: Supplier) => {
        const bal = parseFloat(s.current_balance);
        if (bal > 0) return 'money-neg';
        if (bal < 0) return 'money-pos';
        return 'money-muted';
    };

    return (
        <AdminLayout
            title="Suppliers"
            actions={
                <Link href={route('admin.suppliers.create')} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium">
                    New supplier
                </Link>
            }
        >
            <Head title="Suppliers" />
            {dialog}

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search name, code, phone…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && apply(search)}
                    className="input w-full"
                />
            </div>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Code</th>
                            <th className="text-left font-medium px-4 py-3">Name</th>
                            <th className="text-left font-medium px-4 py-3">Contact</th>
                            <th className="text-left font-medium px-4 py-3">Phone</th>
                            <th className="text-right font-medium px-4 py-3">Balance (owed)</th>
                            <th className="font-medium px-4 py-3">Status</th>
                            <th className="font-medium px-4 py-3 w-40"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.data.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-500">No suppliers yet.</td></tr>
                        )}
                        {suppliers.data.map((s) => (
                            <tr key={s.id} className="border-t border-ink-200 hover:bg-ink-50">
                                <td className="px-4 py-3 ref">{s.code}</td>
                                <td className="px-4 py-3 text-ink-900">{s.name}</td>
                                <td className="px-4 py-3 text-ink-600 text-xs">{s.contact_name ?? '—'}</td>
                                <td className="px-4 py-3 text-ink-600 money">{s.phone ?? '—'}</td>
                                <td className={`px-4 py-3 text-right ${balanceTone(s)}`}>{s.current_balance}</td>
                                <td className="px-4 py-3 text-center">
                                    {s.is_active ? <span className="badge badge-paid">Active</span> : <span className="badge badge-draft">Inactive</span>}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('admin.suppliers.statement', s.id)} className="text-primary-700 hover:underline mr-3">Statement</Link>
                                    <Link href={route('admin.suppliers.edit', s.id)} className="text-primary-700 hover:underline mr-3">Edit</Link>
                                    <button onClick={() => handleDelete(s)} className="text-danger hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
