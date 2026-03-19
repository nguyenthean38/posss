// Customers Module - Real API Integration
import API from './api.js?v=3';
import { requireAuth } from './auth.js';

(() => {
    requireAuth();

    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";
    let pendingDeleteId = null;

    const i18n = {
        vi: {
            "page.customers": "Khách hàng",
            "role.admin": "Quản trị viên",
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
            "cus.searchPh": "Tìm kiếm...",
            "cus.add": "Thêm",
            "cus.modalAdd": "Thêm khách hàng",
            "cus.modalEdit": "Sửa khách hàng",
            "cus.modalDelete": "Xóa khách hàng",
            "cus.fName": "Tên khách hàng",
            "cus.fPhone": "Số điện thoại",
            "cus.fAddress": "Địa chỉ",
            "cus.orders": "Đơn hàng",
            "cus.revenue": "Tổng doanh thu",
            "cus.sortRevDesc": "Doanh thu ↓",
            "cus.sortRevAsc": "Doanh thu ↑",
            "cus.sortOrdDesc": "Đơn hàng ↓",
            "cus.sortOrdAsc": "Đơn hàng ↑",
            "cus.sortNameAsc": "Tên A→Z",
            "hist.title": "Lịch sử mua hàng",
            "hist.totalOrders": "Đơn hàng",
            "hist.totalSum": "Tổng cộng",
            "common.save": "Lưu",
            "common.cancel": "Hủy",
            "common.delete": "Xóa",
            "toast.saved": "Đã lưu khách hàng",
            "toast.deleted": "Đã xóa khách hàng",
            "toast.invalid": "Vui lòng nhập tên + số điện thoại",
            "confirm.deleteText": "Bạn có chắc muốn xóa khách hàng này?",
            "rank.vip": "VIP",
            "toast.error": "Có lỗi xảy ra",
        },
        en: {
            "page.customers": "Customers",
            "role.admin": "Administrator",
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
            "cus.searchPh": "Search...",
            "cus.add": "Add",
            "cus.modalAdd": "Add customer",
            "cus.modalEdit": "Edit customer",
            "cus.modalDelete": "Delete customer",
            "cus.fName": "Customer name",
            "cus.fPhone": "Phone",
            "cus.fAddress": "Address",
            "cus.orders": "Orders",
            "cus.revenue": "Revenue",
            "cus.sortRevDesc": "Revenue ↓",
            "cus.sortRevAsc": "Revenue ↑",
            "cus.sortOrdDesc": "Orders ↓",
            "cus.sortOrdAsc": "Orders ↑",
            "cus.sortNameAsc": "Name A→Z",
            "hist.title": "Purchase history",
            "hist.totalOrders": "Orders",
            "hist.totalSum": "Total",
            "common.save": "Save",
            "common.cancel": "Cancel",
            "common.delete": "Delete",
            "toast.saved": "Customer saved",
            "toast.deleted": "Customer deleted",
            "toast.invalid": "Please enter name + phone",
            "confirm.deleteText": "Delete this customer?",
            "rank.vip": "VIP",
            "toast.error": "An error occurred",
        }
    };

    const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
    const t = (k) => i18n[getLang()]?.[k] || i18n.en[k] || k;
    const fmtVND = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "\u00A0₫";

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
                  <div class="ps-cusAvatar">${initials(c.name)}</div>
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
            toast(t("toast.error"));
        }
    }

    function openAdd() {
        document.getElementById("cusModalTitle").textContent = t("cus.modalAdd");
        document.getElementById("cusId").value = "";
        document.getElementById("fName").value = "";
        document.getElementById("fPhone").value = "";
        document.getElementById("fAddress").value = "";
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
            bootstrap.Modal.getOrCreateInstance(document.getElementById("cusModal")).show();
        } catch (err) {
            console.error('Edit error:', err);
            toast(t("toast.error"));
        }
    }

    async function save() {
        try {
            const id = document.getElementById("cusId").value.trim();
            const name = (document.getElementById("fName").value || "").trim();
            const phone = (document.getElementById("fPhone").value || "").trim();
            const address = (document.getElementById("fAddress").value || "").trim();

            if (!name || !phone) {
                toast(t("toast.invalid"));
                return;
            }

            const data = { name, phone, address };

            if (id) {
                await API.customers.update(id, data);
            } else {
                await API.customers.create(data);
            }

            render();
            toast(t("toast.saved"));
            bootstrap.Modal.getInstance(document.getElementById("cusModal"))?.hide();
        } catch (err) {
            console.error('Save error:', err);
            toast(t("toast.error"));
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
            toast(t("toast.error"));
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
        document.getElementById("sortSelect")?.addEventListener("change", render);
        document.getElementById("btnAdd")?.addEventListener("click", openAdd);
        document.getElementById("btnSave")?.addEventListener("click", save);
        document.getElementById("btnConfirmDelete")?.addEventListener("click", confirmDelete);

        render();
    }

    init();
})();

