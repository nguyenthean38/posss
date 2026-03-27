import api from './api.js?v=6';
import { requireAuth, isAdmin } from './auth.js';

const KEY_THEME = 'ps_theme';
const KEY_LANG = 'ps_lang';

const i18n = {
    vi: {
        // Navigation
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

        // KPI Cards
        "kpi.revenue": "Tổng doanh thu",
        "kpi.orders": "Tổng đơn hàng",
        "kpi.products": "Tổng sản phẩm",
        "kpi.customers": "Tổng khách hàng",

        // Panels
        "panel.salesOverview": "Tổng quan doanh số",
        "panel.orders": "Đơn hàng",
        "panel.recentOrders": "Đơn hàng gần đây",
        "panel.topProducts": "Sản phẩm bán chạy",

        // Table Headers
        "table.customerName": "Tên khách hàng",
        "table.total": "Tổng tiền",
        "table.name": "Tên",
        "table.category": "Danh mục",
        "table.price": "Giá",
        "table.stock": "Tồn kho",
        "table.actions": "Thao tác",

        // Roles
        "role.admin": "Quản trị viên",
        "role.manager": "Quản lý",
        "role.cashier": "Thu ngân",

        // Products
        "product.sold45": "Đã bán 45 sản phẩm",
        "product.sold38": "Đã bán 38 sản phẩm",
        "product.sold67": "Đã bán 67 sản phẩm",
        "product.sold120": "Đã bán 120 sản phẩm",
        "product.case": "Ốp lưng iPhone",

        // Buttons
        "btn.add": "Thêm mới",
        "btn.edit": "Chỉnh sửa",
        "btn.delete": "Xóa",
        "btn.save": "Lưu",
        "btn.cancel": "Hủy",
        "btn.search": "Tìm kiếm",
        "btn.filter": "Lọc",
        "btn.export": "Xuất",

        // Common
        "common.loading": "Đang tải...",
        "common.noData": "Không có dữ liệu",
        "common.error": "Đã xảy ra lỗi",
        "common.success": "Thành công",

        // Shifts & Activity
        "page.shifts": "Điểm danh ca",
        "nav.shifts": "Điểm danh",
        "nav.activity": "Nhật ký",
        "page.activity": "Nhật ký ra vào",
        "sh.date": "Ngày",
        "sh.staff": "Nhân viên",
        "sh.allStaff": "Tất cả",
        "sh.load": "Tải",
        "sh.export": "Xuất CSV",
        "sh.colStaff": "Nhân viên",
        "sh.colIn": "Vào ca",
        "sh.colOut": "Ra ca",
        "sh.colStatus": "Trạng thái",
        "sh.edit": "Sửa",
        "sh.editTitle": "Sửa giờ điểm danh",
        "sh.statusOpen": "Đang mở",
        "sh.statusClosed": "Đã đóng",
        "sh.statusAdj": "Đã chỉnh",
        "act.searchPh": "Tìm theo chi tiết, tên hoặc email nhân viên...",
        "act.search": "Tìm",
        "act.colTime": "Thời gian",
        "act.colUser": "Nhân viên",
        "act.colDetails": "Chi tiết",
        "role.staff": "Nhân viên",
    },
    en: {
        // Navigation
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

        // KPI Cards
        "kpi.revenue": "Total Revenue",
        "kpi.orders": "Total Orders",
        "kpi.products": "Total Products",
        "kpi.customers": "Total Customers",

        // Panels
        "panel.salesOverview": "Sales Overview",
        "panel.orders": "Orders",
        "panel.recentOrders": "Recent Orders",
        "panel.topProducts": "Top Products",

        // Table Headers
        "table.customerName": "Customer Name",
        "table.total": "Total",
        "table.name": "Name",
        "table.category": "Category",
        "table.price": "Price",
        "table.stock": "Stock",
        "table.actions": "Actions",

        // Roles
        "role.admin": "Administrator",
        "role.manager": "Manager",
        "role.cashier": "Cashier",

        // Products
        "product.sold45": "45 products sold",
        "product.sold38": "38 products sold",
        "product.sold67": "67 products sold",
        "product.sold120": "120 products sold",
        "product.case": "iPhone Case",

        // Buttons
        "btn.add": "Add New",
        "btn.edit": "Edit",
        "btn.delete": "Delete",
        "btn.save": "Save",
        "btn.cancel": "Cancel",
        "btn.search": "Search",
        "btn.filter": "Filter",
        "btn.export": "Export",

        // Common
        "common.loading": "Loading...",
        "common.noData": "No data available",
        "common.error": "An error occurred",
        "common.success": "Success",

        // Shifts & Activity
        "page.shifts": "Shift attendance",
        "nav.shifts": "Shifts",
        "nav.activity": "Activity",
        "page.activity": "Activity Log",
        "sh.date": "Date",
        "sh.staff": "Staff",
        "sh.allStaff": "All",
        "sh.load": "Load",
        "sh.export": "Export CSV",
        "sh.colStaff": "Staff",
        "sh.colIn": "Clock-in",
        "sh.colOut": "Clock-out",
        "sh.colStatus": "Status",
        "sh.edit": "Edit",
        "sh.editTitle": "Edit attendance times",
        "sh.statusOpen": "Open",
        "sh.statusClosed": "Closed",
        "sh.statusAdj": "Adjusted",
        "act.searchPh": "Search by details, name or email...",
        "act.search": "Search",
        "act.colTime": "Time",
        "act.colUser": "User",
        "act.colDetails": "Details",
        "role.staff": "Staff",
    }
};

