/**
 * Employees Module - Real API Integration
 */
import { api } from './api.js?v=9';
import { requireAuth, isAdmin } from './auth.js';
import { initAiChatWidget } from './ai-chat-widget.js?v=2';
import { i18n } from './shared.js';

(() => {
    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";

    let employees = [];
    let pendingDeleteId = null;
    let viewEmployeeId = null;


    const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
    const t = (k) => i18n[getLang()]?.[k] || i18n.en[k] || k;

    function initials(name) {
        const parts = (name || "").trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return "NA";
        const a = parts[0][0] || "";
        const b = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] || "");
        return (a + b).toUpperCase();
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

    // API calls
    async function loadEmployees() {
        try {
            const result = await api.getStaff({ limit: 100 });
            employees = result.items || [];
            render();
        } catch (error) {
            console.error('Load employees error:', error);
            toast(t("toast.error"));
        }
    }

    function roleLabel(role) {
        if (role === "admin") return t("role.admin2");
        return t("role.staff");
    }

    function statusLabel(locked) {
        return locked ? t("status.locked") : t("status.active");
    }

    function render() {
        const q = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
        const grid = document.getElementById("grid");
        const countEl = document.getElementById("empCount");

        const list = employees.filter(e =>
            !q || (e.full_name || "").toLowerCase().includes(q) || (e.email || "").toLowerCase().includes(q)
        );

        if (countEl) countEl.textContent = `(${list.length})`;
        if (!grid) return;

        grid.innerHTML = list.map(e => {
            const badgeStatus = e.status === 'locked' ? "lock" : "ok";
            const badgeWarn = e.is_first_login ? `<span class="ps-badge warn">${t("emp.needPwd")}</span>` : "";
            return `
                <div class="col-12 col-md-6 col-xl-4">
                    <div class="ps-card ps-empCard" data-id="${e.id}">
                        <div>
                            <div class="ps-empTop">
                                <div class="ps-empAvatar">${initials(e.full_name)}</div>
                                <div class="ps-empMeta">
                                    <div class="ps-empName">${e.full_name}</div>
                                    <div class="ps-empEmail">${e.email}</div>
                                    <div class="ps-badges">
                                        <span class="ps-badge ${badgeStatus}">${statusLabel(e.status === 'locked')}</span>
                                        <span class="ps-badge">${roleLabel(e.role)}</span>
                                        ${badgeWarn}
                                    </div>
                                </div>
                            </div>
                            <div class="ps-empDivider"></div>
                        </div>
                        <div class="ps-empActions">
                            <button class="ps-empAct" data-act="view"><i class="bi bi-eye"></i><span>${t("emp.view")}</span></button>
                            <button class="ps-empAct" data-act="lock"><i class="bi ${e.status === 'locked' ? "bi-unlock" : "bi-lock"}"></i><span>${e.status === 'locked' ? t("emp.unlock") : t("emp.lock")}</span></button>
                            <button class="ps-empAct right" data-act="email" title="email"><i class="bi bi-envelope"></i></button>
                            <button class="ps-empAct right" data-act="delete" title="delete" style="color:var(--red)"><i class="bi bi-trash3"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        grid.querySelectorAll(".ps-empCard").forEach(card => {
            const id = card.dataset.id;
            card.querySelector('[data-act="view"]').addEventListener("click", () => openView(id));
            card.querySelector('[data-act="lock"]').addEventListener("click", () => toggleLock(id));
            card.querySelector('[data-act="email"]').addEventListener("click", () => resendEmail(id));
            card.querySelector('[data-act="delete"]').addEventListener("click", () => openDelete(id));
        });
    }

    async function openView(id) {
        const e = employees.find(x => x.id == id);
        if (!e) return;
        viewEmployeeId = id;

        const fmtVND = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "\u00A0₫";

        const viewBody = document.getElementById("viewBody");

        // Hiển thị thông tin cơ bản ngay (không chờ sales API)
        viewBody.innerHTML = `
            <div class="ps-view__hero">
                <div class="ps-view__icon" style="border-radius:999px;">
                    <div class="ps-empAvatar" style="width:64px;height:64px;border-radius:999px;">${initials(e.full_name)}</div>
                </div>
                <div class="ps-view__name">${e.full_name}</div>
                <div class="ps-view__barcode">${e.email}</div>
            </div>
            <div class="ps-view__card">
                <div class="ps-view__grid">
                    <div class="ps-view__label">${t("view.status")}</div>
                    <div class="ps-view__value">${statusLabel(e.status === 'locked')}</div>
                    <div class="ps-view__label">${t("view.role")}</div>
                    <div class="ps-view__value">${roleLabel(e.role)}</div>
                    <div class="ps-view__label">${t("view.pwdChanged")}</div>
                    <div class="ps-view__value">
                        ${!e.is_first_login
                ? `<i class="bi bi-check2-square" style="color:var(--green)"></i> ${t("view.yes")}`
                : `<i class="bi bi-x-square" style="color:var(--red)"></i> ${t("view.no")}`}
                    </div>
                </div>
            </div>
            <div id="salesSection" style="margin-top:12px;opacity:.5">
                <i class="bi bi-arrow-repeat" style="animation:spin 1s linear infinite"></i> ${t("emp.loadingSales")}
            </div>
        `;

        const btnLock = document.getElementById("btnLockFromView");
        const btnEmail = document.getElementById("btnEmailFromView");
        btnLock.querySelector("span").textContent = e.status === 'locked' ? t("emp.unlock") : t("emp.lock");
        btnLock.querySelector("i").className = `bi ${e.status === 'locked' ? "bi-unlock" : "bi-lock"}`;

        btnLock.onclick = () => { toggleLock(id); openView(id); };
        btnEmail.onclick = () => resendEmail(id);

        bootstrap.Modal.getOrCreateInstance(document.getElementById("viewModal")).show();

        // Load thông tin bán hàng bất đồng bộ
        try {
            const sales = await api.request(`/api/staff/${id}/sales`);
            const ordersHtml = (sales.recent_orders || []).length
                ? `<table style="width:100%;font-size:.82rem;border-collapse:collapse">
                    <thead><tr>
                        <th style="text-align:left;padding:4px 6px;opacity:.6">${t("view.orderId")}</th>
                        <th style="text-align:left;padding:4px 6px;opacity:.6">${t("view.customer")}</th>
                        <th style="text-align:right;padding:4px 6px;opacity:.6">${t("view.amount")}</th>
                    </tr></thead>
                    <tbody>
                        ${sales.recent_orders.map(o => `
                            <tr style="border-top:1px solid rgba(255,255,255,.07)">
                                <td style="padding:4px 6px">#${o.OrderId}</td>
                                <td style="padding:4px 6px">${o.CustomerName}</td>
                                <td style="padding:4px 6px;text-align:right">${fmtVND(o.TotalAmount)}</td>
                            </tr>`).join("")}
                    </tbody>
                   </table>`
                : `<div style="opacity:.5;font-size:.85rem">${t("view.noOrders")}</div>`;

            const salesSection = document.getElementById("salesSection");
            if (salesSection) {
                salesSection.style.opacity = "1";
                salesSection.innerHTML = `
                    <div class="ps-view__card">
                        <div style="font-weight:600;margin-bottom:12px;padding:0 16px"><i class="bi bi-bar-chart-line" style="margin-right:6px"></i>${t("view.salesTitle")}</div>
                        <div class="ps-view__grid">
                            <div class="ps-view__label">${t("view.totalOrders")}</div>
                            <div class="ps-view__value">${sales.total_orders || 0}</div>
                            <div class="ps-view__label">${t("view.totalRevenue")}</div>
                            <div class="ps-view__value">${fmtVND(sales.total_revenue)}</div>
                        </div>
                        <div class="ps-view__divider"></div>
                        <div style="font-size:.88rem;font-weight:600;margin-bottom:8px;opacity:.8;padding:0 16px">${t("view.recentOrders")}</div>
                        <div style="padding:0 16px">${ordersHtml}</div>
                    </div>`;
            }
        } catch (_) {
            const salesSection = document.getElementById("salesSection");
            if (salesSection) salesSection.remove();
        }
    }

    function openAdd() {
        document.getElementById("empModalTitle").textContent = t("emp.modalAdd");
        document.getElementById("fName").value = "";
        document.getElementById("fEmail").value = "";
    }

    async function save() {
        const name = document.getElementById("fName").value.trim();
        const email = document.getElementById("fEmail").value.trim();

        if (!name || !email) {
            toast(t("toast.invalid"));
            return;
        }

        try {
            await api.createStaff({ full_name: name, email: email });
            await loadEmployees();
            toast(t("toast.saved"));
            bootstrap.Modal.getInstance(document.getElementById("empModal"))?.hide();
        } catch (error) {
            console.error('Save employee error:', error);
            toast(error.message || t("toast.error"));
        }
    }

    async function toggleLock(id) {
        const e = employees.find(x => x.id == id);
        if (!e) return;

        try {
            if (e.status === 'locked') {
                await api.unlockStaff(id);
                toast(t("toast.unlocked"));
            } else {
                await api.lockStaff(id);
                toast(t("toast.locked"));
            }
            await loadEmployees();
        } catch (error) {
            console.error('Toggle lock error:', error);
            toast(t("toast.error"));
        }
    }

    async function resendEmail(id) {
        try {
            await api.resendStaffEmail(id);
            toast(t("toast.email"));
        } catch (error) {
            console.error('Resend email error:', error);
            toast(error.message || t("toast.error"));
        }
    }

    function openDelete(id) {
        const e = employees.find(x => x.id == id);
        if (!e) return;
        pendingDeleteId = id;
        const textEl = document.getElementById("deleteText");
        if (textEl) textEl.textContent = `${t("confirm.deleteText")} "${e.full_name}" (${e.email})`;
        bootstrap.Modal.getOrCreateInstance(document.getElementById("deleteModal")).show();
    }

    async function confirmDelete() {
        if (!pendingDeleteId) return;
        try {
            await api.deleteStaff(pendingDeleteId);
            toast(t("toast.deleted"));
            pendingDeleteId = null;
            bootstrap.Modal.getInstance(document.getElementById("deleteModal"))?.hide();
            await loadEmployees();
        } catch (error) {
            console.error('Delete staff error:', error);
            toast(error.message || t("toast.error"));
        }
    }

    async function init() {
        // Check auth & admin
        try {
            await requireAuth();
            if (!isAdmin()) {
                location.href = "dashboard.html";
                return;
            }
        } catch (error) {
            return;
        }

        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        const savedLang = localStorage.getItem(KEY_LANG) || "vi";
        applyLang(savedLang);
        setTheme(savedTheme);

        initLayout();

        document.getElementById("searchInput")?.addEventListener("input", render);
        document.getElementById("btnAdd")?.addEventListener("click", openAdd);
        document.getElementById("btnSave")?.addEventListener("click", save);
        document.getElementById("btnConfirmDelete")?.addEventListener("click", confirmDelete);

        await loadEmployees();
        initAiChatWidget();
    }

    init();
})();

