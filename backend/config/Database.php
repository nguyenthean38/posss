<?php
class Database {
    private $host = "127.0.0.1";   // hoặc "localhost" cũng được
    private $port = 3307;          // đúng với MySQL Workbench
    private $db_name = "pos_system";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            die(json_encode(["message" => "Lỗi kết nối CSDL."]));
        }

        return $this->conn;
    }
}