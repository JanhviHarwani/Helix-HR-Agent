import React from 'react';
import ChatComponent from './components/ChatComponent';
import WorkspaceComponent from './components/WorkspaceComponent';
import { AppProvider, useAppContext } from './context/AppContext';
import './App.css';
import SessionManager from './components/SessionManager';
import SavedSequencesPanel from './components/SavedSequencesPanel';
import SidebarComponent from './components/SidebarComponent';

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
    <p>Initializing Helix HR Agent...</p>
  </div>
);

// Error component
const ErrorScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className="error-screen">
    <div className="error-icon">⚠️</div>
    <h2>Connection Error</h2>
    <p>{message}</p>
    <p>Please make sure the backend server is running and refresh the page.</p>
  </div>
);

// Main content component
const AppContent: React.FC = () => {
  const { isInitialized, error } = useAppContext();
  
  if (!isInitialized) {
    return <LoadingScreen />;
  }
  
  if (error) {
    return <ErrorScreen message={error} />;
  }
  
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Helix HR Agent</h1>
      </header>
      <main className="app-main">
        <div className="app-sidebar">
          <SidebarComponent />
        </div>
        <div className="app-content">
          <ChatComponent />
          <WorkspaceComponent />
        </div>
      </main>
    </div>
  );
};

// App container component
const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;