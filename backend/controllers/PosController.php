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

        $subtotalBeforeVoucher = $this->getCartTotal();
        $voucherDiscount = 0.0;
        $lockedVoucher = null;

        $custId = null;
        if ($phone !== '') {
            $cust = $this->customerModel->findByPhone($phone);
            if ($cust) {
                $custId = (int)$cust['id'];
            } else {
                $nameToCreate = $fullName !== '' ? $fullName : 'Khách hàng';
                $newId = $this->customerModel->create($nameToCreate, $phone, $address);
                if ($newId) {
                    $custId = (int)$newId;
                }
            }
        }

        if ($customerVoucherId !== null && $custId === null) {
            Response::json(["message" => "Cần số điện thoại khách để dùng phiếu"], 400);
        }

        try {
            $this->db->beginTransaction();

            if ($customerVoucherId !== null && $custId !== null) {
                $lockedVoucher = VoucherService::lockVoucherForRedeem($this->db, $customerVoucherId, $custId);
                if (!$lockedVoucher) {
                    $this->db->rollBack();
                    Response::json(["message" => "Phiếu không hợp lệ hoặc đã dùng"], 400);
                }
                $voucherDiscount = VoucherService::computeDiscount($lockedVoucher, (float)$subtotalBeforeVoucher);
            }

            $totalAfterVoucher = max(0.0, (float)$subtotalBeforeVoucher - $voucherDiscount);
            if ($customerPay < $totalAfterVoucher) {
                $this->db->rollBack();
                Response::json(["message" => "Số tiền khách đưa không đủ"], 400);
            }

            $change = $customerPay - $totalAfterVoucher;
            $staffId = $_SESSION['user_id'];

            $earnBase = LoyaltyVoucherRules::EARN_ON_TOTAL_AFTER_VOUCHER ? $totalAfterVoucher : $subtotalBeforeVoucher;

            $sql = "INSERT INTO orders (customer_id, user_id, total_amount, customer_pay, change_amount, subtotal_before_voucher, voucher_discount, customer_voucher_id, created_at)
                    VALUES (:cid, :uid, :total, :pay, :change, :subbf, :vdisc, :cvid, NOW())";
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':cid', $custId, $custId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->bindParam(':uid', $staffId, PDO::PARAM_INT);
            $stmt->bindParam(':total', $totalAfterVoucher);
            $stmt->bindParam(':pay', $customerPay);
            $stmt->bindParam(':change', $change);
            $stmt->bindParam(':subbf', $subtotalBeforeVoucher);
            $stmt->bindParam(':vdisc', $voucherDiscount);
            $cvBind = $customerVoucherId;
            $stmt->bindValue(':cvid', $cvBind, $cvBind === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->execute();
            $orderId = (int)$this->db->lastInsertId();

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

            if ($custId !== null) {
                VoucherService::incrementLifetimeSpend($this->db, $custId, (float)$subtotalBeforeVoucher);
            }

            $pointsEarned = 0;
            $loyaltyBalance = null;
            if ($earnLoyalty && $custId) {
                $loyalty = new LoyaltyPoints($this->db);
                $earn = $loyalty->earnForOrder((int)$custId, $orderId, (float)$earnBase);
                if ($earn) {
                    $pointsEarned = $earn['points'];
                    $loyaltyBalance = $earn['balance_after'];
                }
            }

            if ($customerVoucherId !== null) {
                VoucherService::markVoucherUsed($this->db, $customerVoucherId, $orderId);
            }

            if ($custId) {
                VoucherService::issueEligibleVouchers($this->db, $custId);
            }

            $this->db->commit();
            $this->logModel->createLog($_SESSION['user_id'], 'checkout', 'Thanh toán đơn hàng ID=' . $orderId);

            $_SESSION['cart'] = [];

            $payload = [
                'order_id' => $orderId,
                'OrderId' => $orderId,
                'pdf_url' => '/api/pos/invoice/' . $orderId,
                'PdfUrl' => '/api/pos/invoice/' . $orderId,
                'points_earned' => $pointsEarned,
                'PointsEarned' => $pointsEarned,
                'customer_loyalty_balance' => $loyaltyBalance,
                'CustomerLoyaltyBalance' => $loyaltyBalance,
                'subtotal_before_voucher' => (float)$subtotalBeforeVoucher,
                'voucher_discount' => (float)$voucherDiscount,
                'total_amount' => (float)$totalAfterVoucher,
                'TotalAmount' => (float)$totalAfterVoucher,
            ];
            Response::json($payload);

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
