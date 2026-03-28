<?php

require_once __DIR__ . '/../services/ReportSnapshotService.php';
require_once __DIR__ . '/../core/ReportScope.php';

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

        if (ReportScope::isStaffRole()) {
            ReportScope::assertStaffAllowedRange($timeline, $fromDate, $toDate);
            if ($timeline === '' && $fromDate === '' && $toDate === '') {
                $timeline = 'today';
            }
            $snap = new ReportSnapshotService($this->db);
            $row = $snap->getSummaryOverviewData('today', '', '', ReportScope::currentUserId());
        } else {
            $snap = new ReportSnapshotService($this->db);
            $row = $snap->getSummaryOverviewData($timeline, $fromDate, $toDate, null);
        }

        $this->logModel->createLog($_SESSION['user_id'], 'view_report_summary', 'Xem báo cáo tổng quan');

        Response::json([
            'TotalRevenue'        => $row['TotalRevenue'],
            'OrderCount'          => $row['OrderCount'],
            'TotalProductsSold'   => $row['TotalProductsSold'],
            'CustomerCount'       => $row['CustomerCount'],
            'RecentOrders'        => $row['RecentOrders'],
            'TopProducts'         => $row['TopProducts'],
            'CategoryBreakdown'   => $row['CategoryBreakdown'],
        ]);
    }

    public function getOrdersByTimeline() {
        AuthMiddleware::checkAuth();
        $fromDate = isset($_GET['fromDate']) ? $_GET['fromDate'] : '2000-01-01';
        $toDate = isset($_GET['toDate']) ? $_GET['toDate'] : date('Y-m-d');
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['pageSize']) ? max(1, (int)$_GET['pageSize']) : 20;
        $offset = ($page - 1) * $limit;

        $today = date('Y-m-d');
        $staffUid = 0;
        if (ReportScope::isStaffRole()) {
            if ($fromDate !== $today || $toDate !== $today) {
                Response::json([
                    'message' => 'Nhân viên chỉ xem đơn hàng hôm nay do bạn bán. Liên hệ quản trị để xem kỳ khác.',
                ], 403);
            }
            $staffUid = ReportScope::currentUserId();
        }

        $staffFilter = ($staffUid > 0) ? ' AND o.user_id = :staff_uid' : '';

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
                WHERE DATE(o.created_at) BETWEEN :fd AND :td" . $staffFilter . "
                ORDER BY o.created_at DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':fd', $fromDate);
        $stmt->bindParam(':td', $toDate);
        if ($staffUid > 0) {
            $stmt->bindValue(':staff_uid', $staffUid, PDO::PARAM_INT);
        }
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

        $sqlCount = "SELECT COUNT(*) AS total FROM orders o WHERE DATE(o.created_at) BETWEEN :fd AND :td" . $staffFilter;
        $stmtCount = $this->db->prepare($sqlCount);
        $stmtCount->bindParam(':fd', $fromDate);
        $stmtCount->bindParam(':td', $toDate);
        if ($staffUid > 0) {
            $stmtCount->bindValue(':staff_uid', $staffUid, PDO::PARAM_INT);
        }
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

        $staffUid = 0;
        if (ReportScope::isStaffRole()) {
            $today = date('Y-m-d');
            if ($fromDate !== $today || $toDate !== $today) {
                Response::json([
                    'message' => 'Nhân viên chỉ xem biểu đồ doanh thu hôm nay của bạn.',
                ], 403);
            }
            $staffUid = ReportScope::currentUserId();
        }

        $valSql = ($type === 'revenue') ? "COALESCE(SUM(o.total_amount), 0)" : "COUNT(o.id)";
        $userSql = ($staffUid > 0) ? ' AND o.user_id = :staff_uid' : '';

        if ($period === 'week') {
            $sql = "SELECT DATE(MIN(o.created_at)) AS label, $valSql AS value
                    FROM orders o
                    WHERE DATE(o.created_at) BETWEEN :fd AND :td" . $userSql . "
                    GROUP BY YEARWEEK(o.created_at)
                    ORDER BY YEARWEEK(o.created_at) ASC
                    LIMIT 400";
        } else {
            $sql = "SELECT DATE(o.created_at) AS label, $valSql AS value
                    FROM orders o
                    WHERE DATE(o.created_at) BETWEEN :fd AND :td" . $userSql . "
                    GROUP BY DATE(o.created_at)
                    ORDER BY DATE(o.created_at) ASC
                    LIMIT 400";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':fd', $fromDate);
        $stmt->bindParam(':td', $toDate);
        if ($staffUid > 0) {
            $stmt->bindValue(':staff_uid', $staffUid, PDO::PARAM_INT);
        }
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::json($data);
    }
}
