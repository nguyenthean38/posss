-- Shift attendance MVP
USE phonestore_pos;

CREATE TABLE IF NOT EXISTS shift_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    work_date DATE NOT NULL,
    clock_in_at DATETIME NOT NULL,
    clock_out_at DATETIME NULL,
    status ENUM('open', 'closed', 'adjusted') NOT NULL DEFAULT 'open',
    shift_definition_id INT NULL,
    notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_shift_user_workdate (user_id, work_date),
    INDEX idx_work_date (work_date),
    INDEX idx_user_date_status (user_id, work_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shift_attendance_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_id INT NOT NULL,
    action VARCHAR(32) NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    actor_user_id INT NOT NULL,
    reason TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_id) REFERENCES shift_attendance(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_attendance (attendance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
