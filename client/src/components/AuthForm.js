// src/components/AuthForm.js
import React, { useState } from 'react';
import './AuthForm.css';

const AuthForm = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    brxHost: '',
    authToken: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!credentials.brxHost || !credentials.authToken) {
      alert('Please provide both Bloomreach Host and Authentication Token');
      return;
    }
    
    // Ensure brxHost has correct format
    let brxHost = credentials.brxHost;
    if (!brxHost.startsWith('http')) {
      brxHost = `https://${brxHost}`;
    }
    
    // Remove trailing slash if present
    if (brxHost.endsWith('/')) {
      brxHost = brxHost.slice(0, -1);
    }
    
    onLogin({ ...credentials, brxHost });
  };
  
  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Bloomreach Management App</h1>
        <p className="auth-description">
          Connect to your Bloomreach instance to manage content types and components
        </p>
        
        <div className="form-group">
          <label htmlFor="brxHost">Bloomreach Host</label>
          <input
            type="text"
            id="brxHost"
            name="brxHost"
            value={credentials.brxHost}
            onChange={handleChange}
            placeholder="https://your-bloomreach-host.com"
            required
          />
          <small>The URL of your Bloomreach instance</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="authToken">Authentication Token</label>
          <input
            type="password"
            id="authToken"
            name="authToken"
            value={credentials.authToken}
            onChange={handleChange}
            placeholder="Your x-auth-token"
            required
          />
          <small>Your Bloomreach API authentication token</small>
        </div>
        
        <button type="submit" className="btn btn-primary btn-block">
          Connect
        </button>
      </form>
    </div>
  );
};

export default AuthForm;
