<?php
class Mailer {
    // ================================================================
    // CẤU HÌNH GMAIL SMTP
    // Điền thông tin Gmail của bạn vào đây để gửi email thật
    // Lưu ý: Dùng "App Password" (không phải mật khẩu Gmail thường)
    // Tạo App Password tại: https://myaccount.google.com/apppasswords
    // ================================================================
    private const SMTP_HOST     = 'ssl://smtp.gmail.com';
    private const SMTP_PORT     = 465;
    private const SMTP_USER     = 'hiennguyen011973@gmail.com';
    private const SMTP_PASSWORD = 'gtjwlxcnzbyovodx';
    private const FROM_EMAIL    = 'hiennguyen011973@gmail.com';
    private const FROM_NAME     = 'PhoneStore POS';

    public static function sendLoginLink($email, $token) {
        $loginUrl = "http://localhost:8080/frontend/first-login.html?token=" . $token . "&email=" . urlencode($email);

        // Luôn ghi link vào Docker log để test không cần email thật
        error_log("[MAILER] Login link for {$email}: " . $loginUrl);

        // Nếu chưa cấu hình SMTP → ghi log và return true (chế độ test)
        if (empty(self::SMTP_USER) || empty(self::SMTP_PASSWORD)) {
            error_log("[MAILER] SMTP chưa được cấu hình. Chạy: docker logs phonestore_backend để xem link.");
            return true;
        }

        // Gửi email thật qua Gmail SMTP bằng socket
        return self::sendViaSMTP($email, $loginUrl);
    }

    // Đọc toàn bộ response SMTP (xử lý multi-line như EHLO 250-...\r\n250 ...\r\n)
    private static function smtpRead($socket): string {
        $response = '';
        while ($line = fgets($socket, 512)) {
            $response .= $line;
            // Dòng cuối của response: mã 3 số + space (không có dấu -)
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return trim($response);
    }

    private static function smtpSend($socket, string $cmd, string $expect): bool {
        fwrite($socket, $cmd);
        $resp = self::smtpRead($socket);
        error_log("[MAILER SMTP] CMD: " . trim($cmd) . " | RESP: " . substr($resp, 0, 80));
        return strpos($resp, $expect) === 0;
    }

    private static function sendViaSMTP($toEmail, $loginUrl) {
        $subject  = "=?UTF-8?B?" . base64_encode("Link đăng nhập hệ thống POS") . "?=";
        $msgBody  = "Chao ban,\r\n\r\n";
        $msgBody .= "Tai khoan cua ban tai PhoneStore POS da duoc tao.\r\n";
        $msgBody .= "Nhan vao duong link de dang nhap lan dau (hieu luc 1 phut):\r\n\r\n";
        $msgBody .= $loginUrl . "\r\n\r\n";
        $msgBody .= "Tran trong.";

        $headers  = "From: " . self::FROM_NAME . " <" . self::FROM_EMAIL . ">\r\n";
        $headers .= "To: <{$toEmail}>\r\n";
        $headers .= "Subject: {$subject}\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "Date: " . date('r') . "\r\n";

        try {
            $socket = fsockopen(self::SMTP_HOST, self::SMTP_PORT, $errno, $errstr, 15);
            if (!$socket) {
                error_log("[MAILER] Không kết nối được SMTP: {$errstr} ({$errno})");
                return false;
            }
            stream_set_timeout($socket, 15);

            // Đọc banner
            $banner = self::smtpRead($socket);
            error_log("[MAILER SMTP] BANNER: " . substr($banner, 0, 80));
            if (strpos($banner, '220') !== 0) { fclose($socket); return false; }

            // EHLO
            if (!self::smtpSend($socket, "EHLO pos-system.local\r\n", '250')) {
                fclose($socket); return false;
            }

            // AUTH LOGIN
            if (!self::smtpSend($socket, "AUTH LOGIN\r\n", '334')) {
                fclose($socket); return false;
            }

            // Username
            if (!self::smtpSend($socket, base64_encode(self::SMTP_USER) . "\r\n", '334')) {
                fclose($socket); return false;
            }

            // Password
            if (!self::smtpSend($socket, base64_encode(self::SMTP_PASSWORD) . "\r\n", '235')) {
                error_log("[MAILER] Xác thực Gmail thất bại - kiểm tra App Password");
                fclose($socket); return false;
            }

            // MAIL FROM
            if (!self::smtpSend($socket, "MAIL FROM:<" . self::SMTP_USER . ">\r\n", '250')) {
                fclose($socket); return false;
            }

            // RCPT TO
            if (!self::smtpSend($socket, "RCPT TO:<{$toEmail}>\r\n", '250')) {
                fclose($socket); return false;
            }

            // DATA
            if (!self::smtpSend($socket, "DATA\r\n", '354')) {
                fclose($socket); return false;
            }

            // Body
            fwrite($socket, $headers . "\r\n" . $msgBody . "\r\n.\r\n");
            $dataResp = self::smtpRead($socket);
            error_log("[MAILER SMTP] DATA response: " . substr($dataResp, 0, 80));
            if (strpos($dataResp, '250') !== 0) { fclose($socket); return false; }

            // QUIT
            fwrite($socket, "QUIT\r\n");
            fclose($socket);

            error_log("[MAILER] Email gửi thành công tới: {$toEmail}");
            return true;

        } catch (\Exception $e) {
            error_log("[MAILER] Exception: " . $e->getMessage());
            return false;
        }
    }
}
