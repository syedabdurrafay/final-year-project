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
  };

  // Get theme colors based on the selected theme
  const getThemeColors = () => {
    switch (theme) {
      case 'neon-blue':
        return {
          primary: '#1E90FF',
          secondary: '#00BFFF',
          gradient: 'linear-gradient(90deg, #1E90FF, #00BFFF)'
        };
      case 'neon-purple':
        return {
          primary: '#8A2BE2',
          secondary: '#9370DB',
          gradient: 'linear-gradient(90deg, #8A2BE2, #9370DB)'
        };
      case 'neon-green':
        return {
          primary: '#00FF00',
          secondary: '#39FF14',
          gradient: 'linear-gradient(90deg, #00FF00, #39FF14)'
        };
      case 'neon-red':
        return {
          primary: '#FF073A',
          secondary: '#FF3131',
          gradient: 'linear-gradient(90deg, #FF073A, #FF3131)'
        };
      case 'cyberpunk':
        return {
          primary: '#FF0099',
          secondary: '#F0F',
          gradient: 'linear-gradient(90deg, #FF0099, #F0F)'
        };
      default:
        return {
          primary: '#1E90FF',
          secondary: '#00BFFF',
          gradient: 'linear-gradient(90deg, #1E90FF, #00BFFF)'
        };
    }
  };

  const value = {
    theme,
    changeTheme,
    colors: getThemeColors()
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={`theme-${theme}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};