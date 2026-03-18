# 🔒 BẢO VỆ AUTHENTICATION - REDIRECT TO LOGIN

## ✅ ĐÃ IMPLEMENT

### 1. Client-Side Protection (Fast Check)

**File:** `auth.js`

```javascript
export async function requireAuth(redirectTo = "login.html") {
  const user = _loadUser();
  
  // ✅ Fast check: Nếu không có user info
  if (!user) {
    location.replace(redirectTo);
    throw new Error("Chưa đăng nhập");
  }
  
  // ✅ Real check: Verify với server
  try {
    const response = await api.getMe();
    return user;
  } catch (error) {
    // Session hết hạn
    _clearUser();
    location.replace(redirectTo);
    throw new Error("Phiên đăng nhập đã hết hạn");
  }
}
```

**Cách dùng trong mỗi page:**
```javascript
// Đầu mỗi protected page
import { requireAuth } from './auth.js';

async function init() {
    // ✅ Check auth trước khi load data
    try {
        await requireAuth();
    } catch (error) {
        return; // Đã redirect to login
    }
    
    // Load page data...
}
```

### 2. Global 401 Handler (Auto Redirect)

**File:** `api.js`

```javascript
async request(endpoint, options = {}) {
    const response = await fetch(url, config);
    
    // ✅ Handle 401 Unauthorized
    if (response.status === 401) {
        // Clear user info
        sessionStorage.removeItem('ps_user');
        
        // Auto redirect to login
        if (!window.location.pathname.includes('login.html')) {
            window.location.replace('login.html');
        }
        
        throw new Error('Phiên đăng nhập đã hết hạn');
    }
}
```

**Hoạt động tự động:**
- Bất kỳ API call nào trả về 401
- Tự động clear session
- Tự động redirect to login
- Không cần handle riêng ở mỗi page

### 3. Server-Side Protection (Real Check)

**File:** `AuthMiddleware.php`

```php
public static function checkAuth() {
    session_start();
    
    // ✅ Check PHP session
    if (!isset($_SESSION['user_id'])) {
        Response::json(["message" => "Vui lòng đăng nhập!"], 401);
    }
}
```

**Tất cả protected endpoints đều gọi:**
```php
// Đầu mỗi protected method
AuthMiddleware::checkAuth();
```

---

## 🔄 AUTHENTICATION FLOW

### Scenario 1: User chưa login, truy cập protected page

```
User → dashboard.html
       ↓
    requireAuth() check sessionStorage
       ↓
    ❌ Không có user info
       ↓
    location.replace('login.html')
       ↓
    → Hiển thị trang login
```

### Scenario 2: User đã login, session còn hạn

```
User → dashboard.html
       ↓
    requireAuth() check sessionStorage
       ↓
    ✅ Có user info
       ↓
    Call api.getMe() verify với server
       ↓
    Server check $_SESSION['user_id']
       ↓
    ✅ Session valid
       ↓
    Return user data
       ↓
    → Load dashboard data
```

### Scenario 3: User đã login, session hết hạn

```
User → dashboard.html
       ↓
    requireAuth() check sessionStorage
       ↓
    ✅ Có user info (cũ)
       ↓
    Call api.getMe() verify với server
       ↓
    Server check $_SESSION['user_id']
       ↓
    ❌ Session expired
       ↓
    Server return 401
       ↓
    api.js catch 401
       ↓
    Clear sessionStorage
       ↓
    location.replace('login.html')
       ↓
    → Hiển thị trang login
```

### Scenario 4: User đang dùng, session hết hạn giữa chừng

```
User đang ở dashboard
       ↓
    Click "Load products"
       ↓
    Call api.getProducts()
       ↓
    Server check session
       ↓
    ❌ Session expired
       ↓
    Server return 401
       ↓
    api.js catch 401 (global handler)
       ↓
    Clear sessionStorage
       ↓
    Auto redirect to login
       ↓
    → Hiển thị trang login
```

---

## 📝 IMPLEMENTATION CHECKLIST

### ✅ Đã implement

#### api.js
- [x] Global 401 handler
- [x] Auto clear sessionStorage on 401
- [x] Auto redirect to login on 401
- [x] Skip redirect if already on login page

#### auth.js
- [x] `requireAuth()` - Fast check sessionStorage
- [x] `requireAuth()` - Real check với server
- [x] Clear session on auth failure
- [x] Redirect to login on auth failure

#### Backend
- [x] `AuthMiddleware::checkAuth()` - Check PHP session
- [x] Return 401 if not authenticated
- [x] All protected endpoints use middleware

### ✅ Cách dùng trong pages

