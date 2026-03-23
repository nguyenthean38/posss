# 🔧 Sửa lỗi: Ảnh sản phẩm & Combobox danh mục

## ❌ Vấn đề 1: Ảnh sản phẩm không hiển thị

### Triệu chứng:
- Chỉ thấy hộp trống thay vì ảnh sản phẩm
- Console không báo lỗi 404

### Nguyên nhân:
Function `getProductImage()` chỉ trả về relative path, không thêm base URL:

```javascript
// SAI
export function getProductImage(imageUrl) {
    return imageUrl || ASSETS.placeholder.product;
}

// Backend trả về: "uploads/products/product_123.jpg"
// Frontend dùng: "uploads/products/product_123.jpg" ❌
// Browser tìm: http://localhost:8080/uploads/... (KHÔNG TỒN TẠI!)
```

### Giải pháp:
Thêm base URL cho backend:

```javascript
// ĐÚNG
export function getProductImage(imageUrl) {
    if (!imageUrl) {
        return ASSETS.placeholder.product;
    }
    
    // Nếu đã là URL đầy đủ, trả về luôn
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    // Thêm backend URL
    return `http://localhost:8080/backend/${imageUrl}`;
}

// Backend trả về: "uploads/products/product_123.jpg"
// Frontend dùng: "http://localhost:8080/backend/uploads/products/product_123.jpg" ✅
```

---

## ❌ Vấn đề 2: Combobox danh mục hiển thị "undefined"

### Triệu chứng:
```html
<select>
  <option value="1">undefined</option>
  <option value="2">undefined</option>
</select>
```

### Nguyên nhân:
API trả về object có `items`, không phải array trực tiếp:

```javascript
// API Response:
{
  "items": [
    { "id": 1, "name": "Điện thoại", "category_name": "Điện thoại" },
    { "id": 2, "name": "Tai nghe", "category_name": "Tai nghe" }
  ],
  "pagination": { ... }
}

// Code cũ:
const data = await API.categories.getAll();
data.map(c => ...) // ❌ data là object, không phải array!
```

### Giải pháp:
Lấy `items` từ response:

```javascript
// ĐÚNG
async function loadCategories() {
    try {
        const response = await API.categories.getAll();
        // Lấy items từ response
        const data = response.items || response || [];
        
        const fCat = document.getElementById("fCategory");
        if (!fCat) return;
        fCat.innerHTML = `<option value="" disabled selected>Chọn danh mục</option>` +
            data.map(c => `<option value="${c.id}">${c.name || c.category_name}</option>`).join("");
    } catch(err) {
        console.error('Load categories error', err);
    }
}
```

---

## ✅ Kết quả

### Ảnh sản phẩm:
```
Trước: [Hộp trống]
Sau:  [Ảnh sản phẩm hiển thị đầy đủ] ✅
```

### Combobox danh mục:
```
Trước:
<select>
  <option value="1">undefined</option>
  <option value="2">undefined</option>
</select>

Sau:
<select>
  <option value="1">Điện thoại</option>
  <option value="2">Tai nghe</option>
</select> ✅
```

---

## Files đã sửa

1. ✅ `frontend/assets/js/assets.js`
   - Sửa `getProductImage()` - Thêm base URL
   - Sửa `getAvatarImage()` - Thêm base URL

2. ✅ `frontend/assets/js/products.js`
   - Sửa `loadCategories()` - Lấy `items` từ response
   - Xử lý cả `name` và `category_name` field

---

## Cách test

1. **Hard refresh browser** (Ctrl + Shift + R)
2. Login với admin
3. Vào trang Products
4. Kiểm tra:
   - ✅ Ảnh sản phẩm hiển thị trong bảng
   - ✅ Ảnh sản phẩm hiển thị trong modal xem chi tiết
   - ✅ Combobox danh mục hiển thị đúng tên
5. Click "Thêm sản phẩm":
   - ✅ Dropdown danh mục có danh sách đầy đủ
   - ✅ Chọn danh mục được
   - ✅ Upload ảnh và preview được

---

## Lưu ý

### Base URL:
- Development: `http://localhost:8080/backend/`
- Production: Cần thay đổi theo domain thực tế

### Cách cấu hình cho production:
```javascript
// Tạo config file
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/backend';

export function getProductImage(imageUrl) {
    if (!imageUrl) return ASSETS.placeholder.product;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_BASE_URL}/${imageUrl}`;
}
```
