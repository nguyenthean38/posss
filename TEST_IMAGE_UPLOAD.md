# Test Image Upload Feature

## Chuẩn bị

### 1. Chạy Database Migration
```bash
# Windows (PowerShell)
Get-Content backend/migrations/add_image_columns.sql | docker exec -i pos_system-db-1 mysql -uroot -proot pos_system

# Hoặc nếu dùng MySQL local:
mysql -u root -p pos_system < backend/migrations/add_image_columns.sql
```

### 2. Tạo ảnh mặc định

**Tạm thời dùng ảnh placeholder online:**
```bash
# Windows PowerShell
cd backend/uploads/avatars
Invoke-WebRequest -Uri "https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=STAFF" -OutFile "default-staff.png"

cd ../customers
Invoke-WebRequest -Uri "https://via.placeholder.com/200x200/10B981/FFFFFF?text=CUSTOMER" -OutFile "default-customer.png"
```

**Hoặc tạo file đơn giản bằng Paint:**
1. Mở Paint
2. Tạo canvas 200x200
3. Fill màu (#3B82F6 cho staff, #10B981 cho customer)
4. Save as PNG với tên đúng

---

## Test Cases

### Test 1: Tạo sản phẩm KHÔNG có ảnh (phải lỗi)

**Request:**
```bash
curl -X POST http://localhost:8080/backend/index.php/api/products \
  -H "Cookie: PHPSESSID=YOUR_SESSION_ID" \
  -F "category_id=1" \
  -F "product_name=Test Product No Image" \
  -F "barcode=TEST001" \
  -F "import_price=100000" \
  -F "selling_price=150000" \
  -F "stock_quantity=10"
```

**Expected Response (400):**
```json
{
  "message": "Ảnh sản phẩm là bắt buộc"
}
```

---

### Test 2: Tạo sản phẩm CÓ ảnh (phải thành công)

**Request:**
```bash
curl -X POST http://localhost:8080/backend/index.php/api/products \
  -H "Cookie: PHPSESSID=YOUR_SESSION_ID" \
  -F "category_id=1" \
  -F "product_name=Test Product With Image" \
  -F "barcode=TEST002" \
  -F "image=@C:/path/to/your/image.jpg" \
  -F "import_price=200000" \
  -F "selling_price=250000" \
  -F "stock_quantity=5"
```

**Expected Response (201):**
```json
{
  "message": "Tạo sản phẩm thành công",
  "product": {
    "id": 1,
    "category_id": 1,
    "category_name": "...",
    "product_name": "Test Product With Image",
    "barcode": "TEST002",
    "image": "uploads/products/product_1234567890_abc123.jpg",
    "import_price": 200000,
    "selling_price": 250000,
    "stock_quantity": 5,
    "created_at": "2024-01-20 10:00:00"
  }
}
```

**Verify:**
- Check file tồn tại: `backend/uploads/products/product_*.jpg`
- Check database: `SELECT * FROM products WHERE id = 1;`

---

### Test 3: Cập nhật sản phẩm KHÔNG đổi ảnh

**Request:**
```bash
curl -X PUT http://localhost:8080/backend/index.php/api/products/1 \
  -H "Cookie: PHPSESSID=YOUR_SESSION_ID" \
  -F "product_name=Updated Product Name" \
  -F "selling_price=300000"
```

**Expected Response (200):**
```json
{
  "message": "Cập nhật sản phẩm thành công",
  "product": {
    "id": 1,
    "product_name": "Updated Product Name",
    "image": "uploads/products/product_1234567890_abc123.jpg",
    "selling_price": 300000,
    ...
  }
}
```

**Verify:**
- Ảnh cũ vẫn còn: `backend/uploads/products/product_1234567890_abc123.jpg`

---

### Test 4: Cập nhật sản phẩm CÓ đổi ảnh

**Request:**
```bash
curl -X PUT http://localhost:8080/backend/index.php/api/products/1 \
  -H "Cookie: PHPSESSID=YOUR_SESSION_ID" \
  -F "image=@C:/path/to/new/image.jpg"
```

**Expected Response (200):**
```json
{
  "message": "Cập nhật sản phẩm thành công",
  "product": {
    "id": 1,
    "image": "uploads/products/product_9876543210_def456.jpg",
    ...
  }
}
```

**Verify:**
- Ảnh mới tồn tại: `backend/uploads/products/product_9876543210_def456.jpg`
- Ảnh cũ đã bị xóa: `backend/uploads/products/product_1234567890_abc123.jpg` (không còn)

---

### Test 5: Tạo khách hàng KHÔNG có avatar (dùng default)

**Request:**
```bash
curl -X POST http://localhost:8080/backend/index.php/api/customers \
  -H "Cookie: PHPSESSID=YOUR_SESSION_ID" \
  -F "full_name=Nguyen Van A" \
  -F "phone_number=0123456789" \
  -F "address=Ha Noi"
```

**Expected Response (201):**
```json
{
  "message": "Tạo khách hàng thành công",
  "customer": {
    "id": 1,
    "name": "Nguyen Van A",
    "phone": "0123456789",
    "address": "Ha Noi",
    "avatar": "uploads/customers/default-customer.png",
    "total_orders": 0,
    "total_revenue": 0
  }
}
```

**Verify:**
- Database: `SELECT * FROM customers WHERE id = 1;`
- Avatar = default: `uploads/customers/default-customer.png`

---

### Test 6: Tạo khách hàng CÓ avatar

**Request:**
```bash
curl -X POST http://localhost:8080/backend/index.php/api/customers \
  -H "Cookie: PHPSESSID=YOUR_SESSION_ID" \
  -F "full_name=Tran Thi B" \
  -F "phone_number=0987654321" \
  -F "address=HCM" \
  -F "avatar=@C:/path/to/avatar.jpg"
```

**Expected Response (201):**
```json
{
  "message": "Tạo khách hàng thành công",
  "customer": {
    "id": 2,
    "name": "Tran Thi B",
    "phone": "0987654321",
    "address": "HCM",
    "avatar": "uploads/customers/customer_1234567890_abc123.jpg",
    "total_orders": 0,
    "total_revenue": 0
  }
}
```

**Verify:**
- File tồn tại: `backend/uploads/customers/customer_*.jpg`

---

### Test 7: Upload file sai định dạng (phải lỗi)

**Request:**
```bash
curl -X POST http://localhost:8080/backend/index.php/api/products \
  -H "Cookie: PHPSESSID=YOUR_SESSION_ID" \
  -F "category_id=1" \
  -F "product_name=Test" \
  -F "barcode=TEST003" \
  -F "image=@C:/path/to/file.pdf" \
  -F "import_price=100000" \
  -F "selling_price=150000" \
  -F "stock_quantity=10"
```

**Expected Response (400):**
```json
{
  "message": "Chỉ hỗ trợ ảnh JPG, PNG, GIF, WEBP"
}
```

---

### Test 8: Upload file quá lớn (phải lỗi)

**Request:**
```bash
# Tạo file > 2MB trước
curl -X POST http://localhost:8080/backend/index.php/api/products \
  -H "Cookie: PHPSESSID=YOUR_SESSION_ID" \
  -F "category_id=1" \
  -F "product_name=Test" \
  -F "barcode=TEST004" \
  -F "image=@C:/path/to/large-file.jpg" \
  -F "import_price=100000" \
  -F "selling_price=150000" \
  -F "stock_quantity=10"
```

**Expected Response (400):**
```json
{
  "message": "File vượt quá 2MB"
}
```

---

## Test với Postman

### Setup:
1. Mở Postman
2. Tạo request mới: POST `http://localhost:8080/backend/index.php/api/products`
3. Tab "Headers": Không cần set Content-Type (Postman tự động)
4. Tab "Body": Chọn "form-data"
5. Thêm các field:
   - `category_id`: 1 (Text)
   - `product_name`: Test Product (Text)
   - `barcode`: TEST001 (Text)
   - `image`: [File] - Click "Select Files"
   - `import_price`: 100000 (Text)
   - `selling_price`: 150000 (Text)
   - `stock_quantity`: 10 (Text)
6. Tab "Cookies": Add PHPSESSID cookie
7. Send

---

## Checklist Test

- [ ] Test 1: Tạo sản phẩm không có ảnh → Lỗi 400
- [ ] Test 2: Tạo sản phẩm có ảnh → Success 201
- [ ] Test 3: Update sản phẩm không đổi ảnh → Success 200, ảnh cũ giữ nguyên
- [ ] Test 4: Update sản phẩm có đổi ảnh → Success 200, ảnh cũ bị xóa
- [ ] Test 5: Tạo khách hàng không có avatar → Success 201, dùng default
- [ ] Test 6: Tạo khách hàng có avatar → Success 201
- [ ] Test 7: Upload file sai định dạng → Lỗi 400
- [ ] Test 8: Upload file quá lớn → Lỗi 400
- [ ] Verify: File được lưu đúng thư mục
- [ ] Verify: Database có đường dẫn đúng
- [ ] Verify: Ảnh cũ bị xóa khi update

---

## Troubleshooting

### Lỗi: "Lỗi upload file"
- Check quyền thư mục: `chmod -R 777 backend/uploads/`
- Check disk space
- Check PHP error log

### Lỗi: "Không thể lưu file trên server"
- Check quyền ghi thư mục uploads/
- Check SELinux/AppArmor nếu dùng Linux
- Check PHP open_basedir restriction

### Lỗi: File upload nhưng không thấy trong response
- Check database: `SELECT * FROM products ORDER BY id DESC LIMIT 1;`
- Check thư mục: `ls -la backend/uploads/products/`
- Check PHP error log

### Lỗi: "Call to undefined function finfo_open()"
- Cài đặt PHP fileinfo extension:
  ```bash
  # Ubuntu/Debian
  sudo apt-get install php-fileinfo
  
  # Windows: Uncomment trong php.ini
  extension=fileinfo
  ```
