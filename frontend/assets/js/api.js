/**
 * API Client Module
 * Quản lý tất cả API calls đến backend PHP
 */

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
        const config = {
            credentials: 'include', // Gửi cookies/session
            ...options,
            headers: {
                'Content-Type': 'application/json',
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
                
                throw new Error(data.message || 'Phiên đăng nhập đã hết hạn');
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
     * Upload file (FormData)
     */
    async upload(endpoint, formData) {
        const url = `${this.baseUrl}${endpoint}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: formData // Không set Content-Type, browser tự set
            });

            const data = await response.json();
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

    // ==================== PRODUCTS ====================

    async getProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/products${query ? '?' + query : ''}`);
    }

    async getProduct(id) {
        return this.request(`/api/products/${id}`);
    }

    async createProduct(data) {
        return this.request('/api/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateProduct(id, data) {
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
        return this.request('/api/customers', {
            method: 'POST',
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
}

// Export singleton instance
export const api = new ApiClient();
