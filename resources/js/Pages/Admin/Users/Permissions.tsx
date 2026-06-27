import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

interface Props {
    permissions: string[];
    roles: string[];
    matrix: Record<string, string[]>;
}

const ROLE_LABEL: Record<string, string> = { admin: 'Admin', staff: 'Staff', accounts: 'Accounts' };

const PERM_LABEL: Record<string, string> = {
    'locations.manage': 'Manage locations',
    'categories.manage': 'Manage categories',
    'products.view': 'View products',
    'products.manage': 'Manage products',
    'customers.view': 'View customers',
    'customers.manage': 'Manage customers',
    'bills.view': 'View bills',
    'bills.create': 'Create bills (POS)',
    'bills.cancel': 'Cancel bills',
    'payments.view': 'View payments',
    'payments.record': 'Record payments',
    'returns.view': 'View returns',
    'returns.record': 'Record returns',
    'orders.view': 'View orders',
    'orders.action': 'Confirm / hold / cancel orders',
    'reports.view': 'View reports',
    'audit.view': 'View audit log',
    'settings.manage': 'Manage settings',
    'backups.manage': 'Manage backups',
    'users.manage': 'Manage internal users',
};

export default function PermissionsMatrix({ permissions, roles, matrix }: Props) {
    const groups: Record<string, string[]> = {};
    permissions.forEach((p) => {
        const group = p.split('.')[0];
        groups[group] ??= [];
        groups[group].push(p);
    });

    return (
        <AdminLayout
            title="Permission matrix"
            actions={
                <Link href={route('admin.users.index')} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">
                    Back to users
                </Link>
            }
        >
            <Head title="Permissions" />

            <p className="text-sm text-ink-500 mb-4">
                Read-only view of what each role can do. Permissions are defined in code (PermissionSeeder.php) and re-applied on every seed.
            </p>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs sticky top-0">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Permission</th>
                            {roles.map((r) => (
                                <th key={r} className="text-center font-medium px-4 py-3 w-28">{ROLE_LABEL[r]}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groups).map(([group, perms]) => (
                            <>
                                <tr key={`group-${group}`} className="bg-ink-50 border-t border-ink-200">
                                    <td colSpan={1 + roles.length} className="px-4 py-2 text-xs font-medium text-ink-700 uppercase tracking-wide">
                                        {group}
                                    </td>
                                </tr>
                                {perms.map((p) => (
                                    <tr key={p} className="border-t border-ink-200">
                                        <td className="px-4 py-2.5">
                                            <div className="text-ink-900">{PERM_LABEL[p] ?? p}</div>
                                            <div className="text-xs text-ink-500 ref">{p}</div>
                                        </td>
                                        {roles.map((r) => (
                                            <td key={r} className="px-4 py-2.5 text-center">
                                                {matrix[r]?.includes(p) ? (
                                                    <span className="text-success">✓</span>
                                                ) : (
                                                    <span className="text-ink-300">—</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
