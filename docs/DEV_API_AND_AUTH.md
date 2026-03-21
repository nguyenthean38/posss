# Dev: API base URL & kích hoạt nhân viên

## Một nguồn backend + một DB

- Frontend gọi API qua [`frontend/assets/js/api.js`](../frontend/assets/js/api.js): `API_BASE = '../backend/index.php'` (đường dẫn tương đối).
- **Cùng host + port** cho: trang Admin (tạo nhân viên) và trang `first-login.html` (kích hoạt). Nếu mở FE ở `http://localhost:8080/...` mà API lại trỏ sang `http://localhost:8888/...`, hai môi trường có thể dùng **hai MySQL khác nhau** → token hợp lệ nhưng `password_hash` không khớp MSSV.

**Khuyến nghị:** phục vụ FE và `backend/index.php` từ cùng một server (Docker Compose hoặc một VirtualHost Apache).

## Mật khẩu tạm nhân viên (MSSV trưởng nhóm)

- Giá trị mặc định: **`52300003`** (cấu hình tập trung trong [`backend/config/AppConfig.php`](../backend/config/AppConfig.php)).
- Override (Docker / server): biến môi trường **`STAFF_TEMP_PASSWORD`**.
- Hash/verify dùng chuỗi đã **trim + chữ thường** (UTF-8), xem [`User::normalizeTempPassword`](../backend/models/User.php).

## Link kích hoạt email

- Token hết hạn sau **1 phút** ([`PasswordToken::createToken`](../backend/models/PasswordToken.php)).

## Gửi lại email (Admin → nhân viên)

- API `POST /api/staff/{id}/resend` ([`StaffController::resendActivation`](../backend/controllers/StaffController.php)): tạo token mới + gửi mail như cũ.
- Nếu nhân viên **vẫn chưa đổi mật khẩu lần đầu** (`is_first_login` còn bật), backend **đồng bộ lại `password_hash`** với MSSV tạm hiện tại ([`User::resetStaffTempPasswordHash`](../backend/models/User.php) + [`AppConfig::staffTempPassword`](../backend/config/AppConfig.php)), để nhập MSSV đúng với cấu hình hiện tại sau khi gửi lại mail.
- Nếu nhân viên **đã đổi mật khẩu** (`is_first_login` = false), **không** ghi đè mật khẩu — họ đăng nhập bình thường, không dùng link kích hoạt + MSSV tạm.

## Sửa tay hash trong DB (dev)

Nếu tài khoản staff tạo trước khi đổi cấu hình hoặc cần đồng bộ lại MSSV:

```bash
cd backend/scripts
php reset_staff_temp_password.php nhanvien@example.com
```

Script cập nhật `password_hash` theo `AppConfig::staffTempPassword()` hiện tại.
