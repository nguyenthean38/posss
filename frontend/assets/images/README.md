# PhoneStore POS - Image Assets

## Icons & Logos

### Favicon
- `favicon.svg` - Icon hiển thị trên tab browser (giỏ hàng) - Custom made
- `favicon.ico` - Favicon từ Open Source POS
- Đã được thêm vào tất cả HTML files

### Logo
- `logo.svg` - Logo chính của ứng dụng (48x48px) - Custom made
- `logo.png` - Logo PNG từ Open Source POS

### Branding (từ Open Source POS)
Thư mục `branding/` chứa các biến thể logo chuyên nghiệp:
- `logo.svg` / `logo-white.svg` - Logo đầy đủ với text
- `mark.svg` / `mark-white.svg` - Icon mark đơn giản
- `emblem.svg` / `emblem-white.svg` - Emblem với viền
- `lettermark.svg` / `lettermark-white.svg` - Chữ cái stylized

**Sử dụng:**
```html
<!-- Logo trong sidebar (dark theme) -->
<img src="assets/images/branding/logo-white.svg" alt="PhoneStore POS" />

<!-- Logo trong sidebar (light theme) -->
<img src="assets/images/branding/logo.svg" alt="PhoneStore POS" />

<!-- Icon nhỏ -->
<img src="assets/images/branding/mark.svg" alt="Icon" width="32" />
```

## Placeholders

### Product Placeholder
- `product-placeholder.svg` - Ảnh mặc định khi sản phẩm chưa có hình
- Kích thước: 400x400px
- Sử dụng: `<img src="assets/images/product-placeholder.svg" alt="No image" />`

### Avatar Placeholder
- `avatar-placeholder.svg` - Avatar mặc định cho user
- Kích thước: 200x200px
- Sử dụng: `<img src="assets/images/avatar-placeholder.svg" alt="Avatar" />`

## Empty States

### Empty Cart
- `empty-cart.svg` - Hiển thị khi giỏ hàng trống
- Kích thước: 300x300px

### Empty Data
- `empty-data.svg` - Hiển thị khi không có dữ liệu trong bảng
- Kích thước: 300x300px

## Category Icons

File `category-icons.json` chứa mapping giữa category type và Bootstrap Icons:

```javascript
// Ví dụ sử dụng
import categoryIcons from './assets/images/category-icons.json';

const icon = categoryIcons['smartphone'].icon; // "bi-phone"
const color = categoryIcons['smartphone'].color; // "#3b82f6"
```

### Các loại category có sẵn:
- `smartphone` - Điện thoại (bi-phone)
- `tablet` - Máy tính bảng (bi-tablet)
- `laptop` - Laptop (bi-laptop)
- `watch` - Đồng hồ thông minh (bi-smartwatch)
- `headphone` - Tai nghe (bi-headphones)
- `speaker` - Loa (bi-speaker)
- `charger` - Sạc & cáp (bi-battery-charging)
- `case` - Ốp lưng & bao da (bi-phone-flip)
- `screen` - Kính cường lực (bi-display)
- `other` - Phụ kiện khác (bi-box)

## Sử dụng trong HTML

```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="assets/images/favicon.svg" />

<!-- Product image with fallback -->
<img 
  src="${product.image || 'assets/images/product-placeholder.svg'}" 
  alt="${product.name}"
  onerror="this.src='assets/images/product-placeholder.svg'"
/>

<!-- Category icon -->
<i class="bi ${categoryIcons[category.icon].icon}" 
   style="color: ${categoryIcons[category.icon].color}"></i>

<!-- Empty state -->
<div class="empty-state">
  <img src="assets/images/empty-data.svg" alt="No data" />
  <p>Không có dữ liệu</p>
</div>
```

## Notes

- Tất cả SVG files đều tối ưu cho web
- Có thể thay đổi màu sắc của SVG bằng CSS `fill` hoặc `stroke`
- Placeholder images tự động responsive
