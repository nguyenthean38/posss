<?php
class Log {
    private $conn;
    private $table_name = "logs";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Ghi log thao tác
    public function createLog($user_id, $action, $details = "") {
        $query = "INSERT INTO " . $this->table_name . " (user_id, action, details) VALUES (:user_id, :action, :details)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':action', $action);
        $stmt->bindParam(':details', $details);
        return $stmt->execute();
    }

    // Lấy lịch sử log theo user (ví dụ: lịch sử đăng nhập)
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
}
