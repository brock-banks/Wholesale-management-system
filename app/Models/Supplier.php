<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'name', 'contact_name', 'phone', 'email', 'address',
        'opening_balance', 'current_balance',
        'is_active', 'notes',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(SupplierLedgerEntry::class)->orderBy('entry_date')->orderBy('id');
    }

    public static function nextCode(): string
    {
        $last = static::withTrashed()
            ->where('code', 'like', 'S-%')
            ->orderByDesc('id')
            ->first();
        $n = $last ? ((int) substr($last->code, 2)) + 1 : 1;
        return 'S-'.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
    }
}
