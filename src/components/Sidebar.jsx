import React from 'react';
import { LayoutDashboard, Activity, ShoppingCart, BookOpen, Settings as SettingsIcon } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Activity className="icon" size={28} />
        <span>MOAI ERP</span>
      </div>
      <nav className="sidebar-nav">
        <div className={`nav-item ${currentView === 'board' ? 'active' : ''}`} onClick={() => setCurrentView('board')}>
          <ShoppingCart size={20} /> Supply Chain Flow
        </div>
        <div className={`nav-item ${currentView === 'help' ? 'active' : ''}`} onClick={() => setCurrentView('help')}>
          <BookOpen size={20} /> Dictionary & Help
        </div>
        <div className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => setCurrentView('settings')}>
          <SettingsIcon size={20} /> Settings
        </div>
      </nav>
    </aside>
  );
}
