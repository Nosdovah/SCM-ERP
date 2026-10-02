import React from 'react';
import { 
  Layers, ShoppingCart, Wrench, Send, DollarSign, Database, 
  LayoutDashboard, BookOpen, Settings as SettingsIcon, Activity, BarChart3, CheckSquare
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, language }) {
  const isId = language === 'id';

  return (
    <aside className="sidebar" id="tour-sidebar" style={{ width: '260px' }}>
      <div className="sidebar-logo">
        <Activity className="icon" size={26} />
        <div>
          <div style={{ fontSize: '1rem', fontWeight: '800', lineHeight: 1.1 }}>MOAI ERP</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600' }}>v2.0 · DISTRIBUTOR & INTEGRATOR</div>
        </div>
      </div>

      <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {/* SECTION 1: 6 INTI MODUL OPERASIONAL */}
        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.5rem 0.75rem 0.25rem', letterSpacing: '0.05em' }}>
          {isId ? 'Modul Operasional' : 'Operations'}
        </div>

        <div className={`nav-item ${currentView === 'inventory' ? 'active' : ''}`} onClick={() => setCurrentView('inventory')}>
          <Layers size={18} /> {isId ? '1. Inventory & Serial' : '1. Inventory & Serial'}
        </div>

        <div className={`nav-item ${currentView === 'scm' ? 'active' : ''}`} onClick={() => setCurrentView('scm')}>
          <ShoppingCart size={18} /> {isId ? '2. SCM & Inbound QC' : '2. SCM & QC Gate'}
        </div>

        <div className={`nav-item ${currentView === 'assembly' ? 'active' : ''}`} onClick={() => setCurrentView('assembly')}>
          <Wrench size={18} /> {isId ? '3. BOM & Perakitan' : '3. BOM & Assembly'}
        </div>

        <div className={`nav-item ${currentView === 'outbound' ? 'active' : ''}`} onClick={() => setCurrentView('outbound')}>
          <Send size={18} /> {isId ? '4. Outbound & Surat Jalan' : '4. Outbound & SJ'}
        </div>

        <div className={`nav-item ${currentView === 'finance' ? 'active' : ''}`} onClick={() => setCurrentView('finance')}>
          <DollarSign size={18} /> {isId ? '5. Keuangan & HPP' : '5. Finance & COGS'}
        </div>

        <div className={`nav-item ${currentView === 'master_data' ? 'active' : ''}`} id="tour-sidebar-master" onClick={() => setCurrentView('master_data')}>
          <Database size={18} /> {isId ? '6. Master Data v2.0' : '6. Master Data v2.0'}
        </div>

        {/* SECTION 2: PIPELINE & ANALITIK */}
        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.75rem 0.75rem 0.25rem', letterSpacing: '0.05em' }}>
          {isId ? 'Pelacak & Analitik' : 'Tracking & Analytics'}
        </div>

        <div className={`nav-item ${currentView === 'board' ? 'active' : ''}`} id="tour-sidebar-board" onClick={() => setCurrentView('board')}>
          <CheckSquare size={18} /> {isId ? 'Pipeline Kanban 6 SCM' : 'SCM Pipeline Board'}
        </div>

        <div className={`nav-item ${currentView === 'managerial' ? 'active' : ''}`} onClick={() => setCurrentView('managerial')}>
          <BarChart3 size={18} /> {isId ? 'Manajerial & Staf KPI' : 'Managerial & Worker KPI'}
        </div>

        <div className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`} id="tour-sidebar-analytics" onClick={() => setCurrentView('analytics')}>
          <LayoutDashboard size={18} /> {isId ? 'Lead Time Analytics' : 'Lead Time Analytics'}
        </div>

        {/* SECTION 3: PUSAT BANTUAN & PENGATURAN */}
        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.75rem 0.75rem 0.25rem', letterSpacing: '0.05em' }}>
          {isId ? 'Sistem' : 'System'}
        </div>

        <div className={`nav-item ${currentView === 'help' ? 'active' : ''}`} id="tour-sidebar-help" onClick={() => setCurrentView('help')}>
          <BookOpen size={18} /> {isId ? 'Kamus & Bantuan' : 'Dictionary & Help'}
        </div>

        <div className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} id="tour-sidebar-settings" onClick={() => setCurrentView('settings')}>
          <SettingsIcon size={18} /> {isId ? 'Pengaturan' : 'Settings'}
        </div>
      </nav>
    </aside>
  );
}
