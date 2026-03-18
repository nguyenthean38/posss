<?php
class StaffController {
    private $db;
    private $userModel;
    private $tokenModel;
    private $logModel;

    public function __construct($db) {
        $this->db = $db;
        $this->userModel = new User($db);
        $this->tokenModel = new PasswordToken($db);
        $this->logModel = new Log($db);
    }

    // [POST] /api/staff
    // Tạo nhân viên mới (UC-01) - Admin Only
    public function createStaff($data) {
        AuthMiddleware::checkAdmin();
        $adminId = $_SESSION['user_id'];

        $fullName = $data['full_name'] ?? '';
        $email = $data['email'] ?? '';
        $mssvTruongNhom = "B1902001"; // Default cho Mật khẩu tạm như yêu cầu

        if (empty($fullName) || empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::json(["message" => "Thông tin không hợp lệ!"], 400);
        }

        if ($this->userModel->findByEmail($email)) {
            Response::json(["message" => "Email đã được sử dụng ở tài khoản khác!"], 400);
        }

        $newStaffId = $this->userModel->createStaff($fullName, $email, $mssvTruongNhom);
        if ($newStaffId) {
            $this->logModel->createLog($adminId, 'create_staff', "Tạo tài khoản: " . $email);
            
            // UC-36: Khởi tạo Token và gửi Link Email
            $token = $this->tokenModel->createToken($newStaffId);
            if ($token) {
                // UC-02: Gửi mail
                $sent = Mailer::sendLoginLink($email, $token);
                if($sent) {
                    Response::json(["message" => "Tạo thành công, đã gửi kích hoạt link 1 phút tới hộp thư!"]);
                } else {
                    $this->logModel->createLog($adminId, 'mail_error', "Gửi mail thất bại cho: " . $email);
                    Response::json(["message" => "Tạo tài khoản thành công nhưng không gửi được Email"], 201);
                }
            }
        }
        Response::json(["message" => "Server Error"], 500);
    }

    // [POST] /api/staff/{id}/resend
    // Gửi lại link email 1 phút (UC-11) - Admin Only
    public function resendActivation($staffId) {
        AuthMiddleware::checkAdmin();
        
        $this->tokenModel->voidOldTokens($staffId); // Hủy token cũ
        
        // Cần truyền biến $email. Code nên fetch userby id nhưng tôi tạm mô phỏng (cần query by ID)
        $query = "SELECT email FROM users WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$staffId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) Response::json(["message" => "User không tồn tại!"], 404);
        
        $email = $row['email'];
        $token = $this->tokenModel->createToken($staffId);
        
        if ($token && Mailer::sendLoginLink($email, $token)) {
            $this->logModel->createLog($_SESSION['user_id'], 'resend_email_staff', "Đã gửi lại link kích hoạt cho: " . $email);
            Response::json(["message" => "Gửi lại link kích hoạt thành công!"]);
        }
        Response::json(["message" => "Lỗi server tạo Token/Mail"], 500);
    }

    // [GET] /api/staff
    // UC-08: Xem danh sách nhân viên (Admin only)
    public function listStaff() {
        AuthMiddleware::checkAdmin();

        // Lấy tham số phân trang + filter từ query string
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 20;
        $emailKeyword = isset($_GET['email']) ? trim($_GET['email']) : '';
        $status = isset($_GET['status']) ? trim($_GET['status']) : null;

        $result = $this->userModel->getStaffList($page, $limit, $emailKeyword, $status);

        // Ghi log xem danh sách nhân viên
        $this->logModel->createLog($_SESSION['user_id'], 'view_staff_list', 'Xem danh sách nhân viên');

        Response::json($result);
    }

    // [GET] /api/staff/{id}
    // UC-09: Xem chi tiết nhân viên (Admin only)
    public function showStaffDetail($staffId) {
        AuthMiddleware::checkAdmin();

        $staffId = (int)$staffId;
        if ($staffId <= 0) {
            Response::json(["message" => "ID nhân viên không hợp lệ"], 400);
        }

        $staff = $this->userModel->getStaffById($staffId);
        if (!$staff) {
            Response::json(["message" => "Nhân viên không tồn tại"], 404);
        }

        // Lấy lịch sử đăng nhập / thao tác gần đây (có thể lọc theo action nếu muốn)
        $logs = $this->logModel->getLogsByUser($staffId, 20);

        $this->logModel->createLog($_SESSION['user_id'], 'view_staff_detail', 'Xem chi tiết nhân viên ID=' . $staffId);

        Response::json([
            'staff' => $staff,
            'logs' => $logs,
        ]);
    }

    // [PATCH] /api/staff/{id}/lock
    // UC-10: Khóa tài khoản nhân viên
    public function lockStaff($staffId) {
        AuthMiddleware::checkAdmin();

        $staffId = (int)$staffId;
        if ($staffId <= 0) {
            Response::json(["message" => "ID nhân viên không hợp lệ"], 400);
        }

        $staff = $this->userModel->getStaffById($staffId);
        if (!$staff) {
            Response::json(["message" => "Nhân viên không tồn tại"], 404);
        }

        if ($staff['status'] === 'locked') {
            Response::json(["message" => "Tài khoản đã ở trạng thái khóa"], 200);
        }

        if ($this->userModel->updateStatus($staffId, 'locked')) {
            $this->logModel->createLog($_SESSION['user_id'], 'lock_staff', 'Khóa tài khoản nhân viên ID=' . $staffId);
            Response::json(["message" => "Khóa tài khoản thành công"]);
        }

        Response::json(["message" => "Lỗi server khi khóa tài khoản"], 500);
    }

    // [PATCH] /api/staff/{id}/unlock
    // UC-10: Mở khóa tài khoản nhân viên
    public function unlockStaff($staffId) {
        AuthMiddleware::checkAdmin();

        $staffId = (int)$staffId;
        if ($staffId <= 0) {
            Response::json(["message" => "ID nhân viên không hợp lệ"], 400);
        }

        $staff = $this->userModel->getStaffById($staffId);
        if (!$staff) {
            Response::json(["message" => "Nhân viên không tồn tại"], 404);
        }

        if ($staff['status'] === 'active') {
            Response::json(["message" => "Tài khoản đã ở trạng thái hoạt động"], 200);
        }

        if ($this->userModel->updateStatus($staffId, 'active')) {
            $this->logModel->createLog($_SESSION['user_id'], 'unlock_staff', 'Mở khóa tài khoản nhân viên ID=' . $staffId);
            Response::json(["message" => "Mở khóa tài khoản thành công"]);
        }

        Response::json(["message" => "Lỗi server khi mở khóa tài khoản"], 500);
    }
}
