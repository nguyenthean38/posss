<?php
class Mailer {
    // Giả lập SMTP Gửi mail
    public static function sendLoginLink($email, $token) {
        $subject = "Link đăng nhập hệ thống POS";
        // Trong thực tế, URL này sẽ trỏ tới Route của Frontend
        $loginUrl = "http://localhost:8080/frontend/first-login.html?token=" . $token . "&email=" . urlencode($email);
        
        $message = "Chào bạn,\r\n";
        $message .= "Tài khoản của bạn đã được tạo. Vui lòng sử dụng đường link dưới đây để đăng nhập lần đầu.\r\n";
        $message .= "Đường dẫn chỉ có hiệu lực trong 1 phút:\r\n\r\n";
        $message .= $loginUrl . "\r\n\r\n";
        $message .= "Trân trọng.";

        $headers = "From: noreply@pos-system.local" . "\r\n" .
                   "Reply-To: noreply@pos-system.local" . "\r\n" .
                   "X-Mailer: PHP/" . phpversion();

        // Trong môi trường Local (XAMPP/MAMP không cấu hình SMTP), hàm mail() sẽ trả về false.
        // Tạm thời mình return true để mô phỏng thành công cho việc test luồng logic.
        // Bạn có thể tích hợp PHPMailer nếu muốn thật sự gửi qua Gmail SMTP.
        
        // return mail($email, $subject, $message, $headers);
        return true; 
    }
}
