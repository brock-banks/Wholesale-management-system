import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Location } from '@/types';
import { useConfirm } from '@/hooks/useConfirm';

export default function LocationsIndex({ locations }: { locations: Location[] }) {
    const { confirm, dialog } = useConfirm();
    const handleDelete = (l: Location) => {
        confirm({
            title: 'Delete location?',
            message: <>This will remove <b>{l.name}</b>. Stock attached to this location will need to be transferred first.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('admin.locations.destroy', l.id)),
        });
    };

    return (
        <AdminLayout
            title="Locations"
            actions={
                <Link
                    href={route('admin.locations.create')}
                    className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    New location
                </Link>
            }
        >
            <Head title="Locations" />
            {dialog}

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Code</th>
                            <th className="text-left font-medium px-4 py-3">Name</th>
                            <th className="text-left font-medium px-4 py-3">Phone</th>
                            <th className="text-left font-medium px-4 py-3">Address</th>
                            <th className="font-medium px-4 py-3">Status</th>
                            <th className="font-medium px-4 py-3 w-32"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {locations.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-ink-500">
                                    No locations yet.{' '}
                                    <Link href={route('admin.locations.create')} className="text-primary-700 hover:underline">
                                        Add the first one
                                    </Link>
                                    .
                                </td>
                            </tr>
                        )}
                        {locations.map((l) => (
                            <tr key={l.id} className="border-t border-ink-200">
                                <td className="px-4 py-3 ref">{l.code}</td>
                                <td className="px-4 py-3 text-ink-900">
                                    {l.name}
                                    {l.is_default && (
                                        <span className="badge badge-paid ml-2">Default</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-ink-600 money">{l.phone || '—'}</td>
                                <td className="px-4 py-3 text-ink-600">{l.address || '—'}</td>
                                <td className="px-4 py-3 text-center">
                                    {l.is_active ? (
                                        <span className="badge badge-paid">Active</span>
                                    ) : (
                                        <span className="badge badge-draft">Inactive</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={route('admin.locations.edit', l.id)}
                                        className="text-primary-700 hover:underline mr-3"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(l)}
                                        className="text-danger hover:underline"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
