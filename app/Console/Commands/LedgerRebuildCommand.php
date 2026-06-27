<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\LedgerEntry;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class LedgerRebuildCommand extends Command
{
    protected $signature = 'ledger:rebuild {customer? : Customer id, code, or name (omit for all)} {--dry-run}';
    protected $description = 'Recompute running balances for customer ledgers and backfill missing opening-balance entries';

    public function handle(): int
    {
        $arg = $this->argument('customer');
        $dry = (bool) $this->option('dry-run');

        $query = Customer::query();
        if ($arg) {
            $query->where(function ($q) use ($arg) {
                $q->where('id', $arg)->orWhere('code', $arg)->orWhere('name', 'like', "%{$arg}%");
            });
        }

        $customers = $query->orderBy('id')->get();
        if ($customers->isEmpty()) {
            $this->error('No customers matched.');
            return self::FAILURE;
        }

        $touched = 0;
        foreach ($customers as $customer) {
            $this->line("→ {$customer->code} · {$customer->name}");
            DB::transaction(function () use ($customer, $dry, &$touched) {
                $opening = round((float) $customer->opening_balance, 2);
                $hasOpening = LedgerEntry::where('customer_id', $customer->id)
                    ->where('type', LedgerEntry::TYPE_OPENING)
                    ->exists();

                if (! $hasOpening && abs($opening) > 0.001) {
                    $earliest = LedgerEntry::where('customer_id', $customer->id)
                        ->orderBy('entry_date')->orderBy('id')
                        ->value('entry_date');
                    $date = $earliest ?: $customer->created_at?->toDateString() ?: now()->toDateString();

                    if ($dry) {
                        $this->info("  would insert opening entry: ".number_format($opening, 2)." on {$date}");
                    } else {
                        $entry = LedgerEntry::create([
                            'customer_id' => $customer->id,
                            'entry_date' => $date,
                            'type' => LedgerEntry::TYPE_OPENING,
                            'reference_type' => null,
                            'reference_id' => null,
                            'debit' => $opening > 0 ? $opening : 0,
                            'credit' => $opening < 0 ? -$opening : 0,
                            'running_balance' => $opening,
                            'description' => 'Opening balance',
                            'created_by' => null,
                        ]);
                        // ensure opening sorts first by using id sorted on retrieval
                        $this->info("  inserted opening entry #{$entry->id} ({$opening})");
                    }
                }

                $entries = LedgerEntry::where('customer_id', $customer->id)
                    ->orderBy('entry_date')
                    ->orderByRaw("CASE type WHEN 'opening' THEN 0 ELSE 1 END")
                    ->orderBy('id')
                    ->get();

                $running = 0.0;
                foreach ($entries as $e) {
                    $running += (float) $e->debit - (float) $e->credit;
                    $newRunning = round($running, 2);
                    if (abs((float) $e->running_balance - $newRunning) > 0.001) {
                        if (! $dry) {
                            $e->update(['running_balance' => $newRunning]);
                        }
                        $touched++;
                    }
                }

                $expected = round($running, 2);
                if (abs((float) $customer->current_balance - $expected) > 0.001) {
                    $this->warn("  current_balance was {$customer->current_balance}, recomputed {$expected}");
                    if (! $dry) {
                        $customer->update(['current_balance' => $expected]);
                    }
                }
            });
        }

        $this->newLine();
        if ($dry) {
            $this->info("Dry run complete. {$touched} entries would be updated across {$customers->count()} customer(s).");
        } else {
            $this->info("Rebuilt {$customers->count()} customer ledger(s). {$touched} entries updated.");
        }
        return self::SUCCESS;
    }
}
