<?php

require_once __DIR__ . '/../config/SepayConfig.php';
require_once __DIR__ . '/../services/PosCheckoutService.php';
require_once __DIR__ . '/../services/VoucherService.php';

class SepayController {
    private $db;
    private $logModel;
    private $customerModel;

    public function __construct(PDO $db) {
        $this->db = $db;
        require_once __DIR__ . '/../models/Log.php';
        require_once __DIR__ . '/../models/Customer.php';
        $this->logModel = new Log($db);
        $this->customerModel = new Customer($db);
    }

    /**
     * Ky payload SePay (HMAC-SHA256 base64) — thu tu field theo tai lieu SePay.
     */
    public static function sepaySign(array $fields, string $secretKey): string {
        $order = [
            'merchant', 'operation', 'payment_method', 'order_amount', 'currency',
            'order_invoice_number', 'order_description', 'customer_id',
            'success_url', 'error_url', 'cancel_url',
        ];
        $parts = [];
        foreach ($order as $field) {
            if (!array_key_exists($field, $fields)) {
                continue;
            }
            $v = $fields[$field];
            if ($v === null || $v === '') {
                continue;
            }
            $parts[] = $field . '=' . (string)$v;
        }
        $payload = implode(',', $parts);
        return base64_encode(hash_hmac('sha256', $payload, $secretKey, true));
    }

    private function getCartTotalFromSession(): float {
        $total = 0;
        foreach ($_SESSION['cart'] as $item) {
            $total += (float)$item['selling_price'] * (int)$item['quantity'];
        }
        return (float)$total;
    }

