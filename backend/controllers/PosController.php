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

        $stmt = $this->db->prepare("SELECT o.*, c.full_name as cus_name, c.phone_number, u.full_name as staff_name 
                                    FROM orders o 
                                    LEFT JOIN customers c ON o.customer_id = c.id
                                    LEFT JOIN users u ON o.user_id = u.id
                                    WHERE o.id = :oid");
        $stmt->bindParam(':oid', $orderId);
        $stmt->execute();
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            die("Đơn hàng không tồn tại.");
        }

        $stmtD = $this->db->prepare("SELECT od.*, p.product_name FROM order_details od JOIN products p ON od.product_id = p.id WHERE order_id = :oid");
        $stmtD->bindParam(':oid', $orderId);
        $stmtD->execute();
        $details = $stmtD->fetchAll(PDO::FETCH_ASSOC);

        header('Content-Type: text/html; charset=utf-8');
        echo "<html><head><title>Hóa đơn #$orderId</title><style>
        body { font-family: sans-serif; padding: 20px; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
        h2 { text-align: center; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
        th { background: #f9f9f9; }
        .text-right { text-align: right; }
        .total { font-weight: bold; font-size: 1.2em; }
        </style></head><body onload='window.print()'><div class='invoice-box'>";
        echo "<h2>HÓA ĐƠN BÁN HÀNG #$orderId</h2>";
        echo "<p><strong>Ngày:</strong> " . $order['created_at'] . "<br>";
        echo "<strong>Nhân viên:</strong> " . htmlspecialchars($order['staff_name']) . "<br>";
        echo "<strong>Khách hàng:</strong> " . htmlspecialchars($order['cus_name'] ?? 'Khách lẻ') . " - " . htmlspecialchars($order['phone_number'] ?? '') . "</p>";
        echo "<table><tr><th>STT</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>";
        $i = 1;
        foreach ($details as $d) {
            $amount = $d['quantity'] * $d['unit_price'];
            echo "<tr><td>$i</td><td>" . htmlspecialchars($d['product_name']) . "</td><td>{$d['quantity']}</td><td>" . number_format($d['unit_price']) . " đ</td><td>" . number_format($amount) . " đ</td></tr>";
            $i++;
        }
        echo "</table>";
        echo "<br><div class='text-right'>";
        echo "<p class='total'>Tổng cộng: " . number_format($order['total_amount']) . " đ</p>";
        echo "<p>Khách đưa: " . number_format($order['customer_pay']) . " đ<br>";
        echo "Tiền thối: " . number_format($order['change_amount']) . " đ</p>";
        echo "</div></div></body></html>";
    }
}
