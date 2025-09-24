import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 second timeout for database operations
});

// Attach token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // redirect to login page (spa)
      window.location.href = '/login';
    }
    
    // Enhanced error messages for database connections
    if (error.config?.url.includes('/databases')) {
      if (error.response?.data?.detail) {
        error.message = error.response.data.detail;
      } else if (error.code === 'ECONNABORTED') {
        error.message = 'Connection timeout. Please check if the database server is running and accessible.';
      } else if (error.message.includes('Network Error')) {
        error.message = 'Network error. Please check your internet connection and try again.';
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (emailOrUsername, password) => {
    const formParams = new URLSearchParams();
    formParams.append('username', emailOrUsername);
    formParams.append('password', password);

    try {
      const response = await api.post('/api/auth/login', formParams, {
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
  // Add these new methods for Excel file uploads
  testExcelConnection: (formData) => {
    return api.post('/api/databases/test-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  createExcelConnection: (formData) => {
    return api.post('/api/databases/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export const queryAPI = {
  execute: (data) => api.post('/api/queries/execute', data),
  getHistory: () => api.get('/api/queries/history'),
};

export default api;