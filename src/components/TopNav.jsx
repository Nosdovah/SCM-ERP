import { useState, useEffect, useRef } from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import { apiService } from '../services/apiService';

export default function TopNav({ currentView, setCurrentView, handleLogout, session, language, setLanguage }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userCompany = session?.user?.user_metadata?.company_name || 'NOT ASSIGNED';
  const userRole = session?.user?.user_metadata?.role || 'Admin';

  // Ids seen on the previous poll, used to flag newly arrived activity as unread.
  const seenIdsRef = useRef(null);

  // Poll the v2 activity feed every 30s — replaces the legacy client-side
  // Supabase realtime subscription on the `order_history` table.
  useEffect(() => {
    let cancelled = false;

    const fetchNotifications = async () => {
      const data = await apiService.notifications.list();
      if (cancelled || !Array.isArray(data)) return;

      if (seenIdsRef.current) {
        const fresh = data.filter((n) => !seenIdsRef.current.has(n.id)).length;
        if (fresh > 0) setUnreadCount((prev) => prev + fresh);
      }
      seenIdsRef.current = new Set(data.map((n) => n.id));
      setNotifications(data);
    };

    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0); // Mark all as read when opening
    }
  };

  const getRelativeTime = (timestamp) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = new Date(timestamp).getTime() - new Date().getTime();
    if (Number.isNaN(diff)) return '';
    const diffMins = Math.round(diff / 60000);

    if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
    const diffHours = Math.round(diff / 3600000);
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
    return rtf.format(Math.round(diff / 86400000), 'day');
  };

  const getNotificationText = (notif) => {
    const details = notif.details || {};
    const item = details.item || details.sku || details.ref || notif.id;
    let text = `${notif.action}: ${item}`;
    if (details.qty) text += ` (${details.qty} unit)`;
    if (details.to) text += ` → ${details.to}`;
    return text;
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'inventory':
        return language === 'id' ? '1. Modul Inventory & Serial Number' : '1. Inventory & Serial Management';
      case 'scm':
        return language === 'id' ? '2. Supply Chain Management & QC Gate' : '2. SCM & Inbound QC Gate';
      case 'assembly':
        return language === 'id' ? '3. Bill of Materials (BOM) & Perakitan' : '3. BOM & Assembly Engine';
      case 'outbound':
        return language === 'id' ? '4. Outbound, Picking & Surat Jalan' : '4. Outbound & Delivery Notes';
      case 'finance':
        return language === 'id' ? '5. Keuangan, HPP & Utang-Piutang' : '5. Finance, COGS & AP/AR';
      case 'master_data':
        return language === 'id' ? '6. Manajemen Data Induk v2.0' : '6. Master Data Management v2.0';
      case 'managerial':
        return language === 'id' ? 'Laporan Manajerial & Kinerja Staf' : 'Managerial & Worker Performance';
      case 'analytics':
        return language === 'id' ? 'Lead Time Analytics Dashboard' : 'Lead Time Analytics Dashboard';
      case 'help':
        return language === 'id' ? 'Kamus Terminologi & Panduan Sistem' : 'Dictionary & Help Center';
      case 'settings':
        return language === 'id' ? 'Pengaturan Sistem & Profil' : 'System & Profile Settings';
      default:
        return language === 'id' ? 'Pengaturan Profil' : 'Profile Settings';
    }
  };

  return (
    <header className="top-nav">
      <div className="page-title">{getViewTitle()}</div>
      <div className="user-profile" id="tour-top-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>

        {/* Language Toggle */}
        <button
          id="tour-top-lang"
          onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '0.2rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
          title={language === 'en' ? "Switch to Bahasa Indonesia" : "Beralih ke Bahasa Inggris"}
        >
          {language === 'en' ? 'ID' : 'EN'}
        </button>

        {/* Notification Bell */}
        <div id="tour-top-notifications" style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }} onClick={handleOpenNotifications}>
          <Bell size={20} color="white" />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unreadCount}
            </span>
          )}
        </div>

        {/* Notification Dropdown */}
        {showNotifications && (
          <>
            <div
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
              onClick={() => setShowNotifications(false)}
            />
            <div style={{ position: 'absolute', top: '100%', right: '150px', width: '300px', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', zIndex: 100, marginTop: '0.5rem', overflow: 'hidden' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-main)' }}>
                {language === 'id' ? 'Notifikasi' : 'Notifications'}
                <span onClick={() => setShowNotifications(false)} style={{ fontSize: '0.75rem', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: '500' }}>{language === 'id' ? 'Tandai semua dibaca' : 'Mark all as read'}</span>
              </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{language === 'id' ? 'Belum ada notifikasi' : 'No notifications yet'}</div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer', backgroundColor: 'transparent' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: '400' }}>{getNotificationText(notif)}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getRelativeTime(notif.created_at)}</span>
                  </div>
                ))
              )}
            </div>
            </div>
          </>
        )}

        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '12px', color: 'white', fontWeight: '600', letterSpacing: '0.05em' }}>{userRole.toUpperCase()}</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'white', letterSpacing: '0.02em' }}>{userCompany}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.65)' }}>{session?.user?.email || 'admin@example.com'}</span>
          </div>
          <div
            style={{
              cursor: 'pointer',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setCurrentView('settings')}
            title="Profile Settings"
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
          >
            <User size={20} color="white" />
          </div>
        </div>

        <button onClick={handleLogout} className="btn" style={{border: '1px solid rgba(255,255,255,0.3)', marginLeft: '1rem', backgroundColor: 'transparent', color: 'white'}}>
          <LogOut size={16} /> {language === 'id' ? 'Keluar' : 'Logout'}
        </button>
      </div>
    </header>
  );
}
