// src/App.js
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import AuthForm from './components/AuthForm';
import ContentTypeManager from './components/ContentTypeManager';
import ComponentManager from './components/ComponentManager';
import './App.css';

function App() {
  // State for authentication
  const [auth, setAuth] = useState({
    brxHost: '',
    authToken: ''
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // State for app navigation
  const [activeSection, setActiveSection] = useState('contentTypes');
  
  // Load auth from local storage
  useEffect(() => {
    const savedAuth = JSON.parse(localStorage.getItem('brxAuth'));
    if (savedAuth && savedAuth.brxHost && savedAuth.authToken) {
      setAuth(savedAuth);
      setIsAuthenticated(true);
    }
  }, []);
  
  // Handle login
  const handleLogin = (credentials) => {
    localStorage.setItem('brxAuth', JSON.stringify(credentials));
    setAuth(credentials);
    setIsAuthenticated(true);
    toast.success('Authentication details saved!');
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('brxAuth');
    setAuth({ brxHost: '', authToken: '' });
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
  };
  
  // Switch between content types and components
  const switchSection = (section) => {
    setActiveSection(section);
  };
  
  // API request handler
  const makeApiRequest = async (params) => {
    try {
      const response = await axios.post('/api/execute', {
        ...params,
        brxHost: auth.brxHost,
        authToken: auth.authToken
      });
      
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      toast.error(`API Error: ${errorMsg}`);
      throw error;
    }
  };
  
  return (
    <div className="app">
      <ToastContainer position="bottom-right" />
      
      {!isAuthenticated ? (
        <AuthForm onLogin={handleLogin} />
      ) : (
        <>
          <header className="app-header">
            <h1>Bloomreach Management App</h1>
            <div className="user-info">
              <span>{auth.brxHost}</span>
              <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
            </div>
          </header>
          
          <main className="app-main">
            <div className="app-tabs">
              <button 
                className={`tab-btn ${activeSection === 'contentTypes' ? 'active' : ''}`}
                onClick={() => switchSection('contentTypes')}
              >
                Content Types
              </button>
              <button 
                className={`tab-btn ${activeSection === 'components' ? 'active' : ''}`}
                onClick={() => switchSection('components')}
              >
                Components
              </button>
            </div>
            
            <div className="app-content">
              {activeSection === 'contentTypes' ? (
                <ContentTypeManager makeApiRequest={makeApiRequest} />
              ) : (
                <ComponentManager makeApiRequest={makeApiRequest} />
              )}
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default App;
