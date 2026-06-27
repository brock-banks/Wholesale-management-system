<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title><?php echo e($payment->payment_number); ?></title>
    <style>
        @page { margin: 24px 28px; }
        body { font-family: DejaVu Sans, sans-serif; color: #1E293B; font-size: 11px; line-height: 1.5; }
        h1 { color: #0F172A; font-weight: 500; margin: 0; }
        .mono { font-family: DejaVu Sans Mono, monospace; }
        .right { text-align: right; }
        .muted { color: #64748B; }
        .small { font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-weight: 500; color: #64748B; font-size: 10px; padding: 6px 8px; border-bottom: 1px solid #CBD5E1; }
        td { padding: 6px 8px; border-bottom: 1px solid #E2E8F0; }
        .header { border-bottom: 2px solid #3F5A78; padding-bottom: 10px; margin-bottom: 14px; }
        .h-brand { color: #3F5A78; font-size: 22px; font-weight: 500; }
        .panel { background: #F8FAFC; padding: 10px 12px; margin-bottom: 12px; }
        .clearfix:after { content: ''; display: block; clear: both; }
        .col-l { width: 60%; float: left; }
        .col-r { width: 38%; float: right; text-align: right; }
        .big-amount { font-size: 28px; font-weight: 500; color: #047857; text-align: center; padding: 20px; background: #ECFDF5; border-radius: 6px; margin: 16px 0; }
        .footer { margin-top: 30px; padding-top: 8px; border-top: 1px solid #E2E8F0; color: #64748B; font-size: 10px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 500; background: #FEF2F2; color: #991B1B; }
    </style>
</head>
<body>
    <div class="header clearfix">
        <div class="col-l">
            <?php if(!empty($business['logo'])): ?>
                <img src="<?php echo e($business['logo']); ?>" alt="" style="max-height: 50px; max-width: 180px; margin-bottom: 6px;">
            <?php endif; ?>
            <p class="h-brand"><?php echo e($business['name']); ?></p>
            <?php if(!empty($business['address'])): ?><p class="muted small"><?php echo e($business['address']); ?></p><?php endif; ?>
            <?php if(!empty($business['phone'])): ?><p class="muted small"><?php echo e($business['phone']); ?></p><?php endif; ?>
        </div>
        <div class="col-r">
            <h1 style="font-size: 18px;">PAYMENT RECEIPT</h1>
            <p class="mono" style="font-size: 13px; margin-top: 4px;"><?php echo e($payment->payment_number); ?></p>
            <p class="mono muted"><?php echo e($payment->payment_date->format('d M Y')); ?></p>
            <?php if($payment->status === 'cancelled'): ?>
                <p style="margin-top: 4px;"><span class="badge">Cancelled</span></p>
            <?php endif; ?>
        </div>
    </div>

    <div class="clearfix">
        <div class="col-l">
            <div class="panel">
                <p class="small muted">Received from</p>
                <p style="font-weight: 500;">
                    <span class="mono muted"><?php echo e($payment->customer->code); ?></span> &middot; <?php echo e($payment->customer->name); ?>

                </p>
                <?php if($payment->customer->phone): ?><p class="small muted mono"><?php echo e($payment->customer->phone); ?></p><?php endif; ?>
                <?php if($payment->customer->address): ?><p class="small muted"><?php echo e($payment->customer->address); ?></p><?php endif; ?>
            </div>
        </div>
        <div class="col-r">
            <div class="panel" style="text-align: left;">
                <p class="small muted">Method</p>
                <p style="font-weight: 500; text-transform: capitalize;"><?php echo e($payment->method); ?></p>
                <?php if($payment->reference): ?>
                    <p class="small muted mono">Ref: <?php echo e($payment->reference); ?></p>
                <?php endif; ?>
                <?php if($payment->check_number): ?>
                    <p class="small muted mono">Check #<?php echo e($payment->check_number); ?><?php echo e($payment->bank_name ? ' · '.$payment->bank_name : ''); ?></p>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <div class="big-amount mono">
        <?php echo e($business['currency'] ?? ''); ?> <?php echo e(number_format($payment->amount, 2)); ?>

    </div>

    <?php if($payment->allocations && $payment->allocations->count() > 0): ?>
        <p class="small muted" style="margin-bottom: 4px;">Applied to invoices</p>
        <table>
            <thead>
                <tr>
                    <th>Invoice</th>
                    <th class="right" style="width: 20%;">Bill total</th>
                    <th class="right" style="width: 20%;">Applied</th>
                </tr>
            </thead>
            <tbody>
                <?php $__currentLoopData = $payment->allocations; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $a): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <tr>
                        <td class="mono"><?php echo e($a->bill->invoice_number ?? '—'); ?></td>
                        <td class="right mono muted"><?php echo e(number_format($a->bill->grand_total ?? 0, 2)); ?></td>
                        <td class="right mono" style="font-weight: 500; color: #047857;"><?php echo e(number_format($a->amount, 2)); ?></td>
                    </tr>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </tbody>
        </table>
    <?php else: ?>
        <p class="small muted" style="text-align: center; padding: 12px;">Held as customer credit (not allocated to a specific invoice).</p>
    <?php endif; ?>

    <?php if($payment->notes): ?>
        <div class="panel" style="margin-top: 16px;">
            <p class="small muted">Notes</p>
            <p><?php echo e($payment->notes); ?></p>
        </div>
    <?php endif; ?>

    <div class="footer">
        <p class="mono">Generated <?php echo e(now()->format('d M Y H:i')); ?> &middot; <?php echo e($business['name']); ?></p>
    </div>
</body>
</html>
<?php /**PATH C:\Users\brock newgate\wholsale system\resources\views/pdf/receipt.blade.php ENDPATH**/ ?>