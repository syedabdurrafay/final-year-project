import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await authAPI.verifyToken();
      // Defensive: ensure response and data exist
      if (response && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Token verification failed:', err);
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername, password) => {
    try {
      setError('');
      const response = await authAPI.login(emailOrUsername, password);

      // Defensive checks
      const token = response?.data?.access_token;
      if (!token) throw new Error('No access token received');

      localStorage.setItem('access_token', token);

      // Fetch current user using token
      const userResponse = await authAPI.verifyToken();
      if (userResponse && userResponse.data) setUser(userResponse.data);

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);

      // Extract message safely from axios error shape
      const message =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Login failed';

      setError(message);
      return { success: false, error: message };
    }
  };

  const signup = async (userData) => {
    try {
      setError('');
      await authAPI.register(userData);

      // Auto-login after successful registration
      const loginResult = await login(userData.email, userData.password);
      return loginResult;
    } catch (err) {
      console.error('Signup error:', err);
      const message =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setError('');
  };

  const clearError = () => setError('');

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    setError,
    clearError,
  };

  // Only render children when loading finished to avoid undefined user usage
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
