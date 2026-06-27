<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Payment extends Model
{
    use HasFactory, SoftDeletes;

    public const METHOD_CASH = 'cash';
    public const METHOD_CARD = 'card';
    public const METHOD_CHECK = 'check';
    public const METHOD_BANK = 'bank';
    public const METHOD_DEBIT = 'debit';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_CANCELLED = 'cancelled';

    public const CHECK_PENDING = 'pending';
    public const CHECK_CLEARED = 'cleared';
    public const CHECK_BOUNCED = 'bounced';

    protected $fillable = [
        'payment_number', 'customer_id', 'payment_date', 'amount', 'method',
        'reference', 'bank_name', 'check_number', 'check_date', 'check_status',
        'due_date', 'status', 'notes', 'created_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'check_date' => 'date',
        'due_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    public function ledgerEntries(): MorphMany
    {
        return $this->morphMany(LedgerEntry::class, 'reference');
    }

    public static function nextPaymentNumber(): string
    {
        return DB::transaction(function () {
            $last = static::withTrashed()
                ->where('payment_number', 'like', 'RCT-%')
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();
            $n = $last ? ((int) substr($last->payment_number, 4)) + 1 : 1;
            return 'RCT-'.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
        });
    }
}
