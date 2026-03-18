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
}
