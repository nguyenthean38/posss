# 🔧 Sửa lỗi: Backend không nhận FormData

## ❌ Vấn đề

Khi tạo sản phẩm với ảnh (multipart/form-data), backend trả về lỗi:
```
400 Bad Request
"Dữ liệu sản phẩm không hợp lệ"
```

### Dữ liệu gửi lên (HỢP LỆ):
```
product_name: "hôil"
barcode: "pop8"
type: "phone"
category_id: 2
import_price: 87776
selling_price: 2333333
stock_quantity: 9
image: (binary)
```

Nhưng vẫn báo lỗi! 😱

---

## 🔍 Nguyên nhân

### Backend `index.php` chỉ parse JSON:

```php
// Lấy Body Payload (JSON Parse)
$data = json_decode(file_get_contents("php://input"), true);
```

**Vấn đề**:
- Khi gửi `multipart/form-data` (có file upload)
- `php://input` sẽ **RỖNG**
- `$data` = `null`
- Tất cả field trong `$_POST` **KHÔNG được đọc**!

### Kết quả:
```php
// ProductController.php
$categoryId = isset($data['category_id']) ? (int)$data['category_id'] : 0;
// $data = null → $categoryId = 0

if ($categoryId <= 0 || ...) {
    Response::json(["message" => "Dữ liệu sản phẩm không hợp lệ"], 400);
    // ❌ Lỗi ở đây!
}
```

---

## ✅ Giải pháp

### Sửa `index.php` để xử lý cả JSON và FormData:

```php
// Lấy Body Payload
// Nếu là multipart/form-data (có file upload) → dùng $_POST
// Nếu là application/json → parse JSON từ php://input
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'multipart/form-data') !== false) {
    // FormData: Lấy từ $_POST
    $data = $_POST;
} else {
    // JSON: Parse từ php://input
    $data = json_decode(file_get_contents("php://input"), true);
}
```

---

## 🎯 Kết quả

### ❌ Trước khi fix:
```
POST /api/products
Content-Type: multipart/form-data

→ $data = null
→ $categoryId = 0
→ 400 Bad Request: "Dữ liệu sản phẩm không hợp lệ"
```

### ✅ Sau khi fix:
```
POST /api/products
Content-Type: multipart/form-data

→ $data = $_POST (có đầy đủ field)
→ $categoryId = 2
→ 201 Created: Sản phẩm được tạo thành công!
```

---

## 📝 Lưu ý

### Content-Type được xử lý:

1. **`application/json`** → Parse từ `php://input`
   - Dùng cho: Login, Logout, Update không có file

2. **`multipart/form-data`** → Lấy từ `$_POST`
   - Dùng cho: Upload ảnh sản phẩm, avatar, etc.

### File upload:
- Text fields: `$_POST['field_name']`
- File fields: `$_FILES['file_name']`

---

## 🧪 Test

### Test 1: Tạo sản phẩm với ảnh
```
POST /api/products
Content-Type: multipart/form-data

FormData:
- product_name: "iPhone 15"
- barcode: "IP15"
- category_id: 1
- import_price: 20000000
- selling_price: 25000000
- stock_quantity: 10
- image: [file]

→ Kết quả: 201 Created ✅
```

### Test 2: Login (JSON)
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

→ Kết quả: 200 OK ✅
```

---

## Files đã sửa

✅ `backend/index.php`
- Thêm logic phân biệt JSON và FormData
- Sử dụng `$_POST` cho multipart/form-data
- Sử dụng `php://input` cho application/json

---

## Cách test

1. Hard refresh browser (Ctrl + Shift + R)
2. Login với admin
3. Vào trang Products
4. Click "Thêm sản phẩm"
5. Điền đầy đủ thông tin + chọn ảnh
6. Click "Lưu"
7. Kết quả: Sản phẩm được tạo thành công! ✅
