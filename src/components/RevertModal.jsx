import React, { useState, useEffect } from 'react';

export default function RevertModal({
  revertPrompt,
  setRevertPrompt,
  handleConfirmRevert,
  language
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (revertPrompt) {
      setReason('');
    }
  }, [revertPrompt]);

  if (!revertPrompt) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    handleConfirmRevert(reason);
  };

  return (
    <div className="modal-overlay" onClick={() => setRevertPrompt(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{language === 'id' ? 'Konfirmasi Pindah Mundur' : 'Confirm Revert Order'}</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {language === 'id' 
            ? 'Anda memindahkan pesanan ini kembali ke proses sebelumnya. Silakan berikan alasan (misalnya, Validasi gagal, Kesalahan data, atau Stok tidak tersedia).' 
            : 'You are moving this order back to a prior process. Please provide a reason (e.g., Failed validation, Data error, or Stock unavailability).'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{language === 'id' ? 'Alasan Mundur' : 'Reason for Reverting'}</label>
            <select 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}
            >
              <option value="" disabled>{language === 'id' ? '-- Pilih Alasan --' : '-- Select a Reason --'}</option>
              <option value={language === 'id' ? 'Validasi Gagal' : 'Failed Validation'}>{language === 'id' ? 'Validasi Gagal' : 'Failed Validation'}</option>
              <option value={language === 'id' ? 'Kesalahan Data' : 'Data Error'}>{language === 'id' ? 'Kesalahan Data' : 'Data Error'}</option>
              <option value={language === 'id' ? 'Stok Tidak Tersedia' : 'Stock Unavailability'}>{language === 'id' ? 'Stok Tidak Tersedia' : 'Stock Unavailability'}</option>
              <option value={language === 'id' ? 'Revisi Dokumen/PO' : 'Document/PO Revision'}>{language === 'id' ? 'Revisi Dokumen/PO' : 'Document/PO Revision'}</option>
              <option value="Other">{language === 'id' ? 'Lainnya (Tulis di bawah)' : 'Other (Type below)'}</option>
            </select>

            {reason === 'Other' && (
              <input 
                type="text" 
                required 
                placeholder={language === 'id' ? 'Tuliskan alasan spesifik...' : 'Type specific reason...'} 
                onChange={e => setReason(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}
              />
            )}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" style={{border: '1px solid var(--border-color)'}} onClick={() => setRevertPrompt(null)}>
              {language === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={!reason.trim()}>
              {language === 'id' ? 'Konfirmasi Pindah Mundur' : 'Confirm Revert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