function getLang() { return localStorage.getItem(KEY_LANG) || 'vi'; }
function t(k) { return i18n[getLang()]?.[k] || i18n.en[k] || k; }

function applyLang(lang) {
    document.documentElement.lang = lang;
    const dict = i18n[lang] || i18n.en;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
        const key = el.getAttribute('data-i18n-ph');
        if (dict[key]) el.setAttribute('placeholder', dict[key]);
    });
    document.querySelectorAll('.ps-nav__item[data-tooltip]').forEach((a) => {
        const span = a.querySelector('span[data-i18n]');
        if (span) a.setAttribute('data-tooltip', span.textContent.trim());
    });
    const ll = document.getElementById('langLabel');
    if (ll) ll.textContent = (lang || 'en').toUpperCase();
    localStorage.setItem(KEY_LANG, lang);
}

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function fmtDisplay(isoOrDb) {
    if (!isoOrDb) return '—';
    const s = String(isoOrDb);
    const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString(getLang() === 'vi' ? 'vi-VN' : 'en-GB', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function dbToDatetimeLocal(db) {
    if (!db) return '';
    const m = String(db).match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/);
    if (!m) return '';
    return `${m[1]}T${m[2]}:${m[3]}`;
}

function localToDb(val) {
    if (!val) return '';
    const [d, t] = val.split('T');
    if (!d || !t) return '';
    const [hh, mm] = t.split(':');
    return `${d} ${hh}:${mm}:00`;
}

function toast(msg) {
    const el = document.getElementById('toast');
    const tx = document.getElementById('toastText');
    if (tx) tx.textContent = msg;
    if (el) { el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2400); }
}

function statusLabel(st) {
    if (st === 'open') return t('sh.statusOpen');
    if (st === 'adjusted') return t('sh.statusAdj');
    return t('sh.statusClosed');
}

