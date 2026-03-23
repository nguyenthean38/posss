-- Migration: Thêm cột image cho products, users, customers
-- Date: 2024-01-20

-- 1. Thêm cột image cho products (bắt buộc)
ALTER TABLE products 
ADD COLUMN image VARCHAR(255) DEFAULT NULL AFTER barcode;

-- 2. Cột avatar cho users đã có sẵn, không cần thêm

-- 3. Thêm cột avatar cho customers (optional)
ALTER TABLE customers 
ADD COLUMN avatar VARCHAR(255) DEFAULT NULL AFTER address;

-- 4. Tạo thư mục uploads nếu chưa có (thực hiện bằng PHP)
-- backend/uploads/products/
-- backend/uploads/avatars/
-- backend/uploads/customers/

-- 5. Ảnh mặc định
-- Staff: uploads/avatars/default-staff.png
-- Customer: uploads/customers/default-customer.png
-- Product: Bắt buộc phải upload
