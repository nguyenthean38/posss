-- Loyalty points: số dư khách + sổ cái theo đơn (tích điểm khi POS checkout)
USE phonestore_pos;

ALTER TABLE customers
    ADD COLUMN loyalty_points INT NOT NULL DEFAULT 0 AFTER avatar;

CREATE TABLE IF NOT EXISTS customer_point_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_id INT NOT NULL,
    delta INT NOT NULL COMMENT 'Số điểm cộng (dương) hoặc trừ (âm) — phase 1 chỉ cộng',
    balance_after INT NOT NULL,
    reason VARCHAR(32) NOT NULL DEFAULT 'earn_checkout',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    UNIQUE KEY uq_ledger_order (order_id),
    INDEX idx_customer (customer_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
