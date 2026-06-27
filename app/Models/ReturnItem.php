<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnItem extends Model
{
    protected $fillable = [
        'return_id', 'product_id', 'product_name', 'product_sku',
        'unit_price', 'quantity', 'line_total',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'quantity' => 'integer',
        'line_total' => 'decimal:2',
    ];

    public function return(): BelongsTo { return $this->belongsTo(ReturnRecord::class, 'return_id'); }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
}
