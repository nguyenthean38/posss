import api from './api.js?v=9';
import { requireAuth, isAdmin } from './auth.js';
import { initAiChatWidget } from './ai-chat-widget.js?v=2';
import { i18n } from './shared.js';

const KEY_THEME = 'ps_theme';
const KEY_LANG = 'ps_lang';

function getLang() { return localStorage.getItem(KEY_LANG) || 'vi'; }
const t = (k) => i18n[getLang()]?.[k] || i18n.en[k] || k;

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
                        <td><button type="button" class="btn btn-sm btn-outline-primary btn-edit">${escapeHtml(t('sh.edit'))}</button></td>
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

    document.getElementById('btnLang')?.addEventListener('click', () => {
        applyLang(getLang() === 'vi' ? 'en' : 'vi');
        void load();
    });

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
    initAiChatWidget();
})();
