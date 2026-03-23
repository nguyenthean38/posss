# 🔧 Sửa lỗi trang Products

## Vấn đề

1. ❌ Nút "Thêm sản phẩm" không hiển thị khi login với admin
2. ❌ Trang products bị lỗi JavaScript (duplicate import)

---

## Nguyên nhân

### 1. Duplicate Import trong products.js
```javascript
// LỖI - Import getProductImage 2 lần
import { getProductImage, handleImageError } from './assets.js';
import { getProductImage } from './assets.js';
```

### 2. Class `admin-only` không được xử lý
- File `auth.js` chỉ ẩn navigation links
- KHÔNG xử lý các elements có class `admin-only`
- Nút "Thêm sản phẩm" có class `admin-only` nên bị ẩn

---

## Giải pháp đã áp dụng

### ✅ Fix 1: Xóa duplicate import
**File**: `frontend/assets/js/products.js`

```javascript
// ĐÚNG - Chỉ import 1 lần
import API from './api.js?v=5';
import { requireAuth } from './auth.js';
import { getProductImage } from './assets.js';
```

### ✅ Fix 2: Xử lý class admin-only trong auth.js
**File**: `frontend/assets/js/auth.js`

Thêm logic ẩn/hiện elements có class `admin-only`:

```javascript
// Instant RBAC UI application
document.body.setAttribute('data-role', user.role);
if (user.role !== 'admin') {
    document.querySelectorAll('a[href="categories.html"], a[href="employees.html"]').forEach(el => el.style.display = 'none');
    // Ẩn tất cả elements có class admin-only
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
} else {
    // Hiển thị tất cả elements có class admin-only cho admin
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
}
```

Áp dụng tương tự trong phần verify với server.

---

## Kết quả

✅ Nút "Thêm sản phẩm" hiển thị khi login với admin
✅ Nút "Thêm sản phẩm" ẨN khi login với staff
✅ Cột "Giá nhập" (Cost) hiển thị cho admin, ẨN cho staff
✅ Nút "Edit" và "Delete" hiển thị cho admin, ẨN cho staff
✅ Không còn lỗi JavaScript

---

## Cách test

1. **Login với admin**:
   - Username: `admin`
   - Password: `admin123`
   - Vào trang Products
   - ✅ Thấy nút "Thêm sản phẩm"
   - ✅ Thấy cột "Giá nhập"
   - ✅ Thấy nút Edit và Delete

2. **Login với staff**:
   - Username: `staff1`
   - Password: `staff123`
   - Vào trang Products
   - ✅ KHÔNG thấy nút "Thêm sản phẩm"
   - ✅ KHÔNG thấy cột "Giá nhập"
   - ✅ KHÔNG thấy nút Edit và Delete
   - ✅ Chỉ thấy nút View (xem chi tiết)

---

## Files đã sửa

1. ✅ `frontend/assets/js/products.js` - Xóa duplicate import
2. ✅ `frontend/assets/js/auth.js` - Thêm xử lý admin-only class

---

## Lưu ý

- Class `admin-only` được xử lý tự động bởi `auth.js`
- Không cần thêm CSS cho class này
- Áp dụng cho TẤT CẢ các trang (products, categories, employees, etc.)
