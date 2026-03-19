<?php
// Disable HTML error output - always return JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set error handler to return JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'Server error: ' . $errstr,
        'file' => basename($errfile),
        'line' => $errline
    ]);
    exit;
});

// Set exception handler to return JSON
set_exception_handler(function($exception) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'Exception: ' . $exception->getMessage(),
        'file' => basename($exception->getFile()),
        'line' => $exception->getLine()
    ]);
    exit;
});

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
require_once __DIR__ . '/models/Category.php';
require_once __DIR__ . '/models/Product.php';
require_once __DIR__ . '/models/Customer.php';

// Require Controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/StaffController.php';
require_once __DIR__ . '/controllers/CategoryController.php';
require_once __DIR__ . '/controllers/ProductController.php';
require_once __DIR__ . '/controllers/CustomerController.php';
require_once __DIR__ . '/controllers/PosController.php';
require_once __DIR__ . '/controllers/ReportController.php';
require_once __DIR__ . '/controllers/ProfileController.php';

// Khởi tạo DB connection
// Khởi tạo DB connection
$db = Database::getConnection();

// Lấy Body Payload (JSON Parse)
$data = json_decode(file_get_contents("php://input"), true);
// Parse đường dẫn Path parameters /api/staff/{id}/resend
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Loại bỏ các tiền tố thư mục khỏi URI để match đúng với các routes (vd: /api/auth/login)
$uri = str_replace('/backend/index.php', '', $uri);
$uri = preg_replace('/^\/backend/', '', $uri);

$method = $_SERVER['REQUEST_METHOD'];

// Init Controller Instances
$authCtrl = new AuthController($db);
$staffCtrl = new StaffController($db);
$categoryCtrl = new CategoryController($db);
$productCtrl = new ProductController($db);
$customerCtrl = new CustomerController($db);
$posCtrl = new PosController($db);
$reportCtrl = new ReportController($db);
$profileCtrl = new ProfileController($db);

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
elseif ($uri === '/api/auth/me' && $method === 'GET') {
    $authCtrl->me();
}
elseif ($uri === '/api/auth/change-password' && $method === 'PUT') {
    $authCtrl->changePassword($data);
}
elseif ($uri === '/api/auth/profile' && $method === 'POST') {
    // Cập nhật hồ sơ & ảnh đại diện (multipart/form-data)
    $authCtrl->updateProfile();
}

// [3] Admin / Staff Roles & Danh mục
elseif ($uri === '/api/staff' && $method === 'POST') {
    $staffCtrl->createStaff($data);
}
elseif ($uri === '/api/staff' && $method === 'GET') {
    $staffCtrl->listStaff();
}
elseif (preg_match('/^\/api\/staff\/(\d+)$/', $uri, $matches) && $method === 'GET') {
    $staffId = (int)$matches[1];
    $staffCtrl->showStaffDetail($staffId);
}
elseif (preg_match('/^\/api\/staff\/(\d+)\/lock$/', $uri, $matches) && $method === 'PATCH') {
    $staffId = (int)$matches[1];
    $staffCtrl->lockStaff($staffId);
}
elseif (preg_match('/^\/api\/staff\/(\d+)\/unlock$/', $uri, $matches) && $method === 'PATCH') {
    $staffId = (int)$matches[1];
    $staffCtrl->unlockStaff($staffId);
}
elseif (preg_match('/^\/api\/staff\/(\d+)\/resend$/', $uri, $matches) && $method === 'POST') {
    $staffId = $matches[1];
    $staffCtrl->resendActivation($staffId);
}
// Danh mục sản phẩm
elseif ($uri === '/api/categories/search' && $method === 'POST') {
    $categoryCtrl->searchCategories($data);
}
elseif ($uri === '/api/categories' && $method === 'GET') {
    $categoryCtrl->index();
}
elseif ($uri === '/api/categories' && $method === 'POST') {
    $categoryCtrl->store($data);
}
elseif (preg_match('/^\/api\/categories\/(\d+)$/', $uri, $matches) && $method === 'GET') {
    $categoryId = (int)$matches[1];
    $categoryCtrl->show($categoryId);
}
elseif (preg_match('/^\/api\/categories\/(\d+)$/', $uri, $matches) && $method === 'PUT') {
    $categoryId = (int)$matches[1];
    $categoryCtrl->update($categoryId, $data);
}
elseif (preg_match('/^\/api\/categories\/(\d+)$/', $uri, $matches) && $method === 'DELETE') {
    $categoryId = (int)$matches[1];
    $categoryCtrl->destroy($categoryId);
}
// Sản phẩm (admin)
elseif (preg_match('/^\/api\/products\/(\d+)$/', $uri, $matches) && $method === 'GET') {
    $productCtrl->show((int)$matches[1]);
}
elseif ($uri === '/api/products' && $method === 'GET') {
    $productCtrl->index();
}
elseif ($uri === '/api/products' && $method === 'POST') {
    $productCtrl->store($data);
}
elseif (preg_match('/^\/api\/products\/(\d+)$/', $uri, $matches) && $method === 'PUT') {
    $productId = (int)$matches[1];
    $productCtrl->update($productId, $data);
}
elseif (preg_match('/^\/api\/products\/(\d+)$/', $uri, $matches) && $method === 'DELETE') {
    $productId = (int)$matches[1];
    $productCtrl->destroy($productId);
}

