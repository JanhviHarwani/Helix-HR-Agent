// src/components/SidebarComponent.tsx
import React, { useRef, useState } from 'react';
import SessionManager,{ SessionManagerRef } from './SessionManager';
import SavedSequencesPanel , { SavedSequencesPanelRef } from './SavedSequencesPanel';
import './SidebarComponent.css';
import { useAppContext } from '../context/AppContext';

type Tab = 'sessions' | 'sequences';

const SidebarComponent: React.FC = () => {
    const { setLoadedState } = useAppContext();

    const [activeTab, setActiveTab] = useState<'sessions' | 'sequences'>('sessions');
    const sessionsRef = useRef<SessionManagerRef>(null);
    const sequencesRef = useRef<SavedSequencesPanelRef>(null);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };
  const handleRefresh = () => {
    // Reset loaded state for the active tab
    setLoadedState(activeTab, false);
    if (activeTab === 'sessions') {
      sessionsRef.current?.loadSessions();
    } else {
      sequencesRef.current?.loadSequences();
    }
  };

  return (
    <div className="sidebar-container">
      <div className="sidebar-tabs">
        <button
          className={`tab-button ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => handleTabChange('sessions')}
        >
          Sessions
        </button>
        <button
          className={`tab-button ${activeTab === 'sequences' ? 'active' : ''}`}
          onClick={() => handleTabChange('sequences')}
        >
          Saved Sequences
        </button>
        <button className="refresh-button" onClick={handleRefresh}>
          🔄
        </button>
      </div>
      
      <div className="sidebar-content">
        {activeTab === 'sessions' ? (
          <SessionManager ref={sessionsRef} />
        ) : (
          <SavedSequencesPanel ref={sequencesRef} />
        )}
      </div>
    </div>
  );
};


export default SidebarComponent;