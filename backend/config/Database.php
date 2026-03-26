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
            $this->connection = new PDO(
                "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
                $username,
                $password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
            $this->connection->exec("SET time_zone = '+07:00'");
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
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
