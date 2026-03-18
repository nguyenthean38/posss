# KẾ HOẠCH TÍCH HỢP API VÀO FRONTEND

## 🔴 VẤN ĐỀ PHÁT HIỆN

**Frontend hiện tại đang sử dụng MOCK DATA (dữ liệu giả) thay vì gọi API thật!**

### Files cần sửa:
1. ✅ `login.js` - Đã có gọi API qua `auth.js`
2. ❌ `pos.js` - Đang dùng mock products, mock cart
3. ❌ `employees.js` - Đang dùng localStorage mock
4. ❌ `products.js` - Chưa kiểm tra
5. ❌ `categories.js` - Chưa kiểm tra
6. ❌ `customers.js` - Chưa kiểm tra
7. ❌ `reports.js` - Chưa kiểm tra
8. ❌ `profile.js` - Chưa kiểm tra

---

## 📋 CHECKLIST TÍCH HỢP

### 1. AUTH MODULE ✅ (Đã có)
File: `auth.js`
- [x] Login API
- [x] Session management
- [ ] First login flow (cần tạo trang riêng)
- [ ] Init password flow (cần tạo trang riêng)

### 2. POS MODULE ❌ (Cần làm hoàn toàn)
File: `pos.js`

**Hiện tại:**
```javascript
const PRODUCTS = [ /* mock data */ ];
const loadCart = () => JSON.parse(localStorage.getItem(KEY_CART) || "[]");
```

**Cần thay bằng:**
```javascript
// Gọi API lấy products
async function loadProducts() {
  const res = await fetch('/api/products');
  return await res.json();
}

// Gọi API init session
async function initCart() {
  const res = await fetch('/api/pos/init-session', { method: 'POST' });
  return await res.json();
}

// Gọi API add to cart
async function addToCart(barcode, quantity) {
  const res = await fetch('/api/pos/add-to-cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Barcode: barcode, Quantity: quantity })
  });
  return await res.json();
}

// Gọi API checkout
async function checkout(data) {
  const res = await fetch('/api/pos/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
}
```

### 3. EMPLOYEES MODULE ❌ (Cần làm hoàn toàn)
File: `employees.js`

**Hiện tại:**
```javascript
const loadEmp = () => JSON.parse(localStorage.getItem(KEY_EMP) || "[]");
```

**Cần thay bằng:**
```javascript
// GET /api/staff
async function loadEmployees() {
  const res = await fetch('/api/staff');
  return await res.json();
}

// POST /api/staff
async function createEmployee(data) {
  const res = await fetch('/api/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
}

// PATCH /api/staff/{id}/lock
async function lockEmployee(id) {
  const res = await fetch(`/api/staff/${id}/lock`, { method: 'PATCH' });
  return await res.json();
}

// POST /api/staff/{id}/resend
async function resendEmail(id) {
  const res = await fetch(`/api/staff/${id}/resend`, { method: 'POST' });
  return await res.json();
}
```

### 4. PRODUCTS MODULE ❌ (Cần kiểm tra)
### 5. CATEGORIES MODULE ❌ (Cần kiểm tra)
### 6. CUSTOMERS MODULE ❌ (Cần kiểm tra)
### 7. REPORTS MODULE ❌ (Cần kiểm tra)
### 8. PROFILE MODULE ❌ (Cần kiểm tra)

---

## 🎯 HÀNH ĐỘNG CẦN LÀM

### BƯỚC 1: Tạo API Helper Module
Tạo file `assets/js/api.js` để quản lý tất cả API calls:

```javascript
// api.js
const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API Error');
      }
      
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth
  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Staff
  async getStaff(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/staff?${query}`);
  }

  async createStaff(data) {
    return this.request('/staff', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async lockStaff(id) {
    return this.request(`/staff/${id}/lock`, { method: 'PATCH' });
  }

  async unlockStaff(id) {
    return this.request(`/staff/${id}/unlock`, { method: 'PATCH' });
  }

  async resendStaffEmail(id) {
    return this.request(`/staff/${id}/resend`, { method: 'POST' });
  }

  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products?${query}`);
  }

  async createProduct(data) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProduct(id, data) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Categories
  async getCategories(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/categories?${query}`);
  }

  async createCategory(data) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCategory(id, data) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCategory(id) {
    return this.request(`/categories/${id}`, { method: 'DELETE' });
  }

  // Customers
  async searchCustomerByPhone(phone) {
    return this.request(`/customers/search-by-phone?phone=${phone}`);
  }

  async createCustomer(data) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getCustomerHistory(id, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/customers/${id}/history?${query}`);
  }

  // POS
  async posInitSession() {
    return this.request('/pos/init-session', { method: 'POST' });
  }

  async posAddToCart(data) {
    return this.request('/pos/add-to-cart', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async posUpdateItem(data) {
    return this.request('/pos/update-item', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async posRemoveItem(id) {
    return this.request(`/pos/remove-item/${id}`, { method: 'DELETE' });
  }

  async posCheckout(data) {
    return this.request('/pos/checkout', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Reports
  async getReportSummary(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/summary?${query}`);
  }

  async getReportOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/orders?${query}`);
  }

  async getReportProfit(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/profit?${query}`);
  }

  // Profile
  async getProfile() {
    return this.request('/profile/me');
  }

  async updateProfile(data) {
    return this.request('/profile/update', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async uploadAvatar(formData) {
    return this.request('/profile/upload-avatar', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData
    });
  }
}

