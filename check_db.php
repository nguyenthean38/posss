<?php
require_once __DIR__ . '/backend/config/Database.php';

try {
    $db = Database::getConnection();
    $stmt = $db->query("SELECT id, full_name, email, role FROM users");
    $users = $stmt->fetchAll();
    
    if (empty($users)) {
        echo "No user data found in the 'users' table.\n";
    } else {
        echo "Found " . count($users) . " user(s):\n";
        foreach ($users as $user) {
            echo "- " . $user['id'] . ": " . $user['full_name'] . " (" . $user['email'] . ") [" . $user['role'] . "]\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
