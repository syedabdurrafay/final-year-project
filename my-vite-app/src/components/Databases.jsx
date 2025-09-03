import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SiMysql, SiMongodb, SiPostgresql } from 'react-icons/si';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from './Sidebar';
import { databaseAPI } from '../services/api';
import styles from './Databases.module.css';

const Databases = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingDb, setConnectingDb] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await databaseAPI.getConnections();
      setConnections(response.data);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (connectionId) => {
    try {
      setConnectingDb(connectionId);
      
      // Store the selected connection in localStorage for the dashboard to use
      localStorage.setItem('selectedConnection', connectionId);
      
      // Fetch schema to verify connection is working
      const schemaResponse = await databaseAPI.getSchema(connectionId);
      
      if (schemaResponse.data.success) {
        // Show success notification
        const notification = document.createElement('div');
        notification.className = `${styles.futuristicNotification} ${styles[`notification-${theme}`]}`;
        notification.innerHTML = `
          <span class="${styles.notificationIcon}">✅</span>
          <span>Database connected successfully!</span>
          <div class="${styles.notificationProgress}"></div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
          navigate('/dashboard');
        }, 1500);
      } else {
        throw new Error(schemaResponse.data.message);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.className = `${styles.futuristicNotification} ${styles.notificationError}`;
      notification.innerHTML = `
        <span class="${styles.notificationIcon}">❌</span>
        <span>Connection failed: ${error.message}</span>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
      
      setConnectingDb(null);
    }
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

  const getDbIcon = (dbType) => {
    switch(dbType) {
      case 'postgresql': return <SiPostgresql className={styles.dbIcon} />;
      case 'mysql': return <SiMysql className={styles.dbIcon} />;
      case 'mongodb': return <SiMongodb className={styles.dbIcon} />;
      default: return <SiPostgresql className={styles.dbIcon} />;
    }
  };

  const getDbIconLarge = (dbType) => {
    switch(dbType) {
      case 'postgresql': return <SiPostgresql className={styles.dbIconLarge} />;
      case 'mysql': return <SiMysql className={styles.dbIconLarge} />;
      case 'mongodb': return <SiMongodb className={styles.dbIconLarge} />;
      default: return <SiPostgresql className={styles.dbIconLarge} />;
    }
  };

  const getCompatibilityText = (dbType) => {
    switch(dbType) {
      case 'postgresql': return 'Quantum Compatible';
      case 'mysql': return 'Neural Optimized';
      case 'mongodb': return 'Holographic Ready';
      default: return 'Compatible';
    }
  };

  // Default demo connections if no connections exist
  const demoConnections = [
    {
      id: 'demo-1',
      name: 'Coffee Shop Matrix',
      db_type: 'postgresql',
      version: 'PostgreSQL v14.7',
      description: 'Contains sales and customer orders for the coffee shop chain across 47 dimensions.',
      integrity: 98,
      uptime: '24/7',
      capacity: '47TB',
      created_by: 'Admin',
      last_accessed: '2.4 hours ago'
    },
    {
      id: 'demo-2',
      name: 'Retail Nexus',
      db_type: 'mysql',
      version: 'MySQL v8.0',
      description: 'Manages product inventory, pricing, and store locations across quantum supply chain.',
      integrity: 95,
      uptime: '23.5/7',
      capacity: '32TB',
      created_by: 'System AI',
      last_accessed: 'Yesterday'
    },
    {
      id: 'demo-3',
      name: 'Quantum Analytics',
      db_type: 'mongodb',
      version: 'MongoDB v6.0',
      description: 'Real-time analytics and predictive modeling for multidimensional data streams.',
      integrity: 99,
      uptime: '24/7',
      capacity: '64TB',
      created_by: 'Quantum AI',
      last_accessed: '5.2 hours ago'
    }
  ];

  const displayConnections = connections.length > 0 ? connections : demoConnections;

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

        {/* Main Content Area */}
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

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.holographicSpinner}></div>
              <p>Loading quantum connections...</p>
            </div>
          ) : (
            <>
              <div className={styles.cardsContainer}>
                {displayConnections.map((connection, index) => (
                  <div 
                    key={connection.id}
                    className={`${styles.card} ${hoveredCard === index + 1 ? styles.cardHovered : ''}`}
                    onMouseEnter={() => setHoveredCard(index + 1)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className={styles.cardGlow}></div>
                    <div className={styles.cardHeader}>
                      <h2>{connection.name}</h2>
                      <div className={styles.dbType}>
                        {getDbIcon(connection.db_type)}
                        <span>{connection.version || connection.db_type}</span>
                      </div>
                    </div>
                    
                    <div className={styles.cardContent}>
                      <div className={styles.dataRow}>
                        <span className={styles.dataLabel}>Created by:</span>
                        <span className={styles.dataValue}>{connection.created_by || 'System'}</span>
                      </div>
                      <div className={styles.dataRow}>
                        <span className={styles.dataLabel}>Last accessed:</span>
                        <span className={styles.dataValue}>{connection.last_accessed || 'Just now'}</span>
                      </div>
                      <div className={styles.dataDescription}>
                        {connection.description}
                      </div>
                    </div>
                    
                    <div className={styles.cardStats}>
                      <div className={styles.stat}>
                        <div className={styles.statValue}>{connection.integrity}%</div>
                        <div className={styles.statLabel}>Integrity</div>
                      </div>
                      <div className={styles.stat}>
                        <div className={styles.statValue}>{connection.uptime}</div>
                        <div className={styles.statLabel}>Uptime</div>
                      </div>
                      <div className={styles.stat}>
                        <div className={styles.statValue}>{connection.capacity}</div>
                        <div className={styles.statLabel}>Capacity</div>
                      </div>
                    </div>
                    
                    <button 
                      className={`${styles.connectButton} ${connectingDb === connection.id ? styles.connecting : ''}`}
                      onClick={() => handleConnect(connection.id)}
                      disabled={connectingDb === connection.id}
                    >
                      <span className={styles.connectText}>
                        {connectingDb === connection.id ? 'Neural Linking...' : 'Connect & Chat'}
                      </span>
                      <span className={styles.connectProgress}></span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Database Ecosystem Section */}
              <div className={styles.ecosystem}>
                <h3 className={styles.ecosystemTitle}>SUPPORTED QUANTUM DATABASES</h3>
                <p className={styles.ecosystemSubtitle}>Fully compatible with multidimensional data structures</p>
                
                <div className={styles.iconsContainer}>
                  {['postgresql', 'mysql', 'mongodb'].map((dbType) => (
                    <div key={dbType} className={styles.iconItem}>
                      <div className={styles.iconWrapper}>
                        {getDbIconLarge(dbType)}
                        <div className={styles.iconHalo}></div>
                        <div className={styles.iconParticles}></div>
                      </div>
                      <p>{dbType.charAt(0).toUpperCase() + dbType.slice(1)}</p>
                      <div className={styles.compatibility}>
                        <span className={styles.compatibilityText}>{getCompatibilityText(dbType)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Databases;