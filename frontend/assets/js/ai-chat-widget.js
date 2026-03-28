/**
 * Trợ lý AI — dùng chung mọi trang app; lịch sử trong sessionStorage.
 */
import api from './api.js?v=9';
import { t } from './shared.js';

const KEY_LANG = 'ps_lang';
const STORAGE_CHAT = 'ps_ai_chat_session';
const STORAGE_PANEL = 'ps_ai_panel_open';

const aiI18n = {
    vi: {
        'ai.title': 'PhoneStore xin chào!',
        'ai.subtitle': 'Doanh thu, đơn hàng, báo cáo · 1900 54 54 63',
        'ai.emptyLead': 'Gợi ý câu hỏi:',
        'ai.hint1': 'Doanh thu hôm nay thế nào?',
        'ai.hint2': 'Top sản phẩm bán chạy?',
        'ai.hint3': 'Tổng đơn tuần này?',
        'ai.placeholder': 'Ví dụ: Doanh thu hôm nay thế nào?',
        'ai.send': 'Gửi',
        'ai.inputLabel': 'Nhập câu hỏi',
        'ai.fabTitle': 'Mở trợ lý AI',
        'ai.close': 'Đóng',
    },
    en: {
        'ai.title': 'PhoneStore says hi!',
        'ai.subtitle': 'Revenue, orders, reports · 1900 54 54 63',
        'ai.emptyLead': 'Suggested questions:',
        'ai.hint1': "How is today's revenue?",
        'ai.hint2': 'Top selling products?',
        'ai.hint3': 'Total orders this week?',
        'ai.placeholder': "e.g. How is today's revenue?",
        'ai.send': 'Send',
        'ai.inputLabel': 'Your question',
        'ai.fabTitle': 'Open AI assistant',
        'ai.close': 'Close',
    },
};

function getLang() {
    return localStorage.getItem(KEY_LANG) || 'vi';
}

/** Áp chuỗi ai.* cho widget (gọi sau đổi ngôn ngữ nếu cần). */
export function applyAiChatWidgetI18n() {
    const dict = aiI18n[getLang()] || aiI18n.en;
    const panel = document.getElementById('aiPanel');
    if (!panel) return;

    panel.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (key && dict[key]) el.textContent = dict[key];
    });
    panel.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key && dict[key]) el.setAttribute('placeholder', dict[key]);
    });
    const fab = document.getElementById('btnAiFab');
    if (fab) {
        const key = fab.getAttribute('data-i18n-tooltip');
        if (key && dict[key]) fab.setAttribute('title', dict[key]);
    }
    panel.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
        const key = el.getAttribute('data-i18n-aria-label');
        if (key && dict[key]) el.setAttribute('aria-label', dict[key]);
    });
}

export function initAiChatWidget() {
    const fab = document.getElementById('btnAiFab');
    const panel = document.getElementById('aiPanel');
    const backdrop = document.getElementById('aiPanelBackdrop');
    const closeBtn = document.getElementById('aiPanelClose');
    const sendBtn = document.getElementById('aiSend');
    const input = document.getElementById('aiInput');
    const messages = document.getElementById('aiMessages');
    if (!fab || !panel || !messages) return;
    if (panel.dataset.psAiInit === '1') return;
    panel.dataset.psAiInit = '1';

    let history = [];
    function loadHistory() {
        try {
            const raw = sessionStorage.getItem(STORAGE_CHAT);
            if (raw) history = JSON.parse(raw);
            if (!Array.isArray(history)) history = [];
        } catch {
            history = [];
        }
    }
    function saveHistory() {
        try {
            sessionStorage.setItem(STORAGE_CHAT, JSON.stringify(history));
        } catch (_) {
            /* ignore quota */
        }
    }

    function removeEmptyState() {
        const empty = document.getElementById('aiEmptyState');
        if (empty && empty.parentNode) empty.remove();
    }

    function appendBubble(role, text) {
        removeEmptyState();
        history.push({ role, text });
        saveHistory();
        const div = document.createElement('div');
        div.className =
            role === 'user' ? 'ps-ai-bubble ps-ai-bubble--user' : 'ps-ai-bubble ps-ai-bubble--bot';
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    loadHistory();
    if (history.length > 0) {
        const empty = document.getElementById('aiEmptyState');
        if (empty) empty.remove();
        for (const item of history) {
            if (
                !item ||
                (item.role !== 'user' && item.role !== 'bot') ||
                typeof item.text !== 'string'
            ) {
                continue;
            }
            const div = document.createElement('div');
            div.className =
                item.role === 'user'
                    ? 'ps-ai-bubble ps-ai-bubble--user'
                    : 'ps-ai-bubble ps-ai-bubble--bot';
            div.textContent = item.text;
            messages.appendChild(div);
        }
        messages.scrollTop = messages.scrollHeight;
    }

    applyAiChatWidgetI18n();

    function openPanel() {
        panel.hidden = false;
        if (backdrop) backdrop.hidden = false;
        sessionStorage.setItem(STORAGE_PANEL, '1');
        input?.focus();
    }
    function closePanel() {
        panel.hidden = true;
        if (backdrop) backdrop.hidden = true;
        sessionStorage.setItem(STORAGE_PANEL, '0');
    }

    function isPanelOpen() {
        return panel && !panel.hidden;
    }

    if (sessionStorage.getItem(STORAGE_PANEL) === '1') {
        panel.hidden = false;
        if (backdrop) backdrop.hidden = false;
    }

    fab.addEventListener('click', openPanel);
    closeBtn?.addEventListener('click', closePanel);
    backdrop?.addEventListener('click', closePanel);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isPanelOpen()) {
            e.preventDefault();
            closePanel();
        }
    });

    async function send() {
        const text = (input?.value || '').trim();
        if (!text) return;
        const spinner = document.getElementById('aiSendSpinner');
        sendBtn.disabled = true;
        spinner?.classList.remove('d-none');
        appendBubble('user', text);
        input.value = '';
        try {
            const res = await api.aiChat(text);
            appendBubble('bot', res.reply || t('ai.emptyReply'));
        } catch (e) {
            appendBubble('bot', `${t('ai.errSend')}: ${e.message || t('ai.errGeneric')}`);
        } finally {
            sendBtn.disabled = false;
            spinner?.classList.add('d-none');
        }
    }

    sendBtn?.addEventListener('click', send);
    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    });

    const btnLang = document.getElementById('btnLang');
    if (btnLang && !btnLang.dataset.psAiLangHook) {
        btnLang.dataset.psAiLangHook = '1';
        btnLang.addEventListener('click', () => {
            queueMicrotask(() => applyAiChatWidgetI18n());
        });
    }
}
