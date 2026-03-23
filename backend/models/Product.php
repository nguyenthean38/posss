<?php

class Product {
    private $conn;
    private $table_name = "products";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Lấy danh sách sản phẩm (admin), bao gồm cả giá nhập
    public function getList($page = 1, $limit = 20, $keyword = '', $categoryId = null) {
        $offset = ($page - 1) * $limit;

        $where = 'WHERE 1 = 1';
        $params = [];

        if ($keyword !== '') {
            $where .= ' AND (p.product_name LIKE :kw OR p.barcode LIKE :kw)';
            $params[':kw'] = '%' . $keyword . '%';
        }

        if ($categoryId !== null && $categoryId !== '') {
            $where .= ' AND p.category_id = :category_id';
            $params[':category_id'] = (int)$categoryId;
        }

        $sql = "SELECT p.id, p.category_id, c.category_name, p.product_name, p.barcode,
                       p.image, p.import_price, p.selling_price, p.stock_quantity, p.created_at
                FROM " . $this->table_name . " p
                LEFT JOIN categories c ON p.category_id = c.id
                $where
                ORDER BY p.id DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $countSql = "SELECT COUNT(*) AS total FROM " . $this->table_name . " p " . $where;
        $countStmt = $this->conn->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
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

    public function findById($id) {
        $sql = "SELECT p.id, p.category_id, c.category_name, p.product_name, p.barcode,
                       p.image, p.import_price, p.selling_price, p.stock_quantity, p.created_at
                FROM " . $this->table_name . " p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.id = :id LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function existsBarcode($barcode, $excludeId = null) {
        $sql = "SELECT id FROM " . $this->table_name . " WHERE barcode = :barcode";
        if ($excludeId !== null) {
            $sql .= " AND id <> :excludeId";
        }
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':barcode', $barcode);
        if ($excludeId !== null) {
            $stmt->bindParam(':excludeId', $excludeId, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function create($categoryId, $name, $barcode, $image, $importPrice, $sellingPrice, $stockQuantity) {
        $sql = "INSERT INTO " . $this->table_name . "
                (category_id, product_name, barcode, image, import_price, selling_price, stock_quantity)
                VALUES (:category_id, :product_name, :barcode, :image, :import_price, :selling_price, :stock_quantity)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
        $stmt->bindParam(':product_name', $name);
        $stmt->bindParam(':barcode', $barcode);
        $stmt->bindParam(':image', $image);
        $stmt->bindParam(':import_price', $importPrice);
        $stmt->bindParam(':selling_price', $sellingPrice);
        $stmt->bindParam(':stock_quantity', $stockQuantity, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function update($id, $categoryId, $name, $barcode, $image, $importPrice, $sellingPrice, $stockQuantity) {
        $fields = [
            'category_id = :category_id',
            'product_name = :product_name',
            'barcode = :barcode',
            'import_price = :import_price',
            'selling_price = :selling_price',
            'stock_quantity = :stock_quantity'
        ];
        $params = [
            ':category_id' => $categoryId,
            ':product_name' => $name,
            ':barcode' => $barcode,
            ':import_price' => $importPrice,
            ':selling_price' => $sellingPrice,
            ':stock_quantity' => $stockQuantity,
            ':id' => $id
        ];

        // Chỉ update image nếu có giá trị mới
        if ($image !== null) {
            $fields[] = 'image = :image';
            $params[':image'] = $image;
        }

        $sql = "UPDATE " . $this->table_name . " SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        foreach ($params as $key => $value) {
            if ($key === ':id' || $key === ':category_id' || $key === ':stock_quantity') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        return $stmt->execute();
    }

    // Kiểm tra sản phẩm đã xuất hiện trong bất kỳ chi tiết đơn hàng nào chưa
    public function hasOrderDetails($productId) {
        $sql = "SELECT 1 FROM order_details WHERE product_id = :product_id LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':product_id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function delete($id) {
        $sql = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}

