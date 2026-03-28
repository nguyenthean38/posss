// Reports Module - Real API Integration
import API from './api.js?v=9';
import { requireAuth, getUser } from './auth.js';
import { initAiChatWidget } from './ai-chat-widget.js?v=2';
import { i18n } from './shared.js';

(() => {
    requireAuth();

    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";


    const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
    const t = (k) => i18n[getLang()]?.[k] || i18n.en[k] || k;
    const fmtVND = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "\u00A0₫";

    function escapeHtml(s) {
        if (s == null || s === "") return "";
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    /** Chuẩn hóa số tiền từ API (tránh parseFloat("133.321.000") -> 133 làm cột tí hon / không thấy) */
    function parseMoneyNumber(v) {
        if (v == null || v === "") return 0;
        if (typeof v === "number" && Number.isFinite(v)) return v;
        const s = String(v).trim().replace(/\s/g, "");
        if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
            return parseFloat(s.replace(/\./g, "")) || 0;
        }
        const n = Number(String(s).replace(/,/g, "."));
        return Number.isFinite(n) ? n : 0;
    }

    /**
     * Một ngày (from === to): đảm bảo cột khớp KPI; nếu chart rỗng/sai nhưng KPI > 0 thì dùng KPI.
     */
    function normalizeDailyForChart(fromYmd, toYmd, points, kpiRaw) {
        const kpi = parseMoneyNumber(kpiRaw);
        const pts = (points || []).map((p) => ({
            label: p.label,
            value: parseMoneyNumber(p.value),
        }));
        const sum = pts.reduce((s, p) => s + p.value, 0);

        if (fromYmd === toYmd) {
            if (kpi > 0 && (pts.length === 0 || sum <= 0)) {
                return [{ label: labelDay(fromYmd), value: kpi }];
            }
            if (pts.length === 1) {
                return [{ ...pts[0], value: Math.max(pts[0].value, kpi) }];
            }
        }
        return pts;
    }

    function toast(msg) {
        const el = document.getElementById("toast");
        const txt = document.getElementById("toastText");
        if (!el || !txt) return;
        txt.textContent = msg;
        el.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => el.classList.remove("show"), 3500);
    }

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
        rebuildCharts();
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
            refreshAll();
        });
    }

    function ymd(d) {
        const x = new Date(d);
        const yyyy = x.getFullYear();
        const mm = String(x.getMonth() + 1).padStart(2, "0");
        const dd = String(x.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    function labelDay(d) {
        if (d == null || d === "") return "-";
        const s = String(d);
        // Tranh lech ngay khi parse "YYYY-MM-DD" (UTC midnight co the thanh ngay hom truoc o GMT+7)
        let x;
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const [y, m, dd] = s.split("-").map(Number);
            x = new Date(y, m - 1, dd);
        } else {
            x = new Date(d);
        }
        const dd = String(x.getDate()).padStart(2, "0");
        const mm = String(x.getMonth() + 1).padStart(2, "0");
        return `${dd}/${mm}`;
    }

    /** Chuẩn hóa label từ API chart (DATE MySQL) thành YYYY-MM-DD */
    function normalizeChartDateKey(label) {
        if (label == null || label === "") return "";
        const s = String(label).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        if (/^\d{4}-\d{2}-\d{2}[\sT]/.test(s)) return s.slice(0, 10);
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? "" : ymd(d);
    }

    /** Mỗi ngày trong [rangeStart, rangeEnd] có một điểm (0 nếu không có đơn) — tránh biểu đồ tháng chỉ vài mốc */
    function fillDailySeries(rangeStart, rangeEnd, chartDataRows) {
        const map = new Map();
        for (const row of chartDataRows || []) {
            const key = normalizeChartDateKey(row.label);
            if (!key) continue;
            const v = parseMoneyNumber(row.value);
            map.set(key, (map.get(key) || 0) + v);
        }
        const out = [];
        const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
        const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
        while (cur <= end) {
            const key = ymd(cur);
            out.push({ label: labelDay(key), value: map.has(key) ? map.get(key) : 0 });
            cur.setDate(cur.getDate() + 1);
        }
        return out;
    }

    let currentRange = "last7";
    let rangeFrom = null;
    let rangeTo = null;

    function computeRange(kind) {
        const now = new Date();
        if (kind === "today") {
            rangeFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            rangeTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        } else if (kind === "yesterday") {
            const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            rangeFrom = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
            rangeTo = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
        } else if (kind === "last7") {
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
            rangeFrom = start;
            rangeTo = end;
        } else if (kind === "month") {
            rangeFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            rangeTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }
    }

    function applyCustomRange() {
        const f = document.getElementById("fromDate").value;
        const t_ = document.getElementById("toDate").value;
        if (!f || !t_) return;
        rangeFrom = new Date(f);
        rangeTo = new Date(t_);
        currentRange = "custom";
        document.querySelectorAll(".ps-rangebtn").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.range === "custom");
        });
        refreshAll();
    }

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

    function destroyRevChart() {
        if (revChart) { revChart.destroy(); revChart = null; }
    }

    function destroyDonutChart() {
        if (donutChart) { donutChart.destroy(); donutChart = null; }
    }

    function destroyCharts() {
        destroyRevChart();
        destroyDonutChart();
    }

    function setRevenueChartEmpty(show) {
        const canvas = document.getElementById("revLine");
        const empty = document.getElementById("revChartEmpty");
        if (!canvas || !empty) return;
        if (show) {
            empty.textContent = t("chart.noData");
            empty.removeAttribute("hidden");
            canvas.style.visibility = "hidden";
        } else {
            empty.setAttribute("hidden", "");
            canvas.style.visibility = "visible";
        }
    }

    function buildCharts(model, kpiRevenue, rangeKind) {
        const c = chartColors();
        const rk = rangeKind || currentRange;
        const rawDaily = (model.daily || []).map((x) => ({
            label: x.label,
            value: parseMoneyNumber(x.value),
        }));
        const kpi = parseMoneyNumber(kpiRevenue);
        const dataMax = rawDaily.reduce((m, x) => Math.max(m, x.value), 0);
        const sumDaily = rawDaily.reduce((s, x) => s + x.value, 0);
        const isRevenueEmpty = kpi <= 0 && sumDaily <= 0;

        if (isRevenueEmpty) {
            destroyRevChart();
            setRevenueChartEmpty(true);
        } else {
            setRevenueChartEmpty(false);
            const daily = rawDaily;
            const axisTop = Math.max(dataMax, kpi, 0) * 1.05;
            const yScaleMax = axisTop > 0 ? Math.ceil(Number(axisTop)) : 1;
            const yCap = yScaleMax;

            // Hôm nay / Hôm qua / Tháng này: cột; 7 ngày: line; Tùy chọn ≤31 ngày: cột
            const useBar =
                rk === "today" ||
                rk === "yesterday" ||
                rk === "month" ||
                (rk === "custom" && daily.length <= 31);
            const pointRadius = !useBar && daily.length <= 12 ? 4 : !useBar ? 2 : 0;
            const pointHoverRadius = !useBar ? Math.max(pointRadius, 4) : 4;
            const denseX = daily.length > 10;

            const ctx1 = document.getElementById("revLine");
            destroyRevChart();
            const enforceYPlugin = {
                id: "enforceRevenueYAxis",
                afterLayout(chart) {
                    const yS = chart.scales.y;
                    if (!yS || !Number.isFinite(yCap) || yCap <= 0) return;
                    yS.options.min = 0;
                    yS.options.max = yCap;
                },
            };
            revChart = new Chart(ctx1, {
                type: useBar ? "bar" : "line",
                data: {
                    labels: daily.map((x) => x.label),
                    datasets: [
                        useBar
                            ? {
                                data: daily.map((x) => x.value),
                                backgroundColor: "rgba(59, 130, 246, 0.72)",
                                borderColor: "rgba(37, 99, 235, 0.95)",
                                borderWidth: 1,
                                borderRadius: 4,
                            }
                            : {
                                data: daily.map((x) => x.value),
                                borderColor: c.line,
                                backgroundColor: c.fill,
                                fill: true,
                                tension: 0.35,
                                pointRadius,
                                pointHoverRadius,
                                borderWidth: 2,
                            },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    ...(useBar
                        ? {
                            datasets: {
                                bar: {
                                    categoryPercentage: denseX ? 0.9 : 0.75,
                                    barPercentage: denseX ? 0.75 : 0.85,
                                    maxBarThickness: denseX ? 28 : 120,
                                },
                            },
                        }
                        : {}),
                    interaction: { mode: "nearest", axis: "x", intersect: useBar },
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
                                label: (ctx) => {
                                    const y = ctx.parsed && typeof ctx.parsed.y === "number" ? ctx.parsed.y : 0;
                                    return fmtVND(y);
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: c.ticks,
                                font: { size: denseX ? 9 : 11 },
                                maxRotation: denseX ? 45 : 0,
                                autoSkip: true,
                                maxTicksLimit: denseX ? 31 : 14,
                            },
                            offset: true,
                        },
                        y: {
                            type: "linear",
                            min: 0,
                            max: yScaleMax,
                            grace: 0,
                            grid: { color: c.grid },
                            ticks: {
                                color: c.ticks,
                                font: { size: 11 },
                                callback: (raw) => {
                                    const v = Number(raw);
                                    if (!Number.isFinite(v)) return "";
                                    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(0) + "M";
                                    if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(0) + "k";
                                    return String(Math.round(v));
                                },
                            },
                        },
                    },
                },
                plugins: [enforceYPlugin],
            });
        }

        const rawL = model.catLabels || [];
        const rawV = model.catValues || [];
        const catPairs = rawL
            .map((name, i) => ({ name, val: parseMoneyNumber(rawV[i]) }))
            .filter((p) => p.val > 0);
        const dLabels = catPairs.map((p) => p.name);
        const dVals = catPairs.map((p) => p.val);

        const ctx2 = document.getElementById("catDonut");
        donutChart = new Chart(ctx2, {
            type: "doughnut",
            data: {
                labels: dLabels,
                datasets: [{
                    data: dVals.length ? dVals : [1],
                    backgroundColor: dVals.length ? dLabels.map((_, i) => c.donut[i % c.donut.length]) : ["rgba(255,255,255,.10)"],
                    borderWidth: 1,
                }],
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
                            label: (ctx) => {
                                const v = typeof ctx.parsed === "number" ? ctx.parsed : 0;
                                return `${ctx.label}: ${fmtVND(v)}`;
                            },
                        },
                    },
                },
            },
        });

        const legend = document.getElementById("catLegend");
        const total = dVals.reduce((s, x) => s + x, 0) || 1;
        legend.innerHTML = dLabels.length
            ? dLabels.slice(0, 5).map((name, i) => {
                const val = dVals[i];
                const pct = Math.round((val / total) * 100);
                const color = c.donut[i % c.donut.length];
                return `<div class="it"><span class="dot" style="background:${color}"></span><div class="it-info"><span class="it-name">${name}</span><span class="it-val">${fmtVND(val)} (${pct}%)</span></div></div>`;
            }).join("")
            : `<div class="it"><span class="dot" style="background:rgba(255,255,255,.2)"></span><span>${t("chart.noData")}</span></div>`;
    }

    function rebuildCharts() {
        if (!rangeFrom || !rangeTo) return;
        destroyCharts();
        requestAnimationFrame(() => refreshAll());
    }

    function dateYMD(iso) {
        const d = new Date(iso || Date.now());
        return ymd(d);
    }

    async function refreshAll() {
        try {
            const from = ymd(rangeFrom);
            const to = ymd(rangeTo);

            // [1] Summary KPIs + CategoryBreakdown (doanh thu theo danh muc cho donut)
            const summary = await API.reports.getSummary(from, to);
            document.getElementById("kpiRevenue").textContent = fmtVND(summary.TotalRevenue);
            document.getElementById("kpiOrders").textContent = String(summary.OrderCount || 0);
            document.getElementById("kpiItems").textContent = String(summary.TotalProductsSold || 0);

            const catRows = summary.CategoryBreakdown || [];
            const catLabels = catRows.map((c) => c.CategoryName || "");
            const catValues = catRows.map((c) => parseMoneyNumber(c.Revenue));

            // [2] Profit - admin only, from /api/reports/profit
            try {
                const profit = await API.request(`/api/reports/profit?fromDate=${from}&toDate=${to}`);
                document.getElementById("kpiProfit").textContent = fmtVND(profit.NetProfit);
            } catch (_) {
                document.getElementById("kpiProfit").textContent = "—";
            }

            // [3] Orders list - backend: items[{OrderId, Date, CustomerName, StaffName, TotalAmount, ItemsSummary}]
            const ordersResp = await API.request(`/api/reports/orders?fromDate=${from}&toDate=${to}&page=1&pageSize=20`);
            const orders = ordersResp.items || [];
            const tb = document.getElementById("orderTbody");
            tb.innerHTML = orders.length
                ? orders.map((o) => {
                    const rawItems = (o.ItemsSummary != null ? String(o.ItemsSummary) : (o.itemssummary != null ? String(o.itemssummary) : "")).trim();
                    const itemsEsc = escapeHtml(rawItems);
                    const productsCell = rawItems
                        ? `<td class="ps-orderProducts"><span class="ps-orderProducts__text" title="${itemsEsc}">${itemsEsc}</span></td>`
                        : `<td class="ps-orderProducts">—</td>`;
                    return `
                    <tr>
                        <td><a class="ps-link" href="javascript:void(0)">#${o.OrderId}</a></td>
                        <td>${o.Date || "-"}</td>
                        <td>${o.CustomerName || t("customer.walkIn")}</td>
                        <td>${o.StaffName || "—"}</td>
                        ${productsCell}
                        <td class="text-end" style="font-weight:900">${fmtVND(o.TotalAmount)}</td>
                        <td class="text-center">
                            <button class="ps-actBtn" data-id="${o.OrderId}" title="view"><i class="bi bi-eye"></i></button>
                        </td>
                    </tr>`;
                }).join("")
                : `<tr><td colspan="7" class="text-center" style="opacity:.5">${t("reports.noOrdersInRange")}</td></tr>`;

            tb.querySelectorAll(".ps-actBtn").forEach(btn => {
                btn.addEventListener("click", () => openOrder(btn.dataset.id));
            });

            // [4] Charts - duong ngay tu /api/reports/chart; donut danh muc tu CategoryBreakdown o summary
            try {
                const chartData = await API.request(`/api/reports/chart?type=revenue&period=day&fromDate=${from}&toDate=${to}`);
                const filled = fillDailySeries(rangeFrom, rangeTo, chartData || []);
                const dailyNorm = normalizeDailyForChart(from, to, filled, summary.TotalRevenue);
                const model = {
                    daily: dailyNorm,
                    catLabels,
                    catValues,
                };
                const kpiTotal = parseMoneyNumber(summary.TotalRevenue);
                destroyCharts();
                buildCharts(model, kpiTotal, currentRange);
            } catch (chartErr) {
                console.error("Chart error:", chartErr);
                toast(chartErr.message || t("toast.error"));
                const kpiTotal = parseMoneyNumber(summary.TotalRevenue);
                destroyCharts();
                buildCharts({ daily: [], catLabels, catValues }, kpiTotal, currentRange);
            }
        } catch (err) {
            console.error("Refresh error:", err);
            toast(err.message || t("toast.reportFail"));
        }
    }

    async function openOrder(orderId) {
        try {
            // GET /api/customers/orders/{orderId} -> { products, customer_pay, change, total_amount }
            const o = await API.pos.getOrderById(orderId);
            if (!o) return;

            const title = document.getElementById("orderModalTitle");
            title.textContent = `${t("modal.orderDetail")} #${orderId}`;

            const body = document.getElementById("orderModalBody");
            body.innerHTML = `
          <div class="ps-orderItems">
            <div class="ttl">${t("modal.products")}</div>
            ${(o.products || []).map(it => `
                <div class="ps-orderItem">
                  <i class="bi bi-box-seam"></i>
                  <div class="name">${it.product_name || "-"}</div>
                  <div class="qty">x${it.quantity || 0} &times; ${fmtVND(it.unit_price)}</div>
                </div>`).join("")}
          </div>
          <div class="ps-orderMeta mt-2">
            <div class="ps-orderGrid">
              <div class="k">${t("modal.customerPay")}</div><div class="v">${fmtVND(o.customer_pay)}</div>
              <div class="k">${t("modal.changeAmount")}</div><div class="v">${fmtVND(o.change)}</div>
            </div>
          </div>`;

            document.getElementById("orderModalTotal").textContent = fmtVND(o.total_amount);
            bootstrap.Modal.getOrCreateInstance(document.getElementById("orderModal")).show();
        } catch (err) {
            console.error('Order error:', err);
        }
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
                    const now = new Date();
                    const a = new Date(); a.setDate(a.getDate() - 6);
                    document.getElementById("fromDate").value ||= ymd(a);
                    document.getElementById("toDate").value ||= ymd(now);
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
        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        const savedLang = localStorage.getItem(KEY_LANG) || "vi";
        applyLang(savedLang);
        setTheme(savedTheme);

        initLayout();
        initRangeUI();

        const u = getUser();
        if (u && u.role === "staff") {
            currentRange = "today";
            document.querySelectorAll(".ps-rangebtn").forEach((b) => {
                if (b.dataset.range !== "today") {
                    b.style.display = "none";
                } else {
                    b.classList.add("active");
                }
                if (b.dataset.range === "last7") {
                    b.classList.remove("active");
                }
            });
            const customBox = document.getElementById("customBox");
            if (customBox) {
                customBox.style.display = "none";
            }
            if (!document.getElementById("staffReportHint")) {
                const bar = document.querySelector(".ps-rangebar");
                if (bar) {
                    const p = document.createElement("p");
                    p.id = "staffReportHint";
                    p.className = "small mb-2";
                    p.style.opacity = "0.85";
                    p.setAttribute("data-i18n", "reports.staffScopeHint");
                    bar.parentNode.insertBefore(p, bar);
                }
            }
            computeRange("today");
            applyLang(savedLang);
        } else {
            computeRange(currentRange);
        }
        refreshAll();

        let lastReportSurfaceRefresh = 0;
        function refreshWhenReportSurfaceVisible() {
            if (document.hidden) return;
            const now = Date.now();
            if (now - lastReportSurfaceRefresh < 1500) return;
            lastReportSurfaceRefresh = now;
            refreshAll();
        }
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) refreshWhenReportSurfaceVisible();
        });
        window.addEventListener("focus", () => refreshWhenReportSurfaceVisible());

        initAiChatWidget();
    }

    init();
})();

