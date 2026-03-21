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

            if (session_status() === PHP_SESSION_NONE) { session_start(); }
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
            Response::json(["message" => "Link kích hoạt đã hết hạn hoặc đã được dùng rồi. Vui lòng liên hệ Admin để gửi lại email mới!"], 400);
        }

        $hash = $this->userModel->password_hash;
        if ($hash === null || $hash === '') {
            Response::json(["message" => "Tài khoản chưa có mật khẩu tạm. Liên hệ Admin."], 401);
        }

        // Nhiều dạng nhập (normalize đặc tả, trim, hoặc hash cũ trước khi normalize)
        $verified = $this->verifyStaffTempPassword((string)$tmpPassword, $hash);
        if ($verified) {
            $this->tokenModel->markAsUsed($tokenId);
            
            if (session_status() === PHP_SESSION_NONE) { session_start(); }
            $_SESSION['user_id'] = $this->userModel->id;
            $_SESSION['role'] = $this->userModel->role;
            $_SESSION['is_first_login'] = true; // Bắt buộc chuyển UC-04
            
            $this->logModel->createLog($_SESSION['user_id'], 'first_login', 'Xác thực qua email lần đầu');
            Response::json(["message" => "Xác nhận thành công. Vui lòng đổi mật khẩu!", "require_password_change" => true]);
        }
        Response::json(["message" => "Sai mật khẩu tạm thời!"], 401);
    }

    /**
     * So khớp mật khẩu tạm với bcrypt đã lưu (tương thích nhiều cách hash cũ).
     */
    private function verifyStaffTempPassword(string $input, string $hash): bool {
        // Chỉ biến thể từ input người dùng (không thêm MSSV cứng — tránh chấp nhận mọi input khi hash trùng MSSV)
        $candidates = array_unique(array_filter([
            User::normalizeTempPassword($input),
            trim($input),
            $input,
        ], static function ($v) {
            return $v !== null && $v !== '';
        }));

        foreach ($candidates as $plain) {
            if (password_verify($plain, $hash)) {
                return true;
            }
        }
        return false;
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

    // [PUT] /api/auth/change-password
    // UC-14: Đổi mật khẩu khi đã có mật khẩu hiện tại
    public function changePassword($data) {
        AuthMiddleware::checkAuth();

        $currentPass = $data['current_password'] ?? '';
        $newPass = $data['new_password'] ?? '';
        $confirmPass = $data['confirm_password'] ?? '';

        if (strlen($currentPass) === 0 || strlen($newPass) === 0 || strlen($confirmPass) === 0) {
            Response::json(["message" => "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới"], 400);
        }

        // Một số rule đơn giản cho mật khẩu mới
        if (strlen($newPass) < 6) {
            Response::json(["message" => "Mật khẩu mới phải từ 6 ký tự trở lên"], 400);
        }
        if ($newPass !== $confirmPass) {
            Response::json(["message" => "Xác nhận mật khẩu mới không khớp"], 400);
        }

        $userId = $_SESSION['user_id'];

        // Lấy thông tin user hiện tại để kiểm tra mật khẩu cũ
        $stmt = $this->db->prepare("SELECT password_hash FROM users WHERE id = :id LIMIT 1");
        $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            Response::json(["message" => "Không tìm thấy người dùng"], 404);
        }

        if (!password_verify($currentPass, $row['password_hash'])) {
            Response::json(["message" => "Mật khẩu hiện tại không đúng"], 401);
        }

        // Cập nhật mật khẩu mới
        if ($this->userModel->updatePassword($userId, $newPass, false)) {
            $this->logModel->createLog($userId, 'change_password', 'Đã đổi mật khẩu');
            Response::json(["message" => "Đổi mật khẩu thành công"]);
        }

        Response::json(["message" => "Lỗi server khi đổi mật khẩu"], 500);
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

    // [GET] /api/auth/me
    // UC-12: Xem thông tin cá nhân
    public function me() {
        AuthMiddleware::checkAuth();

        $userId = $_SESSION['user_id'];
        $profile = $this->userModel->getProfileById($userId);

        if (!$profile) {
            Response::json(["message" => "Không tìm thấy thông tin người dùng"], 404);
        }

        // Ghi log xem hồ sơ cá nhân
        $this->logModel->createLog($userId, 'view_profile', 'Xem thông tin cá nhân');

        Response::json(['profile' => $profile]);
    }

    // [POST] /api/auth/profile
    // UC-13: Cập nhật hồ sơ & ảnh đại diện
    public function updateProfile() {
        AuthMiddleware::checkAuth();

        $userId = $_SESSION['user_id'];

        // Lấy họ tên từ form-data
        $fullName = isset($_POST['full_name']) ? trim($_POST['full_name']) : null;

        // Xử lý upload ảnh đại diện (tùy chọn)
        $avatarPath = null;
        if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE) {
            if ($_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
                Response::json(["message" => "Lỗi upload file ảnh đại diện"], 400);
            }

            $fileTmp = $_FILES['avatar']['tmp_name'];
            $fileSize = $_FILES['avatar']['size'];
            $fileName = $_FILES['avatar']['name'];

            // Giới hạn dung lượng 2MB
            $maxSize = 2 * 1024 * 1024;
            if ($fileSize > $maxSize) {
                Response::json(["message" => "Ảnh đại diện vượt quá 2MB"], 400);
            }

            // Kiểm tra định dạng JPG/PNG
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $fileTmp);
            finfo_close($finfo);

            $allowed = [
                'image/jpeg' => '.jpg',
                'image/png' => '.png',
            ];

            if (!isset($allowed[$mimeType])) {
                Response::json(["message" => "Chỉ hỗ trợ ảnh JPG hoặc PNG"], 400);
            }

            $extension = $allowed[$mimeType];

            // Tên file an toàn: user_{id}_timestamp_random.ext
            $safeBaseName = 'user_' . $userId . '_' . time() . '_' . bin2hex(random_bytes(4));
            $safeFileName = $safeBaseName . $extension;

            $uploadDir = __DIR__ . '/../uploads/avatars';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $targetPath = $uploadDir . '/' . $safeFileName;
            if (!move_uploaded_file($fileTmp, $targetPath)) {
                Response::json(["message" => "Không thể lưu ảnh đại diện trên server"], 500);
            }

            // Lưu đường dẫn tương đối để FE dùng
            $avatarPath = 'uploads/avatars/' . $safeFileName;
        }

        if ($fullName === null && $avatarPath === null) {
            Response::json(["message" => "Không có dữ liệu nào để cập nhật"], 400);
        }

        if ($this->userModel->updateProfile($userId, $fullName, $avatarPath)) {
            $this->logModel->createLog($userId, 'update_profile', 'Cập nhật hồ sơ cá nhân');

            $updated = $this->userModel->getProfileById($userId);
            Response::json([
                "message" => "Cập nhật hồ sơ thành công",
                "profile" => $updated
            ]);
        }

        Response::json(["message" => "Lỗi server khi cập nhật hồ sơ"], 500);
    }
}
