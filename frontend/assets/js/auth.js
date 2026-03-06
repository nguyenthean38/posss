// MOCK AUTHENTICATION FOR UI PREVIEW
const STORAGE_KEY = "access_cache";

let accessToken = "mock_token_" + Date.now();
let accessExp = new Date(Date.now() + 3600000).toISOString();

function _saveAccess(aToken, aExp) {
  accessToken = aToken;
  accessExp = aExp;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken: aToken, accessExp: aExp }));
}

function _loadAccess() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    accessToken = obj.accessToken;
    accessExp = obj.accessExp;
    return obj;
  } catch {
    return null;
  }
}

function _clearAccess() {
  accessToken = null;
  accessExp = null;
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem("ps_profile"); // Clear mock profile as well
}

// Mock login: always succeeds
export async function login(username, password) {
  console.log("Mock Login:", username);
  const data = {
    AccessToken: "mock_access_token_" + Math.random(),
    AccessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
    User: { username, role: "Admin" }
  };
  _saveAccess(data.AccessToken, data.AccessTokenExpiresAt);
  return data;
}

// Mock logout
export async function logout() {
  console.log("Mock Logout");
  _clearAccess();
  location.href = "login.html";
}

// Mock API fetch
export async function apiFetch(input, init = {}) {
  console.log("Mock API Fetch:", input);
  return { ok: true, json: async () => ({}) };
}

// Mock requireAuth
export async function requireAuth(redirectTo) {
  if (!_loadAccess()) {
    location.replace(redirectTo);
    throw new Error("Chưa đăng nhập");
  }
}

// Mock bootstrap
export async function bootstrap() {
  console.log("Mock Bootstrap");
  _loadAccess();
}
