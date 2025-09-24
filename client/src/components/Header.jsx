import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import ThemeSwitcher from '../contexts/ThemeSwitcher'
import './Header.css'

const Header = ({ theme }) => {
  const getLogoGradient = () => {
    switch(theme) {
      case 'neon-purple':
        return 'linear-gradient(90deg, #8A2BE2, #FF00FF, #8A2BE2)';
      case 'neon-green':
        return 'linear-gradient(90deg, #00FF00, #39FF14, #00FF00)';
      case 'neon-red':
        return 'linear-gradient(90deg, #FF073A, #FF3131, #FF073A)';
      case 'cyberpunk':
        return 'linear-gradient(90deg, #FF0099, #F0F, #FF0099)';
      default: // neon-blue
        return 'linear-gradient(90deg, #00DBDE, #FC00FF, #00DBDE)';
    }
  };

  const getButtonStyle = () => {
    switch(theme) {
      case 'neon-purple':
        return {
          background: 'linear-gradient(90deg, #8A2BE2, #FF00FF)',
          boxShadow: '0 0 10px #8A2BE2, 0 0 20px #8A2BE2, inset 0 0 5px rgba(255, 255, 255, 0.3)'
        };
      case 'neon-green':
        return {
          background: 'linear-gradient(90deg, #00FF00, #39FF14)',
          boxShadow: '0 0 10px #00FF00, 0 0 20px #00FF00, inset 0 0 5px rgba(255, 255, 255, 0.3)'
        };
      case 'neon-red':
        return {
          background: 'linear-gradient(90deg, #FF073A, #FF3131)',
          boxShadow: '0 0 10px #FF073A, 0 0 20px #FF073A, inset 0 0 5px rgba(255, 255, 255, 0.3)'
        };
      case 'cyberpunk':
        return {
          background: 'linear-gradient(90deg, #FF0099, #F0F)',
          boxShadow: '0 0 10px #FF0099, 0 0 20px #FF0099, inset 0 0 5px rgba(255, 255, 255, 0.3)'
        };
      default: // neon-blue
        return {
          background: 'linear-gradient(90deg, #00DBDE, #FC00FF)',
          boxShadow: '0 0 10px #00DBDE, 0 0 20px #00DBDE, inset 0 0 5px rgba(255, 255, 255, 0.3)'
        };
    }
  };

  const buttonStyle = getButtonStyle();

  return (
    <header className="header">
      {/* Futuristic background elements */}
      <div className="cyber-grid"></div>
      <div className="holographic-line"></div>
      
      <Link to="/" className="header-logo-link">
        <h1 className="header-logo" style={{ backgroundImage: getLogoGradient() }}>
          Chat-Insight
          <span className="logo-glow"></span>
        </h1>
      </Link>
      
      <div className="header-nav">
        <ThemeSwitcher />
        <Link 
          to="/blog" 
          className="header-nav-link"
        >
          <span className="link-bullet"></span>
          Blog
        </Link>
        <Link 
          to="/login" 
          className="header-login-btn"
          style={{ 
            background: buttonStyle.background,
            boxShadow: buttonStyle.boxShadow,
          }}
        >
          <span className="btn-glow"></span>
          Login
        </Link>
      </div>
    </header>
  )
}

export default Header