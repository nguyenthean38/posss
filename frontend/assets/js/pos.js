/**
 * POS Module - Real API Integration
 */
import { api } from './api.js?v=5';
import { requireAuth, getCurrentUser } from './auth.js';

(() => {
    // ===== CONSTANTS =====
    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";

    // ===== STATE =====
    let products = [];
    let cart = { Items: [], TotalAmount: 0 };

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
            "nav.profile": "Hồ sơ",
            "nav.logout": "Đăng xuất",
            "nav.collapse": "Thu gọn",
            "cart.title": "Giỏ hàng",
            "cart.clear": "Xóa giỏ",
            "cart.total": "Tổng cộng",
            "cart.checkout": "Thanh toán",
            "pos.searchPh": "Tìm sản phẩm theo tên hoặc mã vạch...",
            "empty.title": "Giỏ hàng trống",
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
            "toast.error": "Có lỗi xảy ra",
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
            "empty.title": "Cart is empty",
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
            "toast.error": "An error occurred",
            "stock": "Stock",
        }
    };

    // ===== HELPERS =====
    const fmtVND = (n) => {
        const v = Number(n || 0);
        return v.toLocaleString("vi-VN") + " ₫";
    };

    const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
    const t = (key) => (i18n[getLang()]?.[key] || i18n.en[key] || key);

    function toast(msg) {
        const el = document.getElementById("toast");
        const text = document.getElementById("toastText");
        if (!el || !text) return;
        text.textContent = msg;
        el.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => el.classList.remove("show"), 1600);
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

    function iconByType(p) {
        const name = (p.product_name || "").toLowerCase();
        if (name.includes("iphone") || name.includes("samsung") || name.includes("phone")) return "bi-phone";
        if (name.includes("airpods") || name.includes("buds") || name.includes("tai nghe")) return "bi-headphones";
        if (name.includes("ốp") || name.includes("case")) return "bi-shield-check";
        if (name.includes("sạc") || name.includes("charger")) return "bi-plug";
        if (name.includes("cáp") || name.includes("cable")) return "bi-link-45deg";
        return "bi-box-seam";
    }

    // ===== API CALLS =====
    async function loadProducts() {
        try {
            const result = await api.getProducts({ limit: 100 });
            products = result.items || [];
            renderProducts("");
        } catch (error) {
            console.error('Load products error:', error);
            toast(t("toast.error"));
        }
    }

    async function initCart() {
        try {
            const result = await api.posInitSession();
            cart = result;
            renderCart();
        } catch (error) {
            console.error('Init cart error:', error);
        }
    }

    async function addToCart(barcode) {
        try {
            const result = await api.posAddToCart({
                Barcode: barcode,
                Quantity: 1
            });
            cart = result;
            renderCart();
            toast(t("toast.added"));
        } catch (error) {
            console.error('Add to cart error:', error);
            toast(error.message || t("toast.error"));
        }
    }

    async function updateCartItem(productId, newQuantity) {
        try {
            const result = await api.posUpdateItem({
                ProductId: productId,
                NewQuantity: newQuantity
            });
            cart = result;
            renderCart();
        } catch (error) {
            console.error('Update cart error:', error);
            toast(t("toast.error"));
        }
    }

    async function removeFromCart(productId) {
        try {
            const result = await api.posRemoveItem(productId);
            cart = result;
            renderCart();
            toast(t("toast.removed"));
        } catch (error) {
            console.error('Remove from cart error:', error);
            toast(t("toast.error"));
        }
    }

    async function clearCart() {
        try {
            await initCart();
            toast(t("toast.cleared"));
        } catch (error) {
            console.error('Clear cart error:', error);
        }
    }

    async function checkout(data) {
        try {
            const result = await api.posCheckout(data);
            
            // Open invoice in new tab
            if (result.PdfUrl) {
                window.open(result.PdfUrl, '_blank');
            }
            
            // Reset cart
            await initCart();
            toast(t("toast.paid"));
            
            // Close modal
            const modalEl = document.getElementById("payModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal?.hide();
            
            // Reset form
            document.getElementById("payPhone").value = "";
            document.getElementById("payName").value = "";
            document.getElementById("payCash").value = "";
            updatePayState();
            
        } catch (error) {
            console.error('Checkout error:', error);
            toast(error.message || t("toast.error"));
        }
    }

    // ===== RENDER =====
    function renderProducts(filterText = "") {
        const grid = document.getElementById("productGrid");
        if (!grid) return;

        const q = (filterText || "").trim().toLowerCase();
        const list = products.filter(p =>
            !q ||
            (p.product_name || "").toLowerCase().includes(q) ||
            (p.barcode || "").toLowerCase().includes(q)
        );

        grid.innerHTML = list.map(p => `
            <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                <div class="ps-card ps-product" data-barcode="${p.barcode}" role="button" tabindex="0">
                    <div class="ps-product__icon">
                        <i class="bi ${iconByType(p)}"></i>
                    </div>
                    <div class="ps-product__meta">
                        <div class="ps-product__name" title="${p.product_name}">${p.product_name}</div>
                        <div class="ps-product__sku">${p.barcode}</div>
                        <div class="ps-product__price">${fmtVND(p.selling_price)}</div>
                        <div class="ps-product__stock">${t("stock")}: ${p.stock_quantity || 0}</div>
                    </div>
                </div>
            </div>
        `).join("");

        grid.querySelectorAll(".ps-product").forEach(card => {
            const barcode = card.dataset.barcode;
            card.addEventListener("click", () => addToCart(barcode));
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") addToCart(barcode);
            });
        });
    }

    function renderCart() {
        const body = document.getElementById("cartBody");
        const countEl = document.getElementById("cartCount");
        const totalEl = document.getElementById("cartTotal");
        const btnCheckout = document.getElementById("btnCheckout");

        const items = cart.Items || [];
        const total = cart.TotalAmount || 0;
        const count = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

        if (countEl) countEl.textContent = `(${count})`;
        if (totalEl) totalEl.textContent = fmtVND(total);
        if (btnCheckout) btnCheckout.disabled = items.length === 0;

        // Update modal total
        const payTotal = document.getElementById("payTotal");
        if (payTotal) payTotal.textContent = fmtVND(total);

        if (!body) return;

        if (items.length === 0) {
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

        body.innerHTML = items.map(item => `
            <div class="ps-cartItem" data-id="${item.id}">
                <div class="ps-cartItem__left">
                    <div class="ps-cartItem__name" title="${item.product_name}">${item.product_name}</div>
                    <div class="ps-cartItem__price">${fmtVND(item.selling_price)}</div>
                </div>
                <div class="ps-cartItem__right">
                    <button class="ps-qtyBtn" data-act="dec" aria-label="dec"><i class="bi bi-dash"></i></button>
                    <div class="ps-qtyNum">${item.quantity}</div>
                    <button class="ps-qtyBtn" data-act="inc" aria-label="inc"><i class="bi bi-plus"></i></button>
                    <button class="ps-delBtn" data-act="rm" aria-label="remove"><i class="bi bi-trash3"></i></button>
                </div>
            </div>
        `).join("");

        body.querySelectorAll(".ps-cartItem").forEach(row => {
            const id = row.dataset.id;
            const item = items.find(i => i.id == id);
            if (!item) return;

            row.querySelector('[data-act="inc"]').addEventListener("click", () => {
                updateCartItem(id, item.quantity + 1);
            });
            row.querySelector('[data-act="dec"]').addEventListener("click", () => {
                if (item.quantity > 1) {
                    updateCartItem(id, item.quantity - 1);
                } else {
                    removeFromCart(id);
                }
            });
            row.querySelector('[data-act="rm"]').addEventListener("click", () => {
                removeFromCart(id);
            });
        });
    }

    // ===== PAYMENT =====
    function updatePayState() {
        const total = cart.TotalAmount || 0;
        const cashInput = document.getElementById("payCash");
        const cash = Number((cashInput?.value || "0").replace(/[^\d]/g, "")) || 0;
        const change = Math.max(0, cash - total);

        const changeEl = document.getElementById("payChange");
        if (changeEl) changeEl.textContent = fmtVND(change);

        const btn = document.getElementById("btnCompletePay");
        if (btn) btn.disabled = (total <= 0) || (cash < total);
    }

    function completePay() {
        const phone = (document.getElementById("payPhone")?.value || "").trim();
        const name = (document.getElementById("payName")?.value || "").trim();
        const cashInput = document.getElementById("payCash");
        const cash = Number((cashInput?.value || "0").replace(/[^\d]/g, "")) || 0;

        checkout({
            Phone: phone,
            FullName: name,
            CustomerPay: cash
        });
    }

    // ===== LAYOUT CONTROLS =====
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

    // ===== INIT =====
    async function init() {
        // Check auth
        try {
            await requireAuth();
        } catch (error) {
            return;
        }

        // Load preferences
        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        const savedLang = localStorage.getItem(KEY_LANG) || "vi";
        applyLang(savedLang);
        setTheme(savedTheme);

        initLayoutControls();

        // Search
        const search = document.getElementById("searchInput");
        search?.addEventListener("input", (e) => renderProducts(e.target.value));

        // Cart buttons
        document.getElementById("btnClearCart")?.addEventListener("click", clearCart);

        // Payment modal events
        document.getElementById("payCash")?.addEventListener("input", updatePayState);
        document.getElementById("payModal")?.addEventListener("shown.bs.modal", () => {
            document.getElementById("payTotal").textContent = fmtVND(cart.TotalAmount || 0);
            updatePayState();
        });
        document.getElementById("btnCompletePay")?.addEventListener("click", completePay);

        // Load data
        await initCart();
        await loadProducts();
    }

    init();
})();

