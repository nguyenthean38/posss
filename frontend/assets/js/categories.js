// Categories Module - Real API Integration
import API from './api.js?v=3';
import { requireAuth } from './auth.js';

(() => {
    requireAuth();

    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";
    let pendingDeleteId = null;

    const i18n = {
        vi: {
            "page.categories": "Danh mục",
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
            "cat.searchPh": "Tìm danh mục...",
            "cat.add": "Thêm",
            "cat.modalAdd": "Thêm danh mục",
            "cat.modalEdit": "Sửa danh mục",
            "cat.modalView": "Xem chi tiết",
            "cat.modalDelete": "Xóa danh mục",
            "cat.deleteHint": "Nếu danh mục đang có sản phẩm, hệ thống sẽ chuyển sản phẩm sang \"Khác\".",
            "cat.fName": "Tên danh mục",
            "cat.fDesc": "Mô tả",
            "cat.fIcon": "Loại icon",
            "icon.phone": "Điện thoại",
            "icon.accessory": "Phụ kiện",
            "icon.earbuds": "Tai nghe",
            "icon.charger": "Sạc & Pin",
            "icon.watch": "Đồng hồ",
            "icon.other": "Khác",
            "common.cancel": "Hủy",
            "common.save": "Lưu",
            "common.delete": "Xóa",
            "toast.saved": "Đã lưu danh mục",
            "toast.deleted": "Đã xóa danh mục",
            "toast.invalid": "Vui lòng nhập tên danh mục",
            "cat.items": "sản phẩm",
            "view.name": "Tên",
            "view.desc": "Mô tả",
            "view.icon": "Icon",
            "view.count": "Số sản phẩm",
            "toast.error": "Có lỗi xảy ra",
        },
        en: {
            "page.categories": "Categories",
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
            "cat.searchPh": "Search categories...",
            "cat.add": "Add",
            "cat.modalAdd": "Add category",
            "cat.modalEdit": "Edit category",
            "cat.modalView": "Details",
            "cat.modalDelete": "Delete category",
            "cat.deleteHint": "If category has products, items will be moved to \"Other\".",
            "cat.fName": "Category name",
            "cat.fDesc": "Description",
            "cat.fIcon": "Icon type",
            "icon.phone": "Phone",
            "icon.accessory": "Accessory",
            "icon.earbuds": "Earbuds",
            "icon.charger": "Charging",
            "icon.watch": "Watch",
            "icon.other": "Other",
            "common.cancel": "Cancel",
            "common.save": "Save",
            "common.delete": "Delete",
            "toast.saved": "Category saved",
            "toast.deleted": "Category deleted",
            "toast.invalid": "Please enter a name",
            "cat.items": "items",
            "view.name": "Name",
            "view.desc": "Description",
            "view.icon": "Icon",
            "view.count": "Items",
            "toast.error": "An error occurred",
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
        const MAP = {
            phone: "bi-phone",
            accessory: "bi-tag",
            earbuds: "bi-headphones",
            charger: "bi-battery-charging",
            watch: "bi-smartwatch",
            other: "bi-box-seam",
        };
        return MAP[icon] || "bi-tags";
    }

    async function render() {
        try {
            const q = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
            const grid = document.getElementById("grid");
            const countEl = document.getElementById("catCount");

            const data = await API.categories.getAll();
            const list = data.filter(c =>
                !q || c.name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q)
            );

            if (countEl) countEl.textContent = `(${list.length})`;
            if (!grid) return;

            grid.innerHTML = list.map(c => {
                const n = c.product_count || 0;
                return `
            <div class="col-12 col-md-6 col-xl-4">
              <div class="ps-card ps-catCard" data-id="${c.id}" role="button" tabindex="0">
                <div class="ps-catIcon"><i class="bi ${iconClass(c.icon)}"></i></div>
                <div class="ps-catMeta">
                  <div class="ps-catName">${c.name}</div>
                  <div class="ps-catDesc">${c.description || ""}</div>
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
            document.getElementById("fName").value = c.name || "";
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

            const count = c.product_count || 0;
            const viewBody = document.getElementById("viewBody");
            viewBody.innerHTML = `
          <div class="ps-view__hero">
            <div class="ps-view__icon"><i class="bi ${iconClass(c.icon)}"></i></div>
            <div class="ps-view__name">${c.name}</div>
            <div class="ps-view__barcode">${c.description || ""}</div>
          </div>
          <div class="ps-view__card">
            <div class="ps-view__grid">
              <div class="ps-view__label">${t("view.name")}</div>
              <div class="ps-view__value">${c.name}</div>
              <div class="ps-view__label">${t("view.desc")}</div>
              <div class="ps-view__value">${c.description || "-"}</div>
              <div class="ps-view__label">${t("view.icon")}</div>
              <div class="ps-view__value">${c.icon}</div>
              <div class="ps-view__label">${t("view.count")}</div>
              <div class="ps-view__value">${count}</div>
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

            const data = { name, description, icon };

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

