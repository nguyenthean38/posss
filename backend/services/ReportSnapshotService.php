<?php

/**
 * Dữ liệu báo cáo cho AI — cùng logic filter thời gian với ReportController,
 * trả về mảng (không Response::json, không ghi log xem báo cáo).
 */
class ReportSnapshotService
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * @param string $timeline today|yesterday|7days|month|''
     * @param string $fromDate Y-m-d
     * @param string $toDate Y-m-d
     * @param int|null $forUserId Nếu set: chỉ đơn của nhân viên này, mặc định hôm nay (dùng cho staff)
     */
    public function getSummaryOverviewData(string $timeline, string $fromDate = '', string $toDate = '', ?int $forUserId = null): array
    {
        $orderFilter = '';
        $useRange = false;
        $staffUid = null;

        // Bộ lọc thời gian — áp dụng như nhau cho admin và staff
        if ($timeline === 'today') {
            $orderFilter = " AND DATE(o.created_at) = CURDATE()";
        } elseif ($timeline === 'yesterday') {
            $orderFilter = " AND DATE(o.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
        } elseif ($timeline === '7days') {
            $orderFilter = " AND DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        } elseif ($timeline === 'month') {
            $orderFilter = " AND MONTH(o.created_at) = MONTH(CURDATE()) AND YEAR(o.created_at) = YEAR(CURDATE())";
        } elseif ($fromDate !== '' && $toDate !== '') {
            $orderFilter = " AND DATE(o.created_at) BETWEEN :fd AND :td";
            $useRange = true;
        }

        // Staff: lọc thêm theo user_id (chỉ xem đơn do chính mình bán)
        if ($forUserId !== null && $forUserId > 0) {
            $staffUid = $forUserId;
            if ($orderFilter === '') {
                $orderFilter = " AND DATE(o.created_at) = CURDATE()";
            }
            $orderFilter .= " AND o.user_id = :staff_uid";
        }

        $where = "WHERE 1=1" . $orderFilter;

        $sqlRev = "SELECT COALESCE(SUM(o.total_amount), 0) AS total_revenue,
                          COUNT(o.id) AS order_count
                   FROM orders o
                   $where";
        $stmtRev = $this->db->prepare($sqlRev);
        if ($staffUid !== null) {
            $stmtRev->bindValue(':staff_uid', $staffUid, PDO::PARAM_INT);
        }
        if ($useRange) {
            $stmtRev->bindParam(':fd', $fromDate);
            $stmtRev->bindParam(':td', $toDate);
        }
        $stmtRev->execute();
        $revRow = $stmtRev->fetch(PDO::FETCH_ASSOC);

        $sqlQty = "SELECT COALESCE(SUM(od.quantity), 0) AS total_products_sold
                   FROM order_details od
                   INNER JOIN orders o ON od.order_id = o.id
                   $where";
        $stmtQty = $this->db->prepare($sqlQty);
        if ($staffUid !== null) {
            $stmtQty->bindValue(':staff_uid', $staffUid, PDO::PARAM_INT);
        }
        if ($useRange) {
            $stmtQty->bindParam(':fd', $fromDate);
            $stmtQty->bindParam(':td', $toDate);
        }
        $stmtQty->execute();
        $qtyRow = $stmtQty->fetch(PDO::FETCH_ASSOC);

        if ($staffUid !== null) {
            $cst = $this->db->prepare(
                "SELECT COUNT(DISTINCT o.customer_id) FROM orders o $where AND o.customer_id IS NOT NULL"
            );
            $cst->bindValue(':staff_uid', $staffUid, PDO::PARAM_INT);
            if ($useRange) {
                $cst->bindParam(':fd', $fromDate);
                $cst->bindParam(':td', $toDate);
            }
            $cst->execute();
            $custCount = (int)$cst->fetchColumn();
        } else {
            $custCount = (int)$this->db->query("SELECT COUNT(*) FROM customers")->fetchColumn();
        }

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
        if ($staffUid !== null) {
            $recentStmt->bindValue(':staff_uid', $staffUid, PDO::PARAM_INT);
        }
        if ($useRange) {
            $recentStmt->bindParam(':fd', $fromDate);
            $recentStmt->bindParam(':td', $toDate);
        }
        $recentStmt->execute();
        $recentOrders = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

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
        if ($staffUid !== null) {
            $topStmt->bindValue(':staff_uid', $staffUid, PDO::PARAM_INT);
        }
        if ($useRange) {
            $topStmt->bindParam(':fd', $fromDate);
            $topStmt->bindParam(':td', $toDate);
        }
        $topStmt->execute();
        $topProducts = $topStmt->fetchAll(PDO::FETCH_ASSOC);

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
        if ($staffUid !== null) {
            $catStmt->bindValue(':staff_uid', $staffUid, PDO::PARAM_INT);
        }
        if ($useRange) {
            $catStmt->bindParam(':fd', $fromDate);
            $catStmt->bindParam(':td', $toDate);
        }
        $catStmt->execute();
        $categoryBreakdown = $catStmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'timeline_label' => $timeline,
            'scope' => $staffUid !== null ? 'staff_self' : 'store',
            'TotalRevenue' => (float)$revRow['total_revenue'],
            'OrderCount' => (int)$revRow['order_count'],
            'TotalProductsSold' => (int)$qtyRow['total_products_sold'],
            'CustomerCount' => $custCount,
            'RecentOrders' => $recentOrders,
            'TopProducts' => $topProducts,
            'CategoryBreakdown' => $categoryBreakdown,
        ];
    }

    public function getProfitData(string $fromDate, string $toDate): array
    {
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
        return [
            'fromDate' => $fromDate,
            'toDate' => $toDate,
            'TotalRevenue' => $revenue,
            'TotalCost' => $cost,
            'NetProfit' => $revenue - $cost,
        ];
    }

    /**
     * Rút gọn cho prompt — tối đa ~30 điểm
     * @param int|null $forUserId Chỉ đơn của nhân viên này (staff AI)
     */
    public function getChartData(string $type, string $period, string $fromDate, string $toDate, ?int $forUserId = null): array
    {
        $valSql = ($type === 'revenue') ? "COALESCE(SUM(o.total_amount), 0)" : "COUNT(o.id)";
        $userSql = ($forUserId !== null && $forUserId > 0) ? " AND o.user_id = :staff_uid" : '';

        if ($period === 'week') {
            $sql = "SELECT DATE(MIN(o.created_at)) AS label, $valSql AS value
                    FROM orders o
                    WHERE DATE(o.created_at) BETWEEN :fd AND :td" . $userSql . "
                    GROUP BY YEARWEEK(o.created_at)
                    ORDER BY YEARWEEK(o.created_at) ASC
                    LIMIT 52";
        } else {
            $sql = "SELECT DATE(o.created_at) AS label, $valSql AS value
                    FROM orders o
                    WHERE DATE(o.created_at) BETWEEN :fd AND :td" . $userSql . "
                    GROUP BY DATE(o.created_at)
                    ORDER BY DATE(o.created_at) ASC
                    LIMIT 31";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':fd', $fromDate);
        $stmt->bindParam(':td', $toDate);
        if ($forUserId !== null && $forUserId > 0) {
            $stmt->bindValue(':staff_uid', $forUserId, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
