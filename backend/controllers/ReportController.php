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
        $toDate = isset($_GET['toDate']) ? $_GET['toDate'] : '';

        $where = "WHERE 1=1";
        if ($timeline === 'today') {
            $where .= " AND DATE(created_at) = CURDATE()";
        } else if ($timeline === 'yesterday') {
            $where .= " AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
        } else if ($timeline === '7days') {
            $where .= " AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        } else if ($timeline === 'month') {
            $where .= " AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())";
        } else if ($fromDate && $toDate) {
            $where .= " AND DATE(created_at) BETWEEN :fd AND :td";
        }

        $sql = "SELECT COALESCE(SUM(total_amount), 0) as total_revenue, COUNT(id) as order_count,
                       (SELECT COALESCE(SUM(quantity), 0) FROM order_details WHERE order_id IN (SELECT id FROM orders $where)) as total_products_sold
                FROM orders $where";

        $stmt = $this->db->prepare($sql);
        if ($fromDate && $toDate && $timeline === '') {
            $stmt->bindParam(':fd', $fromDate);
            $stmt->bindParam(':td', $toDate);
        }
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->logModel->createLog($_SESSION['user_id'], 'view_report_summary', 'Xem báo cáo tổng quan');

        Response::json([
            'TotalRevenue' => (float)$result['total_revenue'],
            'OrderCount' => (int)$result['order_count'],
            'TotalProductsSold' => (int)$result['total_products_sold']
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
        $type = isset($_GET['type']) ? $_GET['type'] : 'revenue';
        $period = isset($_GET['period']) ? $_GET['period'] : 'day';

        $groupSql = "";
        if ($period === 'day') {
            $groupSql = "DATE(created_at)";
        } else if ($period === 'week') {
            $groupSql = "YEARWEEK(created_at)";
        } else {
            $groupSql = "DATE(created_at)";
        }

        $valSql = "COUNT(id) as value";
        if ($type === 'revenue') {
            $valSql = "SUM(total_amount) as value";
        }

        $sql = "SELECT $groupSql as label, $valSql FROM orders GROUP BY label ORDER BY label ASC LIMIT 30";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::json($data);
    }
}
