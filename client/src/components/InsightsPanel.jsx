import React, { useState } from 'react';
import styles from './InsightsPanel.module.css';

const InsightsPanel = ({ insights, theme = 'dark', onNewQuery = () => {}, loading = false }) => {
  const [showAllData, setShowAllData] = useState(false);
  const ROWS_PER_PAGE = 5;

  const formatValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value.toLocaleString();
    }
    return String(value);
  };

  // Safe data extraction
  const getInsightsData = () => {
    if (!insights) return [];
    
    // Handle different possible data structures
    if (Array.isArray(insights.data)) {
      return insights.data;
    } else if (Array.isArray(insights)) {
      return insights;
    } else if (insights.result && Array.isArray(insights.result)) {
      return insights.result;
    }
    
    return [];
  };

  const isLightTheme = theme === 'light';
  const themeClass = isLightTheme ? styles.insightsPanelLight : styles.insightsPanelDark;
  const data = getInsightsData();
  const displayData = showAllData ? data : data.slice(0, ROWS_PER_PAGE);
  const hasMoreData = data.length > ROWS_PER_PAGE;

  if (loading) {
    return (
      <div className={`${styles.insightsPanel} ${themeClass}`} style={{ padding: 20 }}>
        <div className={styles.insightsHeader}>
          <h3>Quantum Insights</h3>
        </div>
        <div className={isLightTheme ? styles.lightText : styles.darkText}>
          Generating insights... please wait.
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className={`${styles.insightsPanel} ${themeClass}`} style={{ padding: 20 }}>
        <div className={styles.insightsHeader}>
          <h3>Quantum Insights</h3>
          <button onClick={onNewQuery} className={`${styles.newQueryButton} ${isLightTheme ? styles.newQueryButtonLight : ''}`}>
            New Query
          </button>
        </div>
        <div className={isLightTheme ? styles.lightTextSecondary : styles.darkTextSecondary}>
          No insights yet. Run a query to generate insights about your data.
        </div>
      </div>
    );
  }

  const { query, insights: insightText, sqlQuery, chartType } = insights;

  return (
    <div className={`${styles.insightsPanel} ${themeClass}`} style={{ padding: 18 }}>
      <div className={styles.insightsHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>Quantum Insights</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onNewQuery} className={`${styles.newQueryButton} ${isLightTheme ? styles.newQueryButtonLight : ''}`}>
            New Query
          </button>
        </div>
      </div>

      <div className={styles.insightsContent} style={{ marginTop: 12 }}>
        <div className={styles.insightsText} style={{ marginBottom: 12 }}>
          <div className={styles.queryPreview} style={{ marginBottom: 8 }}>
            <span className={`${styles.queryLabel} ${isLightTheme ? styles.queryLabelLight : ''}`}>
              <strong>Your query:</strong>
            </span>
            <span className={`${styles.queryText} ${isLightTheme ? styles.queryTextLight : ''}`} style={{ marginLeft: 8 }}>
              {query ?? '—'}
            </span>
          </div>

          <div className={styles.insightsResult} style={{ marginBottom: 8 }}>
            <span className={`${styles.insightsLabel} ${isLightTheme ? styles.insightsLabelLight : ''}`}>
              <strong>Insights:</strong>
            </span>
            <p className={`${styles.insightsParagraph} ${isLightTheme ? styles.insightsParagraphLight : ''}`} style={{ marginTop: 6 }}>
              {insightText ?? 'No summary available.'}
            </p>
          </div>

          {sqlQuery && (
            <div className={styles.sqlPreview} style={{ marginTop: 8 }}>
              <span className={`${styles.sqlLabel} ${isLightTheme ? styles.sqlLabelLight : ''}`}>
                <strong>Generated SQL:</strong>
              </span>
              <pre className={`${styles.sqlCode} ${isLightTheme ? styles.sqlCodeLight : ''}`} style={{ whiteSpace: 'pre-wrap', marginTop: 6, padding: 12, borderRadius: 6 }}>
                {sqlQuery}
              </pre>
            </div>
          )}
        </div>

        {data.length > 0 ? (
          <div className={styles.insightsData} style={{ marginTop: 12 }}>
            <h4 className={`${styles.dataTitle} ${isLightTheme ? styles.dataTitleLight : ''}`} style={{ marginBottom: 8 }}>
              Data Preview ({data.length} rows):
            </h4>

            <div className={`${styles.dataTableContainer} ${isLightTheme ? styles.dataTableContainerLight : ''}`} style={{ overflowX: 'auto', padding: 8, borderRadius: 8 }}>
              <table className={`${styles.dataTable} ${isLightTheme ? styles.dataTableLight : ''}`} style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    {Object.keys(data[0]).map((key) => (
                      <th key={key} className={`${styles.tableHeader} ${isLightTheme ? styles.tableHeaderLight : ''}`} style={{ textAlign: 'left', padding: '8px 10px' }}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((row, ri) => (
                    <tr key={ri} className={styles.tableRow}>
                      {Object.values(row).map((val, ci) => (
                        <td key={ci} className={`${styles.tableCell} ${isLightTheme ? styles.tableCellLight : ''}`} style={{ padding: '8px 10px' }}>
                          {formatValue(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {hasMoreData && (
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <button 
                    onClick={() => setShowAllData(!showAllData)}
                    className={`${styles.showMoreButton} ${isLightTheme ? styles.showMoreButtonLight : styles.showMoreButtonDark}`}
                  >
                    {showAllData ? `Show Less (First ${ROWS_PER_PAGE} rows)` : `Show All ${data.length} rows`}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={isLightTheme ? styles.lightTextSecondary : styles.darkTextSecondary} style={{ marginTop: 12 }}>
            No data returned for this query.
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className={isLightTheme ? styles.lightText : styles.darkText}>
          Chart type: <strong>{chartType ?? 'table'}</strong>
        </div>
        {sqlQuery && (
          <button
            onClick={() => {
              try {
                navigator.clipboard.writeText(sqlQuery);
                const el = document.createElement('div');
                el.textContent = 'SQL copied to clipboard';
                Object.assign(el.style, { 
                  position: 'fixed', 
                  right: 20, 
                  top: 20, 
                  padding: '10px 12px', 
                  background: isLightTheme ? '#10b981' : '#00b09b', 
                  color: '#fff', 
                  borderRadius: 6, 
                  zIndex: 10000 
                });
                document.body.appendChild(el);
                setTimeout(() => el.remove(), 1800);
              } catch (e) {
                console.warn('Failed to copy SQL:', e);
              }
            }}
            className={`${styles.newQueryButton} ${isLightTheme ? styles.copyButtonLight : styles.copyButtonDark}`}
          >
            Copy SQL
          </button>
        )}
      </div>
    </div>
  );
};

export default InsightsPanel;