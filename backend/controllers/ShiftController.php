<?php

class ShiftController {
    private $db;
    private $model;
    private $logModel;

    public function __construct($db) {
        $this->db = $db;
        $this->model = new ShiftAttendance($db);
        $this->logModel = new Log($db);
    }

    private function requireStaff(): void {
        AuthMiddleware::checkAuth();
        if (($_SESSION['role'] ?? '') !== 'staff') {
            Response::json(['message' => 'Chỉ nhân viên mới dùng điểm danh ca.'], 403);
        }
    }

    public function status() {
        $this->requireStaff();
        $uid = (int)$_SESSION['user_id'];
        $data = $this->model->getTodayStatus($uid);
        Response::json($data);
    }

    public function clockIn($data) {
        $this->requireStaff();
        $data = is_array($data) ? $data : [];
        $uid = (int)$_SESSION['user_id'];
        $note = isset($data['note']) ? trim((string)$data['note']) : null;
        $res = $this->model->clockIn($uid, $note);
        if (!$res['ok']) {
            Response::json(['message' => $res['message']], $res['code']);
        }
        $this->logModel->createLog($uid, 'shift_clock_in', 'Chấm vào ca');
        Response::json(['message' => 'Đã chấm vào ca.', 'record' => $res['record']], 201);
    }

    public function clockOut() {
        $this->requireStaff();
        $uid = (int)$_SESSION['user_id'];
        $res = $this->model->clockOut($uid);
        if (!$res['ok']) {
            Response::json(['message' => $res['message']], $res['code']);
        }
        $this->logModel->createLog($uid, 'shift_clock_out', 'Chấm ra ca');
        Response::json(['message' => 'Đã chấm ra ca.', 'record' => $res['record']]);
    }

    public function myList() {
        $this->requireStaff();
        $uid = (int)$_SESSION['user_id'];
        $from = isset($_GET['from']) ? trim($_GET['from']) : null;
        $to = isset($_GET['to']) ? trim($_GET['to']) : null;
        $items = $this->model->listForUser($uid, $from, $to);
        Response::json(['items' => $items]);
    }

    public function adminList() {
        AuthMiddleware::checkAdmin();
        $date = isset($_GET['date']) ? trim($_GET['date']) : '';
        if ($date === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            Response::json(['message' => 'Tham số date (YYYY-MM-DD) là bắt buộc.'], 400);
        }
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        if ($userId !== null && $userId <= 0) {
            $userId = null;
        }
        $items = $this->model->adminListByDate($date, $userId);
        Response::json(['date' => $date, 'items' => $items]);
    }

    public function adminUpdate($id, $data) {
        AuthMiddleware::checkAdmin();
        $data = is_array($data) ? $data : [];
        $id = (int)$id;
        if ($id <= 0) {
            Response::json(['message' => 'ID không hợp lệ.'], 400);
        }
        $old = $this->model->getById($id);
        if (!$old) {
            Response::json(['message' => 'Không tìm thấy bản ghi.'], 404);
        }
        $reason = isset($data['reason']) ? trim((string)$data['reason']) : '';
        if (array_key_exists('clock_in_at', $data)) {
            $cin = trim((string)($data['clock_in_at'] ?? ''));
            if ($cin === '') {
                $cin = null;
            }
        } else {
            $cin = $old['clock_in_at'] ?? null;
        }
        if (array_key_exists('clock_out_at', $data)) {
            $t = trim((string)($data['clock_out_at'] ?? ''));
            $cout = $t === '' ? null : $t;
        } else {
            $cout = $old['clock_out_at'] ?? null;
        }

        $actor = (int)$_SESSION['user_id'];
        $res = $this->model->adminUpdate($id, $actor, $reason, $cin, $cout);
        if (!$res['ok']) {
            Response::json(['message' => $res['message']], $res['code']);
        }
        Response::json(['message' => 'Đã cập nhật.', 'record' => $res['record']]);
    }
    public function adminExportCsv() {
        AuthMiddleware::checkAdmin();
        $date = isset($_GET['date']) ? trim($_GET['date']) : '';
        if ($date === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            Response::json(['message' => 'Tham số date (YYYY-MM-DD) là bắt buộc.'], 400);
        }
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        if ($userId !== null && $userId <= 0) {
            $userId = null;
        }
        $items = $this->model->adminListByDate($date, $userId);
        $filename = 'shift_attendance_' . $date . '.csv';
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        echo "\xEF\xBB\xBF";
        $out = fopen('php://output', 'w');
        fputcsv($out, ['id', 'user_id', 'staff_name', 'email', 'work_date', 'clock_in_at', 'clock_out_at', 'status']);
        foreach ($items as $row) {
            fputcsv($out, [
                $row['id'] ?? '',
                $row['user_id'] ?? '',
                $row['user_name'] ?? '',
                $row['user_email'] ?? '',
                $row['work_date'] ?? '',
                $row['clock_in_at'] ?? '',
                $row['clock_out_at'] ?? '',
                $row['status'] ?? '',
            ]);
        }
        fclose($out);
        exit;
    }
}