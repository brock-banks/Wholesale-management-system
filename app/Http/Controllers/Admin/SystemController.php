<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LedgerEntry;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SystemController extends Controller
{
    public function audit(Request $request): Response
    {
        $tab = $request->string('tab')->value() ?: 'stock';

        if ($tab === 'ledger') {
            $rows = LedgerEntry::query()
                ->with('customer:id,code,name', 'user:id,name')
                ->orderByDesc('id')
                ->paginate(50)
                ->withQueryString();
        } else {
            $rows = StockMovement::query()
                ->with('product:id,sku,name', 'location:id,code,name', 'user:id,name')
                ->orderByDesc('id')
                ->paginate(50)
                ->withQueryString();
        }

        return Inertia::render('Admin/Audit/Index', [
            'tab' => $tab,
            'rows' => $rows,
        ]);
    }

    public function backups(): Response
    {
        $dir = storage_path('app/backups');
        if (! File::exists($dir)) File::makeDirectory($dir, 0755, true);

        $files = collect(File::files($dir))
            ->sortByDesc(fn ($f) => $f->getMTime())
            ->values()
            ->map(fn ($f) => [
                'name' => $f->getFilename(),
                'size_kb' => round($f->getSize() / 1024, 1),
                'created_at' => date('Y-m-d H:i:s', $f->getMTime()),
            ])
            ->all();

        return Inertia::render('Admin/System/Backups', [
            'backups' => $files,
            'mysqldump_path' => $this->findMysqldump(),
        ]);
    }

    public function createBackup(Request $request): RedirectResponse
    {
        $dir = storage_path('app/backups');
        if (! File::exists($dir)) File::makeDirectory($dir, 0755, true);

        $mysqldump = $this->findMysqldump();
        if (! $mysqldump) {
            return back()->with('error', 'mysqldump not found. Set the path manually or run a backup from CLI.');
        }

        $filename = 'wholesale-'.now()->format('Y-m-d_His').'.sql';
        $path = $dir.DIRECTORY_SEPARATOR.$filename;

        $db = config('database.connections.mysql');
        $cmd = sprintf(
            '"%s" -h %s -P %s -u %s %s %s > "%s" 2>&1',
            $mysqldump,
            escapeshellarg($db['host']),
            escapeshellarg((string) $db['port']),
            escapeshellarg($db['username']),
            $db['password'] ? '-p'.escapeshellarg($db['password']) : '',
            escapeshellarg($db['database']),
            $path,
        );

        @exec($cmd, $output, $exitCode);
        if ($exitCode !== 0) {
            @unlink($path);
            return back()->with('error', 'Backup failed. ' . implode(' ', array_slice($output, 0, 3)));
        }

        return back()->with('success', "Backup created: $filename");
    }

    public function downloadBackup(string $file): BinaryFileResponse
    {
        $dir = storage_path('app/backups');
        $path = $dir.DIRECTORY_SEPARATOR.basename($file);
        abort_unless(File::exists($path) && str_starts_with(realpath($path) ?: '', realpath($dir) ?: ''), 404);
        return response()->download($path);
    }

    private function findMysqldump(): ?string
    {
        foreach (['C:/xampp/mysql/bin/mysqldump.exe', 'C:/laragon/bin/mysql/mysql-8.0.30-winx64/bin/mysqldump.exe', '/usr/bin/mysqldump'] as $candidate) {
            if (file_exists($candidate)) return $candidate;
        }
        return null;
    }
}