(async () => {
    await requireAuth();
    if (!isAdmin()) {
        window.location.replace('dashboard.html');
        return;
    }

    const savedTheme = localStorage.getItem(KEY_THEME) || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    applyLang(getLang());

    function initLayout() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const btnMobileMenu = document.getElementById('btnMobileMenu');
        const btnCollapse = document.getElementById('btnCollapse');
        const app = document.querySelector('.ps-app');
        if (btnMobileMenu && sidebar && overlay) {
            btnMobileMenu.addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('show'); });
            overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); });
        }
        if (btnCollapse && app) {
            btnCollapse.addEventListener('click', () => {
                app.classList.toggle('sidebar-collapsed');
                const ic = btnCollapse.querySelector('i');
                if (ic) { ic.classList.toggle('bi-chevron-left'); ic.classList.toggle('bi-chevron-right'); }
            });
        }
    }
    initLayout();

    document.getElementById('btnTheme')?.addEventListener('click', () => {
        const cur = document.body.getAttribute('data-theme') || 'dark';
        document.body.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
        localStorage.setItem(KEY_THEME, cur === 'dark' ? 'light' : 'dark');
    });
    document.getElementById('btnLang')?.addEventListener('click', () => {
        applyLang(getLang() === 'vi' ? 'en' : 'vi');
    });

    const dateInput = document.getElementById('dateInput');
    const staffFilter = document.getElementById('staffFilter');
    const tbody = document.getElementById('tbody');

    const today = new Date();
    const y = today.getFullYear();
    const mo = String(today.getMonth() + 1).padStart(2, '0');
    const da = String(today.getDate()).padStart(2, '0');
    if (dateInput) dateInput.value = `${y}-${mo}-${da}`;

    try {
        const staffRes = await api.getStaff({ limit: 200 });
        const list = staffRes.items || staffRes || [];
        for (const s of list) {
            if (s.role && s.role !== 'staff') continue;
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.full_name || ''} (${s.email || ''})`;
            staffFilter?.appendChild(opt);
        }
    } catch (e) { console.warn(e); }

    let editModal = null;

    async function load() {
        const dt = dateInput?.value;
        if (!dt) return;
        const uid = staffFilter?.value ? parseInt(staffFilter.value, 10) : null;
        const params = { date: dt };
        if (uid) params.user_id = uid;
        try {
            const res = await api.getAdminShifts(params);
            const items = res.items || [];
            if (!tbody) return;
            tbody.innerHTML = items.length
                ? items.map((r) => `
                    <tr data-id="${escapeHtml(r.id)}">
                        <td>${escapeHtml(r.user_name || '')}<div class="small opacity-60">${escapeHtml(r.user_email || '')}</div></td>
                        <td>${escapeHtml(fmtDisplay(r.clock_in_at_iso || r.clock_in_at))}</td>
                        <td>${escapeHtml(fmtDisplay(r.clock_out_at_iso || r.clock_out_at))}</td>
                        <td>${escapeHtml(statusLabel(r.status))}</td>
                        <td><button type="button" class="ps-btn-primary ps-btn-sm py-1 px-3 btn-edit">${escapeHtml(t('sh.edit'))}</button></td>
                    </tr>`).join('')
                : '<tr><td colspan="5" class="text-center opacity-50 py-4">—</td></tr>';

            tbody.querySelectorAll('.btn-edit').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const tr = btn.closest('tr');
                    const id = tr?.dataset.id;
                    const row = items.find((x) => String(x.id) === String(id));
                    if (!row) return;
                    document.getElementById('editId').value = row.id;
                    document.getElementById('editIn').value = dbToDatetimeLocal(row.clock_in_at);
                    document.getElementById('editOut').value = dbToDatetimeLocal(row.clock_out_at || '');
                    document.getElementById('editReason').value = '';
                    if (!editModal) editModal = new bootstrap.Modal(document.getElementById('editModal'));
                    editModal.show();
                });
            });
        } catch (e) {
            toast(e.message || t('toast.err'));
        }
    }

    document.getElementById('btnLoad')?.addEventListener('click', load);
    document.getElementById('btnExport')?.addEventListener('click', async () => {
        const dt = dateInput?.value;
        if (!dt) { toast(t('toast.err')); return; }
        const uid = staffFilter?.value ? parseInt(staffFilter.value, 10) : null;
        const params = { date: dt };
        if (uid) params.user_id = uid;
        try {
            await api.downloadAdminShiftsExport(params);
        } catch (e) {
            toast(e.message || t('toast.err'));
        }
    });

    document.getElementById('btnSaveEdit')?.addEventListener('click', async () => {
        const id = document.getElementById('editId').value;
        const reason = document.getElementById('editReason').value.trim();
        const cin = localToDb(document.getElementById('editIn').value);
        const coutRaw = document.getElementById('editOut').value;
        const cout = coutRaw ? localToDb(coutRaw) : '';
        try {
            await api.adminPatchShift(id, {
                reason,
                clock_in_at: cin,
                clock_out_at: cout || null,
            });
            toast(t('toast.ok'));
            editModal?.hide();
            await load();
        } catch (e) {
            toast(e.message || t('toast.err'));
        }
    });

    await load();
})();
