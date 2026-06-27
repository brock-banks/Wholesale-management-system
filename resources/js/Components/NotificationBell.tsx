import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { PageProps } from '@/types';

interface NotificationItem {
    id: number;
    type: string;
    title: string;
    message: string | null;
    link: string | null;
    read_at: string | null;
    created_at: string;
}

export default function NotificationBell() {
    const { props } = usePage<PageProps & { notifications: { unread_count: number; recent: NotificationItem[] } }>();
    const { unread_count, recent } = props.notifications;
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleClick = (n: NotificationItem) => {
        router.post(route('notifications.read', n.id), {}, { preserveScroll: true, preserveState: true });
        if (n.link) {
            setOpen(false);
            router.visit(n.link);
        }
    };

    const markAll = () => {
        router.post(route('notifications.readAll'), {}, { preserveScroll: true, preserveState: true });
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative w-9 h-9 rounded-full hover:bg-ink-100 flex items-center justify-center text-ink-600"
                aria-label="Notifications"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {unread_count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {unread_count > 99 ? '99+' : unread_count}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-11 w-96 bg-white border border-ink-200 rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-2 border-b border-ink-200 flex items-center justify-between">
                        <span className="text-sm font-medium text-ink-900">Notifications</span>
                        {unread_count > 0 && (
                            <button onClick={markAll} className="text-xs text-primary-700 hover:underline">
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-auto">
                        {recent.length === 0 ? (
                            <p className="px-4 py-8 text-sm text-ink-500 text-center">No notifications yet.</p>
                        ) : (
                            recent.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => handleClick(n)}
                                    className={`w-full text-left px-4 py-3 hover:bg-ink-50 border-b border-ink-100 last:border-b-0 ${
                                        !n.read_at ? 'bg-primary-50' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        {!n.read_at && <span className="mt-1.5 w-2 h-2 bg-primary-700 rounded-full flex-shrink-0" />}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-ink-900 truncate">{n.title}</p>
                                            {n.message && <p className="text-xs text-ink-500 truncate">{n.message}</p>}
                                            <p className="text-xs text-ink-400 mt-0.5 money">
                                                {new Date(n.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
