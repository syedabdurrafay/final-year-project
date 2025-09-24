// src/components/DataVisualization.jsx

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './DataVisualization.module.css';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
} from 'recharts';

// --- Loader ---
const Loader = () => (
  <div className={styles.loader} style={{ color: 'white', textAlign: 'center', padding: 20 }}>
    <div className={styles.spinner} />
    <p>Loading neural network visualization...</p>
  </div>
);

// --- Error boundary ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, error: err };
  }

  componentDidCatch(error, info) {
    console.error('DataVisualization error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'white', textAlign: 'center', padding: 20 }}>
          <p>⚠️ 3D visualization failed to render — falling back to 2D view.</p>
          <pre style={{ color: '#f88', whiteSpace: 'pre-wrap' }}>{String(this.state.error).slice(0, 400)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Simple 3D scene ---
function VisualizationScene({ color = '#00DBDE' }) {
  const meshRef = useRef();
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.25;
      meshRef.current.rotation.x += delta * 0.08;
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1.0} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} />

      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.7} envMapIntensity={0.8} />
      </mesh>
    </>
  );
}

// --- 2D fallback visualization ---
const FallbackVisualization = ({ themeColor, data }) => {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({ id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 4 + 1, speed: Math.random() * 2 + 0.5 });
    }
    setParticles(newParticles);
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({ ...p, y: (p.y + p.speed) % 100 })));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const borderColor = themeColor || '#00DBDE';
  const dataCount = Array.isArray(data) ? data.length : 0;

  return (
    <div className={styles.fallbackViz} style={{ backgroundColor: 'rgba(0,0,0,0.7)', border: `1px solid ${borderColor}`, boxShadow: `0 0 15px ${borderColor}` }}>
      <div className={styles.vizHeader}>
        <h3>Data Network Visualization</h3>
        <p>Data Points: {dataCount} | Active connections: 24</p>
      </div>
      <div className={styles.particleContainer}>
        {particles.map(p => (
          <div key={p.id} className={styles.particle} style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, backgroundColor: borderColor, boxShadow: `0 0 ${p.size * 2}px ${borderColor}` }} />
        ))}
      </div>
      <div className={styles.vizFooter}>
        <div className={styles.statusIndicator}></div>
        <span>System operational</span>
      </div>
    </div>
  );
};

// --- Data processing utilities ---
const processDataForVisualization = (data, chartType) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  // For simple arrays of numbers
  if (typeof data[0] === 'number') {
    return data.map((value, index) => ({ index, value }));
  }

  // For arrays of objects
  if (typeof data[0] === 'object') {
    return data.map((item, index) => {
      // Handle different object structures
      if (item.x !== undefined && item.y !== undefined) {
        return { x: item.x, y: item.y, ...item };
      }
      
      const keys = Object.keys(item);
      if (keys.length === 1) {
        return { name: keys[0], value: item[keys[0]], ...item };
      }
      
      if (keys.length >= 2) {
        const mainKey = keys[0];
        const valueKey = keys.find(k => k !== mainKey && typeof item[k] === 'number') || keys[1];
        return { name: item[mainKey], value: item[valueKey], ...item };
      }
      
      return { ...item, index };
    });
  }

  return data;
};

const guessChartType = (data, suggestedType) => {
  if (suggestedType && ['line', 'bar', 'pie', 'area', 'scatter'].includes(suggestedType)) {
    return suggestedType;
  }

  if (!Array.isArray(data) || data.length === 0) return 'bar';

  const sample = data[0];
  
  if (typeof sample === 'number') return 'line';
  if (typeof sample === 'object') {
    const keys = Object.keys(sample);
    
    if (keys.length === 1) return 'bar';
    if (keys.length === 2) {
      const hasNumeric = keys.some(k => typeof sample[k] === 'number');
      return hasNumeric ? 'bar' : 'pie';
    }
    if (keys.length >= 3) {
      const numericCount = keys.filter(k => typeof sample[k] === 'number').length;
      return numericCount >= 2 ? 'scatter' : 'bar';
    }
  }
  
  return 'bar';
};

