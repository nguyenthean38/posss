(() => {
    // ===== DOM =====
    const app = document.querySelector(".ps-app");
    const body = document.body;

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const btnMobileMenu = document.getElementById("btnMobileMenu");
    const btnCollapse = document.getElementById("btnCollapse");

    const btnTheme = document.getElementById("btnTheme");
    const btnLang = document.getElementById("btnLang");
    const langLabel = document.getElementById("langLabel");

    // ===== STORAGE KEYS =====
    const KEY_THEME = "ps_theme"; // "dark" | "light"
    const KEY_LANG = "ps_lang";   // "vi" | "en"

    // ===== I18N DICT =====
    const i18n = {
        vi: {
            "page.dashboard": "Tổng quan",
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

            "product.sold45": "Đã bán 45 sản phẩm",
            "product.sold38": "Đã bán 38 sản phẩm",
            "product.sold67": "Đã bán 67 sản phẩm",
            "product.sold120": "Đã bán 120 sản phẩm",
            "product.case": "Ốp lưng iPhone",
        },
        en: {
            "page.dashboard": "Dashboard",
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

            "product.sold45": "45 products sold",
            "product.sold38": "38 products sold",
            "product.sold67": "67 products sold",
            "product.sold120": "120 products sold",
            "product.case": "iPhone Case",
        }
    };

    function applyLang(lang) {
        document.documentElement.lang = lang;
        const dict = i18n[lang] || i18n.en;

        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (dict[key]) el.textContent = dict[key];
        });

        // tooltips in collapse mode use data-tooltip (keep EN labels ok, but we can also localize)
        // optional: update tooltips according to nav text:
        document.querySelectorAll(".ps-nav__item[data-tooltip]").forEach((a) => {
            const span = a.querySelector("span[data-i18n]");
            if (span) a.setAttribute("data-tooltip", span.textContent.trim());
        });

        langLabel.textContent = (lang || "en").toUpperCase();
        localStorage.setItem(KEY_LANG, lang);
    }

    function setTheme(theme) {
        body.setAttribute("data-theme", theme);
        localStorage.setItem(KEY_THEME, theme);

        // update icon
        const icon = btnTheme?.querySelector("i");
        if (icon) {
            icon.className = theme === "dark" ? "bi bi-moon-stars" : "bi bi-brightness-high";
        }

        // update charts colors
        rebuildCharts();
    }

    // ===== SIDEBAR controls =====
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
            // update fixed topbar left offset via CSS already handled
        });
    }

    // ===== THEME toggle =====
    if (btnTheme) {
        btnTheme.addEventListener("click", () => {
            const current = body.getAttribute("data-theme") || "dark";
            setTheme(current === "dark" ? "light" : "dark");
        });
    }

    // ===== LANG toggle =====
    if (btnLang) {
        btnLang.addEventListener("click", () => {
            const current = localStorage.getItem(KEY_LANG) || "vi";
            applyLang(current === "vi" ? "en" : "vi");
            rebuildCharts(); // update chart labels if needed
        });
    }

    // ===== CHARTS =====
    let salesChart = null;
    let ordersChart = null;

    function getChartThemeColors() {
        const theme = body.getAttribute("data-theme") || "dark";
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
        const dict = i18n[lang] || i18n.en;
        return {
            revenueLabel: lang === "vi" ? "Doanh thu (triệu)" : "Revenue (M)",
            ordersLabel: lang === "vi" ? "Đơn hàng" : "Orders",
        };
    }

    function destroyCharts() {
        if (salesChart) { salesChart.destroy(); salesChart = null; }
        if (ordersChart) { ordersChart.destroy(); ordersChart = null; }
    }

    function buildCharts() {
        const colors = getChartThemeColors();
        const langText = getLangText();

        const commonGrid = { color: colors.grid };
        const commonTicks = { color: colors.ticks, font: { size: 11 } };

        // Sales Bar
        const salesCtx = document.getElementById("salesBar");
        if (salesCtx) {
            salesChart = new Chart(salesCtx, {
                type: "bar",
                data: {
                    labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
                    datasets: [{
                        label: langText.revenueLabel,
                        data: [4.5, 5.6, 4.2, 7.8, 7.1, 9.2, 5.0],
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
                            callbacks: {
                                label: (ctx) => ` ${ctx.parsed.y}M`,
                            }
                        }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: commonTicks },
                        y: {
                            grid: commonGrid,
                            ticks: { ...commonTicks, callback: (v) => `${v}M` },
                            suggestedMax: 10
                        }
                    },
                    interaction: {
                        mode: "nearest",
                        axis: "x",
                        intersect: false
                    },
                    hover: {
                        mode: "nearest",
                        intersect: false
                    },
                    plugins: {
                        tooltip: {
                            enabled: true,
                            intersect: false
                        }
                    }
                }
            });
        }

        // Orders Line
        const ordersCtx = document.getElementById("ordersLine");
        if (ordersCtx) {
            ordersChart = new Chart(ordersCtx, {
                type: "line",
                data: {
                    labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
                    datasets: [{
                        label: langText.ordersLabel,
                        data: [12, 18, 10, 24, 20, 30, 15],
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
                        y: { grid: commonGrid, ticks: commonTicks, suggestedMax: 32 }
                    },
                    interaction: {
                        mode: "nearest",
                        axis: "x",
                        intersect: false
                    },
                    hover: {
                        mode: "nearest",
                        intersect: false
                    },
                    plugins: {
                        tooltip: {
                            enabled: true,
                            intersect: false
                        }
                    }
                }
            });
        }
    }

    function rebuildCharts() {
        // Chart.js needs destroy+create for theme color updates reliably
        destroyCharts();
        // delay to ensure canvas sizes stable if layout changed
        requestAnimationFrame(buildCharts);
    }

    // ===== INIT =====
    const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
    const savedLang = localStorage.getItem(KEY_LANG) || "vi";

    applyLang(savedLang);
    setTheme(savedTheme);

})();