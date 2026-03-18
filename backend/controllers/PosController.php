<?php
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

        $barcode = isset($data['Barcode']) ? trim($data['Barcode']) : '';
        $qty = isset($data['Quantity']) ? max(1, (int)$data['Quantity']) : 1;

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

        $productId = isset($data['ProductId']) ? (int)$data['ProductId'] : 0;
        $qty = isset($data['NewQuantity']) ? max(1, (int)$data['NewQuantity']) : 1;

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
        $customerPay = isset($data['CustomerPay']) ? (float)$data['CustomerPay'] : 0;
        $total = $this->getCartTotal();
        $change = max(0, $customerPay - $total);
        Response::json(['ChangeAmount' => $change]);
    }

    public function checkout($data) {
        AuthMiddleware::checkAuth();
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (empty($_SESSION['cart'])) Response::json(["message" => "Giỏ hàng rỗng"], 400);

        $phone = isset($data['Phone']) ? trim($data['Phone']) : '';
        $fullName = isset($data['FullName']) ? trim($data['FullName']) : '';
        $address = isset($data['Address']) ? trim($data['Address']) : '';
        $customerPay = isset($data['CustomerPay']) ? (float)$data['CustomerPay'] : 0;

        $totalAmount = $this->getCartTotal();
        if ($customerPay < $totalAmount) Response::json(["message" => "Số tiền khách đưa không đủ"], 400);

        $custId = null;
        if ($phone !== '') {
            $cust = $this->customerModel->findByPhone($phone);
            if ($cust) {
                $custId = $cust['id'];
            } else if ($fullName !== '') {
                $custId = $this->customerModel->create($fullName, $phone, $address);
            }
        }

        try {
            $this->db->beginTransaction();

            $change = $customerPay - $totalAmount;
            $staffId = $_SESSION['user_id'];
            
            $sql = "INSERT INTO orders (customer_id, user_id, total_amount, customer_pay, change_amount, created_at)
                    VALUES (:cid, :uid, :total, :pay, :change, NOW())";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':cid', $custId);
            $stmt->bindParam(':uid', $staffId);
            $stmt->bindParam(':total', $totalAmount);
            $stmt->bindParam(':pay', $customerPay);
            $stmt->bindParam(':change', $change);
            $stmt->execute();
            $orderId = $this->db->lastInsertId();

            $sqlDetail = "INSERT INTO order_details (order_id, product_id, quantity, unit_price, import_price_at_sale)
                          VALUES (:oid, :pid, :qty, :price, :import)";
            $stmtD = $this->db->prepare($sqlDetail);

            foreach ($_SESSION['cart'] as $item) {
                $stmtD->bindParam(':oid', $orderId);
                $stmtD->bindParam(':pid', $item['id']);
                $stmtD->bindParam(':qty', $item['quantity']);
                $stmtD->bindParam(':price', $item['selling_price']);
                $stmtD->bindParam(':import', $item['import_price']);
                $stmtD->execute();

                $this->db->query("UPDATE products SET stock_quantity = stock_quantity - " . (int)$item['quantity'] . " WHERE id = " . (int)$item['id']);
            }

            $this->db->commit();
            $this->logModel->createLog($_SESSION['user_id'], 'checkout', 'Thanh toán đơn hàng ID=' . $orderId);
            
            $_SESSION['cart'] = [];

            Response::json([
                'OrderId' => $orderId,
                'PdfUrl' => '/api/pos/invoice/' . $orderId
            ]);

        } catch (Exception $e) {
            $this->db->rollBack();
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
