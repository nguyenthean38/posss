// Dashboard Module - Real API Integration
import API from './api.js';
import { requireAuth, getUser } from './auth.js';

(() => {
    requireAuth();

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

    async function loadDashboard() {
        try {
            const data = await API.reports.getDashboard();

            // Update KPIs
            document.querySelector('[data-i18n="kpi.revenue"]').closest('.ps-kpi').querySelector('.ps-kpi__value').innerHTML = 
                `${fmtVND(data.total_revenue)} <span class="ps-currency"></span>`;
            
            document.querySelector('[data-i18n="kpi.orders"]').closest('.ps-kpi').querySelector('.ps-kpi__value').textContent = 
                data.total_orders || 0;
            
            document.querySelector('[data-i18n="kpi.products"]').closest('.ps-kpi').querySelector('.ps-kpi__value').textContent = 
                data.total_products || 0;
            
            document.querySelector('[data-i18n="kpi.customers"]').closest('.ps-kpi').querySelector('.ps-kpi__value').textContent = 
                data.total_customers || 0;

            // Update trends
            const trends = document.querySelectorAll('.ps-kpi__trend');
            if (trends[0] && data.revenue_trend) {
                trends[0].className = `ps-kpi__trend ${data.revenue_trend >= 0 ? 'up' : 'down'}`;
                trends[0].innerHTML = `<i class="bi bi-arrow-${data.revenue_trend >= 0 ? 'up' : 'down'}-right"></i><span>${Math.abs(data.revenue_trend).toFixed(1)}%</span>`;
            }
            if (trends[1] && data.orders_trend) {
                trends[1].className = `ps-kpi__trend ${data.orders_trend >= 0 ? 'up' : 'down'}`;
                trends[1].innerHTML = `<i class="bi bi-arrow-${data.orders_trend >= 0 ? 'up' : 'down'}-right"></i><span>${Math.abs(data.orders_trend).toFixed(1)}%</span>`;
            }

            // Recent orders table
            const tbody = document.querySelector('.ps-table tbody');
            if (tbody && data.recent_orders) {
                tbody.innerHTML = data.recent_orders.slice(0, 5).map(o => `
                    <tr>
                        <td><a class="ps-link" href="#">${o.id}</a></td>
                        <td>${o.customer_name || "-"}</td>
                        <td class="text-end">${fmtVND(o.total)}</td>
                    </tr>
                `).join("");
            }

            // Top products
            const topList = document.querySelector('.ps-toplist');
            if (topList && data.top_products) {
                topList.innerHTML = data.top_products.slice(0, 4).map((p, i) => `
                    <div class="ps-topitem">
                        <div class="ps-rank">${i + 1}</div>
                        <div class="ps-topitem__meta">
                            <div class="ps-topitem__name">${p.name}</div>
                            <div class="ps-topitem__sub">${t("product.sold")} ${p.quantity_sold} ${t("product.items")}</div>
                        </div>
                        <div class="ps-topitem__value">${fmtVND(p.revenue)}</div>
                    </div>
                `).join("");
            }

            buildCharts(data);
        } catch (err) {
            console.error('Dashboard load error:', err);
        }
    }

    function init() {
        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        const savedLang = localStorage.getItem(KEY_LANG) || "vi";

        applyLang(savedLang);
        setTheme(savedTheme);
        initLayout();
        loadDashboard();
    }

    init();
})();
