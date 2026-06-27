import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

export function useMoney() {
    const { settings } = usePage<PageProps>().props;
    const currency = settings?.currency_code ?? 'PKR';

    return {
        currency,
        format: (n: number | string | null | undefined, opts?: { withCurrency?: boolean }) => {
            const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
            const num = Number.isFinite(v) ? v : 0;
            const formatted = num.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
            return opts?.withCurrency === false ? formatted : `${currency} ${formatted}`;
        },
    };
}
