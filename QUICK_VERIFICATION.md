# ✅ QUICK VERIFICATION - Kiểm tra nhanh

## Đã hoàn thành:

### 1. Database Migration ✅
```powershell
# Đã chạy thành công
Get-Content backend/migrations/add_image_columns.sql | docker exec -i phonestore_db mysql -uroot -proot123 phonestore_pos
```

**Kết quả:**
- ✅ Cột `image` đã được thêm vào bảng `products`
- ✅ Cột `avatar` đã được thêm vào bảng `customers`

### 2. Ảnh mặc định ✅
```powershell
# Đã tạo thành công bằng PowerShell script
.\backend\uploads\create-default-images.ps1
```

**Kết quả:**
- ✅ `backend/uploads/avatars/default-staff.png` (200x200, màu #3B82F6)
- ✅ `backend/uploads/customers/default-customer.png` (200x200, màu #10B981)

---

## Verify ngay bây giờ:

### Kiểm tra Database:
```powershell
# Xem cấu trúc bảng products
docker exec phonestore_db mysql -uroot -proot123 phonestore_pos -e "DESCRIBE products;"

# Xem cấu trúc bảng customers
docker exec phonestore_db mysql -uroot -proot123 phonestore_pos -e "DESCRIBE customers;"
```

**Expected output:**
- Bảng `products` có cột `image` (varchar 255)
- Bảng `customers` có cột `avatar` (varchar 255)

### Kiểm tra Files:
```powershell
# Liệt kê tất cả file PNG
Get-ChildItem backend\uploads -Recurse -Include *.png | Select-Object Name, Length, FullName
```

**Expected output:**
```
Name                    Length  FullName
----                    ------  --------
default-staff.png       ~5KB    ...\backend\uploads\avatars\default-staff.png
default-customer.png    ~5KB    ...\backend\uploads\customers\default-customer.png
```

---

## Test API ngay (Optional):

### Cần có:
1. Session cookie (PHPSESSID) - Đăng nhập trước
2. File ảnh để test upload

### Test 1: Tạo sản phẩm KHÔNG có ảnh (phải lỗi)
```bash
curl -X POST http://localhost:8080/backend/index.php/api/products \
  -H "Cookie: PHPSESSID=YOUR_SESSION" \
  -F "category_id=1" \
  -F "product_name=Test" \
  -F "barcode=TEST001" \
  -F "import_price=100000" \
  -F "selling_price=150000" \
  -F "stock_quantity=10"
```

**Expected:** HTTP 400 - "Ảnh sản phẩm là bắt buộc"

### Test 2: Tạo khách hàng KHÔNG có avatar (dùng default)
```bash
curl -X POST http://localhost:8080/backend/index.php/api/customers \
  -H "Cookie: PHPSESSID=YOUR_SESSION" \
  -F "full_name=Test Customer" \
  -F "phone_number=0999999999" \
  -F "address=Test Address"
```

**Expected:** HTTP 201 - avatar = "uploads/customers/default-customer.png"

---

## Summary:

✅ **Migration:** DONE
✅ **Default Images:** DONE
✅ **Backend Code:** DONE
✅ **Documentation:** DONE

⏳ **Next Steps:**
1. Test API với Postman
2. Cập nhật Frontend JavaScript
3. Test UI

**Trạng thái:** 🟢 READY FOR TESTING
