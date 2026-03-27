-- Voucher POS (tham chiếu). DB cũ: schema được đồng bộ tự động qua Database::ensureVoucherSchema().
-- Hoặc chạy từng khối thủ công nếu cần.

USE phonestore_pos;

CREATE TABLE IF NOT EXISTS voucher_tiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    min_points_required INT NOT NULL DEFAULT 0,
    min_lifetime_spend_vnd DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_amount_vnd DECIMAL(15, 2) NULL DEFAULT NULL,
    discount_percent INT NULL DEFAULT NULL COMMENT '0-100',
    valid_from DATE NULL,
    valid_to DATE NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    tier_id INT NOT NULL,
    code VARCHAR(32) NOT NULL,
    status ENUM('issued', 'used', 'expired') NOT NULL DEFAULT 'issued',
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME NULL,
    order_id INT NULL,
    UNIQUE KEY uq_customer_vouchers_code (code),
    INDEX idx_customer_status (customer_id, status),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES voucher_tiers(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
