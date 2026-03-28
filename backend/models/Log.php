<?php
class Log {
    private $conn;
    private $table_name = "logs";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function createLog($user_id, $action, $details = "") {
        $query = "INSERT INTO " . $this->table_name . " (user_id, action, details) VALUES (:user_id, :action, :details)";
        $stmt = $this->conn->prepare($query);
        if ($user_id === null || $user_id === '') {
            $stmt->bindValue(':user_id', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':user_id', (int)$user_id, PDO::PARAM_INT);
        }
        $stmt->bindParam(':action', $action);
        $stmt->bindParam(':details', $details);
        return $stmt->execute();
    }

    public function getLogsByUser($user_id, $limit = 20) {
        $sql = "SELECT id, action, details, created_at
                FROM " . $this->table_name . "
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT :limit";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Nhật ký ra/vào cho admin: chỉ nhân viên (staff), chỉ login / logout / first_login.
     */
    public function getAdminList($page = 1, $limit = 50, $keyword = '') {
        $page = max(1, (int)$page);
        $limit = max(1, min(200, (int)$limit));
        $offset = ($page - 1) * $limit;

        $where = "WHERE u.role = 'staff'
                AND l.action IN ('login','logout','first_login')";
        $params = [];
        if ($keyword !== '') {
            // Mỗi LIKE cần placeholder tên riêng (PDO MySQL native prepare không gắn :kw lặp lại).
            $where .= ' AND (l.details LIKE :kw_details OR u.full_name LIKE :kw_name OR u.email LIKE :kw_email)';
            $like = '%' . $keyword . '%';
            $params[':kw_details'] = $like;
            $params[':kw_name'] = $like;
            $params[':kw_email'] = $like;
        }

        $sql = "SELECT l.id, l.user_id, l.details, l.created_at,
                       u.full_name AS user_name,
                       u.email AS user_email
                FROM " . $this->table_name . " l
                INNER JOIN users u ON u.id = l.user_id
                $where
                ORDER BY l.created_at DESC, l.id DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $tz = new DateTimeZone('Asia/Ho_Chi_Minh');
        foreach ($items as &$row) {
            if (!empty($row['created_at'])) {
                $raw = $row['created_at'];
                $dt = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $raw, $tz);
                if (!$dt) {
                    $dt = new DateTimeImmutable($raw, $tz);
                }
                $row['created_at'] = $dt->format('c');
            }
        }
        unset($row);

        $countSql = "SELECT COUNT(*) AS total FROM " . $this->table_name . " l
                INNER JOIN users u ON u.id = l.user_id
                $where";
        $countStmt = $this->conn->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        return [
            'items' => $items,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'total_pages' => (int)ceil($total / $limit),
            ],
        ];
    }
}
