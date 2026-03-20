<?php

class Category {
    private $conn;
    private $table_name = "categories";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Lấy danh sách danh mục (có phân trang + tìm kiếm theo tên)
    public function getList($page = 1, $limit = 20, $keyword = '') {
        $offset = ($page - 1) * $limit;

        $where = 'WHERE 1 = 1';
        $params = [];

        if ($keyword !== '') {
            $where .= ' AND c.category_name LIKE :kw';
            $params[':kw'] = '%' . $keyword . '%';
        }

        $sql = "SELECT c.id, c.category_name AS name, c.description, c.icon,
                       c.created_at, u.full_name AS created_by_name,
                       COUNT(p.id) AS product_count
                FROM " . $this->table_name . " c
                LEFT JOIN products p ON p.category_id = c.id
                LEFT JOIN users u ON c.created_by = u.id
                $where
                GROUP BY c.id, c.category_name, c.description, c.icon, c.created_at, u.full_name
                ORDER BY c.id DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $countSql = "SELECT COUNT(*) AS total FROM " . $this->table_name . " c " . $where;
        $countStmt = $this->conn->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        return [
            'items' => $items,
            'pagination' => [
                'page'        => (int)$page,
                'limit'       => (int)$limit,
                'total'       => $total,
                'total_pages' => (int)ceil($total / $limit),
            ],
        ];
    }

    public function findById($id) {
        $sql = "SELECT c.id, c.category_name AS name, c.description, c.icon,
                       c.created_at, u.full_name AS created_by_name,
                       COUNT(p.id) AS product_count
                FROM " . $this->table_name . " c
                LEFT JOIN products p ON p.category_id = c.id
                LEFT JOIN users u ON c.created_by = u.id
                WHERE c.id = :id
                GROUP BY c.id, c.category_name, c.description, c.icon, c.created_at, u.full_name
                LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function existsByName($name, $excludeId = null) {
        $sql = "SELECT id FROM " . $this->table_name . " WHERE category_name = :name";
        if ($excludeId !== null) {
            $sql .= " AND id <> :excludeId";
        }
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':name', $name);
        if ($excludeId !== null) {
            $stmt->bindParam(':excludeId', $excludeId, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function create($name, $description = null, $icon = 'other', $createdBy = null) {
        $sql = "INSERT INTO " . $this->table_name . " (category_name, description, icon, created_by)
                VALUES (:name, :description, :icon, :created_by)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':icon', $icon);
        $stmt->bindParam(':created_by', $createdBy, PDO::PARAM_INT);
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function update($id, $name, $description = null, $icon = null) {
        $fields = ['category_name = :name'];
        $params = [':name' => $name, ':id' => $id];

        if ($description !== null) {
            $fields[] = 'description = :description';
            $params[':description'] = $description;
        }

        if ($icon !== null) {
            $fields[] = 'icon = :icon';
            $params[':icon'] = $icon;
        }

        $sql = "UPDATE " . $this->table_name . " SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        return $stmt->execute();
    }

    // Kiểm tra còn sản phẩm thuộc danh mục hay không
    public function hasProducts($id) {
        $sql = "SELECT 1 FROM products WHERE category_id = :id LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
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