    /**
     * Tinh giam voucher (khong lock) — chi de tao pending.
     */
    private function previewVoucherDiscount(?int $custId, ?int $customerVoucherId, float $subtotal): float {
        if ($custId === null || $customerVoucherId === null || $customerVoucherId <= 0) {
            return 0.0;
        }
        $sql = 'SELECT cv.id, cv.customer_id, cv.tier_id, cv.status, cv.code,
                       vt.name, vt.min_points_required, vt.min_lifetime_spend_vnd,
                       vt.discount_amount_vnd, vt.discount_percent, vt.valid_from, vt.valid_to, vt.active
                FROM customer_vouchers cv
                INNER JOIN voucher_tiers vt ON vt.id = cv.tier_id
                WHERE cv.id = :vid AND cv.customer_id = :cid';
        $st = $this->db->prepare($sql);
        $st->execute([':vid' => $customerVoucherId, ':cid' => $custId]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if (!$row || $row['status'] !== 'issued' || !(int)$row['active']) {
            return 0.0;
        }
        if (!VoucherService::tierDateValid($row)) {
            return 0.0;
        }
        return VoucherService::computeDiscount($row, $subtotal);
    }

    public function init(array $data): void {
        AuthMiddleware::checkAuth();
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (!SepayConfig::isConfigured()) {
            Response::json(['message' => 'SePay chưa cấu hình (SEPAY_MERCHANT_ID / SEPAY_SECRET_KEY trong .env)'], 503);
        }
        if (empty($_SESSION['cart'])) {
            Response::json(['message' => 'Giỏ hàng rỗng'], 400);
        }

        $phone = isset($data['phone']) ? trim((string)$data['phone']) : (isset($data['Phone']) ? trim((string)$data['Phone']) : '');
        $fullName = isset($data['full_name']) ? trim((string)$data['full_name']) : (isset($data['FullName']) ? trim((string)$data['FullName']) : '');
        $address = isset($data['address']) ? trim((string)$data['address']) : (isset($data['Address']) ? trim((string)$data['Address']) : '');

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

        $subtotalBeforeVoucher = $this->getCartTotalFromSession();
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
            Response::json(['message' => 'Cần số điện thoại khách để dùng phiếu'], 400);
        }

        $voucherDiscount = $this->previewVoucherDiscount($custId, $customerVoucherId, $subtotalBeforeVoucher);
        if ($customerVoucherId !== null && $voucherDiscount <= 0 && $subtotalBeforeVoucher > 0) {
            Response::json(['message' => 'Phiếu không hợp lệ hoặc không áp dụng được cho giỏ này'], 400);
        }

        $totalAfterVoucher = max(0.0, $subtotalBeforeVoucher - $voucherDiscount);
        if ($totalAfterVoucher <= 0) {
            Response::json(['message' => 'Số tiền thanh toán không hợp lệ'], 400);
        }

        $invoice = 'INV-' . date('YmdHis') . '-' . strtoupper(bin2hex(random_bytes(3)));
        $expiredAt = (new DateTimeImmutable('now', new DateTimeZone('Asia/Ho_Chi_Minh')))->modify('+5 minutes');
        $staffId = (int)$_SESSION['user_id'];

        $cartSnapshot = json_encode(array_values($_SESSION['cart']), JSON_UNESCAPED_UNICODE);
        $customerData = json_encode([
            'phone' => $phone,
            'full_name' => $fullName,
            'address' => $address,
            'earn_loyalty' => $earnLoyalty,
            'customer_voucher_id' => $customerVoucherId,
        ], JSON_UNESCAPED_UNICODE);

        $amountInt = (int)round($totalAfterVoucher);
        if ($amountInt < 1000) {
            Response::json(['message' => 'Số tiền tối thiểu không hợp lệ'], 400);
        }

        $checkoutSid = session_id();
        try {
            $ins = $this->db->prepare(
                'INSERT INTO sepay_pending_orders (order_invoice, staff_user_id, checkout_session_id, cart_snapshot, customer_data, amount, subtotal_before_voucher, voucher_discount, status, expired_at)
                 VALUES (:inv, :uid, :sess, :cart, :cust, :amt, :subbf, :vdisc, \'pending\', :exp)'
            );
            $ins->execute([
                ':inv' => $invoice,
                ':uid' => $staffId,
                ':sess' => $checkoutSid !== '' ? $checkoutSid : null,
                ':cart' => $cartSnapshot,
                ':cust' => $customerData,
                ':amt' => $totalAfterVoucher,
                ':subbf' => $subtotalBeforeVoucher,
                ':vdisc' => $voucherDiscount,
                ':exp' => $expiredAt->format('Y-m-d H:i:s'),
            ]);
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'checkout_session_id') !== false || strpos($e->getMessage(), 'Unknown column') !== false) {
                Response::json(['message' => 'Chưa chạy migration DB: backend/migrations/005_sepay_checkout_session.sql'], 500);
            }
            if (strpos($e->getMessage(), 'sepay_pending_orders') !== false) {
                Response::json(['message' => 'Chưa chạy migration DB: backend/migrations/004_sepay_pos_payment.sql'], 500);
            }
            throw $e;
        }

        $mid = SepayConfig::merchantId();
        $secret = SepayConfig::secretKey();
        $custKey = $custId !== null ? 'CUST-' . $custId : 'CUST-NEW-' . substr(sha1($invoice), 0, 10);
        $transferMemo = SepayConfig::formatTransferMemo($invoice);

        $fields = [
            'merchant' => $mid,
            'currency' => 'VND',
            'order_amount' => (string)$amountInt,
            'operation' => 'PURCHASE',
            'payment_method' => 'BANK_TRANSFER',
            'order_invoice_number' => $invoice,
            'order_description' => 'PhoneStore POS ' . $transferMemo,
            'customer_id' => $custKey,
            'success_url' => SepayConfig::successUrl(),
            'error_url' => SepayConfig::errorUrl(),
            'cancel_url' => SepayConfig::cancelUrl(),
        ];
        $fields['signature'] = self::sepaySign($fields, $secret);

        $this->logModel->createLog($staffId, 'sepay_init', 'Tạo QR SePay invoice=' . $invoice);

        $bankCode    = SepayConfig::bankCode();
        $accountNo   = SepayConfig::accountNumber();
        $accountName = SepayConfig::accountName();

