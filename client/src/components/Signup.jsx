// src/pages/Signup.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Signup.css';

const Signup = () => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isAgreed, setIsAgreed] = useState(false);
  const [isFocused, setIsFocused] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);

  const { signup, error, setError, clearError } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/\d/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    if (error) clearError();
    if (name === 'password') setPasswordErrors(validatePassword(value));
  };

  const handleFocus = (field) => setIsFocused((p) => ({ ...p, [field]: true }));
  const handleBlur = (field) => setIsFocused((p) => ({ ...p, [field]: false }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userData.password !== userData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (passwordErrors.length > 0) {
      setError('Please fix password requirements');
      return;
    }
    if (!isAgreed) {
      setError('You must agree to the terms and conditions');
      return;
    }

    setIsLoading(true);

    const result = await signup({
      username: userData.username,
      email: userData.email,
      password: userData.password,
    });

    if (result.success) {
      alert('🎉 Account created successfully! Redirecting...');
      navigate('/databases');
    }

    setIsLoading(false);
  };

  return (
    <div className="ci-signup-container">
      <div className="ci-signup-card">
        <h2 className="ci-signup-title">
          <span>Create Account</span>
        </h2>
        <p className="ci-signup-subtitle">Join our platform to get started</p>

        {error && (
          <div className="ci-error-message">
            <span className="ci-error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="ci-input-container">
            <label className={`ci-input-label ${isFocused.username ? 'ci-focused' : ''}`}>
              <span className="ci-label-text">Username</span>
              <input
                name="username"
                type="text"
                placeholder="Enter your username"
                className="ci-signup-input"
                value={userData.username}
                onChange={handleInputChange}
                onFocus={() => handleFocus('username')}
                onBlur={() => handleBlur('username')}
                required
                minLength={3}
                disabled={isLoading}
              />
            </label>
          </div>

          <div className="ci-input-container">
            <label className={`ci-input-label ${isFocused.email ? 'ci-focused' : ''}`}>
              <span className="ci-label-text">Email Address</span>
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                className="ci-signup-input"
                value={userData.email}
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
                placeholder="Create a secure password"
                className="ci-signup-input"
                value={userData.password}
                onChange={handleInputChange}
                onFocus={() => handleFocus('password')}
                onBlur={() => handleBlur('password')}
                required
                disabled={isLoading}
              />
            </label>

            {userData.password && (
              <div className="ci-password-requirements">
                <p>Password must contain:</p>
                <ul>
                  {['At least 8 characters', 'One uppercase letter',
                    'One lowercase letter', 'One number', 'One special character'].map((req) => (
                    <li key={req} className={passwordErrors.includes(req) ? 'invalid' : 'valid'}>
                      {passwordErrors.includes(req) ? '✗' : '✓'} {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="ci-input-container">
            <label className={`ci-input-label ${isFocused.confirmPassword ? 'ci-focused' : ''}`}>
              <span className="ci-label-text">Confirm Password</span>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className="ci-signup-input"
                value={userData.confirmPassword}
                onChange={handleInputChange}
                onFocus={() => handleFocus('confirmPassword')}
                onBlur={() => handleBlur('confirmPassword')}
                required
                disabled={isLoading}
              />
            </label>

            {userData.confirmPassword && userData.password !== userData.confirmPassword && (
              <div className="ci-error-message small">Passwords do not match</div>
            )}
          </div>

          <div className="ci-signup-options">
            <div className="ci-checkbox">
              <input
                type="checkbox"
                id="terms"
                className="ci-actual-checkbox"
                checked={isAgreed}
                onChange={() => setIsAgreed(!isAgreed)}
                disabled={isLoading}
              />
              <label htmlFor="terms" className="ci-checkbox-label">
                <span>I agree to the terms and conditions</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="ci-signup-button"
            disabled={!isAgreed || isLoading || passwordErrors.length > 0}
          >
            {isLoading ? (
              <div className="ci-loading-spinner"></div>
            ) : (
              <span className="ci-button-text">Create Account</span>
            )}
          </button>
        </form>

        <p className="ci-login-prompt">
          Already have an account?{' '}
          <Link to="/login" className="ci-link">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;