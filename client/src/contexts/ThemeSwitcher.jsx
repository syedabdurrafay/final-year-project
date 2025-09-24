import { useState } from 'react';
import { useTheme } from './ThemeContext';
import './ThemeSwitcher.css';

const ThemeSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, changeTheme } = useTheme();

  const themes = [
    { name: 'light', label: 'Light', color: '#4f46e5', icon: '☀️' },
    { name: 'neon-blue', label: 'Neon Blue', color: '#00DBDE', icon: '🔵' },
    { name: 'neon-purple', label: 'Neon Purple', color: '#8A2BE2', icon: '🟣' },
    { name: 'neon-green', label: 'Neon Green', color: '#00FF00', icon: '🟢' },
    { name: 'neon-red', label: 'Neon Red', color: '#FF073A', icon: '🔴' },
    { name: 'cyberpunk', label: 'Cyberpunk', color: '#FF0099', icon: '👁️' },
  ];

  return (
    <div className="theme-switcher">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-switcher-button"
        aria-label="Change theme"
      >
        {themes.find(t => t.name === theme)?.icon || '🎨'}
      </button>

      {isOpen && (
        <div className="theme-switcher-dropdown">
          {themes.map((t) => (
            <div
              key={t.name}
              onClick={() => {
                changeTheme(t.name);
                setIsOpen(false);
              }}
              className={`theme-option ${theme === t.name ? 'active' : ''}`}
            >
              <span className="theme-icon">{t.icon}</span>
              <div
                className="theme-color-indicator"
                style={{ backgroundColor: t.color, boxShadow: `0 0 5px ${t.color}` }}
              />
              <span className="theme-label">{t.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;