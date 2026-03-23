# 🔧 Thêm Validation: Giá bán >= Giá nhập

## Vấn đề

Hệ thống cho phép tạo sản phẩm với **giá bán < giá nhập** → **BÁN LỖ**!

### Ví dụ dữ liệu lỗi:
```
product_name: "thehajuo"
barcode: "8878"
type: "case"
category_id: 1
import_price: 87776      ← Giá nhập
selling_price: 444       ← Giá bán (LỖ 99.5%!)
stock_quantity: 6
image: (binary)
```

**Kết quả**: Lỗ 87,332 VNĐ mỗi sản phẩm! 💸

---

## Giải pháp

### ✅ Thêm validation vào Backend

**File**: `backend/controllers/ProductController.php`

Thêm kiểm tra trong cả 2 functions:
1. `store()` - Tạo sản phẩm mới
2. `update()` - Cập nhật sản phẩm

```php
// Kiểm tra giá bán phải >= giá nhập (tránh bán lỗ)
if ($sellingPrice < $importPrice) {
    Response::json(["message" => "Giá bán phải lớn hơn hoặc bằng giá nhập"], 400);
}
```

---

## Kết quả

### ❌ Trước khi fix:
```json
POST /api/products
{
  "product_name": "Test",
  "barcode": "123",
  "import_price": 100000,
  "selling_price": 50000,  ← Lỗ 50%
  ...
}

Response: 201 Created ✅ (Cho phép tạo - SAI!)
```

### ✅ Sau khi fix:
```json
POST /api/products
{
  "product_name": "Test",
  "barcode": "123",
  "import_price": 100000,
  "selling_price": 50000,  ← Lỗ 50%
  ...
}

Response: 400 Bad Request ❌
{
  "message": "Giá bán phải lớn hơn hoặc bằng giá nhập"
}
```

---

## Test Cases

### ✅ Test 1: Giá bán = Giá nhập (Hòa vốn)
```
import_price: 100000
selling_price: 100000
→ Kết quả: PASS ✅
```

### ✅ Test 2: Giá bán > Giá nhập (Có lãi)
```
import_price: 100000
selling_price: 150000
→ Kết quả: PASS ✅
```

### ❌ Test 3: Giá bán < Giá nhập (Lỗ)
```
import_price: 100000
selling_price: 50000
→ Kết quả: FAIL ❌
→ Message: "Giá bán phải lớn hơn hoặc bằng giá nhập"
```

---

## Lưu ý

### Trường hợp đặc biệt:

Nếu cần bán lỗ (khuyến mãi, thanh lý), có 2 cách:

1. **Tạm thời bỏ validation** (không khuyến nghị)
2. **Thêm flag đặc biệt** `is_promotion` hoặc `allow_loss` (khuyến nghị)

### Ví dụ cải tiến:
```php
// Cho phép bán lỗ nếu có flag đặc biệt
$allowLoss = isset($data['allow_loss']) && $data['allow_loss'] === true;

if (!$allowLoss && $sellingPrice < $importPrice) {
    Response::json(["message" => "Giá bán phải lớn hơn hoặc bằng giá nhập"], 400);
}
```

---

## Files đã sửa

✅ `backend/controllers/ProductController.php`
- Thêm validation vào `store()` method
- Thêm validation vào `update()` method

---

## Cách test

1. Mở Postman hoặc Frontend
2. Thử tạo sản phẩm với giá bán < giá nhập
3. Kết quả: Nhận lỗi 400 với message "Giá bán phải lớn hơn hoặc bằng giá nhập"
4. Thử tạo sản phẩm với giá bán >= giá nhập
5. Kết quả: Tạo thành công ✅
