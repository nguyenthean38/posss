# 🔐 GIẢI THÍCH RÕ RÀNG VỀ AUTHENTICATION

## ❌ FRONTEND KHÔNG DÙNG JWT HAY ACCESS TOKEN

### Backend: PHP Session (Stateful)
```php
// Backend KHÔNG tạo JWT token
// Backend KHÔNG trả về access token
// Backend CHỈ dùng PHP Session

// Login
session_start();
$_SESSION['user_id'] = 123;
$_SESSION['role'] = 'admin';

// Response
Response::json([
    "message" => "Đăng nhập thành công!",
    "user" => [
        "id" => 123,
        "full_name" => "Admin",
        "role" => "admin"
    ]
    // ❌ KHÔNG CÓ "token" hay "access_token"
]);
```

### Frontend: Session Storage (CHỈ để UI)
```javascript
// Frontend KHÔNG nhận token
// Frontend KHÔNG lưu token
// Frontend CHỈ lưu user info để hiển thị UI

// Login response
{
    "message": "Đăng nhập thành công!",
    "user": {
        "id": 123,
        "full_name": "Admin",
        "role": "admin"
    }
    // ❌ KHÔNG CÓ "token" field
}

// Lưu vào sessionStorage (CHỈ để hiển thị tên, role trên UI)
sessionStorage.setItem("ps_user", JSON.stringify(user));
```

---

## 🍪 AUTHENTICATION THẬT QUA COOKIE

### 1. Login Flow

```
┌─────────┐                    ┌─────────┐
│ Browser │                    │  Server │
└────┬────┘                    └────┬────┘
     │                              │
     │  POST /api/auth/login        │
     │  { username, password }      │
     ├─────────────────────────────>│
     │                              │
     │                              │ session_start()
     │                              │ $_SESSION['user_id'] = 123
     │                              │
     │  Set-Cookie: PHPSESSID=abc   │
     │  { user: {...} }             │
     │<─────────────────────────────┤
     │                              │
     │ Browser tự động lưu cookie   │
     │ PHPSESSID=abc                │
     │                              │
```

### 2. Authenticated Request Flow

```
┌─────────┐                    ┌─────────┐
│ Browser │                    │  Server │
└────┬────┘                    └────┬────┘
     │                              │
     │  GET /api/products           │
     │  Cookie: PHPSESSID=abc       │
     ├─────────────────────────────>│
     │                              │
     │                              │ session_start()
     │                              │ Check $_SESSION['user_id']
     │                              │ → User authenticated!
     │                              │
     │  { products: [...] }         │
     │<─────────────────────────────┤
     │                              │
```

---

## 📝 CODE GIẢI THÍCH

### Backend (PHP)
```php
// AuthController.php - login()
public function login($data) {
    // Verify username & password
    if (password_verify($password, $this->userModel->password_hash)) {
        
        // ✅ Tạo PHP session
        session_start();
        $_SESSION['user_id'] = $this->userModel->id;
        $_SESSION['role'] = $this->userModel->role;
        
        // ✅ PHP tự động set cookie PHPSESSID
        // Browser sẽ nhận cookie này
        
        // ✅ Response CHỈ có user info, KHÔNG có token
        Response::json([
            "message" => "Đăng nhập thành công!",
            "user" => [
                "id" => $this->userModel->id,
                "full_name" => $this->userModel->full_name,
                "role" => $this->userModel->role
            ]
            // ❌ KHÔNG CÓ: "token" hay "access_token"
        ]);
    }
}

// AuthMiddleware.php - checkAuth()
public static function checkAuth() {
    session_start();
    
    // ✅ Check session, KHÔNG check token
    if (!isset($_SESSION['user_id'])) {
        Response::json(["message" => "Vui lòng đăng nhập!"], 401);
    }
}
```

