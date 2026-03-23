# 📋 CHECKLIST: Các bước tiếp theo

## ✅ Đã hoàn thành (Backend)

- [x] Tạo FileUpload class với validation
- [x] Tạo database migration SQL
- [x] Cập nhật ProductController (store + update)
- [x] Cập nhật CustomerController (store + update)
- [x] Cập nhật Product Model
- [x] Cập nhật Customer Model
- [x] Cập nhật index.php
- [x] Tạo cấu trúc thư mục uploads/
- [x] Cập nhật API_DOCS.txt
- [x] Tạo documentation đầy đủ
- [x] Kiểm tra syntax errors (PASSED ✅)

---

## ⏳ CẦN THỰC HIỆN NGAY

### Bước 1: Chạy Database Migration ⚠️ QUAN TRỌNG
```bash
# Option 1: Docker
Get-Content backend/migrations/add_image_columns.sql | docker exec -i pos_system-db-1 mysql -uroot -proot pos_system

# Option 2: MySQL local
mysql -u root -p pos_system < backend/migrations/add_image_columns.sql

# Option 3: phpMyAdmin
# Copy nội dung file backend/migrations/add_image_columns.sql
# Paste vào SQL tab và Execute
```

**Verify migration:**
```sql
-- Kiểm tra cột đã được thêm
DESCRIBE products;  -- Phải có cột 'image'
DESCRIBE customers; -- Phải có cột 'avatar'
```

---

### Bước 2: Tạo ảnh mặc định ⚠️ QUAN TRỌNG

**Option A: Download từ placeholder.com (Nhanh nhất)**
```powershell
# Mở PowerShell tại thư mục backend/uploads/

# Tạo ảnh default-staff.png
cd avatars
Invoke-WebRequest -Uri "https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=STAFF" -OutFile "default-staff.png"

# Tạo ảnh default-customer.png
cd ../customers
Invoke-WebRequest -Uri "https://via.placeholder.com/200x200/10B981/FFFFFF?text=CUSTOMER" -OutFile "default-customer.png"
```

**Option B: Tạo bằng Paint (Windows)**
1. Mở Paint
2. Resize canvas: 200x200 pixels
3. Fill màu:
   - Staff: #3B82F6 (xanh dương)
   - Customer: #10B981 (xanh lá)
4. Thêm text "STAFF" hoặc "CUSTOMER" (màu trắng, font bold)
5. Save as PNG:
   - `backend/uploads/avatars/default-staff.png`
   - `backend/uploads/customers/default-customer.png`

**Verify:**
```powershell
# Kiểm tra file tồn tại
Test-Path backend/uploads/avatars/default-staff.png
Test-Path backend/uploads/customers/default-customer.png
# Cả 2 phải trả về: True
```

---

### Bước 3: Kiểm tra quyền thư mục

```powershell
# Windows: Không cần làm gì (mặc định có quyền ghi)

# Linux/Mac:
chmod -R 777 backend/uploads/
```

---

### Bước 4: Test API với Postman/curl

**Test 1: Tạo sản phẩm với ảnh**
```bash
curl -X POST http://localhost:8080/backend/index.php/api/products \
  -H "Cookie: PHPSESSID=YOUR_SESSION_ID" \
  -F "category_id=1" \
  -F "product_name=Test Product" \
  -F "barcode=TEST001" \
  -F "image=@C:/path/to/image.jpg" \
  -F "import_price=100000" \
  -F "selling_price=150000" \
  -F "stock_quantity=10"
```

**Expected:** Status 201, response có field "image"

**Test 2: Tạo khách hàng không có avatar**
```bash
curl -X POST http://localhost:8080/backend/index.php/api/customers \
  -H "Cookie: PHPSESSID=YOUR_SESSION_ID" \
  -F "full_name=Test Customer" \
  -F "phone_number=0123456789" \
  -F "address=Ha Noi"
```

**Expected:** Status 201, avatar = "uploads/customers/default-customer.png"

**Chi tiết test cases:** Xem file `TEST_IMAGE_UPLOAD.md`

---

## 🔄 CẦN CẬP NHẬT FRONTEND

### File cần sửa:

#### 1. `frontend/assets/js/products.js`

**Tìm function tạo/sửa sản phẩm, sửa thành:**
```javascript
// Thay vì:
const data = {
  category_id: categoryId,
  product_name: name,
  barcode: barcode,
  import_price: importPrice,
  selling_price: sellingPrice,
  stock_quantity: stockQuantity
};

fetch('/backend/index.php/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// Sửa thành:
const formData = new FormData();
formData.append('category_id', categoryId);
formData.append('product_name', name);
formData.append('barcode', barcode);
formData.append('image', imageFileInput.files[0]); // <input type="file" id="imageFileInput">
formData.append('import_price', importPrice);
formData.append('selling_price', sellingPrice);
formData.append('stock_quantity', stockQuantity);

fetch('/backend/index.php/api/products', {
  method: 'POST',
  credentials: 'include',
  body: formData
  // KHÔNG set Content-Type header!
});
```

