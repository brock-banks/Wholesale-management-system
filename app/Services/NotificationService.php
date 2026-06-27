<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\Customer;
use App\Models\User;

class NotificationService
{
    public function notifyUser(User $user, string $type, string $title, ?string $message = null, ?string $link = null): AppNotification
    {
        return AppNotification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'link' => $link,
        ]);
    }

    public function notifyAdmins(string $type, string $title, ?string $message = null, ?string $link = null): void
    {
        User::role('admin')->get()->each(
            fn (User $u) => $this->notifyUser($u, $type, $title, $message, $link),
        );
    }

    public function notifyCustomer(Customer $customer, string $type, string $title, ?string $message = null, ?string $link = null): void
    {
        if ($customer->user_id && $customer->user) {
            $this->notifyUser($customer->user, $type, $title, $message, $link);
        }
    }
}
