// Profile Module - Real API Integration
import API from './api.js?v=3';
import { requireAuth, getUser } from './auth.js';

(() => {
    requireAuth();

    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";

    const i18n = {
        vi: {
            "page.profile": "Hồ sơ",
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
            "tab.info": "Thông tin cá nhân",
            "tab.pwd": "Đổi mật khẩu",
            "form.name": "Tên nhân viên",
            "form.email": "Email",
            "form.phone": "Số điện thoại",
            "form.address": "Địa chỉ",
            "common.save": "Lưu",
            "pwd.current": "Mật khẩu hiện tại",
            "pwd.new": "Mật khẩu mới",
            "pwd.confirm": "Xác nhận mật khẩu",
            "pwd.btn": "Đổi mật khẩu",
            "toast.saved": "Đã lưu thông tin",
            "toast.pwdOk": "Đổi mật khẩu thành công",
            "toast.pwdWrong": "Mật khẩu hiện tại không đúng",
            "toast.pwdMismatch": "Mật khẩu xác nhận không khớp",
            "toast.pwdWeak": "Mật khẩu quá yếu (>= 8 ký tự, có chữ + số)",
            "pw.weak": "Yếu",
            "pw.medium": "Trung bình",
            "pw.strong": "Mạnh",
            "info.joined": "Tham gia",
            "toast.error": "Có lỗi xảy ra",
        },
        en: {
            "page.profile": "Profile",
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
            "tab.info": "Personal Information",
            "tab.pwd": "Change Password",
            "form.name": "Employee Name",
            "form.email": "Email",
            "form.phone": "Phone Number",
            "form.address": "Address",
            "common.save": "Save",
            "pwd.current": "Current Password",
            "pwd.new": "New Password",
            "pwd.confirm": "Confirm Password",
            "pwd.btn": "Change Password",
            "toast.saved": "Profile saved",
            "toast.pwdOk": "Password changed",
            "toast.pwdWrong": "Current password is incorrect",
            "toast.pwdMismatch": "Confirm password mismatch",
            "toast.pwdWeak": "Weak password (>= 8 chars, letters + numbers)",
            "pw.weak": "Weak",
            "pw.medium": "Medium",
            "pw.strong": "Strong",
            "info.joined": "Joined",
            "toast.error": "An error occurred",
        }
    };

    const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
    const t = (k) => i18n[getLang()]?.[k] || i18n.en[k] || k;

    function toast(msg) {
        const el = document.getElementById("toast");
        const txt = document.getElementById("toastText");
        if (!el || !txt) return;
        txt.textContent = msg;
        el.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => el.classList.remove("show"), 1500);
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
            const ic = btnCollapse.querySelector("i");
            ic?.classList.toggle("bi-chevron-left");
            ic?.classList.toggle("bi-chevron-right");
        });

        document.getElementById("btnTheme")?.addEventListener("click", () => {
            const cur = document.body.getAttribute("data-theme") || "dark";
            setTheme(cur === "dark" ? "light" : "dark");
        });

        document.getElementById("btnLang")?.addEventListener("click", () => {
            const cur = getLang();
            const next = cur === "vi" ? "en" : "vi";
            applyLang(next);
            renderProfile();
            updateStrength();
        });
    }

    function initials(name) {
        const s = (name || "A").trim();
        if (s === "Administrator") return "AD";
        return (s[0] || "A").toUpperCase();
    }

    async function renderProfile() {
        try {
            const user = getUser();
            if (!user) return;

            const p = await API.profile.get();
            const init = initials(p.name);

            document.getElementById("heroAvatar").textContent = init;
            document.getElementById("heroName").textContent = p.name || "—";
            document.getElementById("heroEmail").textContent = p.email || "—";
            const roleText = p.role === "Admin" ? t("role.admin") : t("role.staff");
            document.getElementById("heroRole").textContent = roleText;
            document.getElementById("heroJoined").textContent = `${t("info.joined")}: ${p.created_at?.split('T')[0] || "—"}`;

            document.getElementById("topAvatar").textContent = init;
            document.getElementById("topName").textContent = p.name || "—";
            document.getElementById("topRole").textContent = roleText;

            document.getElementById("fName").value = p.name || "";
            document.getElementById("fEmail").value = p.email || "";
            document.getElementById("fPhone").value = p.phone || "";
            document.getElementById("fAddress").value = p.address || "";
        } catch (err) {
            console.error('Render error:', err);
            toast(t("toast.error"));
        }
    }

    function initTabs() {
        const tabs = document.querySelectorAll(".ps-tab");
        const panelInfo = document.getElementById("panelInfo");
        const panelPwd = document.getElementById("panelPwd");

        tabs.forEach(btn => {
            btn.addEventListener("click", () => {
                tabs.forEach(x => x.classList.remove("active"));
                btn.classList.add("active");

                const tab = btn.dataset.tab;
                panelInfo.style.display = (tab === "info") ? "" : "none";
                panelPwd.style.display = (tab === "pwd") ? "" : "none";
            });
        });
    }

    async function saveInfo() {
        try {
            const name = document.getElementById("fName").value.trim();
            const phone = document.getElementById("fPhone").value.trim();
            const address = document.getElementById("fAddress").value.trim();

            await API.profile.update({ name, phone, address });
            renderProfile();
            toast(t("toast.saved"));
        } catch (err) {
            console.error('Save error:', err);
            toast(t("toast.error"));
        }
    }

    function scorePassword(pw) {
        const s = pw || "";
        let score = 0;
        if (s.length >= 8) score += 1;
        if (/[A-Za-z]/.test(s) && /\d/.test(s)) score += 1;
        if (/[A-Z]/.test(s) && /[a-z]/.test(s)) score += 1;
        if (/[^A-Za-z0-9]/.test(s)) score += 1;
        return Math.min(score, 4);
    }

    function updateStrength() {
        const pw = document.getElementById("newPwd").value;
        const fill = document.getElementById("pwFill");
        const text = document.getElementById("pwText");

        const sc = scorePassword(pw);
        const pct = [0, 30, 55, 80, 100][sc];
        fill.style.width = pct + "%";

        if (!pw) { text.textContent = "—"; return; }
        if (sc <= 1) text.textContent = t("pw.weak");
        else if (sc <= 2) text.textContent = t("pw.medium");
        else text.textContent = t("pw.strong");
    }

    function toggleEye(id) {
        const input = document.getElementById(id);
        if (!input) return;
        input.type = input.type === "password" ? "text" : "password";
    }

    async function changePassword() {
        try {
            const cur = document.getElementById("curPwd").value;
            const nw = document.getElementById("newPwd").value;
            const cf = document.getElementById("cfmPwd").value;

            if (nw !== cf) {
                toast(t("toast.pwdMismatch"));
                return;
            }
            const sc = scorePassword(nw);
            if (nw.length < 8 || sc < 2) {
                toast(t("toast.pwdWeak"));
                return;
            }

            await API.profile.changePassword({ current_password: cur, new_password: nw });
            document.getElementById("curPwd").value = "";
            document.getElementById("newPwd").value = "";
            document.getElementById("cfmPwd").value = "";
            updateStrength();
            toast(t("toast.pwdOk"));
        } catch (err) {
            console.error('Password error:', err);
            if (err.message.includes('401') || err.message.includes('incorrect')) {
                toast(t("toast.pwdWrong"));
            } else {
                toast(t("toast.error"));
            }
        }
    }

    function init() {
        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        const savedLang = localStorage.getItem(KEY_LANG) || "vi";
        applyLang(savedLang);
        setTheme(savedTheme);

        initLayout();
        initTabs();
        renderProfile();

        document.getElementById("btnSaveInfo")?.addEventListener("click", saveInfo);
        document.getElementById("newPwd")?.addEventListener("input", updateStrength);
        document.getElementById("btnChangePwd")?.addEventListener("click", changePassword);

        document.querySelectorAll("[data-eye]").forEach(btn => {
            btn.addEventListener("click", () => toggleEye(btn.dataset.eye));
        });

        updateStrength();
    }

    init();
})();

