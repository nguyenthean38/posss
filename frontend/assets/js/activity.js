import api from './api.js?v=8';
import { requireAuth, isAdmin } from './auth.js';

const KEY_THEME = 'ps_theme';
const KEY_LANG = 'ps_lang';
const LIMIT = 50;

const i18n = {
    vi: {
        'page.activity': 'Nhật ký ra vào',
        'role.admin': 'Quản trị viên',
        'nav.dashboard': 'Tổng quan',
        'nav.pos': 'Bán hàng',
        'nav.products': 'Sản phẩm',
        'nav.categories': 'Danh mục',
        'nav.employees': 'Nhân viên',
        'nav.customers': 'Khách hàng',
        'nav.reports': 'Báo cáo',
        'nav.shifts': 'Điểm danh',
        'nav.activity': 'Nhật ký',
        'nav.profile': 'Hồ sơ',
        'nav.logout': 'Đăng xuất',
        'nav.collapse': 'Thu gọn',
        'act.searchPh': 'Tìm theo chi tiết, tên hoặc email nhân viên...',
        'act.search': 'Tìm',
        'act.colTime': 'Thời gian',
        'act.colUser': 'Nhân viên',
        'act.colDetails': 'Chi tiết',
        'act.empty': 'Chưa có bản ghi',
        'act.page': 'Trang',
        'toast.error': 'Có lỗi xảy ra',
    },
    en: {
        'page.activity': 'Staff sign-in log',
        'role.admin': 'Administrator',
        'nav.dashboard': 'Dashboard',
        'nav.pos': 'Point of Sale',
        'nav.products': 'Products',
        'nav.categories': 'Categories',
        'nav.employees': 'Employees',
        'nav.customers': 'Customers',
        'nav.reports': 'Reports',
        'nav.shifts': 'Shifts',
        'nav.activity': 'Activity',
        'nav.profile': 'Profile',
        'nav.logout': 'Logout',
        'nav.collapse': 'Collapse',
        'act.searchPh': 'Search by detail, name or staff email...',
        'act.search': 'Search',
        'act.colTime': 'Time',
        'act.colUser': 'Staff',
        'act.colDetails': 'Details',
        'act.empty': 'No records',
        'act.page': 'Page',
        'toast.error': 'An error occurred',
    },
};

function getLang() {
    return localStorage.getItem(KEY_LANG) || 'vi';
}

function t(k) {
    return i18n[getLang()]?.[k] || i18n.en[k] || k;
}

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function fmtTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return escapeHtml(String(iso));
    const loc = getLang() === 'vi' ? 'vi-VN' : 'en-GB';
    return escapeHtml(
        d.toLocaleString(loc, {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
    );
}

function toast(msg, variant = 'error') {
    const el = document.getElementById('toast');
    const txt = document.getElementById('toastText');
    const icon = document.getElementById('toastIcon');
    if (!el || !txt) return;
    txt.textContent = msg;
    const isErr = variant === 'error';
    el.classList.toggle('ps-toast--error', isErr);
    if (icon) icon.className = isErr ? 'bi bi-exclamation-circle' : 'bi bi-check2-circle';
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2500);
}

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
    const lbl = document.getElementById('langLabel');
    if (lbl) lbl.textContent = lang.toUpperCase();
    localStorage.setItem(KEY_LANG, lang);
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(KEY_THEME, theme);
    const icon = document.getElementById('btnTheme')?.querySelector('i');
    if (icon) icon.className = theme === 'dark' ? 'bi bi-moon-stars' : 'bi bi-brightness-high';
}

let page = 1;
let keyword = '';
let pagination = { page: 1, total_pages: 1, total: 0, limit: LIMIT };

async function loadLogs() {
    const tbody = document.getElementById('logBody');
    const info = document.getElementById('pageInfo');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">...</td></tr>`;
    try {
        const res = await api.getActivityLogs({ page, limit: LIMIT, q: keyword });
        const items = res.items || [];
        pagination = res.pagination || pagination;
        if (!items.length) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">${escapeHtml(t('act.empty'))}</td></tr>`;
        } else {
            tbody.innerHTML = items.map((row) => {
                const who = row.user_name || row.user_email || (row.user_id ? `#${row.user_id}` : '-');
                return `<tr>
                  <td class="text-nowrap small">${fmtTime(row.created_at)}</td>
                  <td>${escapeHtml(who)}</td>
                  <td class="small">${escapeHtml(row.details || '')}</td>
                </tr>`;
            }).join('');
        }
        const p = pagination.page || page;
        const tp = pagination.total_pages || 1;
        const tot = pagination.total ?? 0;
        if (info) {
            info.textContent = `${t('act.page')} ${p} / ${tp} — ${tot}`;
        }
        if (btnPrev) btnPrev.disabled = p <= 1;
        if (btnNext) btnNext.disabled = p >= tp;
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-4">${escapeHtml(t('toast.error'))}</td></tr>`;
        toast(e.message || t('toast.error'), 'error');
    }
}

function initLayout() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const btnMobileMenu = document.getElementById('btnMobileMenu');
    const btnCollapse = document.getElementById('btnCollapse');
    const openSidebar = () => { sidebar.classList.add('open'); overlay.classList.add('show'); };
    const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); };
    btnMobileMenu?.addEventListener('click', openSidebar);
    overlay?.addEventListener('click', closeSidebar);
    btnCollapse?.addEventListener('click', () => {
        document.querySelector('.ps-app').classList.toggle('sidebar-collapsed');
        const icon = btnCollapse.querySelector('i');
        icon?.classList.toggle('bi-chevron-left');
        icon?.classList.toggle('bi-chevron-right');
    });
    document.getElementById('btnTheme')?.addEventListener('click', () => {
        const cur = document.body.getAttribute('data-theme') || 'dark';
        setTheme(cur === 'dark' ? 'light' : 'dark');
    });
    document.getElementById('btnLang')?.addEventListener('click', () => {
        const next = getLang() === 'vi' ? 'en' : 'vi';
        applyLang(next);
    });
}

(async () => {
    await requireAuth();
    if (!isAdmin()) {
        window.location.replace('dashboard.html');
        return;
    }
    setTheme(localStorage.getItem(KEY_THEME) || 'dark');
    applyLang(getLang());
    initLayout();
    document.getElementById('btnSearch')?.addEventListener('click', () => {
        keyword = (document.getElementById('searchInput')?.value || '').trim();
        page = 1;
        loadLogs();
    });
    document.getElementById('searchInput')?.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            keyword = (ev.target.value || '').trim();
            page = 1;
            loadLogs();
        }
    });
    document.getElementById('btnPrev')?.addEventListener('click', () => {
        if (page > 1) { page -= 1; loadLogs(); }
    });
    document.getElementById('btnNext')?.addEventListener('click', () => {
        if (page < (pagination.total_pages || 1)) { page += 1; loadLogs(); }
    });
    await loadLogs();
})();