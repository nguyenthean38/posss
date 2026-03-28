/**
 * Authentication Module - PHP Session Based
 * Backend dùng PHP Session, không dùng JWT
 * Cookie PHPSESSID được browser tự động quản lý
 */
import { api } from './api.js?v=9';
import { getAvatarImage } from './assets.js';
import { i18n } from './shared.js';

function t(k) {
    const lang = localStorage.getItem('ps_lang') || 'vi';
    return i18n[lang]?.[k] || i18n.en[k] || k;
}

const STORAGE_KEY = "ps_user";

function applyStaffOnlyUI(role) {
  document.querySelectorAll('.staff-only').forEach((el) => {
    el.style.display = role === 'staff' ? '' : 'none';
  });
}

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
    try {
      sessionStorage.removeItem("ps_ai_chat_session");
      sessionStorage.removeItem("ps_ai_panel_open");
    } catch (_) {
      /* ignore */
    }
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
    throw new Error(t('auth.notLoggedIn'));
  }
  
  // Instant RBAC UI application
  document.body.setAttribute('data-role', user.role);
  if (user.role !== 'admin') {
      document.querySelectorAll('a[href="categories.html"], a[href="employees.html"], a[href="shifts.html"], a[href="activity.html"]').forEach(el => el.style.display = 'none');
      // Ẩn tất cả elements có class admin-only
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  } else {
      // Hiển thị tất cả elements có class admin-only cho admin
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
  }
  applyStaffOnlyUI(user.role);
  
  // Update Topbar Profile UI
  function applyUserTopBar(u) {
      if (!u) return;
      const nameStr = u.full_name || u.name || "User";
      let initials = "US";
      const parts = nameStr.trim().split(" ");
      if (parts.length > 1) {
          initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (nameStr.length >= 2) {
          initials = nameStr.substring(0, 2).toUpperCase();
      }
      const roleKey = u.role === 'admin' ? "role.admin" : "role.staff";
      
      document.querySelectorAll('.ps-user__name').forEach(el => el.textContent = nameStr);
      document.querySelectorAll('.ps-user__role').forEach(el => {
          el.setAttribute('data-i18n', roleKey);
          el.textContent = t(roleKey);
      });
      
      // Update avatar - use image if available, otherwise use initials
      document.querySelectorAll('.ps-user__avatar').forEach(el => {
          if (u.avatar) {
              el.innerHTML = `<img src="${getAvatarImage(u.avatar)}" alt="${nameStr}" onerror="this.innerHTML='${initials}'" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
          } else {
              el.textContent = initials;
          }
      });
  }
  applyUserTopBar(user);
  
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
      document.body.setAttribute('data-role', response.profile.role);
      if (response.profile.role !== 'admin') {
          document.querySelectorAll('a[href="categories.html"], a[href="employees.html"], a[href="shifts.html"], a[href="activity.html"]').forEach(el => el.style.display = 'none');
          // Ẩn tất cả elements có class admin-only
          document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
      } else {
          // Hiển thị tất cả elements có class admin-only cho admin
          document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
      }
      applyStaffOnlyUI(response.profile.role);
      applyUserTopBar(response.profile);
    }
    return user;
  } catch (error) {
    // Server trả về 401 = chưa login hoặc session hết hạn
    console.error('Auth verification failed:', error);
    _clearUser();
    location.replace(redirectTo);
    throw new Error(t('auth.sessionExpired'));
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
export const getUser = getCurrentUser;

// Check if user is admin
export function isAdmin() {
  const user = _loadUser();
  return user && user.role === 'admin';
}


