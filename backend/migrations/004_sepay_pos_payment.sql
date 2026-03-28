-- SePay / POS: payment method, order status, pending QR checkout
-- Chạy thủ công: mysql -u ... dbname < migrations/004_sepay_pos_payment.sql

ALTER TABLE orders
    ADD COLUMN payment_method ENUM('cash','bank_transfer') NOT NULL DEFAULT 'cash' COMMENT 'cash | bank_transfer',
    ADD COLUMN payment_status ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'paid' COMMENT 'paid for cash; pending only if extended later';

CREATE TABLE IF NOT EXISTS sepay_pending_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_invoice VARCHAR(64) NOT NULL,
    staff_user_id INT NOT NULL COMMENT 'Nhan vien tao QR',
    order_id INT NULL COMMENT 'orders.id sau khi thanh toan thanh cong',
    cart_snapshot JSON NOT NULL,
    customer_data JSON NULL,
    amount DECIMAL(15,2) NOT NULL,
    subtotal_before_voucher DECIMAL(15,2) NOT NULL DEFAULT 0,
    voucher_discount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status ENUM('pending','paid','expired','cancelled') NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expired_at DATETIME NOT NULL,
    paid_at DATETIME NULL,
    UNIQUE KEY uq_order_invoice (order_invoice),
    KEY idx_status_exp (status, expired_at),
    KEY idx_staff (staff_user_id),
    CONSTRAINT fk_sepay_pending_staff FOREIGN KEY (staff_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
