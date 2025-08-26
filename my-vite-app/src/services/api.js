import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Use bracket notation to guarantee header is set correctly
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global 401 handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (emailOrUsername, password) => {
    const formData = new URLSearchParams();
    formData.append('username', emailOrUsername);
    formData.append('password', password);

    try {
      // Use the created api instance (keeps baseURL consistent)
      const response = await api.post('/api/auth/login', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  verifyToken: async () => {
    try {
      const response = await api.get('/api/auth/verify');
      return response;
    } catch (error) {
      throw error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response;
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        new_password: newPassword,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export const databaseAPI = {
  getConnections: () => api.get('/api/databases'),
  createConnection: (data) => api.post('/api/databases', data),
  testConnection: (data) => api.post('/api/databases/test', data),
  deleteConnection: (id) => api.delete(`/api/databases/${id}`),
  getSchema: (id) => api.get(`/api/databases/${id}/schema`),
};

export const queryAPI = {
  execute: (data) => api.post('/api/queries/execute', data),
  getHistory: () => api.get('/api/queries/history'),
};

export default api;
