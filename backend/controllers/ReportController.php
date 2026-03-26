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

        $orderFilter = '';
        $useRange = false;
        if ($timeline === 'today') {
            $orderFilter = " AND DATE(o.created_at) = CURDATE()";
        } elseif ($timeline === 'yesterday') {
            $orderFilter = " AND DATE(o.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
        } elseif ($timeline === '7days') {
            $orderFilter = " AND DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        } elseif ($timeline === 'month') {
            $orderFilter = " AND MONTH(o.created_at) = MONTH(CURDATE()) AND YEAR(o.created_at) = YEAR(CURDATE())";
        } elseif ($fromDate && $toDate) {
            $orderFilter = " AND DATE(o.created_at) BETWEEN :fd AND :td";
            $useRange = true;
        }
        $where = "WHERE 1=1" . $orderFilter;

        // [1a] Doanh thu + so don: chi tu bang orders (JOIN order_details se nhan ban total_amount — bug cu)
        $sqlRev = "SELECT COALESCE(SUM(o.total_amount), 0) AS total_revenue,
                          COUNT(o.id) AS order_count
                   FROM orders o
                   $where";
        $stmtRev = $this->db->prepare($sqlRev);
        if ($useRange) {
            $stmtRev->bindParam(':fd', $fromDate);
            $stmtRev->bindParam(':td', $toDate);
        }
        $stmtRev->execute();
        $revRow = $stmtRev->fetch(PDO::FETCH_ASSOC);

        // [1b] Tong so luong SP ban: tu order_details (dung join)
        $sqlQty = "SELECT COALESCE(SUM(od.quantity), 0) AS total_products_sold
                   FROM order_details od
                   INNER JOIN orders o ON od.order_id = o.id
                   $where";
        $stmtQty = $this->db->prepare($sqlQty);
        if ($useRange) {
            $stmtQty->bindParam(':fd', $fromDate);
            $stmtQty->bindParam(':td', $toDate);
        }
        $stmtQty->execute();
        $qtyRow = $stmtQty->fetch(PDO::FETCH_ASSOC);

        $result = [
            'total_revenue'       => $revRow['total_revenue'],
            'order_count'       => $revRow['order_count'],
            'total_products_sold' => $qtyRow['total_products_sold'],
        ];

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

        // [5] Doanh thu theo danh muc — LEFT JOIN neu san pham chua gan category
        $catSql = "SELECT COALESCE(cat.category_name, 'Khác') AS CategoryName,
                          SUM(od.quantity * od.unit_price) AS Revenue
                   FROM order_details od
                   JOIN orders o ON od.order_id = o.id
                   JOIN products p ON od.product_id = p.id
                   LEFT JOIN categories cat ON p.category_id = cat.id
                   $where
                   GROUP BY COALESCE(cat.id, 0), COALESCE(cat.category_name, 'Khác')
                   ORDER BY Revenue DESC
                   LIMIT 8";
        $catStmt = $this->db->prepare($catSql);
        if ($useRange) {
            $catStmt->bindParam(':fd', $fromDate);
            $catStmt->bindParam(':td', $toDate);
        }
        $catStmt->execute();
        $categoryBreakdown = $catStmt->fetchAll(PDO::FETCH_ASSOC);

        $this->logModel->createLog($_SESSION['user_id'], 'view_report_summary', 'Xem báo cáo tổng quan');

        Response::json([
            'TotalRevenue'        => (float)$result['total_revenue'],
            'OrderCount'          => (int)$result['order_count'],
            'TotalProductsSold'   => (int)$result['total_products_sold'],
            'CustomerCount'       => $custCount,
            'RecentOrders'        => $recentOrders,
            'TopProducts'         => $topProducts,
            'CategoryBreakdown'   => $categoryBreakdown,
        ]);
    }

    public function getOrdersByTimeline() {
        AuthMiddleware::checkAuth();
        $fromDate = isset($_GET['fromDate']) ? $_GET['fromDate'] : '2000-01-01';
        $toDate = isset($_GET['toDate']) ? $_GET['toDate'] : date('Y-m-d');
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['pageSize']) ? max(1, (int)$_GET['pageSize']) : 20;
        $offset = ($page - 1) * $limit;

        $sql = "SELECT o.id AS OrderId, o.created_at AS Date, c.full_name AS CustomerName,
                       u.full_name AS StaffName, o.total_amount AS TotalAmount,
                       (SELECT GROUP_CONCAT(
                            CONCAT(p.product_name, ' × ', od.quantity)
                            ORDER BY od.id ASC SEPARATOR ' · ')
                        FROM order_details od
                        INNER JOIN products p ON od.product_id = p.id
                        WHERE od.order_id = o.id
                       ) AS ItemsSummary
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                LEFT JOIN users u ON o.user_id = u.id
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
        foreach ($items as &$row) {
            if (!empty($row['ItemsSummary']) && strlen($row['ItemsSummary']) > 500) {
                $row['ItemsSummary'] = (function_exists('mb_substr')
                    ? mb_substr($row['ItemsSummary'], 0, 500, 'UTF-8')
                    : substr($row['ItemsSummary'], 0, 500)) . '…';
            }
        }
        unset($row);

        $sqlCount = "SELECT COUNT(*) AS total FROM orders o WHERE DATE(o.created_at) BETWEEN :fd AND :td";
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

        $valSql = ($type === 'revenue') ? "COALESCE(SUM(o.total_amount), 0)" : "COUNT(o.id)";

        if ($period === 'week') {
            $sql = "SELECT DATE(MIN(o.created_at)) AS label, $valSql AS value
                    FROM orders o
                    WHERE DATE(o.created_at) BETWEEN :fd AND :td
                    GROUP BY YEARWEEK(o.created_at)
                    ORDER BY YEARWEEK(o.created_at) ASC
                    LIMIT 400";
        } else {
            $sql = "SELECT DATE(o.created_at) AS label, $valSql AS value
                    FROM orders o
                    WHERE DATE(o.created_at) BETWEEN :fd AND :td
                    GROUP BY DATE(o.created_at)
                    ORDER BY DATE(o.created_at) ASC
                    LIMIT 400";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':fd', $fromDate);
        $stmt->bindParam(':td', $toDate);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::json($data);
    }
}
