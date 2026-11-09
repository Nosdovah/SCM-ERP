import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import warehouseBg from '../assets/warehouse_bg.png';
import { ERP_ROLES } from '../data/v2Data';

export default function Auth({ onGoToHelp, onDemoLogin }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot_password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('Admin');
  const [existingCompanies, setExistingCompanies] = useState([]);

  React.useEffect(() => {
    if (authMode === 'signup') {
      // Fetch existing companies to populate the datalist (backend endpoint).
      fetch('/api/companies')
        .then(r => r.json())
        .then(d => {
          const list = Array.isArray(d) ? d : ((d && d.data) || []);
          setExistingCompanies(list.map(c => c.name));
        })
        .catch(() => {});
    }
  }, [authMode]);

  // POST helper to the backend auth API (source of truth). The optional
  // client-side Supabase SDK is null when unconfigured, which previously made
  // login/register silently fail with no network request.
  const authApi = async (path, body) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    let error = null;
    if (authMode === 'login') {
      const { ok, data } = await authApi('/api/auth/login', { email, password });
      if (!ok) error = data.error || 'Login failed';
      else if (onDemoLogin) onDemoLogin({ user: (data.user || data.session?.user) });
    } else if (authMode === 'signup') {
      if (!company.trim()) {
        setAuthError("Company name is required");
        setAuthLoading(false);
        return;
      }
      const companyNameStr = company.trim().toUpperCase();
      const { ok, data } = await authApi('/api/auth/register', { email, password, company_name: companyNameStr, role });
      if (!ok) error = data.error || 'Registration failed';
      else if (onDemoLogin) onDemoLogin({ user: (data.user || data.session?.user) });
    } else if (authMode === 'forgot_password') {
      const { ok, data } = await authApi('/api/auth/forgot-password', { email, redirectTo: window.location.origin });
      if (!ok) error = data.error || 'Reset failed';
      else {
        alert('Password reset link sent! Check your email.');
        setAuthMode('login');
      }
    }
    if (error) setAuthError(error);
    setAuthLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-intro-panel" style={{ backgroundImage: `url(${warehouseBg})` }}>
        <div className="auth-intro-overlay"></div>
        <div className="auth-intro-content">
          <div className="auth-intro-logo-box">
            <div className="auth-intro-logo-icon">

            </div>
            <span style={{ fontWeight: '800', fontSize: '1rem', color: '#111' }}>MOAI ERP</span>
          </div>
          
          <div className="auth-intro-text">
            <h1>Sederhanakan<br/>rantai pasok<br/>Anda.</h1>
            <p>
              Sistem Enterprise Resource Planning (ERP) premium yang dirancang untuk mengoptimalkan manajemen logistik baik impor maupun lokal. 
              Kelola pesanan, pantau persediaan secara real-time, dan tingkatkan efisiensi operasional Anda dalam satu dasbor intuitif.
            </p>
          </div>
          
          <div className="auth-intro-footer">
            <div className="copyright">
              © 2026 MOAI Systems.<br/>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-form-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <Activity size={48} className="icon" />
          <h2>MOAI Admin</h2>
          <p>{authMode === 'login' ? 'Sign in to access the dashboard' : authMode === 'signup' ? 'Create an admin account' : 'Reset your password'}</p>
        </div>
        <form className="auth-form" onSubmit={handleAuth}>
          {authError && <div className="auth-error">{authError}</div>}
          <div className="auth-input-group">
            <label>Email Address</label>
            <input type="email" required className="auth-input" placeholder="admin@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {authMode === 'signup' && (
            <div className="auth-input-group">
              <label>Company Name</label>
              <input 
                type="text" 
                required 
                list="companies-list"
                className="auth-input" 
                placeholder="e.g. NVIDIA" 
                value={company} 
                onChange={e => setCompany(e.target.value)} 
              />
              <datalist id="companies-list">
                {existingCompanies.map((c, idx) => <option key={idx} value={c} />)}
              </datalist>
            </div>
          )}
          {authMode === 'signup' && (
            <div className="auth-input-group">
              <label>Role (13 Granular Roles Spec v2.0)</label>
              <select className="auth-input" value={role} onChange={e => setRole(e.target.value)} required>
                {ERP_ROLES.map(r => (
                  <option key={r.id} value={r.id}>{r.labelEN}</option>
                ))}
              </select>
            </div>
          )}
          {authMode !== 'forgot_password' && (
            <div className="auth-input-group">
              <label>Password</label>
              <input type="password" required className="auth-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          )}
          {authMode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: '500' }} onClick={() => setAuthMode('forgot_password')}>Forgot Password?</span>
            </div>
          )}
          <button type="submit" className="auth-btn" disabled={authLoading}>
            {authLoading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : authMode === 'signup' ? 'Sign Up' : 'Send Reset Link')}
          </button>
          {onDemoLogin && (
            <button 
              type="button" 
              onClick={() => onDemoLogin({
                user: {
                  email: 'admin@kompakom.co.id',
                  user_metadata: {
                    company_name: 'PT KOMPAKOM INTEGRASI MANDIRI',
                    role: 'Admin'
                  }
                }
              })}
              style={{
                width: '100%',
                marginTop: '0.65rem',
                padding: '0.65rem',
                backgroundColor: '#f8fafc',
                color: 'var(--primary-color)',
                border: '1px dashed var(--accent-color)',
                borderRadius: '0.5rem',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              ⚡ Quick Demo Access — PT Kompakom
            </button>
          )}
          <div className="auth-toggle">
            {authMode === 'login' ? (
              <>Don't have an account? <span onClick={() => setAuthMode('signup')}>Sign Up</span></>
            ) : (
              <>Back to <span onClick={() => setAuthMode('login')}>Sign In</span></>
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <span 
              onClick={onGoToHelp}
              style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}
            >
              📖 View Dictionary & Help
            </span>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
