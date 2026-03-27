<?php

/**
 * Quy tắc nghiệp vụ mặc định (Product có thể chỉnh sau):
 * - Tích điểm trên tổng tiền SAU giảm voucher (total_amount).
 * - Đổi voucher KHÔNG trừ điểm; chỉ áp giảm giá theo tier.
 * - Tích lũy chi tiêu (lifetime_spend_vnd) cộng theo tổng giỏ TRƯỚC giảm (subtotal).
 */
class LoyaltyVoucherRules {
    public const EARN_ON_TOTAL_AFTER_VOUCHER = true;
    public const VOUCHER_REDEEM_DEDUCTS_POINTS = false;
}
