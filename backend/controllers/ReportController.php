<?php
class ReportController {
    private $db;
    private $logModel;

    public function __construct($db) {
        $this->db = $db;
        $this->logModel = new Log($db);
    }

    public function getSummaryOverview() {
        AuthMiddleware::checkAuth();
        $timeline = isset($_GET['timeline']) ? $_GET['timeline'] : '';
        $fromDate = isset($_GET['fromDate']) ? $_GET['fromDate'] : '';
        $toDate   = isset($_GET['toDate'])   ? $_GET['toDate']   : '';

        $where = "WHERE 1=1";
        $useRange = false;
        if ($timeline === 'today') {
            $where .= " AND DATE(created_at) = CURDATE()";
        } elseif ($timeline === 'yesterday') {
            $where .= " AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
        } elseif ($timeline === '7days') {
            $where .= " AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        } elseif ($timeline === 'month') {
            $where .= " AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())";
        } elseif ($fromDate && $toDate) {
            $where   .= " AND DATE(created_at) BETWEEN :fd AND :td";
            $useRange = true;
        }

        // [1] Tổng doanh thu, số đơn, số sản phẩm bán (dùng JOIN tránh duplicate named params)
        $sql = "SELECT COALESCE(SUM(o.total_amount), 0) AS total_revenue,
                       COUNT(DISTINCT o.id) AS order_count,
                       COALESCE(SUM(od.quantity), 0) AS total_products_sold
                FROM orders o
                LEFT JOIN order_details od ON od.order_id = o.id
                " . str_replace("WHERE 1=1", "WHERE 1=1", $where);

        $stmt = $this->db->prepare($sql);
        if ($useRange) {
            $stmt->bindParam(':fd', $fromDate);
            $stmt->bindParam(':td', $toDate);
        }
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        // [2] Tổng số khách hàng (toàn bộ, không lọc thời gian)
        $custCount = (int)$this->db->query("SELECT COUNT(*) FROM customers")->fetchColumn();

        // [3] 5 đơn hàng gần nhất (theo bộ lọc thời gian hiện tại)
        $recentSql = "SELECT o.id AS OrderId,
                             DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i') AS Date,
                             COALESCE(c.full_name, 'Khách lẻ') AS CustomerName,
                             o.total_amount AS TotalAmount
                      FROM orders o
                      LEFT JOIN customers c ON o.customer_id = c.id
                      $where
                      ORDER BY o.created_at DESC
                      LIMIT 5";
        $recentStmt = $this->db->prepare($recentSql);
        if ($useRange) {
            $recentStmt->bindParam(':fd', $fromDate);
            $recentStmt->bindParam(':td', $toDate);
        }
        $recentStmt->execute();
        $recentOrders = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

        // [4] Top 4 sản phẩm bán chạy nhất (theo bộ lọc thời gian)
        $topSql = "SELECT p.product_name AS ProductName,
                          SUM(od.quantity) AS TotalSold,
                          SUM(od.quantity * od.unit_price) AS TotalRevenue
                   FROM order_details od
                   JOIN products p ON od.product_id = p.id
                   JOIN orders o ON od.order_id = o.id
                   $where
                   GROUP BY p.id, p.product_name
                   ORDER BY TotalSold DESC
                   LIMIT 4";
        $topStmt = $this->db->prepare($topSql);
        if ($useRange) {
            $topStmt->bindParam(':fd', $fromDate);
            $topStmt->bindParam(':td', $toDate);
        }
        $topStmt->execute();
        $topProducts = $topStmt->fetchAll(PDO::FETCH_ASSOC);

        $this->logModel->createLog($_SESSION['user_id'], 'view_report_summary', 'Xem báo cáo tổng quan');

        Response::json([
            'TotalRevenue'      => (float)$result['total_revenue'],
            'OrderCount'        => (int)$result['order_count'],
            'TotalProductsSold' => (int)$result['total_products_sold'],
            'CustomerCount'     => $custCount,
            'RecentOrders'      => $recentOrders,
            'TopProducts'       => $topProducts,
        ]);
    }

