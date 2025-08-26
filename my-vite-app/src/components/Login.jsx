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
    if (result.success) navigate('/database');

    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!credentials.email) {
      setError('Please enter your email address first');
      return;
    }
    try {
      await authAPI.forgotPassword(credentials.email);
      alert('Password reset instructions have been sent to your email');
    } catch (error) {
      setError('Failed to send reset instructions');
    }
  };

  return (
    <div className="ci-login-container">
      <div className="ci-holographic-effect"></div>
      <div className="ci-particles-background"></div>

      <div className="ci-login-card">
        <div className="ci-cyber-glitch" data-text="ChatInsight">ChatInsight</div>

        <div className="ci-biometric-prompt">
          <div className="ci-retina-scanner"></div>
          <p>Retina scan available</p>
        </div>

        <h2 className="ci-login-title">
          <span className="ci-title-glow">Authentication Required</span>
        </h2>
        <p className="ci-login-subtitle">Access your neural interface dashboard</p>

        {error && (
          <div className="ci-error-message">
            <span className="ci-error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="ci-input-hologram">
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
              <div className="ci-input-underline"></div>
            </label>
          </div>

          <div className="ci-input-hologram">
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
              <div className="ci-input-underline"></div>
            </label>
          </div>

          <div className="ci-login-options">
            <div className="ci-cyber-checkbox">
              <input
                type="checkbox"
                id="remember"
                className="ci-actual-checkbox"
                checked={isRemembered}
                onChange={() => setIsRemembered(!isRemembered)}
                disabled={isLoading}
              />
              <label htmlFor="remember" className="ci-cyber-check">
                <span>Remember me</span>
              </label>
            </div>
            <button type="button" className="ci-holographic-link" onClick={handleForgotPassword} disabled={isLoading}>
              Forgot credentials?
            </button>
          </div>

          <button type="submit" className="ci-neural-login-button" disabled={isLoading}>
            {isLoading ? <div className="ci-loading-spinner"></div> : (<>
              <span className="ci-button-text">Neural Login</span>
              <div className="ci-button-shine"></div>
              <div className="ci-button-hover-effect"></div>
            </>)}
          </button>
        </form>

        <p className="ci-signup-prompt">
          New to the network? <Link to="/signup" className="ci-holographic-link">Request access</Link>
        </p>
      </div>

      <div className="ci-cyber-console">
        <div className="ci-console-text">
          {isLoading ? 'Authenticating...' : 'System secure. Firewall active. Ready for authentication.'}
        </div>
        <div className="ci-console-lights">
          <div className="ci-light ci-pulsating"></div>
          <div className="ci-light"></div>
          <div className="ci-light"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;