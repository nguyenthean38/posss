<?php

class LogController {
    private $logModel;

    public function __construct($db) {
        $this->logModel = new Log($db);
    }

    public function activityLogs() {
        AuthMiddleware::checkAdmin();

        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 50;
        $keyword = isset($_GET['q']) ? trim($_GET['q']) : '';

        $result = $this->logModel->getAdminList($page, $limit, $keyword);
        Response::json($result);
    }
}