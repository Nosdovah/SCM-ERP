import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function TopNav({ currentView, setCurrentView, handleLogout, session }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userCompany = session?.user?.user_metadata?.company_name || 'NOT ASSIGNED';
  const userRole = session?.user?.user_metadata?.role || 'Admin';

  useEffect(() => {
    if (!supabase || userCompany === 'NOT ASSIGNED') return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('order_history')
        .select('*')
        .eq('company_name', userCompany)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setNotifications(data);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('public:order_history')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_history' }, (payload) => {
        if (payload.new.company_name === userCompany) {
          setNotifications(prev => [payload.new, ...prev].slice(0, 20));
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userCompany]);

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0); // Mark all as read when opening
    }
  };

  const getRelativeTime = (timestamp) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = new Date(timestamp).getTime() - new Date().getTime();
    const diffMins = Math.round(diff / 60000);
    
    if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
    const diffHours = Math.round(diff / 3600000);
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
    return rtf.format(Math.round(diff / 86400000), 'day');
  };

  return (
    <header className="top-nav">
      <div className="page-title">{currentView === 'board' ? 'End-to-End Supply Chain Workflow' : currentView === 'help' ? 'System Help & Terminology' : 'Profile Settings'}</div>
      <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
        
        {/* Notification Bell */}
        <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={handleOpenNotifications}>
          <Bell size={20} color="white" />
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
              {notifications.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No notifications yet</div>
              ) : (
                notifications.map(notif => {
                  let notifText = `${notif.action} (Order ${notif.order_id})`;
                  if (notif.action === 'Created Order' && notif.details?.title) {
                    notifText = `New Order: ${notif.details.title} created by ${notif.user_email}`;
                  } else if (notif.action === 'Moved Stage' && notif.details?.to) {
                    notifText = `Order ${notif.order_id} moved to ${notif.details.to}`;
                  } else if (notif.action === 'Updated Checklist' && notif.details?.item) {
                    notifText = `Verified: ${notif.details.item} on Order ${notif.order_id}`;
                  }
                  
                  return (
                    <div key={notif.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer', backgroundColor: 'transparent' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: '400' }}>{notifText}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getRelativeTime(notif.created_at)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--accent-color)', padding: '2px 6px', borderRadius: '4px', color: 'white', fontWeight: 'bold' }}>{userRole}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white' }}>{userCompany}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{session?.user?.email || 'admin@example.com'}</span>
          </div>
          <div className="avatar" style={{cursor: 'pointer'}} onClick={() => setCurrentView('settings')} title="Profile Settings"><User size={20} /></div>
        </div>

        <button onClick={handleLogout} className="btn" style={{border: '1px solid rgba(255,255,255,0.3)', marginLeft: '1rem', backgroundColor: 'transparent', color: 'white'}}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
}
