<?php

/**
 * Cau hinh SePay Payment Gateway — doc tu getenv sau EnvLoader.
 */
class SepayConfig {
    public static function merchantId(): string {
        return trim((string)(getenv('SEPAY_MERCHANT_ID') ?: ''));
    }

    public static function secretKey(): string {
        return trim((string)(getenv('SEPAY_SECRET_KEY') ?: ''));
    }

    public static function isSandbox(): bool {
        $e = strtolower(trim((string)(getenv('SEPAY_ENV') ?: 'sandbox')));
        return $e !== 'production' && $e !== 'prod';
    }

    public static function checkoutPostUrl(): string {
        return self::isSandbox()
            ? 'https://pay-sandbox.sepay.vn/v1/checkout/init'
            : 'https://pay.sepay.vn/v1/checkout/init';
    }

    public static function successUrl(): string {
        $u = trim((string)(getenv('SEPAY_SUCCESS_URL') ?: ''));
        return $u !== '' ? $u : 'http://127.0.0.1:8080/frontend/pos.html?sepay=success';
    }

    public static function errorUrl(): string {
        $u = trim((string)(getenv('SEPAY_ERROR_URL') ?: ''));
        return $u !== '' ? $u : 'http://127.0.0.1:8080/frontend/pos.html?sepay=error';
    }

    public static function cancelUrl(): string {
        $u = trim((string)(getenv('SEPAY_CANCEL_URL') ?: ''));
        return $u !== '' ? $u : 'http://127.0.0.1:8080/frontend/pos.html?sepay=cancel';
    }

    public static function bankCode(): string {
        return trim((string)(getenv('SEPAY_BANK_CODE') ?: ''));
    }

    public static function accountNumber(): string {
        return trim((string)(getenv('SEPAY_ACCOUNT_NUMBER') ?: ''));
    }

    public static function accountName(): string {
        return trim((string)(getenv('SEPAY_ACCOUNT_NAME') ?: ''));
    }

    /**
     * Tiền tố nội dung chuyển khoản: VietinBank + SePay theo dõi biến động yêu cầu bắt đầu bằng SEVQR.
     * Đặt SEPAY_TRANSFER_PREFIX= (rỗng) trong .env nếu không dùng quy tắc này.
     */
    public static function transferContentPrefix(): string {
        $v = getenv('SEPAY_TRANSFER_PREFIX');
        if ($v === false) {
            return 'SEVQR';
        }
        return trim((string)$v);
    }

    /** Nội dung CK hiển thị trên QR / mô tả đơn (có SEVQR + mã INV khi bật prefix). */
    public static function formatTransferMemo(string $invoice): string {
        $inv = trim($invoice);
        $p = self::transferContentPrefix();
        if ($p === '' || $inv === '') {
            return $inv;
        }
        $plen = strlen($p);
        if (strlen($inv) >= $plen && strncasecmp($inv, $p, $plen) === 0) {
            return $inv;
        }
        return $p . ' ' . $inv;
    }

    public static function isConfigured(): bool {
        return self::merchantId() !== '' && self::secretKey() !== '';
    }
}
