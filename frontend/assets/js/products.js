// Products Module - Real API Integration
import API from './api.js?v=7';
import { requireAuth } from './auth.js';
import { getProductImage } from './assets.js';

(() => {
    requireAuth();

    let pendingDeleteId = null;
    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";

    const toastEl = document.getElementById("toast");
    const toastText = document.getElementById("toastText");

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
        if (!toastEl || !toastText) return;
        const icon = document.getElementById("toastIcon");
        toastText.textContent = msg;
        const isErr = variant === "error";
        toastEl.classList.toggle("ps-toast--error", isErr);
        if (icon) {
            icon.className = isErr ? "bi bi-exclamation-circle" : "bi bi-check2-circle";
        }
        toastEl.setAttribute("role", isErr ? "alert" : "status");
        toastEl.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => {
            toastEl.classList.remove("show");
            toastEl.classList.remove("ps-toast--error");
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
        <button class="ps-actBtn admin-only" data-act="edit" title="Edit"><i class="bi bi-pencil-square"></i></button>
        <button class="ps-actBtn danger admin-only" data-act="del" title="Delete"><i class="bi bi-trash3"></i></button>
      </div>
    `;
    }

    async function render() {
        try {
            const q = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
            const tbody = document.getElementById("tbody");
            const countEl = document.getElementById("prodCount");

            const data = await API.products.getAll();
            const list = data.filter(p => {
                const n = p.product_name || p.name || "";
                return !q || n.toLowerCase().includes(q) || (p.barcode || "").toLowerCase().includes(q);
            });

            if (countEl) countEl.textContent = `(${list.length})`;
            if (!tbody) return;

            tbody.innerHTML = list.map(p => {
                const n = p.product_name || p.name;
                const cat = p.category_name || p.category || "";
                const cost = p.import_price ?? p.cost ?? 0;
                const price = p.selling_price ?? p.price ?? 0;
                const stock = p.stock_quantity ?? p.stock ?? 0;
                return `
        <tr data-id="${p.id}">
          <td style="width: 60px; padding: 0.5rem;">
            <img src="${getProductImage(p.image)}" 
                 alt="${n}" 
                 onerror="this.src='assets/images/product-placeholder.svg'"
                 style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;" />
          </td>
          <td style="font-weight:900">${n}</td>
          <td style="color:var(--muted); font-weight:800">${p.barcode || ""}</td>
          <td><span class="ps-pill">${cat}</span></td>
          <td class="text-end admin-only" style="color:var(--muted); font-weight:800">${fmtVND(cost)}</td>
          <td class="text-end" style="font-weight:900">${fmtVND(price)}</td>
          <td class="text-center"><span class="ps-stock ${stockClass(stock)}">${stock}</span></td>
          <td class="text-center">${rowActions(p)}</td>
        </tr>
      `}).join("");

            tbody.querySelectorAll("tr").forEach(tr => {
                const id = tr.dataset.id;
                tr.querySelector('[data-act="view"]').addEventListener("click", () => openView(id));
                tr.querySelector('[data-act="edit"]').addEventListener("click", () => openEdit(id));
                tr.querySelector('[data-act="del"]').addEventListener("click", () => openDelete(id));
            });
        } catch (err) {
            console.error('Render error:', err);
            toast(err.message || t("toast.error"), "error");
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
        
        // Clear image input and preview
        const imageInput = document.getElementById("fImage");
        const imagePreview = document.getElementById("imagePreview");
        if (imageInput) imageInput.value = "";
        if (imagePreview) imagePreview.style.display = "none";
    }

    async function openEdit(id) {
        try {
            const p = await API.products.getById(id);
            if (!p) return;

            document.getElementById("modalTitle").textContent = t("prod.modalEdit");
            document.getElementById("prodId").value = p.id;
            document.getElementById("fName").value = p.product_name || p.name || "";
            document.getElementById("fBarcode").value = p.barcode || "";
            document.getElementById("fType").value = p.type || "phone";
            document.getElementById("fCost").value = p.import_price ?? p.cost ?? "";
            document.getElementById("fPrice").value = p.selling_price ?? p.price ?? "";
            document.getElementById("fCategory").value = p.category_id || p.category || "";
            document.getElementById("fStock").value = p.stock_quantity ?? p.stock ?? "";

            // Clear image input and preview
            const imageInput = document.getElementById("fImage");
            const imagePreview = document.getElementById("imagePreview");
            if (imageInput) imageInput.value = "";
            if (imagePreview) imagePreview.style.display = "none";

            bootstrap.Modal.getOrCreateInstance(document.getElementById("productModal")).show();
        } catch (err) {
            console.error('Edit error:', err);
            toast(err.message || t("toast.error"), "error");
        }
    }

    async function openView(id) {
        try {
            const p = await API.products.getById(id);
            if (!p) return;

            const cost = p.import_price ?? p.cost ?? 0;
            const price = p.selling_price ?? p.price ?? 0;
            const stock = p.stock_quantity ?? p.stock ?? 0;
            const name = p.product_name || p.name;
            const cat = p.category_name || p.category || "-";

            const profit = (Number(price) - Number(cost));
            const createdAt = p.created_at ? p.created_at.substring(0, 10) : "-";
            const viewBody = document.getElementById("viewBody");
            viewBody.innerHTML = `
        <div class="ps-view__hero">
          <div class="ps-view__image" style="text-align: center; margin-bottom: 1.5rem;">
            <img src="${getProductImage(p.image)}" 
                 alt="${name}" 
                 onerror="this.src='assets/images/product-placeholder.svg'"
                 style="width: 240px; height: 240px; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
          </div>
          <div class="ps-view__name">${name}</div>
          <div class="ps-view__barcode">${p.barcode || "-"}</div>
        </div>
        <div class="ps-view__card">
          <div class="ps-view__grid">
            <div class="ps-view__label" data-i18n="view.category">${t("view.category")}</div>
            <div class="ps-view__value">${cat}</div>
            <div class="ps-view__label" data-i18n="view.type">${t("view.type")}</div>
            <div class="ps-view__value">${p.type || "-"}</div>
            <div class="ps-view__label admin-only" data-i18n="view.cost">${t("view.cost")}</div>
            <div class="ps-view__value admin-only">${fmtVND(cost)}</div>
            <div class="ps-view__label" data-i18n="view.price">${t("view.price")}</div>
            <div class="ps-view__value">${fmtVND(price)}</div>
            <div class="ps-view__label" data-i18n="view.stock">${t("view.stock")}</div>
            <div class="ps-view__value">${stock}</div>
            <div class="ps-view__label" data-i18n="view.createdAt">${t("view.createdAt")}</div>
            <div class="ps-view__value">${createdAt}</div>
          </div>
          <div class="ps-view__divider admin-only"></div>
          <div class="ps-view__profit admin-only">
            <div class="ps-view__label" data-i18n="view.profit">${t("view.profit")}</div>
            <div class="v">${fmtVND(profit)}</div>
          </div>
        </div>
      `;

            bootstrap.Modal.getOrCreateInstance(document.getElementById("viewModal")).show();
        } catch (err) {
            console.error('View error:', err);
            toast(err.message || t("toast.error"), "error");
        }
    }

    function parseNumber(s) {
        return Number(String(s || "").replace(/[^\d]/g, "")) || 0;
    }

    async function save() {
        try {
            const id = document.getElementById("prodId").value.trim();
            const product_name = document.getElementById("fName").value.trim();
            const barcode = document.getElementById("fBarcode").value.trim();
            const type = document.getElementById("fType").value;
            const category_id = Number(document.getElementById("fCategory").value);
            const import_price = parseNumber(document.getElementById("fCost").value);
            const selling_price = parseNumber(document.getElementById("fPrice").value);
            const stock_quantity = parseNumber(document.getElementById("fStock").value);
            const imageFile = document.getElementById("fImage").files[0];

            if (!product_name || !barcode || !category_id || import_price <= 0 || selling_price <= 0) {
                toast(t("toast.invalid"), "error");
                return;
            }

            // Kiểm tra ảnh bắt buộc khi tạo mới
            if (!id && !imageFile) {
                toast("Ảnh sản phẩm là bắt buộc", "error");
                return;
            }

            if (imageFile) {
                const imgErr = validateImageFile(imageFile);
                if (imgErr) {
                    toast(imgErr, "error");
                    return;
                }
            }

            // Sử dụng FormData nếu có file upload
            if (imageFile || id) {
                const formData = new FormData();
                formData.append('product_name', product_name);
                formData.append('barcode', barcode);
                formData.append('type', type);
                formData.append('category_id', category_id);
                formData.append('import_price', import_price);
                formData.append('selling_price', selling_price);
                formData.append('stock_quantity', stock_quantity);
                
                // Thêm ảnh nếu có
                if (imageFile) {
                    formData.append('image', imageFile);
                }

                if (id) {
                    await API.products.update(id, formData);
                } else {
                    await API.products.create(formData);
                }
            } else {
                // Fallback cho trường hợp không có file (không nên xảy ra)
                const data = { product_name, barcode, type, category_id, import_price, selling_price, stock_quantity };
                if (id) {
                    await API.products.update(id, data);
                } else {
                    await API.products.create(data);
                }
            }

            render();
            toast(t("toast.saved"));
            bootstrap.Modal.getInstance(document.getElementById("productModal"))?.hide();
        } catch (err) {
            console.error('Save error:', err);
            toast(err.message || t("toast.error"), "error");
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
            toast(err.message || t("toast.error"), "error");
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

    async function loadCategories() {
        try {
            const response = await API.categories.getAll();
            // API trả về { items: [...], pagination: {...} }
            const data = response.items || response || [];
            
            const fCat = document.getElementById("fCategory");
            if (!fCat) return;
            fCat.innerHTML = `<option value="" disabled selected>Chọn danh mục</option>` +
                data.map(c => `<option value="${c.id}">${c.name || c.category_name}</option>`).join("");
        } catch(err) {
            console.error('Load categories error', err);
        }
    }

    function init() {
        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        const savedLang = localStorage.getItem(KEY_LANG) || "vi";
        applyLang(savedLang);
        setTheme(savedTheme);

        loadCategories();
        initLayout();

        document.getElementById("searchInput")?.addEventListener("input", render);
        document.getElementById("btnAdd")?.addEventListener("click", openAdd);
        document.getElementById("btnSave")?.addEventListener("click", save);
        document.getElementById("btnConfirmDelete")?.addEventListener("click", confirmDelete);
        
        // Image preview
        document.getElementById("fImage")?.addEventListener("change", (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById("imagePreview");
            const previewImg = document.getElementById("previewImg");
            
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