// --- Enhanced Chart Renderer ---
const ChartRenderer = ({ data, chartType, theme = 'dark' }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ 
        padding: 40, 
        textAlign: 'center', 
        color: theme === 'light' ? '#64748b' : '#94a3b8',
        fontStyle: 'italic'
      }}>
        No chartable data available.
      </div>
    );
  }

  const processedData = processDataForVisualization(data, chartType);
  const actualChartType = guessChartType(data, chartType);
  const isLight = theme === 'light';

  // Color schemes for different themes
  const colors = isLight 
    ? ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
    : ['#00DBDE', '#00FF00', '#FF3131', '#8A2BE2', '#FFD700', '#FF69B4'];

  const gridColor = isLight ? '#e2e8f0' : '#334155';
  const textColor = isLight ? '#334155' : '#e2e8f0';
  const tooltipBg = isLight ? 'white' : '#1e293b';

  // Helper to extract keys for charting
  const extractChartKeys = () => {
    if (processedData.length === 0) return { xKey: 'name', yKey: 'value' };
    
    const sample = processedData[0];
    const keys = Object.keys(sample);
    
    // Look for common key patterns
    const xKey = keys.find(k => 
      /name|label|category|month|date|day|time|x|index/i.test(k)
    ) || keys[0];
    
    const yKey = keys.find(k => 
      /value|amount|count|total|sum|price|revenue|y|number/i.test(k) && 
      k !== xKey
    ) || (keys[1] && keys[1] !== xKey ? keys[1] : 'value');
    
    return { xKey, yKey };
  };

  const { xKey, yKey } = extractChartKeys();

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={processedData}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={xKey} stroke={textColor} />
        <YAxis stroke={textColor} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: tooltipBg, 
            borderColor: gridColor,
            color: textColor 
          }} 
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey={yKey} 
          stroke={colors[0]} 
          strokeWidth={2}
          dot={{ fill: colors[0], strokeWidth: 2 }}
          activeDot={{ r: 6, fill: colors[1] }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={processedData}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={xKey} stroke={textColor} />
        <YAxis stroke={textColor} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: tooltipBg, 
            borderColor: gridColor,
            color: textColor 
          }} 
        />
        <Legend />
        <Bar dataKey={yKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => {
    const pieData = processedData.map((item, index) => ({
      name: item[xKey] || `Item ${index + 1}`,
      value: Number(item[yKey]) || 0
    })).filter(item => item.value > 0);

    return (
      <ResponsiveContainer width="100%" height={360}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: tooltipBg, 
              borderColor: gridColor,
              color: textColor 
            }} 
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={360}>
      <AreaChart data={processedData}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={xKey} stroke={textColor} />
        <YAxis stroke={textColor} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: tooltipBg, 
            borderColor: gridColor,
            color: textColor 
          }} 
        />
        <Area 
          type="monotone" 
          dataKey={yKey} 
          stroke={colors[0]} 
          fill={colors[0]} 
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderScatterChart = () => (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart data={processedData}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={xKey} stroke={textColor} />
        <YAxis stroke={textColor} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: tooltipBg, 
            borderColor: gridColor,
            color: textColor 
          }} 
        />
        <Scatter dataKey={yKey} fill={colors[0]} />
      </ScatterChart>
    </ResponsiveContainer>
  );

  switch (actualChartType) {
    case 'line':
      return renderLineChart();
    case 'bar':
      return renderBarChart();
    case 'pie':
      return renderPieChart();
    case 'area':
      return renderAreaChart();
    case 'scatter':
      return renderScatterChart();
    default:
      return renderBarChart();
  }
};

