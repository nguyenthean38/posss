CREATE DATABASE IF NOT EXISTS pos_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pos_system;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    avatar VARCHAR(255),
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

-- BẢNG QUẢN LÝ SẢN PHẨM & DANH MỤC
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    barcode VARCHAR(255) NOT NULL UNIQUE,
    import_price DECIMAL(10, 2) NOT NULL COMMENT 'Giá gốc ẩn với nhân viên',
    selling_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- BẢNG QUẢN LÝ KHÁCH HÀNG & GIAO DỊCH (POS)
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    address VARCHAR(255)
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    user_id INT NOT NULL COMMENT 'staff_who_sold',
    total_amount DECIMAL(15, 2) NOT NULL,
    customer_pay DECIMAL(15, 2) NOT NULL,
    change_amount DECIMAL(15, 2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

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
