<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class ReturnRecord extends Model
{
    use SoftDeletes;

    protected $table = 'returns';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'return_number', 'customer_id', 'location_id', 'bill_id',
        'return_date', 'subtotal', 'total', 'reason', 'status', 'created_by',
    ];

    protected $casts = [
        'return_date' => 'date',
        'subtotal' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    public function location(): BelongsTo { return $this->belongsTo(Location::class); }
    public function bill(): BelongsTo { return $this->belongsTo(Bill::class); }
    public function items(): HasMany { return $this->hasMany(ReturnItem::class, 'return_id'); }

    public static function nextNumber(): string
    {
        return DB::transaction(function () {
            $last = static::withTrashed()
                ->where('return_number', 'like', 'RET-%')
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();
            $n = $last ? ((int) substr($last->return_number, 4)) + 1 : 1;
            return 'RET-'.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
        });
    }
}
