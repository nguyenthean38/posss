import api from './api.js?v=6';
import { requireAuth, getUser } from './auth.js';
import { initAiChatWidget } from './ai-chat-widget.js?v=1';

(async () => {
    await requireAuth();

    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";

    const i18n = {
        vi: {
            "page.dashboard": "Tổng quan",
            "role.admin": "Quản trị viên",
            "role.staff": "Nhân viên",
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
            "kpi.revenue": "Tổng doanh thu",
            "kpi.orders": "Tổng đơn hàng",
            "kpi.products": "Tổng sản phẩm",
            "kpi.customers": "Tổng khách hàng",
            "panel.salesOverview": "Tổng quan doanh thu",
            "panel.orders": "Đơn hàng",
            "panel.recentOrders": "Đơn hàng gần đây",
            "panel.topProducts": "Sản phẩm bán chạy",
            "table.customerName": "Tên khách hàng",
            "table.total": "Tổng tiền",
            "product.sold": "Đã bán",
            "product.items": "sản phẩm",
            "ai.title": "PhoneStore xin chào!",
            "ai.subtitle": "Doanh thu, đơn hàng, báo cáo · 1900 54 54 63",
            "ai.emptyLead": "Gợi ý câu hỏi:",
            "ai.hint1": "Doanh thu hôm nay thế nào?",
            "ai.hint2": "Top sản phẩm bán chạy?",
            "ai.hint3": "Tổng đơn tuần này?",
            "ai.placeholder": "Ví dụ: Doanh thu hôm nay thế nào?",
            "ai.send": "Gửi",
            "ai.inputLabel": "Nhập câu hỏi",
            "ai.fabTitle": "Mở trợ lý AI",
            "ai.close": "Đóng",
        },
        en: {
            "page.dashboard": "Dashboard",
            "role.admin": "Administrator",
            "role.staff": "Staff",
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
            "kpi.revenue": "Total Revenue",
            "kpi.orders": "Total Orders",
            "kpi.products": "Total Products",
            "kpi.customers": "Total Customers",
            "panel.salesOverview": "Sales Overview",
            "panel.orders": "Orders",
            "panel.recentOrders": "Recent Orders",
            "panel.topProducts": "Top Products",
            "table.customerName": "Customer Name",
            "table.total": "Total",
            "product.sold": "sold",
            "product.items": "items",
            "ai.title": "PhoneStore says hi!",
            "ai.subtitle": "Revenue, orders, reports · 1900 54 54 63",
            "ai.emptyLead": "Suggested questions:",
            "ai.hint1": "How is today's revenue?",
            "ai.hint2": "Top selling products?",
            "ai.hint3": "Total orders this week?",
            "ai.placeholder": "e.g. How is today's revenue?",
            "ai.send": "Send",
            "ai.inputLabel": "Your question",
            "ai.fabTitle": "Open AI assistant",
            "ai.close": "Close",
        }
    };

    const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
    const t = (k) => i18n[getLang()]?.[k] || i18n.en[k] || k;
    const fmtVND = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "\u00A0₫";

    function applyLang(lang) {
        document.documentElement.lang = lang;
        const dict = i18n[lang] || i18n.en;
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (dict[key]) el.textContent = dict[key];
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (dict[key]) el.setAttribute("placeholder", dict[key]);
        });
        document.querySelectorAll("[data-i18n-tooltip]").forEach((el) => {
            const key = el.getAttribute("data-i18n-tooltip");
            if (dict[key]) el.setAttribute("title", dict[key]);
        });
        document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
            const key = el.getAttribute("data-i18n-aria-label");
            if (dict[key]) el.setAttribute("aria-label", dict[key]);
        });
        document.querySelectorAll(".ps-nav__item[data-tooltip]").forEach((a) => {
            const span = a.querySelector("span[data-i18n]");
            if (span) a.setAttribute("data-tooltip", span.textContent.trim());
        });
        document.getElementById("langLabel").textContent = (lang || "en").toUpperCase();
        localStorage.setItem(KEY_LANG, lang);
    }

    function setTheme(theme) {
        document.body.setAttribute("data-theme", theme);
        localStorage.setItem(KEY_THEME, theme);
        const icon = document.getElementById("btnTheme")?.querySelector("i");
        if (icon) {
            icon.className = theme === "dark" ? "bi bi-moon-stars" : "bi bi-brightness-high";
        }
        rebuildCharts();
    }

    function initLayout() {
        const app = document.querySelector(".ps-app");
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("overlay");
        const btnMobileMenu = document.getElementById("btnMobileMenu");
        const btnCollapse = document.getElementById("btnCollapse");

        const openSidebar = () => {
            sidebar.classList.add("open");
            overlay.classList.add("show");
        };
        const closeSidebar = () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("show");
        };

        if (btnMobileMenu) btnMobileMenu.addEventListener("click", openSidebar);
        if (overlay) overlay.addEventListener("click", closeSidebar);

        if (btnCollapse) {
            btnCollapse.addEventListener("click", () => {
                app.classList.toggle("sidebar-collapsed");
                const icon = btnCollapse.querySelector("i");
                if (icon) {
                    icon.classList.toggle("bi-chevron-left");
                    icon.classList.toggle("bi-chevron-right");
                }
            });
        }

        document.getElementById("btnTheme")?.addEventListener("click", () => {
            const current = document.body.getAttribute("data-theme") || "dark";
            setTheme(current === "dark" ? "light" : "dark");
        });

        document.getElementById("btnLang")?.addEventListener("click", () => {
            const current = localStorage.getItem(KEY_LANG) || "vi";
            applyLang(current === "vi" ? "en" : "vi");
            rebuildCharts();
        });
    }

    let salesChart = null;
    let ordersChart = null;

    function getChartThemeColors() {
        const theme = document.body.getAttribute("data-theme") || "dark";
        const isDark = theme === "dark";
        return {
            grid: isDark ? "rgba(255,255,255,.10)" : "rgba(15,23,42,.10)",
            ticks: isDark ? "rgba(255,255,255,.55)" : "rgba(15,23,42,.55)",
            tooltipBg: isDark ? "rgba(15,26,43,.95)" : "rgba(255,255,255,.95)",
            tooltipBorder: isDark ? "rgba(255,255,255,.10)" : "rgba(15,23,42,.12)",
            tooltipTitle: isDark ? "rgba(255,255,255,.92)" : "rgba(15,23,42,.92)",
            tooltipBody: isDark ? "rgba(255,255,255,.86)" : "rgba(15,23,42,.86)",
            bar: "rgba(59,130,246,.85)",
            line: "rgba(34,211,238,.95)",
            lineFill: "rgba(34,211,238,.12)",
        };
    }

    function getLangText() {
        const lang = localStorage.getItem(KEY_LANG) || "vi";
        return {
            revenueLabel: lang === "vi" ? "Doanh thu (triệu)" : "Revenue (M)",
            ordersLabel: lang === "vi" ? "Đơn hàng" : "Orders",
        };
    }

    function destroyCharts() {
        if (salesChart) { salesChart.destroy(); salesChart = null; }
        if (ordersChart) { ordersChart.destroy(); ordersChart = null; }
    }

    function buildCharts(data) {
        const colors = getChartThemeColors();
        const langText = getLangText();

        const commonGrid = { color: colors.grid };
        const commonTicks = { color: colors.ticks, font: { size: 11 } };

        const salesCtx = document.getElementById("salesBar");
        if (salesCtx && data.weekly_sales) {
            salesChart = new Chart(salesCtx, {
                type: "bar",
                data: {
                    labels: data.weekly_sales.labels || ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
                    datasets: [{
                        label: langText.revenueLabel,
                        data: data.weekly_sales.values || [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: colors.bar,
                        borderRadius: 10,
                        maxBarThickness: 52,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: colors.tooltipBg,
                            borderColor: colors.tooltipBorder,
                            borderWidth: 1,
                            titleColor: colors.tooltipTitle,
                            bodyColor: colors.tooltipBody,
                            displayColors: false,
                            callbacks: { label: (ctx) => ` ${(ctx.parsed.y / 1000000).toFixed(1)}M` }
                        }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: commonTicks },
                        y: {
                            grid: commonGrid,
                            ticks: { ...commonTicks, callback: (v) => `${(v / 1000000).toFixed(1)}M` }
                        }
                    },
                    interaction: { mode: "nearest", axis: "x", intersect: false }
                }
            });
        }

        const ordersCtx = document.getElementById("ordersLine");
        if (ordersCtx && data.weekly_orders) {
            ordersChart = new Chart(ordersCtx, {
                type: "line",
                data: {
                    labels: data.weekly_orders.labels || ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
                    datasets: [{
                        label: langText.ordersLabel,
                        data: data.weekly_orders.values || [0, 0, 0, 0, 0, 0, 0],
                        borderColor: colors.line,
                        backgroundColor: colors.lineFill,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointHoverRadius: 5,
                        pointBackgroundColor: colors.line,
                        pointBorderWidth: 0,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    elements: { line: { borderWidth: 2 } },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: colors.tooltipBg,
                            borderColor: colors.tooltipBorder,
                            borderWidth: 1,
                            titleColor: colors.tooltipTitle,
                            bodyColor: colors.tooltipBody,
                            displayColors: false,
                        }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: commonTicks },
                        y: { grid: commonGrid, ticks: commonTicks }
                    },
                    interaction: { mode: "nearest", axis: "x", intersect: false }
                }
            });
        }
    }

    function rebuildCharts() {
        destroyCharts();
        requestAnimationFrame(() => loadDashboard());
    }

    function fmtShift(iso) {
        if (!iso) return "—";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(getLang() === "vi" ? "vi-VN" : "en-GB", { timeZone: "Asia/Ho_Chi_Minh" });
    }

    function showToast(msg) {
        const el = document.getElementById("toast");
        const tx = document.getElementById("toastText");
        if (tx) tx.textContent = msg;
        if (el) { el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2800); }
    }

    async function refreshShiftPanel() {
        const u = getUser();
        const row = document.getElementById("shiftRow");
        if (!row || !u || u.role !== "staff") return;
        const txt = document.getElementById("shiftStatusText");
        const btnIn = document.getElementById("btnShiftIn");
        const btnOut = document.getElementById("btnShiftOut");
        if (!txt || !btnIn || !btnOut) return;
        try {
            const st = await api.getShiftStatus();
            const rec = st.record;
            if (!rec) {
                txt.textContent = "Chưa chấm vào ca hôm nay (" + (st.work_date || "") + ").";
                btnIn.disabled = false;
                btnOut.disabled = true;
            } else if (rec.status === "open" || !rec.clock_out_at) {
                txt.textContent = "Đang trong ca — vào lúc " + fmtShift(rec.clock_in_at_iso || rec.clock_in_at);
                btnIn.disabled = true;
                btnOut.disabled = false;
            } else {
                txt.textContent = "Đã hoàn thành ca — ra lúc " + fmtShift(rec.clock_out_at_iso || rec.clock_out_at);
                btnIn.disabled = true;
                btnOut.disabled = true;
            }
        } catch (e) { console.warn("shift status", e); txt.textContent = "Không tải được trạng thái ca."; }
    }

    function wireShiftButtons() {
        document.getElementById("btnShiftIn")?.addEventListener("click", async () => {
            try { await api.shiftClockIn({}); showToast("Đã chấm vào ca."); await refreshShiftPanel(); }
            catch (e) { showToast(e.message || "Lỗi"); }
        });
        document.getElementById("btnShiftOut")?.addEventListener("click", async () => {
            try { await api.shiftClockOut(); showToast("Đã chấm ra ca."); await refreshShiftPanel(); }
            catch (e) { showToast(e.message || "Lỗi"); }
        });
    }

    async function loadDashboard() {
        try {
            const data = await api.getReportSummary();

            // KPIs - backend trả TotalRevenue, OrderCount, TotalProductsSold, CustomerCount
            const setKpi = (key, value) => {
                const el = document.querySelector(`[data-i18n="${key}"]`)?.closest('.ps-kpi')?.querySelector('.ps-kpi__value');
                if (el) el.textContent = value;
            };
            setKpi('kpi.revenue', fmtVND(data.TotalRevenue));
            setKpi('kpi.orders', data.OrderCount || 0);
            setKpi('kpi.products', data.TotalProductsSold || 0);
            setKpi('kpi.customers', data.CustomerCount || 0);

            // Recent orders - backend trả RecentOrders[{OrderId, Date, CustomerName, TotalAmount}]
            const tbody = document.querySelector('.ps-table tbody');
            if (tbody) {
                const orders = data.RecentOrders || [];
                tbody.innerHTML = orders.length
                    ? orders.map(o => `
                        <tr>
                            <td><a class="ps-link" href="#">#${o.OrderId}</a></td>
                            <td>${o.CustomerName || "Khách lẻ"}</td>
                            <td class="text-end">${fmtVND(o.TotalAmount)}</td>
                        </tr>`).join("")
                    : `<tr><td colspan="3" class="text-center" style="opacity:.5">Chưa có đơn hàng</td></tr>`;
            }

            // Top products - backend trả TopProducts[{ProductName, TotalSold, TotalRevenue}]
            const topList = document.querySelector('.ps-toplist');
            if (topList) {
                const products = data.TopProducts || [];
                topList.innerHTML = products.length
                    ? products.map((p, i) => `
                        <div class="ps-topitem">
                            <div class="ps-rank">${i + 1}</div>
                            <div class="ps-topitem__meta">
                                <div class="ps-topitem__name">${p.ProductName}</div>
                                <div class="ps-topitem__sub">${t("product.sold")} ${p.TotalSold} ${t("product.items")}</div>
                            </div>
                            <div class="ps-topitem__value">${fmtVND(p.TotalRevenue)}</div>
                        </div>`).join("")
                    : `<div class="ps-topitem" style="opacity:.5">Chưa có dữ liệu</div>`;
            }

            // Fetch chart data from /api/reports/chart
            try {
                const [chartRevenue, chartOrders] = await Promise.all([
                    api.getReportChartData({ type: 'revenue', period: 'day' }),
                    api.getReportChartData({ type: 'orders', period: 'day' }),
                ]);
                buildCharts({
                    weekly_sales: {
                        labels: chartRevenue.map(d => d.label),
                        values: chartRevenue.map(d => parseFloat(d.value) || 0),
                    },
                    weekly_orders: {
                        labels: chartOrders.map(d => d.label),
                        values: chartOrders.map(d => parseInt(d.value) || 0),
                    }
                });
            } catch (_) {
                buildCharts({});
            }
        } catch (err) {
            console.error('Dashboard load error:', err);
        }
    }

    async function init() {
        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        const savedLang = localStorage.getItem(KEY_LANG) || "vi";

        applyLang(savedLang);
        setTheme(savedTheme);
        initLayout();
        loadDashboard();
        wireShiftButtons();
        refreshShiftPanel();
        initAiChatWidget();
    }

    await init();
})();
