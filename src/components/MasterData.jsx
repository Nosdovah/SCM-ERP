import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Database, Plus, Trash2, Edit } from 'lucide-react';

export default function MasterData({ session, language }) {
  const [activeTab, setActiveTab] = useState('items'); // 'items' or 'suppliers'
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [newItemForm, setNewItemForm] = useState({ sku: '', name: '', category: '', supplier_id: '', unit_price: '', stock_on_hand: '' });
  const [newSupplierForm, setNewSupplierForm] = useState({ name: '' });

  const userCompany = session?.user?.user_metadata?.company_name || 'DEFAULT';

  useEffect(() => {
    if (!supabase) return;
    fetchData();
  }, [activeTab, userCompany]);

  const fetchData = async () => {
    setLoading(true);
    // Always fetch suppliers so the dropdown is populated
    const { data: supData } = await supabase.from('suppliers').select('*').eq('company_name', userCompany).order('created_at', { ascending: false });
    if (supData) setSuppliers(supData);

    if (activeTab === 'items') {
      const { data: itemData } = await supabase.from('items').select('*, suppliers(name)').eq('company_name', userCompany).order('created_at', { ascending: false });
      if (itemData) setItems(itemData);
    }
    setLoading(false);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    
    // Ensure supplier is selected
    if (!newItemForm.supplier_id) {
      alert(language === 'id' ? "Pilih Supplier/Vendor untuk item ini." : "Please select a Supplier/Vendor for this item.");
      return;
    }

    const entry = { ...newItemForm, company_name: userCompany };
    const { data, error } = await supabase.from('items').insert([entry]).select('*, suppliers(name)');
    if (!error && data) {
      setItems([data[0], ...items]);
      setNewItemForm({ sku: '', name: '', category: '', supplier_id: '', unit_price: '', stock_on_hand: '' });
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    
    const entry = { ...newSupplierForm, company_name: userCompany };
    const { data, error } = await supabase.from('suppliers').insert([entry]).select();
    if (!error && data) {
      setSuppliers([data[0], ...suppliers]);
      setNewSupplierForm({ name: '' });
    }
  };

  const handleDeleteItem = async (id) => {
    const itemToDelete = items.find(i => i.id === id);
    if (!itemToDelete) return;
    
    const confirmMsg = language === 'id' 
      ? `Hapus item ini? PERINGATAN: Ini juga akan menghapus secara permanen SEMUA pesanan yang terkait dengan "${itemToDelete.name}"!`
      : `Delete this item? WARNING: This will also permanently delete ALL existing orders associated with "${itemToDelete.name}"!`;
    if (!window.confirm(confirmMsg)) return;
    
    // First, cascade delete any orders associated with this item's name
    await supabase.from('orders').delete().eq('title', itemToDelete.name).eq('company_name', userCompany);
    
    // Then delete the item
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (!error) setItems(items.filter(i => i.id !== id));
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm(language === 'id' ? 'Hapus supplier ini?' : 'Delete this supplier?')) return;
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (!error) setSuppliers(suppliers.filter(s => s.id !== id));
  };

  return (
    <div className="help-page animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Database size={28} /> {language === 'id' ? 'Manajemen Data Induk' : 'Master Data Management'}</h2>
        <div style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: '600' }}>
          {language === 'id' ? 'Basis Data: ' : 'Database: '} {userCompany}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <button 
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'items' ? '3px solid var(--primary-color)' : '3px solid transparent', color: activeTab === 'items' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}
          onClick={() => setActiveTab('items')}
        >
          {language === 'id' ? 'Item (SKU)' : 'Items (SKUs)'}
        </button>
        <button 
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'suppliers' ? '3px solid var(--primary-color)' : '3px solid transparent', color: activeTab === 'suppliers' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}
          onClick={() => setActiveTab('suppliers')}
        >
          {language === 'id' ? 'Supplier & Vendor' : 'Suppliers & Vendors'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Left Col: Form */}
        <div className="portlet" style={{ flex: '0 0 350px', padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> {language === 'id' ? (activeTab === 'items' ? 'Tambah Item Baru' : 'Tambah Supplier Baru') : `Add New ${activeTab === 'items' ? 'Item' : 'Supplier'}`}
          </h4>
          
          {activeTab === 'items' ? (
            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{language === 'id' ? 'Kode SKU' : 'SKU Code'}</label>
                <input required type="text" placeholder="e.g. CAB-FBR-01" value={newItemForm.sku} onChange={e => setNewItemForm({...newItemForm, sku: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{language === 'id' ? 'Nama Item / Deskripsi' : 'Item Name / Description'}</label>
                <input required type="text" placeholder="e.g. Fiber Optic Cable 50m" value={newItemForm.name} onChange={e => setNewItemForm({...newItemForm, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{language === 'id' ? 'Kategori' : 'Category'}</label>
                <select value={newItemForm.category} onChange={e => setNewItemForm({...newItemForm, category: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
                  <option value="">{language === 'id' ? 'Pilih Kategori' : 'Select Category'}</option>
                  <option value="Hardware">{language === 'id' ? 'Perangkat Keras' : 'Hardware'}</option>
                  <option value="Cabling">{language === 'id' ? 'Kabel' : 'Cabling'}</option>
                  <option value="Cooling">{language === 'id' ? 'Pendingin' : 'Cooling'}</option>
                  <option value="Power">{language === 'id' ? 'Daya' : 'Power'}</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{language === 'id' ? 'Supplier / Vendor' : 'Supplier / Vendor'}</label>
                <select required value={newItemForm.supplier_id} onChange={e => setNewItemForm({...newItemForm, supplier_id: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
                  <option value="">{language === 'id' ? 'Pilih Supplier' : 'Select Supplier'}</option>
                  {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{language === 'id' ? 'Harga Satuan ($)' : 'Unit Price ($)'}</label>
                  <input required type="number" step="0.01" min="0" value={newItemForm.unit_price} onChange={e => setNewItemForm({...newItemForm, unit_price: e.target.value === '' ? '' : parseFloat(e.target.value)})} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{language === 'id' ? 'Stok Awal' : 'Initial Stock'}</label>
                  <input required type="number" min="0" value={newItemForm.stock_on_hand} onChange={e => setNewItemForm({...newItemForm, stock_on_hand: e.target.value === '' ? '' : parseInt(e.target.value)})} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>{language === 'id' ? 'Buat Item' : 'Create Item'}</button>
            </form>
          ) : (
            <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{language === 'id' ? 'Nama Supplier / Vendor' : 'Supplier / Vendor Name'}</label>
                <input required type="text" placeholder="e.g. Acme Logistics Corp" value={newSupplierForm.name} onChange={e => setNewSupplierForm({...newSupplierForm, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>{language === 'id' ? 'Buat Supplier' : 'Create Supplier'}</button>
            </form>
          )}
        </div>

        {/* Right Col: Data Table */}
        <div className="portlet" style={{ flex: 1, padding: '1.5rem', minWidth: 0 }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{language === 'id' ? 'Memuat Basis Data...' : 'Loading Database...'}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: 'var(--text-muted)' }}>
                    {activeTab === 'items' ? (
                      <>
                        <th style={{ padding: '0.75rem', fontWeight: '600' }}>SKU</th>
                        <th style={{ padding: '0.75rem', fontWeight: '600' }}>{language === 'id' ? 'Nama Item' : 'Item Name'}</th>
                        <th style={{ padding: '0.75rem', fontWeight: '600' }}>{language === 'id' ? 'Kategori' : 'Category'}</th>
                        <th style={{ padding: '0.75rem', fontWeight: '600' }}>Supplier</th>
                        <th style={{ padding: '0.75rem', fontWeight: '600' }}>{language === 'id' ? 'Harga' : 'Price'}</th>
                        <th style={{ padding: '0.75rem', fontWeight: '600' }}>{language === 'id' ? 'Stok' : 'Stock'}</th>
                      </>
                    ) : (
                      <th style={{ padding: '0.75rem', fontWeight: '600' }}>{language === 'id' ? 'Nama Supplier' : 'Supplier Name'}</th>
                    )}
                    <th style={{ padding: '0.75rem', fontWeight: '600', textAlign: 'right' }}>{language === 'id' ? 'Aksi' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'items' ? items : suppliers).map((row, idx) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                      {activeTab === 'items' ? (
                        <>
                          <td style={{ padding: '0.75rem', fontWeight: '600', color: 'var(--primary-color)' }}>{row.sku}</td>
                          <td style={{ padding: '0.75rem' }}>{row.name}</td>
                          <td style={{ padding: '0.75rem' }}>
                            {row.category && <span style={{ backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{row.category}</span>}
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                            {row.suppliers ? row.suppliers.name : 'Unknown'}
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>${parseFloat(row.unit_price).toFixed(2)}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{ fontWeight: '600', color: row.stock_on_hand > 0 ? '#16a34a' : '#ef4444' }}>
                              {row.stock_on_hand}
                            </span>
                          </td>
                        </>
                      ) : (
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{row.name}</td>
                      )}
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button onClick={() => activeTab === 'items' ? handleDeleteItem(row.id) : handleDeleteSupplier(row.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(activeTab === 'items' ? items.length : suppliers.length) === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {language === 'id' ? 'Tidak ada rekaman ditemukan di basis data.' : 'No records found in database.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
