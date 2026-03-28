<?php

require_once __DIR__ . '/../config/LoyaltyVoucherRules.php';

/**
 * Phiếu ưu đãi theo tier: phát hành khi đủ điều kiện, đổi khi checkout.
 */
class VoucherService {

    public static function tierDateValid(array $tier): bool {
        $today = date('Y-m-d');
        if (!empty($tier['valid_from']) && $tier['valid_from'] > $today) {
            return false;
        }
        if (!empty($tier['valid_to']) && $tier['valid_to'] < $today) {
            return false;
        }
        return true;
    }

    public static function computeDiscount(array $tier, float $subtotal): float {
        $subtotal = max(0, $subtotal);
        $amt = isset($tier['discount_amount_vnd']) && $tier['discount_amount_vnd'] !== null
            ? (float)$tier['discount_amount_vnd'] : 0;
        if ($amt > 0) {
            return min($amt, $subtotal);
        }
        $pct = isset($tier['discount_percent']) && $tier['discount_percent'] !== null
            ? (int)$tier['discount_percent'] : 0;
        if ($pct > 0) {
            return (float)floor($subtotal * $pct / 100);
        }
        return 0;
    }

    public static function generateCode(PDO $pdo): string {
        for ($i = 0; $i < 20; $i++) {
            $code = strtoupper(bin2hex(random_bytes(6)));
            $st = $pdo->prepare('SELECT COUNT(*) FROM customer_vouchers WHERE code = ?');
            $st->execute([$code]);
            if ((int)$st->fetchColumn() === 0) {
                return $code;
            }
        }
        return strtoupper(bin2hex(random_bytes(8)));
    }

