import React, { useEffect, useState,forwardRef, useImperativeHandle } from 'react';
import { useAppContext } from '../context/AppContext';
import apiService, { SessionInfo } from '../services/api';
import './SessionManager.css';

export interface SessionManagerRef {
  loadSessions: () => void;
}

const SessionManager= forwardRef<SessionManagerRef>((props, ref)  => {
  const { userId, activeSessionId, setActiveSession, loadedStates, setLoadedState  } = useAppContext();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loadedStates.sessions) {
      loadSessions();
    }
  }, [loadedStates.sessions]);
  
  const loadSessions = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const data = await apiService.getSessions(userId);
      setSessions(data);
      setLoadedState('sessions', true);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    loadSessions
  }));


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
});

export default SessionManager;