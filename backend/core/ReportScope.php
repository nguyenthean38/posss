<?php

/**
 * Phạm vi báo cáo: nhân viên xem tất cả mốc thời gian nhưng chỉ đơn do chính mình bán; admin xem toàn bộ.
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
}
