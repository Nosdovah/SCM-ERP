import React from 'react';
import { LayoutDashboard, Activity, ShoppingCart, BookOpen, Settings as SettingsIcon, Database } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, language }) {
  return (
    <aside className="sidebar" id="tour-sidebar">
      <div className="sidebar-logo">
        <Activity className="icon" size={28} />
        <span>MOAI ERP</span>
      </div>
      <nav className="sidebar-nav">
        <div className={`nav-item ${currentView === 'board' ? 'active' : ''}`} id="tour-sidebar-board" onClick={() => setCurrentView('board')}>
          <ShoppingCart size={20} /> {language === 'id' ? 'Alur Rantai Pasokan' : 'Supply Chain Flow'}
        </div>
        <div className={`nav-item ${currentView === 'master_data' ? 'active' : ''}`} id="tour-sidebar-master" onClick={() => setCurrentView('master_data')}>
          <Database size={20} /> {language === 'id' ? 'Data Induk' : 'Master Data'}
        </div>
        <div className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`} id="tour-sidebar-analytics" onClick={() => setCurrentView('analytics')}>
          <LayoutDashboard size={20} /> {language === 'id' ? 'Analitik & Waktu Tunggu' : 'Analytics & Lead Time'}
        </div>
        <div className={`nav-item ${currentView === 'help' ? 'active' : ''}`} id="tour-sidebar-help" onClick={() => setCurrentView('help')}>
          <BookOpen size={20} /> {language === 'id' ? 'Kamus & Bantuan' : 'Dictionary & Help'}
        </div>
        <div className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} id="tour-sidebar-settings" onClick={() => setCurrentView('settings')}>
          <SettingsIcon size={20} /> {language === 'id' ? 'Pengaturan' : 'Settings'}
        </div>
      </nav>
    </aside>
  );
}
