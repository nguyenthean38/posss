<?php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $full_name;
    public $email;
    public $password_hash;
    public $role;
    public $avatar;
    public $is_first_login;
    public $status;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Tìm kiếm bằng email (dùng cho các flow cần email đầy đủ)
    public function findByEmail($email) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $email);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            return false;
        }

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->hydrateFromRow($row);
        return true;
    }

    // Tìm kiếm bằng username (phần trước dấu @ của email) theo đúng đề bài
    public function findByUsername($username) {
        // VD username = 'admin' sẽ match email 'admin@gmail.com', 'admin@xyz.com', ...
        $query = "SELECT * FROM " . $this->table_name . " WHERE email LIKE :emailPrefix LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $emailPrefix = $username . '@%';
        $stmt->bindParam(':emailPrefix', $emailPrefix);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            return false;
        }

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->hydrateFromRow($row);
        return true;
    }

    // Đổ dữ liệu từ một dòng truy vấn vào các thuộc tính public
    private function hydrateFromRow(array $row): void {
        $this->id = $row['id'];
        $this->full_name = $row['full_name'];
        $this->email = $row['email'];
        $this->password_hash = $row['password_hash'];
        $this->role = $row['role'];
        $this->avatar = $row['avatar'] ?? null;
        $this->is_first_login = $row['is_first_login'];
        $this->status = $row['status'];
        $this->created_at = $row['created_at'] ?? null;
    }

    // Tạo nhân viên mới (tạo tài khoản chưa có password và mặc định chưa kích hoạt)
    public function createStaff($full_name, $email, $mssvTruongNhom) {
        // Hash password mặc định là MSSV trưởng nhóm
        $hashed_pwd = password_hash(strtolower($mssvTruongNhom), PASSWORD_DEFAULT);
        
        $query = "INSERT INTO " . $this->table_name . " 
                  (full_name, email, password_hash, role, is_first_login, status) 
                  VALUES (:full_name, :email, :password_hash, 'staff', TRUE, 'active')";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':full_name', $full_name);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password_hash', $hashed_pwd);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function updatePassword($user_id, $newPassword, $isFirstLoginDone = false) {
        $pwd = password_hash($newPassword, PASSWORD_DEFAULT);
        $query = "UPDATE " . $this->table_name . " 
                  SET password_hash = :pwd" . ($isFirstLoginDone ? ", is_first_login = FALSE" : "") . " 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':pwd', $pwd);
        $stmt->bindParam(':id', $user_id);
        return $stmt->execute();
    }
}
