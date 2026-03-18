// Products Module - Real API Integration
import API from './api.js';
import { requireAuth } from './auth.js';

(() => {
    requireAuth();

    let pendingDeleteId = null;
    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";

    const toastEl = document.getElementById("toast");
    const toastText = document.getElementById("toastText");

    const i18n = {
        vi: {
            "page.products": "Sản phẩm",
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
            "prod.searchPh": "Tìm sản phẩm theo tên hoặc mã vạch...",
            "prod.add": "Thêm sản phẩm",
            "prod.colName": "Tên sản phẩm",
            "prod.colBarcode": "Mã vạch",
            "prod.colCategory": "Danh mục",
            "prod.colCost": "Giá nhập",
            "prod.colPrice": "Giá bán",
            "prod.colStock": "Tồn kho",
            "prod.colActions": "Thao tác",
            "prod.modalAdd": "Thêm sản phẩm",
            "prod.modalEdit": "Sửa sản phẩm",
            "prod.modalView": "Chi tiết sản phẩm",
            "prod.fName": "Tên sản phẩm",
            "prod.fBarcode": "Mã vạch",
            "prod.fType": "Loại",
            "prod.fCost": "Giá nhập",
            "prod.fPrice": "Giá bán",
            "prod.fCategory": "Danh mục",
            "prod.fStock": "Tồn kho",
            "type.phone": "Điện thoại",
            "type.earbuds": "Tai nghe",
            "type.case": "Ốp lưng",
            "type.charger": "Sạc",
            "type.cable": "Cáp",
            "type.accessory": "Phụ kiện",
            "common.cancel": "Hủy",
            "common.save": "Lưu",
            "common.close": "Đóng",
            "toast.saved": "Đã lưu sản phẩm",
            "toast.deleted": "Đã xóa sản phẩm",
            "toast.invalid": "Vui lòng nhập đủ thông tin",
            "confirm.delete": "Xóa sản phẩm này?",
            "view.name": "Tên",
            "view.barcode": "Mã vạch",
            "view.type": "Loại",
            "view.category": "Danh mục",
            "view.cost": "Giá nhập",
            "view.price": "Giá bán",
            "view.stock": "Tồn kho",
            "prod.modalDelete": "Xóa sản phẩm",
            "common.delete": "Xóa",
            "confirm.deleteText": "Bạn có chắc muốn xóa sản phẩm này?",
            "view.profit": "Lợi nhuận",
            "toast.error": "Có lỗi xảy ra",
        },
        en: {
            "prod.modalDelete": "Delete product",
            "common.delete": "Delete",
            "confirm.deleteText": "Are you sure you want to delete this product?",
            "view.profit": "Profit",
            "page.products": "Products",
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
            "prod.searchPh": "Search by name or barcode...",
            "prod.add": "Add product",
            "prod.colName": "Product name",
            "prod.colBarcode": "Barcode",
            "prod.colCategory": "Category",
            "prod.colCost": "Cost",
            "prod.colPrice": "Price",
            "prod.colStock": "Stock",
            "prod.colActions": "Actions",
            "prod.modalAdd": "Add product",
            "prod.modalEdit": "Edit product",
            "prod.modalView": "Product details",
            "prod.fName": "Product name",
            "prod.fBarcode": "Barcode",
            "prod.fType": "Type",
            "prod.fCost": "Cost",
            "prod.fPrice": "Price",
            "prod.fCategory": "Category",
            "prod.fStock": "Stock",
            "type.phone": "Phone",
            "type.earbuds": "Earbuds",
            "type.case": "Case",
            "type.charger": "Charger",
            "type.cable": "Cable",
            "type.accessory": "Accessory",
            "common.cancel": "Cancel",
            "common.save": "Save",
            "common.close": "Close",
            "toast.saved": "Product saved",
            "toast.deleted": "Product deleted",
            "toast.invalid": "Please fill required fields",
            "confirm.delete": "Delete this product?",
            "view.name": "Name",
            "view.barcode": "Barcode",
            "view.type": "Type",
            "view.category": "Category",
            "view.cost": "Cost",
            "view.price": "Price",
            "view.stock": "Stock",
            "toast.error": "An error occurred",
        }
    };

    const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
    const t = (k) => i18n[getLang()]?.[k] || i18n.en[k] || k;
    const fmtVND = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "\u00A0₫";

    function toast(msg) {
        if (!toastEl || !toastText) return;
        toastText.textContent = msg;
        toastEl.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toastEl.classList.remove("show"), 1500);
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

    function stockClass(n) {
        const v = Number(n || 0);
        if (v <= 0) return "out";
        if (v <= 10) return "low";
        return "ok";
    }

    function rowActions(p) {
        return `
      <div class="ps-actions">
        <button class="ps-actBtn" data-act="view" title="View"><i class="bi bi-eye"></i></button>
        <button class="ps-actBtn" data-act="edit" title="Edit"><i class="bi bi-pencil-square"></i></button>
        <button class="ps-actBtn danger" data-act="del" title="Delete"><i class="bi bi-trash3"></i></button>
      </div>
    `;
    }

    async function render() {
        try {
            const q = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
            const tbody = document.getElementById("tbody");
            const countEl = document.getElementById("prodCount");

            const data = await API.products.getAll();
            const list = data.filter(p =>
                !q || p.name.toLowerCase().includes(q) || (p.barcode || "").toLowerCase().includes(q)
            );

            if (countEl) countEl.textContent = `(${list.length})`;
            if (!tbody) return;

            tbody.innerHTML = list.map(p => `
        <tr data-id="${p.id}">
          <td style="font-weight:900">${p.name}</td>
          <td style="color:var(--muted); font-weight:800">${p.barcode || ""}</td>
          <td><span class="ps-pill">${p.category || ""}</span></td>
          <td class="text-end" style="color:var(--muted); font-weight:800">${fmtVND(p.cost)}</td>
          <td class="text-end" style="font-weight:900">${fmtVND(p.price)}</td>
          <td class="text-center"><span class="ps-stock ${stockClass(p.stock)}">${p.stock}</span></td>
          <td class="text-center">${rowActions(p)}</td>
        </tr>
      `).join("");

            tbody.querySelectorAll("tr").forEach(tr => {
                const id = tr.dataset.id;
                tr.querySelector('[data-act="view"]').addEventListener("click", () => openView(id));
                tr.querySelector('[data-act="edit"]').addEventListener("click", () => openEdit(id));
                tr.querySelector('[data-act="del"]').addEventListener("click", () => openDelete(id));
            });
        } catch (err) {
            console.error('Render error:', err);
            toast(t("toast.error"));
        }
    }

    function openAdd() {
        document.getElementById("modalTitle").textContent = t("prod.modalAdd");
        document.getElementById("prodId").value = "";
        document.getElementById("fName").value = "";
        document.getElementById("fBarcode").value = "";
        document.getElementById("fType").value = "phone";
        document.getElementById("fCost").value = "";
        document.getElementById("fPrice").value = "";
        document.getElementById("fCategory").value = "";
        document.getElementById("fStock").value = "";
    }

    async function openEdit(id) {
        try {
            const p = await API.products.getById(id);
            if (!p) return;

            document.getElementById("modalTitle").textContent = t("prod.modalEdit");
            document.getElementById("prodId").value = p.id;
            document.getElementById("fName").value = p.name || "";
            document.getElementById("fBarcode").value = p.barcode || "";
            document.getElementById("fType").value = p.type || "phone";
            document.getElementById("fCost").value = p.cost ?? "";
            document.getElementById("fPrice").value = p.price ?? "";
            document.getElementById("fCategory").value = p.category || "";
            document.getElementById("fStock").value = p.stock ?? "";

            bootstrap.Modal.getOrCreateInstance(document.getElementById("productModal")).show();
        } catch (err) {
            console.error('Edit error:', err);
            toast(t("toast.error"));
        }
    }

    async function openView(id) {
        try {
            const p = await API.products.getById(id);
            if (!p) return;

            const profit = (Number(p.price || 0) - Number(p.cost || 0));
            const viewBody = document.getElementById("viewBody");
            viewBody.innerHTML = `
        <div class="ps-view__hero">
          <div class="ps-view__icon"><i class="bi ${iconByType(p)}"></i></div>
          <div class="ps-view__name">${p.name}</div>
          <div class="ps-view__barcode">${p.barcode || "-"}</div>
        </div>
        <div class="ps-view__card">
          <div class="ps-view__grid">
            <div class="ps-view__label" data-i18n="view.category">${t("view.category")}</div>
            <div class="ps-view__value">${p.category || "-"}</div>
            <div class="ps-view__label" data-i18n="view.type">${t("view.type")}</div>
            <div class="ps-view__value">${p.type || "-"}</div>
            <div class="ps-view__label" data-i18n="view.cost">${t("view.cost")}</div>
            <div class="ps-view__value">${fmtVND(p.cost)}</div>
            <div class="ps-view__label" data-i18n="view.price">${t("view.price")}</div>
            <div class="ps-view__value">${fmtVND(p.price)}</div>
            <div class="ps-view__label" data-i18n="view.stock">${t("view.stock")}</div>
            <div class="ps-view__value">${p.stock}</div>
          </div>
          <div class="ps-view__divider"></div>
          <div class="ps-view__profit">
            <div class="ps-view__label" data-i18n="view.profit">${t("view.profit")}</div>
            <div class="v">${fmtVND(profit)}</div>
          </div>
        </div>
      `;

            bootstrap.Modal.getOrCreateInstance(document.getElementById("viewModal")).show();
        } catch (err) {
            console.error('View error:', err);
            toast(t("toast.error"));
        }
    }

    function parseNumber(s) {
        return Number(String(s || "").replace(/[^\d]/g, "")) || 0;
    }

    async function save() {
        try {
            const id = document.getElementById("prodId").value.trim();
            const name = document.getElementById("fName").value.trim();
            const barcode = document.getElementById("fBarcode").value.trim();
            const type = document.getElementById("fType").value;
            const category = document.getElementById("fCategory").value.trim();
            const cost = parseNumber(document.getElementById("fCost").value);
            const price = parseNumber(document.getElementById("fPrice").value);
            const stock = parseNumber(document.getElementById("fStock").value);

            if (!name || !barcode || !category || cost <= 0 || price <= 0) {
                toast(t("toast.invalid"));
                return;
            }

            const data = { name, barcode, type, category, cost, price, stock };

            if (id) {
                await API.products.update(id, data);
            } else {
                await API.products.create(data);
            }

            render();
            toast(t("toast.saved"));
            bootstrap.Modal.getInstance(document.getElementById("productModal"))?.hide();
        } catch (err) {
            console.error('Save error:', err);
            toast(t("toast.error"));
        }
    }

    function openDelete(id) {
        pendingDeleteId = id;
        const el = document.getElementById("deleteText");
        el.textContent = t("confirm.deleteText");
        bootstrap.Modal.getOrCreateInstance(document.getElementById("deleteModal")).show();
    }

    async function confirmDelete() {
        if (!pendingDeleteId) return;
        try {
            await API.products.delete(pendingDeleteId);
            pendingDeleteId = null;
            render();
            toast(t("toast.deleted"));
            bootstrap.Modal.getInstance(document.getElementById("deleteModal"))?.hide();
        } catch (err) {
            console.error('Delete error:', err);
            toast(t("toast.error"));
        }
    }

    function iconByType(p) {
        const type = (p.type || "").toLowerCase();
        const MAP = {
            phone: "bi-phone",
            earbuds: "bi-headphones",
            case: "bi-shield-check",
            charger: "bi-plug",
            cable: "bi-link-45deg",
            accessory: "bi-box-seam",
        };
        if (MAP[type]) return MAP[type];
        const n = (p.name || "").toLowerCase();
        if (n.includes("ốp") || n.includes("case")) return MAP.case;
        if (n.includes("cáp") || n.includes("lightning") || n.includes("usb")) return MAP.cable;
        if (n.includes("sạc") || n.includes("charger")) return MAP.charger;
        if (n.includes("tai nghe") || n.includes("airpods") || n.includes("buds")) return MAP.earbuds;
        return "bi-box-seam";
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
