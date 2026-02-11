// js/main.js

// 1. Quản lý Đa ngôn ngữ (i18n)
const langData = {
    vi: {
        pos_title: "Hệ thống POS",
        search_ph: "Tìm sản phẩm...",
        total: "Tổng tiền",
        checkout: "Thanh toán",
        login_btn: "Đăng nhập",
        dark_mode: "Giao diện tối",
        products: "Sản phẩm"
    },
    en: {
        pos_title: "POS System",
        search_ph: "Search products...",
        total: "Total",
        checkout: "Checkout",
        login_btn: "Login",
        dark_mode: "Dark Mode",
        products: "Products"
    }
};

let currentLang = 'vi';

function toggleLanguage() {
    currentLang = currentLang === 'vi' ? 'en' : 'vi';
    updateUIText();
}

function updateUIText() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (langData[currentLang][key]) {
            el.innerText = langData[currentLang][key];
        }
    });
}

// 2. Quản lý Dark Mode
function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');

    // Lưu vào LocalStorage để nhớ trạng thái
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

// Khởi chạy khi load trang
document.addEventListener('DOMContentLoaded', () => {
    // Load theme đã lưu
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateUIText();
});

// Định dạng tiền tệ VND
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};