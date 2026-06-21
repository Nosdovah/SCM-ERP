import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot_password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [company, setCompany] = useState('');
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
            company_name: companyNameStr
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
        </form>
      </div>
    </div>
  );
}
