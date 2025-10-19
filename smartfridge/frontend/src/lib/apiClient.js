// src/lib/apiClient.js
import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  logout,
} from "./auth.js";

// Base URL: 线上请在 Vercel 设置 VITE_API_BASE_URL=https://your-backend.onrender.com
// 注意：不要带 /api；代码里会自行拼接 /api/...
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ====== 并发刷新队列控制 ======
let isRefreshing = false;
let pendingRequests = [];

const processQueue = (error, token = null) => {
  pendingRequests.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  pendingRequests = [];
};

// ====== 创建带拦截器的 axios 实例 ======
const attachInterceptors = (instance) => {
  // 请求：自动带上 Access Token
  instance.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // 响应：401 时刷新 token 并重试
  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;
      if (!original || original._retry) {
        throw error;
      }

      // 只处理 401
      if (error.response && error.response.status === 401) {
        const refresh = getRefreshToken();
        if (!refresh) {
          logout();
          throw error;
        }

        if (isRefreshing) {
          // 等待刷新完成后重试
          return new Promise((resolve, reject) => {
            pendingRequests.push({ resolve, reject });
          })
            .then((token) => {
              original.headers.Authorization = `Bearer ${token}`;
              original._retry = true;
              return instance(original);
            })
            .catch((err) => Promise.reject(err));
        }

        try {
          isRefreshing = true;
          // 用「无拦截」的 axios + API_BASE 去刷新，避免递归与错误前缀
          const { data } = await axios.post(`${API_BASE}/api/auth/jwt/refresh/`, {
            refresh,
          });

          // 刷新成功：保存 token，唤醒队列
          setTokens({ access: data.access, refresh });
          processQueue(null, data.access);

          // 重试原请求（仍由对应实例发起）
          original.headers.Authorization = `Bearer ${data.access}`;
          original._retry = true;
          return instance(original);
        } catch (e) {
          // 刷新失败：登出 & 全部失败
          processQueue(e, null);
          logout();
          throw e;
        } finally {
          isRefreshing = false;
        }
      }

      throw error;
    }
  );

  return instance;
};

// ====== 导出两个客户端 ======
export const api = attachInterceptors(
  axios.create({
    baseURL: API_BASE, // 例：https://xxx.onrender.com
    withCredentials: false,
    headers: { "Content-Type": "application/json" },
  })
);
// 默认导出通用 API 客户端
export default api;
