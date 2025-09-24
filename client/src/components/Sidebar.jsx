import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import styles from './Sidebar.module.css';

const Sidebar = ({ isExpanded: initialExpanded = true, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { theme } = useTheme();
  const location = useLocation();

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Auto-collapse on mobile
      if (mobile) {
        setIsExpanded(false);
        if (onToggle) onToggle(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onToggle]);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onToggle) onToggle(newState);
  };

  const getButtonStyle = () => {
    switch(theme) {
      case 'neon-purple':
        return { color: '#8A2BE2', glow: '0 0 10px #8A2BE2' };
      case 'neon-green':
        return { color: '#00FF00', glow: '0 0 10px #00FF00' };
      case 'neon-red':
        return { color: '#FF073A', glow: '0 0 10px #FF073A' };
      case 'cyberpunk':
        return { color: '#FF0099', glow: '0 0 10px #FF0099' };
      case 'light':
        return { color: '#4f46e5', glow: '0 0 10px #4f46e5' };
      default: // neon-blue
        return { color: '#00DBDE', glow: '0 0 10px #00DBDE' };
    }
  };

  const themeStyle = getButtonStyle();

  // Dashboard-specific sidebar items
  const dashboardItems = [
    { path: "#", icon: "+", text: "New Neural Chat" },
    { path: "#", icon: "📊", text: "Quantum Dashboard" },
    { path: "/databases", icon: "🛰️", text: "Data Sources" }
  ];

  // Databases-specific sidebar items
  const databaseItems = [
    { path: "#", icon: "🧠", text: "Neural Interface" },
    { path: "/dashboard", icon: "📊", text: "Dashboard" },
    { path: "/databases", icon: "💾", text: "Data Cores", active: true },
    { path: "/analytics", icon: "📈", text: "Quantum Analytics" }
  ];

  // Determine which items to show based on current page
  const sidebarItems = location.pathname.includes('databases') ? databaseItems : dashboardItems;

  return (
    <>
      {/* Overlay for mobile when sidebar is expanded */}
      {isMobile && isExpanded && (
        <div 
          className={styles.overlay}
          onClick={() => {
            setIsExpanded(false);
            if (onToggle) onToggle(false);
          }}
        />
      )}
      
      <aside className={`${styles.sidebar} ${styles[theme]} ${isExpanded ? styles.expanded : styles.collapsed}`}>
        <div className={styles.sidebarHeader}>
          {isExpanded && (
            <h2 className={styles.sidebarTitle}>
              {location.pathname.includes('databases') ? 'QUANTUM DATA NEXUS' : 'ChatInsight'}
            </h2>
          )}
          <button 
            className={styles.sidebarToggle}
            onClick={handleToggle}
            style={{ color: themeStyle.color, boxShadow: themeStyle.glow }}
          >
            {isExpanded ? '◀' : '▶'}
          </button>
        </div>
        
        {isExpanded && (
          <div className={styles.sidebarContent}>
            {sidebarItems.map((item, index) => (
              <Link 
                key={index}
                to={item.path} 
                className={`${styles.sidebarLink} ${item.active ? styles.active : ''}`}
                style={{ 
                  textShadow: location.pathname === item.path ? themeStyle.glow : 'none',
                  borderColor: location.pathname === item.path ? themeStyle.color : 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.textShadow = themeStyle.glow;
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== item.path) {
                    e.target.style.textShadow = 'none';
                  }
                }}
                onClick={() => {
                  if (isMobile) {
                    setIsExpanded(false);
                    if (onToggle) onToggle(false);
                  }
                }}
              >
                <span className={styles.linkIcon}>{item.icon}</span>
                <span className={styles.linkText}>{item.text}</span>
              </Link>
            ))}
          </div>
        )}

        {isExpanded && location.pathname.includes('databases') && (
          <div className={styles.sidebarFooter}>
            <div className={styles.systemStatus}>
              <div className={styles.statusIndicator}></div>
              <span>System: Online</span>
              <span className={styles.quantumSignal}>Quantum Signal: 98%</span>
            </div>
          </div>
        )}

        {/* Floating toggle button for mobile when sidebar is collapsed */}
        {isMobile && !isExpanded && (
          <button 
            className={styles.mobileToggleButton}
            onClick={handleToggle}
            style={{ 
              backgroundColor: themeStyle.color,
              boxShadow: themeStyle.glow
            }}
          >
            ☰
          </button>
        )}
      </aside>
    </>
  );
};

export default Sidebar;