// --- Chart Type Selector ---
const ChartTypeSelector = ({ chartType, onChartTypeChange, theme }) => {
  const isLight = theme === 'light';
  
  const chartTypes = [
    { value: 'auto', label: 'Auto Detect' },
    { value: 'line', label: 'Line Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'area', label: 'Area Chart' },
    { value: 'scatter', label: 'Scatter Plot' }
  ];

  return (
    <div className={styles.chartControls}>
      <label className={`${styles.controlLabel} ${isLight ? styles.controlLabelLight : ''}`}>
        Chart Type:
      </label>
      <select 
        value={chartType} 
        onChange={(e) => onChartTypeChange(e.target.value)}
        className={`${styles.controlSelect} ${isLight ? styles.controlSelectLight : ''}`}
      >
        {chartTypes.map(type => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// --- Main component ---
const DataVisualization = ({ theme, database, query, insightsData, chartType: propChartType }) => {
  const [use3D, setUse3D] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState(propChartType || 'auto');

  useEffect(() => {
    setMounted(true);
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setUse3D(false);
    } catch (e) {
      setUse3D(false);
    }
  }, []);

  // Extract data from insights object
  const extractDataFromInsights = () => {
    if (!insightsData) return null;
    
    // Handle different data structures
    if (Array.isArray(insightsData)) {
      return insightsData;
    } else if (insightsData.data && Array.isArray(insightsData.data)) {
      return insightsData.data;
    } else if (insightsData.result && Array.isArray(insightsData.result)) {
      return insightsData.result;
    }
    
    return null;
  };

  const data = extractDataFromInsights();
  const hasData = data && Array.isArray(data) && data.length > 0;
  const themeColor = theme === 'neon-purple' ? '#8A2BE2' : theme === 'neon-green' ? '#00FF00' : theme === 'neon-red' ? '#FF3131' : '#00DBDE';

  if (!mounted) return <Loader />;

  // If no data -> show 3D visualizer (or fallback)
  if (!hasData) {
    if (!use3D) return <FallbackVisualization themeColor={themeColor} data={data} />;

    return (
      <div className={styles.dataVizContainer}>
        <div className={styles.vizHeader}>
          <h2>Neural Network Visualization</h2>
          <ChartTypeSelector 
            chartType={selectedChartType}
            onChartTypeChange={setSelectedChartType}
            theme={theme}
          />
        </div>

        <div className={styles.canvasWrapper} style={{ height: 420 }}>
          <ErrorBoundary>
            <Suspense fallback={<Loader />}>
              <Canvas camera={{ position: [3, 2, 5], fov: 60 }} style={{ width: '100%', height: '100%' }}>
                <VisualizationScene color={themeColor} />
              </Canvas>
            </Suspense>
          </ErrorBoundary>
        </div>

        <div className={styles.statsPanel}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Data Points</span>
            <span className={styles.statValue}>0</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Active Connections</span>
            <span className={styles.statValue}>{database ? (database.name || 'Connected') : 'No DB'}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Query Status</span>
            <span className={styles.statValue}>No data</span>
          </div>
        </div>
      </div>
    );
  }

  // If we have data, render chart area
  return (
    <div className={styles.dataVizContainer}>
      <div className={styles.vizHeader}>
        <h2>Data Visualization</h2>
        <ChartTypeSelector 
          chartType={selectedChartType}
          onChartTypeChange={setSelectedChartType}
          theme={theme}
        />
      </div>

      <div className={styles.chartWrapper}>
        <ChartRenderer 
          data={data} 
          chartType={selectedChartType === 'auto' ? null : selectedChartType}
          theme={theme}
        />
      </div>

      <div className={styles.statsPanel}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Data Points</span>
          <span className={styles.statValue}>{data.length}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Database</span>
          <span className={styles.statValue}>{database ? (database.name || 'Connected') : 'No DB'}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Chart Type</span>
          <span className={styles.statValue}>
            {selectedChartType === 'auto' 
              ? guessChartType(data).charAt(0).toUpperCase() + guessChartType(data).slice(1)
              : selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;