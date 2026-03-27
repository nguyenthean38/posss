// Profile Module - Real API Integration
import API from './api.js?v=5';
import { requireAuth, getUser } from './auth.js';

(() => {
    requireAuth();

    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";

    const i18n = {
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

    const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
    const t = (k) => i18n[getLang()]?.[k] || i18n.en[k] || k;

    function toast(msg) {
        const el = document.getElementById("toast");
        const txt = document.getElementById("toastText");
        if (!el || !txt) return;
        txt.textContent = msg;
        el.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => el.classList.remove("show"), 1500);
    }

    function applyLang(lang) {
        document.documentElement.lang = lang;
        const dict = i18n[lang] || i18n.en;
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (dict[key]) el.textContent = dict[key];
        });
        document.querySelectorAll(".ps-nav__item[data-tooltip]").forEach(a => {
            const span = a.querySelector("span[data-i18n]");
            if (span) a.setAttribute("data-tooltip", span.textContent.trim());
        });
        document.getElementById("langLabel").textContent = lang.toUpperCase();
        localStorage.setItem(KEY_LANG, lang);
    }

    function setTheme(theme) {
        document.body.setAttribute("data-theme", theme);
        localStorage.setItem(KEY_THEME, theme);
        const icon = document.getElementById("btnTheme")?.querySelector("i");
        if (icon) icon.className = theme === "dark" ? "bi bi-moon-stars" : "bi bi-brightness-high";
    }

    function initLayout() {
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("overlay");
        const btnMobileMenu = document.getElementById("btnMobileMenu");
        const btnCollapse = document.getElementById("btnCollapse");

        const openSidebar = () => { sidebar.classList.add("open"); overlay.classList.add("show"); };
        const closeSidebar = () => { sidebar.classList.remove("open"); overlay.classList.remove("show"); };

        btnMobileMenu?.addEventListener("click", openSidebar);
        overlay?.addEventListener("click", closeSidebar);

        btnCollapse?.addEventListener("click", () => {
            document.querySelector(".ps-app").classList.toggle("sidebar-collapsed");
            const ic = btnCollapse.querySelector("i");
            ic?.classList.toggle("bi-chevron-left");
            ic?.classList.toggle("bi-chevron-right");
        });

        document.getElementById("btnTheme")?.addEventListener("click", () => {
            const cur = document.body.getAttribute("data-theme") || "dark";
            setTheme(cur === "dark" ? "light" : "dark");
        });

        document.getElementById("btnLang")?.addEventListener("click", () => {
            const cur = getLang();
            const next = cur === "vi" ? "en" : "vi";
            applyLang(next);
            renderProfile();
            updateStrength();
        });
    }

    function initials(name) {
        const s = (name || "A").trim();
        if (s === "Administrator") return "AD";
        return (s[0] || "A").toUpperCase();
    }

    async function renderProfile() {
        try {
            const user = getUser();
            if (!user) return;

            const p = await API.profile.get();
            const name = p.full_name || p.name || "";
            const init = initials(name);

            document.getElementById("heroAvatar").textContent = init;
            document.getElementById("heroName").textContent = name || "—";
            document.getElementById("heroEmail").textContent = p.email || "—";
            const roleText = (p.role === "admin" || p.role === "Admin") ? t("role.admin") : t("role.staff");
            document.getElementById("heroRole").textContent = roleText;
            const joinedDate = (p.created_at || "").split("T")[0] || (p.created_at || "").substring(0, 10) || "—";
            document.getElementById("heroJoined").textContent = `${t("info.joined")}: ${joinedDate}`;

            document.getElementById("topAvatar").textContent = init;
            document.getElementById("topName").textContent = name || "—";
            document.getElementById("topRole").textContent = roleText;

            document.getElementById("fName").value = name;
            document.getElementById("fEmail").value = p.email || "";
            document.getElementById("fPhone").value = p.phone || "";
            document.getElementById("fAddress").value = p.address || "";
        } catch (err) {
            console.error('Render error:', err);
            toast(t("toast.error"));
        }
    }

    function initTabs() {
        const tabs = document.querySelectorAll(".ps-tab");
        const panelInfo = document.getElementById("panelInfo");
        const panelPwd = document.getElementById("panelPwd");

        tabs.forEach(btn => {
            btn.addEventListener("click", () => {
                tabs.forEach(x => x.classList.remove("active"));
                btn.classList.add("active");

                const tab = btn.dataset.tab;
                panelInfo.style.display = (tab === "info") ? "" : "none";
                panelPwd.style.display = (tab === "pwd") ? "" : "none";
            });
        });
    }

    async function saveInfo() {
        try {
            const full_name = document.getElementById("fName").value.trim();
            const phone     = document.getElementById("fPhone").value.trim();
            const address   = document.getElementById("fAddress").value.trim();

            await API.profile.update({ full_name, phone, address });
            renderProfile();
            toast(t("toast.saved"));
        } catch (err) {
            console.error('Save error:', err);
            toast(t("toast.error"));
        }
    }

    function scorePassword(pw) {
        const s = pw || "";
        let score = 0;
        if (s.length >= 8) score += 1;
        if (/[A-Za-z]/.test(s) && /\d/.test(s)) score += 1;
        if (/[A-Z]/.test(s) && /[a-z]/.test(s)) score += 1;
        if (/[^A-Za-z0-9]/.test(s)) score += 1;
        return Math.min(score, 4);
    }

    function updateStrength() {
        const pw = document.getElementById("newPwd").value;
        const fill = document.getElementById("pwFill");
        const text = document.getElementById("pwText");

        const sc = scorePassword(pw);
        const pct = [0, 30, 55, 80, 100][sc];
        fill.style.width = pct + "%";

        if (!pw) { text.textContent = "—"; return; }
        if (sc <= 1) text.textContent = t("pw.weak");
        else if (sc <= 2) text.textContent = t("pw.medium");
        else text.textContent = t("pw.strong");
    }

    function toggleEye(id) {
        const input = document.getElementById(id);
        if (!input) return;
        input.type = input.type === "password" ? "text" : "password";
    }

    async function changePassword() {
        try {
            const cur = document.getElementById("curPwd").value;
            const nw = document.getElementById("newPwd").value;
            const cf = document.getElementById("cfmPwd").value;

            if (nw !== cf) {
                toast(t("toast.pwdMismatch"));
                return;
            }
            const sc = scorePassword(nw);
            if (nw.length < 8 || sc < 2) {
                toast(t("toast.pwdWeak"));
                return;
            }

            await API.profile.changePassword({ current_password: cur, new_password: nw });
            document.getElementById("curPwd").value = "";
            document.getElementById("newPwd").value = "";
            document.getElementById("cfmPwd").value = "";
            updateStrength();
            toast(t("toast.pwdOk"));
        } catch (err) {
            console.error('Password error:', err);
            if (err.message.includes('401') || err.message.includes('incorrect')) {
                toast(t("toast.pwdWrong"));
            } else {
                toast(t("toast.error"));
            }
        }
    }

    function init() {
        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        const savedLang = localStorage.getItem(KEY_LANG) || "vi";
        applyLang(savedLang);
        setTheme(savedTheme);

        initLayout();
        initTabs();
        renderProfile();

        document.getElementById("btnSaveInfo")?.addEventListener("click", saveInfo);
        document.getElementById("newPwd")?.addEventListener("input", updateStrength);
        document.getElementById("btnChangePwd")?.addEventListener("click", changePassword);

        document.querySelectorAll("[data-eye]").forEach(btn => {
            btn.addEventListener("click", () => toggleEye(btn.dataset.eye));
        });

        updateStrength();
    }

    init();
})();

