(() => {
    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";
    const KEY_ORDERS = "ps_orders";
    const KEY_PRODUCTS = "ps_products";

    // ===== i18n =====
    const i18n = {
        vi: {
            "page.reports": "Báo cáo",
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

            "range.today": "Hôm nay",
            "range.yesterday": "Hôm qua",
            "range.last7": "7 ngày qua",
            "range.month": "Tháng này",
            "range.custom": "Tùy chọn",
            "range.from": "Từ ngày",
            "range.to": "Đến ngày",

            "common.search": "Tìm kiếm",

            "kpi.revenue": "Doanh thu",
            "kpi.profit": "Lợi nhuận",
            "kpi.orders": "Đơn hàng",
            "kpi.items": "SP đã bán",

            "chart.revenue": "Doanh thu",
            "chart.category": "Danh mục",

            "table.orders": "Đơn hàng",
            "table.date": "Ngày đặt",
            "table.customer": "Tên khách hàng",
            "table.employee": "Nhân viên",
            "table.total": "Tổng cộng",
            "table.action": "Thao tác",

            "modal.orderDetail": "Chi tiết đơn hàng",
            "modal.products": "Sản phẩm:",
            "misc.items": "sản phẩm",
            "misc.other": "Khác"
        },
        en: {
            "page.reports": "Reports",
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

            "range.today": "Today",
            "range.yesterday": "Yesterday",
            "range.last7": "Last 7 days",
            "range.month": "This month",
            "range.custom": "Custom",
            "range.from": "From",
            "range.to": "To",

            "common.search": "Search",

            "kpi.revenue": "Revenue",
            "kpi.profit": "Profit",
            "kpi.orders": "Orders",
            "kpi.items": "Items sold",

            "chart.revenue": "Revenue",
            "chart.category": "Categories",

            "table.orders": "Orders",
            "table.date": "Order date",
            "table.customer": "Customer",
            "table.employee": "Employee",
            "table.total": "Total",
            "table.action": "Action",

            "modal.orderDetail": "Order details",
            "modal.products": "Products:",
            "misc.items": "items",
            "misc.other": "Other"
        }
    };

    const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
    const t = (k) => i18n[getLang()]?.[k] || i18n.en[k] || k;

    const fmtVND = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "\u00A0₫";

    // ===== theme/lang apply =====
    function applyLang(lang) {
        document.documentElement.lang = lang;
        const dict = i18n[lang] || i18n.en;

        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (dict[key]) el.textContent = dict[key];
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
        rebuildCharts(); // re-theme charts
    }

    // ===== sidebar controls =====
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
            refreshAll(); // update labels
        });
    }

    // ===== data loaders =====
    const loadOrders = () => JSON.parse(localStorage.getItem(KEY_ORDERS) || "[]");
    const loadProducts = () => JSON.parse(localStorage.getItem(KEY_PRODUCTS) || "[]");

    // employee name (mock if order doesn't have)
    function employeeNameFromOrder(o) {
        if (o.employeeName) return o.employeeName;
        const a = ["Nguyễn Văn An", "Trần Thị Bích", "Phạm Minh Đức"];
        const s = String(o.id || "");
        const idx = s.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % a.length;
        return a[idx];
    }

    // date helpers
    function startOfDay(d) {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
    }
    function endOfDay(d) {
        const x = new Date(d);
        x.setHours(23, 59, 59, 999);
        return x;
    }
    function ymd(d) {
        const x = new Date(d);
        const yyyy = x.getFullYear();
        const mm = String(x.getMonth() + 1).padStart(2, "0");
        const dd = String(x.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }
    function labelDay(d) {
        const x = new Date(d);
        const dd = String(x.getDate()).padStart(2, "0");
        const mm = String(x.getMonth() + 1).padStart(2, "0");
        return `${dd}/${mm}`;
    }
    function daysBetween(from, to) {
        const out = [];
        let cur = startOfDay(from);
        const end = startOfDay(to);
        while (cur <= end) {
            out.push(new Date(cur));
            cur.setDate(cur.getDate() + 1);
        }
        return out;
    }

    // ===== range state =====
    let currentRange = "last7";
    let rangeFrom = null;
    let rangeTo = null;

    function computeRange(kind) {
        const now = new Date();
        if (kind === "today") {
            rangeFrom = startOfDay(now);
            rangeTo = endOfDay(now);
        } else if (kind === "yesterday") {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            rangeFrom = startOfDay(y);
            rangeTo = endOfDay(y);
        } else if (kind === "last7") {
            const a = new Date(now);
            a.setDate(a.getDate() - 6);
            rangeFrom = startOfDay(a);
            rangeTo = endOfDay(now);
        } else if (kind === "month") {
            const m = new Date(now.getFullYear(), now.getMonth(), 1);
            rangeFrom = startOfDay(m);
            rangeTo = endOfDay(now);
        }
    }

    function applyCustomRange() {
        const f = document.getElementById("fromDate").value;
        const t_ = document.getElementById("toDate").value;
        if (!f || !t_) return;
        rangeFrom = startOfDay(new Date(f));
        rangeTo = endOfDay(new Date(t_));
        refreshAll();
    }

    // ===== compute metrics =====
    function productMaps() {
        const products = loadProducts();
        const byId = new Map();
        products.forEach(p => byId.set(p.id, p));
        return { byId };
    }

    function filterOrders() {
        const orders = loadOrders().slice();
        return orders.filter(o => {
            const dt = new Date(o.createdAt || o.date || Date.now());
            return dt >= rangeFrom && dt <= rangeTo;
        }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    function computeAll() {
        const { byId } = productMaps();
        const orders = filterOrders();

        let revenue = 0;
        let profit = 0;
        let orderCount = orders.length;
        let itemsSold = 0;

        // category totals
        const catTotals = new Map();

        for (const o of orders) {
            revenue += Number(o.total || 0);

            const items = o.items || [];
            for (const it of items) {
                const qty = Number(it.qty || 0);
                const price = Number(it.price || 0);
                itemsSold += qty;

                const p = byId.get(it.id);
                const cost = Number(p?.cost || 0);  // nếu không có cost => 0
                profit += Math.max(0, (price - cost) * qty);

                const cat = (p?.category || t("misc.other")).trim() || t("misc.other");
                catTotals.set(cat, (catTotals.get(cat) || 0) + price * qty);
            }
        }

        // daily revenue series
        const days = daysBetween(rangeFrom, rangeTo);
        const daily = days.map(d => ({ key: ymd(d), label: labelDay(d), value: 0 }));

        const dailyMap = new Map(daily.map(x => [x.key, x]));
        for (const o of orders) {
            const key = ymd(o.createdAt || o.date || Date.now());
            const slot = dailyMap.get(key);
            if (slot) slot.value += Number(o.total || 0);
        }

        // donut
        const catArr = [...catTotals.entries()].sort((a, b) => b[1] - a[1]);
        const catLabels = catArr.map(x => x[0]);
        const catValues = catArr.map(x => x[1]);

        return { orders, revenue, profit, orderCount, itemsSold, daily, catLabels, catValues };
    }

    // ===== charts =====
    let revChart = null;
    let donutChart = null;

    function chartColors() {
        const theme = document.body.getAttribute("data-theme") || "dark";
        const isDark = theme === "dark";
        return {
            grid: isDark ? "rgba(255,255,255,.10)" : "rgba(15,23,42,.10)",
            ticks: isDark ? "rgba(255,255,255,.55)" : "rgba(15,23,42,.55)",
            line: "rgba(59,130,246,.95)",
            fill: "rgba(59,130,246,.12)",
            donut: ["rgba(59,130,246,.85)", "rgba(34,211,238,.85)", "rgba(34,197,94,.85)", "rgba(245,158,11,.85)", "rgba(239,68,68,.85)"],
            tooltipBg: isDark ? "rgba(10,14,24,.92)" : "rgba(255,255,255,.95)",
            tooltipBorder: isDark ? "rgba(255,255,255,.12)" : "rgba(15,23,42,.12)",
            tooltipText: isDark ? "rgba(255,255,255,.92)" : "rgba(15,23,42,.92)",
        };
    }

    function destroyCharts() {
        if (revChart) { revChart.destroy(); revChart = null; }
        if (donutChart) { donutChart.destroy(); donutChart = null; }
    }

    function buildCharts(model) {
        const c = chartColors();

        // line
        const ctx1 = document.getElementById("revLine");
        revChart = new Chart(ctx1, {
            type: "line",
            data: {
                labels: model.daily.map(x => x.label),
                datasets: [{
                    data: model.daily.map(x => x.value),
                    borderColor: c.line,
                    backgroundColor: c.fill,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "nearest", axis: "x", intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        intersect: false,
                        backgroundColor: c.tooltipBg,
                        borderColor: c.tooltipBorder,
                        borderWidth: 1,
                        titleColor: c.tooltipText,
                        bodyColor: c.tooltipText,
                        displayColors: false,
                        callbacks: {
                            label: (ctx) => fmtVND(ctx.parsed.y)
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: c.ticks, font: { size: 11 } } },
                    y: {
                        grid: { color: c.grid },
                        ticks: { color: c.ticks, font: { size: 11 }, callback: (v) => (v / 1000000) + "M" }
                    }
                }
            }
        });

        // donut
        const ctx2 = document.getElementById("catDonut");
        donutChart = new Chart(ctx2, {
            type: "doughnut",
            data: {
                labels: model.catLabels,
                datasets: [{
                    data: model.catValues.length ? model.catValues : [1],
                    backgroundColor: model.catValues.length ? model.catLabels.map((_, i) => c.donut[i % c.donut.length]) : ["rgba(255,255,255,.10)"],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%",
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: c.tooltipBg,
                        borderColor: c.tooltipBorder,
                        borderWidth: 1,
                        titleColor: c.tooltipText,
                        bodyColor: c.tooltipText,
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${fmtVND(ctx.parsed)}`
                        }
                    }
                }
            }
        });

        // legend html
        const legend = document.getElementById("catLegend");
        const total = model.catValues.reduce((s, x) => s + x, 0) || 1;
        legend.innerHTML = model.catLabels.length
            ? model.catLabels.slice(0, 5).map((name, i) => {
                const val = model.catValues[i];
                const pct = Math.round((val / total) * 100);
                const color = c.donut[i % c.donut.length];
                return `
                    <div class="it">
                        <span class="dot" style="background:${color}"></span>
                        <div class="it-info">
                            <span class="it-name">${name}</span>
                            <span class="it-val">${fmtVND(val)} (${pct}%)</span>
                        </div>
                    </div>`;
            }).join("")
            : `<div class="it"><span class="dot" style="background:rgba(255,255,255,.2)"></span><span>${t("misc.other")} (0 ₫)</span></div>`;
    }

    function rebuildCharts() {
        if (!rangeFrom || !rangeTo) return;
        const model = computeAll();
        destroyCharts();
        requestAnimationFrame(() => buildCharts(model));
    }

    // ===== table + modal =====
    function dateYMD(iso) {
        const d = new Date(iso || Date.now());
        return ymd(d);
    }

    function renderTable(model) {
        document.getElementById("kpiRevenue").textContent = fmtVND(model.revenue);
        document.getElementById("kpiProfit").textContent = fmtVND(model.profit);
        document.getElementById("kpiOrders").textContent = String(model.orderCount);
        document.getElementById("kpiItems").textContent = String(model.itemsSold);

        const tb = document.getElementById("orderTbody");
        tb.innerHTML = model.orders.slice(0, 20).map(o => `
      <tr>
        <td><a class="ps-link" href="javascript:void(0)">${o.id}</a></td>
        <td>${dateYMD(o.createdAt)}</td>
        <td>${o.customer?.name || "-"}</td>
        <td>${employeeNameFromOrder(o)}</td>
        <td class="text-end" style="font-weight:900">${fmtVND(o.total)}</td>
        <td class="text-center">
          <button class="ps-actBtn" data-id="${o.id}" title="view"><i class="bi bi-eye"></i></button>
        </td>
      </tr>
    `).join("");

        tb.querySelectorAll(".ps-actBtn").forEach(btn => {
            btn.addEventListener("click", () => openOrder(btn.dataset.id));
        });
    }

    function openOrder(orderId) {
        const o = loadOrders().find(x => x.id === orderId);
        if (!o) return;

        const title = document.getElementById("orderModalTitle");
        title.textContent = `${t("modal.orderDetail")} - ${o.id}`;

        const body = document.getElementById("orderModalBody");
        body.innerHTML = `
      <div class="ps-orderMeta">
        <div class="ps-orderGrid">
          <div class="k">${t("table.date")}</div>      <div class="v">${dateYMD(o.createdAt)}</div>
          <div class="k">${t("table.customer")}</div>  <div class="v">${o.customer?.name || "-"}</div>
          <div class="k">${t("table.employee")}</div>  <div class="v">${employeeNameFromOrder(o)}</div>
        </div>
      </div>

      <div class="ps-orderItems">
        <div class="ttl">${t("modal.products")}</div>
        ${(o.items || []).map(it => `
            <div class="ps-orderItem">
              <i class="bi bi-box-seam"></i>
              <div class="name">${it.name || it.id}</div>
              <div class="qty">x${it.qty || 0}</div>
            </div>
          `).join("")
            }
      </div>
    `;

        document.getElementById("orderModalTotal").textContent = fmtVND(o.total);

        bootstrap.Modal.getOrCreateInstance(document.getElementById("orderModal")).show();
    }

    // ===== refresh =====
    function refreshAll() {
        const model = computeAll();
        renderTable(model);
        rebuildCharts();
    }

    function initRangeUI() {
        const buttons = document.querySelectorAll(".ps-rangebtn");
        const customBox = document.getElementById("customBox");

        buttons.forEach(b => {
            b.addEventListener("click", () => {
                buttons.forEach(x => x.classList.remove("active"));
                b.classList.add("active");

                currentRange = b.dataset.range;

                if (currentRange === "custom") {
                    customBox.style.display = "";
                    // default set dates if empty: last 7 days
                    const now = new Date();
                    const a = new Date(); a.setDate(a.getDate() - 6);
                    document.getElementById("fromDate").value ||= ymd(a);
                    document.getElementById("toDate").value ||= ymd(now);
                    // do not auto refresh until click search
                } else {
                    customBox.style.display = "none";
                    computeRange(currentRange);
                    refreshAll();
                }
            });
        });

        document.getElementById("btnApplyRange")?.addEventListener("click", applyCustomRange);
    }

    function init() {
        // prefs
        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        const savedLang = localStorage.getItem(KEY_LANG) || "vi";
        applyLang(savedLang);
        setTheme(savedTheme);

        initLayout();
        initRangeUI();

        // init default range
        computeRange(currentRange);
        refreshAll();
    }

    init();
})();