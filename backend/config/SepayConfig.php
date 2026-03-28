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

    public static function isConfigured(): bool {
        return self::merchantId() !== '' && self::secretKey() !== '';
    }
}
