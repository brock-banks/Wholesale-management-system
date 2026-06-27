<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'product_id', 'product_name', 'product_sku',
        'unit_price', 'requested_qty', 'confirmed_qty', 'notes', 'sort_order',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'requested_qty' => 'integer',
        'confirmed_qty' => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