**Thêm input file vào HTML form:**
```html
<input type="file" id="imageFileInput" accept="image/*" required>
```

#### 2. `frontend/assets/js/customers.js`

**Tương tự, sửa function tạo/sửa khách hàng:**
```javascript
const formData = new FormData();
formData.append('full_name', fullName);
formData.append('phone_number', phoneNumber);
formData.append('address', address);

// Avatar là TÙY CHỌN
if (avatarFileInput.files[0]) {
  formData.append('avatar', avatarFileInput.files[0]);
}

fetch('/backend/index.php/api/customers', {
  method: 'POST',
  credentials: 'include',
  body: formData
});
```

**Thêm input file vào HTML form:**
```html
<input type="file" id="avatarFileInput" accept="image/*">
```

---

## 📝 Checklist tổng hợp

### Backend (Đã xong ✅)
- [x] FileUpload class
- [x] Database migration
- [x] ProductController
- [x] CustomerController
- [x] Models
- [x] index.php
- [x] Documentation

### Database (Cần làm ⏳)
- [ ] Chạy migration SQL
- [ ] Verify cột đã được thêm

### Files (Cần làm ⏳)
- [ ] Tạo default-staff.png
- [ ] Tạo default-customer.png
- [ ] Verify file tồn tại

### Testing (Cần làm ⏳)
- [ ] Test tạo sản phẩm với ảnh
- [ ] Test tạo sản phẩm không có ảnh (phải lỗi)
- [ ] Test update sản phẩm với ảnh mới
- [ ] Test update sản phẩm không đổi ảnh
- [ ] Test tạo khách hàng với avatar
- [ ] Test tạo khách hàng không có avatar
- [ ] Test upload file sai định dạng (phải lỗi)
- [ ] Test upload file quá lớn (phải lỗi)

### Frontend (Cần làm ⏳)
- [ ] Sửa products.js (form tạo sản phẩm)
- [ ] Sửa products.js (form sửa sản phẩm)
- [ ] Sửa customers.js (form tạo khách hàng)
- [ ] Sửa customers.js (form sửa khách hàng)
- [ ] Thêm input file vào HTML forms
- [ ] Test UI tạo/sửa sản phẩm
- [ ] Test UI tạo/sửa khách hàng

---

## 🚀 Quick Start (Làm ngay bây giờ)

### 1️⃣ Chạy migration (2 phút)
```bash
mysql -u root -p pos_system < backend/migrations/add_image_columns.sql
```

### 2️⃣ Tạo ảnh mặc định (1 phút)
```powershell
cd backend/uploads/avatars
Invoke-WebRequest -Uri "https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=STAFF" -OutFile "default-staff.png"

cd ../customers
Invoke-WebRequest -Uri "https://via.placeholder.com/200x200/10B981/FFFFFF?text=CUSTOMER" -OutFile "default-customer.png"
```

### 3️⃣ Test với Postman (5 phút)
- Import collection từ `POSTMAN_COLLECTION.json`
- Test tạo sản phẩm với ảnh
- Test tạo khách hàng không có avatar

### 4️⃣ Cập nhật Frontend (30 phút)
- Sửa products.js
- Sửa customers.js
- Test UI

---

## 📚 Tài liệu tham khảo

- `IMAGE_UPLOAD_IMPLEMENTATION.md` - Chi tiết kỹ thuật đầy đủ
- `TEST_IMAGE_UPLOAD.md` - Hướng dẫn test chi tiết
- `API_DOCS.txt` - API documentation
- `backend/uploads/CREATE_DEFAULT_IMAGES.md` - Hướng dẫn tạo ảnh
- `COMPLETED_IMAGE_UPLOAD_SUMMARY.md` - Tổng kết

---

## ❓ Cần hỗ trợ?

### Lỗi thường gặp:

**1. "Ảnh sản phẩm là bắt buộc"**
- Đảm bảo gửi field `image` trong FormData
- Đảm bảo file input có `name="image"`

**2. "Chỉ hỗ trợ ảnh JPG, PNG, GIF, WEBP"**
- Kiểm tra định dạng file
- Đảm bảo file là ảnh thật (không đổi extension)

**3. "Lỗi upload file"**
- Check quyền thư mục uploads/
- Check disk space
- Check PHP error log

**4. Frontend không gửi được file**
- Đảm bảo dùng FormData (không dùng JSON)
- Đảm bảo KHÔNG set Content-Type header
- Đảm bảo form có `enctype="multipart/form-data"`

---

**Trạng thái hiện tại:** ✅ Backend hoàn thành, ⏳ Cần chạy migration và test
**Ưu tiên:** Chạy migration → Tạo ảnh mặc định → Test API → Cập nhật Frontend
