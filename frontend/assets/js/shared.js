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
        "act.searchPh": "Tìm theo chi tiết, tên hoặc email nhân viên...",
        "act.search": "Tìm",
        "act.colTime": "Thời gian",
        "act.colUser": "Nhân viên",
        "act.colDetails": "Chi tiết",
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
        "act.searchPh": "Search by details, name or email...",
        "act.search": "Search",
        "act.colTime": "Time",
        "act.colUser": "User",
        "act.colDetails": "Details",
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
