<?php

class ShiftAttendance {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    private function tz(): DateTimeZone {
        return new DateTimeZone('Asia/Ho_Chi_Minh');
    }

    public function currentWorkDate(): string {
        return (new DateTimeImmutable('now', $this->tz()))->format('Y-m-d');
    }

    public function nowServer(): DateTimeImmutable {
        return new DateTimeImmutable('now', $this->tz());
    }

    public function getTodayStatus(int $userId): array {
        $wd = $this->currentWorkDate();
        $sql = "SELECT id, user_id, work_date, clock_in_at, clock_out_at, status, notes, created_at, updated_at
                FROM shift_attendance
                WHERE user_id = :uid AND work_date = :wd
                LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':wd', $wd);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return [
            'work_date' => $wd,
            'record' => $row ? $this->formatRow($row) : null,
        ];
    }

    private function formatRow(array $row): array {
        $tz = $this->tz();
        foreach (['clock_in_at', 'clock_out_at', 'created_at', 'updated_at'] as $k) {
            if (!empty($row[$k]) && is_string($row[$k])) {
                $dt = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $row[$k], $tz);
                if (!$dt) {
                    $dt = new DateTimeImmutable($row[$k], $tz);
                }
                $row[$k . '_iso'] = $dt->format('c');
            }
        }
        return $row;
    }

    public function clockIn(int $userId, ?string $note): array {
        $this->conn->beginTransaction();
        try {
            $wd = $this->currentWorkDate();
            $nowStr = $this->nowServer()->format('Y-m-d H:i:s');

            $chk = $this->conn->prepare(
                "SELECT id, status, clock_out_at FROM shift_attendance
                 WHERE user_id = :uid AND work_date = :wd FOR UPDATE"
            );
            $chk->bindValue(':uid', $userId, PDO::PARAM_INT);
            $chk->bindValue(':wd', $wd);
            $chk->execute();
            $ex = $chk->fetch(PDO::FETCH_ASSOC);

            if ($ex) {
                if ($ex['status'] === 'open' || $ex['clock_out_at'] === null) {
                    $this->conn->rollBack();
                    return ['ok' => false, 'code' => 409, 'message' => 'Bạn đã chấm vào ca hôm nay.'];
                }
                $this->conn->rollBack();
                return ['ok' => false, 'code' => 409, 'message' => 'Đã hoàn thành ca trong ngày, không thể chấm vào lại.'];
            }

            $ins = $this->conn->prepare(
                "INSERT INTO shift_attendance (user_id, work_date, clock_in_at, status, notes)
                 VALUES (:uid, :wd, :cin, 'open', :notes)"
            );
            $ins->bindValue(':uid', $userId, PDO::PARAM_INT);
            $ins->bindValue(':wd', $wd);
            $ins->bindValue(':cin', $nowStr);
            if ($note !== null && trim($note) !== '') {
                $ins->bindValue(':notes', trim($note), PDO::PARAM_STR);
            } else {
                $ins->bindValue(':notes', null, PDO::PARAM_NULL);
            }
            $ins->execute();
            $id = (int)$this->conn->lastInsertId();

            $this->conn->commit();

            $row = $this->getById($id);
            return ['ok' => true, 'record' => $row];
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }

    public function clockOut(int $userId): array {
        $this->conn->beginTransaction();
        try {
            $wd = $this->currentWorkDate();
            $nowStr = $this->nowServer()->format('Y-m-d H:i:s');

            $sel = $this->conn->prepare(
                "SELECT id, status FROM shift_attendance
                 WHERE user_id = :uid AND work_date = :wd FOR UPDATE"
            );
            $sel->bindValue(':uid', $userId, PDO::PARAM_INT);
            $sel->bindValue(':wd', $wd);
            $sel->execute();
            $row = $sel->fetch(PDO::FETCH_ASSOC);

            if (!$row || $row['status'] !== 'open') {
                $this->conn->rollBack();
                return ['ok' => false, 'code' => 422, 'message' => 'Không có ca đang mở để chấm ra.'];
            }

            $upd = $this->conn->prepare(
                "UPDATE shift_attendance
                 SET clock_out_at = :cout, status = 'closed'
                 WHERE id = :id AND user_id = :uid"
            );
            $upd->bindValue(':cout', $nowStr);
            $upd->bindValue(':id', (int)$row['id'], PDO::PARAM_INT);
            $upd->bindValue(':uid', $userId, PDO::PARAM_INT);
            $upd->execute();

            $this->conn->commit();
            $rec = $this->getById((int)$row['id']);
            return ['ok' => true, 'record' => $rec];
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }

    public function getById(int $id): ?array {
        $sql = "SELECT * FROM shift_attendance WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->formatRow($row) : null;
    }

    public function listForUser(int $userId, ?string $from, ?string $to): array {
        $tz = $this->tz();
        $from = $from ?: (new DateTimeImmutable('-30 days', $tz))->format('Y-m-d');
        $to = $to ?: $this->currentWorkDate();

        $sql = "SELECT id, user_id, work_date, clock_in_at, clock_out_at, status, notes, created_at, updated_at
                FROM shift_attendance
                WHERE user_id = :uid AND work_date BETWEEN :f AND :t
                ORDER BY work_date DESC, id DESC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':f', $from);
        $stmt->bindValue(':t', $to);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map(fn($r) => $this->formatRow($r), $rows);
    }

    public function adminListByDate(string $date, ?int $filterUserId): array {
        $sql = "SELECT s.id, s.user_id, s.work_date, s.clock_in_at, s.clock_out_at, s.status, s.notes,
                       u.full_name AS user_name, u.email AS user_email
                FROM shift_attendance s
                INNER JOIN users u ON u.id = s.user_id
                WHERE s.work_date = :d AND u.role = 'staff'";
        if ($filterUserId !== null && $filterUserId > 0) {
            $sql .= " AND s.user_id = :uid";
        }
        $sql .= " ORDER BY s.clock_in_at ASC, s.id ASC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':d', $date);
        if ($filterUserId !== null && $filterUserId > 0) {
            $stmt->bindValue(':uid', $filterUserId, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map(fn($r) => $this->formatRow($r), $rows);
    }

    public function adminUpdate(
        int $attendanceId,
        int $actorUserId,
        string $reason,
        ?string $clockInAt,
        ?string $clockOutAt
    ): array {
        if (trim($reason) === '') {
            return ['ok' => false, 'code' => 400, 'message' => 'Vui lòng nhập lý do chỉnh sửa.'];
        }

        $old = $this->getById($attendanceId);
        if (!$old) {
            return ['ok' => false, 'code' => 404, 'message' => 'Không tìm thấy bản ghi.'];
        }

        $newIn = $clockInAt !== null ? $clockInAt : ($old['clock_in_at'] ?? null);
        $newOut = $clockOutAt !== null ? $clockOutAt : ($old['clock_out_at'] ?? null);

        if ($newIn === null) {
            return ['ok' => false, 'code' => 400, 'message' => 'Giờ vào không hợp lệ.'];
        }

        $status = ($newOut === null || $newOut === '') ? 'open' : 'adjusted';

        $this->conn->beginTransaction();
        try {
            $upd = $this->conn->prepare(
                "UPDATE shift_attendance
                 SET clock_in_at = :cin,
                     clock_out_at = :cout,
                     status = :st
                 WHERE id = :id"
            );
            $upd->bindValue(':cin', $newIn);
            if ($newOut === null || $newOut === '') {
                $upd->bindValue(':cout', null, PDO::PARAM_NULL);
            } else {
                $upd->bindValue(':cout', $newOut);
            }
            $upd->bindValue(':st', $status);
            $upd->bindValue(':id', $attendanceId, PDO::PARAM_INT);
            $upd->execute();

            $audit = $this->conn->prepare(
                "INSERT INTO shift_attendance_audit
                    (attendance_id, action, old_values, new_values, actor_user_id, reason)
                 VALUES (:aid, 'update', :oldj, :newj, :actor, :rsn)"
            );
            $audit->bindValue(':aid', $attendanceId, PDO::PARAM_INT);
            $audit->bindValue(':oldj', json_encode([
                'clock_in_at' => $old['clock_in_at'] ?? null,
                'clock_out_at' => $old['clock_out_at'] ?? null,
                'status' => $old['status'] ?? null,
            ], JSON_UNESCAPED_UNICODE));
            $audit->bindValue(':newj', json_encode([
                'clock_in_at' => $newIn,
                'clock_out_at' => ($newOut === null || $newOut === '') ? null : $newOut,
                'status' => $status,
            ], JSON_UNESCAPED_UNICODE));
            $audit->bindValue(':actor', $actorUserId, PDO::PARAM_INT);
            $audit->bindValue(':rsn', $reason);
            $audit->execute();

            $this->conn->commit();
            return ['ok' => true, 'record' => $this->getById($attendanceId)];
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }
}
