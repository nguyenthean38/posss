# Image Upload Feature Implementation

## Tổng quan

Đã hoàn thành việc thêm chức năng upload hình ảnh cho:
- **Sản phẩm (Products)**: Upload ảnh **BẮT BUỘC**
- **Khách hàng (Customers)**: Upload avatar **TÙY CHỌN** (có ảnh mặc định)
- **Nhân viên (Staff)**: Đã có avatar mặc định trong User model

---

## 1. Files đã tạo/cập nhật

### Files mới tạo:
1. `backend/core/FileUpload.php` - Class xử lý upload file
2. `backend/migrations/add_image_columns.sql` - Migration thêm cột image/avatar
3. `backend/uploads/README.md` - Hướng dẫn cấu trúc thư mục uploads
4. `backend/uploads/CREATE_DEFAULT_IMAGES.md` - Hướng dẫn tạo ảnh mặc định
5. `backend/uploads/products/.gitkeep` - Placeholder cho thư mục products
6. `backend/uploads/avatars/.gitkeep` - Placeholder cho thư mục avatars
7. `backend/uploads/customers/.gitkeep` - Placeholder cho thư mục customers

### Files đã cập nhật:
1. `backend/index.php` - Thêm require FileUpload.php
2. `backend/controllers/ProductController.php` - Thêm xử lý upload ảnh sản phẩm
3. `backend/controllers/CustomerController.php` - Thêm xử lý upload avatar khách hàng
4. `backend/models/Product.php` - Thêm parameter image vào create() và update()
5. `backend/models/Customer.php` - Thêm parameter avatar vào create() và update()
6. `backend/models/User.php` - Đã có default avatar cho staff
7. `API_DOCS.txt` - Cập nhật documentation cho image upload

---

## 2. Chi tiết thay đổi

### 2.1. FileUpload Class (`backend/core/FileUpload.php`)

**Methods:**
- `uploadImage($file, $uploadDir, $prefix, $maxSize)` - Upload và validate ảnh
- `deleteFile($filePath)` - Xóa file ảnh cũ

**Validation:**
- Định dạng: JPG, PNG, GIF, WEBP
- Kích thước tối đa: 2MB (mặc định)
- MIME type checking
- Tên file an toàn: `{prefix}{timestamp}_{random}.{ext}`

### 2.2. Database Migration (`backend/migrations/add_image_columns.sql`)

```sql
-- Thêm cột image vào bảng products (NOT NULL)
ALTER TABLE products ADD COLUMN image VARCHAR(255) NOT NULL AFTER barcode;

-- Thêm cột avatar vào bảng customers (có default)
ALTER TABLE customers ADD COLUMN avatar VARCHAR(255) DEFAULT 'uploads/customers/default-customer.png' AFTER address;

-- Cột avatar cho users đã có sẵn với default 'uploads/avatars/default-staff.png'
```

### 2.3. ProductController Changes

**store() method:**
- Thêm xử lý upload ảnh từ `$_FILES['image']`
- Ảnh là **BẮT BUỘC** - trả lỗi 400 nếu không có
- Validate và upload qua FileUpload::uploadImage()
- Lưu đường dẫn vào database

**update() method:**
- Upload ảnh mới là **TÙY CHỌN**
- Nếu có ảnh mới: upload và xóa ảnh cũ
- Nếu không có: giữ nguyên ảnh cũ

### 2.4. CustomerController Changes

**store() method:**
- Upload avatar là **TÙY CHỌN**
- Nếu không có: dùng ảnh mặc định `uploads/customers/default-customer.png`
- Validate và upload qua FileUpload::uploadImage()

**update() method:**
- Upload avatar mới là **TÙY CHỌN**
- Nếu có avatar mới: upload và xóa avatar cũ (trừ ảnh mặc định)
- Nếu không có: giữ nguyên avatar cũ

### 2.5. Model Changes

**Product Model:**
```php
public function create($categoryId, $name, $barcode, $image, $importPrice, $sellingPrice, $stockQuantity)
public function update($id, $categoryId, $name, $barcode, $image, $importPrice, $sellingPrice, $stockQuantity)
```

**Customer Model:**
```php
public function create($fullName, $phoneNumber, $address = null, $avatar = null)
public function update($id, $fullName, $phoneNumber, $address, $avatar = null)
```

---

## 3. API Changes

### 3.1. Products API

**POST /api/products** (Tạo sản phẩm)
- Content-Type: `multipart/form-data`
- Field `image`: **BẮT BUỘC** (File)
- Các field khác: category_id, product_name, barcode, import_price, selling_price, stock_quantity

**PUT /api/products/{id}** (Cập nhật sản phẩm)
- Content-Type: `multipart/form-data`
- Field `image`: **TÙY CHỌN** (File)
- Nếu không gửi image, ảnh cũ được giữ nguyên

### 3.2. Customers API

**POST /api/customers** (Tạo khách hàng)
- Content-Type: `multipart/form-data`
- Field `avatar`: **TÙY CHỌN** (File)
- Nếu không gửi avatar, dùng ảnh mặc định

**PUT /api/customers/{id}** (Cập nhật khách hàng)
- Content-Type: `multipart/form-data`
- Field `avatar`: **TÙY CHỌN** (File)
- Nếu không gửi avatar, avatar cũ được giữ nguyên

---

## 4. Các bước còn lại cần thực hiện

