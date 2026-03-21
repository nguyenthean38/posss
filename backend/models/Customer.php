<?php

class Customer {
    private $conn;
    private $table_name = "customers";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Lấy danh sách khách hàng
    public function getList($page = 1, $limit = 20, $keyword = '') {
        $offset = ($page - 1) * $limit;
        $where = 'WHERE 1 = 1';
        $params = [];

        if ($keyword !== '') {
            $where .= ' AND (c.full_name LIKE :kw OR c.phone_number LIKE :kw)';
            $params[':kw'] = '%' . $keyword . '%';
        }

        $sql = "SELECT c.id,
                       c.full_name AS name,
                       c.phone_number AS phone,
                       c.address,
                       COUNT(o.id) AS total_orders,
                       COALESCE(SUM(o.total_amount), 0) AS total_revenue
                FROM " . $this->table_name . " c
                LEFT JOIN orders o ON o.customer_id = c.id
                $where
                GROUP BY c.id
                ORDER BY c.id DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($sql);
        foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $countSql = "SELECT COUNT(*) AS total FROM " . $this->table_name . " c " . $where;
        $countStmt = $this->conn->prepare($countSql);
        foreach ($params as $k => $v) { $countStmt->bindValue($k, $v); }
        $countStmt->execute();
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        return [
            'items' => $items,
            'pagination' => [
                'page' => (int)$page,
                'limit' => (int)$limit,
                'total' => $total,
                'total_pages' => (int)ceil($total / $limit),
            ],
        ];
    }

    public function update($id, $fullName, $phoneNumber, $address) {
        $sql = "UPDATE " . $this->table_name . "
                SET full_name = :full_name, phone_number = :phone, address = :address
                WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':full_name', $fullName);
        $stmt->bindParam(':phone', $phoneNumber);
        $stmt->bindParam(':address', $address);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function delete($id) {
        $sql = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    // Tìm khách hàng theo số điện thoại (UC-20)
    public function findByPhone($phoneNumber) {
        $sql = "SELECT id, full_name AS name, phone_number AS phone, address
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
        $sql = "SELECT c.id,
                       c.full_name AS name,
                       c.phone_number AS phone,
                       c.address,
                       COUNT(o.id) AS total_orders,
                       COALESCE(SUM(o.total_amount), 0) AS total_revenue
                FROM " . $this->table_name . " c
                LEFT JOIN orders o ON o.customer_id = c.id
                WHERE c.id = :id
                GROUP BY c.id
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

    public function getPurchaseHistory($customerId, $page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        $sql = "SELECT id as order_id, created_at as date, total_amount as total, 
                       (SELECT SUM(quantity) FROM order_details WHERE order_id = orders.id) as total_quantity
                FROM orders
                WHERE customer_id = :cid
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':cid', $customerId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $sqlCount = "SELECT COUNT(*) as total FROM orders WHERE customer_id = :cid";
        $countStmt = $this->conn->prepare($sqlCount);
        $countStmt->bindParam(':cid', $customerId, PDO::PARAM_INT);
        $countStmt->execute();
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        return [
            'items' => $items,
            'pagination' => [
                'page' => (int)$page,
                'limit' => (int)$limit,
                'total' => $total,
                'total_pages' => (int)ceil($total / $limit)
            ]
        ];
    }

    public function getOrderDetail($orderId) {
        $sql = "SELECT od.product_id, p.product_name, od.quantity, od.unit_price, (od.quantity * od.unit_price) as total_price
                FROM order_details od
                JOIN products p ON p.id = od.product_id
                WHERE od.order_id = :oid";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':oid', $orderId, PDO::PARAM_INT);
        $stmt->execute();
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $sqlOrder = "SELECT customer_pay, change_amount as `change`, total_amount FROM orders WHERE id = :oid LIMIT 1";
        $stmtOrder = $this->conn->prepare($sqlOrder);
        $stmtOrder->bindParam(':oid', $orderId, PDO::PARAM_INT);
        $stmtOrder->execute();
        $order = $stmtOrder->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            return null;
        }

        return [
            'products' => $products,
            'customer_pay' => (float)$order['customer_pay'],
            'change' => (float)$order['change'],
            'total_amount' => (float)$order['total_amount']
        ];
    }
}