#### Protected Pages (dashboard, pos, employees, etc.)
```javascript
import { requireAuth } from './auth.js';

async function init() {
    // ✅ BƯỚC 1: Check auth
    try {
        await requireAuth();
    } catch (error) {
        return; // Đã redirect
    }
    
    // ✅ BƯỚC 2: Load data
    await loadData();
}

init();
```

#### Public Pages (login, first-login)
```javascript
// ❌ KHÔNG cần requireAuth()
// Chỉ cần check nếu đã login thì redirect
import { getCurrentUser } from './auth.js';

const user = getCurrentUser();
if (user) {
    location.href = 'dashboard.html';
}
```

---

## 🔐 SECURITY LAYERS

### Layer 1: Client-Side (Fast)
```javascript
// Check sessionStorage
if (!user) redirect to login
```
**Mục đích:** UX tốt, không cần call API

### Layer 2: Client-Side (Real)
```javascript
// Verify với server
const response = await api.getMe()
if (401) redirect to login
```
**Mục đích:** Verify session còn hạn

### Layer 3: Server-Side (Always)
```php
// Check PHP session
if (!isset($_SESSION['user_id'])) return 401
```
**Mục đích:** Security thật, không tin client

### Layer 4: Global Handler
```javascript
// Catch all 401 responses
if (response.status === 401) redirect to login
```
**Mục đích:** Catch session expire giữa chừng

---

## 🧪 TEST CASES

### Test 1: Truy cập protected page khi chưa login
```
1. Clear sessionStorage
2. Mở dashboard.html
3. ✅ Expect: Auto redirect to login.html
```

### Test 2: Login thành công
```
1. Mở login.html
2. Nhập username/password đúng
3. Click Login
4. ✅ Expect: Redirect to dashboard.html
5. ✅ Expect: sessionStorage có user info
```

### Test 3: Session hết hạn
```
1. Login thành công
2. Đợi session timeout (hoặc clear session ở server)
3. Click bất kỳ action nào (load products, etc.)
4. ✅ Expect: Auto redirect to login.html
5. ✅ Expect: sessionStorage đã clear
```

### Test 4: Logout
```
1. Login thành công
2. Click Logout
3. ✅ Expect: Call API logout
4. ✅ Expect: Clear sessionStorage
5. ✅ Expect: Redirect to login.html
```

### Test 5: Truy cập login khi đã login
```
1. Login thành công
2. Mở login.html
3. ✅ Expect: Auto redirect to dashboard.html
```

---

## 🎯 PAGES PROTECTION STATUS

| Page | Protected | requireAuth() | Status |
|------|-----------|---------------|--------|
| login.html | ❌ No | ❌ No | ✅ Public |
| first-login.html | ❌ No | ❌ No | ✅ Public |
| init-password.html | ⚠️ Partial | ✅ Yes | ✅ Protected |
| dashboard.html | ✅ Yes | ✅ Yes | ✅ Protected |
| pos.html | ✅ Yes | ✅ Yes | ✅ Protected |
| products.html | ✅ Yes | ✅ Yes | ✅ Protected |
| categories.html | ✅ Yes | ✅ Yes | ✅ Protected |
| employees.html | ✅ Yes | ✅ Yes | ✅ Protected |
| customers.html | ✅ Yes | ✅ Yes | ✅ Protected |
| reports.html | ✅ Yes | ✅ Yes | ✅ Protected |
| profile.html | ✅ Yes | ✅ Yes | ✅ Protected |

---

## 💡 BEST PRACTICES

### ✅ DO

1. **Luôn gọi `requireAuth()` đầu tiên** trong protected pages
2. **Dùng try-catch** khi gọi `requireAuth()`
3. **Return ngay** nếu auth failed (đã redirect)
4. **Trust server-side check** hơn client-side
5. **Clear sessionStorage** khi logout hoặc 401

### ❌ DON'T

1. **Không tin sessionStorage** để authenticate
2. **Không skip `requireAuth()`** ở protected pages
3. **Không handle 401 riêng** ở mỗi API call (đã có global handler)
4. **Không lưu sensitive data** trong sessionStorage
5. **Không check auth chỉ bằng UI** (ẩn/hiện button)

---

## 🚀 SUMMARY

### ✅ Đã có đầy đủ:

1. **Client-side fast check** - sessionStorage
2. **Client-side real check** - API verify
3. **Server-side check** - PHP session
4. **Global 401 handler** - Auto redirect
5. **requireAuth() helper** - Easy to use
6. **Clear session on logout** - Clean state

### 🎯 Kết quả:

**Tất cả protected pages đều tự động redirect to login nếu chưa authenticate!** ✅

**Session expire giữa chừng cũng tự động redirect!** ✅

**Security được đảm bảo ở cả client và server!** ✅