### 4.1. Chạy Database Migration
```bash
# Kết nối MySQL và chạy:
mysql -u root -p pos_system < backend/migrations/add_image_columns.sql
```

### 4.2. Tạo ảnh mặc định

**Cần tạo 2 file ảnh:**
1. `backend/uploads/avatars/default-staff.png` (200x200px, background #3B82F6)
2. `backend/uploads/customers/default-customer.png` (200x200px, background #10B981)

**Hướng dẫn chi tiết:** Xem file `backend/uploads/CREATE_DEFAULT_IMAGES.md`

### 4.3. Kiểm tra quyền thư mục
```bash
# Đảm bảo thư mục uploads có quyền ghi
chmod -R 777 backend/uploads/
```

### 4.4. Test API

**Test tạo sản phẩm với ảnh:**
```bash
curl -X POST http://localhost:8080/backend/index.php/api/products \
  -H "Cookie: PHPSESSID=xxx" \
  -F "category_id=1" \
  -F "product_name=Test Product" \
  -F "barcode=TEST001" \
  -F "image=@/path/to/image.jpg" \
  -F "import_price=100000" \
  -F "selling_price=150000" \
  -F "stock_quantity=10"
```

**Test tạo khách hàng với avatar:**
```bash
curl -X POST http://localhost:8080/backend/index.php/api/customers \
  -H "Cookie: PHPSESSID=xxx" \
  -F "full_name=Test Customer" \
  -F "phone_number=0123456789" \
  -F "address=Ha Noi" \
  -F "avatar=@/path/to/avatar.jpg"
```

**Test tạo khách hàng không có avatar (dùng default):**
```bash
curl -X POST http://localhost:8080/backend/index.php/api/customers \
  -H "Cookie: PHPSESSID=xxx" \
  -F "full_name=Test Customer 2" \
  -F "phone_number=0987654321" \
  -F "address=HCM"
```

---

## 5. Error Handling

### Các lỗi có thể xảy ra:

1. **"Ảnh sản phẩm là bắt buộc"** - Không gửi image khi tạo sản phẩm
2. **"Chỉ hỗ trợ ảnh JPG, PNG, GIF, WEBP"** - Sai định dạng file
3. **"File vượt quá 2MB"** - File quá lớn
4. **"Lỗi upload file"** - Lỗi khi upload (quyền thư mục, disk full, etc.)
5. **"Không thể lưu file trên server"** - Không thể move_uploaded_file

### Debug:
- Check PHP error log
- Check quyền thư mục uploads/
- Check php.ini: upload_max_filesize, post_max_size
- Check disk space

---

## 6. Frontend Integration Notes

### Khi gọi API từ Frontend:

**JavaScript/Fetch example:**
```javascript
// Tạo sản phẩm với ảnh
const formData = new FormData();
formData.append('category_id', 1);
formData.append('product_name', 'iPhone 15');
formData.append('barcode', 'IP15001');
formData.append('image', fileInput.files[0]); // File từ <input type="file">
formData.append('import_price', 25000000);
formData.append('selling_price', 30000000);
formData.append('stock_quantity', 10);

fetch('/backend/index.php/api/products', {
  method: 'POST',
  credentials: 'include', // Gửi cookie session
  body: formData // KHÔNG set Content-Type header, browser tự động set
});
```

**HTML Form example:**
```html
<form action="/backend/index.php/api/products" method="POST" enctype="multipart/form-data">
  <input type="number" name="category_id" required>
  <input type="text" name="product_name" required>
  <input type="text" name="barcode" required>
  <input type="file" name="image" accept="image/*" required>
  <input type="number" name="import_price" required>
  <input type="number" name="selling_price" required>
  <input type="number" name="stock_quantity" required>
  <button type="submit">Tạo sản phẩm</button>
</form>
```

---

## 7. Security Notes

✅ **Đã implement:**
- MIME type validation
- File size limit (2MB)
- Safe filename generation (timestamp + random)
- File extension whitelist
- Directory traversal prevention

⚠️ **Lưu ý:**
- Không cho phép upload file .php, .exe, .sh
- Validate MIME type bằng finfo_file() (không tin tưởng extension)
- Tên file được generate tự động (không dùng tên gốc)
- Thư mục uploads/ nên nằm ngoài document root trong production

---

## 8. Checklist hoàn thành

- [x] Tạo FileUpload class
- [x] Tạo migration SQL
- [x] Cập nhật ProductController (store + update)
- [x] Cập nhật CustomerController (store + update)
- [x] Cập nhật Product Model
- [x] Cập nhật Customer Model
- [x] Cập nhật index.php (require FileUpload)
- [x] Tạo cấu trúc thư mục uploads/
- [x] Cập nhật API_DOCS.txt
- [x] Tạo hướng dẫn tạo ảnh mặc định
- [ ] **Chạy database migration** (cần thực hiện)
- [ ] **Tạo 2 file ảnh mặc định** (cần thực hiện)
- [ ] **Test API với Postman/curl** (cần thực hiện)
- [ ] **Cập nhật Frontend để gửi multipart/form-data** (cần thực hiện)

---

## 9. Kết luận

Chức năng upload ảnh đã được implement hoàn chỉnh ở backend với:
- Validation đầy đủ
- Error handling tốt
- Security best practices
- Documentation đầy đủ

**Các bước tiếp theo:**
1. Chạy migration SQL
2. Tạo 2 ảnh mặc định
3. Test API
4. Cập nhật Frontend
