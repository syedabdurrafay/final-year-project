import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { databaseAPI } from '../services/api';
import Sidebar from './Sidebar';
import styles from './AddConnection.module.css';

const AddConnection = () => {
  const [formData, setFormData] = useState({
    name: '',
    db_type: 'excel',
    host: '',
    port: '',
    database_name: '',
    username: '',
    password: ''
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      if (formData.db_type === 'excel' && selectedFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('file', selectedFile);
        formDataToSend.append('name', formData.name);

        const response = await databaseAPI.testExcelConnection(formDataToSend);
        setTestResult({
          success: response.data.success,
          message: response.data.message,
          schema: response.data.schema
        });
      } else {
        const payload = {
          ...formData,
          port: formData.port ? parseInt(formData.port, 10) : undefined
        };

        const response = await databaseAPI.testConnection(payload);
        setTestResult({
          success: response.data.success,
          message: response.data.message,
          schema: response.data.schema
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setTestResult({
        success: false,
        message: error.response?.data?.detail || error.message || 'Connection test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    setSaving(true);

    try {
      if (formData.db_type === 'excel' && selectedFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('file', selectedFile);
        formDataToSend.append('name', formData.name);

        await databaseAPI.createExcelConnection(formDataToSend);
      } else {
        const payload = {
          ...formData,
          port: formData.port ? parseInt(formData.port, 10) : undefined
        };

        await databaseAPI.createConnection(payload);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/databases');
      }, 2000);
    } catch (error) {
      console.error('Save connection error:', error);
      setTestResult({
        success: false,
        message: error.response?.data?.detail || error.message || 'Failed to save connection'
      });
    } finally {
      setSaving(false);
    }
  };

  const getDefaultPort = (dbType) => {
    switch (dbType) {
      case 'mysql': return '3306';
      case 'mongodb': return '27017';
      default: return '';
    }
  };

  const renderFormFields = () => {
    if (formData.db_type === 'excel') {
      return (
        <div className={styles.formRow}>
          <div className={styles.inputGroup}>
            <label>Excel File *</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              required
            />
            {selectedFile && (
              <div className={styles.filePath}>
                Selected: {selectedFile.name}
              </div>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Host *</label>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleChange}
                placeholder="e.g., localhost or 192.168.1.100"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Port *</label>
              <input
                type="number"
                name="port"
                value={formData.port || getDefaultPort(formData.db_type)}
                onChange={handleChange}
                placeholder="Port number"
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Database Name *</label>
              <input
                type="text"
                name="database_name"
                value={formData.database_name}
                onChange={handleChange}
                placeholder="Database name"
                required
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Authentication</h3>

            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label>Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Database username"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Database password"
                  required
                />
              </div>
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div className={`${styles.addConnection} ${styles[`theme-${theme}`]}`}>
      <div className={styles.container}>
        <Sidebar
          isExpanded={isSidebarExpanded}
          onToggle={setIsSidebarExpanded}
        />

        <main className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ''}`}>
          <div className={styles.header}>
            <div className={styles.titleContainer}>
              <h1 className={styles.title}>Add Data Source</h1>
              <div className={styles.titleSub}>Connect to a new database or file</div>
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

          <div className={styles.formContainer}>
            {saveSuccess && (
              <div className={`${styles.testResult} ${styles.success}`}>
                <span className={styles.testIcon}>✅</span>
                Database connection established successfully! Redirecting to databases page...
              </div>
            )}

            <div className={styles.formSection}>
              <h3>Connection Details</h3>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Connection Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Sales Data"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Data Source Type *</label>
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
                    <option value="excel">Excel File</option>
                    <option value="mysql">MySQL</option>
                    <option value="mongodb">MongoDB</option>
                  </select>
                </div>
              </div>

              {renderFormFields()}
            </div>

            {testResult && !saveSuccess && (
              <div className={`${styles.testResult} ${testResult.success ? styles.success : styles.error}`}>
                <span className={styles.testIcon}>
                  {testResult.success ? '✅' : '❌'}
                </span>
                {testResult.message}
                {testResult.success && testResult.schema && (
                  <div className={styles.schemaInfo}>
                    Schema detected: {Object.keys(testResult.schema).length} tables/collections
                  </div>
                )}
              </div>
            )}

            <div className={styles.buttonGroup}>
              <button
                onClick={handleTestConnection}
                disabled={testing || saving || saveSuccess}
                className={styles.testButton}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                onClick={handleSaveConnection}
                disabled={saving || !testResult?.success || saveSuccess}
                className={styles.saveButton}
              >
                {saving ? 'Saving...' : 'Save Connection'}
              </button>

              <button
                onClick={() => navigate('/databases')}
                className={styles.cancelButton}
              >
                {saveSuccess ? 'Go to Databases' : 'Cancel'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddConnection;