/**
 * API Client Module
 * Quản lý tất cả API calls đến backend PHP
 */
import { i18n } from './shared.js';

function apiT(k) {
    const lang = typeof localStorage !== 'undefined' ? localStorage.getItem('ps_lang') || 'vi' : 'vi';
    return i18n[lang]?.[k] || i18n.en[k] || k;
}

const API_BASE = '../backend/index.php';

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE;
    }

    /**
     * Generic request method
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const method = (options.method || 'GET').toUpperCase();
        const config = {
            credentials: 'include', // Gửi cookies/session
            ...options,
            headers: {
                ...(method !== 'GET' && method !== 'HEAD' ? { 'Content-Type': 'application/json' } : {}),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);

            // Xử lý response
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = { message: await response.text() };
            }

            // Handle 401 Unauthorized - Session expired or not logged in
            if (response.status === 401) {
                // Clear user info
                sessionStorage.removeItem('ps_user');

                // Redirect to login if not already there
                if (!window.location.pathname.includes('login.html') &&
                    !window.location.pathname.includes('first-login.html')) {
                    window.location.replace('login.html');
                }

                throw new Error(data.message || apiT('auth.sessionExpired'));
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    /**
     * Upload file (FormData) — POST multipart; xử lý 401 giống request()
     */
    async upload(endpoint, formData) {
        const url = `${this.baseUrl}${endpoint}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: formData // Không set Content-Type, browser tự set
            });

            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                } catch {
                    data = { message: text || 'Upload failed' };
                }
            }

            if (response.status === 401) {
                sessionStorage.removeItem('ps_user');
                if (!window.location.pathname.includes('login.html') &&
                    !window.location.pathname.includes('first-login.html')) {
                    window.location.replace('login.html');
                }
                throw new Error(data.message || apiT('auth.sessionExpired'));
            }

            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }
            return data;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    }

    // ==================== AUTH ====================

    async login(username, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async logout() {
        return this.request('/api/auth/logout', {
            method: 'POST'
        });
    }

    async verifyToken(email, token) {
        return this.request('/api/auth/verify-token', {
            method: 'POST',
            body: JSON.stringify({ email, token })
        });
    }

    async firstLogin(email, password, token) {
        return this.request('/api/auth/first-login', {
            method: 'POST',
            body: JSON.stringify({ email, password, token })
        });
    }

    async initPassword(newPassword, confirmPassword) {
        return this.request('/api/auth/init-password', {
            method: 'PUT',
            body: JSON.stringify({ new_password: newPassword, confirm_password: confirmPassword })
        });
    }

    async changePassword(currentPassword, newPassword, confirmPassword) {
        return this.request('/api/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });
    }

    async getMe() {
        return this.request('/api/auth/me', {
            method: 'GET'
        });
    }

    // ==================== STAFF ====================

    async getStaff(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/staff${query ? '?' + query : ''}`);
    }

    async getStaffDetail(id) {
        return this.request(`/api/staff/${id}`);
    }

    async createStaff(data) {
        return this.request('/api/staff', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async lockStaff(id) {
        return this.request(`/api/staff/${id}/lock`, {
            method: 'PATCH'
        });
    }

    async unlockStaff(id) {
        return this.request(`/api/staff/${id}/unlock`, {
            method: 'PATCH'
        });
    }

    async resendStaffEmail(id) {
        return this.request(`/api/staff/${id}/resend`, {
            method: 'POST'
        });
    }

    async deleteStaff(id) {
        return this.request(`/api/staff/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== PRODUCTS ====================

    async getProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/products${query ? '?' + query : ''}`);
    }

    async getProduct(id) {
        return this.request(`/api/products/${id}`);
    }

    async createProduct(data) {
        // Check if data contains File (image upload)
        if (data instanceof FormData) {
            return this.upload('/api/products', data);
        }
        return this.request('/api/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateProduct(id, data) {
        // Multipart: POST /update (PHP không parse $_POST/$_FILES cho PUT multipart)
        if (data instanceof FormData) {
            return this.upload(`/api/products/${id}/update`, data);
        }
        return this.request(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteProduct(id) {
        return this.request(`/api/products/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== CATEGORIES ====================

    async getCategories(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/categories${query ? '?' + query : ''}`);
    }

    async getCategory(id) {
        return this.request(`/api/categories/${id}`);
    }

    async searchCategories(data) {
        return this.request('/api/categories/search', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async createCategory(data) {
        return this.request('/api/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateCategory(id, data) {
        return this.request(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteCategory(id) {
        return this.request(`/api/categories/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== CUSTOMERS ====================

    async searchCustomerByPhone(phone) {
        return this.request(`/api/customers/search-by-phone?phone=${encodeURIComponent(phone)}`);
    }

    async getCustomer(id) {
        return this.request(`/api/customers/${id}`);
    }

    async createCustomer(data) {
        // Check if data contains File (avatar upload)
        if (data instanceof FormData) {
            return this.upload('/api/customers', data);
        }
        return this.request('/api/customers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateCustomer(id, data) {
        // Multipart: POST /update (PHP không parse $_POST/$_FILES cho PUT multipart)
        if (data instanceof FormData) {
            return this.upload(`/api/customers/${id}/update`, data);
        }
        return this.request(`/api/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async getCustomerHistory(id, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/customers/${id}/history${query ? '?' + query : ''}`);
    }

    async getOrderDetail(orderId) {
        return this.request(`/api/customers/orders/${orderId}`);
    }

    // ==================== POS ====================

    async posInitSession() {
        return this.request('/api/pos/session', {
            method: 'POST'
        });
    }

    async posAddToCart(data) {
        return this.request('/api/pos/cart/add', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async posUpdateItem(data) {
        return this.request('/api/pos/cart/item', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async posRemoveItem(id) {
        return this.request(`/api/pos/cart/item/${id}`, {
            method: 'DELETE'
        });
    }

    async posCalculateChange(data) {
        return this.request('/api/pos/calculate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async posCheckout(data) {
        return this.request('/api/pos/checkout', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async posLoyaltySummary(phone) {
        const q = encodeURIComponent(phone || '');
        return this.request(`/api/pos/loyalty-summary?phone=${q}`, { method: 'GET' });
    }

    // ==================== REPORTS ====================

    async getReportSummary(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/reports/summary${query ? '?' + query : ''}`);
    }

    async getReportOrders(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/reports/orders${query ? '?' + query : ''}`);
    }

    async getReportProfit(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/reports/profit${query ? '?' + query : ''}`);
    }

    async getReportChartData(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/reports/chart${query ? '?' + query : ''}`);
    }

    // ==================== AI (OpenRouter) ====================

    async aiChat(message) {
        return this.request('/api/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    // ==================== PROFILE ====================

    async getProfile() {
        return this.request('/api/profile');
    }

    async updateProfile(data) {
        return this.request('/api/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async uploadAvatar(formData) {
        return this.upload('/api/profile/avatar', formData);
    }

    // ==================== ADMIN ====================

    // ==================== SHIFTS ====================

    async getShiftStatus() {
        return this.request('/api/shifts/status', { method: 'GET' });
    }

    async shiftClockIn(data = {}) {
        return this.request('/api/shifts/clock-in', {
            method: 'POST',
            body: JSON.stringify(data || {})
        });
    }

    async shiftClockOut() {
        return this.request('/api/shifts/clock-out', { method: 'POST' });
    }

    async getMyShifts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/shifts/me${query ? '?' + query : ''}`);
    }

    async getAdminShifts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/shifts${query ? '?' + query : ''}`);
    }

    async downloadAdminShiftsExport(params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = `${this.baseUrl}/api/admin/shifts/export${query ? '?' + query : ''}`;
        const response = await fetch(url, { credentials: 'include' });
        if (response.status === 401) {
            sessionStorage.removeItem('ps_user');
            if (!window.location.pathname.includes('login.html')) {
                window.location.replace('login.html');
            }
            throw new Error(apiT('auth.sessionExpired'));
        }
        if (!response.ok) {
            let msg = 'HTTP ' + response.status;
            try {
                const j = await response.json();
                if (j.message) msg = j.message;
            } catch (_) {}
            throw new Error(msg);
        }
        const blob = await response.blob();
        const dispo = response.headers.get('Content-Disposition') || '';
        let name = 'shift_attendance.csv';
        const m = dispo.match(/filename="?([^";]+)"?/i);
        if (m) name = m[1].trim();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
    }
    async adminPatchShift(id, body) {
        return this.request(`/api/admin/shifts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(body || {})
        });
    }
    async getActivityLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/activity-logs${query ? '?' + query : ''}`);
    }
}

// Export singleton instance
export const api = new ApiClient();
// Add backward compatibility wrappers for nested API structures expected by existing modules
api.categories = {
    getAll: async (params) => { const r = await api.getCategories(params); return r.items || r; },
    getById: async (id) => { const r = await api.getCategory(id); return r.category || r; },
    create: (data) => api.createCategory(data),
    update: (id, data) => api.updateCategory(id, data),
    delete: (id) => api.deleteCategory(id)
};
api.customers = {
    getAll: async (params) => {
        const r = await api.request('/api/customers' + (params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''));
        return r.items || r;
    },
    getById: async (id) => { const r = await api.getCustomer(id); return r.customer || r; },
    create: (data) => api.createCustomer(data),
    update: (id, data) => api.updateCustomer(id, data),
    delete: (id) => api.request(`/api/customers/${id}`, { method: 'DELETE' }),
    getHistory: (id, params) => api.getCustomerHistory(id, params)
};
api.products = {
    getAll: async (params) => { const r = await api.getProducts(params); return r.items || r; },
    getById: (id) => api.getProduct(id),
    create: (data) => api.createProduct(data),
    update: (id, data) => api.updateProduct(id, data),
    delete: (id) => api.deleteProduct(id),
    restock: (id, quantity) => api.request(`/api/products/${id}/restock`, { method: 'PATCH', body: JSON.stringify({ quantity }) })
};
api.profile = {
    get: async () => { const r = await api.getProfile(); return r.profile || r; },
    update: (data) => api.updateProfile(data),
    changePassword: (data) => api.changePassword(data.current_password, data.new_password, data.confirm_password || data.new_password)
};
api.reports = {
    getDashboard: (timeline) => {
        const params = {};
        if (timeline) params.timeline = timeline;
        return api.getReportSummary(params);
    },
    getSummary: (from, to, timeline) => {
        const params = {};
        if (timeline) { params.timeline = timeline; }
        else {
            if (from) params.fromDate = from;
            if (to)   params.toDate   = to;
        }
        return api.getReportSummary(params);
    }
};
api.pos = {
    getOrderById: (id) => api.getOrderDetail(id)
};

export default api;
