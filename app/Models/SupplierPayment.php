<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class SupplierPayment extends Model
{
    use SoftDeletes;

    public const METHOD_CASH = 'cash';
    public const METHOD_CARD = 'card';
    public const METHOD_CHECK = 'check';
    public const METHOD_BANK = 'bank';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_CANCELLED = 'cancelled';

    public const CHECK_PENDING = 'pending';
    public const CHECK_CLEARED = 'cleared';
    public const CHECK_BOUNCED = 'bounced';

    protected $fillable = [
        'payment_number', 'supplier_id', 'payment_date', 'amount', 'method',
        'reference', 'bank_name', 'check_number', 'check_date', 'check_status',
        'status', 'notes', 'created_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'check_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function allocations(): HasMany { return $this->hasMany(SupplierPaymentAllocation::class); }

    public static function nextNumber(): string
    {
        return DB::transaction(function () {
            $last = static::withTrashed()
                ->where('payment_number', 'like', 'SPAY-%')
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();
            $n = $last ? ((int) substr($last->payment_number, 5)) + 1 : 1;
            return 'SPAY-'.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
        });
    }
}