    public function getOrdersByTimeline() {
        AuthMiddleware::checkAuth();
        $fromDate = isset($_GET['fromDate']) ? $_GET['fromDate'] : '2000-01-01';
        $toDate = isset($_GET['toDate']) ? $_GET['toDate'] : date('Y-m-d');
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['pageSize']) ? max(1, (int)$_GET['pageSize']) : 20;
        $offset = ($page - 1) * $limit;

        $sql = "SELECT o.id as OrderId, o.created_at as Date, c.full_name as CustomerName, o.total_amount as TotalAmount
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                WHERE DATE(o.created_at) BETWEEN :fd AND :td
                ORDER BY o.created_at DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':fd', $fromDate);
        $stmt->bindParam(':td', $toDate);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $sqlCount = "SELECT COUNT(*) as total FROM orders WHERE DATE(created_at) BETWEEN :fd AND :td";
        $stmtCount = $this->db->prepare($sqlCount);
        $stmtCount->bindParam(':fd', $fromDate);
        $stmtCount->bindParam(':td', $toDate);
        $stmtCount->execute();
        $total = (int)$stmtCount->fetch(PDO::FETCH_ASSOC)['total'];

        Response::json([
            'items' => $items,
            'pagination' => [
                'totalItems' => $total,
                'totalPages' => ceil($total / $limit)
            ]
        ]);
    }

    public function getProfitAnalysis() {
        AuthMiddleware::checkAdmin();
        $fromDate = isset($_GET['fromDate']) ? $_GET['fromDate'] : '2000-01-01';
        $toDate = isset($_GET['toDate']) ? $_GET['toDate'] : date('Y-m-d');

        $sql = "SELECT COALESCE(SUM(od.quantity * od.unit_price), 0) as total_revenue,
                       COALESCE(SUM(od.quantity * od.import_price_at_sale), 0) as total_cost
                FROM order_details od
                JOIN orders o ON od.order_id = o.id
                WHERE DATE(o.created_at) BETWEEN :fd AND :td";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':fd', $fromDate);
        $stmt->bindParam(':td', $toDate);
        $stmt->execute();
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        $revenue = (float)$res['total_revenue'];
        $cost = (float)$res['total_cost'];
        $profit = $revenue - $cost;

        $this->logModel->createLog($_SESSION['user_id'], 'view_profit_report', 'Xem báo cáo lợi nhuận');

        Response::json([
            'TotalRevenue' => $revenue,
            'TotalCost' => $cost,
            'NetProfit' => $profit
        ]);
    }

    public function getSalesChartData() {
        AuthMiddleware::checkAuth();
        $type     = isset($_GET['type'])     ? $_GET['type']     : 'revenue';
        $period   = isset($_GET['period'])   ? $_GET['period']   : 'day';
        $fromDate = isset($_GET['fromDate']) ? $_GET['fromDate'] : date('Y-m-d', strtotime('-6 days'));
        $toDate   = isset($_GET['toDate'])   ? $_GET['toDate']   : date('Y-m-d');

        $valSql = ($type === 'revenue') ? "COALESCE(SUM(total_amount), 0)" : "COUNT(id)";

        if ($period === 'week') {
            $sql = "SELECT DATE(MIN(created_at)) as label, $valSql as value
                    FROM orders
                    WHERE DATE(created_at) BETWEEN :fd AND :td
                    GROUP BY YEARWEEK(created_at)
                    ORDER BY YEARWEEK(created_at) ASC
                    LIMIT 30";
        } else {
            $sql = "SELECT DATE(created_at) as label, $valSql as value
                    FROM orders
                    WHERE DATE(created_at) BETWEEN :fd AND :td
                    GROUP BY DATE(created_at)
                    ORDER BY DATE(created_at) ASC
                    LIMIT 30";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':fd', $fromDate);
        $stmt->bindParam(':td', $toDate);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::json($data);
    }
}
