// src/components/SessionManager.tsx
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import apiService, { SessionInfo } from '../services/api';
import './SessionManager.css';



const SessionManager: React.FC = () => {
  const { userId, activeSessionId, setActiveSession } = useAppContext();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (userId) {
      loadSessions();
    }
  }, [userId]);
  
  const loadSessions = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const data = await apiService.getSessions(userId);
      setSessions(data);
      
      // If no active session, set the first one
      if (data.length > 0 && !activeSessionId) {
        setActiveSession(data[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateSession = async () => {
    if (!userId) return;
    
    try {
      const session = await apiService.createSession(userId, newSessionTitle || 'New Session');
      setSessions([session, ...sessions]);
      setNewSessionTitle('');
      setActiveSession(session.id);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };
  
  return (
    <div className="session-manager">
      <h3>Sessions</h3>
      
      <div className="new-session-form">
        <input
          type="text"
          value={newSessionTitle}
          onChange={(e) => setNewSessionTitle(e.target.value)}
          placeholder="New session title"
        />
        <button 
          onClick={handleCreateSession}
          disabled={isLoading}
        >
          Create New
        </button>
      </div>
      
      <ul className="session-list">
        {sessions.map(session => (
          <li 
            key={session.id} 
            className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
            onClick={() => setActiveSession(session.id)}
          >
            <div className="session-title">{session.title}</div>
            <div className="session-date">
              {new Date(session.updated_at).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SessionManager;