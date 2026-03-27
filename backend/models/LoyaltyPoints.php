<?php

/**
 * Tích điểm khi mua hàng (POS): floor(tổng tiền / VND_PER_POINT) điểm, ghi ledger + cập nhật customers.loyalty_points.
 */
class LoyaltyPoints {
    private $conn;

    /** Số VND (tổng đơn) cho 1 điểm — ví dụ 100000 = 1 điểm / 100k VND */
    const VND_PER_POINT = 100000;

    public function __construct($db) {
        $this->conn = $db;
    }

    public static function calculateEarnPoints($totalAmountVnd) {
        $v = (float)$totalAmountVnd;
        if ($v <= 0) {
            return 0;
        }
        return (int)floor($v / self::VND_PER_POINT);
    }

    /**
     * Ghi nhận điểm trong transaction hiện tại (FOR UPDATE khách).
     *
     * @return array{points:int,balance_after:int}|null
     */
    public function earnForOrder($customerId, $orderId, $totalAmount) {
        $customerId = (int)$customerId;
        $orderId = (int)$orderId;
        if ($customerId < 1 || $orderId < 1) {
            return null;
        }

        $points = self::calculateEarnPoints($totalAmount);
        if ($points < 1) {
            return null;
        }

        $stmt = $this->conn->prepare('SELECT loyalty_points FROM customers WHERE id = :id FOR UPDATE');
        $stmt->bindParam(':id', $customerId, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        $balanceBefore = (int)$row['loyalty_points'];
        $newBalance = $balanceBefore + $points;

        $ins = $this->conn->prepare(
            'INSERT INTO customer_point_ledger (customer_id, order_id, delta, balance_after, reason)
             VALUES (:cid, :oid, :delta, :bal, \'earn_checkout\')'
        );
        $ins->bindParam(':cid', $customerId, PDO::PARAM_INT);
        $ins->bindParam(':oid', $orderId, PDO::PARAM_INT);
        $ins->bindParam(':delta', $points, PDO::PARAM_INT);
        $ins->bindParam(':bal', $newBalance, PDO::PARAM_INT);
        $ins->execute();

        $upd = $this->conn->prepare('UPDATE customers SET loyalty_points = :bal WHERE id = :id');
        $upd->bindParam(':bal', $newBalance, PDO::PARAM_INT);
        $upd->bindParam(':id', $customerId, PDO::PARAM_INT);
        $upd->execute();

        return ['points' => $points, 'balance_after' => $newBalance];
    }
}
