import { useTheme } from '../contexts/ThemeContext'
import styles from './Background.module.css'

const Background = ({ children, theme }) => {
  const getGradient = () => {
    switch(theme) {
      case 'neon-purple':
        return 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
      case 'neon-green':
        return 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)';
      case 'neon-red':
        return 'linear-gradient(135deg, #200122, #6f0000, #2c003e)';
      case 'cyberpunk':
        return 'linear-gradient(135deg, #ff0099, #493240, #1a1a2e)';
      default: // neon-blue
        return 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)';
    }
  };

  // Get particle color based on theme
  const getParticleColor = () => {
    switch(theme) {
      case 'neon-purple':
        return '#a855f7';
      case 'neon-green':
        return '#10b981';
      case 'neon-red':
        return '#ef4444';
      case 'cyberpunk':
        return '#ff0099';
      default: // neon-blue
        return '#3b82f6';
    }
  };

  return (
    <div className={styles.background} style={{ background: getGradient() }}>
      {/* Animated grid overlay */}
      <div className={styles.gridOverlay}></div>
      
      {/* Animated particles */}
      <div className={styles.particlesContainer}>
        {[...Array(30)].map((_, i) => (
          <div 
            key={i} 
            className={styles.particle}
            style={{
              '--particle-color': getParticleColor(),
              '--particle-size': `${Math.random() * 4 + 1}px`,
              '--particle-delay': `${Math.random() * 5}s`,
              '--particle-duration': `${Math.random() * 10 + 10}s`,
              '--particle-left': `${Math.random() * 100}%`,
              '--particle-top': `${Math.random() * 100}%`,
            }}
          ></div>
        ))}
      </div>
      
      {/* Glowing orbs */}
      <div className={styles.orb} style={{ '--orb-color': getParticleColor() }}></div>
      <div className={styles.orb} style={{ 
        '--orb-color': getParticleColor(),
        '--orb-size': '120px',
        '--orb-top': '70%',
        '--orb-left': '80%',
        '--orb-delay': '2s'
      }}></div>
      
      {/* Scanline effect */}
      <div className={styles.scanline}></div>
      
      {/* Content */}
      {children}
    </div>
  )
}

export default Background