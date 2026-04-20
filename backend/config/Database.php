<?php
class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        // Biến môi trường (Docker Compose / Apache PassEnv). Nếu Apache không truyền getenv(),
        // trong container vẫn có file /.dockerenv → dùng host tên service MySQL là "db".
        $inDocker = file_exists('/.dockerenv');
        $host = getenv('DB_HOST');
        if ($host === false || $host === '') {
            $host = $inDocker ? 'db' : 'localhost';
        }
        $port = getenv('DB_PORT');
        if ($port === false || $port === '') {
            $port = '3306';
        }
        $dbname = getenv('DB_NAME');
        if ($dbname === false || $dbname === '') {
            $dbname = 'phonestore_pos';
        }
        $username = getenv('DB_USER');
        if ($username === false || $username === '') {
            $username = $inDocker ? 'phonestore' : 'root';
        }
        $password = getenv('DB_PASSWORD');
        if ($password === false) {
            $password = '';
        }
        if ($password === '' && $inDocker) {
            $password = 'phonestore123';
        }

        try {
            $pdoOptions = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            // Aiven (và nhiều cloud MySQL) yêu cầu SSL — bật khi DB_SSL=true
            $useSSL = strtolower((string)getenv('DB_SSL')) === 'true';
            if ($useSSL) {
                $pdoOptions[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }

            $this->connection = new PDO(
                "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
                $username,
                $password,
                $pdoOptions
            );
            $this->connection->exec("SET time_zone = '+07:00'");
            $this->ensureLoyaltySchema($this->connection, $dbname);
            $this->ensureVoucherSchema($this->connection, $dbname);
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }

    /**
     * Đồng bộ schema loyalty với migrations/002 (DB cũ / thiếu bảng hoặc cột).
     */
    private function ensureLoyaltySchema(PDO $pdo, string $schemaName): void {
        $q = $pdo->quote($schemaName);
        $chk = $pdo->query(
            "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = $q AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'loyalty_points'"
        );
        if ($chk && (int)$chk->fetchColumn() === 0) {
            $pdo->exec('ALTER TABLE customers ADD COLUMN loyalty_points INT NOT NULL DEFAULT 0');
        }
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS customer_point_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_id INT NOT NULL,
    delta INT NOT NULL,
    balance_after INT NOT NULL,
    reason VARCHAR(32) NOT NULL DEFAULT \'earn_checkout\',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    UNIQUE KEY uq_ledger_order (order_id),
    INDEX idx_customer (customer_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    /**
     * Schema voucher POS (migrations/003) — idempotent.
     */
    private function ensureVoucherSchema(PDO $pdo, string $schemaName): void {
        $q = $pdo->quote($schemaName);
        $hasCol = function ($table, $col) use ($pdo, $q) {
            $st = $pdo->query(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = $q AND TABLE_NAME = " . $pdo->quote($table) . " AND COLUMN_NAME = " . $pdo->quote($col)
            );
            return $st && (int)$st->fetchColumn() > 0;
        };

        if (!$hasCol('customers', 'lifetime_spend_vnd')) {
            $pdo->exec('ALTER TABLE customers ADD COLUMN lifetime_spend_vnd DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT \'Tich luy chi tieu\' AFTER loyalty_points');
        }

        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS voucher_tiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    min_points_required INT NOT NULL DEFAULT 0,
    min_lifetime_spend_vnd DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_amount_vnd DECIMAL(15, 2) NULL DEFAULT NULL,
    discount_percent INT NULL DEFAULT NULL,
    valid_from DATE NULL,
    valid_to DATE NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );

        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS customer_vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    tier_id INT NOT NULL,
    code VARCHAR(32) NOT NULL,
    status ENUM(\'issued\', \'used\', \'expired\') NOT NULL DEFAULT \'issued\',
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME NULL,
    order_id INT NULL,
    UNIQUE KEY uq_customer_vouchers_code (code),
    INDEX idx_customer_status (customer_id, status),
    INDEX idx_cv_order (order_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES voucher_tiers(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );

        if (!$hasCol('orders', 'subtotal_before_voucher')) {
            $pdo->exec('ALTER TABLE orders ADD COLUMN subtotal_before_voucher DECIMAL(15,2) NULL COMMENT \'Gio truoc giam\'');
        }
        if (!$hasCol('orders', 'voucher_discount')) {
            $pdo->exec('ALTER TABLE orders ADD COLUMN voucher_discount DECIMAL(15,2) NOT NULL DEFAULT 0');
        }
        if (!$hasCol('orders', 'customer_voucher_id')) {
            $pdo->exec('ALTER TABLE orders ADD COLUMN customer_voucher_id INT NULL');
        }

        $cnt = (int)$pdo->query('SELECT COUNT(*) FROM voucher_tiers')->fetchColumn();
        if ($cnt === 0) {
            $pdo->exec(
                "INSERT INTO voucher_tiers (name, min_points_required, min_lifetime_spend_vnd, discount_amount_vnd, discount_percent, active) VALUES
                ('Ưu đãi 500k chi tiêu', 0, 500000, 25000, NULL, 1),
                ('Ưu đãi 2 triệu chi tiêu', 0, 2000000, 100000, NULL, 1),
                ('Ưu đãi 10% (50 điểm)', 50, 0, NULL, 10, 1)"
            );
        }
    }

    public static function getConnection() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance->connection;
    }

    // Prevent cloning
    private function __clone() {}

    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