// Khách hàng — route cụ thể trước GET /api/customers/{id}
elseif (preg_match('/^\/api\/customers\/(\d+)\/history$/', $uri, $matches) && $method === 'GET') {
    $customerCtrl->history((int)$matches[1]);
}
elseif (preg_match('/^\/api\/customers\/orders\/(\d+)$/', $uri, $matches) && $method === 'GET') {
    $customerCtrl->orderDetail((int)$matches[1]);
}
// UC-20 - Tra cứu khách hàng theo SĐT
elseif ($uri === '/api/customers/search-by-phone' && $method === 'GET') {
    $customerCtrl->searchByPhone();
}
// UC-22 - Xem chi tiết khách hàng + tổng quan mua hàng
elseif (preg_match('/^\/api\/customers\/(\d+)$/', $uri, $matches) && $method === 'GET') {
    $customerCtrl->show((int)$matches[1]);
}
// Cập nhật khách hàng
elseif (preg_match('/^\/api\/customers\/(\d+)$/', $uri, $matches) && $method === 'PUT') {
    $customerCtrl->update((int)$matches[1], $data);
}
// Xóa khách hàng
elseif (preg_match('/^\/api\/customers\/(\d+)$/', $uri, $matches) && $method === 'DELETE') {
    $customerCtrl->destroy((int)$matches[1]);
}
// UC-21 - Tạo khách hàng mới (khi thanh toán lần đầu)
elseif ($uri === '/api/customers' && $method === 'POST') {
    $customerCtrl->store($data);
}
// Lấy danh sách khách hàng
elseif ($uri === '/api/customers' && $method === 'GET') {
    $customerCtrl->index();
}

// Profile
elseif ($uri === '/api/profile' && $method === 'GET') { $profileCtrl->getMyProfile(); }
elseif ($uri === '/api/profile' && $method === 'PUT') { $profileCtrl->updateProfile($data); }
elseif ($uri === '/api/profile/avatar' && $method === 'POST') { $profileCtrl->uploadAvatar(); }

// POS
elseif ($uri === '/api/pos/session' && $method === 'POST') { $posCtrl->initSession(); }
elseif ($uri === '/api/pos/cart/add' && $method === 'POST') { $posCtrl->addToCart($data); }
elseif ($uri === '/api/pos/cart/item' && $method === 'PUT') { $posCtrl->updateItem($data); }
elseif (preg_match('/^\/api\/pos\/cart\/item\/(\d+)$/', $uri, $matches) && $method === 'DELETE') { $posCtrl->removeItem((int)$matches[1]); }
elseif ($uri === '/api/pos/calculate' && $method === 'POST') { $posCtrl->calculateChange($data); }
elseif ($uri === '/api/pos/checkout' && $method === 'POST') { $posCtrl->checkout($data); }
elseif (preg_match('/^\/api\/pos\/invoice\/(\d+)$/', $uri, $matches) && $method === 'GET') { $posCtrl->exportInvoice((int)$matches[1]); }

// Reports
elseif ($uri === '/api/reports/summary' && $method === 'GET') { $reportCtrl->getSummaryOverview(); }
elseif ($uri === '/api/reports/orders' && $method === 'GET') { $reportCtrl->getOrdersByTimeline(); }
elseif ($uri === '/api/reports/profit' && $method === 'GET') { $reportCtrl->getProfitAnalysis(); }
elseif ($uri === '/api/reports/chart' && $method === 'GET') { $reportCtrl->getSalesChartData(); }

// ====================================================
// Trường hợp đường dẫn không hợp lệ
else {
    Response::json(["message" => "Routing không tồn tại hoặc sai HTTP method!"], 404);
}
