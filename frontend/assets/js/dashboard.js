(() => {
    // Sidebar controls
    const app = document.querySelector(".ps-app");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const btnMobileMenu = document.getElementById("btnMobileMenu");
    const btnCollapse = document.getElementById("btnCollapse");
    const btnTheme = document.getElementById("btnTheme");

    // Mobile open/close
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

    // Desktop collapse
    if (btnCollapse) {
        btnCollapse.addEventListener("click", () => {
            app.classList.toggle("sidebar-collapsed");
            const icon = btnCollapse.querySelector("i");
            if (icon) icon.classList.toggle("bi-chevron-left");
            if (icon) icon.classList.toggle("bi-chevron-right");
        });
    }

    // (Optional) theme toggle demo (still dark-first)
    if (btnTheme) {
        btnTheme.addEventListener("click", () => {
            document.body.classList.toggle("theme-light");
            btnTheme.querySelector("i")?.classList.toggle("bi-moon");
            btnTheme.querySelector("i")?.classList.toggle("bi-brightness-high");
        });
    }

    // Charts (Chart.js)
    const commonGrid = {
        color: "rgba(255,255,255,.10)",
    };

    const commonTicks = {
        color: "rgba(255,255,255,.55)",
        font: { size: 11 },
    };

    // Sales Bar
    const salesCtx = document.getElementById("salesBar");
    if (salesCtx) {
        new Chart(salesCtx, {
            type: "bar",
            data: {
                labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
                datasets: [
                    {
                        label: "Revenue (VNĐ)",
                        data: [4.5, 5.6, 4.2, 7.8, 7.1, 9.2, 5.0],
                        backgroundColor: "rgba(59,130,246,.85)",
                        borderRadius: 10,
                        maxBarThickness: 52,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "rgba(15,26,43,.95)",
                        borderColor: "rgba(255,255,255,.08)",
                        borderWidth: 1,
                        titleColor: "rgba(255,255,255,.92)",
                        bodyColor: "rgba(255,255,255,.85)",
                        displayColors: false,
                        callbacks: {
                            label: (ctx) => ` ${ctx.parsed.y}M`,
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: commonTicks,
                    },
                    y: {
                        grid: commonGrid,
                        ticks: {
                            ...commonTicks,
                            callback: (v) => `${v}M`,
                        },
                        suggestedMax: 10,
                    },
                },
            },
        });
    }

    // Orders Line
    const ordersCtx = document.getElementById("ordersLine");
    if (ordersCtx) {
        new Chart(ordersCtx, {
            type: "line",
            data: {
                labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
                datasets: [
                    {
                        label: "Orders",
                        data: [12, 18, 10, 24, 20, 30, 15],
                        borderColor: "rgba(34,211,238,.95)",
                        backgroundColor: "rgba(34,211,238,.12)",
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointHoverRadius: 5,
                        pointBackgroundColor: "rgba(34,211,238,.95)",
                        pointBorderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "rgba(15,26,43,.95)",
                        borderColor: "rgba(255,255,255,.08)",
                        borderWidth: 1,
                        titleColor: "rgba(255,255,255,.92)",
                        bodyColor: "rgba(255,255,255,.85)",
                        displayColors: false,
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: commonTicks,
                    },
                    y: {
                        grid: commonGrid,
                        ticks: commonTicks,
                        suggestedMax: 32,
                    },
                },
            },
        });
    }
})();