import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SiMysql, SiMongodb, SiPostgresql } from 'react-icons/si';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from './Sidebar'; // Import the reusable sidebar
import styles from './Databases.module.css';

const Databases = () => {
  const [selectedDb, setSelectedDb] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleConnect = (dbName) => {
    setSelectedDb(dbName);
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const getThemeStyle = () => {
    switch(theme) {
      case 'neon-purple':
        return {
          primary: '#8A2BE2',
          secondary: '#FF00FF',
          accent: '#BF00FF',
          glow: '0 0 10px #8A2BE2, 0 0 20px #8A2BE2, 0 0 30px #8A2BE2'
        };
      case 'neon-green':
        return {
          primary: '#00FF00',
          secondary: '#39FF14',
          accent: '#00CC66',
          glow: '0 0 10px #00FF00, 0 0 20px #00FF00, 0 0 30px #00FF00'
        };
      case 'neon-red':
        return {
          primary: '#FF073A',
          secondary: '#FF3131',
          accent: '#FF0066',
          glow: '0 0 10px #FF073A, 0 0 20px #FF073A, 0 0 30px #FF073A'
        };
      case 'cyberpunk':
        return {
          primary: '#FF0099',
          secondary: '#F0F',
          accent: '#FF00CC',
          glow: '0 0 10px #FF0099, 0 0 20px #FF0099, 0 0 30px #FF0099'
        };
      default: // neon-blue
        return {
          primary: '#00DBDE',
          secondary: '#FC00FF',
          accent: '#0099FF',
          glow: '0 0 10px #00DBDE, 0 0 20px #00DBDE, 0 0 30px #00DBDE'
        };
    }
  };

  const themeStyle = getThemeStyle();

  return (
    <div className={styles.databases}>
      {/* Advanced Animated Background Elements */}
      <div className={styles.holographicGrid}></div>
      <div className={styles.neonParticles}></div>
      <div className={styles.dataStream}></div>
      
      <div className={styles.container}>
        {/* Use the reusable sidebar */}
        <Sidebar 
          isExpanded={isSidebarExpanded} 
          onToggle={setIsSidebarExpanded} 
        />

        {/* Main Content Area - Added left margin for when sidebar is expanded */}
        <main 
          className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ''}`}
        >
          <div className={styles.header}>
            <div className={styles.titleContainer}>
              <h1 className={styles.title}>QUANTUM DATA CORES</h1>
              <div className={styles.titleSub}>Active Neural Connections</div>
              <div className={styles.titleUnderline}></div>
            </div>
            
            <Link to="/add-connection" className={styles.addButton}>
              <span className={styles.addButtonIcon}>+</span>
              <span className={styles.addButtonText}>Establish Neural Link</span>
              <span className={styles.addButtonGlow} style={{boxShadow: themeStyle.glow}}></span>
            </Link>
          </div>

          <div className={styles.cardsContainer}>
            {/* Database Card 1 */}
            <div 
              className={`${styles.card} ${hoveredCard === 1 ? styles.cardHovered : ''}`}
              onMouseEnter={() => setHoveredCard(1)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={styles.cardGlow}></div>
              <div className={styles.cardHeader}>
                <h2>Coffee Shop Matrix</h2>
                <div className={styles.dbType}>
                  <SiPostgresql className={styles.dbIcon} />
                  <span>PostgreSQL v14.7</span>
                </div>
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.dataRow}>
                  <span className={styles.dataLabel}>Created by:</span>
                  <span className={styles.dataValue}>Admin</span>
                </div>
                <div className={styles.dataRow}>
                  <span className={styles.dataLabel}>Last accessed:</span>
                  <span className={styles.dataValue}>2.4 hours ago</span>
                </div>
                <div className={styles.dataDescription}>
                  Contains sales and customer orders for the coffee shop chain across 47 dimensions.
                </div>
              </div>
              
              <div className={styles.cardStats}>
                <div className={styles.stat}>
                  <div className={styles.statValue}>98%</div>
                  <div className={styles.statLabel}>Integrity</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>24/7</div>
                  <div className={styles.statLabel}>Uptime</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>47TB</div>
                  <div className={styles.statLabel}>Capacity</div>
                </div>
              </div>
              
              <button 
                className={`${styles.connectButton} ${selectedDb === 'Coffee Shop' ? styles.connecting : ''}`}
                onClick={() => handleConnect('Coffee Shop')}
                disabled={selectedDb === 'Coffee Shop'}
              >
                <span className={styles.connectText}>
                  {selectedDb === 'Coffee Shop' ? 'Neural Linking...' : 'Connect & Chat'}
                </span>
                <span className={styles.connectProgress}></span>
              </button>
            </div>

            {/* Database Card 2 */}
            <div 
              className={`${styles.card} ${hoveredCard === 2 ? styles.cardHovered : ''}`}
              onMouseEnter={() => setHoveredCard(2)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={styles.cardGlow}></div>
              <div className={styles.cardHeader}>
                <h2>Retail Nexus</h2>
                <div className={styles.dbType}>
                  <SiMysql className={styles.dbIcon} />
                  <span>MySQL v8.0</span>
                </div>
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.dataRow}>
                  <span className={styles.dataLabel}>Created by:</span>
                  <span className={styles.dataValue}>System AI</span>
                </div>
                <div className={styles.dataRow}>
                  <span className={styles.dataLabel}>Last accessed:</span>
                  <span className={styles.dataValue}>Yesterday</span>
                </div>
                <div className={styles.dataDescription}>
                  Manages product inventory, pricing, and store locations across quantum supply chain.
                </div>
              </div>
              
              <div className={styles.cardStats}>
                <div className={styles.stat}>
                  <div className={styles.statValue}>95%</div>
                  <div className={styles.statLabel}>Integrity</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>23.5/7</div>
                  <div className={styles.statLabel}>Uptime</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>32TB</div>
                  <div className={styles.statLabel}>Capacity</div>
                </div>
              </div>
              
              <button 
                className={`${styles.connectButton} ${selectedDb === 'Retail Store' ? styles.connecting : ''}`}
                onClick={() => handleConnect('Retail Store')}
                disabled={selectedDb === 'Retail Store'}
              >
                <span className={styles.connectText}>
                  {selectedDb === 'Retail Store' ? 'Neural Linking...' : 'Connect & Chat'}
                </span>
                <span className={styles.connectProgress}></span>
              </button>
            </div>
            
            {/* Database Card 3 - New */}
            <div 
              className={`${styles.card} ${hoveredCard === 3 ? styles.cardHovered : ''}`}
              onMouseEnter={() => setHoveredCard(3)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={styles.cardGlow}></div>
              <div className={styles.cardHeader}>
                <h2>Quantum Analytics</h2>
                <div className={styles.dbType}>
                  <SiMongodb className={styles.dbIcon} />
                  <span>MongoDB v6.0</span>
                </div>
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.dataRow}>
                  <span className={styles.dataLabel}>Created by:</span>
                  <span className={styles.dataValue}>Quantum AI</span>
                </div>
                <div className={styles.dataRow}>
                  <span className={styles.dataLabel}>Last accessed:</span>
                  <span className={styles.dataValue}>5.2 hours ago</span>
                </div>
                <div className={styles.dataDescription}>
                  Real-time analytics and predictive modeling for multidimensional data streams.
                </div>
              </div>
              
              <div className={styles.cardStats}>
                <div className={styles.stat}>
                  <div className={styles.statValue}>99%</div>
                  <div className={styles.statLabel}>Integrity</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>24/7</div>
                  <div className={styles.statLabel}>Uptime</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>64TB</div>
                  <div className={styles.statLabel}>Capacity</div>
                </div>
              </div>
              
              <button 
                className={`${styles.connectButton} ${selectedDb === 'Quantum Analytics' ? styles.connecting : ''}`}
                onClick={() => handleConnect('Quantum Analytics')}
                disabled={selectedDb === 'Quantum Analytics'}
              >
                <span className={styles.connectText}>
                  {selectedDb === 'Quantum Analytics' ? 'Neural Linking...' : 'Connect & Chat'}
                </span>
                <span className={styles.connectProgress}></span>
              </button>
            </div>
          </div>

          {/* Database Ecosystem Section */}
          <div className={styles.ecosystem}>
            <h3 className={styles.ecosystemTitle}>SUPPORTED QUANTUM DATABASES</h3>
            <p className={styles.ecosystemSubtitle}>Fully compatible with multidimensional data structures</p>
            
            <div className={styles.iconsContainer}>
              <div className={styles.iconItem}>
                <div className={styles.iconWrapper}>
                  <SiPostgresql className={styles.dbIconLarge} />
                  <div className={styles.iconHalo}></div>
                  <div className={styles.iconParticles}></div>
                </div>
                <p>PostgreSQL</p>
                <div className={styles.compatibility}>
                  <span className={styles.compatibilityText}>Quantum Compatible</span>
                </div>
              </div>
              
              <div className={styles.iconItem}>
                <div className={styles.iconWrapper}>
                  <SiMysql className={styles.dbIconLarge} />
                  <div className={styles.iconHalo}></div>
                  <div className={styles.iconParticles}></div>
                </div>
                <p>MySQL</p>
                <div className={styles.compatibility}>
                  <span className={styles.compatibilityText}>Neural Optimized</span>
                </div>
              </div>
              
              <div className={styles.iconItem}>
                <div className={styles.iconWrapper}>
                  <SiMongodb className={styles.dbIconLarge} />
                  <div className={styles.iconHalo}></div>
                  <div className={styles.iconParticles}></div>
                </div>
                <p>MongoDB</p>
                <div className={styles.compatibility}>
                  <span className={styles.compatibilityText}>Holographic Ready</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Databases;