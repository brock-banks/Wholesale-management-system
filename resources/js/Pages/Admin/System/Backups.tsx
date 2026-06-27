import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useConfirm } from '@/hooks/useConfirm';

interface BackupFile {
    name: string;
    size_kb: number;
    created_at: string;
}

export default function Backups({ backups, mysqldump_path }: { backups: BackupFile[]; mysqldump_path: string | null }) {
    const { confirm, dialog } = useConfirm();
    const createBackup = () => {
        confirm({
            title: 'Create database backup?',
            message: 'A new mysqldump file will be written to storage/app/backups.',
            confirmLabel: 'Backup now',
            tone: 'primary',
            onConfirm: () => router.post(route('admin.backups.create')),
        });
    };

    return (
        <AdminLayout
            title="Backups"
            actions={
                <button onClick={createBackup} disabled={!mysqldump_path} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
                    Backup now
                </button>
            }
        >
            <Head title="Backups" />
            {dialog}

            <div className="bg-white border border-ink-200 rounded-lg p-4 mb-4 text-sm">
                <p className="text-ink-700">
                    {mysqldump_path ? (
                        <>Using <span className="ref">{mysqldump_path}</span></>
                    ) : (
                        <span className="text-danger">mysqldump not found on standard paths. Install XAMPP or set up mysqldump.</span>
                    )}
                </p>
                <p className="text-xs text-ink-500 mt-1">Backups are saved to <span className="ref">storage/app/backups/</span></p>
            </div>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">File</th>
                            <th className="text-right font-medium px-4 py-3">Size</th>
                            <th className="text-left font-medium px-4 py-3">Created</th>
                            <th className="font-medium px-4 py-3 w-32"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {backups.length === 0 && (
                            <tr><td colSpan={4} className="px-4 py-12 text-center text-ink-500">No backups yet. Click "Backup now" to create one.</td></tr>
                        )}
                        {backups.map((b) => (
                            <tr key={b.name} className="border-t border-ink-200">
                                <td className="px-4 py-3 ref">{b.name}</td>
                                <td className="px-4 py-3 text-right money text-ink-600">{b.size_kb.toFixed(1)} KB</td>
                                <td className="px-4 py-3 text-ink-600 money">{b.created_at}</td>
                                <td className="px-4 py-3 text-right">
                                    <a href={route('admin.backups.download', b.name)} className="text-primary-700 hover:underline">Download</a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
