<?php

require_once __DIR__ . '/../config/LoyaltyVoucherRules.php';
require_once __DIR__ . '/../models/Customer.php';
require_once __DIR__ . '/../models/LoyaltyPoints.php';
require_once __DIR__ . '/VoucherService.php';

/**
 * Logic hoan tat don POS (tien mat hoac sau khi SePay IPN) — dung chung de tranh lap.
 */
class PosCheckoutService {

    /**
     * @param array $cartItems Danh sach item giong session cart: id, product_name, barcode, selling_price, import_price, quantity
     * @return array Payload JSON cho frontend (order_id, PdfUrl, PointsEarned, ...)
     */
    /**
     * @param bool $wrapTransaction true: tu begin/commit/rollback; false: dung transaction ngoai (vd SePay IPN)
     */
    public static function executeCheckout(
        PDO $db,
        array $cartItems,
        string $phone,
        string $fullName,
        string $address,
        float $customerPay,
        bool $earnLoyalty,
        ?int $customerVoucherId,
        int $staffId,
        string $paymentMethod,
        Log $logModel,
        bool $wrapTransaction = true
    ): array {
        if (empty($cartItems)) {
            throw new InvalidArgumentException('Giỏ hàng rỗng');
        }

        $customerModel = new Customer($db);

        $subtotalBeforeVoucher = 0.0;
        foreach ($cartItems as $item) {
            $subtotalBeforeVoucher += (float)$item['selling_price'] * (int)$item['quantity'];
        }

        $voucherDiscount = 0.0;
        $lockedVoucher = null;

        $custId = null;
        if ($phone !== '') {
            $cust = $customerModel->findByPhone($phone);
            if ($cust) {
                $custId = (int)$cust['id'];
            } else {
                $nameToCreate = $fullName !== '' ? $fullName : 'Khách hàng';
                $newId = $customerModel->create($nameToCreate, $phone, $address);
                if ($newId) {
                    $custId = (int)$newId;
                }
            }
        }

        if ($customerVoucherId !== null && $custId === null) {
            throw new InvalidArgumentException('Cần số điện thoại khách để dùng phiếu');
        }

        if ($wrapTransaction) {
            $db->beginTransaction();
        }

        try {
            // Khoa va kiem tra ton kho (sap xep product_id tang dan de giam deadlock)
            $qtyByProduct = [];
            foreach ($cartItems as $item) {
                $pid = (int)$item['id'];
                if ($pid <= 0) {
                    if ($wrapTransaction && $db->inTransaction()) {
                        $db->rollBack();
                    }
                    throw new InvalidArgumentException('Sản phẩm không hợp lệ trong giỏ');
                }
                $qtyByProduct[$pid] = ($qtyByProduct[$pid] ?? 0) + (int)$item['quantity'];
            }
            ksort($qtyByProduct, SORT_NUMERIC);

            $stockLock = $db->prepare('SELECT id, product_name, stock_quantity FROM products WHERE id = ? FOR UPDATE');
            foreach ($qtyByProduct as $pid => $need) {
                $stockLock->execute([$pid]);
                $row = $stockLock->fetch(PDO::FETCH_ASSOC);
                if (!$row) {
                    if ($wrapTransaction && $db->inTransaction()) {
                        $db->rollBack();
                    }
                    throw new InvalidArgumentException('Sản phẩm không còn trong hệ thống (ID ' . $pid . ')');
                }
                $stock = (int)$row['stock_quantity'];
                if ($stock < $need) {
                    if ($wrapTransaction && $db->inTransaction()) {
                        $db->rollBack();
                    }
                    $name = (string)($row['product_name'] ?? '');
                    throw new InvalidArgumentException(
                        'Không đủ tồn kho: ' . $name . ' (còn ' . $stock . ', cần ' . $need . ').'
                    );
                }
            }

            if ($customerVoucherId !== null && $custId !== null) {
                $lockedVoucher = VoucherService::lockVoucherForRedeem($db, $customerVoucherId, $custId);
                if (!$lockedVoucher) {
                    if ($wrapTransaction && $db->inTransaction()) {
                        $db->rollBack();
                    }
                    throw new InvalidArgumentException('Phiếu không hợp lệ hoặc đã dùng');
                }
                $voucherDiscount = VoucherService::computeDiscount($lockedVoucher, (float)$subtotalBeforeVoucher);
            }

            $totalAfterVoucher = max(0.0, (float)$subtotalBeforeVoucher - $voucherDiscount);
            if ($customerPay < $totalAfterVoucher) {
                if ($wrapTransaction && $db->inTransaction()) {
                    $db->rollBack();
                }
                throw new InvalidArgumentException('Số tiền khách đưa không đủ');
            }

            $change = $customerPay - $totalAfterVoucher;

            $earnBase = LoyaltyVoucherRules::EARN_ON_TOTAL_AFTER_VOUCHER ? $totalAfterVoucher : $subtotalBeforeVoucher;

            $payMethod = $paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'cash';
            $payStatus = 'paid';

            $sql = "INSERT INTO orders (customer_id, user_id, total_amount, customer_pay, change_amount, subtotal_before_voucher, voucher_discount, customer_voucher_id, payment_method, payment_status, created_at)
                    VALUES (:cid, :uid, :total, :pay, :change, :subbf, :vdisc, :cvid, :pmethod, :pstatus, NOW())";
            $stmt = $db->prepare($sql);
            $stmt->bindValue(':cid', $custId, $custId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->bindParam(':uid', $staffId, PDO::PARAM_INT);
            $stmt->bindParam(':total', $totalAfterVoucher);
            $stmt->bindParam(':pay', $customerPay);
            $stmt->bindParam(':change', $change);
            $stmt->bindParam(':subbf', $subtotalBeforeVoucher);
            $stmt->bindParam(':vdisc', $voucherDiscount);
            $cvBind = $customerVoucherId;
            $stmt->bindValue(':cvid', $cvBind, $cvBind === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->bindValue(':pmethod', $payMethod);
            $stmt->bindValue(':pstatus', $payStatus);
            $stmt->execute();
            $orderId = (int)$db->lastInsertId();

            $sqlDetail = "INSERT INTO order_details (order_id, product_id, quantity, unit_price, import_price_at_sale)
                          VALUES (:oid, :pid, :qty, :price, :import)";
            $stmtD = $db->prepare($sqlDetail);
            $updStock = $db->prepare(
                'UPDATE products SET stock_quantity = stock_quantity - :dec WHERE id = :id AND stock_quantity >= :need'
            );

            foreach ($cartItems as $item) {
                $stmtD->bindParam(':oid', $orderId);
                $pid = (int)$item['id'];
                $stmtD->bindParam(':pid', $pid);
                $stmtD->bindParam(':qty', $item['quantity']);
                $stmtD->bindParam(':price', $item['selling_price']);
                $stmtD->bindParam(':import', $item['import_price']);
                $stmtD->execute();

                $dec = (int)$item['quantity'];
                $updStock->bindValue(':dec', $dec, PDO::PARAM_INT);
                $updStock->bindValue(':id', $pid, PDO::PARAM_INT);
                $updStock->bindValue(':need', $dec, PDO::PARAM_INT);
                $updStock->execute();
                if ($updStock->rowCount() === 0) {
                    if ($wrapTransaction && $db->inTransaction()) {
                        $db->rollBack();
                    }
                    throw new InvalidArgumentException('Không thể trừ kho (tồn không đủ hoặc đã thay đổi).');
                }
            }

            if ($custId !== null) {
                VoucherService::incrementLifetimeSpend($db, $custId, (float)$subtotalBeforeVoucher);
            }

            $pointsEarned = 0;
            $loyaltyBalance = null;
            if ($earnLoyalty && $custId) {
                $loyalty = new LoyaltyPoints($db);
                $earn = $loyalty->earnForOrder((int)$custId, $orderId, (float)$earnBase);
                if ($earn) {
                    $pointsEarned = $earn['points'];
                    $loyaltyBalance = $earn['balance_after'];
                }
            }

            if ($customerVoucherId !== null) {
                VoucherService::markVoucherUsed($db, $customerVoucherId, $orderId);
            }

            if ($custId) {
                VoucherService::issueEligibleVouchers($db, $custId);
            }

            if ($wrapTransaction) {
                $db->commit();
            }
            $logModel->createLog($staffId, 'checkout', 'Thanh toán đơn hàng ID=' . $orderId . ' method=' . $payMethod);

            return [
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
        } catch (InvalidArgumentException $e) {
            if ($wrapTransaction && $db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        } catch (Exception $e) {
            if ($wrapTransaction && $db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }
}
