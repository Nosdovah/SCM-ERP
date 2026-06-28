import React from 'react';

export default function NewOrderModal({ 
  showNewOrderModal, 
  setShowNewOrderModal, 
  newOrderForm, 
  setNewOrderForm, 
  handleCreateOrder, 
  masterItems,
  language
}) {
  if (!showNewOrderModal) return null;

  const sortedMasterItems = React.useMemo(() => {
    return [...masterItems].sort((a, b) => {
      const nameA = (a.name || a || '').toString().toLowerCase();
      const nameB = (b.name || b || '').toString().toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  }, [masterItems]);

  return (
    <div className="modal-overlay" onClick={() => setShowNewOrderModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{language === 'id' ? 'Buat Pesanan Baru' : 'Create New Order'}</h3>
        {masterItems.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '2rem 0' }}>
             <div style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{language === 'id' ? 'Data Induk Tidak Ditemukan' : 'No Master Data Items Found'}</div>
             <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{language === 'id' ? 'Anda harus membuat item di modul ' : 'You must first create an item in the '}<strong>{language === 'id' ? 'Data Induk' : 'Master Data'}</strong>{language === 'id' ? ' terlebih dahulu sebelum dapat membuat pesanan baru.' : ' module before you can create a new order.'}</p>
             <button className="btn" style={{ marginTop: '1.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }} onClick={() => setShowNewOrderModal(false)}>{language === 'id' ? 'Batal' : 'Cancel'}</button>
           </div>
        ) : (
          <form onSubmit={handleCreateOrder}>
            <div className="form-group">
              <label>{language === 'id' ? 'Judul Pesanan / Deskripsi Item' : 'Order Title / Item Description'}</label>
              <select required value={newOrderForm.title} onChange={e => setNewOrderForm({...newOrderForm, title: e.target.value})}>
                <option value="">{language === 'id' ? 'Pilih Item dari Data Induk' : 'Select an Item from Master Data'}</option>
                {sortedMasterItems.map(item => <option key={item.name || item} value={item.name || item}>{(item.name || item)} ({language === 'id' ? 'Stok' : 'Stock'}: {item.stock_on_hand ?? 'N/A'})</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>{language === 'id' ? 'Nama Penanggung Jawab' : 'Assignee Name'}</label>
                <input required type="text" placeholder={language === 'id' ? 'Cth. Budi' : 'e.g. Jane Doe'} value={newOrderForm.assignee} onChange={e => setNewOrderForm({...newOrderForm, assignee: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: '0 0 100px' }}>
                <label>{language === 'id' ? 'Kuantitas' : 'Quantity'}</label>
                <input required type="number" min="1" max={masterItems.find(i => (i.name || i) === newOrderForm.title)?.stock_on_hand ?? ''} value={newOrderForm.quantity} onChange={e => setNewOrderForm({...newOrderForm, quantity: e.target.value === '' ? '' : parseInt(e.target.value)})} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>{language === 'id' ? 'Prioritas' : 'Priority'}</label>
                <select value={newOrderForm.priority} onChange={e => setNewOrderForm({...newOrderForm, priority: e.target.value})}>
                  <option value="Low">{language === 'id' ? 'Rendah' : 'Low'}</option>
                  <option value="Medium">{language === 'id' ? 'Sedang' : 'Medium'}</option>
                  <option value="High">{language === 'id' ? 'Tinggi' : 'High'}</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>{language === 'id' ? 'Tipe Pesanan / Alur' : 'Order Type / Route'}</label>
                <select value={newOrderForm.orderType || 'import'} onChange={e => setNewOrderForm({...newOrderForm, orderType: e.target.value})}>
                  <option value="import">{language === 'id' ? 'Impor (Mulai di Proses 1)' : 'Import (Start at Process 1)'}</option>
                  <option value="local">{language === 'id' ? 'Lokal (Mulai di 3PP)' : 'Local (Start at 3PP)'}</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" style={{border: '1px solid var(--border-color)'}} onClick={() => setShowNewOrderModal(false)}>{language === 'id' ? 'Batal' : 'Cancel'}</button>
              <button type="submit" className="btn btn-primary">{language === 'id' ? 'Buat Pesanan' : 'Create Order'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
