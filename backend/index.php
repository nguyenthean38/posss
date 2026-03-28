<?php
date_default_timezone_set('Asia/Ho_Chi_Minh');

// Start session FIRST - before any output or headers
session_start();

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

// CORS Headers cho phÃ©p Frontend (HTML/JS) gá»i API
$allowedOrigins = [
    'http://127.0.0.1:8080',   // Docker (truy cáº­p trá»±c tiáº¿p)
    'http://localhost:8080',    // Docker (localhost)
    'http://127.0.0.1:5500',   // VS Code Live Server
    'http://localhost:5500',    // VS Code Live Server
    'http://127.0.0.1:3000',   // Dev server khÃ¡c
    'http://localhost:3000',
    'http://127.0.0.1:8000',
    'http://localhost:8000',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
} else {
    // Fallback cho Postman / khÃ´ng cÃ³ Origin
    header("Access-Control-Allow-Origin: http://127.0.0.1:8080");
}
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Xá»­ lÃ½ preflight request cá»§a CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Gá»i cÃ¡c file Config & Core
require_once __DIR__ . '/config/load_env.php';
EnvLoader::loadFromProjectRoot();

require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/core/Mailer.php';
require_once __DIR__ . '/core/FileUpload.php';

// Session Ä‘Ã£ Ä‘Æ°á»£c start á»Ÿ Ä‘áº§u file
require_once __DIR__ . '/middlewares/AuthMiddleware.php';

// Require Models
require_once __DIR__ . '/models/User.php';
require_once __DIR__ . '/models/PasswordToken.php';
require_once __DIR__ . '/models/Log.php';
require_once __DIR__ . '/models/Category.php';
require_once __DIR__ . '/models/Product.php';
require_once __DIR__ . '/models/Customer.php';
require_once __DIR__ . '/models/LoyaltyPoints.php';
require_once __DIR__ . '/config/LoyaltyVoucherRules.php';
require_once __DIR__ . '/services/VoucherService.php';

// Require Controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/StaffController.php';
require_once __DIR__ . '/controllers/CategoryController.php';
require_once __DIR__ . '/controllers/ProductController.php';
require_once __DIR__ . '/controllers/CustomerController.php';
require_once __DIR__ . '/controllers/PosController.php';
require_once __DIR__ . '/controllers/ReportController.php';
require_once __DIR__ . '/controllers/ProfileController.php';
require_once __DIR__ . '/controllers/LogController.php';
require_once __DIR__ . '/models/ShiftAttendance.php';
require_once __DIR__ . '/controllers/ShiftController.php';
require_once __DIR__ . '/controllers/AiChatController.php';

// Khá»Ÿi táº¡o DB connection
// Khá»Ÿi táº¡o DB connection
$db = Database::getConnection();

// Láº¥y Body Payload
// Náº¿u lÃ  multipart/form-data (cÃ³ file upload) â†’ dÃ¹ng $_POST
// Náº¿u lÃ  application/json â†’ parse JSON tá»« php://input
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'multipart/form-data') !== false) {
    // FormData: Láº¥y tá»« $_POST
    $data = $_POST;
} else {
    // JSON: Parse tá»« php://input
    $data = json_decode(file_get_contents("php://input"), true);
    if ($data === null) { $data = []; }
}
// Parse Ä‘Æ°á»ng dáº«n Path parameters /api/staff/{id}/resend
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Loáº¡i bá» cÃ¡c tiá»n tá»‘ thÆ° má»¥c khá»i URI Ä‘á»ƒ match Ä‘Ãºng vá»›i cÃ¡c routes (vd: /api/auth/login)
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
$logCtrl = new LogController($db);
$shiftCtrl = new ShiftController($db);
$aiChatCtrl = new AiChatController($db);

// ================ ÄIá»€U HÆ¯á»šNG ROUTES ================

// [1] Route ÄÄƒng nháº­p thÆ°á»ng & Ä‘Äƒng nháº­p láº§n Ä‘áº§u
if ($uri === '/api/auth/login' && $method === 'POST') {
    $authCtrl->login($data);
}
elseif ($uri === '/api/auth/first-login' && $method === 'POST') {
    $authCtrl->firstLogin($data);
}
elseif ($uri === '/api/auth/verify-token' && $method === 'POST') {
    $authCtrl->verifyToken($data);
}

