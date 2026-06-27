<?php

namespace App\Http\Middleware;

use App\Support\BusinessSettings;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames()->all(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->all(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'notifications' => fn () => $user
                ? [
                    'unread_count' => $user->notifications()->whereNull('read_at')->count(),
                    'recent' => $user->notifications()
                        ->limit(10)
                        ->get(['id', 'type', 'title', 'message', 'link', 'read_at', 'created_at']),
                ]
                : ['unread_count' => 0, 'recent' => []],
            'cart_count' => fn () => $user && $user->customer
                ? (int) ($user->customer->cart()?->items()->count() ?? 0)
                : 0,
            'settings' => fn () => BusinessSettings::forInertia(),
        ];
    }
}
