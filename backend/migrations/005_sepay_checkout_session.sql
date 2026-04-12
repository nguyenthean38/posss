-- SePay POS: luu PHP session_id cua nhan vien de IPN xoa gio hang sau khi CK thanh cong
-- Chay sau 004_sepay_pos_payment.sql:
--   mysql -u USER -p DATABASE < backend/migrations/005_sepay_checkout_session.sql
-- Neu bao loi "Duplicate column": cot da ton tai, bo qua.

ALTER TABLE sepay_pending_orders
    ADD COLUMN checkout_session_id VARCHAR(128) NULL
        COMMENT 'PHP session id (nhan vien) luc tao QR'
        AFTER staff_user_id;