    /**
     * Khóa và tải phiếu + tier; trả null nếu không hợp lệ.
     */
    public static function lockVoucherForRedeem(PDO $pdo, int $voucherId, int $customerId): ?array {
        $sql = 'SELECT cv.id, cv.customer_id, cv.tier_id, cv.status, cv.code,
                       vt.name, vt.min_points_required, vt.min_lifetime_spend_vnd,
                       vt.discount_amount_vnd, vt.discount_percent, vt.valid_from, vt.valid_to, vt.active
                FROM customer_vouchers cv
                INNER JOIN voucher_tiers vt ON vt.id = cv.tier_id
                WHERE cv.id = :vid AND cv.customer_id = :cid
                FOR UPDATE';
        $st = $pdo->prepare($sql);
        $st->execute([':vid' => $voucherId, ':cid' => $customerId]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if (!$row || $row['status'] !== 'issued') {
            return null;
        }
        if (!(int)$row['active']) {
            return null;
        }
        if (!self::tierDateValid($row)) {
            return null;
        }
        return $row;
    }

    public static function markVoucherUsed(PDO $pdo, int $voucherId, int $orderId): void {
        $st = $pdo->prepare(
            "UPDATE customer_vouchers SET status = 'used', used_at = NOW(), order_id = :oid WHERE id = :vid AND status = 'issued'"
        );
        $st->execute([':oid' => $orderId, ':vid' => $voucherId]);
    }

    public static function incrementLifetimeSpend(PDO $pdo, int $customerId, float $deltaSubtotal): void {
        if ($deltaSubtotal <= 0) {
            return;
        }
        $st = $pdo->prepare('UPDATE customers SET lifetime_spend_vnd = COALESCE(lifetime_spend_vnd, 0) + :d WHERE id = :id');
        $st->execute([':d' => $deltaSubtotal, ':id' => $customerId]);
    }

    /**
     * Phát hành phiếu cho các tier đủ điều kiện (chưa có phiếu issued trùng tier).
     */
    public static function issueEligibleVouchers(PDO $pdo, int $customerId): void {
        $st = $pdo->prepare('SELECT id, COALESCE(lifetime_spend_vnd, 0) AS ls, loyalty_points FROM customers WHERE id = ? FOR UPDATE');
        $st->execute([$customerId]);
        $c = $st->fetch(PDO::FETCH_ASSOC);
        if (!$c) {
            return;
        }
        $lifetime = (float)$c['ls'];
        $points = (int)$c['loyalty_points'];

        $tiers = $pdo->query('SELECT * FROM voucher_tiers WHERE active = 1')->fetchAll(PDO::FETCH_ASSOC);
        foreach ($tiers as $tier) {
            if (!self::tierDateValid($tier)) {
                continue;
            }
            if ($lifetime < (float)$tier['min_lifetime_spend_vnd']) {
                continue;
            }
            if ($points < (int)$tier['min_points_required']) {
                continue;
            }
            $tid = (int)$tier['id'];
            $chk = $pdo->prepare(
                'SELECT COUNT(*) FROM customer_vouchers WHERE customer_id = ? AND tier_id = ? AND status = \'issued\''
            );
            $chk->execute([$customerId, $tid]);
            if ((int)$chk->fetchColumn() > 0) {
                continue;
            }
            $code = self::generateCode($pdo);
            $ins = $pdo->prepare(
                'INSERT INTO customer_vouchers (customer_id, tier_id, code, status, issued_at) VALUES (?, ?, ?, \'issued\', NOW())'
            );
            $ins->execute([$customerId, $tid, $code]);
        }
    }

    public static function getSummaryForPhone(PDO $pdo, string $phone): array {
        $phone = trim($phone);
        if ($phone === '') {
            return ['error' => 'empty_phone'];
        }
        $stmt = $pdo->prepare(
            'SELECT id, full_name AS name, phone_number AS phone, loyalty_points, COALESCE(lifetime_spend_vnd, 0) AS lifetime_spend_vnd
             FROM customers WHERE phone_number = ? LIMIT 1'
        );
        $stmt->execute([$phone]);
        $cust = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$cust) {
            return ['customer' => null, 'lifetime_spend_vnd' => 0, 'loyalty_points' => 0, 'vouchers' => [], 'eligible_tiers_preview' => []];
        }
        $cid = (int)$cust['id'];

        $v = $pdo->prepare(
            'SELECT cv.id, cv.code, cv.status, cv.tier_id, vt.name AS tier_name,
                    vt.discount_amount_vnd, vt.discount_percent, vt.min_lifetime_spend_vnd, vt.min_points_required,
                    vt.valid_from, vt.valid_to
             FROM customer_vouchers cv
             INNER JOIN voucher_tiers vt ON vt.id = cv.tier_id
             WHERE cv.customer_id = ? AND cv.status = \'issued\'
             ORDER BY cv.issued_at DESC'
        );
        $v->execute([$cid]);
        $vouchers = $v->fetchAll(PDO::FETCH_ASSOC);

        $tiers = $pdo->query('SELECT * FROM voucher_tiers WHERE active = 1 ORDER BY min_lifetime_spend_vnd ASC, min_points_required ASC')->fetchAll(PDO::FETCH_ASSOC);
        $preview = [];
        $lifetime = (float)$cust['lifetime_spend_vnd'];
        $pts = (int)$cust['loyalty_points'];
        foreach ($tiers as $t) {
            if (!self::tierDateValid($t)) {
                continue;
            }
            $preview[] = [
                'tier_id' => (int)$t['id'],
                'name' => $t['name'],
                'min_lifetime_spend_vnd' => (float)$t['min_lifetime_spend_vnd'],
                'min_points_required' => (int)$t['min_points_required'],
                'eligible' => $lifetime >= (float)$t['min_lifetime_spend_vnd'] && $pts >= (int)$t['min_points_required'],
                'discount_preview_vnd' => self::computeDiscount($t, 1000000),
            ];
        }

        return [
            'customer' => $cust,
            'lifetime_spend_vnd' => $lifetime,
            'loyalty_points' => $pts,
            'vouchers' => $vouchers,
            'eligible_tiers_preview' => $preview,
        ];
    }
}
