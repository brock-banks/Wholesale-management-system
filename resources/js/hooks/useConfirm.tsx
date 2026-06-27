import { ReactNode, useState, useCallback } from 'react';
import ConfirmDialog from '@/Components/ConfirmDialog';

interface ConfirmOptions {
    title?: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'primary' | 'danger';
    onConfirm: () => void;
}

export function useConfirm() {
    const [opts, setOpts] = useState<ConfirmOptions | null>(null);

    const confirm = useCallback((options: ConfirmOptions) => {
        setOpts(options);
    }, []);

    const close = () => setOpts(null);

    const handleConfirm = () => {
        const fn = opts?.onConfirm;
        setOpts(null);
        if (fn) fn();
    };

    const dialog = (
        <ConfirmDialog
            show={!!opts}
            title={opts?.title}
            message={opts?.message ?? ''}
            confirmLabel={opts?.confirmLabel}
            cancelLabel={opts?.cancelLabel}
            tone={opts?.tone}
            onConfirm={handleConfirm}
            onCancel={close}
        />
    );

    return { confirm, dialog };
}
