import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import Databases from './components/Databases'
import AddConnection from './components/AddConnection'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './App.css'

// ✅ Fixed ProtectedRoute
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // show a loading screen until token check finishes
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh", 
        color: "white", 
        fontSize: "1.5rem" 
      }}>
        Checking session...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/signup" element={<Layout><Signup /></Layout>} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/databases" 
            element={
              <ProtectedRoute>
                <Layout><Databases /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-connection" 
            element={
              <ProtectedRoute>
                <Layout><AddConnection /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
