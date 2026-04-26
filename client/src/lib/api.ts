import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL && typeof window !== 'undefined') {
  console.warn('⚠️ NEXT_PUBLIC_API_URL is not defined! API calls will fail on production.');
}

const api = axios.create({
  baseURL: API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ✅ Response interceptor for better error debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      console.error('[API ERROR CALLBACK]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    return Promise.reject(error);
  }
);

export default api;
