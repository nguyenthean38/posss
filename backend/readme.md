# Khởi tạo Hệ Thống Backend Point Of Sale (POS) bằng PHP Thuần
*Tác giả: Backend Developer & Trợ lý hỗ trợ*

### 1. Giới thiệu kiến trúc
Như đã tự hứa, dự án tuân thủ luật lệ **Core PHP Thuần**, không xử dụng bất kì một framework nào như Laravel, hay CodeIgniter. 
Backend hiện tại đã được tổ chức dưới mô hình MVC (hơi tinh chỉnh nhẹ cho RESTful API), toàn bộ code đều tự viết từ đầu.

**Cấu trúc thư mục:**
* `/backend/config/Database.php` : Core Object xử lý kết nối với MySQL bằng PDO, đã tích hợp utf-8.
* `/backend/core/` : Chứa các đối tượng Core Helper. 
  * `Response.json()` tự động format HTTP headers. 
  * `Mailer.php` mô phỏng chức năng gửi Email SMTP kèm token 1 phút.
* `/backend/middlewares/AuthMiddleware.php`: Nơi phân quyền truy cập thông qua `$_SESSION` (Check Auth, Roles, và quan trọng nhất là Block những thao tác nếu Staff chưa thay đổi `is_first_login`).
* `/backend/index.php`: File cốt lõi thực hiện vai trò như bộ Router tự viết và điều hướng Request đến Controller bằng regex và so khớp chuỗi.
* `/models/` (*User, Log, PasswordToken*): Đối tượng truy vấn DB.
* `/controllers/` (*AuthController, StaffController*): Giải quyết Logic Use Case.

### 2. Tương tác với Use Case (Đã giải quyết hoàn toàn)
* **UC-01 - Tạo tài khoản**: Thực thi tại POST `/api/staff` (*StaffController*). Tự động chặn Duplicate email và tạo mật khẩu tạm thời (MSSV).
* **UC-36 - Tạo token**: Implement tại `PasswordToken::createToken()`. Random Token mã hoá SHA256 và expires sau đúng +60 giây.
* **UC-02 - Gửi email**: Hệ thống tự trigger `Mailer::sendLoginLink($email, $token)`.
* **UC-37 - Xác thực token / UC-03 - Login lần đầu**: Xử lý ở POST `/api/auth/verify-token` và POST `/api/auth/first-login`. Hủy token khỏi database khi Verify thành công để tránh Replay attacks.
* **UC-04 - Đổi mật khẩu lần đầu / UC-07 (Chặn truy cập)**: Tích hợp tại PUT `/api/auth/init-password` và `AuthMiddleware::checkAuth()`. Nó sẽ xét `is_first_login == true` và chặn hết, ngoại trừ logout và đổi mật khẩu.

### 3. Thông tin Database và Bảng SQL (ERD)

Tôi đã đọc rất kĩ Sơ đồ Cơ sở Dữ Lệu ERD (`erd.png`), nên tôi đã lọc ra **3 Bảng chính** và thiết lập code SQL tạo Schema bên trong file `/backend/database.sql`.

*Các bảng đã được Import Data Definition Language (DDL):*

1. **Bảng `users`**: Đóng vai trò hạt nhân của Module Auth.
	* Các trường đã thiết kế: `id`, `full_name`, `email` (PK), `password_hash`, `role` (ENUM: admin/staff), `avatar`, `is_first_login` (như ERD yêu cầu), `status` (active/locked).
2. **Bảng `password_tokens`**: Phục vụ Token 1 phút (One-Time Token).
	* Ánh xạ từ ERD: `id`, `user_id` (Khóa ngoại), `token_hash` (Unique, tránh lưu Raw string), `expires_at`, `is_used` (Đánh dấu token đã được sử dụng 1 lần sau đăng nhập).
3. **Bảng `logs`**: Lưu nhật ký cho quản trị viên xem.
	* Thiết kế theo ERD với các trường: `id`, `user_id` (Khoá ngoại trỏ tới Action Executor), `action` (Ví dụ: "login", "create_staff"), `details`, `created_at`. 

> **Ghi chú riêng dành cho Backend dev:** 
> Mình đã viết sẵn **Tài khoản mặc định (Default Admin)** ở cuối file `database.sql` cho bạn test: 
> Tài khoản: `admin@gmail.com`
> Mật khẩu đăng nhập: `admin` -> Mã Hash tương ứng đã được đặt đúng trong database mẫu!

### Trợ lý AI (OpenRouter)

Chat trên Dashboard gọi `POST /api/ai/chat`. Cấu hình **không dùng Composer**:

- Biến môi trường: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (slug từ [openrouter.ai/models](https://openrouter.ai/models)), tùy chọn `OPENROUTER_APP_URL`, `OPENROUTER_APP_NAME`.
- Hoặc `backend/config/openrouter.local.php` (copy từ `openrouter.local.php.example`).
- File `.env` ở gốc project hoặc `backend/.env` được nạp qua `EnvLoader` trong `index.php`.

Tạo key: [openrouter.ai/keys](https://openrouter.ai/keys).

### 4. Yêu cầu hỗ trợ thêm CSDL?
Nếu bạn muốn bổ sung hệ thống POS (Giao dịch), tôi có thể tạo thêm các bảng từ ERD: `categories`, `products`, `customers`, `orders` và `order_details` (Lưu ý: `order_details` có column đính giá vốn lúc bán). Hãy xác nhận để tôi viết SQL tiếp nhé!
