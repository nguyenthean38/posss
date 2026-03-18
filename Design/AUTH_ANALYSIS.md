# 🔐 PHÂN TÍCH AUTHENTICATION SYSTEM

## 📊 BACKEND ĐANG DÙNG GÌ?

### ✅ PHP SESSION-BASED AUTHENTICATION

Backend **KHÔNG dùng JWT** hay Access Token. Backend đang dùng **PHP Session** truyền thống.

#### Cách hoạt động:

1. **Login thành công:**
```php
session_start();
$_SESSION['user_id'] = $this->userModel->id;
$_SESSION['role'] = $this->userModel->role;
$_SESSION['is_first_login'] = (bool)$this->userModel->is_first_login;
```

2. **Check authentication:**
```php
// AuthMiddleware.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION['user_id'])) {
    Response::json(["message" => "Vui lòng đăng nhập!"], 401);
}
```

3. **Logout:**
```php
$_SESSION = [];
session_destroy();
```

### 🍪 SESSION COOKIE

PHP tự động tạo cookie `PHPSESSID` để lưu session ID:
- Cookie name: `PHPSESSID` (default)
- Cookie được gửi tự động với mỗi request
- Server dùng session ID để lấy data từ `$_SESSION`

---

## 🔍 FRONTEND ĐANG DÙNG GÌ?

### ✅ ĐÚNG - Credentials: 'include'

Frontend đang dùng **đúng** với backend:

```javascript
// api.js
async request(endpoint, options = {}) {
    const config = {
        credentials: 'include', // ✅ ĐÚNG - Gửi cookies
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    const response = await fetch(url, config);
    // ...
}
```

**`credentials: 'include'`** làm gì?
- Tự động gửi cookies (bao gồm `PHPSESSID`) với mỗi request
- Nhận và lưu cookies từ server response
- Hoạt động với CORS (nếu server cho phép)

---

## ✅ SO SÁNH: SESSION vs JWT

| Tiêu chí | PHP Session (Đang dùng) | JWT Token |
|----------|-------------------------|-----------|
| **Storage** | Server-side (file/database) | Client-side (localStorage/cookie) |
| **Cookie** | PHPSESSID (session ID) | Token string |
| **Stateful** | ✅ Yes (server lưu state) | ❌ No (stateless) |
| **Scalability** | Khó scale (cần sticky session) | Dễ scale |
| **Security** | ✅ Secure (server control) | ⚠️ Cần cẩn thận (XSS risk) |
| **Logout** | ✅ Dễ (destroy session) | ⚠️ Khó (cần blacklist) |
| **Phù hợp** | ✅ Monolithic app | ✅ Microservices/API |

---

## 🎯 DỰ ÁN NÀY ĐANG DÙNG

### Backend: PHP Session
```php
// Login
session_start();
$_SESSION['user_id'] = 123;
$_SESSION['role'] = 'admin';

// Check auth
if (!isset($_SESSION['user_id'])) {
    // Not authenticated
}

// Logout
session_destroy();
```

### Frontend: Fetch with credentials
```javascript
fetch('/api/endpoint', {
    credentials: 'include', // Gửi PHPSESSID cookie
    method: 'POST',
    body: JSON.stringify(data)
});
```

### Flow:
```
1. User login → Backend tạo session → Set cookie PHPSESSID
2. Browser tự động lưu cookie
3. Mỗi request sau → Browser tự động gửi cookie
4. Backend đọc session từ PHPSESSID → Biết user là ai
5. Logout → Backend destroy session → Cookie vô hiệu
```

---

## ✅ FRONTEND CODE ĐÚNG HAY SAI?

### ✅ ĐÚNG - api.js
```javascript
async request(endpoint, options = {}) {
    const config = {
        credentials: 'include', // ✅ ĐÚNG
        ...options
    };
    return fetch(url, config);
}
```

### ✅ ĐÚNG - auth.js
```javascript
// Không cần lưu token vì dùng session cookie
function _saveUser(user) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

// Chỉ lưu user info, không lưu token
```

### ❌ KHÔNG CẦN - Access Token
Frontend **KHÔNG CẦN** lưu access token vì:
- Backend dùng PHP session
- Cookie `PHPSESSID` được browser tự động quản lý
- Không có JWT token nào cả

---

## 🔧 CẦN SỬA GÌ KHÔNG?

