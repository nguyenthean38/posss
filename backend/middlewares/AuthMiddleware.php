<?php
class AuthMiddleware {
    public static function checkAuth() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (!isset($_SESSION['user_id'])) {
            Response::json(["message" => "Vui lòng đăng nhập!"], 401);
        }
        
        // UC-07 Chặn thao tác nếu chưa đổi mật khẩu lần đầu (ngoại trừ đổi mật khẩu)
        // Request_uri cho phép gọi logout hoặc init-password
        $allowedUris = ['/api/auth/init-password', '/api/auth/logout'];
        
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $uri = str_replace(['/backend/index.php', '/backend'], '', $uri);
        
        if (isset($_SESSION['is_first_login']) && $_SESSION['is_first_login'] === true) {
            if (!in_array($uri, $allowedUris)) {
                Response::json(["message" => "Tài khoản cần đổi mật khẩu lần đầu. Vui lòng đổi mật khẩu!"], 403);
            }
        }
    }

    public static function checkAdmin() {
        self::checkAuth();
        if ($_SESSION['role'] !== 'admin') {
            Response::json(["message" => "Bạn không có quyền thực hiện chức năng này!"], 403);
        }
    }
}
