<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::query()
            ->with(['photos:id,product_id,path,sort_order', 'category:id,name'])
            ->where('is_active', true)
            ->when($request->string('search')->trim()->value(), function ($q, $term) {
                $q->where(function ($w) use ($term) {
                    $w->where('name', 'like', "%{$term}%")
                        ->orWhere('sku', 'like', "%{$term}%");
                });
            })
            ->when($request->integer('category_id'), fn ($q, $id) => $q->where('category_id', $id))
            ->orderBy('name')
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('Portal/Catalog', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $request->string('search')->value(),
                'category_id' => $request->integer('category_id') ?: null,
            ],
        ]);
    }
}