### ✅ KHÔNG CẦN SỬA

Code hiện tại **ĐÃ ĐÚNG** với backend PHP Session:

1. ✅ `credentials: 'include'` - Gửi cookies
2. ✅ Không lưu token trong localStorage
3. ✅ Chỉ lưu user info trong sessionStorage (để hiển thị UI)
4. ✅ Logout gọi API để destroy session

### ⚠️ CHÚ Ý CORS

Nếu frontend và backend khác domain, cần config CORS:

**Backend (PHP):**
```php
// Đầu file index.php
header('Access-Control-Allow-Origin: http://localhost:3000'); // Frontend URL
header('Access-Control-Allow-Credentials: true'); // ⚠️ QUAN TRỌNG
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH');
header('Access-Control-Allow-Headers: Content-Type');
```

**Frontend:**
```javascript
// Đã có sẵn
credentials: 'include' // ✅
```

---

## 🔐 BẢO MẬT

### ✅ Ưu điểm PHP Session
1. **Server control**: Server kiểm soát hoàn toàn session
2. **Easy logout**: Destroy session là logout ngay
3. **No XSS risk**: Không lưu token ở client
4. **HttpOnly cookie**: Cookie không thể đọc bằng JavaScript

### ⚠️ Lưu ý
1. **Session timeout**: Nên set timeout cho session
2. **HTTPS**: Nên dùng HTTPS để bảo vệ cookie
3. **CSRF**: Nên implement CSRF protection
4. **Session fixation**: Regenerate session ID sau login

---

## 📝 CHECKLIST

### Backend
- [x] Dùng PHP Session
- [x] `session_start()` trước khi dùng `$_SESSION`
- [x] Check `$_SESSION['user_id']` để verify auth
- [x] `session_destroy()` khi logout
- [ ] Set session timeout (recommended)
- [ ] Regenerate session ID sau login (recommended)
- [ ] CSRF protection (recommended)

### Frontend
- [x] `credentials: 'include'` trong fetch
- [x] Không lưu token (vì dùng session)
- [x] Lưu user info trong sessionStorage (chỉ để UI)
- [x] Gọi logout API để destroy session
- [ ] Handle session timeout (recommended)
- [ ] Redirect to login khi 401 (recommended)

### CORS (nếu cần)
- [ ] Backend: `Access-Control-Allow-Origin`
- [ ] Backend: `Access-Control-Allow-Credentials: true`
- [ ] Frontend: `credentials: 'include'`

---

## 🚀 KẾT LUẬN

### ✅ FRONTEND CODE ĐÚNG 100%

Code frontend hiện tại **HOÀN TOÀN ĐÚNG** với backend PHP Session:

1. ✅ Dùng `credentials: 'include'` để gửi cookies
2. ✅ Không lưu token (vì không có JWT)
3. ✅ Chỉ lưu user info để hiển thị UI
4. ✅ Logout gọi API đúng cách

### 📌 KHÔNG CẦN THAY ĐỔI GÌ

Giữ nguyên code hiện tại. Chỉ cần:
1. Setup backend routing
2. Config CORS nếu frontend/backend khác domain
3. Test authentication flow

---

## 🔄 AUTHENTICATION FLOW

### 1. Login
```
User → Frontend → POST /api/auth/login
                ↓
            Backend: session_start()
                    $_SESSION['user_id'] = 123
                    Set-Cookie: PHPSESSID=abc123
                ↓
            Frontend: Browser lưu cookie tự động
                     Lưu user info vào sessionStorage
```

### 2. Authenticated Request
```
User → Frontend → GET /api/products
                   Cookie: PHPSESSID=abc123
                ↓
            Backend: session_start()
                    Check $_SESSION['user_id']
                    → OK → Return data
```

### 3. Logout
```
User → Frontend → POST /api/auth/logout
                   Cookie: PHPSESSID=abc123
                ↓
            Backend: session_destroy()
                    Clear cookie
                ↓
            Frontend: Clear sessionStorage
                     Redirect to login
```

---

## 💡 TÓM TẮT

**Backend:** PHP Session (traditional, stateful)
**Frontend:** Fetch with `credentials: 'include'` (correct)
**Cookie:** PHPSESSID (auto-managed by browser)
**Token:** KHÔNG CÓ (không dùng JWT)

**Kết luận:** Code frontend **ĐÃ ĐÚNG** với backend! ✅
