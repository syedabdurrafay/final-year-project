import { FaFacebook, FaTwitter, FaLinkedin, FaGithub, FaArrowUp } from 'react-icons/fa'
import { FiMail } from 'react-icons/fi'
import { motion } from 'framer-motion'
import styles from './Footer.module.css'

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <footer className={styles.footer}>
      {/* Futuristic background elements */}
      <div className={styles.cyberGrid}></div>
      <div className={styles.holographicLine}></div>
      <div className={styles.particlesContainer}>
        {[...Array(15)].map((_, i) => (
          <div key={i} className={styles.particle}></div>
        ))}
      </div>
      
      <div className={styles.content}>
        {/* Footer columns */}
        <div className={styles.columns}>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>
              <span className={styles.hologramText}>ChatInsight</span>
            </h3>
            <p className={styles.columnDescription}>
              Transforming conversations into actionable insights with AI-powered analytics.
            </p>
          </div>
          
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Quick Links</h3>
            <ul className={styles.linkList}>
              <li>
                <motion.a 
                  href="/features" 
                  className={styles.link}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className={styles.linkBullet}></span>Features
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="/pricing" 
                  className={styles.link}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className={styles.linkBullet}></span>Pricing
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="/blog" 
                  className={styles.link}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className={styles.linkBullet}></span>Blog
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="/contact" 
                  className={styles.link}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className={styles.linkBullet}></span>Contact
                </motion.a>
              </li>
            </ul>
          </div>
          
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Legal</h3>
            <ul className={styles.linkList}>
              <li>
                <motion.a 
                  href="/privacy" 
                  className={styles.link}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className={styles.linkBullet}></span>Privacy Policy
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="/terms" 
                  className={styles.link}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className={styles.linkBullet}></span>Terms of Service
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="/cookies" 
                  className={styles.link}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className={styles.linkBullet}></span>Cookie Policy
                </motion.a>
              </li>
            </ul>
          </div>
          
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Neural Updates</h3>
            <p className={styles.columnDescription}>
              Receive the latest updates directly to your neural interface.
            </p>
            <div className={styles.subscribeForm}>
              <input 
                type="email" 
                placeholder="Your cyber-address" 
                className={styles.emailInput} 
              />
              <motion.button 
                className={styles.subscribeButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiMail />
                <span className={styles.subscribeGlow}></span>
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Social and copyright */}
        <div className={styles.bottomSection}>
          <div className={styles.socialLinks}>
            <motion.a 
              href="https://facebook.com" 
              whileHover={{ y: -5, color: '#1877F2' }}
              className={styles.socialLink}
            >
              <FaFacebook />
              <span className={styles.socialPulse}></span>
            </motion.a>
            <motion.a 
              href="https://twitter.com" 
              whileHover={{ y: -5, color: '#1DA1F2' }}
              className={styles.socialLink}
            >
              <FaTwitter />
              <span className={styles.socialPulse}></span>
            </motion.a>
            <motion.a 
              href="https://linkedin.com" 
              whileHover={{ y: -5, color: '#0A66C2' }}
              className={styles.socialLink}
            >
              <FaLinkedin />
              <span className={styles.socialPulse}></span>
            </motion.a>
            <motion.a 
              href="https://github.com" 
              whileHover={{ y: -5, color: '#f0f6fc' }}
              className={styles.socialLink}
            >
              <FaGithub />
              <span className={styles.socialPulse}></span>
            </motion.a>
          </div>
          
          <p className={styles.copyright}>
            © {new Date().getFullYear()} ChatInsight. All systems operational.
          </p>
          
          <motion.button 
            onClick={scrollToTop}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={styles.scrollToTop}
          >
            <FaArrowUp />
            <span className={styles.scrollToTopGlow}></span>
          </motion.button>
        </div>
      </div>
    </footer>
  )
}

export default Footer