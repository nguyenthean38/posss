<?php
/**
 * CLI: đặt lại mật khẩu tạm cho staff theo AppConfig (dev / sửa tay).
 * Usage: php reset_staff_temp_password.php email@domain.com
 */
if (php_sapi_name() !== 'cli') {
    exit('CLI only');
}

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/AppConfig.php';
require_once __DIR__ . '/../models/User.php';

$email = isset($argv[1]) ? trim($argv[1]) : '';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Usage: php reset_staff_temp_password.php email@domain.com\n");
    exit(1);
}

$db = Database::getConnection();
$user = new User($db);
if (!$user->findByEmail($email)) {
    fwrite(STDERR, "Không tìm thấy user với email: $email\n");
    exit(1);
}

if ($user->role !== 'staff') {
    fwrite(STDERR, "User không phải nhân viên (staff).\n");
    exit(1);
}

$plain = User::normalizeTempPassword(AppConfig::staffTempPassword());
$hash = password_hash($plain, PASSWORD_DEFAULT);

$stmt = $db->prepare('UPDATE users SET password_hash = :h WHERE id = :id LIMIT 1');
$stmt->bindParam(':h', $hash);
$stmt->bindParam(':id', $user->id, PDO::PARAM_INT);
$stmt->execute();

echo "Đã cập nhật password_hash cho id={$user->id} theo MSSV tạm hiện tại.\n";
