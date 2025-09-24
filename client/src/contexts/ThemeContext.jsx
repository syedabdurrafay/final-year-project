import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('neon-blue');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyThemeToDocument(newTheme);
  };

  // New function to toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'neon-blue' : 'light';
    changeTheme(newTheme);
  };

  const applyThemeToDocument = (themeName) => {
    if (themeName === "light") {
      document.documentElement.className = "theme-light";
    } else {
      document.documentElement.className = `theme-${themeName}`;
    }
  };

  const getThemeColors = () => {
    switch (theme) {
      case 'light':
        return {
          primary: '#4f46e5',
          secondary: '#6366f1',
          gradient: 'linear-gradient(90deg, #4f46e5, #6366f1)',
          background: '#f8fafc',
          text: '#1e293b',
          card: '#ffffff',
          border: '#e2e8f0'
        };
      case 'neon-blue':
        return {
          primary: '#1E90FF',
          secondary: '#00BFFF',
          gradient: 'linear-gradient(90deg, #1E90FF, #00BFFF)',
          background: '#0a0a20',
          text: '#ffffff',
          card: 'rgba(20, 25, 45, 0.7)',
          border: 'rgba(100, 120, 255, 0.2)'
        };
      case 'neon-purple':
        return {
          primary: '#8A2BE2',
          secondary: '#9370DB',
          gradient: 'linear-gradient(90deg, #8A2BE2, #9370DB)',
          background: '#1a0a2a',
          text: '#ffffff',
          card: 'rgba(30, 15, 45, 0.7)',
          border: 'rgba(138, 43, 226, 0.2)'
        };
      case 'neon-green':
        return {
          primary: '#00FF00',
          secondary: '#39FF14',
          gradient: 'linear-gradient(90deg, #00FF00, #39FF14)',
          background: '#0a200a',
          text: '#ffffff',
          card: 'rgba(20, 45, 20, 0.7)',
          border: 'rgba(0, 255, 0, 0.2)'
        };
      case 'neon-red':
        return {
          primary: '#FF073A',
          secondary: '#FF3131',
          gradient: 'linear-gradient(90deg, #FF073A, #FF3131)',
          background: '#200a0a',
          text: '#ffffff',
          card: 'rgba(45, 20, 20, 0.7)',
          border: 'rgba(255, 7, 58, 0.2)'
        };
      case 'cyberpunk':
        return {
          primary: '#FF0099',
          secondary: '#F0F',
          gradient: 'linear-gradient(90deg, #FF0099, #F0F)',
          background: '#150a20',
          text: '#ffffff',
          card: 'rgba(30, 15, 45, 0.7)',
          border: 'rgba(255, 0, 153, 0.2)'
        };
      default:
        return {
          primary: '#1E90FF',
          secondary: '#00BFFF',
          gradient: 'linear-gradient(90deg, #1E90FF, #00BFFF)',
          background: '#0a0a20',
          text: '#ffffff',
          card: 'rgba(20, 25, 45, 0.7)',
          border: 'rgba(100, 120, 255, 0.2)'
        };
    }
  };

  const value = {
    theme,
    changeTheme,
    toggleTheme, // Add toggleTheme to the context value
    colors: getThemeColors()
  };

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};