import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT token from localStorage if present
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adflow_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;

// Typed API helpers
export const authApi = {
  register: (data: unknown) => api.post('/auth/register', data),
  login: (data: unknown) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const adsApi = {
  list: (params?: unknown) => api.get('/ads', { params }),
  get: (slug: string) => api.get(`/ads/${slug}`),
  create: (data: unknown) => api.post('/ads', data),
  update: (id: string, data: unknown) => api.put(`/ads/${id}`, data),
  delete: (id: string) => api.delete(`/ads/${id}`),
  submit: (id: string) => api.post(`/ads/${id}/submit`),
  myAds: (params?: unknown) => api.get('/ads/my', { params }),
  featured: () => api.get('/ads/featured'),
};

export const moderationApi = {
  queue: (params?: unknown) => api.get('/moderation/queue', { params }),
  approve: (adId: string, data: unknown) => api.post(`/moderation/${adId}/approve`, data),
  reject: (adId: string, data: unknown) => api.post(`/moderation/${adId}/reject`, data),
};

export const paymentsApi = {
  create: (data: unknown) => api.post('/payments', data),
  list: (params?: unknown) => api.get('/payments', { params }),
  verify: (id: string, data: unknown) => api.post(`/payments/${id}/verify`, data),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: (params?: unknown) => api.get('/admin/users', { params }),
  updateUser: (id: string, data: unknown) => api.put(`/admin/users/${id}`, data),
  publishAd: (id: string, data?: unknown) => api.post(`/admin/ads/${id}/publish`, data),
  featureAd: (id: string, data: unknown) => api.post(`/admin/ads/${id}/feature`, data),
  categories: () => api.get('/admin/categories'),
  createCategory: (data: unknown) => api.post('/admin/categories', data),
};

export const categoriesApi = {
  list: () => api.get('/categories'),
};

export const citiesApi = {
  list: () => api.get('/cities'),
};