### Frontend (JavaScript)
```javascript
// api.js
async request(endpoint, options = {}) {
    const config = {
        // ✅ Gửi cookies (bao gồm PHPSESSID)
        credentials: 'include',
        ...options
    };
    
    // ❌ KHÔNG thêm Authorization header
    // ❌ KHÔNG thêm Bearer token
    
    return fetch(url, config);
}

// auth.js
export async function login(username, password) {
    const data = await api.login(username, password);
    
    // ✅ Backend đã set cookie PHPSESSID tự động
    // ✅ Browser đã lưu cookie tự động
    
    // ✅ CHỈ lưu user info để hiển thị UI
    if (data.user) {
        sessionStorage.setItem("ps_user", JSON.stringify(data.user));
    }
    
    // ❌ KHÔNG lưu token vì không có token
    // ❌ KHÔNG lưu access_token vì không có
}
```

---

## 🔄 SO SÁNH: SESSION vs JWT

### ❌ JWT/Token Based (KHÔNG DÙNG)
```javascript
// Login response (JWT)
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600
}

// Lưu token
localStorage.setItem("access_token", data.access_token);

// Gửi request
fetch('/api/products', {
    headers: {
        'Authorization': 'Bearer ' + token
    }
});
```

### ✅ PHP Session Based (ĐANG DÙNG)
```javascript
// Login response (Session)
{
    "message": "Đăng nhập thành công!",
    "user": {
        "id": 123,
        "full_name": "Admin",
        "role": "admin"
    }
    // ❌ KHÔNG CÓ token
}

// Lưu user info (CHỈ để UI)
sessionStorage.setItem("ps_user", JSON.stringify(data.user));

// Gửi request (cookie tự động)
fetch('/api/products', {
    credentials: 'include' // Browser tự động gửi PHPSESSID
    // ❌ KHÔNG CẦN Authorization header
});
```

---

## 🎯 TẠI SAO KHÔNG DÙNG JWT?

### Lý do backend chọn PHP Session:

1. **Đơn giản hơn**: Không cần implement JWT library
2. **Bảo mật hơn**: Session data ở server, không ở client
3. **Dễ logout**: `session_destroy()` là logout ngay
4. **Phù hợp monolithic**: App này là single server PHP
5. **Yêu cầu đề bài**: PHP thuần, không framework

### Khi nào nên dùng JWT?

- ❌ Monolithic PHP app → Dùng Session
- ✅ Microservices → Dùng JWT
- ✅ Mobile app → Dùng JWT
- ✅ Stateless API → Dùng JWT
- ✅ Multiple servers → Dùng JWT

---

## 📊 CHECKLIST

### Backend ✅
- [x] Dùng `session_start()`
- [x] Lưu user info trong `$_SESSION`
- [x] Check `$_SESSION['user_id']` để authenticate
- [x] `session_destroy()` khi logout
- [x] KHÔNG tạo JWT token
- [x] KHÔNG trả về access_token

### Frontend ✅
- [x] Dùng `credentials: 'include'`
- [x] KHÔNG lưu token (vì không có)
- [x] KHÔNG gửi Authorization header
- [x] CHỈ lưu user info trong sessionStorage (để UI)
- [x] Cookie PHPSESSID được browser tự động quản lý

---

## 💡 TÓM TẮT

### ❌ KHÔNG DÙNG:
- JWT Token
- Access Token
- Refresh Token
- Bearer Authentication
- Authorization Header
- localStorage cho token

### ✅ ĐANG DÙNG:
- PHP Session (`$_SESSION`)
- Cookie PHPSESSID (auto-managed)
- `credentials: 'include'` (fetch)
- sessionStorage cho user info (CHỈ để UI)

### 🔑 ĐIỂM QUAN TRỌNG:

**sessionStorage CHỈ lưu user info để hiển thị UI (tên, role), KHÔNG phải để authentication!**

**Authentication thật được backend check qua PHP Session cookie (PHPSESSID)!**

---

## 🚀 KẾT LUẬN

Frontend code hiện tại **ĐÃ ĐÚNG**:
- ✅ Không lưu token (vì không có)
- ✅ Dùng `credentials: 'include'`
- ✅ Chỉ lưu user info để hiển thị UI
- ✅ Không gửi Authorization header

Backend code **ĐÃ ĐÚNG**:
- ✅ Dùng PHP Session
- ✅ Không tạo JWT token
- ✅ Check `$_SESSION` để authenticate

**Hệ thống đang dùng PHP Session-based authentication, KHÔNG phải JWT!** ✅
