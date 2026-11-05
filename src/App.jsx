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

// --- Route slugs (hash-based; no router dependency) ---------------------------
// Each page gets a stable URL slug so it can be deep-linked and QA'd directly.
const ROUTE_SLUGS = {
  inventory: '/inventory',
  scm: '/scm',
  assembly: '/assembly',
  outbound: '/outbound',
  finance: '/finance',
  master_data: '/master-data',
  managerial: '/managerial',
  analytics: '/analytics',
  help: '/help',
  settings: '/settings',
};
const VIEW_BY_SLUG = Object.fromEntries(
  Object.entries(ROUTE_SLUGS).map(([view, slug]) => [slug, view])
);

function viewFromLocation() {
  if (typeof window === 'undefined') return 'inventory';
  const hash = window.location.hash || '';
  const parts = hash.replace(/^#\/?/, '').split('/');
  return VIEW_BY_SLUG['/' + (parts[0] || '')] || 'inventory';
}

function featureFromLocation() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  const parts = hash.replace(/^#\/?/, '').split('/');
  return parts[1] || null;
}

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

  const [currentView, setCurrentViewState] = useState(viewFromLocation);
  const [currentFeature, setCurrentFeatureState] = useState(featureFromLocation);

  // Navigating sets the URL slug (module + optional feature) and reacts to it.
  const setCurrentView = (view, feature) => {
    const slug = ROUTE_SLUGS[view] || '/inventory';
    const target = '#' + (feature ? slug + '/' + feature : slug);
    if (window.location.hash !== target) window.location.hash = target;
    setCurrentViewState(view);
    setCurrentFeatureState(feature || null);
  };

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
    const onHashChange = () => {
      setCurrentViewState(viewFromLocation());
      setCurrentFeatureState(featureFromLocation());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (!session) {
    if (currentView === 'help') {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
          <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <button
              onClick={() => setCurrentView('inventory')}
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
        onGoToHelp={() => setCurrentView('help')}
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
             currentView === 'master_data' ? <MasterDataV2 session={session} language={language} activeFeature={currentFeature} onFeatureChange={(f) => setCurrentView('master_data', f)} /> :
             currentView === 'scm' ? <SupplyChainV2 session={session} language={language} activeFeature={currentFeature} onFeatureChange={(f) => setCurrentView('scm', f)} /> :
             currentView === 'assembly' ? <AssemblyBOMV2 session={session} language={language} activeFeature={currentFeature} onFeatureChange={(f) => setCurrentView('assembly', f)} /> :
             currentView === 'outbound' ? <OutboundV2 session={session} language={language} activeFeature={currentFeature} onFeatureChange={(f) => setCurrentView('outbound', f)} /> :
             currentView === 'finance' ? <FinanceV2 session={session} language={language} activeFeature={currentFeature} onFeatureChange={(f) => setCurrentView('finance', f)} /> :
             currentView === 'managerial' ? <ManagerialV2 session={session} language={language} /> :
             <InventoryManagementV2 session={session} language={language} activeFeature={currentFeature} onFeatureChange={(f) => setCurrentView('inventory', f)} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
