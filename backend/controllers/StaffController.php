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
        $mssvTruongNhom = AppConfig::staffTempPassword(); // Một nguồn: AppConfig / env STAFF_TEMP_PASSWORD

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
                    Response::json(["message" => "Tạo thành công, đã gửi kích hoạt link (hiệu lực 1 phút) tới hộp thư!"]);
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

        $query = "SELECT email, role, is_first_login FROM users WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$staffId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            Response::json(["message" => "User không tồn tại!"], 404);
        }

        $email = $row['email'];
        $role = $row['role'] ?? '';
        $ifl = $row['is_first_login'] ?? 0;
        $isFirstLogin = ($ifl === true || $ifl === 1 || $ifl === '1');

        // Staff chưa đổi mật khẩu lần đầu: đồng bộ hash MSSV tạm với cấu hình hiện tại (tránh hash cũ sau đổi AppConfig)
        if ($role === 'staff' && $isFirstLogin) {
            if ($this->userModel->resetStaffTempPasswordHash((int)$staffId)) {
                $this->logModel->createLog($_SESSION['user_id'], 'resend_sync_temp_pwd', 'Đã đồng bộ MK tạm khi gửi lại email staff ID=' . (int)$staffId);
            }
        }

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

    // [DELETE] /api/staff/{id}
    // Xóa tài khoản nhân viên (Admin only)
    public function deleteStaff($staffId) {
        AuthMiddleware::checkAdmin();

        $staffId = (int)$staffId;
        if ($staffId <= 0) {
            Response::json(["message" => "ID nhân viên không hợp lệ"], 400);
        }

        // Không cho xóa chính mình
        if ($staffId === (int)$_SESSION['user_id']) {
            Response::json(["message" => "Không thể xóa tài khoản đang đăng nhập!"], 400);
        }

        $staff = $this->userModel->getStaffById($staffId);
        if (!$staff) {
            Response::json(["message" => "Nhân viên không tồn tại"], 404);
        }

        // Kiểm tra nhân viên có đơn hàng không
        $checkStmt = $this->db->prepare("SELECT COUNT(id) FROM orders WHERE user_id = ?");
        $checkStmt->execute([$staffId]);
        $orderCount = (int)$checkStmt->fetchColumn();
        if ($orderCount > 0) {
            Response::json(["message" => "Không thể xóa nhân viên đã có đơn hàng ({$orderCount} đơn). Hãy khóa tài khoản thay thế."], 400);
        }

        $stmt = $this->db->prepare("DELETE FROM users WHERE id = ? AND role = 'staff'");
        if ($stmt->execute([$staffId])) {
            $this->logModel->createLog($_SESSION['user_id'], 'delete_staff', 'Xóa tài khoản nhân viên ID=' . $staffId);
            Response::json(["message" => "Đã xóa tài khoản nhân viên"]);
        }

        Response::json(["message" => "Lỗi server khi xóa tài khoản"], 500);
    }

    // [GET] /api/staff/{id}/sales
    // Xem thông tin bán hàng của một nhân viên (Admin only)
    public function showStaffSales($staffId) {
        AuthMiddleware::checkAdmin();

        $staffId = (int)$staffId;
        if ($staffId <= 0) {
            Response::json(["message" => "ID nhân viên không hợp lệ"], 400);
        }

        $staff = $this->userModel->getStaffById($staffId);
        if (!$staff) {
            Response::json(["message" => "Nhân viên không tồn tại"], 404);
        }

        // Tổng doanh thu và số đơn hàng của nhân viên này
        $summaryStmt = $this->db->prepare(
            "SELECT COUNT(id) AS total_orders,
                    COALESCE(SUM(total_amount), 0) AS total_revenue
             FROM orders WHERE user_id = :uid"
        );
        $summaryStmt->bindParam(':uid', $staffId, PDO::PARAM_INT);
        $summaryStmt->execute();
        $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

        // 10 đơn hàng gần nhất của nhân viên này
        $ordersStmt = $this->db->prepare(
            "SELECT o.id AS OrderId,
                    DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i') AS Date,
                    COALESCE(c.full_name, 'Khách lẻ') AS CustomerName,
                    o.total_amount AS TotalAmount
             FROM orders o
             LEFT JOIN customers c ON o.customer_id = c.id
             WHERE o.user_id = :uid
             ORDER BY o.created_at DESC
             LIMIT 10"
        );
        $ordersStmt->bindParam(':uid', $staffId, PDO::PARAM_INT);
        $ordersStmt->execute();
        $recentOrders = $ordersStmt->fetchAll(PDO::FETCH_ASSOC);

        Response::json([
            'staff_id'      => $staffId,
            'total_orders'  => (int)$summary['total_orders'],
            'total_revenue' => (float)$summary['total_revenue'],
            'recent_orders' => $recentOrders,
        ]);
    }
}
