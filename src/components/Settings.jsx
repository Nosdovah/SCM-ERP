import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Shield, Trash2, UserPlus } from 'lucide-react';

export default function Settings({ session, language }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'team'
  
  // Profile State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [updateMsg, setUpdateMsg] = useState(null);
  const [companiesList, setCompaniesList] = useState([]);

  // Team State
  const [teamMembers, setTeamMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Viewer');
  
  const userCompany = session?.user?.user_metadata?.company_name;
  const userRole = session?.user?.user_metadata?.role || 'Viewer';

  useEffect(() => {
    if (activeTab === 'team' && userCompany) {
      fetchTeam();
    }
    if (activeTab === 'profile') {
      supabase.from('companies').select('name').then(({ data }) => {
        if (data) setCompaniesList(data);
      });
    }
  }, [activeTab, userCompany]);

  const fetchTeam = async () => {
    const { data } = await supabase.from('company_users').select('*').eq('company_name', userCompany).order('created_at', { ascending: false });
    if (data) setTeamMembers(data);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (userRole !== 'Admin') {
      alert(language === 'id' ? "Hanya Admin yang dapat mengundang anggota tim." : "Only Admins can invite team members.");
      return;
    }
    const { data, error } = await supabase.from('company_users').insert([{
      company_name: userCompany,
      user_email: inviteEmail,
      role: inviteRole
    }]).select();
    
    if (error) {
      alert((language === 'id' ? "Gagal menambahkan pengguna: " : "Failed to add user: ") + error.message);
    } else if (data) {
      setTeamMembers([data[0], ...teamMembers]);
      setInviteEmail('');
    }
  };

  const handleRemoveMember = async (id) => {
    if (userRole !== 'Admin') return;
    if (!window.confirm(language === 'id' ? "Hapus pengguna ini dari direktori perusahaan?" : "Remove this user from the company directory?")) return;
    
    const { error } = await supabase.from('company_users').delete().eq('id', id);
    if (!error) {
      setTeamMembers(teamMembers.filter(t => t.id !== id));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateMsg(null);
    const updates = {};
    if (newEmail) updates.email = newEmail;
    if (newPassword) updates.password = newPassword;
    if (newCompany || newRole) {
      if (!updates.data) updates.data = {};
      if (newCompany) updates.data.company_name = newCompany.trim().toUpperCase();
      if (newRole) updates.data.role = newRole;
      
      // Upsert the company into the companies table
      if (newCompany) await supabase.from('companies').upsert([{ name: updates.data.company_name }], { onConflict: 'name' });
    }
    
    if (Object.keys(updates).length === 0) return;
    
    const { error } = await supabase.auth.updateUser(updates);
    if (error) {
      setUpdateMsg({ type: 'error', text: error.message });
    } else {
      setUpdateMsg({ type: 'success', text: language === 'id' ? 'Profil berhasil diperbarui! Muat ulang halaman untuk melihat lingkungan Kanban Anda yang diperbarui.' : 'Profile updated successfully! Refresh the page to see your updated Kanban environment.' });
      setNewEmail('');
      setNewPassword('');
      setNewCompany('');
      setNewRole('');
    }
  };

  return (
    <div className="help-page animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>{language === 'id' ? 'Pengaturan Sistem' : 'System Settings'}</h2>
        <div style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: '600' }}>
          {language === 'id' ? 'Peran:' : 'Role:'} {userRole}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <button 
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'profile' ? '3px solid var(--primary-color)' : '3px solid transparent', color: activeTab === 'profile' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}
          onClick={() => setActiveTab('profile')}
        >
          {language === 'id' ? 'Profil Saya' : 'My Profile'}
        </button>
        <button 
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'team' ? '3px solid var(--primary-color)' : '3px solid transparent', color: activeTab === 'team' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}
          onClick={() => setActiveTab('team')}
        >
          {language === 'id' ? 'Manajemen Tim' : 'Team Management'}
        </button>
      </div>

      {activeTab === 'profile' ? (
        <div style={{ maxWidth: '600px' }}>
          <p style={{marginBottom: '2rem', color: 'var(--text-muted)'}}>
            {language === 'id' ? 'Perbarui alamat email akun, kata sandi, atau afiliasi perusahaan Anda.' : 'Update your account email address, password, or company affiliation.'}
          </p>
          {updateMsg && (
            <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem', backgroundColor: updateMsg.type === 'error' ? '#fee2e2' : '#dcfce7', color: updateMsg.type === 'error' ? '#b91c1c' : '#15803d', border: `1px solid ${updateMsg.type === 'error' ? '#f87171' : '#86efac'}` }}>
              {updateMsg.text}
            </div>
          )}
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'white', padding: '2rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.875rem' }}>{language === 'id' ? 'Alamat Email Baru' : 'New Email Address'}</label>
          <input type="email" placeholder={language === 'id' ? 'Biarkan kosong untuk mempertahankan saat ini' : 'Leave blank to keep current'} value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', width: '100%', outline: 'none' }} />
        </div>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.875rem' }}>{language === 'id' ? 'Kata Sandi Baru' : 'New Password'}</label>
          <input type="password" placeholder={language === 'id' ? 'Biarkan kosong untuk mempertahankan saat ini' : 'Leave blank to keep current'} value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', width: '100%', outline: 'none' }} />
        </div>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.875rem' }}>{language === 'id' ? 'Perbarui Perusahaan / Organisasi' : 'Update Company / Organization'}</label>
          <input type="text" list="companies-list" placeholder={language === 'id' ? 'Cth. APPLE (Peringatan: Ini akan mengubah ruang kerja Kanban Anda)' : 'e.g. APPLE (Warning: This will change your Kanban workspace)'} value={newCompany} onChange={e => setNewCompany(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', width: '100%', outline: 'none' }} />
          <datalist id="companies-list">
            {companiesList.map(c => <option key={c.name} value={c.name} />)}
          </datalist>
        </div>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.875rem' }}>{language === 'id' ? 'Tetapkan Peran Sistem (RBAC)' : 'Assign System Role (RBAC)'}</label>
          <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', width: '100%', outline: 'none' }}>
            <option value="">{language === 'id' ? 'Biarkan kosong untuk mempertahankan saat ini' : 'Leave blank to keep current'}</option>
            <option value="Admin">{language === 'id' ? 'Admin (Akses Penuh)' : 'Admin (Full Access)'}</option>
            <option value="Procurement">{language === 'id' ? 'Pengadaan' : 'Procurement'}</option>
            <option value="Customs">{language === 'id' ? 'Pabean' : 'Customs'}</option>
            <option value="Warehouse">{language === 'id' ? 'Gudang' : 'Warehouse'}</option>
            <option value="Logistics">{language === 'id' ? 'Logistik' : 'Logistics'}</option>
            <option value="Viewer">{language === 'id' ? 'Pengamat (Hanya Baca)' : 'Viewer (Read Only)'}</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem' }}>{language === 'id' ? 'Perbarui Profil' : 'Update Profile'}</button>
      </form>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          {userRole === 'Admin' && (
            <div className="portlet" style={{ flex: '0 0 300px', padding: '1.5rem' }}>
              <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} /> {language === 'id' ? 'Undang Anggota' : 'Invite Member'}
              </h4>
              <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{language === 'id' ? 'Alamat Email' : 'Email Address'}</label>
                  <input required type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{language === 'id' ? 'Peran Akses' : 'Access Role'}</label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
                    <option value="Admin">Admin</option>
                    <option value="Procurement">{language === 'id' ? 'Pengadaan' : 'Procurement'}</option>
                    <option value="Warehouse">{language === 'id' ? 'Gudang' : 'Warehouse'}</option>
                    <option value="Logistics">{language === 'id' ? 'Logistik' : 'Logistics'}</option>
                    <option value="Customs">{language === 'id' ? 'Pabean' : 'Customs'}</option>
                    <option value="Viewer">{language === 'id' ? 'Pengamat' : 'Viewer'}</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>{language === 'id' ? 'Tambahkan ke Direktori' : 'Add to Directory'}</button>
              </form>
            </div>
          )}
          
          <div className="portlet" style={{ flex: 1, padding: '1.5rem' }}>
            <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} /> {language === 'id' ? `Direktori ${userCompany}` : `${userCompany} Directory`}
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>{language === 'id' ? 'Alamat Email' : 'Email Address'}</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>{language === 'id' ? 'Peran Terhubung' : 'Assigned Role'}</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', textAlign: 'right' }}>{language === 'id' ? 'Aksi' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member, idx) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{member.user_email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ backgroundColor: member.role === 'Admin' ? '#fee2e2' : '#e0e7ff', color: member.role === 'Admin' ? '#dc2626' : '#4338ca', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {member.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {userRole === 'Admin' && (
                        <button onClick={() => handleRemoveMember(member.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {teamMembers.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {language === 'id' ? 'Belum ada anggota tim yang ditambahkan.' : 'No team members added yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
