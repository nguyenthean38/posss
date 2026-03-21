<?php
/**
 * Cấu hình ứng dụng — một nguồn cho MSSV mật khẩu tạm nhân viên (đặc tả đề bài).
 * Override: biến môi trường STAFF_TEMP_PASSWORD (ví dụ trong docker-compose).
 */
class AppConfig {
    /**
     * Mật khẩu tạm = MSSV trưởng nhóm (đối chiếu khi hash/verify: luôn normalize chữ thường trong User/Auth).
     */
    public static function staffTempPassword(): string {
        // Docker/Apache đôi khi chỉ truyền vào $_SERVER / $_ENV, không có getenv()
        $raw = getenv('STAFF_TEMP_PASSWORD');
        if ($raw === false || $raw === '') {
            $raw = $_SERVER['STAFF_TEMP_PASSWORD'] ?? $_ENV['STAFF_TEMP_PASSWORD'] ?? '';
        }
        $raw = is_string($raw) ? trim($raw) : '';
        if ($raw !== '') {
            return $raw;
        }
        return '52300003';
    }
}
