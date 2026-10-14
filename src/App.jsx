import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './index.css';
import Auth from './components/Auth';
import Settings from './components/Settings';
import HelpDictionary from './components/HelpDictionary';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import TutorialModal from './components/TutorialModal';
import Analytics from './components/Analytics';
import MasterDataV2 from './components/v2/MasterDataV2';
import InventoryManagementV2 from './components/v2/InventoryManagementV2';
import AssemblyBOMV2 from './components/v2/AssemblyBOMV2';
import SupplyChainV2 from './components/v2/SupplyChainV2';
import OutboundV2 from './components/v2/OutboundV2';
import FinanceV2 from './components/v2/FinanceV2';
import ManagerialV2 from './components/v2/ManagerialV2';

function App() {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('moai_auth_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved session', e);
    }
    return null;
  });
  const [language, setLanguage] = useState('en');

  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#help') {
      return 'help';
    }
    return 'inventory'; // Default to v2.0 Inventory Management
  });

  const [forceTutorial, setForceTutorial] = useState(false);

  const handleLogout = async () => {
    localStorage.removeItem('moai_auth_session');
    localStorage.removeItem('moai_auth_token');
    localStorage.removeItem('moai_demo_mode');
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Error signing out:', e);
      }
    }
    setSession(null);
  };

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session: remoteSession } }) => {
      // Only set session if a valid remote session exists; do NOT overwrite valid local demo session with null
      if (remoteSession) {
        setSession(remoteSession);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, remoteSession) => {
      if (event === 'SIGNED_OUT') {
        handleLogout();
      } else if (remoteSession) {
        setSession(remoteSession);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      localStorage.setItem('moai_auth_session', JSON.stringify(session));
      localStorage.setItem('moai_auth_token', session.token || session.access_token || 'moai_demo_token');
    }
  }, [session]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#help') {
        setCurrentView('help');
      } else if (window.location.hash === '') {
        setCurrentView('inventory');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!session) {
    if (currentView === 'help') {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
          <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <button
              onClick={() => { setCurrentView('inventory'); window.location.hash = ''; }}
              className="btn btn-primary"
              style={{ marginBottom: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}
            >
              ← {language === 'id' ? 'Kembali ke Login' : 'Back to Login'}
            </button>
            <HelpDictionary
              language={language}
              onOpenTutorial={() => alert(language === 'id' ? 'Anda harus masuk/login terlebih dahulu untuk menggunakan fitur Tur Interaktif.' : 'You must log in first to use the Interactive Tour feature.')}
            />
          </div>
        </div>
      );
    }
    return (
      <Auth
        onGoToHelp={() => { setCurrentView('help'); window.location.hash = '#help'; }}
        onDemoLogin={(demoSession) => {
          const sessionWithToken = {
            ...demoSession,
            token: 'moai_token_' + Date.now(),
            access_token: 'moai_token_' + Date.now()
          };
          setSession(sessionWithToken);
          localStorage.setItem('moai_demo_mode', 'true');
          localStorage.setItem('moai_auth_session', JSON.stringify(sessionWithToken));
          localStorage.setItem('moai_auth_token', sessionWithToken.token);
        }}
      />
    );
  }

  return (
    <div className="app-container">
      <TutorialModal forceOpen={forceTutorial} setForceOpen={setForceTutorial} currentView={currentView} setCurrentView={setCurrentView} language={language} />
      <TopNav currentView={currentView} setCurrentView={setCurrentView} handleLogout={handleLogout} session={session} language={language} setLanguage={setLanguage} />

      <div className="app-body">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} language={language} />

        {/* Main Content */}
        <main className="main-content">
          {/* Content Area */}
          <div className="content-area">
            {currentView === 'help' ? <HelpDictionary language={language} onOpenTutorial={() => setForceTutorial(true)} /> :
             currentView === 'settings' ? <Settings session={session} language={language} /> :
             currentView === 'analytics' ? <Analytics session={session} language={language} /> :
             currentView === 'master_data' ? <MasterDataV2 session={session} language={language} /> :
             currentView === 'scm' ? <SupplyChainV2 session={session} language={language} /> :
             currentView === 'assembly' ? <AssemblyBOMV2 session={session} language={language} /> :
             currentView === 'outbound' ? <OutboundV2 session={session} language={language} /> :
             currentView === 'finance' ? <FinanceV2 session={session} language={language} /> :
             currentView === 'managerial' ? <ManagerialV2 session={session} language={language} /> :
             <InventoryManagementV2 session={session} language={language} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
