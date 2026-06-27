import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useConfirm } from '@/hooks/useConfirm';

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: string | null;
    commission_rate?: number;
    created_at: string | null;
}

const ROLE_LABEL: Record<string, string> = { admin: 'Admin', staff: 'Staff', accounts: 'Accounts', sales_rep: 'Sales rep' };

export default function UsersIndex({ users }: { users: UserRow[] }) {
    const { confirm, dialog } = useConfirm();
    const handleDelete = (u: UserRow) => {
        confirm({
            title: 'Delete user?',
            message: <>This will remove <b>{u.name}</b> ({u.email}). They will no longer be able to sign in.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('admin.users.destroy', u.id)),
        });
    };

    return (
        <AdminLayout
            title="Internal users"
            actions={
                <div className="flex gap-2">
                    <Link href={route('admin.permissions')} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">
                        Permission matrix
                    </Link>
                    <Link href={route('admin.users.create')} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium">
                        New user
                    </Link>
                </div>
            }
        >
            <Head title="Users" />
            {dialog}

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Name</th>
                            <th className="text-left font-medium px-4 py-3">Email</th>
                            <th className="font-medium px-4 py-3">Role</th>
                            <th className="text-left font-medium px-4 py-3">Created</th>
                            <th className="font-medium px-4 py-3 w-32"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-12 text-center text-ink-500">No internal users yet.</td></tr>
                        )}
                        {users.map((u) => (
                            <tr key={u.id} className="border-t border-ink-200">
                                <td className="px-4 py-3 text-ink-900">{u.name}</td>
                                <td className="px-4 py-3 text-ink-600 ref">{u.email}</td>
                                <td className="px-4 py-3 text-center">
                                    {u.role && (
                                        <span className={`badge ${
                                            u.role === 'admin' ? 'badge-paid' :
                                            u.role === 'staff' ? 'badge-pending' :
                                            u.role === 'sales_rep' ? 'badge-reviewing' :
                                            'badge-confirmed'
                                        }`}>{ROLE_LABEL[u.role] ?? u.role}</span>
                                    )}
                                    {u.role === 'sales_rep' && typeof u.commission_rate === 'number' && u.commission_rate > 0 && (
                                        <div className="text-xs text-ink-500 mt-1 money">{u.commission_rate.toFixed(2)}%</div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-ink-600 money text-xs">{u.created_at}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('admin.users.activity', u.id)} className="text-primary-700 hover:underline mr-3">Activity</Link>
                                    <Link href={route('admin.users.edit', u.id)} className="text-primary-700 hover:underline mr-3">Edit</Link>
                                    <button onClick={() => handleDelete(u)} className="text-danger hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
