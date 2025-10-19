import { create } from "zustand";

// =============================
// LocalStorage key 定义
// =============================
const storageKey = {
  access: "sp_access_token",
  refresh: "sp_refresh_token",
};

// =============================
// 安全地从 localStorage 获取数据
// =============================
const safeGetItem = (key) => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
};

const safeSetItem = (key, value) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, value);
  }
};

const safeRemoveItem = (key) => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
  }
};

// =============================
// 从 localStorage 初始化
// =============================
const getStored = () => ({
  access: safeGetItem(storageKey.access),
  refresh: safeGetItem(storageKey.refresh),
});

// =============================
// Zustand store 创建
// =============================
const useAuth = create((set) => ({
  access: getStored().access,
  refresh: getStored().refresh,
  isAuthenticated: !!getStored().access,

  // ✅ 设置并同步到 localStorage
  setTokens: ({ access, refresh }) => {
    if (access) safeSetItem(storageKey.access, access);
    if (refresh) safeSetItem(storageKey.refresh, refresh);
    set({ access, refresh, isAuthenticated: !!access });
  },

  // ✅ 清空 token（登出）
  clear: () => {
    safeRemoveItem(storageKey.access);
    safeRemoveItem(storageKey.refresh);
    set({ access: null, refresh: null, isAuthenticated: false });
  },
}));

// =============================
// 可选：检查 Access Token 是否过期（JWT 自带 exp）
// =============================
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// =============================
// 统一导出工具函数
// =============================
export const getAccessToken = () => {
  const token = useAuth.getState().access;
  if (isTokenExpired(token)) {
    console.warn("Access token expired, logging out");
    logout();
    return null;
  }
  return token;
};

export const getRefreshToken = () => useAuth.getState().refresh;
export const setTokens = (tokens) => useAuth.getState().setTokens(tokens);
export const logout = () => useAuth.getState().clear();
export default useAuth;
