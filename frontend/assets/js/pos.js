(() => {
    // ===== storage keys (same as dashboard) =====
    const KEY_THEME = "ps_theme"; // "dark" | "light"
    const KEY_LANG = "ps_lang";   // "vi" | "en"
    const KEY_CART = "ps_cart";
    const KEY_ORDERS = "ps_orders";

    // ===== i18n =====
    const i18n = {
        vi: {
            "page.pos": "Bán hàng",
            "role.admin": "Quản trị viên",
            "nav.dashboard": "Tổng quan",
            "nav.pos": "Bán hàng",
            "nav.products": "Sản phẩm",
            "nav.categories": "Danh mục",
            "nav.employees": "Nhân viên",
            "nav.customers": "Khách hàng",
            "nav.reports": "Báo cáo",
            "nav.profile": "Hồ sơ cá nhân",
            "nav.logout": "Đăng xuất",
            "nav.collapse": "Thu gọn",

            "cart.title": "Giỏ hàng",
            "cart.clear": "Xóa giỏ",
            "cart.total": "Tổng cộng",
            "cart.checkout": "Thanh toán",

            "pos.searchPh": "Tìm sản phẩm theo tên hoặc mã vạch...",

            "empty.title": "Không có dữ liệu",
            "pay.title": "Thanh toán",
            "pay.phone": "Số điện thoại",
            "pay.name": "Tên khách hàng",
            "pay.cash": "Tiền khách đưa",
            "pay.change": "Tiền thừa",
            "pay.complete": "Hoàn tất thanh toán",

            "toast.added": "Đã thêm vào giỏ",
            "toast.paid": "Thanh toán thành công",
            "toast.cleared": "Đã xóa giỏ",
            "toast.removed": "Đã xóa sản phẩm",
            "toast.stock": "Không đủ tồn kho",
            "stock": "Tồn kho",
        },
        en: {
            "page.pos": "Point of Sale",
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

            "cart.title": "Cart",
            "cart.clear": "Clear",
            "cart.total": "Total",
            "cart.checkout": "Checkout",

            "pos.searchPh": "Search by name or barcode...",

            "empty.title": "No data",
            "pay.title": "Payment",
            "pay.phone": "Phone number",
            "pay.name": "Customer name",
            "pay.cash": "Cash given",
            "pay.change": "Change",
            "pay.complete": "Complete payment",

            "toast.added": "Added to cart",
            "toast.paid": "Payment success",
            "toast.cleared": "Cart cleared",
            "toast.removed": "Item removed",
            "toast.stock": "Not enough stock",
            "stock": "Stock",
        }
    };

    // ===== helpers =====

    const fmtVND = (n) => {
        const v = Number(n || 0);
        return v.toLocaleString("vi-VN") + " ₫";
    };

    const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
    const t = (key) => (i18n[getLang()]?.[key] || i18n.en[key] || key);

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

        // update tooltips text = nav text
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
        const text = document.getElementById("toastText");
        if (!el || !text) return;
        text.textContent = msg;
        el.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => el.classList.remove("show"), 1600);
    }
    function iconByType(p) {
        const type = (p.type || "").toLowerCase();

        // map theo type cố định
        const MAP = {
            phone: "bi-phone",
            earbuds: "bi-headphones",
            case: "bi-shield-check",
            charger: "bi-plug",
            cable: "bi-link-45deg",
            powerbank: "bi-battery-charging",
            adapter: "bi-usb-c",
            watch: "bi-smartwatch",
            sim: "bi-sim",
        };

        if (MAP[type]) return MAP[type];

        // fallback: đoán theo tên (phòng khi chưa gán type)
        const n = (p.name || "").toLowerCase();
        if (n.includes("ốp") || n.includes("case")) return MAP.case;
        if (n.includes("cáp") || n.includes("cable") || n.includes("lightning") || n.includes("type c") || n.includes("usb")) return MAP.cable;
        if (n.includes("sạc") || n.includes("charger") || n.includes("adapter")) return MAP.charger;
        if (n.includes("tai nghe") || n.includes("airpods") || n.includes("buds") || n.includes("headphone")) return MAP.earbuds;
        if (n.includes("pin dự phòng") || n.includes("power bank")) return MAP.powerbank;

        // default
        return "bi-box-seam";
    }
    // ===== mock products =====
    const PRODUCTS = [
        { id: "P001", name: "iPhone 15 Pro Max 256GB", barcode: "1234567890", price: 32990000, stock: 15, type: "phone" },
        { id: "P002", name: "Samsung Galaxy S24 Ultra", barcode: "1234567891", price: 28990000, stock: 8, type: "phone" },
        { id: "P003", name: "AirPods Pro 2", barcode: "1234567892", price: 5990000, stock: 25, type: "earbuds" },
        { id: "P004", name: "Ốp lưng iPhone 15", barcode: "1234567893", price: 299000, stock: 100, type: "case" },
        { id: "P005", name: "Sạc nhanh 20W", barcode: "1234567894", price: 450000, stock: 50, type: "charger" },
        { id: "P006", name: "Samsung Galaxy A55", barcode: "1234567895", price: 9990000, stock: 20, type: "phone" },
        { id: "P007", name: "Cáp Lightning", barcode: "1234567896", price: 199000, stock: 80, type: "cable" },
        { id: "P008", name: "Tai nghe Samsung Buds3", barcode: "1234567897", price: 3990000, stock: 12, type: "earbuds" },
    ];

    // ===== cart CRUD =====
    const loadCart = () => JSON.parse(localStorage.getItem(KEY_CART) || "[]");
    const saveCart = (cart) => localStorage.setItem(KEY_CART, JSON.stringify(cart));

    function cartAdd(productId) {
        const cart = loadCart();
        const p = PRODUCTS.find(x => x.id === productId);
        if (!p) return;

        const existing = cart.find(x => x.id === productId);
        const currentQty = existing?.qty || 0;
        if (currentQty + 1 > p.stock) {
            toast(t("toast.stock"));
            return;
        }

        if (existing) existing.qty += 1;
        else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });

        saveCart(cart);
        renderCart();
        toast(t("toast.added"));
    }

    function cartInc(productId) {
        const cart = loadCart();
        const p = PRODUCTS.find(x => x.id === productId);
        const item = cart.find(x => x.id === productId);
        if (!item || !p) return;

        if (item.qty + 1 > p.stock) { toast(t("toast.stock")); return; }
        item.qty += 1;
        saveCart(cart);
        renderCart();
    }

    function cartDec(productId) {
        const cart = loadCart();
        const item = cart.find(x => x.id === productId);
        if (!item) return;

        item.qty -= 1;
        if (item.qty <= 0) {
            const idx = cart.findIndex(x => x.id === productId);
            cart.splice(idx, 1);
        }
        saveCart(cart);
        renderCart();
    }

    function cartRemove(productId) {
        const cart = loadCart().filter(x => x.id !== productId);
        saveCart(cart);
        renderCart();
        toast(t("toast.removed"));
    }

    function cartClear() {
        saveCart([]);
        renderCart();
        toast(t("toast.cleared"));
    }

    const cartTotal = () => loadCart().reduce((s, x) => s + x.price * x.qty, 0);
    const cartCount = () => loadCart().reduce((s, x) => s + x.qty, 0);

    // ===== render products =====
    function renderProducts(filterText = "") {
        const grid = document.getElementById("productGrid");
        if (!grid) return;

        const q = (filterText || "").trim().toLowerCase();
        const list = PRODUCTS.filter(p =>
            !q ||
            p.name.toLowerCase().includes(q) ||
            p.barcode.toLowerCase().includes(q)
        );

        grid.innerHTML = list.map(p => `
  <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
    <div class="ps-card ps-product" data-id="${p.id}" role="button" tabindex="0">
      <div class="ps-product__icon">
        <i class="bi ${iconByType(p)}"></i>
      </div>

      <div class="ps-product__meta">
        <div class="ps-product__name" title="${p.name}">${p.name}</div>
        <div class="ps-product__sku">${p.barcode}</div>
        <div class="ps-product__price">${fmtVND(p.price)}</div>
        <div class="ps-product__stock">${t("stock")}: ${p.stock}</div>
      </div>
    </div>
  </div>
`).join("");

        grid.querySelectorAll(".ps-product").forEach(card => {
            card.addEventListener("click", () => cartAdd(card.dataset.id));
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") cartAdd(card.dataset.id);
            });
        });
    }

    // ===== render cart =====
    function renderCart() {
        const body = document.getElementById("cartBody");
        const countEl = document.getElementById("cartCount");
        const totalEl = document.getElementById("cartTotal");
        const btnCheckout = document.getElementById("btnCheckout");

        const cart = loadCart();
        const count = cartCount();
        const total = cartTotal();

        if (countEl) countEl.textContent = `(${count})`;
        if (totalEl) totalEl.textContent = fmtVND(total);
        if (btnCheckout) btnCheckout.disabled = cart.length === 0;

        // update modal totals
        const payTotal = document.getElementById("payTotal");
        if (payTotal) payTotal.textContent = fmtVND(total);

        if (!body) return;

        if (cart.length === 0) {
            body.innerHTML = `
        <div class="ps-cart__empty">
          <div>
            <i class="bi bi-cart3"></i>
            <div class="mt-2">${t("empty.title")}</div>
          </div>
        </div>
      `;
            return;
        }

        body.innerHTML = cart.map(item => `
      <div class="ps-cartItem" data-id="${item.id}">
        <div class="ps-cartItem__left">
          <div class="ps-cartItem__name" title="${item.name}">${item.name}</div>
          <div class="ps-cartItem__price">${fmtVND(item.price)}</div>
        </div>
        <div class="ps-cartItem__right">
          <button class="ps-qtyBtn" data-act="dec" aria-label="dec"><i class="bi bi-dash"></i></button>
          <div class="ps-qtyNum">${item.qty}</div>
          <button class="ps-qtyBtn" data-act="inc" aria-label="inc"><i class="bi bi-plus"></i></button>
          <button class="ps-delBtn" data-act="rm" aria-label="remove"><i class="bi bi-trash3"></i></button>
        </div>
      </div>
    `).join("");

        body.querySelectorAll(".ps-cartItem").forEach(row => {
            const id = row.dataset.id;
            row.querySelector('[data-act="inc"]').addEventListener("click", () => cartInc(id));
            row.querySelector('[data-act="dec"]').addEventListener("click", () => cartDec(id));
            row.querySelector('[data-act="rm"]').addEventListener("click", () => cartRemove(id));
        });
    }

    // ===== payment logic =====
    function updatePayState() {
        const total = cartTotal();
        const cash = Number((document.getElementById("payCash")?.value || "0").replace(/[^\d]/g, "")) || 0;
        const change = Math.max(0, cash - total);

        const changeEl = document.getElementById("payChange");
        if (changeEl) changeEl.textContent = fmtVND(change);

        const btn = document.getElementById("btnCompletePay");
        if (btn) btn.disabled = (total <= 0) || (cash < total);
    }

    function completePay() {
        const cart = loadCart();
        const total = cartTotal();
        if (cart.length === 0 || total <= 0) return;

        const phone = (document.getElementById("payPhone")?.value || "").trim();
        const name = (document.getElementById("payName")?.value || "").trim();
        const cash = Number((document.getElementById("payCash")?.value || "0").replace(/[^\d]/g, "")) || 0;

        const orders = JSON.parse(localStorage.getItem(KEY_ORDERS) || "[]");
        const order = {
            id: "ORD-" + String(Date.now()).slice(-6),
            createdAt: new Date().toISOString(),
            customer: { phone, name },
            items: cart,
            total,
            cash,
            change: cash - total,
        };
        orders.unshift(order);
        localStorage.setItem(KEY_ORDERS, JSON.stringify(orders));

        // clear cart
        saveCart([]);
        renderCart();

        // close modal
        const modalEl = document.getElementById("payModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal?.hide();

        // reset inputs
        document.getElementById("payCash").value = "";
        updatePayState();
        toast(t("toast.paid"));
    }

    // ===== sidebar + top controls =====
    function initLayoutControls() {
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

        // theme/lang
        document.getElementById("btnTheme")?.addEventListener("click", () => {
            const cur = document.body.getAttribute("data-theme") || "dark";
            setTheme(cur === "dark" ? "light" : "dark");
        });

        document.getElementById("btnLang")?.addEventListener("click", () => {
            const cur = getLang();
            const next = cur === "vi" ? "en" : "vi";
            applyLang(next);
            renderProducts(document.getElementById("searchInput")?.value || "");
            renderCart();
        });
    }

    // ===== init =====
    function init() {
        // load preferences
        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        const savedLang = localStorage.getItem(KEY_LANG) || "vi";
        applyLang(savedLang);
        setTheme(savedTheme);

        initLayoutControls();

        // search
        const search = document.getElementById("searchInput");
        search?.addEventListener("input", (e) => renderProducts(e.target.value));

        // cart buttons
        document.getElementById("btnClearCart")?.addEventListener("click", cartClear);

        // payment modal events
        document.getElementById("payCash")?.addEventListener("input", updatePayState);
        document.getElementById("payModal")?.addEventListener("shown.bs.modal", () => {
            document.getElementById("payTotal").textContent = fmtVND(cartTotal());
            updatePayState();
        });
        document.getElementById("btnCompletePay")?.addEventListener("click", completePay);

        // first render
        renderProducts("");
        renderCart();
        updatePayState();
    }

    init();
    // =========================
    // HARD FIX: Lock body on Bootstrap modal without layout shift
    // =========================
    (() => {
        const modalEl = document.getElementById("payModal");
        if (!modalEl) return;

        let scrollY = 0;

        modalEl.addEventListener("show.bs.modal", () => {
            scrollY = window.scrollY || document.documentElement.scrollTop || 0;

            // lock body without removing scrollbar
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = "0";
            document.body.style.right = "0";
            document.body.style.width = "100%";
        });

        modalEl.addEventListener("hidden.bs.modal", () => {
            // restore
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.width = "";

            window.scrollTo(0, scrollY);
        });
    })();
})();