// [2] Route Báº£o vá»‡: Äá»•i máº­t kháº©u báº¯t buá»™c & ThoÃ¡t
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
    // Cáº­p nháº­t há»“ sÆ¡ & áº£nh Ä‘áº¡i diá»‡n (multipart/form-data)
    $authCtrl->updateProfile();
}

// [3] Admin / Staff Roles & Danh má»¥c
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
elseif (preg_match('/^\/api\/staff\/(\d+)\/sales$/', $uri, $matches) && $method === 'GET') {
    $staffId = (int)$matches[1];
    $staffCtrl->showStaffSales($staffId);
}
elseif (preg_match('/^\/api\/staff\/(\d+)$/', $uri, $matches) && $method === 'DELETE') {
    $staffId = (int)$matches[1];
    $staffCtrl->deleteStaff($staffId);
}
// Danh má»¥c sáº£n pháº©m
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
// Sáº£n pháº©m (admin)
elseif (preg_match('/^\/api\/products\/(\d+)$/', $uri, $matches) && $method === 'GET') {
    $productCtrl->show((int)$matches[1]);
}
elseif ($uri === '/api/products' && $method === 'GET') {
    $productCtrl->index();
}
elseif ($uri === '/api/products' && $method === 'POST') {
    $productCtrl->store($data);
}
// Cáº­p nháº­t cÃ³ multipart (PHP chá»‰ parse $_POST/$_FILES cho POST, khÃ´ng cho PUT)
elseif (preg_match('/^\/api\/products\/(\d+)\/update$/', $uri, $matches) && $method === 'POST') {
    $productCtrl->update((int)$matches[1], $data);
}
elseif (preg_match('/^\/api\/products\/(\d+)$/', $uri, $matches) && $method === 'PUT') {
    $productId = (int)$matches[1];
    $productCtrl->update($productId, $data);
}
elseif (preg_match('/^\/api\/products\/(\d+)\/restock$/', $uri, $matches) && $method === 'PATCH') {
    $productId = (int)$matches[1];
    $productCtrl->restock($productId, $data);
}
elseif (preg_match('/^\/api\/products\/(\d+)$/', $uri, $matches) && $method === 'DELETE') {
    $productId = (int)$matches[1];
    $productCtrl->destroy($productId);
}

// KhÃ¡ch hÃ ng â€” route cá»¥ thá»ƒ trÆ°á»›c GET /aphp -S localhost:8000pi/customers/{id}
elseif (preg_match('/^\/api\/customers\/(\d+)\/history$/', $uri, $matches) && $method === 'GET') {
    $customerCtrl->history((int)$matches[1]);
}
elseif (preg_match('/^\/api\/customers\/orders\/(\d+)$/', $uri, $matches) && $method === 'GET') {
    $customerCtrl->orderDetail((int)$matches[1]);
}
// UC-20 - Tra cá»©u khÃ¡ch hÃ ng theo SÄT
elseif ($uri === '/api/customers/search-by-phone' && $method === 'GET') {
    $customerCtrl->searchByPhone();
}
// Cáº­p nháº­t khÃ¡ch cÃ³ multipart (PHP chá»‰ parse $_POST/$_FILES cho POST, khÃ´ng cho PUT)
elseif (preg_match('/^\/api\/customers\/(\d+)\/update$/', $uri, $matches) && $method === 'POST') {
    $customerCtrl->update((int)$matches[1], $data);
}
// UC-22 - Xem chi tiáº¿t khÃ¡ch hÃ ng + tá»•ng quan mua hÃ ng
elseif (preg_match('/^\/api\/customers\/(\d+)$/', $uri, $matches) && $method === 'GET') {
    $customerCtrl->show((int)$matches[1]);
}
// Cáº­p nháº­t khÃ¡ch hÃ ng
elseif (preg_match('/^\/api\/customers\/(\d+)$/', $uri, $matches) && $method === 'PUT') {
    $customerCtrl->update((int)$matches[1], $data);
}
// XÃ³a khÃ¡ch hÃ ng
elseif (preg_match('/^\/api\/customers\/(\d+)$/', $uri, $matches) && $method === 'DELETE') {
    $customerCtrl->destroy((int)$matches[1]);
}
// UC-21 - Táº¡o khÃ¡ch hÃ ng má»›i (khi thanh toÃ¡n láº§n Ä‘áº§u)
elseif ($uri === '/api/customers' && $method === 'POST') {
    $customerCtrl->store($data);
}
// Láº¥y danh sÃ¡ch khÃ¡ch hÃ ng
elseif ($uri === '/api/customers' && $method === 'GET') {
    $customerCtrl->index();
}

