-- ================================================================
-- DATABASE PATCH - PhoneStore POS
-- Chay file nay tren DB hien tai (chua co cac cot moi)
-- Neu dung docker-compose fresh (volumes moi), cac cot da co san
-- trong database.sql moi nen KHONG can chay file nay nua.
-- ================================================================

USE phonestore_pos;

-- [1] Them cot phone va address vao bang users (UC-12, UC-13)
ALTER TABLE users
    ADD COLUMN phone   VARCHAR(20) NULL AFTER avatar,
    ADD COLUMN address TEXT        NULL AFTER phone;

-- [2] Them cot description va icon vao bang categories (UC-15)
ALTER TABLE categories
    ADD COLUMN description TEXT        NULL                  AFTER category_name,
    ADD COLUMN icon        VARCHAR(50) NOT NULL DEFAULT 'other' AFTER description;

-- [3] Them cot created_at + created_by vao bang categories
ALTER TABLE categories
    ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN created_by INT NULL,
    ADD CONSTRAINT fk_cat_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- [4] Them cot created_at vao bang products
ALTER TABLE products
    ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
