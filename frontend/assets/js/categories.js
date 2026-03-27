// Categories Module - Real API Integration
import API from './api.js?v=5';
import { requireAuth } from './auth.js';
import { getCategoryIcon } from './assets.js';

(() => {
    requireAuth();

    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";
    let pendingDeleteId = null;

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

    function applyLang(lang) {
        document.documentElement.lang = lang;
        const dict = i18n[lang] || i18n.en;
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (dict[key]) el.textContent = dict[key];
        });
        document.querySelectorAll("[data-i18n-ph]").forEach(el => {
            const key = el.getAttribute("data-i18n-ph");
            if (dict[key]) el.setAttribute("placeholder", dict[key]);
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

    function toast(msg) {
        const el = document.getElementById("toast");
        const txt = document.getElementById("toastText");
        if (!el || !txt) return;
        txt.textContent = msg;
        el.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => el.classList.remove("show"), 1500);
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
            const icon = btnCollapse.querySelector("i");
            icon?.classList.toggle("bi-chevron-left");
            icon?.classList.toggle("bi-chevron-right");
        });

        document.getElementById("btnTheme")?.addEventListener("click", () => {
            const cur = document.body.getAttribute("data-theme") || "dark";
            setTheme(cur === "dark" ? "light" : "dark");
        });

        document.getElementById("btnLang")?.addEventListener("click", () => {
            const cur = getLang();
            const next = cur === "vi" ? "en" : "vi";
            applyLang(next);
            render();
        });
    }

    function iconClass(icon) {
        const iconConfig = getCategoryIcon(icon || 'other');
        return iconConfig.icon;
    }
    
    function iconColor(icon) {
        const iconConfig = getCategoryIcon(icon || 'other');
        return iconConfig.color;
    }

    async function render() {
        try {
            const q = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
            const grid = document.getElementById("grid");
            const countEl = document.getElementById("catCount");

            const data = await API.categories.getAll();
            const list = data.filter(c =>
                !q || (c.name || c.category_name || "").toLowerCase().includes(q)
            );

            if (countEl) countEl.textContent = `(${list.length})`;
            if (!grid) return;

            grid.innerHTML = list.map(c => {
                const n = c.product_count || 0;
                const name = c.name || c.category_name || "-";
                const color = iconColor(c.icon);
                return `
            <div class="col-12 col-md-6 col-xl-4">
              <div class="ps-card ps-catCard" data-id="${c.id}" role="button" tabindex="0">
                <div class="ps-catIcon"><i class="bi ${iconClass(c.icon)}" style="color: ${color};"></i></div>
                <div class="ps-catMeta">
                  <div class="ps-catName">${name}</div>
                  <div class="ps-catCount">${n} ${t("cat.items")}</div>
                </div>
                <div class="ps-catActions">
                  <button class="ps-actBtn" data-act="view" title="View"><i class="bi bi-eye"></i></button>
                  <button class="ps-actBtn" data-act="edit" title="Edit"><i class="bi bi-pencil-square"></i></button>
                  <button class="ps-actBtn danger" data-act="del" title="Delete"><i class="bi bi-trash3"></i></button>
                </div>
              </div>
            </div>
          `;
            }).join("");

            grid.querySelectorAll(".ps-catCard").forEach(card => {
                const id = card.dataset.id;
                card.querySelector('[data-act="view"]').addEventListener("click", (e) => { e.stopPropagation(); openView(id); });
                card.querySelector('[data-act="edit"]').addEventListener("click", (e) => { e.stopPropagation(); openEdit(id); });
                card.querySelector('[data-act="del"]').addEventListener("click", (e) => { e.stopPropagation(); openDelete(id); });
                card.addEventListener("click", () => openView(id));
                card.addEventListener("keydown", (e) => { if (e.key === "Enter") openView(id); });
            });
        } catch (err) {
            console.error('Render error:', err);
            toast(t("toast.error"));
        }
    }

    function openAdd() {
        document.getElementById("catModalTitle").textContent = t("cat.modalAdd");
        document.getElementById("catId").value = "";
        document.getElementById("fName").value = "";
        document.getElementById("fDesc").value = "";
        document.getElementById("fIcon").value = "phone";
    }

    async function openEdit(id) {
        try {
            const c = await API.categories.getById(id);
            if (!c) return;

            document.getElementById("catModalTitle").textContent = t("cat.modalEdit");
            document.getElementById("catId").value = c.id;
            document.getElementById("fName").value = c.name || c.category_name || "";
            document.getElementById("fDesc").value = c.description || "";
            document.getElementById("fIcon").value = c.icon || "other";

            bootstrap.Modal.getOrCreateInstance(document.getElementById("catModal")).show();
        } catch (err) {
            console.error('Edit error:', err);
            toast(t("toast.error"));
        }
    }

    async function openView(id) {
        try {
            const c = await API.categories.getById(id);
            if (!c) return;

            const name = c.name || c.category_name || "-";
            const count = c.product_count || 0;
            const desc = c.description || "-";
            const createdAt = c.created_at ? c.created_at.substring(0, 10) : "-";
            const createdBy = c.created_by_name || "-";
            const viewBody = document.getElementById("viewBody");
            viewBody.innerHTML = `
          <div class="ps-view__hero">
            <div class="ps-view__icon"><i class="bi ${iconClass(c.icon)}"></i></div>
            <div class="ps-view__name">${name}</div>
          </div>
          <div class="ps-view__card">
            <div class="ps-view__grid">
              <div class="ps-view__label">${t("view.name")}</div>
              <div class="ps-view__value">${name}</div>
              <div class="ps-view__label">${t("view.desc")}</div>
              <div class="ps-view__value">${desc}</div>
              <div class="ps-view__label">${t("view.count")}</div>
              <div class="ps-view__value">${count}</div>
              <div class="ps-view__label">${t("view.createdAt")}</div>
              <div class="ps-view__value">${createdAt}</div>
              <div class="ps-view__label">${t("view.createdBy")}</div>
              <div class="ps-view__value">${createdBy}</div>
            </div>
          </div>
        `;

            bootstrap.Modal.getOrCreateInstance(document.getElementById("viewModal")).show();
        } catch (err) {
            console.error('View error:', err);
            toast(t("toast.error"));
        }
    }

    function parseText(s) { return (s || "").trim(); }

    async function save() {
        try {
            const id = document.getElementById("catId").value.trim();
            const name = parseText(document.getElementById("fName").value);
            const description = parseText(document.getElementById("fDesc").value);
            const icon = document.getElementById("fIcon").value;

            if (!name) {
                toast(t("toast.invalid"));
                return;
            }

            // Backend expects 'category_name' not 'name'
            const data = { category_name: name, description, icon };

            if (id) {
                await API.categories.update(id, data);
            } else {
                await API.categories.create(data);
            }

            render();
            toast(t("toast.saved"));
            bootstrap.Modal.getInstance(document.getElementById("catModal"))?.hide();
        } catch (err) {
            console.error('Save error:', err);
            toast(t("toast.error"));
        }
    }

    function openDelete(id) {
        pendingDeleteId = id;
        document.getElementById("deleteText").textContent = t("cat.modalDelete");
        bootstrap.Modal.getOrCreateInstance(document.getElementById("deleteModal")).show();
    }

    async function confirmDelete() {
        if (!pendingDeleteId) return;
        try {
            await API.categories.delete(pendingDeleteId);
            pendingDeleteId = null;
            render();
            toast(t("toast.deleted"));
            bootstrap.Modal.getInstance(document.getElementById("deleteModal"))?.hide();
        } catch (err) {
            console.error('Delete error:', err);
            toast(t("toast.error"));
        }
    }

    function init() {
        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        const savedLang = localStorage.getItem(KEY_LANG) || "vi";
        applyLang(savedLang);
        setTheme(savedTheme);

        initLayout();

        document.getElementById("searchInput")?.addEventListener("input", render);
        document.getElementById("btnAdd")?.addEventListener("click", openAdd);
        document.getElementById("btnSave")?.addEventListener("click", save);
        document.getElementById("btnConfirmDelete")?.addEventListener("click", confirmDelete);

        render();
    }

    init();
})();

