# Hướng dẫn tạo ảnh mặc định

## Cần tạo 2 file ảnh mặc định:

### 1. Default Staff Avatar
**Đường dẫn:** `uploads/avatars/default-staff.png`

Tạo ảnh PNG 200x200px với:
- Background: #3B82F6 (blue)
- Icon: User silhouette màu trắng
- Hoặc text "STAFF" màu trắng, font bold

### 2. Default Customer Avatar
**Đường dẫn:** `uploads/customers/default-customer.png`

Tạo ảnh PNG 200x200px với:
- Background: #10B981 (green)
- Icon: User silhouette màu trắng
- Hoặc text "CUSTOMER" màu trắng, font bold

## Cách tạo nhanh:

### Option 1: Dùng online tool
1. Truy cập: https://placeholder.com/
2. Tạo ảnh 200x200 với màu và text như trên
3. Download và đổi tên thành `default-staff.png` và `default-customer.png`
4. Copy vào thư mục tương ứng

### Option 2: Dùng PowerShell (Windows)
```powershell
# Tạo ảnh đơn giản bằng PowerShell
# (Cần cài ImageMagick hoặc dùng online tool)
```

### Option 3: Dùng Paint/Photoshop
1. Tạo canvas 200x200px
2. Fill màu nền (#3B82F6 cho staff, #10B981 cho customer)
3. Thêm text hoặc icon màu trắng
4. Save as PNG

## Lưu ý:
- File phải là PNG format
- Kích thước khuyến nghị: 200x200px
- Tên file PHẢI CHÍNH XÁC:
  - `default-staff.png`
  - `default-customer.png`
- Đặt đúng thư mục:
  - Staff: `backend/uploads/avatars/`
  - Customer: `backend/uploads/customers/`
