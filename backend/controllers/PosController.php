<?php

require_once __DIR__ . '/../services/PosCheckoutService.php';

class PosController {
    private $db;
    private $productModel;
    private $customerModel;
    private $logModel;

    public function __construct($db) {
        $this->db = $db;
        $this->productModel = new Product($db);
        $this->customerModel = new Customer($db);
        $this->logModel = new Log($db);
    }

    public function initSession() {
        AuthMiddleware::checkAuth();
        if (session_status() === PHP_SESSION_NONE) session_start();
        $_SESSION['cart'] = [];
        $this->logModel->createLog($_SESSION['user_id'], 'init_pos_session', 'Khởi tạo phiên bán hàng');
        Response::json(['Items' => [], 'TotalAmount' => 0]);
    }

    private function getCartTotal() {
        $total = 0;
        foreach ($_SESSION['cart'] as $item) {
            $total += $item['quantity'] * $item['selling_price'];
        }
        return $total;
    }

    public function addToCart($data) {
        AuthMiddleware::checkAuth();
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['cart'])) $_SESSION['cart'] = [];

        // Chuẩn hóa: chấp nhận cả PascalCase và snake_case để tương thích frontend
        $barcode = isset($data['barcode']) ? trim($data['barcode']) : (isset($data['Barcode']) ? trim($data['Barcode']) : '');
        $qty = isset($data['quantity']) ? max(1, (int)$data['quantity']) : (isset($data['Quantity']) ? max(1, (int)$data['Quantity']) : 1);

        if ($barcode === '') Response::json(["message" => "Vui lòng nhập mã vạch"], 400);

        $stmt = $this->db->prepare("SELECT id, product_name, barcode, selling_price, import_price, stock_quantity FROM products WHERE barcode = :bc LIMIT 1");
        $stmt->bindParam(':bc', $barcode);
        $stmt->execute();
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) Response::json(["message" => "Sản phẩm không tồn tại"], 404);

        $id = $product['id'];
        $stock = (int)$product['stock_quantity'];
        $newQty = isset($_SESSION['cart'][$id])
            ? (int)$_SESSION['cart'][$id]['quantity'] + $qty
            : $qty;
        if ($newQty > $stock) {
            Response::json([
                'message' => 'Không đủ tồn kho: ' . $product['product_name'] . ' (còn ' . $stock . ', cần ' . $newQty . ').',
            ], 400);
        }

        if (isset($_SESSION['cart'][$id])) {
            $_SESSION['cart'][$id]['quantity'] += $qty;
        } else {
            $_SESSION['cart'][$id] = [
                'id' => $product['id'],
                'product_name' => $product['product_name'],
                'barcode' => $product['barcode'],
                'selling_price' => (float)$product['selling_price'],
                'import_price' => (float)$product['import_price'],
                'quantity' => $qty
            ];
        }

        Response::json([
            'Items' => array_values($_SESSION['cart']),
            'TotalAmount' => $this->getCartTotal()
        ]);
    }

    public function updateItem($data) {
        AuthMiddleware::checkAuth();
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['cart'])) $_SESSION['cart'] = [];

        // Chuẩn hóa: chấp nhận cả PascalCase và snake_case để tương thích frontend
        $productId = isset($data['product_id']) ? (int)$data['product_id'] : (isset($data['ProductId']) ? (int)$data['ProductId'] : 0);
        $qty = isset($data['new_quantity']) ? max(1, (int)$data['new_quantity']) : (isset($data['NewQuantity']) ? max(1, (int)$data['NewQuantity']) : 1);

        if (isset($_SESSION['cart'][$productId])) {
            $st = $this->db->prepare('SELECT stock_quantity, product_name FROM products WHERE id = :id LIMIT 1');
            $st->execute([':id' => $productId]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                Response::json(['message' => 'Sản phẩm không tồn tại'], 404);
            }
            $stock = (int)$row['stock_quantity'];
            if ($qty > $stock) {
                Response::json([
                    'message' => 'Không đủ tồn kho: ' . $row['product_name'] . ' (còn ' . $stock . ', cần ' . $qty . ').',
                ], 400);
            }
            $_SESSION['cart'][$productId]['quantity'] = $qty;
        }

        Response::json([
            'Items' => array_values($_SESSION['cart']),
            'TotalAmount' => $this->getCartTotal()
        ]);
    }

    public function removeItem($id) {
        AuthMiddleware::checkAuth();
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['cart'])) $_SESSION['cart'] = [];

        $id = (int)$id;
        if (isset($_SESSION['cart'][$id])) {
            unset($_SESSION['cart'][$id]);
        }

        Response::json([
            'Items' => array_values($_SESSION['cart']),
            'TotalAmount' => $this->getCartTotal()
        ]);
    }

    public function calculateChange($data) {
        AuthMiddleware::checkAuth();
        if (session_status() === PHP_SESSION_NONE) session_start();
        // Chuẩn hóa: chấp nhận cả PascalCase và snake_case
        $customerPay = isset($data['customer_pay']) ? (float)$data['customer_pay'] : (isset($data['CustomerPay']) ? (float)$data['CustomerPay'] : 0);
        $total = $this->getCartTotal();
        $change = max(0, $customerPay - $total);
        Response::json(['change_amount' => $change, 'ChangeAmount' => $change]); // Trả về cả 2 format
    }

    public function loyaltySummary($phone) {
        AuthMiddleware::checkAuth();
        $summary = VoucherService::getSummaryForPhone($this->db, $phone);
        Response::json($summary);
    }

    public function checkout($data) {
        AuthMiddleware::checkAuth();
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (empty($_SESSION['cart'])) Response::json(["message" => "Giỏ hàng rỗng"], 400);

        $paymentMethod = isset($data['payment_method']) ? strtolower(trim((string)$data['payment_method'])) : (isset($data['PaymentMethod']) ? strtolower(trim((string)$data['PaymentMethod'])) : 'cash');
        if ($paymentMethod === 'bank_transfer' || $paymentMethod === 'qr' || $paymentMethod === 'sepay') {
            Response::json(["message" => "Thanh toán chuyển khoản dùng nút Tạo mã QR, không gọi checkout trực tiếp"], 400);
        }
        $paymentMethod = 'cash';

        // Chuẩn hóa: chấp nhận cả PascalCase và snake_case
        $phone = isset($data['phone']) ? trim($data['phone']) : (isset($data['Phone']) ? trim($data['Phone']) : '');
        $fullName = isset($data['full_name']) ? trim($data['full_name']) : (isset($data['FullName']) ? trim($data['FullName']) : '');
        $address = isset($data['address']) ? trim($data['address']) : (isset($data['Address']) ? trim($data['Address']) : '');
        $customerPay = isset($data['customer_pay']) ? (float)$data['customer_pay'] : (isset($data['CustomerPay']) ? (float)$data['CustomerPay'] : 0);

        $earnLoyalty = true;
        if (array_key_exists('earn_loyalty', $data)) {
            $earnLoyalty = filter_var($data['earn_loyalty'], FILTER_VALIDATE_BOOLEAN);
        } elseif (array_key_exists('EarnLoyalty', $data)) {
            $earnLoyalty = filter_var($data['EarnLoyalty'], FILTER_VALIDATE_BOOLEAN);
        }

        $customerVoucherId = null;
        if (isset($data['customer_voucher_id'])) {
            $customerVoucherId = (int)$data['customer_voucher_id'];
        } elseif (isset($data['CustomerVoucherId'])) {
            $customerVoucherId = (int)$data['CustomerVoucherId'];
        }
        if ($customerVoucherId <= 0) {
            $customerVoucherId = null;
        }

        $cartItems = array_values($_SESSION['cart']);
        $staffId = (int)$_SESSION['user_id'];

        try {
            $payload = PosCheckoutService::executeCheckout(
                $this->db,
                $cartItems,
                $phone,
                $fullName,
                $address,
                $customerPay,
                $earnLoyalty,
                $customerVoucherId,
                $staffId,
                $paymentMethod,
                $this->logModel
            );
            $_SESSION['cart'] = [];
            Response::json($payload);
        } catch (InvalidArgumentException $e) {
            Response::json(["message" => $e->getMessage()], 400);
        } catch (Exception $e) {
            Response::json(["message" => "Lỗi thanh toán: " . $e->getMessage()], 500);
        }
    }

    public function exportInvoice($orderId) {
        AuthMiddleware::checkAuth();
        $orderId = (int)$orderId;

        $stmt = $this->db->prepare(
            "SELECT o.*, c.full_name as cus_name, c.phone_number, u.full_name as staff_name
             FROM orders o
             LEFT JOIN customers c ON o.customer_id = c.id
             LEFT JOIN users u ON o.user_id = u.id
             WHERE o.id = :oid"
        );
        $stmt->bindParam(':oid', $orderId, PDO::PARAM_INT);
        $stmt->execute();
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            http_response_code(404);
            die("Đơn hàng không tồn tại.");
        }

        $stmtD = $this->db->prepare(
            "SELECT od.quantity, od.unit_price, p.product_name
             FROM order_details od
             JOIN products p ON od.product_id = p.id
             WHERE od.order_id = :oid
             ORDER BY od.id ASC"
        );
        $stmtD->bindParam(':oid', $orderId, PDO::PARAM_INT);
        $stmtD->execute();
        $details = $stmtD->fetchAll(PDO::FETCH_ASSOC);

        $storeName   = 'PhoneStore POS';
        $storeAddr   = 'Cửa hàng điện thoại & phụ kiện';
        $custName    = htmlspecialchars($order['cus_name'] ?? 'Khách lẻ', ENT_QUOTES, 'UTF-8');
        $custPhone   = htmlspecialchars($order['phone_number'] ?? '', ENT_QUOTES, 'UTF-8');
        $staffName   = htmlspecialchars($order['staff_name'] ?? '', ENT_QUOTES, 'UTF-8');
        $createdAt   = date('d/m/Y H:i', strtotime($order['created_at']));
        $total       = (float)$order['total_amount'];
        $custPay     = (float)$order['customer_pay'];
        $changeAmt   = (float)$order['change_amount'];
        $payMethod   = ($order['payment_method'] ?? 'cash') === 'cash' ? 'Tiền mặt' : 'Chuyển khoản';

        $fmt = fn(float $n): string => number_format($n, 0, ',', '.') . ' ₫';

        $rows = '';
        $i = 1;
        foreach ($details as $d) {
            $sub = (float)$d['quantity'] * (float)$d['unit_price'];
            $rows .= '<tr>'
                . '<td>' . $i++ . '</td>'
                . '<td>' . htmlspecialchars($d['product_name'], ENT_QUOTES, 'UTF-8') . '</td>'
                . '<td style="text-align:center">' . (int)$d['quantity'] . '</td>'
                . '<td style="text-align:right">' . $fmt((float)$d['unit_price']) . '</td>'
                . '<td style="text-align:right">' . $fmt($sub) . '</td>'
                . '</tr>';
        }

        header('Content-Type: text/html; charset=utf-8');
        echo <<<HTML
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Hóa đơn #{$orderId}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f0f0;color:#222;font-size:13px}
  .wrap{max-width:720px;margin:24px auto;background:#fff;padding:36px 40px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.15)}
  .header{text-align:center;border-bottom:2px solid #222;padding-bottom:14px;margin-bottom:18px}
  .header h1{font-size:22px;letter-spacing:1px;color:#d9534f}
  .header p{font-size:11px;color:#555;margin-top:4px}
  .title{text-align:center;font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:18px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;margin-bottom:18px;font-size:12px}
  .meta span{color:#555}
  .meta strong{color:#222}
  table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px}
  th{background:#222;color:#fff;padding:8px 10px;text-align:left}
  td{padding:7px 10px;border-bottom:1px solid #eee;vertical-align:top}
  tr:last-child td{border-bottom:none}
  .summary{margin-left:auto;width:260px;font-size:13px}
  .summary tr td:first-child{color:#555}
  .summary tr td:last-child{text-align:right;font-weight:600}
  .summary .total-row td{font-size:15px;font-weight:700;border-top:2px solid #222;padding-top:8px}
  .footer{text-align:center;margin-top:24px;font-size:11px;color:#888;border-top:1px dashed #ccc;padding-top:12px}
  .no-print{display:flex;justify-content:center;gap:12px;margin:20px auto;max-width:720px}
  .btn{padding:9px 22px;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600}
  .btn-print{background:#d9534f;color:#fff}
  .btn-close{background:#555;color:#fff}
  @media print{
    body{background:#fff}
    .no-print{display:none!important}
    .wrap{box-shadow:none;margin:0;padding:20px;border-radius:0;max-width:100%}
    @page{size:A4;margin:15mm}
  }
</style>
</head>
<body>
<div class="no-print">
  <button class="btn btn-print" onclick="window.print()">🖨️ In / Lưu PDF</button>
  <button class="btn btn-close" onclick="window.close()">✕ Đóng</button>
</div>
<div class="wrap">
  <div class="header">
    <h1>{$storeName}</h1>
    <p>{$storeAddr}</p>
  </div>
  <div class="title">Hóa đơn bán hàng</div>
  <div class="meta">
    <div><span>Số hóa đơn: </span><strong>#{$orderId}</strong></div>
    <div><span>Ngày: </span><strong>{$createdAt}</strong></div>
    <div><span>Nhân viên: </span><strong>{$staffName}</strong></div>
    <div><span>Phương thức: </span><strong>{$payMethod}</strong></div>
    <div><span>Khách hàng: </span><strong>{$custName}</strong></div>
    <div><span>Số điện thoại: </span><strong>{$custPhone}</strong></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Sản phẩm</th><th style="text-align:center">SL</th><th style="text-align:right">Đơn giá</th><th style="text-align:right">Thành tiền</th></tr></thead>
    <tbody>{$rows}</tbody>
  </table>
  <table class="summary">
    <tr><td>Tổng tiền hàng:</td><td>{$fmt($total)}</td></tr>
    <tr><td>Khách đưa:</td><td>{$fmt($custPay)}</td></tr>
    <tr class="total-row"><td>Tiền thối:</td><td>{$fmt($changeAmt)}</td></tr>
  </table>
  <div class="footer">Cảm ơn quý khách đã mua hàng! &nbsp;—&nbsp; PhoneStore POS</div>
</div>
</body>
</html>
HTML;
    }
}
