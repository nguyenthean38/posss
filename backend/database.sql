CREATE DATABASE IF NOT EXISTS phonestore_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE phonestore_pos;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    avatar VARCHAR(255),
    phone VARCHAR(20) NULL,
    address TEXT NULL,
    is_first_login BOOLEAN NOT NULL DEFAULT TRUE,
    status ENUM('active', 'locked') NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default admin account (admin/admin)
-- The password_hash here is generated using password_hash('admin', PASSWORD_DEFAULT)
INSERT INTO users (full_name, email, password_hash, role, is_first_login, status) 
VALUES ('Administrator', 'admin@gmail.com', '$2y$10$wE/.71W/W9/1A5R0tH79.OX/K2b4U6C4.0lW1d15Q3wZ//c1rM2I6', 'admin', FALSE, 'active');

-- Insert default staff account (staff@gmail.com/admin)
INSERT INTO users (full_name, email, password_hash, role, is_first_login, status) 
VALUES ('Staff Member', 'staff@gmail.com', '$2y$10$wE/.71W/W9/1A5R0tH79.OX/K2b4U6C4.0lW1d15Q3wZ//c1rM2I6', 'staff', FALSE, 'active');

-- BẢNG QUẢN LÝ SẢN PHẨM & DANH MỤC
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'other',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    barcode VARCHAR(255) NOT NULL UNIQUE,
    image VARCHAR(500) NULL COMMENT 'Duong dan file anh san pham',
    import_price DECIMAL(10, 2) NOT NULL COMMENT 'Giá gốc ẩn với nhân viên',
    selling_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- BẢNG QUẢN LÝ KHÁCH HÀNG & GIAO DỊCH (POS)
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    address VARCHAR(255),
    avatar VARCHAR(500) NULL COMMENT 'Duong dan anh dai dien KH',
    loyalty_points INT NOT NULL DEFAULT 0,
    lifetime_spend_vnd DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Tich luy chi tieu (truoc giam voucher)',
    updated_at DATETIME NULL,
    updated_by INT NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE voucher_tiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    min_points_required INT NOT NULL DEFAULT 0,
    min_lifetime_spend_vnd DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_amount_vnd DECIMAL(15, 2) NULL DEFAULT NULL,
    discount_percent INT NULL DEFAULT NULL,
    valid_from DATE NULL,
    valid_to DATE NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_vouchers (
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
    INDEX idx_cv_order (order_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES voucher_tiers(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    user_id INT NOT NULL COMMENT 'staff_who_sold',
    total_amount DECIMAL(15, 2) NOT NULL COMMENT 'Sau giam voucher',
    subtotal_before_voucher DECIMAL(15, 2) NULL COMMENT 'Tong gio truoc giam',
    voucher_discount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    customer_voucher_id INT NULL,
    customer_pay DECIMAL(15, 2) NOT NULL,
    change_amount DECIMAL(15, 2) NOT NULL,
    payment_method ENUM('cash','bank_transfer') NOT NULL DEFAULT 'cash',
    payment_status ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'paid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (customer_voucher_id) REFERENCES customer_vouchers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sepay_pending_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_invoice VARCHAR(64) NOT NULL,
    staff_user_id INT NOT NULL,
    order_id INT NULL,
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

INSERT INTO voucher_tiers (name, min_points_required, min_lifetime_spend_vnd, discount_amount_vnd, discount_percent, active) VALUES
('Ưu đãi 500k chi tiêu', 0, 500000, 25000, NULL, 1),
('Ưu đãi 2 triệu chi tiêu', 0, 2000000, 100000, NULL, 1),
('Ưu đãi 10% (50 điểm)', 50, 0, NULL, 10, 1);

CREATE TABLE order_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL COMMENT 'price_at_sale',
    import_price_at_sale DECIMAL(10, 2) NOT NULL COMMENT 'for_profit_report',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Sổ cái tích điểm (1 dòng/đơn) — cùng cấu trúc migrations/002_loyalty_points.sql
CREATE TABLE IF NOT EXISTS customer_point_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_id INT NOT NULL,
    delta INT NOT NULL,
    balance_after INT NOT NULL,
    reason VARCHAR(32) NOT NULL DEFAULT 'earn_checkout',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    UNIQUE KEY uq_ledger_order (order_id),
    INDEX idx_customer (customer_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- === Shift attendance (điểm danh ca) — cùng cấu trúc migrations/001_shift_attendance.sql ===
CREATE TABLE IF NOT EXISTS shift_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    work_date DATE NOT NULL,
    clock_in_at DATETIME NOT NULL,
    clock_out_at DATETIME NULL,
    status ENUM('open', 'closed', 'adjusted') NOT NULL DEFAULT 'open',
    shift_definition_id INT NULL,
    notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_shift_user_workdate (user_id, work_date),
    INDEX idx_work_date (work_date),
    INDEX idx_user_date_status (user_id, work_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shift_attendance_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_id INT NOT NULL,
    action VARCHAR(32) NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    actor_user_id INT NOT NULL,
    reason TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_id) REFERENCES shift_attendance(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_attendance (attendance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
