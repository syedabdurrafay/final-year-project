import Header from './Header'
import Footer from './Footer'
import Background from './Background'
import { useTheme } from '../contexts/ThemeContext'
import { useLocation } from 'react-router-dom'
import './Layout.css'

const Layout = ({ children }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <Background theme={theme}>
      {isHomePage && <Header theme={theme} />}
      <main className="layout-main">
        {children}
      </main>
      {isHomePage && <Footer theme={theme} />}
    </Background>
  )
}

export default Layout