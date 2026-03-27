/**
 * POS Module - Real API Integration
 */
import { api } from './api.js?v=7';
import { requireAuth, getCurrentUser, getUser } from './auth.js';

(async () => {
    // ===== CONSTANTS =====
    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";
    /** Đồng bộ với LoyaltyPoints::VND_PER_POINT */
    const VND_PER_POINT = 100000;

    // ===== STATE =====
    let products = [];
    let cart = { Items: [], TotalAmount: 0 };
    /** Danh sách phiếu từ API loyalty-summary (để tính giảm) */
    let loyaltyVouchersList = [];

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
            "nav.shifts": "Điểm danh",
            "nav.activity": "Nhật ký",
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
            "pay.earnLoyalty": "Tích điểm đơn này",
            "pay.earnYes": "Có",
            "pay.earnNo": "Không",
            "pay.voucher": "Phiếu giảm giá",
            "pay.voucherNone": "— Không dùng phiếu —",
            "pay.voucherDiscount": "Giảm phiếu",
            "pay.subtotal": "Tạm tính giỏ",
            "pay.payable": "Thanh toán",
            "loyalty.pointsPreview": "Dự kiến +{pts} điểm (theo tổng sau giảm nếu có phiếu).",
            "loyalty.pointsPreviewNone": "Đơn chưa đủ 1 điểm (100.000 ₫ / điểm).",
            "toast.added": "Đã thêm vào giỏ",
            "toast.paid": "Thanh toán thành công",
            "toast.cleared": "Đã xóa giỏ",
            "toast.removed": "Đã xóa sản phẩm",
            "toast.stock": "Không đủ tồn kho",
            "toast.error": "Có lỗi xảy ra",
            "toast.paidLoyalty": "Thanh toán thành công. +{pts} điểm — Số dư: {bal}",
            "loyalty.hintBalance": "Số dư điểm hiện tại: {bal}",
            "loyalty.hintNew": "Khách mới — nhập tên nếu đủ; có thể chỉ SĐT (sẽ lưu tên mặc định).",
            "stock": "Tồn kho",
            "shift.in": "Vào ca",
            "shift.out": "Ra ca",
            "shift.none": "Chưa chấm vào ca hôm nay ({date}).",
            "shift.open": "Đang trong ca — vào lúc {time}",
            "shift.done": "Đã hoàn thành ca — ra lúc {time}",
            "shift.loadErr": "Không tải được trạng thái ca.",
            "shift.toastIn": "Đã chấm vào ca.",
            "shift.toastOut": "Đã chấm ra ca.",
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
            "nav.shifts": "Shifts",
            "nav.activity": "Activity",
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
            "pay.earnLoyalty": "Earn points this order",
            "pay.earnYes": "Yes",
            "pay.earnNo": "No",
            "pay.voucher": "Voucher",
            "pay.voucherNone": "— No voucher —",
            "pay.voucherDiscount": "Voucher discount",
            "pay.subtotal": "Cart subtotal",
            "pay.payable": "Payable",
            "loyalty.pointsPreview": "Estimated +{pts} pts (on total after voucher if any).",
            "loyalty.pointsPreviewNone": "Below 1 point threshold (100,000 ₫ / point).",
            "toast.added": "Added to cart",
            "toast.paid": "Payment success",
            "toast.cleared": "Cart cleared",
            "toast.removed": "Item removed",
            "toast.stock": "Not enough stock",
            "toast.error": "An error occurred",
            "toast.paidLoyalty": "Payment successful. +{pts} pts — Balance: {bal}",
            "loyalty.hintBalance": "Current points balance: {bal}",
            "loyalty.hintNew": "New customer — add name if needed; phone alone is OK.",
            "stock": "Stock",
            "shift.in": "Clock in",
            "shift.out": "Clock out",
            "shift.none": "Not clocked in today ({date}).",
            "shift.open": "On shift — clocked in at {time}",
            "shift.done": "Shift completed — clocked out at {time}",
            "shift.loadErr": "Could not load shift status.",
            "shift.toastIn": "Clocked in.",
            "shift.toastOut": "Clocked out.",
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

    function fmtShift(iso) {
        if (!iso) return "—";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(getLang() === "vi" ? "vi-VN" : "en-GB", { timeZone: "Asia/Ho_Chi_Minh" });
    }

    async function refreshPosShift() {
        const u = getUser();
        const strip = document.getElementById("posShiftStrip");
        if (!strip || !u || u.role !== "staff") return;
        const txt = document.getElementById("posShiftText");
        const btnIn = document.getElementById("posBtnShiftIn");
        const btnOut = document.getElementById("posBtnShiftOut");
        if (!txt || !btnIn || !btnOut) return;
        try {
            const st = await api.getShiftStatus();
            const rec = st.record;
            if (!rec) {
                txt.textContent = t("shift.none").replace("{date}", st.work_date || "");
                btnIn.disabled = false;
                btnOut.disabled = true;
            } else if (rec.status === "open" || !rec.clock_out_at) {
                txt.textContent = t("shift.open").replace("{time}", fmtShift(rec.clock_in_at_iso || rec.clock_in_at));
                btnIn.disabled = true;
                btnOut.disabled = false;
            } else {
                txt.textContent = t("shift.done").replace("{time}", fmtShift(rec.clock_out_at_iso || rec.clock_out_at));
                btnIn.disabled = true;
                btnOut.disabled = true;
            }
        } catch (e) {
            console.warn("pos shift status", e);
            txt.textContent = t("shift.loadErr");
        }
    }

    function wirePosShiftButtons() {
        document.getElementById("posBtnShiftIn")?.addEventListener("click", async () => {
            try {
                await api.shiftClockIn({});
                toast(t("shift.toastIn"));
                await refreshPosShift();
            } catch (e) {
                toast(e.message || t("toast.error"));
            }
        });
        document.getElementById("posBtnShiftOut")?.addEventListener("click", async () => {
            try {
                await api.shiftClockOut();
                toast(t("shift.toastOut"));
                await refreshPosShift();
            } catch (e) {
                toast(e.message || t("toast.error"));
            }
        });
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

    let loyaltyHintTimer = null;

    function getEarnLoyalty() {
        const yes = document.getElementById("payEarnYes");
        return yes?.checked !== false;
    }

    function getVoucherDiscount(subtotal) {
        const sel = document.getElementById("payVoucher");
        if (!sel || !sel.value) return 0;
        const v = loyaltyVouchersList.find((x) => String(x.id) === sel.value);
        if (!v) return 0;
        const s = Math.max(0, Number(subtotal) || 0);
        const amt = Number(v.discount_amount_vnd || 0);
        if (amt > 0) return Math.min(amt, s);
        const pct = Number(v.discount_percent || 0);
        if (pct > 0) return Math.floor((s * pct) / 100);
        return 0;
    }

    function updatePointsPreview() {
        const el = document.getElementById("payPointsPreview");
        if (!el) return;
        const phone = (document.getElementById("payPhone")?.value || "").trim().replace(/\s/g, "");
        const subtotal = cart.TotalAmount || 0;
        const vd = getVoucherDiscount(subtotal);
        const effective = Math.max(0, subtotal - vd);
        if (!getEarnLoyalty() || phone.length < 9) {
            el.textContent = "";
            return;
        }
        const pts = Math.floor(effective / VND_PER_POINT);
        if (pts < 1) {
            el.textContent = t("loyalty.pointsPreviewNone");
            return;
        }
        el.textContent = t("loyalty.pointsPreview").replace("{pts}", String(pts));
    }

    async function refreshPayLoyaltyHint() {
        const el = document.getElementById("payLoyaltyHint");
        if (!el) return;
        const phone = (document.getElementById("payPhone")?.value || "").trim().replace(/\s/g, "");
        if (phone.length < 9) {
            el.textContent = "";
            return;
        }
        try {
            const res = await api.searchCustomerByPhone(phone);
            const c = res.customer || {};
            const bal = c.loyalty_points ?? 0;
            el.textContent = t("loyalty.hintBalance").replace("{bal}", String(bal));
        } catch {
            el.textContent = t("loyalty.hintNew");
        }
    }

    async function refreshLoyaltySummary() {
        const sel = document.getElementById("payVoucher");
        if (!sel) return;
        const phone = (document.getElementById("payPhone")?.value || "").trim().replace(/\s/g, "");
        sel.innerHTML = "";
        const opt0 = document.createElement("option");
        opt0.value = "";
        opt0.textContent = t("pay.voucherNone");
        sel.appendChild(opt0);
        loyaltyVouchersList = [];
        if (phone.length < 9) {
            updatePayState();
            updatePointsPreview();
            return;
        }
        try {
            const res = await api.posLoyaltySummary(phone);
            loyaltyVouchersList = res.vouchers || [];
            for (const v of loyaltyVouchersList) {
                const o = document.createElement("option");
                o.value = String(v.id);
                const disc =
                    Number(v.discount_amount_vnd || 0) > 0
                        ? `-${Number(v.discount_amount_vnd).toLocaleString("vi-VN")} ₫`
                        : v.discount_percent
                          ? `${v.discount_percent}%`
                          : "";
                o.textContent = `${v.code} · ${v.tier_name || ""} (${disc})`;
                sel.appendChild(o);
            }
        } catch (e) {
            console.warn("loyalty summary", e);
        }
        updatePayState();
        updatePointsPreview();
    }

    function schedulePayLoyaltyHint() {
        clearTimeout(loyaltyHintTimer);
        loyaltyHintTimer = setTimeout(() => {
            refreshPayLoyaltyHint();
            refreshLoyaltySummary();
            updatePointsPreview();
        }, 400);
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
            const pe = result.PointsEarned ?? result.points_earned ?? 0;
            const bal = result.CustomerLoyaltyBalance ?? result.customer_loyalty_balance;
            let paidMsg = t("toast.paid");
            if (pe > 0 && bal != null) {
                paidMsg = t("toast.paidLoyalty").replace("{pts}", String(pe)).replace("{bal}", String(bal));
            }
            toast(paidMsg);

            // Close modal
            const modalEl = document.getElementById("payModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal?.hide();

            // Reset form
            document.getElementById("payPhone").value = "";
            document.getElementById("payName").value = "";
            document.getElementById("payCash").value = "";
            const hint = document.getElementById("payLoyaltyHint");
            if (hint) hint.textContent = "";
            const pp = document.getElementById("payPointsPreview");
            if (pp) pp.textContent = "";
            document.getElementById("payEarnYes").checked = true;
            loyaltyVouchersList = [];
            const pv = document.getElementById("payVoucher");
            if (pv) {
                pv.innerHTML = "";
                const o = document.createElement("option");
                o.value = "";
                o.textContent = t("pay.voucherNone");
                pv.appendChild(o);
            }
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

        const paySub = document.getElementById("paySubtotal");
        if (paySub) paySub.textContent = fmtVND(total);
        updatePayState();

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
        const subtotal = cart.TotalAmount || 0;
        const vd = getVoucherDiscount(subtotal);
        const effective = Math.max(0, subtotal - vd);

        const paySub = document.getElementById("paySubtotal");
        if (paySub) paySub.textContent = fmtVND(subtotal);

        const rowDisc = document.getElementById("payVoucherDiscountRow");
        const discVal = document.getElementById("payVoucherDiscount");
        if (rowDisc && discVal) {
            if (vd > 0) {
                rowDisc.style.display = "flex";
                discVal.textContent = "-" + fmtVND(vd).replace(/^\s*/, "");
            } else {
                rowDisc.style.display = "none";
                discVal.textContent = fmtVND(0);
            }
        }

        const payTotal = document.getElementById("payTotal");
        if (payTotal) payTotal.textContent = fmtVND(effective);

        const cashInput = document.getElementById("payCash");
        const cash = Number((cashInput?.value || "0").replace(/[^\d]/g, "")) || 0;
        const change = Math.max(0, cash - effective);

        const changeEl = document.getElementById("payChange");
        if (changeEl) changeEl.textContent = fmtVND(change);

        const btn = document.getElementById("btnCompletePay");
        if (btn) btn.disabled = subtotal <= 0 || cash < effective;

        updatePointsPreview();
    }

    function completePay() {
        const phone = (document.getElementById("payPhone")?.value || "").trim();
        const name = (document.getElementById("payName")?.value || "").trim();
        const cashInput = document.getElementById("payCash");
        const cash = Number((cashInput?.value || "0").replace(/[^\d]/g, "")) || 0;
        const earn = getEarnLoyalty();
        const vid = document.getElementById("payVoucher")?.value;
        const payload = {
            Phone: phone,
            FullName: name,
            CustomerPay: cash,
            EarnLoyalty: earn,
        };
        if (vid) {
            payload.CustomerVoucherId = parseInt(vid, 10);
        }

        checkout(payload);
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
            refreshPosShift();
            refreshPayLoyaltyHint();
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
        wirePosShiftButtons();
        await refreshPosShift();

        // Search
        const search = document.getElementById("searchInput");
        search?.addEventListener("input", (e) => renderProducts(e.target.value));

        // Cart buttons
        document.getElementById("btnClearCart")?.addEventListener("click", clearCart);

        // Payment modal events
        document.getElementById("payCash")?.addEventListener("input", updatePayState);
        document.getElementById("payModal")?.addEventListener("shown.bs.modal", () => {
            document.getElementById("payEarnYes").checked = true;
            updatePayState();
            const lh = document.getElementById("payLoyaltyHint");
            if (lh) lh.textContent = "";
            const pp = document.getElementById("payPointsPreview");
            if (pp) pp.textContent = "";
            schedulePayLoyaltyHint();
        });
        document.getElementById("payPhone")?.addEventListener("input", schedulePayLoyaltyHint);
        document.getElementById("payVoucher")?.addEventListener("change", updatePayState);
        document.getElementById("payEarnYes")?.addEventListener("change", () => {
            updatePointsPreview();
        });
        document.getElementById("payEarnNo")?.addEventListener("change", () => {
            updatePointsPreview();
        });
        document.getElementById("btnCompletePay")?.addEventListener("click", completePay);

        // Load data
        await initCart();
        await loadProducts();
    }

    init();
})();

