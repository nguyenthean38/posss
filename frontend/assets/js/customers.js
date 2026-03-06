(() => {
    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";
    const KEY_CUSTOMERS = "ps_customers";
    const KEY_ORDERS = "ps_orders";

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

    // layout
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

    // data
    const loadCustomers = () => JSON.parse(localStorage.getItem(KEY_CUSTOMERS) || "[]");
    const saveCustomers = (arr) => localStorage.setItem(KEY_CUSTOMERS, JSON.stringify(arr));
    const loadOrders = () => JSON.parse(localStorage.getItem(KEY_ORDERS) || "[]");
    function normPhone(p) {
        return String(p || "").replace(/[^\d]/g, ""); // chỉ giữ số
    }

    function ensureMockOrders() {
        const orders = JSON.parse(localStorage.getItem(KEY_ORDERS) || "[]");
        const hasPhone = (phone) => orders.some(o => normPhone(o.customer?.phone) === normPhone(phone));

        const mock = [];

        // A
        if (!hasPhone("0901234567")) mock.push(
            { id: "ORD-101", createdAt: "2025-01-10T08:00:00.000Z", customer: { phone: "0901234567", name: "Nguyễn Văn A" }, items: [{ id: "P001", name: "iPhone 15 Pro Max", price: 32990000, qty: 1 }], total: 32990000, cash: 35000000, change: 2010000 },
            { id: "ORD-102", createdAt: "2025-01-22T08:00:00.000Z", customer: { phone: "0901234567", name: "Nguyễn Văn A" }, items: [{ id: "P003", name: "AirPods Pro 2", price: 5990000, qty: 1 }, { id: "P007", name: "Cáp Lightning", price: 199000, qty: 1 }], total: 6189000, cash: 6200000, change: 11000 },
        );

        // B
        if (!hasPhone("0912345678")) mock.push(
            { id: "ORD-201", createdAt: "2025-01-15T08:00:00.000Z", customer: { phone: "0912345678", name: "Trần Thị B" }, items: [{ id: "P001", name: "iPhone", price: 32990000, qty: 1 }, { id: "P004", name: "Ốp lưng", price: 299000, qty: 1 }], total: 33289000, cash: 35000000, change: 1711000 },
            { id: "ORD-205", createdAt: "2025-01-20T08:00:00.000Z", customer: { phone: "0912345678", name: "Trần Thị B" }, items: [{ id: "P003", name: "AirPods Pro 2", price: 5990000, qty: 1 }], total: 5990000, cash: 6000000, change: 10000 },
            { id: "ORD-209", createdAt: "2025-02-01T08:00:00.000Z", customer: { phone: "0912345678", name: "Trần Thị B" }, items: [{ id: "P007", name: "Cáp", price: 199000, qty: 1 }, { id: "P004", name: "Ốp lưng", price: 299000, qty: 1 }], total: 498000, cash: 500000, change: 2000 },
        );

        // C
        if (!hasPhone("0923456789")) mock.push(
            { id: "ORD-301", createdAt: "2025-01-05T08:00:00.000Z", customer: { phone: "0923456789", name: "Lê Văn C" }, items: [{ id: "P006", name: "Samsung Galaxy A55", price: 9990000, qty: 1 }], total: 9990000, cash: 10000000, change: 10000 },
            { id: "ORD-302", createdAt: "2025-01-18T08:00:00.000Z", customer: { phone: "0923456789", name: "Lê Văn C" }, items: [{ id: "P005", name: "Sạc nhanh 20W", price: 450000, qty: 2 }, { id: "P004", name: "Ốp lưng", price: 299000, qty: 2 }], total: 1498000, cash: 1500000, change: 2000 },
        );

        // D
        if (!hasPhone("0934567890")) mock.push(
            { id: "ORD-401", createdAt: "2025-02-10T08:00:00.000Z", customer: { phone: "0934567890", name: "Phạm Thị D" }, items: [{ id: "P002", name: "Samsung Galaxy S24 Ultra", price: 28990000, qty: 1 }], total: 28990000, cash: 30000000, change: 1010000 },
        );

        if (mock.length) {
            localStorage.setItem(KEY_ORDERS, JSON.stringify([...mock, ...orders]));
        }
    }
    function seedIfEmpty() {
        if (localStorage.getItem(KEY_CUSTOMERS)) return;
        const seed = [
            { id: "C001", name: "Nguyễn Văn A", phone: "0901234567", address: "123 Nguyễn Huệ, Q1, HCM" },
            { id: "C002", name: "Trần Thị B", phone: "0912345678", address: "456 Lê Lợi, Q3, HCM" },
            { id: "C003", name: "Lê Văn C", phone: "0923456789", address: "789 Trần Hưng Đạo, Q5, HCM" },
            { id: "C004", name: "Phạm Thị D", phone: "0934567890", address: "321 Hai Bà Trưng, Q1, HCM" },
        ];
        saveCustomers(seed);

        // nếu chưa có orders thì seed để history đẹp (mock)
        const existingOrders = localStorage.getItem(KEY_ORDERS);
        if (!existingOrders) {
            const o = [
                // Nguyễn Văn A
                { id: "ORD-101", createdAt: "2025-01-10T08:00:00.000Z", customer: { phone: "0901234567", name: "Nguyễn Văn A" }, items: [{ id: "P001", name: "iPhone 15 Pro Max", price: 32990000, qty: 1 }], total: 32990000, cash: 35000000, change: 2010000 },
                { id: "ORD-102", createdAt: "2025-01-22T08:00:00.000Z", customer: { phone: "0901234567", name: "Nguyễn Văn A" }, items: [{ id: "P003", name: "AirPods Pro 2", price: 5990000, qty: 1 }, { id: "P007", name: "Cáp Lightning", price: 199000, qty: 1 }], total: 6189000, cash: 6200000, change: 11000 },

                // Trần Thị B
                { id: "ORD-201", createdAt: "2025-01-15T08:00:00.000Z", customer: { phone: "0912345678", name: "Trần Thị B" }, items: [{ id: "P001", name: "iPhone", price: 32990000, qty: 1 }, { id: "P004", name: "Ốp lưng", price: 299000, qty: 1 }], total: 33289000, cash: 35000000, change: 1711000 },
                { id: "ORD-205", createdAt: "2025-01-20T08:00:00.000Z", customer: { phone: "0912345678", name: "Trần Thị B" }, items: [{ id: "P003", name: "AirPods Pro 2", price: 5990000, qty: 1 }], total: 5990000, cash: 6000000, change: 10000 },
                { id: "ORD-209", createdAt: "2025-02-01T08:00:00.000Z", customer: { phone: "0912345678", name: "Trần Thị B" }, items: [{ id: "P007", name: "Cáp", price: 199000, qty: 1 }, { id: "P004", name: "Ốp lưng", price: 299000, qty: 1 }], total: 498000, cash: 500000, change: 2000 },

                // Lê Văn C
                { id: "ORD-301", createdAt: "2025-01-05T08:00:00.000Z", customer: { phone: "0923456789", name: "Lê Văn C" }, items: [{ id: "P006", name: "Samsung Galaxy A55", price: 9990000, qty: 1 }], total: 9990000, cash: 10000000, change: 10000 },
                { id: "ORD-302", createdAt: "2025-01-18T08:00:00.000Z", customer: { phone: "0923456789", name: "Lê Văn C" }, items: [{ id: "P005", name: "Sạc nhanh 20W", price: 450000, qty: 2 }, { id: "P004", name: "Ốp lưng", price: 299000, qty: 2 }], total: 1498000, cash: 1500000, change: 2000 },

                // Phạm Thị D
                { id: "ORD-401", createdAt: "2025-02-10T08:00:00.000Z", customer: { phone: "0934567890", name: "Phạm Thị D" }, items: [{ id: "P002", name: "Samsung Galaxy S24 Ultra", price: 28990000, qty: 1 }], total: 28990000, cash: 30000000, change: 1010000 },
            ];

            localStorage.setItem(KEY_ORDERS, JSON.stringify(o));
        }
    }
    function statsForCustomer(phone) {
        const p = normPhone(phone);
        const orders = loadOrders().filter(o => normPhone(o.customer?.phone) === p);
        const count = orders.length;
        const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
        return { count, revenue, orders };
    }
    // function statsForCustomer(phone) {
    //     const orders = loadOrders().filter(o => (o.customer?.phone || "") === (phone || ""));
    //     const count = orders.length;
    //     const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    //     return { count, revenue, orders };
    // }

    function vip(revenue) {
        return revenue >= 50000000; // >= 50m -> VIP
    }

    function sortList(list) {
        const mode = document.getElementById("sortSelect")?.value || "rev_desc";
        const mapped = list.map(c => {
            const st = statsForCustomer(c.phone);
            return { ...c, _count: st.count, _rev: st.revenue };
        });

        const cmp = {
            rev_desc: (a, b) => b._rev - a._rev,
            rev_asc: (a, b) => a._rev - b._rev,
            ord_desc: (a, b) => b._count - a._count,
            ord_asc: (a, b) => a._count - b._count,
            name_asc: (a, b) => a.name.localeCompare(b.name),
        }[mode];

        return mapped.sort(cmp || ((a, b) => b._rev - a._rev));
    }

    // render
    function render() {
        const q = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
        const grid = document.getElementById("grid");
        const countEl = document.getElementById("cusCount");

        let list = loadCustomers().filter(c =>
            !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.address || "").toLowerCase().includes(q)
        );

        list = sortList(list);

        if (countEl) countEl.textContent = `(${list.length})`;
        if (!grid) return;

        grid.innerHTML = list.map(c => `
      <div class="col-12 col-xl-6">
        <div class="ps-card ps-cusCard" data-id="${c.id}">
          <div>
            <div class="ps-cusTop">
              <div class="ps-cusAvatar">${initials(c.name)}</div>
              <div class="ps-cusMeta">
                <div class="d-flex align-items-center">
                  <div class="ps-cusName">${c.name}</div>
                  ${vip(c._rev) ? `<span class="ps-rank vip ms-2">${t("rank.vip")}</span>` : ""}
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
              <div class="v">${c._count}</div>
            </div>

            <div class="ps-cusStat ps-cusRevenue">
              <div>${t("cus.revenue")}</div>
              <div class="v">${fmtVND(c._rev)}</div>
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
    }

    // CRUD
    function openAdd() {
        document.getElementById("cusModalTitle").textContent = t("cus.modalAdd");
        document.getElementById("cusId").value = "";
        document.getElementById("fName").value = "";
        document.getElementById("fPhone").value = "";
        document.getElementById("fAddress").value = "";
    }

    function openEdit(id) {
        const c = loadCustomers().find(x => x.id === id);
        if (!c) return;
        document.getElementById("cusModalTitle").textContent = t("cus.modalEdit");
        document.getElementById("cusId").value = c.id;
        document.getElementById("fName").value = c.name || "";
        document.getElementById("fPhone").value = c.phone || "";
        document.getElementById("fAddress").value = c.address || "";
        bootstrap.Modal.getOrCreateInstance(document.getElementById("cusModal")).show();
    }

    function save() {
        const id = document.getElementById("cusId").value.trim();
        const name = (document.getElementById("fName").value || "").trim();
        const phone = (document.getElementById("fPhone").value || "").trim();
        const address = (document.getElementById("fAddress").value || "").trim();

        if (!name || !phone) {
            toast(t("toast.invalid"));
            return;
        }

        const arr = loadCustomers();
        if (id) {
            const c = arr.find(x => x.id === id);
            if (!c) return;
            Object.assign(c, { name, phone, address });
        } else {
            const newId = "CU" + String(Date.now()).slice(-5);
            arr.unshift({ id: newId, name, phone, address });
        }

        saveCustomers(arr);
        render();
        toast(t("toast.saved"));
        bootstrap.Modal.getInstance(document.getElementById("cusModal"))?.hide();
    }

    function openDelete(id) {
        const c = loadCustomers().find(x => x.id === id);
        if (!c) return;
        pendingDeleteId = id;
        document.getElementById("deleteText").textContent = `${t("confirm.deleteText")} (${c.name})`;
        bootstrap.Modal.getOrCreateInstance(document.getElementById("deleteModal")).show();
    }

    function confirmDelete() {
        if (!pendingDeleteId) return;
        saveCustomers(loadCustomers().filter(x => x.id !== pendingDeleteId));
        pendingDeleteId = null;
        render();
        toast(t("toast.deleted"));
        bootstrap.Modal.getInstance(document.getElementById("deleteModal"))?.hide();
    }

    // History modal
    function dateOnly(iso) {
        if (!iso) return "-";
        const d = new Date(iso);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    function openHistory(id) {
        const c = loadCustomers().find(x => x.id === id);
        if (!c) return;

        const st = statsForCustomer(c.phone);
        const histBody = document.getElementById("histBody");

        histBody.innerHTML = `
      <div class="ps-histHeader">
        <div class="name">${c.name}</div>
        <div class="sub">
          <span><i class="bi bi-telephone" style="color:var(--muted)"></i> ${c.phone}</span>
          <span><i class="bi bi-geo-alt" style="color:var(--muted)"></i> ${c.address || "-"}</span>
        </div>
        <div class="sum">
          <span>${t("hist.totalOrders")}: <b>${st.count}</b></span>
          <span>${t("hist.totalSum")}: <b>${fmtVND(st.revenue)}</b></span>
        </div>
      </div>

      <div class="ps-histList">
        ${st.orders.length
                ? st.orders.map(o => `
                <div class="ps-histItem">
                  <div class="left">
                    <div class="code">${o.id}</div>
                    <div class="date">${dateOnly(o.createdAt)}</div>
                  </div>
                  <div class="right">
                    <div class="money">${fmtVND(o.total)}</div>
                    <div class="count">${(o.items?.reduce((s, it) => s + Number(it.qty || 0), 0) || 0)} ${getLang() === "vi" ? "sản phẩm" : "items"}</div>
                  </div>
                </div>
              `).join("")
                : `<div class="ps-histItem"><div class="left" style="color:var(--muted);font-weight:800;">${getLang() === "vi" ? "Chưa có đơn hàng" : "No orders yet"}</div></div>`
            }
      </div>
    `;

        bootstrap.Modal.getOrCreateInstance(document.getElementById("histModal")).show();
    }

    function init() {
        seedIfEmpty();
        ensureMockOrders();
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