import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './globals.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const RootApp = () => {
  if (!googleClientId) {
    const isDev = import.meta.env.DEV;
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d0d0c',
        color: '#eae7dd',
        fontFamily: 'sans-serif',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#c5a880', margin: '0 0 10px 0' }}>Configuration Error</h2>
        {isDev ? (
          <div style={{ maxWidth: '600px', lineHeight: '1.6' }}>
            <p><strong>[Development Diagnostic]</strong> The Google Client ID configuration is missing.</p>
            <p>Please define <code>VITE_GOOGLE_CLIENT_ID</code> in your <code>frontend/.env</code> file.</p>
            <p>Example: <code>VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com</code></p>
          </div>
        ) : (
          <p>This service is temporarily unavailable in production due to a missing OAuth configuration. Please contact the administrator.</p>
        )}
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
