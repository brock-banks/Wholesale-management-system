<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LocationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Locations/Index', [
            'locations' => Location::orderByDesc('is_default')->orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Locations/Form', [
            'location' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($data) {
            if ($data['is_default'] ?? false) {
                Location::query()->update(['is_default' => false]);
            }
            Location::create($data);
        });

        return redirect()
            ->route('admin.locations.index')
            ->with('success', 'Location created.');
    }

    public function edit(Location $location): Response
    {
        return Inertia::render('Admin/Locations/Form', [
            'location' => $location,
        ]);
    }

    public function update(Request $request, Location $location): RedirectResponse
    {
        $data = $this->validated($request, $location->id);

        DB::transaction(function () use ($data, $location) {
            if ($data['is_default'] ?? false) {
                Location::query()->where('id', '!=', $location->id)->update(['is_default' => false]);
            }
            $location->update($data);
        });

        return redirect()
            ->route('admin.locations.index')
            ->with('success', 'Location updated.');
    }

    public function destroy(Location $location): RedirectResponse
    {
        if ($location->is_default) {
            return back()->with('error', 'Cannot delete the default location.');
        }
        $location->delete();

        return redirect()
            ->route('admin.locations.index')
            ->with('success', 'Location deleted.');
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:16', 'unique:locations,code' . ($ignoreId ? ",$ignoreId" : '')],
            'name' => ['required', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'is_active' => ['boolean'],
            'is_default' => ['boolean'],
        ]);
    }
}