// Profile
elseif ($uri === '/api/profile' && $method === 'GET') { $profileCtrl->getMyProfile(); }
elseif ($uri === '/api/profile' && $method === 'PUT') { $profileCtrl->updateProfile($data); }
elseif ($uri === '/api/profile/avatar' && $method === 'POST') { $profileCtrl->uploadAvatar(); }
// Diem danh ca (staff + admin)
elseif ($uri === '/api/shifts/status' && $method === 'GET') { $shiftCtrl->status(); }
elseif ($uri === '/api/shifts/clock-in' && $method === 'POST') { $shiftCtrl->clockIn($data ?? []); }
elseif ($uri === '/api/shifts/clock-out' && $method === 'POST') { $shiftCtrl->clockOut(); }
elseif ($uri === '/api/shifts/me' && $method === 'GET') { $shiftCtrl->myList(); }
elseif ($uri === '/api/admin/shifts/export' && $method === 'GET') { $shiftCtrl->adminExportCsv(); }
elseif ($uri === '/api/admin/shifts' && $method === 'GET') { $shiftCtrl->adminList(); }
elseif (preg_match('/^\/api\/admin\/shifts\/(\d+)$/', $uri, $m) && $method === 'PATCH') { $shiftCtrl->adminUpdate((int)$m[1], $data ?? []); }
// Admin: nhat ky hoat dong (doc bang logs)
elseif ($uri === '/api/admin/activity-logs' && $method === 'GET') { $logCtrl->activityLogs(); }
// POS
elseif ($uri === '/api/pos/session' && $method === 'POST') { $posCtrl->initSession(); }
elseif ($uri === '/api/pos/cart/add' && $method === 'POST') { $posCtrl->addToCart($data); }
elseif ($uri === '/api/pos/cart/item' && $method === 'PUT') { $posCtrl->updateItem($data); }
elseif (preg_match('/^\/api\/pos\/cart\/item\/(\d+)$/', $uri, $matches) && $method === 'DELETE') { $posCtrl->removeItem((int)$matches[1]); }
elseif ($uri === '/api/pos/calculate' && $method === 'POST') { $posCtrl->calculateChange($data); }
elseif ($uri === '/api/pos/checkout' && $method === 'POST') { $posCtrl->checkout($data); }
elseif ($uri === '/api/pos/loyalty-summary' && $method === 'GET') {
    $phone = isset($_GET['phone']) ? (string)$_GET['phone'] : '';
    $posCtrl->loyaltySummary($phone);
}
elseif (preg_match('/^\/api\/pos\/invoice\/(\d+)$/', $uri, $matches) && $method === 'GET') { $posCtrl->exportInvoice((int)$matches[1]); }

// Reports
elseif ($uri === '/api/reports/summary' && $method === 'GET') { $reportCtrl->getSummaryOverview(); }
elseif ($uri === '/api/reports/orders' && $method === 'GET') { $reportCtrl->getOrdersByTimeline(); }
elseif ($uri === '/api/reports/profit' && $method === 'GET') { $reportCtrl->getProfitAnalysis(); }
elseif ($uri === '/api/reports/chart' && $method === 'GET') { $reportCtrl->getSalesChartData(); }

// Trá»£ lÃ½ AI (OpenRouter) â€” Ä‘Ã£ Ä‘Äƒng nháº­p
elseif ($uri === '/api/ai/chat' && $method === 'POST') { $aiChatCtrl->chat($data ?? []); }

// ====================================================
// TrÆ°á»ng há»£p Ä‘Æ°á»ng dáº«n khÃ´ng há»£p lá»‡
else {
    Response::json(["message" => "Routing khÃ´ng tá»“n táº¡i hoáº·c sai HTTP method!"], 404);
}
