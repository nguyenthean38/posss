# Voucher & tích điểm POS — vận hành

## Quy tắc mặc định (xem `config/LoyaltyVoucherRules.php`)

- Tích điểm trên **tổng sau giảm voucher** (`total_amount`).
- Đổi phiếu **không trừ điểm**; chỉ giảm tiền theo tier.
- `lifetime_spend_vnd` tăng theo **tạm tính giỏ trước giảm** (subtotal).

## API

- `GET /api/pos/loyalty-summary?phone=` — điểm, tích lũy chi tiêu, phiếu `issued`, preview tier.
- `POST /api/pos/checkout` — thêm `EarnLoyalty` (boolean, mặc định true), `CustomerVoucherId` (optional).

## DB

- Bảng `voucher_tiers`, `customer_vouchers`; cột `customers.lifetime_spend_vnd`; cột `orders.subtotal_before_voucher`, `voucher_discount`, `customer_voucher_id`.
- Cài mới: `database.sql` đã gộp. DB cũ: `ensureVoucherSchema` trong `Database.php` hoặc chạy `migrations/003_voucher_pos.sql` rồi kiểm tra cột `orders`.

## QA nhanh

1. Thanh toán có SĐT, bật tích điểm — có điểm khi đủ ngưỡng VND/điểm.
2. Tắt tích điểm — không tăng `loyalty_points` / ledger earn.
3. Đủ điều kiện tier — sau đơn có phiếu `issued` mới (nếu chưa có phiếu cùng tier đang issued).
4. Chọn phiếu — tổng thanh toán giảm, tiền khách đưa ≥ tổng sau giảm.
