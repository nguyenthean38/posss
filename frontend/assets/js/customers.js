// Customers Module - Real API Integration
import API from './api.js?v=8';
import { requireAuth } from './auth.js';
import { getAvatarImage } from './assets.js';

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
    const fmtVND = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "\u00A0₫";

    const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
    const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    function validateImageFile(file) {
        if (!file) return null;
        if (file.size > MAX_IMAGE_BYTES) return t("toast.fileTooBig");
        if (!ALLOWED_IMAGE_MIME.includes(file.type)) return t("toast.fileType");
        return null;
    }

    function toast(msg, variant = "success") {
        const el = document.getElementById("toast");
        const txt = document.getElementById("toastText");
        const icon = document.getElementById("toastIcon");
        if (!el || !txt) return;
        txt.textContent = msg;
        const isErr = variant === "error";
        el.classList.toggle("ps-toast--error", isErr);
        if (icon) {
            icon.className = isErr ? "bi bi-exclamation-circle" : "bi bi-check2-circle";
            icon.setAttribute("aria-hidden", "true");
        }
        el.setAttribute("role", isErr ? "alert" : "status");
        el.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => {
            el.classList.remove("show");
            el.classList.remove("ps-toast--error");
        }, isErr ? 2200 : 1500);
    }

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

    function initials(name) {
        const parts = (name || "").trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return "A";
        return (parts[0][0] || "A").toUpperCase();
    }

    function escapeAttr(s) {
        return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    }

    function customerAvatarHtml(c) {
        const ini = initials(c.name);
        if (!c.avatar) {
            return `<div class="ps-cusAvatar"><span class="ps-cusAvatarInitials">${ini}</span></div>`;
        }
        const src = escapeAttr(getAvatarImage(c.avatar));
        return `<div class="ps-cusAvatar">
                  <img class="ps-cusAvatarImg" src="${src}" alt="" decoding="async" loading="lazy" onerror="this.remove();var s=this.parentElement.querySelector('.ps-cusAvatarInitials');if(s)s.style.display='grid';" />
                  <span class="ps-cusAvatarInitials" style="display:none">${ini}</span>
                </div>`;
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

    function vip(revenue) {
        return revenue >= 50000000;
    }

    function sortList(list) {
        const mode = document.getElementById("sortSelect")?.value || "rev_desc";
        const cmp = {
            rev_desc: (a, b) => (b.total_revenue || 0) - (a.total_revenue || 0),
            rev_asc: (a, b) => (a.total_revenue || 0) - (b.total_revenue || 0),
            ord_desc: (a, b) => (b.total_orders || 0) - (a.total_orders || 0),
            ord_asc: (a, b) => (a.total_orders || 0) - (b.total_orders || 0),
            name_asc: (a, b) => a.name.localeCompare(b.name),
        }[mode];
        return list.sort(cmp || ((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0)));
    }

    async function render() {
        try {
            const q = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
            const grid = document.getElementById("grid");
            const countEl = document.getElementById("cusCount");

            let data = await API.customers.getAll();
            data = data.filter(c =>
                !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.address || "").toLowerCase().includes(q)
            );

            data = sortList(data);

            if (countEl) countEl.textContent = `(${data.length})`;
            if (!grid) return;

            grid.innerHTML = data.map(c => `
          <div class="col-12 col-xl-6">
            <div class="ps-card ps-cusCard" data-id="${c.id}">
              <div>
                <div class="ps-cusTop">
                  ${customerAvatarHtml(c)}
                  <div class="ps-cusMeta">
                    <div class="d-flex align-items-center">
                      <div class="ps-cusName">${c.name}</div>
                      ${vip(c.total_revenue) ? `<span class="ps-rank vip ms-2">${t("rank.vip")}</span>` : ""}
                    </div>
                    <div class="ps-cusLine"><i class="bi bi-telephone" style="color:var(--muted)"></i> ${c.phone}</div>
                    <div class="ps-cusLine"><i class="bi bi-geo-alt" style="color:var(--muted)"></i> ${c.address || "-"}</div>
                  </div>
                </div>
                <div class="ps-cusDivider"></div>
              </div>
              <div class="ps-cusBottom">
                <div class="ps-cusStat">
                  <div>${t("cus.orders")}</div>
                  <div class="v">${c.total_orders || 0}</div>
                </div>
                <div class="ps-cusStat ps-cusRevenue">
                  <div>${t("cus.revenue")}</div>
                  <div class="v">${fmtVND(c.total_revenue)}</div>
                </div>
                <div class="ps-cusActions">
                  <button class="ps-cusEye" data-act="hist" title="history"><i class="bi bi-eye"></i></button>
                  <button class="ps-cusEye" data-act="edit" title="edit"><i class="bi bi-pencil-square"></i></button>
                  <button class="ps-cusEye" data-act="del" title="delete"><i class="bi bi-trash3"></i></button>
                </div>
              </div>
            </div>
          </div>
        `).join("");

            grid.querySelectorAll(".ps-cusCard").forEach(card => {
                const id = card.dataset.id;
                card.querySelector('[data-act="hist"]').addEventListener("click", () => openHistory(id));
                card.querySelector('[data-act="edit"]').addEventListener("click", () => openEdit(id));
                card.querySelector('[data-act="del"]').addEventListener("click", () => openDelete(id));
            });
        } catch (err) {
            console.error('Render error:', err);
            toast(err.message || t("toast.error"), "error");
        }
    }

    async function openEdit(id) {
        try {
            const c = await API.customers.getById(id);
            if (!c) return;
            document.getElementById("cusModalTitle").textContent = t("cus.modalEdit");
            document.getElementById("cusId").value = c.id;
            document.getElementById("fName").value = c.name || "";
            document.getElementById("fPhone").value = c.phone || "";
            document.getElementById("fAddress").value = c.address || "";
            
            // Clear avatar input and preview
            const avatarInput = document.getElementById("fAvatar");
            const avatarPreview = document.getElementById("avatarPreview");
            if (avatarInput) avatarInput.value = "";
            if (avatarPreview) avatarPreview.style.display = "none";
            
            bootstrap.Modal.getOrCreateInstance(document.getElementById("cusModal")).show();
        } catch (err) {
            console.error('Edit error:', err);
            toast(err.message || t("toast.error"), "error");
        }
    }

    async function save() {
        try {
            const id = document.getElementById("cusId").value.trim();
            const name = (document.getElementById("fName").value || "").trim();
            const phone = (document.getElementById("fPhone").value || "").trim();
            const address = (document.getElementById("fAddress").value || "").trim();
            const avatarFile = document.getElementById("fAvatar").files[0];

            if (!name || !phone) {
                toast(t("toast.invalid"), "error");
                return;
            }

            if (!id) {
                // Khách hàng chỉ được tạo qua POS checkout, không cho tạo thủ công
                toast(t("toast.error"), "error");
                return;
            }

            // Sử dụng FormData nếu có file upload
            if (avatarFile) {
                const imgErr = validateImageFile(avatarFile);
                if (imgErr) {
                    toast(imgErr, "error");
                    return;
                }
                const formData = new FormData();
                formData.append('full_name', name);
                formData.append('phone_number', phone);
                formData.append('address', address);
                formData.append('avatar', avatarFile);
                
                await API.customers.update(id, formData);
            } else {
                // Không có avatar mới, chỉ update thông tin
                const data = { full_name: name, phone_number: phone, address };
                await API.customers.update(id, data);
            }

            render();
            toast(t("toast.saved"));
            bootstrap.Modal.getInstance(document.getElementById("cusModal"))?.hide();
        } catch (err) {
            console.error('Save error:', err);
            toast(err.message || t("toast.error"), "error");
        }
    }

    function openDelete(id) {
        pendingDeleteId = id;
        document.getElementById("deleteText").textContent = t("confirm.deleteText");
        bootstrap.Modal.getOrCreateInstance(document.getElementById("deleteModal")).show();
    }

    async function confirmDelete() {
        if (!pendingDeleteId) return;
        try {
            await API.customers.delete(pendingDeleteId);
            pendingDeleteId = null;
            render();
            toast(t("toast.deleted"));
            bootstrap.Modal.getInstance(document.getElementById("deleteModal"))?.hide();
        } catch (err) {
            console.error('Delete error:', err);
            toast(err.message || t("toast.error"), "error");
        }
    }

    function dateOnly(iso) {
        if (!iso) return "-";
        const d = new Date(iso);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    async function openHistory(id) {
        try {
            const c = await API.customers.getById(id);
            if (!c) return;

            const history = await API.customers.getHistory(id);
            const histBody = document.getElementById("histBody");

            histBody.innerHTML = `
          <div class="ps-histHeader">
            <div class="name">${c.name}</div>
            <div class="sub">
              <span><i class="bi bi-telephone" style="color:var(--muted)"></i> ${c.phone}</span>
              <span><i class="bi bi-geo-alt" style="color:var(--muted)"></i> ${c.address || "-"}</span>
            </div>
            <div class="sum">
              <span>${t("hist.totalOrders")}: <b>${c.total_orders || 0}</b></span>
              <span>${t("hist.totalSum")}: <b>${fmtVND(c.total_revenue)}</b></span>
            </div>
          </div>
          <div class="ps-histList">
            ${history.length
                    ? history.map(o => `
                    <div class="ps-histItem">
                      <div class="left">
                        <div class="code">${o.id}</div>
                        <div class="date">${dateOnly(o.created_at)}</div>
                      </div>
                      <div class="right">
                        <div class="money">${fmtVND(o.total)}</div>
                        <div class="count">${o.item_count || 0} ${getLang() === "vi" ? "sản phẩm" : "items"}</div>
                      </div>
                    </div>
                  `).join("")
                    : `<div class="ps-histItem"><div class="left" style="color:var(--muted);font-weight:800;">${getLang() === "vi" ? "Chưa có đơn hàng" : "No orders yet"}</div></div>`
                }
          </div>
        `;

            bootstrap.Modal.getOrCreateInstance(document.getElementById("histModal")).show();
        } catch (err) {
            console.error('History error:', err);
            toast(err.message || t("toast.error"), "error");
        }
    }

    function init() {
        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        const savedLang = localStorage.getItem(KEY_LANG) || "vi";
        applyLang(savedLang);
        setTheme(savedTheme);

        initLayout();

        document.getElementById("searchInput")?.addEventListener("input", render);
        document.getElementById("sortSelect")?.addEventListener("change", render);
        document.getElementById("btnSave")?.addEventListener("click", save);
        document.getElementById("btnConfirmDelete")?.addEventListener("click", confirmDelete);

        // Avatar preview
        document.getElementById("fAvatar")?.addEventListener("change", (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById("avatarPreview");
            const previewImg = document.getElementById("previewAvatar");
            
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    preview.style.display = "block";
                };
                reader.readAsDataURL(file);
            } else {
                preview.style.display = "none";
            }
        });

        render();
    }

    init();
})();

