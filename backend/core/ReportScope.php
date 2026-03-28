<?php

/**
 * Phạm vi báo cáo: nhân viên chỉ xem hôm nay & đơn do chính mình; admin xem toàn bộ.
 */
class ReportScope
{
    public static function isStaffRole(): bool
    {
        return isset($_SESSION['role']) && $_SESSION['role'] === 'staff';
    }

    public static function currentUserId(): int
    {
        return (int)($_SESSION['user_id'] ?? 0);
    }

    /**
     * Nhân viên chỉ được timeline=today hoặc fromDate=toDate= hôm nay.
     */
    public static function assertStaffAllowedRange(string $timeline, string $fromDate, string $toDate): void
    {
        if (!self::isStaffRole()) {
            return;
        }
        $today = date('Y-m-d');
        if ($timeline !== '' && $timeline !== 'today') {
            Response::json([
                'message' => 'Nhân viên chỉ xem báo cáo doanh thu hôm nay của bạn. Liên hệ quản trị để xem kỳ khác.',
            ], 403);
        }
        if ($fromDate !== '' || $toDate !== '') {
            if ($fromDate === '' || $toDate === '' || $fromDate !== $toDate || $fromDate !== $today) {
                Response::json([
                    'message' => 'Nhân viên chỉ xem báo cáo doanh thu hôm nay của bạn. Liên hệ quản trị để xem kỳ khác.',
                ], 403);
            }
        }
    }
}
