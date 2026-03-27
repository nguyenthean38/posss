// Customers Module - Real API Integration
import API from './api.js?v=8';
import { requireAuth } from './auth.js';
import { getAvatarImage } from './assets.js';
import { initAiChatWidget } from './ai-chat-widget.js?v=1';

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
            "nav.activity": "Nhật ký",
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
            "toast.fileTooBig": "Ảnh không được vượt quá 2MB",
            "toast.fileType": "Chỉ chấp nhận ảnh JPG, PNG, GIF, WEBP",
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
            "nav.activity": "Activity",
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
            "toast.fileTooBig": "Image must be at most 2MB",
            "toast.fileType": "Only JPG, PNG, GIF, WEBP images are allowed",
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
        initAiChatWidget();
    }

    init();
})();

