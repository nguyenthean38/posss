// ===== SHARED UTILITIES FOR ALL PAGES =====
// Theme, Language, i18n management

const KEY_THEME = "ps_theme";
const KEY_LANG = "ps_lang";

// ===== i18n TRANSLATIONS =====
export const i18n = {
    vi: {
        // Navigation
        "nav.dashboard": "Tổng quan",
        "nav.pos": "Bán hàng",
        "nav.products": "Sản phẩm",
        "nav.categories": "Danh mục",
        "nav.employees": "Nhân viên",
        "nav.customers": "Khách hàng",
        "nav.reports": "Báo cáo",
        "nav.profile": "Hồ sơ",
        "nav.logout": "Đăng xuất",
        "nav.collapse": "Thu gọn",

        // KPI Cards
        "kpi.revenue": "Tổng doanh thu",
        "kpi.orders": "Tổng đơn hàng",
        "kpi.products": "Tổng sản phẩm",
        "kpi.customers": "Tổng khách hàng",

        // Panels
        "panel.salesOverview": "Tổng quan doanh số",
        "panel.orders": "Đơn hàng",
        "panel.recentOrders": "Đơn hàng gần đây",
        "panel.topProducts": "Sản phẩm bán chạy",

        // Table Headers
        "table.customerName": "Tên khách hàng",
        "table.total": "Tổng tiền",
        "table.name": "Tên",
        "table.category": "Danh mục",
        "table.price": "Giá",
        "table.stock": "Tồn kho",
        "table.actions": "Thao tác",

        // Roles
        "role.admin": "Quản trị viên",
        "role.manager": "Quản lý",
        "role.cashier": "Thu ngân",

        // Products
        "product.sold45": "Đã bán 45 sản phẩm",
        "product.sold38": "Đã bán 38 sản phẩm",
        "product.sold67": "Đã bán 67 sản phẩm",
        "product.sold120": "Đã bán 120 sản phẩm",
        "product.case": "Ốp lưng iPhone",

        // Buttons
        "btn.add": "Thêm mới",
        "btn.edit": "Chỉnh sửa",
        "btn.delete": "Xóa",
        "btn.save": "Lưu",
        "btn.cancel": "Hủy",
        "btn.search": "Tìm kiếm",
        "btn.filter": "Lọc",
        "btn.export": "Xuất",

        // Common
        "common.loading": "Đang tải...",
        "common.noData": "Không có dữ liệu",
        "common.error": "Đã xảy ra lỗi",
        "common.success": "Thành công",
        "common.cancel": "Hủy",
        "common.save": "Lưu",
        "common.delete": "Xóa",

        // Pages
        "page.products": "Sản phẩm",
        "page.categories": "Danh mục",

        // Products page
        "prod.searchPh": "Tìm sản phẩm theo tên hoặc mã vạch...",
        "prod.add": "Thêm sản phẩm",
        "prod.modalAdd": "Thêm sản phẩm",
        "prod.modalEdit": "Sửa sản phẩm",
        "prod.modalView": "Xem chi tiết",
        "prod.modalDelete": "Xóa sản phẩm",
        "prod.colName": "Tên sản phẩm",
        "prod.colBarcode": "Mã vạch",
        "prod.colCategory": "Danh mục",
        "prod.colCost": "Giá nhập",
        "prod.colPrice": "Giá bán",
        "prod.colStock": "Tồn kho",
        "prod.colActions": "Thao tác",
        "prod.fName": "Tên sản phẩm",
        "prod.fBarcode": "Mã vạch",
        "prod.fType": "Loại",
        "prod.fCost": "Giá nhập",
        "prod.fPrice": "Giá bán",
        "prod.fCategory": "Danh mục",
        "prod.fStock": "Tồn kho",

        // Product types
        "type.phone": "Điện thoại",
        "type.earbuds": "Tai nghe",
        "type.case": "Ốp lưng",
        "type.charger": "Sạc",
        "type.cable": "Cáp",
        "type.accessory": "Phụ kiện",

        // View modal
        "view.category": "Danh mục",
        "view.type": "Loại",
        "view.cost": "Giá nhập",
        "view.price": "Giá bán",
        "view.stock": "Tồn kho",
        "view.createdAt": "Ngày tạo",
        "view.profit": "Lợi nhuận",
        "view.name": "Tên",
        "view.desc": "Mô tả",
        "view.icon": "Icon",
        "view.count": "Số sản phẩm",
        "view.createdBy": "Người tạo",

        // Categories page
        "cat.searchPh": "Tìm danh mục...",
        "cat.add": "Thêm",
        "cat.modalAdd": "Thêm danh mục",
        "cat.modalEdit": "Sửa danh mục",
        "cat.modalView": "Xem chi tiết",
        "cat.modalDelete": "Xóa danh mục",
        "cat.deleteHint": "Nếu danh mục đang có sản phẩm, hệ thống sẽ chuyển sản phẩm sang 'Khác'.",
        "cat.fName": "Tên danh mục",
        "cat.fDesc": "Mô tả",
        "cat.fIcon": "Loại icon",
        "cat.items": "sản phẩm",
        "icon.phone": "Điện thoại",
        "icon.accessory": "Phụ kiện",
        "icon.earbuds": "Tai nghe",
        "icon.charger": "Sạc & Pin",
        "icon.watch": "Đồng hồ",
        "icon.other": "Khác",

        // Toast / Confirm
        "toast.saved": "Đã lưu thành công",
        "toast.deleted": "Đã xóa thành công",
        "toast.invalid": "Dữ liệu không hợp lệ",
        "toast.error": "Có lỗi xảy ra",
        "toast.err": "Có lỗi xảy ra",
        "toast.ok": "Thành công",
        "toast.fileTooBig": "Ảnh quá lớn (tối đa 2MB)",
        "toast.fileType": "Định dạng ảnh không hợp lệ",
        "toast.added": "Đã thêm vào giỏ",
        "toast.empty": "Giỏ hàng trống",
        "toast.checkout": "Thanh toán thành công",
        "toast.reportFail": "Lỗi tải báo cáo",
        "toast.success": "Thành công",
        "toast.fail": "Sai tên đăng nhập hoặc mật khẩu",
        "confirm.deleteText": "Bạn có chắc muốn xóa?",

        // Profile
        "info.joined": "Ngày tham gia",
        "toast.pwdMismatch": "Mật khẩu xác nhận không khớp",
        "toast.pwdWeak": "Mật khẩu quá yếu",
        "toast.pwdOk": "Đổi mật khẩu thành công",
        "toast.pwdWrong": "Mật khẩu hiện tại không đúng",
        "pw.weak": "Yếu",
        "pw.medium": "Trung bình",
        "pw.strong": "Mạnh",

        // Shifts & Activity
        "page.shifts": "Điểm danh ca",
        "nav.shifts": "Điểm danh",
        "nav.activity": "Nhật ký",
        "page.activity": "Nhật ký ra vào",
        "sh.date": "Ngày",
        "sh.staff": "Nhân viên",
        "sh.allStaff": "Tất cả",
        "sh.load": "Tải",
        "sh.export": "Xuất CSV",
        "sh.colStaff": "Nhân viên",
        "sh.colIn": "Vào ca",
        "sh.colOut": "Ra ca",
        "sh.colStatus": "Trạng thái",
        "sh.edit": "Sửa",
        "sh.editTitle": "Sửa giờ điểm danh",
        "sh.statusOpen": "Đang mở",
        "sh.statusClosed": "Đã đóng",
        "sh.statusAdj": "Đã chỉnh",
        "shift.title": "Điểm danh ca",
        "shift.none": "Chưa vào ca hôm nay ({date})",
        "shift.open": "Đã vào ca lúc {time}",
        "shift.done": "Đã kết thúc ca lúc {time}",
        "shift.loadErr": "Lỗi tải trạng thái ca",
        "shift.toastIn": "Vào ca thành công",
        "shift.toastOut": "Ra ca thành công",
        "act.searchPh": "Tìm theo chi tiết, tên hoặc email nhân viên...",
        "act.search": "Tìm",
        "act.colTime": "Thời gian",
        "act.colUser": "Nhân viên",
        "act.colDetails": "Chi tiết",
        "act.page": "Trang",
        "act.empty": "Không có nhật ký",

        // Employees
        "emp.view": "Xem",
        "emp.lock": "Khóa",
        "emp.unlock": "Mở khóa",
        "emp.needPwd": "Chưa đổi MK",
        "emp.modalAdd": "Thêm nhân viên",
        "status.active": "Hoạt động",
        "status.locked": "Đã khóa",
        "role.admin2": "Quản trị viên",
        "view.status": "Trạng thái",
        "view.role": "Vai trò",
        "view.pwdChanged": "Đã đổi MK",
        "view.yes": "Đã đổi",
        "view.no": "Chưa đổi",
        "view.salesTitle": "Doanh số bán hàng",
        "view.totalOrders": "Tổng đơn hàng",
        "view.totalRevenue": "Tổng doanh thu",
        "view.recentOrders": "Đơn hàng gần đây",
        "view.noOrders": "Chưa có đơn hàng",
        "view.orderId": "Mã đơn",
        "view.customer": "Khách hàng",
        "view.amount": "Số tiền",
        "toast.unlocked": "Đã mở khóa",
        "toast.locked": "Đã khóa",
        "toast.email": "Đã gửi email",

        // Customers
        "cus.orders": "Đơn hàng",
        "cus.revenue": "Doanh thu",
        "cus.modalEdit": "Sửa khách hàng",
        "rank.vip": "VIP",
        "hist.totalOrders": "Tổng đơn",
        "hist.totalSum": "Tổng chi",

        // POS
        "stock": "Tồn kho",
        "empty.title": "Giỏ hàng trống",
        "pay.voucherNone": "Không dùng voucher",
        "loyalty.pointsPreview": "Tích {pts} điểm",
        "loyalty.pointsPreviewNone": "Không đủ tích điểm",
        "loyalty.hintBalance": "Số dư: {bal} điểm",
        "loyalty.hintNew": "Khách hàng mới",
        "toast.removed": "Đã xóa khỏi giỏ",
        "toast.cleared": "Đã xóa giỏ hàng",
        "toast.paid": "Thanh toán thành công",
        "toast.paidLoyalty": "Thanh toán thành công! +{pts} điểm (Tổng: {bal})",

        // Reports
        "chart.noData": "Không có dữ liệu",
        "modal.orderDetail": "Chi tiết đơn hàng",
        "modal.products": "Sản phẩm",

        "role.staff": "Nhân viên",
    },
    en: {
        // Navigation
        "nav.dashboard": "Dashboard",
        "nav.pos": "Point of Sale",
        "nav.products": "Products",
        "nav.categories": "Categories",
        "nav.employees": "Employees",
        "nav.customers": "Customers",
        "nav.reports": "Reports",
        "nav.profile": "Profile",
        "nav.logout": "Logout",
        "nav.collapse": "Collapse",

        // KPI Cards
        "kpi.revenue": "Total Revenue",
        "kpi.orders": "Total Orders",
        "kpi.products": "Total Products",
        "kpi.customers": "Total Customers",

        // Panels
        "panel.salesOverview": "Sales Overview",
        "panel.orders": "Orders",
        "panel.recentOrders": "Recent Orders",
        "panel.topProducts": "Top Products",

        // Table Headers
        "table.customerName": "Customer Name",
        "table.total": "Total",
        "table.name": "Name",
        "table.category": "Category",
        "table.price": "Price",
        "table.stock": "Stock",
        "table.actions": "Actions",

        // Roles
        "role.admin": "Administrator",
        "role.manager": "Manager",
        "role.cashier": "Cashier",

        // Products
        "product.sold45": "45 products sold",
        "product.sold38": "38 products sold",
        "product.sold67": "67 products sold",
        "product.sold120": "120 products sold",
        "product.case": "iPhone Case",

        // Buttons
        "btn.add": "Add New",
        "btn.edit": "Edit",
        "btn.delete": "Delete",
        "btn.save": "Save",
        "btn.cancel": "Cancel",
        "btn.search": "Search",
        "btn.filter": "Filter",
        "btn.export": "Export",

        // Common
        "common.loading": "Loading...",
        "common.noData": "No data available",
        "common.error": "An error occurred",
        "common.success": "Success",
        "common.cancel": "Cancel",
        "common.save": "Save",
        "common.delete": "Delete",

        // Pages
        "page.products": "Products",
        "page.categories": "Categories",

        // Products page
        "prod.searchPh": "Search products by name or barcode...",
        "prod.add": "Add product",
        "prod.modalAdd": "Add product",
        "prod.modalEdit": "Edit product",
        "prod.modalView": "Details",
        "prod.modalDelete": "Delete product",
        "prod.colName": "Product name",
        "prod.colBarcode": "Barcode",
        "prod.colCategory": "Category",
        "prod.colCost": "Cost",
        "prod.colPrice": "Price",
        "prod.colStock": "Stock",
        "prod.colActions": "Actions",
        "prod.fName": "Product name",
        "prod.fBarcode": "Barcode",
        "prod.fType": "Type",
        "prod.fCost": "Cost",
        "prod.fPrice": "Price",
        "prod.fCategory": "Category",
        "prod.fStock": "Stock",

        // Product types
        "type.phone": "Phone",
        "type.earbuds": "Earbuds",
        "type.case": "Case",
        "type.charger": "Charger",
        "type.cable": "Cable",
        "type.accessory": "Accessory",

        // View modal
        "view.category": "Category",
        "view.type": "Type",
        "view.cost": "Cost",
        "view.price": "Price",
        "view.stock": "Stock",
        "view.createdAt": "Created At",
        "view.profit": "Profit",
        "view.name": "Name",
        "view.desc": "Description",
        "view.icon": "Icon",
        "view.count": "Items",
        "view.createdBy": "Created By",

        // Categories page
        "cat.searchPh": "Search categories...",
        "cat.add": "Add",
        "cat.modalAdd": "Add category",
        "cat.modalEdit": "Edit category",
        "cat.modalView": "Details",
        "cat.modalDelete": "Delete category",
        "cat.deleteHint": "If category has products, items will be moved to 'Other'.",
        "cat.fName": "Category name",
        "cat.fDesc": "Description",
        "cat.fIcon": "Icon type",
        "cat.items": "items",
        "icon.phone": "Phone",
        "icon.accessory": "Accessory",
        "icon.earbuds": "Earbuds",
        "icon.charger": "Charging",
        "icon.watch": "Watch",
        "icon.other": "Other",

        // Toast / Confirm
        "toast.saved": "Saved successfully",
        "toast.deleted": "Deleted successfully",
        "toast.invalid": "Invalid data",
        "toast.error": "An error occurred",
        "toast.err": "An error occurred",
        "toast.ok": "Success",
        "toast.fileTooBig": "Image too large (max 2MB)",
        "toast.fileType": "Invalid image format",
        "toast.added": "Added to cart",
        "toast.empty": "Cart is empty",
        "toast.checkout": "Checkout successful",
        "toast.reportFail": "Failed to load report",
        "toast.success": "Success",
        "toast.fail": "Wrong username or password",
        "confirm.deleteText": "Are you sure you want to delete?",

        // Profile
        "info.joined": "Joined",
        "toast.pwdMismatch": "Confirmation password does not match",
        "toast.pwdWeak": "Password is too weak",
        "toast.pwdOk": "Password changed successfully",
        "toast.pwdWrong": "Current password is incorrect",
        "pw.weak": "Weak",
        "pw.medium": "Medium",
        "pw.strong": "Strong",

        // Shifts & Activity
        "page.shifts": "Shift attendance",
        "nav.shifts": "Shifts",
        "nav.activity": "Activity",
        "page.activity": "Activity Log",
        "sh.date": "Date",
        "sh.staff": "Staff",
        "sh.allStaff": "All",
        "sh.load": "Load",
        "sh.export": "Export CSV",
        "sh.colStaff": "Staff",
        "sh.colIn": "Clock-in",
        "sh.colOut": "Clock-out",
        "sh.colStatus": "Status",
        "sh.edit": "Edit",
        "sh.editTitle": "Edit attendance times",
        "sh.statusOpen": "Open",
        "sh.statusClosed": "Closed",
        "sh.statusAdj": "Adjusted",
        "shift.title": "Shift Attendance",
        "shift.none": "Not clocked in today ({date})",
        "shift.open": "Clocked in at {time}",
        "shift.done": "Shift ended at {time}",
        "shift.loadErr": "Error loading shift status",
        "shift.toastIn": "Clocked in successfully",
        "shift.toastOut": "Clocked out successfully",
        "act.searchPh": "Search by details, name or email...",
        "act.search": "Search",
        "act.colTime": "Time",
        "act.colUser": "User",
        "act.colDetails": "Details",
        "act.page": "Page",
        "act.empty": "No activity logs",

        // Employees
        "emp.view": "View",
        "emp.lock": "Lock",
        "emp.unlock": "Unlock",
        "emp.needPwd": "Needs password change",
        "emp.modalAdd": "Add employee",
        "status.active": "Active",
        "status.locked": "Locked",
        "role.admin2": "Administrator",
        "view.status": "Status",
        "view.role": "Role",
        "view.pwdChanged": "Password changed",
        "view.yes": "Yes",
        "view.no": "No",
        "view.salesTitle": "Sales Performance",
        "view.totalOrders": "Total orders",
        "view.totalRevenue": "Total revenue",
        "view.recentOrders": "Recent orders",
        "view.noOrders": "No orders yet",
        "view.orderId": "Order ID",
        "view.customer": "Customer",
        "view.amount": "Amount",
        "toast.unlocked": "Unlocked",
        "toast.locked": "Locked",
        "toast.email": "Email sent",

        // Customers
        "cus.orders": "Orders",
        "cus.revenue": "Revenue",
        "cus.modalEdit": "Edit customer",
        "rank.vip": "VIP",
        "hist.totalOrders": "Total orders",
        "hist.totalSum": "Total spent",

        // POS
        "stock": "Stock",
        "empty.title": "Cart is empty",
        "pay.voucherNone": "No voucher",
        "loyalty.pointsPreview": "Earn {pts} points",
        "loyalty.pointsPreviewNone": "Not enough for points",
        "loyalty.hintBalance": "Balance: {bal} points",
        "loyalty.hintNew": "New customer",
        "toast.removed": "Removed from cart",
        "toast.cleared": "Cart cleared",
        "toast.paid": "Payment successful",
        "toast.paidLoyalty": "Payment successful! +{pts} points (Total: {bal})",

        // Reports
        "chart.noData": "No data",
        "modal.orderDetail": "Order details",
        "modal.products": "Products",

        "role.staff": "Staff",
    }
};

