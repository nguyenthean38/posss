<?php
class AuthController {
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

    // [POST] /api/auth/login
    // Xử lý đăng nhập thông thường (UC-05)
    public function login($data) {
        // Theo yêu cầu đề bài, người dùng nhập "tên đăng nhập"
        // là phần trước dấu @ của email (vd: admin@gmail.com -> username = admin)
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        if (trim($username) === '' || trim($password) === '') {
            Response::json(["message" => "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!"], 400);
        }

        // Tìm user theo username (phần trước @ của email)
        if (!$this->userModel->findByUsername($username)) {
            Response::json(["message" => "Tài khoản không tồn tại!"], 401);
        }

        if ($this->userModel->status === 'locked') {
            Response::json(["message" => "Tài khoản của bạn đã bị khóa!"], 403);
        }

        if (password_verify($password, $this->userModel->password_hash)) {
            // UC-03: Nhân viên mới không được log in thường nếu chưa verify
            if ($this->userModel->is_first_login && $this->userModel->role == 'staff') {
                Response::json(["message" => "Vui lòng đăng nhập bằng link trong email!"], 403);
            }

            session_start();
            $_SESSION['user_id'] = $this->userModel->id;
            $_SESSION['role'] = $this->userModel->role;
            $_SESSION['is_first_login'] = (bool)$this->userModel->is_first_login;

            $this->logModel->createLog($_SESSION['user_id'], 'login', 'Đăng nhập thành công');

            Response::json([
                "message" => "Đăng nhập thành công!",
                "user" => [
                    "id" => $this->userModel->id,
                    "full_name" => $this->userModel->full_name,
                    "role" => $this->userModel->role,
                    "is_first_login" => (bool)$this->userModel->is_first_login
                ]
            ]);
        }
        Response::json(["message" => "Sai mật khẩu!"], 401);
    }

    // [POST] /api/auth/verify-token
    // Xác thực token 1 phút (UC-37)
    public function verifyToken($data) {
        $email = $data['email'] ?? '';
        $token = $data['token'] ?? '';

        if (!$this->userModel->findByEmail($email)) {
            Response::json(["message" => "Email không hợp lệ!"], 400);
        }

        $tokenId = $this->tokenModel->findValidToken($token, $this->userModel->id);
        if ($tokenId) {
            Response::json(["message" => "Token hợp lệ", "IsValid" => true]);
        }
        Response::json(["message" => "Token hết hạn hoặc không hợp lệ!", "IsValid" => false], 400);
    }

    // [POST] /api/auth/first-login
    // Đăng nhập lần đầu thông qua UC-03 (Token verify ok)
    public function firstLogin($data) {
        $email = $data['email'] ?? '';
        $tmpPassword = $data['password'] ?? '';
        $token = $data['token'] ?? '';

        if (!$this->userModel->findByEmail($email)) {
            Response::json(["message" => "Email không tồn tại!"], 404);
        }

        $tokenId = $this->tokenModel->findValidToken($token, $this->userModel->id);
        if (!$tokenId) {
            Response::json(["message" => "Token không hợp lệ hoặc đã hết hạn!"], 400);
        }

        if (password_verify($tmpPassword, $this->userModel->password_hash)) {
            $this->tokenModel->markAsUsed($tokenId);
            
            session_start();
            $_SESSION['user_id'] = $this->userModel->id;
            $_SESSION['role'] = $this->userModel->role;
            $_SESSION['is_first_login'] = true; // Bắt buộc chuyển UC-04
            
            $this->logModel->createLog($_SESSION['user_id'], 'first_login', 'Xác thực qua email lần đầu');
            Response::json(["message" => "Xác nhận thành công. Vui lòng đổi mật khẩu!", "require_password_change" => true]);
        }
        Response::json(["message" => "Sai mật khẩu tạm thời!"], 401);
    }

    // [PUT] /api/auth/init-password
    // Thiết lập đổi mật khẩu lần đầu tiên (UC-04)
    public function initPassword($data) {
        AuthMiddleware::checkAuth();
        
        $newPass = $data['new_password'] ?? '';
        $confirmPass = $data['confirm_password'] ?? '';

        if(strlen($newPass) < 6) Response::json(["message" => "Mật khẩu phải từ 6 ký tự!"], 400);
        if($newPass !== $confirmPass) Response::json(["message" => "Xác nhận mật khẩu không khớp!"], 400);

        $userId = $_SESSION['user_id'];
        if ($this->userModel->updatePassword($userId, $newPass, true)) {
            $_SESSION['is_first_login'] = false; // Phá vỡ Block UC-07
            $this->logModel->createLog($userId, 'init_password', 'Đã đổi mật khẩu bắt buộc lần đầu');
            Response::json(["message" => "Thay đổi mật khẩu thành công! Bạn đã có thể tiếp tục sử dụng hệ thống."]);
        }
        Response::json(["message" => "Lỗi server"], 500);
    }

    // [POST] /api/auth/logout
    public function logout() {
        // Đảm bảo người dùng đang đăng nhập (đúng tiền điều kiện UC-06)
        AuthMiddleware::checkAuth();

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Xóa toàn bộ dữ liệu session hiện tại
        $_SESSION = [];

        // Thu hồi cookie phiên nếu đang sử dụng session cookie
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        session_destroy();

        // FE nhận message này và tự chuyển hướng về trang đăng nhập
        Response::json(["message" => "Đã đăng xuất thành công!"]);
    }
}
