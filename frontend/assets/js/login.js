import { login, bootstrap } from "./auth.js";
import { i18n } from './shared.js';

(async () => {
    // ===== CONSTANTS & STATE =====
    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";
    const $ = (s) => document.querySelector(s);



    // ===== CORE FUNCTIONS =====
    const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
    const getTheme = () => localStorage.getItem(KEY_THEME) || "dark";
    const t = (k) => i18n[getLang()]?.[k] || i18n.en[k] || k;

    function applyLang() {
        const lang = getLang();
        document.documentElement.lang = lang;
        const label = document.getElementById("langLabel");
        if (label) label.textContent = lang.toUpperCase();

        document.querySelectorAll("[data-i18n]").forEach(el => {
            el.textContent = t(el.getAttribute("data-i18n"));
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
        });
    }

    function applyTheme() {
        const theme = getTheme();
        document.body.setAttribute("data-theme", theme);
        const icon = $("#btnTheme i");
        if (icon) {
            icon.className = theme === "dark" ? "bi bi-moon-stars" : "bi bi-sun";
        }
    }

    function toast(msg) {
        const el = $(".snackbar");
        if (!el) { alert(msg); return; }
        el.textContent = msg;
        el.style.display = "block";
        clearTimeout(toast._t);
        toast._t = setTimeout(() => el.style.display = "none", 2500);
    }

    // ===== INITIALIZATION =====
    try {
        await bootstrap();
    } catch (e) {
        console.warn("Bootstrap failed:", e);
    }

    // Apply initial state
    applyLang();
    applyTheme();

    // Event Listeners
    const btnLang = $("#btnLang");
    if (btnLang) {
        btnLang.onclick = () => {
            const next = getLang() === "vi" ? "en" : "vi";
            localStorage.setItem(KEY_LANG, next);
            applyLang();
        };
    }

    const btnTheme = $("#btnTheme");
    if (btnTheme) {
        btnTheme.onclick = () => {
            const next = getTheme() === "dark" ? "light" : "dark";
            localStorage.setItem(KEY_THEME, next);
            applyTheme();
        };
    }

    const pwdToggle = $(".password-toggle");
    if (pwdToggle) {
        pwdToggle.onclick = () => {
            const i = $("#password");
            if (!i) return;
            const isPwd = i.type === "password";
            i.type = isPwd ? "text" : "password";
            pwdToggle.className = isPwd ? "bi bi-eye-slash password-toggle" : "bi bi-eye password-toggle";
        };
    }

    const form = $("#loginForm");
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const username = $("#username")?.value?.trim() ?? "";
            const password = $("#password")?.value ?? "";

            if (!username || !password) return toast(t("toast.empty"));

            const loginBtn = $(".login-btn");
            const originalHtml = loginBtn.innerHTML;
            loginBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i>';
            loginBtn.disabled = true;

            try {
                await login(username, password);
                localStorage.setItem("username", username);
                toast(t("toast.success"));
                setTimeout(() => location.href = "dashboard.html", 800);
            } catch (err) {
                toast(t("toast.fail"));
                console.error(err);
            } finally {
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalHtml;
            }
        };
    }

    // Input focus effects
    document.querySelectorAll("input").forEach(inp => {
        inp.onfocus = (e) => {
            const wrap = e.target.closest(".input-container");
            if (wrap) {
                wrap.style.borderColor = "var(--primary)";
                wrap.style.boxShadow = "var(--focus)";
            }
        };
        inp.onblur = (e) => {
            const wrap = e.target.closest(".input-container");
            if (wrap) {
                wrap.style.borderColor = "var(--border)";
                wrap.style.boxShadow = "none";
            }
        };
    });

})();
