import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Settings() {
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [updateMsg, setUpdateMsg] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateMsg(null);
    const updates = {};
    if (newEmail) updates.email = newEmail;
    if (newPassword) updates.password = newPassword;
    if (newCompany) {
      if (!updates.data) updates.data = {};
      updates.data.company_name = newCompany.trim().toUpperCase();
      
      // Upsert the company into the companies table
      await supabase.from('companies').upsert([{ name: updates.data.company_name }], { onConflict: 'name' });
    }
    
    if (Object.keys(updates).length === 0) return;
    
    const { error } = await supabase.auth.updateUser(updates);
    if (error) {
      setUpdateMsg({ type: 'error', text: error.message });
    } else {
      setUpdateMsg({ type: 'success', text: 'Profile updated successfully! Refresh the page to see your updated Kanban environment.' });
      setNewEmail('');
      setNewPassword('');
      setNewCompany('');
    }
  };

  return (
    <div className="help-page animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Profile Settings</h2>
      <p style={{marginBottom: '2rem', color: 'var(--text-muted)'}}>
        Update your account email address or password here.
      </p>
      {updateMsg && (
        <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem', backgroundColor: updateMsg.type === 'error' ? '#fee2e2' : '#dcfce7', color: updateMsg.type === 'error' ? '#b91c1c' : '#15803d', border: `1px solid ${updateMsg.type === 'error' ? '#f87171' : '#86efac'}` }}>
          {updateMsg.text}
        </div>
      )}
      <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'white', padding: '2rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.875rem' }}>New Email Address</label>
          <input type="email" placeholder="Leave blank to keep current" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', width: '100%', outline: 'none' }} />
        </div>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.875rem' }}>New Password</label>
          <input type="password" placeholder="Leave blank to keep current" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', width: '100%', outline: 'none' }} />
        </div>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.875rem' }}>Update Company / Organization</label>
          <input type="text" placeholder="e.g. APPLE (Warning: This will change your Kanban workspace)" value={newCompany} onChange={e => setNewCompany(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', width: '100%', outline: 'none' }} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem' }}>Update Profile</button>
      </form>
    </div>
  );
}
