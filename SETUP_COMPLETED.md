# ✅ SETUP HOÀN TẤT - Image Upload Feature

## 🎉 Đã hoàn thành tất cả các bước!

### ✅ Bước 1: Database Migration
```
✓ Đã chạy migration thành công
✓ Cột 'image' đã được thêm vào bảng 'products'
✓ Cột 'avatar' đã được thêm vào bảng 'customers'
```

**Verify:**
```bash
docker exec phonestore_db mysql -uroot -proot123 phonestore_pos -e "DESCRIBE products;"
docker exec phonestore_db mysql -uroot -proot123 phonestore_pos -e "DESCRIBE customers;"
```

### ✅ Bước 2: Ảnh mặc định
```
✓ default-staff.png (200x200, #3B82F6 - xanh dương)
✓ default-customer.png (200x200, #10B981 - xanh lá)
```

**Location:**
- `backend/uploads/avatars/default-staff.png`
- `backend/uploads/customers/default-customer.png`

---

## 🚀 Hệ thống đã sẵn sàng!

### Backend API đã hoạt động:

#### 1. Products API
**POST /api/products** - Tạo sản phẩm (ảnh BẮT BUỘC)
```bash
curl -X POST http://localhost:8080/backend/index.php/api/products \
  -H "Cookie: PHPSESSID=xxx" \
  -F "category_id=1" \
  -F "product_name=iPhone 15" \
  -F "barcode=IP15001" \
  -F "image=@/path/to/image.jpg" \
  -F "import_price=25000000" \
  -F "selling_price=30000000" \
  -F "stock_quantity=10"
```

**PUT /api/products/{id}** - Cập nhật sản phẩm (ảnh TÙY CHỌN)
```bash
curl -X PUT http://localhost:8080/backend/index.php/api/products/1 \
  -H "Cookie: PHPSESSID=xxx" \
  -F "product_name=iPhone 15 Pro" \
  -F "image=@/path/to/new-image.jpg"
```

#### 2. Customers API
**POST /api/customers** - Tạo khách hàng (avatar TÙY CHỌN)
```bash
curl -X POST http://localhost:8080/backend/index.php/api/customers \
  -H "Cookie: PHPSESSID=xxx" \
  -F "full_name=Nguyen Van A" \
  -F "phone_number=0123456789" \
  -F "address=Ha Noi" \
  -F "avatar=@/path/to/avatar.jpg"
```

**Không có avatar → Dùng default:**
```bash
curl -X POST http://localhost:8080/backend/index.php/api/customers \
  -H "Cookie: PHPSESSID=xxx" \
  -F "full_name=Tran Thi B" \
  -F "phone_number=0987654321" \
  -F "address=HCM"
```

---

## 📝 Các bước tiếp theo

### 1. Test API với Postman
- Mở Postman
- Import collection từ `POSTMAN_COLLECTION.json`
- Test các endpoint:
  - ✓ Tạo sản phẩm với ảnh
  - ✓ Tạo sản phẩm không có ảnh (phải lỗi)
  - ✓ Cập nhật sản phẩm với ảnh mới
  - ✓ Tạo khách hàng với avatar
  - ✓ Tạo khách hàng không có avatar

### 2. Cập nhật Frontend
Cần sửa các file JavaScript để gửi `multipart/form-data`:

#### File: `frontend/assets/js/products.js`
```javascript
// Thay đổi từ JSON sang FormData
const formData = new FormData();
formData.append('category_id', categoryId);
formData.append('product_name', name);
formData.append('barcode', barcode);
formData.append('image', imageFileInput.files[0]); // <input type="file">
formData.append('import_price', importPrice);
formData.append('selling_price', sellingPrice);
formData.append('stock_quantity', stockQuantity);

fetch('/backend/index.php/api/products', {
  method: 'POST',
  credentials: 'include',
  body: formData
  // KHÔNG set Content-Type!
});
```

#### File: `frontend/assets/js/customers.js`
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

#### Thêm input file vào HTML forms:
```html
<!-- Form tạo sản phẩm -->
<input type="file" id="productImage" name="image" accept="image/*" required>

<!-- Form tạo khách hàng -->
<input type="file" id="customerAvatar" name="avatar" accept="image/*">
```

---

## 📊 Thông tin kỹ thuật

### Database
- **Host:** localhost:3308 (Docker)
- **Database:** phonestore_pos
- **User:** root / phonestore
- **Password:** root123 / phonestore123

### File Upload
- **Max size:** 2MB
- **Allowed formats:** JPG, PNG, GIF, WEBP
- **Upload directory:** `backend/uploads/`
- **Products:** `backend/uploads/products/`
- **Customers:** `backend/uploads/customers/`
- **Staff:** `backend/uploads/avatars/`

### Security
- ✓ MIME type validation
- ✓ File size limit
- ✓ Extension whitelist
- ✓ Safe filename generation
- ✓ Old file deletion on update

---

## 🔍 Troubleshooting

### Lỗi: "Ảnh sản phẩm là bắt buộc"
→ Đảm bảo gửi field `image` trong FormData

### Lỗi: "Chỉ hỗ trợ ảnh JPG, PNG, GIF, WEBP"
→ Kiểm tra định dạng file

### Lỗi: "File vượt quá 2MB"
→ Resize ảnh trước khi upload

### Lỗi: "Lỗi upload file"
→ Check quyền thư mục: `chmod -R 777 backend/uploads/`

### Frontend không gửi được file
→ Đảm bảo:
- Dùng FormData (không dùng JSON)
- KHÔNG set Content-Type header
- Form có `enctype="multipart/form-data"`

---

## 📚 Tài liệu

- `API_DOCS.txt` - API documentation đầy đủ
- `IMAGE_UPLOAD_IMPLEMENTATION.md` - Chi tiết kỹ thuật
- `TEST_IMAGE_UPLOAD.md` - Hướng dẫn test
- `NEXT_STEPS_CHECKLIST.md` - Checklist các bước

---

## ✅ Checklist hoàn thành

### Backend
- [x] FileUpload class
- [x] Database migration
- [x] ProductController
- [x] CustomerController
- [x] Models
- [x] index.php
- [x] Documentation

### Setup
- [x] Chạy migration SQL
- [x] Tạo default-staff.png
- [x] Tạo default-customer.png
- [x] Verify database
- [x] Verify files

### Testing (Cần làm)
- [ ] Test API với Postman
- [ ] Test tạo sản phẩm với ảnh
- [ ] Test tạo khách hàng với/không có avatar
- [ ] Test upload file sai định dạng
- [ ] Test upload file quá lớn

### Frontend (Cần làm)
- [ ] Sửa products.js
- [ ] Sửa customers.js
- [ ] Thêm input file vào forms
- [ ] Test UI

---

## 🎯 Kết luận

✅ **Backend đã hoàn thành 100%**
✅ **Database đã được setup**
✅ **Ảnh mặc định đã được tạo**
⏳ **Cần test API và cập nhật Frontend**

**Hệ thống đã sẵn sàng để test!**

---

**Ngày hoàn thành:** 2024-01-20
**Trạng thái:** ✅ READY FOR TESTING
**Next:** Test API → Update Frontend → Deploy