// ===== CORE FUNCTIONS =====
export const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
export const getTheme = () => localStorage.getItem(KEY_THEME) || "dark";
export const t = (k) => i18n[getLang()]?.[k] || i18n.en[k] || k;

export function applyLang() {
    const lang = getLang();
    document.documentElement.lang = lang;
    const label = document.getElementById("langLabel");
    if (label) label.textContent = lang.toUpperCase();

    // Apply translations to all elements with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
        el.textContent = t(el.getAttribute("data-i18n"));
    });
    
    // Apply translations to placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
}

export function applyTheme() {
    const theme = getTheme();
    document.body.setAttribute("data-theme", theme);
    const icon = document.querySelector("#btnTheme i");
    if (icon) {
        icon.className = theme === "dark" ? "bi bi-moon-stars" : "bi bi-sun";
    }
}

export function toggleLang() {
    const next = getLang() === "vi" ? "en" : "vi";
    localStorage.setItem(KEY_LANG, next);
    applyLang();
}

export function toggleTheme() {
    const next = getTheme() === "dark" ? "light" : "dark";
    localStorage.setItem(KEY_THEME, next);
    applyTheme();
}

// ===== TOAST NOTIFICATION =====
export function toast(msg, type = "success") {
    const el = document.getElementById("toast");
    if (!el) {
        alert(msg);
        return;
    }
    
    const icon = el.querySelector("i");
    const text = el.querySelector("#toastText");
    
    if (icon) {
        icon.className = type === "success" 
            ? "bi bi-check2-circle" 
            : type === "error" 
            ? "bi bi-x-circle" 
            : "bi bi-info-circle";
    }
    
    if (text) text.textContent = msg;
    
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 3000);
}

// ===== INITIALIZATION =====
export function initThemeAndLang() {
    applyLang();
    applyTheme();

    // Language toggle
    const btnLang = document.getElementById("btnLang");
    if (btnLang) {
        btnLang.onclick = toggleLang;
    }

    // Theme toggle
    const btnTheme = document.getElementById("btnTheme");
    if (btnTheme) {
        btnTheme.onclick = toggleTheme;
    }
}

// ===== SIDEBAR MOBILE =====
export function initSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const btnMobileMenu = document.getElementById("btnMobileMenu");
    const btnCollapse = document.getElementById("btnCollapse");

    if (btnMobileMenu && sidebar && overlay) {
        btnMobileMenu.onclick = () => {
            sidebar.classList.add("open");
            overlay.classList.add("show");
        };

        overlay.onclick = () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("show");
        };
    }

    if (btnCollapse) {
        btnCollapse.onclick = () => {
            document.querySelector(".ps-app")?.classList.toggle("sidebar-collapsed");
        };
    }
}
