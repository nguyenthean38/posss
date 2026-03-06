(() => {
    const KEY_THEME = "ps_theme";
    const KEY_LANG = "ps_lang";
    const KEY_EMP = "ps_employees";

    let pendingDeleteId = null;
    let viewEmployeeId = null;

    const i18n = {
        vi: {
            "page.employees": "Nhân viên",
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

            "emp.searchPh": "Tìm nhân viên theo tên hoặc email...",
            "emp.add": "Thêm nhân viên",
            "emp.modalAdd": "Thêm nhân viên",
            "emp.modalEdit": "Sửa nhân viên",
            "emp.modalView": "Xem chi tiết",
            "emp.modalDelete": "Xóa nhân viên",

            "emp.fName": "Tên nhân viên",
            "emp.fEmail": "Email",
            "emp.fRole": "Role",
            "emp.fPhone": "Số điện thoại",
            "emp.fAddress": "Địa chỉ",
            "emp.fJoin": "Ngày tham gia",

            "role.staff": "Nhân viên",
            "role.admin2": "Admin",

            "emp.sentTitle": "Đã gửi liên kết đăng nhập đến email nhân viên (hiệu lực 1 phút)",
            "emp.sentDesc": "Mật khẩu tạm thời sẽ là MSSV trưởng nhóm. Nhân viên bắt buộc đổi mật khẩu khi đăng nhập lần đầu.",

            "common.save": "Lưu",
            "common.cancel": "Hủy",
            "common.delete": "Xóa",

            "status.active": "Hoạt động",
            "status.locked": "Đã khóa",
            "emp.needPwd": "Chưa đổi MK",

            "emp.view": "Xem chi tiết",
            "emp.lock": "Khóa TK",
            "emp.unlock": "Mở khóa",
            "emp.email": "Gửi lại email",

            "toast.saved": "Đã lưu nhân viên",
            "toast.deleted": "Đã xóa nhân viên",
            "toast.invalid": "Vui lòng nhập tên + email",
            "toast.locked": "Đã khóa tài khoản",
            "toast.unlocked": "Đã mở khóa tài khoản",
            "toast.email": "Đã gửi email (mock)",

            "view.status": "Trạng thái",
            "view.role": "Role",
            "view.phone": "Số điện thoại",
            "view.address": "Địa chỉ",
            "view.join": "Ngày tham gia",
            "view.pwdChanged": "Đổi mật khẩu",
            "view.yes": "Đã đổi",
            "view.no": "Chưa đổi",

            "confirm.deleteText": "Bạn có chắc muốn xóa nhân viên này?"
        },
        en: {
            "page.employees": "Employees",
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

            "emp.searchPh": "Search by name or email...",
            "emp.add": "Add employee",
            "emp.modalAdd": "Add employee",
            "emp.modalEdit": "Edit employee",
            "emp.modalView": "View details",
            "emp.modalDelete": "Delete employee",

            "emp.fName": "Employee name",
            "emp.fEmail": "Email",
            "emp.fRole": "Role",
            "emp.fPhone": "Phone",
            "emp.fAddress": "Address",
            "emp.fJoin": "Join date",

            "role.staff": "Staff",
            "role.admin2": "Admin",

            "emp.sentTitle": "Login link sent to employee email (valid 1 minute)",
            "emp.sentDesc": "Temporary password is leader student ID. Employee must change password on first login.",

            "common.save": "Save",
            "common.cancel": "Cancel",
            "common.delete": "Delete",

            "status.active": "Active",
            "status.locked": "Locked",
            "emp.needPwd": "Password not changed",

            "emp.view": "View details",
            "emp.lock": "Lock",
            "emp.unlock": "Unlock",
            "emp.email": "Resend email",

            "toast.saved": "Employee saved",
            "toast.deleted": "Employee deleted",
            "toast.invalid": "Please enter name + email",
            "toast.locked": "Account locked",
            "toast.unlocked": "Account unlocked",
            "toast.email": "Email sent (mock)",

            "view.status": "Status",
            "view.role": "Role",
            "view.phone": "Phone",
            "view.address": "Address",
            "view.join": "Join date",
            "view.pwdChanged": "Password changed",
            "view.yes": "Yes",
            "view.no": "No",

            "confirm.deleteText": "Delete this employee?"
        }
    };

    const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
    const t = (k) => i18n[getLang()]?.[k] || i18n.en[k] || k;

    function initials(name) {
        const parts = (name || "").trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return "NA";
        const a = parts[0][0] || "";
        const b = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] || "");
        return (a + b).toUpperCase();
    }

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

        document.querySelectorAll("[data-i18n-ph]").forEach(el => {
            const key = el.getAttribute("data-i18n-ph");
            if (dict[key]) el.setAttribute("placeholder", dict[key]);
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

    // layout controls
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
            render();
        });
    }

    // storage
    const loadEmp = () => JSON.parse(localStorage.getItem(KEY_EMP) || "[]");
    const saveEmp = (arr) => localStorage.setItem(KEY_EMP, JSON.stringify(arr));

    function seedIfEmpty() {
        if (localStorage.getItem(KEY_EMP)) return;

        const seed = [
            { id: "E1", name: "Nguyễn Văn An", email: "an.nguyen@phonestore.com", role: "staff", phone: "0901234567", address: "123 Nguyễn Huệ, Q1, HCM", join: "2024-01-15", locked: false, pwdChanged: true },
            { id: "E2", name: "Trần Thị Bích", email: "bich.tran@phonestore.com", role: "staff", phone: "0909876543", address: "45 Lê Lợi, Q1, HCM", join: "2024-03-02", locked: false, pwdChanged: false },
            { id: "E3", name: "Lê Hoàng Cường", email: "cuong.le@phonestore.com", role: "staff", phone: "0912345678", address: "88 Hai Bà Trưng, Q3, HCM", join: "2024-02-10", locked: true, pwdChanged: true },
            { id: "E4", name: "Phạm Minh Đức", email: "duc.pham@phonestore.com", role: "admin", phone: "0988123456", address: "12 Trần Hưng Đạo, Q5, HCM", join: "2023-12-20", locked: false, pwdChanged: true },
        ];
        saveEmp(seed);
    }

    function roleLabel(role) {
        if (role === "admin") return t("role.admin2");
        return t("role.staff");
    }

    function statusLabel(locked) {
        return locked ? t("status.locked") : t("status.active");
    }

    // render cards
    function render() {
        const q = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
        const grid = document.getElementById("grid");
        const countEl = document.getElementById("empCount");

        const list = loadEmp().filter(e =>
            !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
        );

        if (countEl) countEl.textContent = `(${list.length})`;
        if (!grid) return;

        grid.innerHTML = list.map(e => {
            const badgeStatus = e.locked ? "lock" : "ok";
            const badgeWarn = !e.pwdChanged ? `<span class="ps-badge warn">${t("emp.needPwd")}</span>` : "";
            return `
        <div class="col-12 col-md-6 col-xl-4">
          <div class="ps-card ps-empCard" data-id="${e.id}">
            <div>
              <div class="ps-empTop">
                <div class="ps-empAvatar">${initials(e.name)}</div>
                <div class="ps-empMeta">
                  <div class="ps-empName">${e.name}</div>
                  <div class="ps-empEmail">${e.email}</div>
                  <div class="ps-badges">
                    <span class="ps-badge ${badgeStatus}">${statusLabel(e.locked)}</span>
                    <span class="ps-badge">${roleLabel(e.role)}</span>
                    ${badgeWarn}
                  </div>
                </div>
              </div>

              <div class="ps-empDivider"></div>
            </div>

            <div class="ps-empActions">
              <button class="ps-empAct" data-act="view"><i class="bi bi-eye"></i><span>${t("emp.view")}</span></button>
              <button class="ps-empAct" data-act="lock"><i class="bi ${e.locked ? "bi-unlock" : "bi-lock"}"></i><span>${e.locked ? t("emp.unlock") : t("emp.lock")}</span></button>
              <button class="ps-empAct right" data-act="email" title="email"><i class="bi bi-envelope"></i></button>
              <button class="ps-empAct" data-act="del" title="delete"><i class="bi bi-trash3"></i></button>
            </div>
          </div>
        </div>
      `;
        }).join("");

        grid.querySelectorAll(".ps-empCard").forEach(card => {
            const id = card.dataset.id;
            card.querySelector('[data-act="view"]').addEventListener("click", () => openView(id));
            card.querySelector('[data-act="lock"]').addEventListener("click", () => toggleLock(id));
            card.querySelector('[data-act="email"]').addEventListener("click", () => resendEmail(id));
            card.querySelector('[data-act="del"]').addEventListener("click", () => openDelete(id));
        });
    }

    // view modal (layout like screenshot using ps-view styles)
    function openView(id) {
        const e = loadEmp().find(x => x.id === id);
        if (!e) return;
        viewEmployeeId = id;

        const viewBody = document.getElementById("viewBody");
        viewBody.innerHTML = `
      <div class="ps-view__hero">
        <div class="ps-view__icon" style="border-radius:999px;">
          <div class="ps-empAvatar" style="width:64px;height:64px;border-radius:999px;">${initials(e.name)}</div>
        </div>
        <div class="ps-view__name">${e.name}</div>
        <div class="ps-view__barcode">${e.email}</div>
      </div>

      <div class="ps-view__card">
        <div class="ps-view__grid">
          <div class="ps-view__label">${t("view.status")}</div>
          <div class="ps-view__value">${statusLabel(e.locked)}</div>

          <div class="ps-view__label">${t("view.role")}</div>
          <div class="ps-view__value">${roleLabel(e.role)}</div>

          <div class="ps-view__label">${t("view.phone")}</div>
          <div class="ps-view__value">${e.phone || "-"}</div>

          <div class="ps-view__label">${t("view.address")}</div>
          <div class="ps-view__value">${e.address || "-"}</div>

          <div class="ps-view__label">${t("view.join")}</div>
          <div class="ps-view__value">${e.join || "-"}</div>

          <div class="ps-view__label">${t("view.pwdChanged")}</div>
          <div class="ps-view__value">
            ${e.pwdChanged ? `<i class="bi bi-check2-square" style="color:var(--green)"></i> ${t("view.yes")}`
                : `<i class="bi bi-x-square" style="color:var(--red)"></i> ${t("view.no")}`}
          </div>
        </div>
      </div>
    `;

        // update buttons in footer
        const btnLock = document.getElementById("btnLockFromView");
        const btnEmail = document.getElementById("btnEmailFromView");
        btnLock.querySelector("span").textContent = e.locked ? t("emp.unlock") : t("emp.lock");
        btnLock.querySelector("i").className = `bi ${e.locked ? "bi-unlock" : "bi-lock"}`;

        btnLock.onclick = () => { toggleLock(id); openView(id); };
        btnEmail.onclick = () => resendEmail(id);

        bootstrap.Modal.getOrCreateInstance(document.getElementById("viewModal")).show();
    }

    // add/edit
    function openAdd() {
        document.getElementById("empModalTitle").textContent = t("emp.modalAdd");
        document.getElementById("empId").value = "";
        document.getElementById("fName").value = "";
        document.getElementById("fEmail").value = "";
        document.getElementById("fRole").value = "staff";
        document.getElementById("fPhone").value = "";
        document.getElementById("fAddress").value = "";
        document.getElementById("fJoin").value = "";
    }

    function parseText(s) { return (s || "").trim(); }

    function save() {
        const id = document.getElementById("empId").value.trim();
        const name = parseText(document.getElementById("fName").value);
        const email = parseText(document.getElementById("fEmail").value);
        const role = document.getElementById("fRole").value;
        const phone = parseText(document.getElementById("fPhone").value);
        const address = parseText(document.getElementById("fAddress").value);
        const join = document.getElementById("fJoin").value;

        if (!name || !email) {
            toast(t("toast.invalid"));
            return;
        }

        const arr = loadEmp();
        if (id) {
            const e = arr.find(x => x.id === id);
            if (!e) return;
            Object.assign(e, { name, email, role, phone, address, join });
        } else {
            const newId = "E" + String(Date.now()).slice(-5);
            arr.unshift({
                id: newId, name, email, role, phone, address, join,
                locked: false,
                pwdChanged: false
            });
        }

        saveEmp(arr);
        render();
        toast(t("toast.saved"));
        bootstrap.Modal.getInstance(document.getElementById("empModal"))?.hide();
    }

    // lock/unlock
    function toggleLock(id) {
        const arr = loadEmp();
        const e = arr.find(x => x.id === id);
        if (!e) return;
        e.locked = !e.locked;
        saveEmp(arr);
        render();
        toast(e.locked ? t("toast.locked") : t("toast.unlocked"));
    }

    // resend email (mock)
    function resendEmail(id) {
        const e = loadEmp().find(x => x.id === id);
        if (!e) return;
        toast(t("toast.email"));
    }

    // delete modal
    function openDelete(id) {
        const e = loadEmp().find(x => x.id === id);
        if (!e) return;
        pendingDeleteId = id;
        document.getElementById("deleteText").textContent = `${t("confirm.deleteText")} (${e.name})`;
        bootstrap.Modal.getOrCreateInstance(document.getElementById("deleteModal")).show();
    }

    function confirmDelete() {
        if (!pendingDeleteId) return;
        saveEmp(loadEmp().filter(x => x.id !== pendingDeleteId));
        pendingDeleteId = null;
        render();
        toast(t("toast.deleted"));
        bootstrap.Modal.getInstance(document.getElementById("deleteModal"))?.hide();
    }

    function init() {
        seedIfEmpty();

        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        const savedLang = localStorage.getItem(KEY_LANG) || "vi";
        applyLang(savedLang);
        setTheme(savedTheme);

        initLayout();

        document.getElementById("searchInput")?.addEventListener("input", render);
        document.getElementById("btnAdd")?.addEventListener("click", openAdd);
        document.getElementById("btnSave")?.addEventListener("click", save);
        document.getElementById("btnConfirmDelete")?.addEventListener("click", confirmDelete);

        render();
    }

    init();
})();