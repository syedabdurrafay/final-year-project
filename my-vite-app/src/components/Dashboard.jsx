import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import DataVisualization from './DataVisualization';
import Sidebar from './Sidebar'; // Import the reusable sidebar
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleConnectDbClick = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      navigate('/databases');
    }, 1000);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const notification = document.createElement('div');
      notification.className = `${styles.futuristicNotification} ${styles[`notification-${theme}`]}`;
      notification.innerHTML = `
        <span class="${styles.notificationIcon}">⚡</span>
        <span>Analyzing: ${searchQuery}</span>
        <div class="${styles.notificationProgress}"></div>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  };

  const getButtonStyle = () => {
    switch(theme) {
      case 'neon-purple':
        return {
          background: 'linear-gradient(90deg, #8A2BE2, #FF00FF)',
          boxShadow: '0 0 15px #8A2BE2, 0 0 25px #8A2BE2'
        };
      case 'neon-green':
        return {
          background: 'linear-gradient(90deg, #00FF00, #39FF14)',
          boxShadow: '0 0 15px #00FF00, 0 0 25px #00FF00'
        };
      case 'neon-red':
        return {
          background: 'linear-gradient(90deg, #FF073A, #FF3131)',
          boxShadow: '0 0 15px #FF073A, 0 0 25px #FF073A'
        };
      case 'cyberpunk':
        return {
          background: 'linear-gradient(90deg, #FF0099, #F0F)',
          boxShadow: '0 0 15px #FF0099, 0 0 25px #FF0099'
        };
      default: // neon-blue
        return {
          background: 'linear-gradient(90deg, #00DBDE, #FC00FF)',
          boxShadow: '0 0 15px #00DBDE, 0 0 25px #FC00FF'
        };
    }
  };

  const buttonStyle = getButtonStyle();

  return (
    <div className={styles.dashboard}>
      {/* Holographic background elements */}
      <div className={styles.holographicBg}></div>
      <div className={styles.floatingOrbs}>
        <div className={styles.orb1}></div>
        <div className={styles.orb2}></div>
        <div className={styles.orb3}></div>
      </div>
      
      <div className={styles.container}>
        {/* Use the reusable sidebar */}
        <Sidebar 
          isExpanded={isSidebarExpanded} 
          onToggle={setIsSidebarExpanded} 
        />

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Futuristic Heading with Holographic Effect */}
          <h1 className={styles.heading}>
            <span className={styles.headingGlitch} data-text="Let's get started">
              Let's get started
            </span>
          </h1>

          {/* Advanced Search Bar */}
          <div className={styles.searchBar}>
            {/* Database connect button */}
            <button
              onClick={handleConnectDbClick}
              disabled={isConnecting}
              className={styles.connectButton}
              style={{
                background: buttonStyle.background,
                boxShadow: buttonStyle.boxShadow,
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1) translateY(-2px)';
                e.target.style.boxShadow = `${buttonStyle.boxShadow}, 0 0 30px ${theme === 'neon-purple' ? '#8A2BE2' : 
                  theme === 'neon-green' ? '#00FF00' : 
                  theme === 'neon-red' ? '#FF073A' : 
                  theme === 'cyberpunk' ? '#FF0099' : '#00DBDE'}`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = buttonStyle.boxShadow;
              }}
            >
              {isConnecting ? (
                <div className={styles.holographicSpinner}></div>
              ) : (
                <span className={styles.holographicIcon}>+</span>
              )}
            </button>

            {/* Search input with futuristic styling */}
            <div className={styles.searchInputContainer}>
              <input
                type="text"
                placeholder="Query the neural network..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyUp={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                className={styles.searchInput}
              />
              <div className={styles.inputUnderline}></div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSearchSubmit}
              className={styles.submitButton}
              style={{
                background: buttonStyle.background,
                boxShadow: buttonStyle.boxShadow,
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1) translateY(-2px)';
                e.target.style.boxShadow = `${buttonStyle.boxShadow}, 0 0 30px ${theme === 'neon-purple' ? '#8A2BE2' : 
                  theme === 'neon-green' ? '#00FF00' : 
                  theme === 'neon-red' ? '#FF073A' : 
                  theme === 'cyberpunk' ? '#FF0099' : '#00DBDE'}`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = buttonStyle.boxShadow;
              }}
            >
              <span className={styles.holographicIcon}>🔍</span>
            </button>
          </div>

          {/* Data Visualization Component */}
          <DataVisualization theme={theme} />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;