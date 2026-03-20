<?php
require_once __DIR__ . '/backend/config/Database.php';
$db = Database::getConnection();
$hash = password_hash('admin', PASSWORD_DEFAULT);
$stmt = $db->prepare("UPDATE users SET password_hash = :hash WHERE email = 'admin@gmail.com'");
$stmt->execute([':hash' => $hash]);
echo "Updated admin password to 'admin'. New hash: $hash\n";