        if ($bankCode !== '' && $accountNo !== '') {
            // VietQR — addInfo phải có SEVQR đầu dòng với VietinBank+SePay (xem cảnh báo trên dashboard SePay)
            $qrImageUrl = 'https://img.vietqr.io/image/'
                . rawurlencode($bankCode) . '-'
                . rawurlencode($accountNo) . '-qr_only.png'
                . '?amount=' . $amountInt
                . '&addInfo=' . rawurlencode($transferMemo)
                . ($accountName !== '' ? '&accountName=' . rawurlencode($accountName) : '');
        } else {
            // Fallback nếu chưa cấu hình bank
            $qrNote = rawurlencode($transferMemo . '|' . $amountInt . 'VND');
            $qrImageUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=M&data=' . $qrNote;
        }

        Response::json([
            'invoice' => $invoice,
            'Invoice' => $invoice,
            'amount' => $totalAfterVoucher,
            'Amount' => $totalAfterVoucher,
            'amount_int' => $amountInt,
            'expired_at' => $expiredAt->format('c'),
            'ExpiredAt' => $expiredAt->format('c'),
            'checkout_post_url' => SepayConfig::checkoutPostUrl(),
            'checkout_fields' => $fields,
            'qr_image_url' => $qrImageUrl,
            'QrImageUrl' => $qrImageUrl,
            'use_iframe_checkout' => true,
        ]);
    }

    public function status(string $invoice): void {
        AuthMiddleware::checkAuth();
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $invoice = trim($invoice);
        if ($invoice === '') {
            Response::json(['message' => 'Thiếu invoice'], 400);
        }
        $staffId = (int)$_SESSION['user_id'];

        $now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Ho_Chi_Minh')))->format('Y-m-d H:i:s');

        $st = $this->db->prepare(
            'SELECT * FROM sepay_pending_orders WHERE order_invoice = :inv AND staff_user_id = :uid LIMIT 1'
        );
        $st->execute([':inv' => $invoice, ':uid' => $staffId]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            Response::json(['message' => 'Không tìm thấy giao dịch'], 404);
        }

        if ($row['status'] === 'pending' && $row['expired_at'] < $now) {
            $up = $this->db->prepare("UPDATE sepay_pending_orders SET status = 'expired' WHERE id = :id AND status = 'pending'");
            $up->execute([':id' => $row['id']]);
            $row['status'] = 'expired';
        }

        $out = ['status' => $row['status'], 'Status' => $row['status']];
        if ($row['status'] === 'paid' && !empty($row['order_id'])) {
            $oid = (int)$row['order_id'];
            $out['order_id'] = $oid;
            $out['OrderId'] = $oid;
            $out['pdf_url'] = '/api/pos/invoice/' . $oid;
            $out['PdfUrl'] = '/api/pos/invoice/' . $oid;

            $cust = json_decode((string)$row['customer_data'], true);
            $phone = is_array($cust) ? trim((string)($cust['phone'] ?? '')) : '';
            if ($phone !== '') {
                $c = $this->customerModel->findByPhone($phone);
                if ($c) {
                    $out['customer_loyalty_balance'] = (int)($c['loyalty_points'] ?? 0);
                    $out['CustomerLoyaltyBalance'] = (int)($c['loyalty_points'] ?? 0);
                }
            }
            $ledger = $this->db->prepare(
                'SELECT delta FROM customer_point_ledger WHERE order_id = :oid AND reason = \'earn_checkout\' LIMIT 1'
            );
            $ledger->execute([':oid' => $oid]);
            $led = $ledger->fetch(PDO::FETCH_ASSOC);
            if ($led) {
                $pe = (int)$led['delta'];
                $out['points_earned'] = $pe;
                $out['PointsEarned'] = $pe;
            } else {
                $out['points_earned'] = 0;
                $out['PointsEarned'] = 0;
            }
        }

        Response::json($out);
    }

    public function cancel(array $data): void {
        AuthMiddleware::checkAuth();
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $invoice = trim((string)($data['invoice'] ?? $data['Invoice'] ?? ''));
        if ($invoice === '') {
            Response::json(['message' => 'Thiếu invoice'], 400);
        }
        $staffId = (int)$_SESSION['user_id'];
        $up = $this->db->prepare(
            "UPDATE sepay_pending_orders SET status = 'cancelled' WHERE order_invoice = :inv AND staff_user_id = :uid AND status = 'pending'"
        );
        $up->execute([':inv' => $invoice, ':uid' => $staffId]);
        Response::json(['ok' => true]);
    }

    /**
     * Xoa gio hang trong session PHP cua quay POS (goi tu IPN — khong co cookie cua nhan vien).
     */
    private function clearPosSessionCart(?string $phpSessionId): void {
        $sid = trim((string)$phpSessionId);
        if ($sid === '') {
            return;
        }
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }
        session_id($sid);
        session_start();
        $_SESSION['cart'] = [];
        session_write_close();
    }

    public function ipn(array $data): void {
        // Log raw payload để dễ debug — loại bỏ trường có chứa secret nếu có
        $safeLog = $data;
        foreach (['signature', 'secret', 'key', 'token', 'password'] as $k) {
            unset($safeLog[$k]);
        }
        $rawJson = json_encode($safeLog, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
        $contentType = $_SERVER['CONTENT_TYPE'] ?? 'unknown';
        $this->logModel->createLog(null, 'sepay_ipn_raw', "CT={$contentType} BODY={$rawJson}");

        if (!is_array($data) || empty($data)) {
            http_response_code(200);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode(['success' => true, 'ignored' => true]);
            return;
        }

        // Một số webhook SePay bọc giao dịch trong key "data"
        if (isset($data['data']) && is_array($data['data']) && !isset($data['notification_type'])) {
            $inner = $data['data'];
            if (isset($inner['gateway']) || isset($inner['transferAmount']) || isset($inner['transfer_amount'])
                || isset($inner['content']) || isset($inner['description'])) {
                $data = array_merge($data, $inner);
            }
        }
        // Đồng bộ tên field (snake_case / alias)
        if (!isset($data['transferAmount']) && isset($data['transfer_amount'])) {
            $data['transferAmount'] = $data['transfer_amount'];
        }
        foreach (['transferContent', 'remark', 'memo', 'message'] as $alt) {
            if (($data['content'] ?? '') === '' && ($data[$alt] ?? '') !== '') {
                $data['content'] = $data[$alt];
            }
        }
        if (($data['code'] ?? '') === '' && ($data['referenceCode'] ?? '') === '' && ($data['reference_code'] ?? '') !== '') {
            $data['code'] = $data['reference_code'];
        }
        if (!isset($data['transferType']) && isset($data['type']) && strtoupper(trim((string)$data['type'])) === 'IN') {
            $data['transferType'] = 'in';
        }

        // SePay kênh VietinBank / bank feed: gateway + transferAmount, không có transferType
        if (!isset($data['transferType']) && isset($data['gateway']) && isset($data['transferAmount'])) {
            $data['transferType'] = 'in';
            if (($data['content'] ?? '') === '' && ($data['description'] ?? '') !== '') {
                $data['content'] = $data['description'];
            }
            if (($data['code'] ?? '') === '' && ($data['referenceCode'] ?? '') !== '') {
                $data['code'] = $data['referenceCode'];
            }
        }

        // Phát hiện format payload:
        // A) SePay Payment Gateway IPN: có trường notification_type + order
        // B) SePay Bank Monitoring Webhook: có trường transferType + code + content
        $invoice    = '';
        $paidAmount = 0.0;
        $rawCode    = '';
        $rawContent = '';

        if (isset($data['transferType'])) {
            // === Format B: Bank Monitoring Webhook ===
            // Chỉ xử lý giao dịch tiền VÀO
            if (strtolower((string)($data['transferType'] ?? '')) !== 'in') {
                http_response_code(200);
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode(['success' => true]);
                return;
            }

            // SePay Bank webhook có thể dùng field `code` (mã SePay trích từ nội dung CK)
            // hoặc `content` (toàn bộ nội dung chuyển khoản). Thử cả hai để tìm invoice.
            // SePay cũng có thể strip dấu gạch ngang: "INV-20260328-AB12" → "INV20260328AB12".
            $rawCode    = trim((string)($data['code']    ?? ''));
            $rawContent = trim((string)($data['content'] ?? ''));

            // Lấy tất cả pending trong 1 query, rồi match ở PHP để hỗ trợ LIKE/regex
            $candidateCount = 0;
            if ($rawCode !== '' || $rawContent !== '') {
                // Ưu tiên: khớp chính xác order_invoice với code; rồi stripped; rồi content chứa invoice
                $stAll = $this->db->prepare(
                    "SELECT order_invoice FROM sepay_pending_orders
                      WHERE status = 'pending'
                      ORDER BY id DESC LIMIT 50"
                );
                $stAll->execute();
                $candidates = $stAll->fetchAll(PDO::FETCH_COLUMN);
                $candidateCount = is_array($candidates) ? count($candidates) : 0;

                foreach ($candidates as $inv) {
                    $invStripped = str_replace('-', '', $inv);
                    // Khớp chính xác code = invoice hoặc code stripped = invoice stripped
                    if ($rawCode === $inv || str_replace('-', '', $rawCode) === $invStripped) {
                        $invoice = $inv; break;
                    }
                    // code chứa invoice hoặc invoice là chuỗi con của code
                    if ($rawCode !== '' && (strpos($rawCode, $invStripped) !== false || strpos($invStripped, str_replace('-', '', $rawCode)) !== false)) {
                        $invoice = $inv; break;
                    }
                    // nội dung CK chứa invoice (khách tự ghi)
                    if ($rawContent !== '' && (strpos(strtoupper($rawContent), strtoupper($inv)) !== false || strpos(strtoupper($rawContent), strtoupper($invStripped)) !== false)) {
                        $invoice = $inv; break;
                    }
                }
                // Chuẩn POS: INV-yyyymmddhhmmss-XXXXXX (6 ký tự hex) — bank đôi khi cắt/ghép khác substring
                if ($invoice === '') {
                    $hay = $rawCode . "\n" . $rawContent;
                    if ($hay !== '' && preg_match('/INV-\d{14}-[A-F0-9]{6}/i', $hay, $m)) {
                        $tag = strtoupper($m[0]);
                        foreach ($candidates as $inv) {
                            $u = strtoupper((string)$inv);
                            if ($u === $tag || str_replace('-', '', $u) === str_replace('-', '', $tag)) {
                                $invoice = $inv;
                                break;
                            }
                        }
                    }
                }
                // So khớp bỏ ký tự không phải A-Z0-9 (nội dung CK dính dấu, khoảng trắng, v.v.)
                if ($invoice === '') {
                    $blob = strtoupper((string)preg_replace('/[^A-Z0-9]/i', '', $rawCode . $rawContent));
                    foreach ($candidates as $inv) {
                        $stInv = str_replace('-', '', strtoupper((string)$inv));
                        if ($stInv !== '' && strlen($stInv) >= 18 && strpos($blob, $stInv) !== false) {
                            $invoice = $inv;
                            break;
                        }
                    }
                }
                if ($invoice === '') {
                    // Không tìm thấy trong pending — dùng raw để ghi log no_pending
                    $invoice = $rawCode !== '' ? $rawCode : $rawContent;
                }
            }
            $paidAmount = isset($data['transferAmount']) ? (float)$data['transferAmount'] : 0.0;
        } else {
            // === Format A: Payment Gateway IPN ===
            $type = $data['notification_type'] ?? '';
            if ($type !== 'ORDER_PAID') {
                http_response_code(200);
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode(['success' => true]);
                return;
            }
            $order = $data['order'] ?? [];
            if (!is_array($order)) {
                http_response_code(200);
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode(['success' => true]);
                return;
            }
            $orderStatus = strtoupper((string)($order['order_status'] ?? ''));
            $okOrder = ['CAPTURED', 'APPROVED', 'PAID', 'COMPLETED', 'SUCCESS', 'SETTLED'];
            if ($orderStatus !== '' && !in_array($orderStatus, $okOrder, true)) {
                http_response_code(200);
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode(['success' => true]);
                return;
            }
            $invoice    = trim((string)($order['order_invoice_number'] ?? ''));
            $paidAmount = isset($order['order_amount']) ? (float)$order['order_amount'] : 0.0;
        }

        if ($invoice === '') {
            http_response_code(200);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode(['success' => true]);
            return;
        }

        try {
            $this->db->beginTransaction();

            $st = $this->db->prepare('SELECT * FROM sepay_pending_orders WHERE order_invoice = :inv FOR UPDATE');
            $st->execute([':inv' => $invoice]);
            $pending = $st->fetch(PDO::FETCH_ASSOC);
            if (!$pending) {
                $this->db->commit();
                $this->logModel->createLog(null, 'sepay_ipn_no_pending',
                    'tried_invoice=' . $invoice . ' rawCode=' . ($rawCode ?? '') . ' rawContent=' . substr($rawContent ?? '', 0, 120) . ' amount=' . $paidAmount
                );
                http_response_code(200);
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode(['success' => true, 'note' => 'no_pending', 'tried_invoice' => $invoice]);
                return;
            }
            if ($pending['status'] === 'paid') {
                $this->db->commit();
                http_response_code(200);
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode(['success' => true]);
                return;
            }
            if ($pending['status'] !== 'pending') {
                $this->db->commit();
                http_response_code(200);
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode(['success' => true]);
                return;
            }

            $expected = (float)$pending['amount'];
            if ($paidAmount > 0.0 && abs($paidAmount - $expected) > 1.0 && abs($paidAmount - $expected) / max($expected, 1) > 0.01) {
                $this->db->rollBack();
                $this->logModel->createLog(null, 'sepay_ipn_amount_mismatch', $invoice . ' expected=' . $expected . ' got=' . $paidAmount);
                http_response_code(200);
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode(['success' => true, 'warning' => 'amount_mismatch']);
                return;
            }

            $cartItems = json_decode((string)$pending['cart_snapshot'], true);
            if (!is_array($cartItems) || $cartItems === []) {
                $this->db->rollBack();
                http_response_code(500);
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode(['success' => false, 'message' => 'bad_snapshot']);
                return;
            }

            $cust = json_decode((string)$pending['customer_data'], true);
            if (!is_array($cust)) {
                $cust = [];
            }
            $phone = trim((string)($cust['phone'] ?? ''));
            $fullName = trim((string)($cust['full_name'] ?? ''));
            $address = trim((string)($cust['address'] ?? ''));
            $earnLoyalty = isset($cust['earn_loyalty']) ? filter_var($cust['earn_loyalty'], FILTER_VALIDATE_BOOLEAN) : true;
            $cvid = isset($cust['customer_voucher_id']) ? (int)$cust['customer_voucher_id'] : null;
            if ($cvid !== null && $cvid <= 0) {
                $cvid = null;
            }

            $staffId = (int)$pending['staff_user_id'];
            $payAmount = (float)$pending['amount'];

            $payload = PosCheckoutService::executeCheckout(
                $this->db,
                $cartItems,
                $phone,
                $fullName,
                $address,
                $payAmount,
                $earnLoyalty,
                $cvid,
                $staffId,
                'bank_transfer',
                $this->logModel,
                false
            );

            $orderId = (int)$payload['order_id'];
            $up = $this->db->prepare(
                "UPDATE sepay_pending_orders SET status = 'paid', order_id = :oid, paid_at = NOW() WHERE id = :id"
            );
            $up->execute([':oid' => $orderId, ':id' => $pending['id']]);

            $this->db->commit();

            $this->logModel->createLog($staffId, 'sepay_ipn_paid',
                'invoice=' . $invoice . ' order_id=' . $orderId . ' amount=' . $paidAmount
            );

            $sessClear = trim((string)($pending['checkout_session_id'] ?? ''));
            try {
                $this->clearPosSessionCart($sessClear !== '' ? $sessClear : null);
            } catch (Throwable $t) {
                try {
                    $this->logModel->createLog(null, 'sepay_ipn_session_clear_fail', $invoice . ' ' . $t->getMessage());
                } catch (Throwable $t2) { /* ignore */ }
            }

            http_response_code(200);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            try {
                $this->logModel->createLog(null, 'sepay_ipn_error', $invoice . ' ' . $e->getMessage());
            } catch (Throwable $t) { /* ignore */ }
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
