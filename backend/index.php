<?php
// CORS Headers cho phép Frontend (HTML/JS) gọi API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Xử lý preflight request của CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Gọi các file Config & Core
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/core/Mailer.php';

// Cấu hình Session cho Authentication
session_start();
require_once __DIR__ . '/middlewares/AuthMiddleware.php';

// Require Models
require_once __DIR__ . '/models/User.php';
require_once __DIR__ . '/models/PasswordToken.php';
require_once __DIR__ . '/models/Log.php';

// Require Controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/StaffController.php';

// Khởi tạo DB connection
$database = new Database();
$db = $database->getConnection();

// Lấy Body Payload (JSON Parse)
$data = json_decode(file_get_contents("php://input"), true);
// Parse đường dẫn Path parameters /api/staff/{id}/resend
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Init Controller Instances
$authCtrl = new AuthController($db);
$staffCtrl = new StaffController($db);

// ================ ĐIỀU HƯỚNG ROUTES ================

// [1] Route Đăng nhập thường & đăng nhập lần đầu
if ($uri === '/api/auth/login' && $method === 'POST') {
    $authCtrl->login($data);
}
elseif ($uri === '/api/auth/first-login' && $method === 'POST') {
    $authCtrl->firstLogin($data);
}
elseif ($uri === '/api/auth/verify-token' && $method === 'POST') {
    $authCtrl->verifyToken($data);
}

// [2] Route Bảo vệ: Đổi mật khẩu bắt buộc & Thoát
elseif ($uri === '/api/auth/init-password' && $method === 'PUT') {
    $authCtrl->initPassword($data);
}
elseif ($uri === '/api/auth/logout' && $method === 'POST') {
    $authCtrl->logout();
}

// [3] Admin / Staff Roles
elseif ($uri === '/api/staff' && $method === 'POST') {
    $staffCtrl->createStaff($data);
}
elseif (preg_match('/^\/api\/staff\/(\d+)\/resend$/', $uri, $matches) && $method === 'POST') {
    $staffId = $matches[1];
    $staffCtrl->resendActivation($staffId);
}

// ====================================================
// Trường hợp đường dẫn không hợp lệ
else {
    Response::json(["message" => "Routing không tồn tại hoặc sai HTTP method!"], 404);
}
