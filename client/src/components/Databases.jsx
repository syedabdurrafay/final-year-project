import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SiMysql, SiMongodb } from 'react-icons/si';
import { FaFileExcel } from 'react-icons/fa';
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
  const { theme, colors, toggleTheme } = useTheme();

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
        notification.className = `${styles.notification} ${styles.notificationSuccess}`;
        notification.innerHTML = `
          <span class="${styles.notificationIcon}">✅</span>
          <span>Data source connected successfully!</span>
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
      notification.className = `${styles.notification} ${styles.notificationError}`;
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

  const getDbIcon = (dbType) => {
    switch(dbType) {
      case 'mysql': return <SiMysql className={styles.dbIcon} />;
      case 'mongodb': return <SiMongodb className={styles.dbIcon} />;
      case 'excel': return <FaFileExcel className={styles.dbIcon} />;
      default: return <FaFileExcel className={styles.dbIcon} />;
    }
  };

  const getDbIconLarge = (dbType) => {
    switch(dbType) {
      case 'mysql': return <SiMysql className={styles.dbIconLarge} />;
      case 'mongodb': return <SiMongodb className={styles.dbIconLarge} />;
      case 'excel': return <FaFileExcel className={styles.dbIconLarge} />;
      default: return <FaFileExcel className={styles.dbIconLarge} />;
    }
  };

  const getCompatibilityText = (dbType) => {
    switch(dbType) {
      case 'mysql': return 'Fully Compatible';
      case 'mongodb': return 'Document Ready';
      case 'excel': return 'Spreadsheet Support';
      default: return 'Compatible';
    }
  };

  // Default demo connections if no connections exist
  const demoConnections = [
    {
      id: 'demo-1',
      name: 'Sales Data',
      db_type: 'excel',
      version: 'Excel Data',
      description: 'Contains sales and customer orders for the coffee shop chain.',
      integrity: 98,
      uptime: '24/7',
      capacity: '47MB',
      created_by: 'Admin',
      last_accessed: '2.4 hours ago'
    },
    {
      id: 'demo-2',
      name: 'Retail Database',
      db_type: 'mysql',
      version: 'MySQL v8.0',
      description: 'Manages product inventory, pricing, and store locations.',
      integrity: 95,
      uptime: '23.5/7',
      capacity: '32TB',
      created_by: 'System',
      last_accessed: 'Yesterday'
    },
    {
      id: 'demo-3',
      name: 'Analytics Data',
      db_type: 'mongodb',
      version: 'MongoDB v6.0',
      description: 'Real-time analytics and predictive modeling for data streams.',
      integrity: 99,
      uptime: '24/7',
      capacity: '64TB',
      created_by: 'Analytics Team',
      last_accessed: '5.2 hours ago'
    }
  ];

  const displayConnections = connections.length > 0 ? connections : demoConnections;

  return (
    <div className={`${styles.databases} ${styles[`theme-${theme}`]}`}>
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
              <h1 className={styles.title}>Data Sources</h1>
              <div className={styles.titleSub}>Active Database Connections</div>
            </div>
            
            <div className={styles.headerActions}>
              <button 
                onClick={toggleTheme}
                className={styles.themeToggle}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              
              <Link 
                to="/add-connection" 
                className={styles.addButton}
              >
                <span className={styles.addButtonIcon}>+</span>
                <span className={styles.addButtonText}>Add Connection</span>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading connections...</p>
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
                        <div className={styles.statValue}>
                          {connection.integrity}%
                        </div>
                        <div className={styles.statLabel}>Integrity</div>
                      </div>
                      <div className={styles.stat}>
                        <div className={styles.statValue}>
                          {connection.uptime}
                        </div>
                        <div className={styles.statLabel}>Uptime</div>
                      </div>
                      <div className={styles.stat}>
                        <div className={styles.statValue}>
                          {connection.capacity}
                        </div>
                        <div className={styles.statLabel}>Capacity</div>
                      </div>
                    </div>
                    
                    <button 
                      className={`${styles.connectButton} ${connectingDb === connection.id ? styles.connecting : ''}`}
                      onClick={() => handleConnect(connection.id)}
                      disabled={connectingDb === connection.id}
                    >
                      <span className={styles.connectText}>
                        {connectingDb === connection.id ? 'Connecting...' : 'Connect'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Database Ecosystem Section */}
              <div className={styles.ecosystem}>
                <h3 className={styles.ecosystemTitle}>
                  Supported Data Sources
                </h3>
                <p className={styles.ecosystemSubtitle}>
                  Connect to various database systems and file formats
                </p>
                
                <div className={styles.iconsContainer}>
                  {['excel', 'mysql', 'mongodb'].map((dbType) => (
                    <div key={dbType} className={styles.iconItem}>
                      <div className={styles.iconWrapper}>
                        {getDbIconLarge(dbType)}
                      </div>
                      <p>{dbType.charAt(0).toUpperCase() + dbType.slice(1)}</p>
                      <div className={styles.compatibility}>
                        <span className={styles.compatibilityText}>
                          {getCompatibilityText(dbType)}
                        </span>
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