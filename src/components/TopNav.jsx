import React, { useState } from 'react';
import { Bell, User, LogOut } from 'lucide-react';

export default function TopNav({ currentView, setCurrentView, handleLogout, session }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = [
    { id: 1, text: "System updated to Process 6", time: "2h ago", unread: true },
    { id: 2, text: "New PR/PO requirement added", time: "5h ago", unread: true },
    { id: 3, text: "Your profile was successfully updated", time: "1d ago", unread: false }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;
  const userCompany = session?.user?.user_metadata?.company_name || localStorage.getItem('moai_mock_session_company') || 'Admin';

  return (
    <header className="top-nav">
      <div className="page-title">{currentView === 'board' ? 'End-to-End Supply Chain Workflow' : currentView === 'help' ? 'System Help & Terminology' : 'Profile Settings'}</div>
      <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
        
        {/* Notification Bell */}
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotifications(!showNotifications)}>
          <Bell size={20} className="text-muted" />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unreadCount}
            </span>
          )}
        </div>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div style={{ position: 'absolute', top: '100%', right: '150px', width: '300px', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', zIndex: 100, marginTop: '0.5rem', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Notifications
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', cursor: 'pointer' }}>Mark all as read</span>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.map(notif => (
                <div key={notif.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.25rem', backgroundColor: notif.unread ? '#f8fafc' : 'transparent', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: notif.unread ? '600' : '400' }}>{notif.text}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notif.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>{userCompany}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{session?.user?.email || 'admin@example.com'}</span>
          </div>
          <div className="avatar" style={{cursor: 'pointer'}} onClick={() => setCurrentView('settings')} title="Profile Settings"><User size={20} /></div>
        </div>

        <button onClick={handleLogout} className="btn" style={{border: '1px solid var(--border-color)', marginLeft: '1rem', backgroundColor: 'transparent', color: 'var(--text-main)'}}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
}
