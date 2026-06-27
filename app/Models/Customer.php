<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'name', 'phone', 'address', 'email', 'user_id', 'sales_rep_id',
        'opening_balance', 'current_balance', 'credit_limit',
        'is_active', 'notes',
    ];

    public function salesRep(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_rep_id');
    }

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(LedgerEntry::class)->orderBy('entry_date')->orderBy('id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function cart()
    {
        return $this->orders()->where('status', Order::STATUS_DRAFT)->latest('id')->first();
    }

    public function hasCredit(float $amount): bool
    {
        if ((float) $this->credit_limit <= 0) {
            return true;
        }
        return ((float) $this->current_balance + $amount) <= (float) $this->credit_limit;
    }

    public static function nextCode(): string
    {
        $last = static::withTrashed()
            ->where('code', 'like', 'C-%')
            ->orderByDesc('id')
            ->first();
        $n = $last ? ((int) substr($last->code, 2)) + 1 : 1;

        return 'C-'.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
    }
}
