import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  const clearError = () => setError('');

  const verifyToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await authAPI.verifyToken();
      if (response && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
        localStorage.removeItem('access_token');
      }
    } catch (err) {
      console.error('Token verification failed:', err);
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const login = async (emailOrUsername, password) => {
    try {
      setError('');
      const response = await authAPI.login(emailOrUsername, password);

      const token = response?.data?.access_token;
      if (!token) throw new Error('No access token received from server');

      localStorage.setItem('access_token', token);

      // fetch user info
      const userResponse = await authAPI.verifyToken();
      if (userResponse && userResponse.data) setUser(userResponse.data);

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
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

      // Auto-login after registration
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};