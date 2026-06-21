import React from 'react';
import { Bell, User, LogOut } from 'lucide-react';

export default function TopNav({ currentView, setCurrentView, handleLogout }) {
  return (
    <header className="top-nav">
      <div className="page-title">{currentView === 'board' ? 'End-to-End Supply Chain Workflow' : currentView === 'help' ? 'System Help & Terminology' : 'Profile Settings'}</div>
      <div className="user-profile">
        <Bell size={20} className="text-muted" style={{cursor: 'pointer'}} />
        <div className="avatar" style={{cursor: 'pointer'}} onClick={() => setCurrentView('settings')} title="Profile Settings"><User size={20} /></div>
        <button onClick={handleLogout} className="btn" style={{border: '1px solid var(--border-color)', marginLeft: '1rem', backgroundColor: 'transparent', color: 'var(--text-main)'}}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
}
