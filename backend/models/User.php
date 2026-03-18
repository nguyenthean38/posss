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
    public $phone;
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
        // Cột phone có thể chưa tồn tại trong DB, nên chỉ gán nếu có
        $this->phone = $row['phone'] ?? null;
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

    // Cập nhật trạng thái tài khoản (active / locked)
    public function updateStatus($user_id, $status) {
        $allowed = ['active', 'locked'];
        if (!in_array($status, $allowed, true)) {
            return false;
        }
        $query = "UPDATE " . $this->table_name . " SET status = :status WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $user_id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    // Lấy thông tin chi tiết một nhân viên theo id (không bao gồm mật khẩu)
    public function getStaffById($id) {
        // Không select cột phone vì ERD hiện tại chưa chắc có, FE có thể dùng null
        $sql = "SELECT id, full_name, email, role, status, is_first_login, avatar, created_at
                FROM " . $this->table_name . "
                WHERE id = :id AND role = 'staff' LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    // Lấy danh sách nhân viên với filter tìm kiếm / phân trang cơ bản
    public function getStaffList($page = 1, $limit = 20, $emailKeyword = '', $status = null) {
        $offset = ($page - 1) * $limit;

        $where = "WHERE role = 'staff'";
        $params = [];

        if ($emailKeyword !== '') {
            $where .= " AND email LIKE :email";
            $params[':email'] = '%' . $emailKeyword . '%';
        }

        if ($status !== null && $status !== '') {
            $where .= " AND status = :status";
            $params[':status'] = $status;
        }

        $sql = "SELECT id, full_name, email, role, status, is_first_login 
                FROM " . $this->table_name . " 
                $where
                ORDER BY id DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);

        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Lấy tổng số bản ghi để FE phân trang
        $countSql = "SELECT COUNT(*) AS total FROM " . $this->table_name . " " . $where;
        $countStmt = $this->conn->prepare($countSql);
        foreach ($params as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        return [
            'items' => $rows,
            'pagination' => [
                'page' => (int)$page,
                'limit' => (int)$limit,
                'total' => $total,
                'total_pages' => (int)ceil($total / $limit)
            ]
        ];
    }

    // Lấy thông tin hồ sơ cá nhân cho user hiện tại (không bao gồm mật khẩu)
    public function getProfileById($id) {
        // Tùy ERD thực tế, có thể bổ sung thêm phone/address sau khi có cột
        $sql = "SELECT id, full_name, email, role, status, avatar, created_at
                FROM " . $this->table_name . "
                WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    // Cập nhật hồ sơ cá nhân (họ tên + avatar)
    public function updateProfile($id, $fullName = null, $avatarPath = null) {
        $fields = [];
        $params = [':id' => $id];

        if ($fullName !== null && $fullName !== '') {
            $fields[] = 'full_name = :full_name';
            $params[':full_name'] = $fullName;
        }

        if ($avatarPath !== null) {
            $fields[] = 'avatar = :avatar';
            $params[':avatar'] = $avatarPath;
        }

        if (empty($fields)) {
            // Không có gì để cập nhật
            return false;
        }

        $sql = "UPDATE " . $this->table_name . " SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        return $stmt->execute();
    }
}
