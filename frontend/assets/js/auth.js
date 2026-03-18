/**
 * Authentication Module - PHP Session Based
 * Backend dùng PHP Session, không dùng JWT
 * Cookie PHPSESSID được browser tự động quản lý
 */
import { api } from './api.js';

const STORAGE_KEY = "ps_user";

// Lưu user info (CHỈ để hiển thị UI, KHÔNG phải authentication)
function _saveUser(user) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

// Load user info từ sessionStorage
function _loadUser() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Clear user info
function _clearUser() {
  sessionStorage.removeItem(STORAGE_KEY);
}

// Login - Backend tạo PHP session và set cookie PHPSESSID
export async function login(username, password) {
  try {
    const data = await api.login(username, password);
    
    // Backend đã set cookie PHPSESSID tự động
    // Chỉ lưu user info để hiển thị UI
    if (data.user) {
      _saveUser(data.user);
      return data;
    }
    
    throw new Error(data.message || 'Login failed');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Logout - Backend destroy session và clear cookie
export async function logout() {
  try {
    await api.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    _clearUser();
    location.href = "login.html";
  }
}

// API fetch wrapper (for backward compatibility)
export async function apiFetch(endpoint, init = {}) {
  return api.request(endpoint, init);
}

// Require authentication
// Check sessionStorage trước (fast check)
// Nếu có, verify với server (real check)
export async function requireAuth(redirectTo = "login.html") {
  const user = _loadUser();
  
  // Fast check: Nếu không có user info trong sessionStorage
  if (!user) {
    location.replace(redirectTo);
    throw new Error("Chưa đăng nhập");
  }
  
  // Real check: Verify với server qua API
  try {
    const response = await api.getMe();
    // Server confirm user đã login
    // Update user info nếu có thay đổi
    if (response.profile) {
      _saveUser({
        id: response.profile.id,
        full_name: response.profile.full_name,
        role: response.profile.role,
        is_first_login: response.profile.is_first_login
      });
    }
    return user;
  } catch (error) {
    // Server trả về 401 = chưa login hoặc session hết hạn
    console.error('Auth verification failed:', error);
    _clearUser();
    location.replace(redirectTo);
    throw new Error("Phiên đăng nhập đã hết hạn");
  }
}

// Bootstrap - check auth status
export async function bootstrap() {
  return _loadUser();
}

// Get current user
export function getCurrentUser() {
  return _loadUser();
}

// Check if user is admin
export function isAdmin() {
  const user = _loadUser();
  return user && user.role === 'admin';
}
