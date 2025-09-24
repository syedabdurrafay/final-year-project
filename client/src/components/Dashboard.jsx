import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from './Sidebar';
import DataVisualization from './DataVisualization';
import InsightsPanel from './InsightsPanel';
import styles from './Dashboard.module.css';
import { databaseAPI } from '../services/api';
import { insightsAPI } from '../services/insightsAPI';

/**
 * Complete Dashboard component
 */
const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [connectedDatabases, setConnectedDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insightsResult, setInsightsResult] = useState(null);
  const [insightsError, setInsightsError] = useState(null);

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchConnectedDatabases();
    // restore selected DB from storage if any
    const selectedConnectionId = localStorage.getItem('selectedConnection');
    if (selectedConnectionId) {
      // will be set after fetchConnectedDatabases finds it in the list
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConnectedDatabases = async () => {
    setLoading(true);
    try {
      const res = await databaseAPI.getConnections(); // expects { data: [...] }
      const connections = (res && res.data) || [];
      setConnectedDatabases(connections);

      const selectedConnectionId = localStorage.getItem('selectedConnection');
      if (selectedConnectionId) {
        const selected = connections.find((c) => String(c.id) === String(selectedConnectionId));
        if (selected) {
          setSelectedDatabase(selected);
        } else {
          // remove stale
          localStorage.removeItem('selectedConnection');
        }
      }
    } catch (err) {
      console.error('Error fetching databases:', err);
      showNotification('Failed to fetch connected databases', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectDbClick = () => {
    setIsConnecting(true);
    // simulate tiny UX delay
    setTimeout(() => {
      setIsConnecting(false);
      navigate('/databases');
    }, 250);
  };

  const handleSearchSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    setInsightsResult(null);
    setInsightsError(null);

    if (!searchQuery || !searchQuery.trim()) {
      showNotification('Please enter a query', 'error');
      return;
    }
    if (!selectedDatabase) {
      showNotification('Please select a database first', 'error');
      return;
    }

    setGeneratingInsights(true);

    try {
      const result = await insightsAPI.generateInsights(searchQuery, selectedDatabase.id, selectedDatabase.db_type);
      console.log(result)
      if (result && result.success) {
        // result: { success, insights, data, chartType, query, sqlQuery }
        setInsightsResult(result);
        showNotification('Insights generated', 'success');
      } else {
        const msg = result?.error || 'Failed to generate insights';
        setInsightsError(msg);
        showNotification(msg, 'error');
      }
    } catch (err) {
      console.error('Error generating insights:', err);
      setInsightsError(err.message || 'Unexpected error');
      showNotification('Unexpected error generating insights', 'error');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    // remove existing
    const existing = document.querySelectorAll('.dashboard-notification');
    existing.forEach((n) => n.remove());

    const el = document.createElement('div');
    el.className = `dashboard-notification ${styles.notification} ${styles[`notification-${type}`]}`;
    el.innerHTML = `
      <span class="${styles.notificationIcon}">${type === 'success' ? '✅' : type === 'error' ? '⚠️' : '⚡'}</span>
      <span>${message}</span>
    `;

    document.body.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  };

  const handleDatabaseSelect = (db) => {
    setSelectedDatabase(db);
    localStorage.setItem('selectedConnection', String(db.id));
    setInsightsResult(null);
    setSearchQuery('');
    showNotification(`Selected: ${db.name}`, 'success');
  };

  const getDbIcon = (dbType) => {
    switch ((dbType || '').toLowerCase()) {
      case 'mysql': return '🗄️';
      case 'mongodb': return '📊';
      case 'excel': return '📋';
      default: return '📁';
    }
  };

  return (
    <div className={`${styles.dashboard} ${styles[`theme-${theme}`]}`}>
      <div className={styles.container}>
        <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />

        <main className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ''}`}>
          <div className={styles.header}>
            <div className={styles.titleContainer}>
              <h1 className={styles.title}>Data Dashboard</h1>
              <div className={styles.titleSub}>Analyze and visualize your data</div>
            </div>
            
            <div className={styles.headerActions}>
              <button 
                onClick={toggleTheme}
                className={styles.themeToggle}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>

          {/* Database Selection */}
          <div className={styles.dbSelectionSection}>
            <h3 className={styles.sectionTitle}>Active Data Sources</h3>
            <div className={styles.dbSelection}>
              {loading ? (
                <div className={styles.loadingDbs}>
                  <div className={styles.spinner}></div>
                  <span>Loading connections...</span>
                </div>
              ) : connectedDatabases.length > 0 ? (
                <div className={styles.dbList}>
                  {connectedDatabases.map((db) => (
                    <div
                      key={db.id}
                      className={`${styles.dbItem} ${selectedDatabase?.id === db.id ? styles.dbItemSelected : ''}`}
                      onClick={() => handleDatabaseSelect(db)}
                    >
                      <span className={styles.dbIcon}>{getDbIcon(db.db_type)}</span>
                      <span className={styles.dbName}>{db.name}</span>
                      <span className={styles.dbType}>{db.db_type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noDatabases}>
                  <p>No active data connections found</p>
                  <button onClick={handleConnectDbClick} className={styles.connectDbButton}>Connect Data Source</button>
                </div>
              )}
            </div>
          </div>

          {/* Selected DB info */}
          {selectedDatabase && (
            <div className={styles.selectedDbInfo}>
              <h3 className={styles.sectionTitle}>Active Source: {selectedDatabase.name}</h3>
              <div className={styles.dbDetails}>
                <div className={styles.dbDetail}>
                  <span className={styles.detailLabel}>Type:</span>
                  <span className={styles.detailValue}>{selectedDatabase.db_type}</span>
                </div>
                <div className={styles.dbDetail}>
                  <span className={styles.detailLabel}>Status:</span>
                  <span className={styles.detailValueOnline}>Online</span>
                </div>
                <div className={styles.dbDetail}>
                  <span className={styles.detailLabel}>Last Accessed:</span>
                  <span className={styles.detailValue}>{selectedDatabase.last_accessed || 'Just now'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Query Section */}
          <div className={styles.searchSection}>
            <h3 className={styles.sectionTitle}>Data Query</h3>
            <p className={styles.sectionSubtitle}>Ask questions about your data in natural language</p>

            <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
              <button
                type="button"
                onClick={handleConnectDbClick}
                disabled={isConnecting}
                className={styles.connectButton}
              >
                {isConnecting ? <div className={styles.spinner}></div> : <span>+</span>}
              </button>

              <div className={styles.searchInputContainer}>
                <input
                  type="text"
                  placeholder={selectedDatabase ? `Query ${selectedDatabase.name}...` : 'Select a database first...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  disabled={!selectedDatabase || generatingInsights}
                />
                <div className={styles.inputUnderline}></div>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={!selectedDatabase || !searchQuery.trim() || generatingInsights}
              >
                {generatingInsights ? <div className={styles.spinner}></div> : <span>🔍</span>}
              </button>
            </form>

            {/* Examples */}
            <div className={styles.queryExamples}>
              <h4>Example Queries:</h4>
              <div className={styles.examplesGrid}>
                <div className={styles.exampleChip} onClick={() => setSearchQuery('Show sales trends for the last quarter')}>Show sales trends for the last quarter</div>
                <div className={styles.exampleChip} onClick={() => setSearchQuery('What are our top 5 products by revenue?')}>What are our top 5 products by revenue?</div>
                <div className={styles.exampleChip} onClick={() => setSearchQuery('Compare monthly sales across regions')}>Compare monthly sales across regions</div>
                <div className={styles.exampleChip} onClick={() => setSearchQuery('Customer demographics analysis')}>Customer demographics analysis</div>
              </div>
            </div>
          </div>

          {/* Insights + Visualization */}
          {generatingInsights && (
            <div className={styles.insightsLoading}>
              <div className={styles.spinner}></div>
              <span>Analyzing your data...</span>
            </div>
          )}

          {insightsError && (
            <div className={styles.insightsError}>
              <span className={styles.errorIcon}>⚠️</span>
              <span>{insightsError}</span>
            </div>
          )}

          <InsightsPanel
            insights={insightsResult}
            theme={theme}
            loading={generatingInsights}
            onNewQuery={() => {
              setInsightsResult(null);
              setSearchQuery('');
            }}
          />

          <DataVisualization
            theme={theme}
            database={selectedDatabase}
            query={searchQuery}
            insightsData={insightsResult?.data}
            chartType={insightsResult?.chartType}
          />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;