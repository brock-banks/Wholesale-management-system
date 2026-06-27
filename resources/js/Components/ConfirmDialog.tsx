import { ReactNode, useEffect } from 'react';

export interface ConfirmDialogProps {
    show: boolean;
    title?: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'primary' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    show,
    title = 'Are you sure?',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'danger',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!show) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
            if (e.key === 'Enter') onConfirm();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [show, onCancel, onConfirm]);

    if (!show) return null;

    const confirmClass =
        tone === 'danger'
            ? 'bg-danger hover:opacity-90 text-white'
            : 'bg-primary-700 hover:bg-primary-800 text-white';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-gray-500/75" onClick={onCancel} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <h3 className="text-lg font-medium text-ink-900">{title}</h3>
                    <div className="mt-3 text-sm text-ink-600">{message}</div>
                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 rounded text-sm font-medium border border-ink-200 text-ink-700 hover:bg-ink-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`px-4 py-2 rounded text-sm font-medium ${confirmClass}`}
                            autoFocus
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
