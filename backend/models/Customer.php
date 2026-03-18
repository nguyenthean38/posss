<?php

class Customer {
    private $conn;
    private $table_name = "customers";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Tìm khách hàng theo số điện thoại (UC-20)
    public function findByPhone($phoneNumber) {
        $sql = "SELECT id, full_name, phone_number, address
                FROM " . $this->table_name . "
                WHERE phone_number = :phone
                LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':phone', $phoneNumber);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    // Kiểm tra trùng SĐT (UC-21)
    public function existsByPhone($phoneNumber, $excludeId = null) {
        $sql = "SELECT id FROM " . $this->table_name . " WHERE phone_number = :phone";
        if ($excludeId !== null) {
            $sql .= " AND id <> :exclude_id";
        }
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':phone', $phoneNumber);
        if ($excludeId !== null) {
            $stmt->bindParam(':exclude_id', $excludeId, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    // Tạo khách hàng mới (UC-21)
    public function create($fullName, $phoneNumber, $address = null) {
        $sql = "INSERT INTO " . $this->table_name . " (full_name, phone_number, address)
                VALUES (:full_name, :phone, :address)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':full_name', $fullName);
        $stmt->bindParam(':phone', $phoneNumber);
        $stmt->bindParam(':address', $address);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function findById($id) {
        $sql = "SELECT id, full_name, phone_number, address
                FROM " . $this->table_name . "
                WHERE id = :id
                LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * UC-22: Tổng quan mua hàng của khách (đơn hàng, tổng tiền, số sản phẩm đã mua).
     */
    public function getPurchaseOverview($customerId, $recentOrdersLimit = 10) {
        $customerId = (int)$customerId;

        $sqlOrders = "SELECT COUNT(*) AS order_count,
                             COALESCE(SUM(total_amount), 0) AS total_amount,
                             MIN(created_at) AS first_purchase_at,
                             MAX(created_at) AS last_purchase_at
                      FROM orders
                      WHERE customer_id = :cid";
        $stmt = $this->conn->prepare($sqlOrders);
        $stmt->bindParam(':cid', $customerId, PDO::PARAM_INT);
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC) ?: [
            'order_count' => 0,
            'total_amount' => 0,
            'first_purchase_at' => null,
            'last_purchase_at' => null,
        ];

        $sqlItems = "SELECT COALESCE(SUM(od.quantity), 0) AS total_product_quantity
                     FROM order_details od
                     INNER JOIN orders o ON o.id = od.order_id
                     WHERE o.customer_id = :cid";
        $stmt2 = $this->conn->prepare($sqlItems);
        $stmt2->bindParam(':cid', $customerId, PDO::PARAM_INT);
        $stmt2->execute();
        $rowItems = $stmt2->fetch(PDO::FETCH_ASSOC);
        $totalQty = isset($rowItems['total_product_quantity']) ? (int)$rowItems['total_product_quantity'] : 0;

        $limit = max(1, min(50, (int)$recentOrdersLimit));
        $sqlRecent = "SELECT id, total_amount, customer_pay, change_amount, created_at
                      FROM orders
                      WHERE customer_id = :cid
                      ORDER BY created_at DESC
                      LIMIT " . (int)$limit;
        $stmt3 = $this->conn->prepare($sqlRecent);
        $stmt3->bindParam(':cid', $customerId, PDO::PARAM_INT);
        $stmt3->execute();
        $recentOrders = $stmt3->fetchAll(PDO::FETCH_ASSOC);

        return [
            'order_count' => (int)$stats['order_count'],
            'total_amount' => (float)$stats['total_amount'],
            'total_product_quantity' => $totalQty,
            'first_purchase_at' => $stats['first_purchase_at'],
            'last_purchase_at' => $stats['last_purchase_at'],
            'recent_orders' => $recentOrders,
        ];
    }
}

