// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isRemembered, setIsRemembered] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);

  const { login, error, setError, clearError } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleFocus = (field) => setIsFocused((p) => ({ ...p, [field]: true }));
  const handleBlur = (field) => setIsFocused((p) => ({ ...p, [field]: false }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(credentials.email, credentials.password);
    if (result.success) {
      alert('✅ Login successful! Redirecting to dashboard...');
      navigate('/databases');
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!credentials.email) {
      setError('Please enter your email address first');
      return;
    }
    try {
      await authAPI.forgotPassword(credentials.email);
      alert('Password reset instructions have been sent to your email (if it exists)');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Failed to send reset instructions');
    }
  };

  return (
    <div className="ci-login-container">
      <div className="ci-login-card">
        <h2 className="ci-login-title">
          <span>Welcome Back</span>
        </h2>
        <p className="ci-login-subtitle">Sign in to your account</p>

        {error && (
          <div className="ci-error-message">
            <span className="ci-error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="ci-input-container">
            <label className={`ci-input-label ${isFocused.email ? 'ci-focused' : ''}`}>
              <span className="ci-label-text">Email or Username</span>
              <input
                name="email"
                type="text"
                placeholder="Enter email or username"
                className="ci-login-input"
                value={credentials.email}
                onChange={handleInputChange}
                onFocus={() => handleFocus('email')}
                onBlur={() => handleBlur('email')}
                required
                disabled={isLoading}
              />
            </label>
          </div>

          <div className="ci-input-container">
            <label className={`ci-input-label ${isFocused.password ? 'ci-focused' : ''}`}>
              <span className="ci-label-text">Password</span>
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                className="ci-login-input"
                value={credentials.password}
                onChange={handleInputChange}
                onFocus={() => handleFocus('password')}
                onBlur={() => handleBlur('password')}
                required
                disabled={isLoading}
              />
            </label>
          </div>

          <div className="ci-login-options">
            <div className="ci-checkbox">
              <input
                type="checkbox"
                id="remember"
                className="ci-actual-checkbox"
                checked={isRemembered}
                onChange={() => setIsRemembered(!isRemembered)}
                disabled={isLoading}
              />
              <label htmlFor="remember" className="ci-checkbox-label">
                <span>Remember me</span>
              </label>
            </div>
            <button
              type="button"
              className="ci-link-button"
              onClick={handleForgotPassword}
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className="ci-login-button" disabled={isLoading}>
            {isLoading ? (
              <div className="ci-loading-spinner" />
            ) : (
              <span className="ci-button-text">Sign In</span>
            )}
          </button>
        </form>

        <p className="ci-signup-prompt">
          Don't have an account?{' '}
          <Link to="/signup" className="ci-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;