// Export singleton instance
export const api = new ApiClient();
```

### BƯỚC 2: Sửa từng module để dùng API

#### 2.1. Sửa `pos.js`
```javascript
import { api } from './api.js';

// Thay vì mock PRODUCTS
let products = [];

async function loadProducts() {
  try {
    const result = await api.getProducts();
    products = result.items || [];
    renderProducts();
  } catch (error) {
    toast('Lỗi tải sản phẩm');
  }
}

// Thay vì localStorage cart
async function cartAdd(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  try {
    const result = await api.posAddToCart({
      Barcode: product.barcode,
      Quantity: 1
    });
    
    // Update UI với data từ server
    updateCartUI(result);
    toast(t("toast.added"));
  } catch (error) {
    toast('Lỗi thêm vào giỏ');
  }
}

// Checkout
async function completePay() {
  const phone = document.getElementById("payPhone").value.trim();
  const name = document.getElementById("payName").value.trim();
  const cash = Number(document.getElementById("payCash").value.replace(/[^\d]/g, "")) || 0;

  try {
    const result = await api.posCheckout({
      Phone: phone,
      FullName: name,
      CustomerPay: cash
    });

    // Hiển thị hóa đơn
    window.open(result.PdfUrl, '_blank');
    toast(t("toast.paid"));
    
    // Reset cart
    await api.posInitSession();
    renderCart();
  } catch (error) {
    toast('Lỗi thanh toán');
  }
}
```

#### 2.2. Sửa `employees.js`
```javascript
import { api } from './api.js';

let employees = [];

async function loadEmployees() {
  try {
    const result = await api.getStaff();
    employees = result.items || [];
    render();
  } catch (error) {
    toast('Lỗi tải danh sách nhân viên');
  }
}

async function save() {
  const name = document.getElementById("fName").value.trim();
  const email = document.getElementById("fEmail").value.trim();

  if (!name || !email) {
    toast(t("toast.invalid"));
    return;
  }

  try {
    await api.createStaff({
      full_name: name,
      email: email
    });

    await loadEmployees();
    toast(t("toast.saved"));
    bootstrap.Modal.getInstance(document.getElementById("empModal"))?.hide();
  } catch (error) {
    toast('Lỗi lưu nhân viên');
  }
}

async function toggleLock(id) {
  const emp = employees.find(e => e.id === id);
  if (!emp) return;

  try {
    if (emp.locked) {
      await api.unlockStaff(id);
      toast(t("toast.unlocked"));
    } else {
      await api.lockStaff(id);
      toast(t("toast.locked"));
    }
    
    await loadEmployees();
  } catch (error) {
    toast('Lỗi thao tác');
  }
}

async function resendEmail(id) {
  try {
    await api.resendStaffEmail(id);
    toast(t("toast.email"));
  } catch (error) {
    toast('Lỗi gửi email');
  }
}
```

### BƯỚC 3: Tạo các trang còn thiếu

#### 3.1. `first-login.html`
Trang đăng nhập lần đầu qua link email (UC-03, UC-37)

#### 3.2. `init-password.html`
Trang đổi mật khẩu bắt buộc lần đầu (UC-04)

### BƯỚC 4: Testing
1. Test từng API endpoint với Postman/curl
2. Test frontend gọi API
3. Test error handling
4. Test loading states

---

## 📊 ƯỚC TÍNH THỜI GIAN

| Task | Thời gian |
|------|-----------|
| Tạo `api.js` helper | 1h |
| Sửa `pos.js` | 2h |
| Sửa `employees.js` | 1.5h |
| Sửa `products.js` | 1.5h |
| Sửa `categories.js` | 1h |
| Sửa `customers.js` | 1.5h |
| Sửa `reports.js` | 2h |
| Sửa `profile.js` | 1h |
| Tạo `first-login.html` | 1.5h |
| Tạo `init-password.html` | 1h |
| Testing & bug fixes | 3h |
| **TỔNG** | **17h** |

---

## 🚀 BẮT ĐẦU NGAY

Bạn muốn tôi:
1. ✅ Tạo file `api.js` helper?
2. ✅ Sửa `pos.js` để gọi API thật?
3. ✅ Sửa `employees.js` để gọi API thật?
4. ✅ Tạo trang `first-login.html` và `init-password.html`?
5. ✅ Làm tất cả các bước trên?

**Hãy cho tôi biết bạn muốn bắt đầu từ đâu!** 🎯
