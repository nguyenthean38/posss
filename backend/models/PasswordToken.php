<?php
class PasswordToken {
    private $conn;
    private $table_name = "password_tokens";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Tạo và lưu Token
    public function createToken($user_id) {
        $raw_token = bin2hex(random_bytes(32)); // Mã ngẫu nhiên không đoán được
        $token_hash = hash('sha256', $raw_token);
        
        // Hạn sử dụng trong 1 phút (theo yêu cầu đề bài)
        $expires_at = date("Y-m-d H:i:s", strtotime('+1 minute'));

        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, token_hash, expires_at, is_used) 
                  VALUES (:user_id, :token_hash, :expires_at, FALSE)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':token_hash', $token_hash);
        $stmt->bindParam(':expires_at', $expires_at);

        if ($stmt->execute()) {
            return $raw_token; // Trả về dạng raw để làm URL
        }
        return false;
    }

    // Tìm token nếu thỏa mãn chưa sử dụng và chưa hết hạn
    public function findValidToken($raw_token, $user_id) {
        $token_hash = hash('sha256', $raw_token);
        $now = date("Y-m-d H:i:s");

        $query = "SELECT id FROM " . $this->table_name . " 
                  WHERE token_hash = :token_hash 
                  AND user_id = :user_id 
                  AND is_used = FALSE 
                  AND expires_at > :now";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':token_hash', $token_hash);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':now', $now);
        $stmt->execute();

        return ($stmt->rowCount() > 0) ? $stmt->fetch(PDO::FETCH_ASSOC)['id'] : false;
    }

    public function markAsUsed($id) {
        $query = "UPDATE " . $this->table_name . " SET is_used = TRUE WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
    
    // Thu hồi các token cũ (khi gửi lại link email)
    public function voidOldTokens($user_id) {
        $query = "UPDATE " . $this->table_name . " SET is_used = TRUE WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        return $stmt->execute();
    }
}
