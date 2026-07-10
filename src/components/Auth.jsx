import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { supabase } from '../supabaseClient';
import warehouseBg from '../assets/warehouse_bg.png';

export default function Auth({ onGoToHelp }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot_password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('Admin');
  const [existingCompanies, setExistingCompanies] = useState([]);

  React.useEffect(() => {
    if (authMode === 'signup' && supabase) {
      // Fetch existing companies to populate datalist
      supabase.from('companies').select('name').then(({ data }) => {
        if (data) setExistingCompanies(data.map(c => c.name));
      });
    }
  }, [authMode]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    let error;
    if (authMode === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      error = signInError;
    } else if (authMode === 'signup') {
      if (!company.trim()) {
        setAuthError("Company name is required");
        setAuthLoading(false);
        return;
      }
      
      let companyNameStr = company.trim().toUpperCase();

      if (supabase) {
        // Ensure company exists in public.companies
        const { data: existing } = await supabase.from('companies').select('id, name').ilike('name', companyNameStr).maybeSingle();
        if (!existing) {
          await supabase.from('companies').insert([{ name: companyNameStr }]);
        }
      }

      // We store the company_name in the user's auth metadata so we can filter their Kanban boards
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            company_name: companyNameStr,
            role: role
          }
        }
      });
      error = signUpError;
      if (!error) {
        alert('Success! Check your email for a confirmation link or sign in if no confirmation is required.');
      } else {
        // Offline fallback login for demo purposes if Supabase fails
        localStorage.setItem('moai_mock_session_company', companyNameStr);
      }
    } else if (authMode === 'forgot_password') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      error = resetError;
      if (!error) {
        alert('Password reset link sent! Check your email.');
        setAuthMode('login');
      }
    }
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-intro-panel" style={{ backgroundImage: `url(${warehouseBg})` }}>
        <div className="auth-intro-overlay"></div>
        <div className="auth-intro-content">
          <div className="auth-intro-logo-box">
            <div className="auth-intro-logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#8B5CF6"/>
                <path d="M2 17L12 22L22 17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: '800', fontSize: '1rem', color: '#111' }}>StockFlow</span>
          </div>
          
          <div className="auth-intro-text">
            <h1>Sederhanakan<br/>operasi gudang<br/>Anda.</h1>
            <p>
              Sistem manajemen inventaris premium yang dirancang untuk PT Erajaya Swasembada Tbk. 
              Kelola pesanan, pantau persediaan di 5 divisi terintegrasi, dan optimalkan rantai pasok Anda dalam satu dasbor intuitif.
            </p>
          </div>
          
          <div className="auth-intro-footer">
            <div className="copyright">
              © 2026 Logistik StockFlow (Erajaya Group).<br/>
              Hak Cipta Dilindungi Undang-Undang.
            </div>
            <div className="footer-logo">
              <div className="erajaya-logo-placeholder">
                <span style={{ color: '#00539c', fontStyle: 'italic', fontWeight: '800', letterSpacing: '-0.5px' }}>era<span style={{color: '#ed1c24'}}>jaya</span></span>
              </div>
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
              <label>Role</label>
              <select className="auth-input" value={role} onChange={e => setRole(e.target.value)} required>
                <option value="Admin">Admin (Full Access)</option>
                <option value="Procurement">Procurement</option>
                <option value="Customs">Customs</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Logistics">Logistics</option>
                <option value="Viewer">Viewer (Read Only)</option>
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
