import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { databaseAPI } from '../services/api';
import Sidebar from './Sidebar';
import styles from './AddConnection.module.css';

const AddConnection = () => {
  const [formData, setFormData] = useState({
    name: '',
    db_type: 'postgresql',
    host: '',
    port: '',
    database_name: '',
    username: '',
    password: ''
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await databaseAPI.testConnection(formData);
      setTestResult({
        success: response.data.success,
        message: response.data.message
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.response?.data?.detail || 'Connection test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    setSaving(true);
    
    try {
      await databaseAPI.createConnection(formData);
      navigate('/databases');
    } catch (error) {
      setTestResult({
        success: false,
        message: error.response?.data?.detail || 'Failed to save connection'
      });
    } finally {
      setSaving(false);
    }
  };

  const getThemeStyle = () => {
    switch(theme) {
      case 'neon-purple':
        return { glow: '0 0 10px #8A2BE2, 0 0 20px #8A2BE2, 0 0 30px #8A2BE2' };
      case 'neon-green':
        return { glow: '0 0 10px #00FF00, 0 0 20px #00FF00, 0 0 30px #00FF00' };
      case 'neon-red':
        return { glow: '0 0 10px #FF073A, 0 0 20px #FF073A, 0 0 30px #FF073A' };
      case 'cyberpunk':
        return { glow: '0 0 10px #FF0099, 0 0 20px #FF0099, 0 0 30px #FF0099' };
      default: // neon-blue
        return { glow: '0 0 10px #00DBDE, 0 0 20px #00DBDE, 0 0 30px #00DBDE' };
    }
  };

  const themeStyle = getThemeStyle();

  const getDefaultPort = (dbType) => {
    switch(dbType) {
      case 'postgresql': return '5432';
      case 'mysql': return '3306';
      case 'mongodb': return '27017';
      default: return '';
    }
  };

  return (
    <div className={styles.addConnection}>
      <div className={styles.holographicGrid}></div>
      
      <div className={styles.container}>
        <Sidebar 
          isExpanded={isSidebarExpanded} 
          onToggle={setIsSidebarExpanded} 
        />

        <main className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ''}`}>
          <div className={styles.header}>
            <h1 className={styles.title}>ESTABLISH NEURAL LINK</h1>
            <div className={styles.titleSub}>Connect to a Quantum Data Core</div>
            <div className={styles.titleUnderline}></div>
          </div>

          <div className={styles.formContainer}>
            <div className={styles.formSection}>
              <h3>Connection Details</h3>
              
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Connection Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Production Database"
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label>Database Type</label>
                  <select
                    name="db_type"
                    value={formData.db_type}
                    onChange={(e) => {
                      handleChange(e);
                      setFormData({
                        ...formData,
                        db_type: e.target.value,
                        port: getDefaultPort(e.target.value)
                      });
                    }}
                  >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="mongodb">MongoDB</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Host</label>
                  <input
                    type="text"
                    name="host"
                    value={formData.host}
                    onChange={handleChange}
                    placeholder="e.g., localhost or 192.168.1.100"
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label>Port</label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port || getDefaultPort(formData.db_type)}
                    onChange={handleChange}
                    placeholder="Port number"
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Database Name</label>
                  <input
                    type="text"
                    name="database_name"
                    value={formData.database_name}
                    onChange={handleChange}
                    placeholder="Database name"
                  />
                </div>
              </div>
            </div>
            
            <div className={styles.formSection}>
              <h3>Authentication</h3>
              
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Database username"
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Database password"
                  />
                </div>
              </div>
            </div>
            
            {testResult && (
              <div className={`${styles.testResult} ${testResult.success ? styles.success : styles.error}`}>
                <span className={styles.testIcon}>
                  {testResult.success ? '✅' : '❌'}
                </span>
                {testResult.message}
              </div>
            )}
            
            <div className={styles.buttonGroup}>
              <button
                onClick={handleTestConnection}
                disabled={testing || saving}
                className={styles.testButton}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              
              <button
                onClick={handleSaveConnection}
                disabled={saving || !testResult?.success}
                className={styles.saveButton}
                style={{ boxShadow: themeStyle.glow }}
              >
                {saving ? 'Saving...' : 'Save Connection'}
              </button>
              
              <button
                onClick={() => navigate('/databases')}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddConnection;