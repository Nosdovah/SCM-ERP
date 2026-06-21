import React, { useState, useEffect } from 'react';
import { X, User, Clock } from 'lucide-react';
import { clarificationChecklist } from '../data/constants';
import { supabase } from '../supabaseClient';

export default function OrderDrawer({ selectedOrder, setSelectedOrder, toggleChecklistItem, handleDeleteOrder }) {
  const [activeFormId, setActiveFormId] = useState(null);
  const [formData, setFormData] = useState({});
  const [fileUploads, setFileUploads] = useState({});
  const [historyLogs, setHistoryLogs] = useState([]);
  const [itemDetails, setItemDetails] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (selectedOrder && supabase) {
      const fetchHistory = async () => {
        const { data, error } = await supabase
          .from('order_history')
          .select('*')
          .eq('order_id', selectedOrder.id)
          .order('created_at', { ascending: false });
        if (!error && data) {
          setHistoryLogs(data);
        }
      };
      const fetchItemDetails = async () => {
        const { data, error } = await supabase
          .from('items')
          .select('*, suppliers(name)')
          .eq('name', selectedOrder.title)
          .single();
        if (!error && data) {
          setItemDetails(data);
        }
      };
      fetchHistory();
      fetchItemDetails();
    }
  }, [selectedOrder]);

  const handleFormChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleFormSubmit = async (e, itemId) => {
    e.preventDefault();
    setIsUploading(true);

    let finalFormData = { ...formData };
    
    // Process file uploads if any
    if (Object.keys(fileUploads).length > 0) {
      for (const [fieldName, file] of Object.entries(fileUploads)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedOrder.id}-${itemId}-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('documents').upload(fileName, file);
        if (!error && data) {
          const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName);
          finalFormData[fieldName] = publicUrlData.publicUrl;
        } else {
          console.error("Upload error", error);
          alert("Failed to upload document. Please ensure the Supabase 'documents' bucket exists and has correct permissions.");
        }
      }
    }

    toggleChecklistItem(selectedOrder.id, itemId, finalFormData);
    setActiveFormId(null);
    setFormData({});
    setFileUploads({});
    setIsUploading(false);
  };

  const generatePO = () => {
    if (!itemDetails) {
      alert("Item details not found. Make sure this item exists in Master Data.");
      return;
    }
    const poWindow = window.open('', '_blank');
    const totalCost = (selectedOrder.quantity || 1) * (itemDetails.unit_price || 0);
    
    poWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order - ${selectedOrder.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: 800; color: #4338ca; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .box { padding: 20px; background: #f8fafc; border-radius: 8px; width: 45%; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background-color: #f1f5f9; font-weight: 600; }
            .total { text-align: right; font-size: 20px; font-weight: bold; margin-top: 20px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">PURCHASE ORDER</div>
            <div style="text-align: right;">
              <div><strong>PO Number:</strong> ${selectedOrder.id}</div>
              <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          
          <div class="details">
            <div class="box">
              <strong>BILL TO:</strong><br/>
              ${selectedOrder.company_name}<br/>
              Supply Chain Department
            </div>
            <div class="box">
              <strong>VENDOR:</strong><br/>
              ${itemDetails.suppliers ? itemDetails.suppliers.name : 'Unknown Vendor'}<br/>
              Supplier ID: ${itemDetails.supplier_id}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${itemDetails.sku}</td>
                <td>${selectedOrder.title}</td>
                <td>${selectedOrder.quantity || 1}</td>
                <td>$${parseFloat(itemDetails.unit_price || 0).toFixed(2)}</td>
                <td>$${totalCost.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total Amount: $${totalCost.toFixed(2)}
          </div>
          
          <div style="margin-top: 50px; text-align: center; color: #64748b; font-size: 14px;">
            This is a computer generated document. No signature is required.
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #4338ca; color: white; border: none; border-radius: 4px; cursor: pointer;">Print PDF</button>
          </div>
        </body>
      </html>
    `);
    poWindow.document.close();
  };

  if (!selectedOrder) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={() => setSelectedOrder(null)}></div>
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <h3>{selectedOrder.id}</h3>
            <span style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>Order Details</span>
          </div>
          <button className="close-btn" onClick={() => setSelectedOrder(null)}><X size={24} /></button>
        </div>
        <div className="drawer-content">
          <div className="drawer-section">
            <h4>General Info</h4>
            <div style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>{selectedOrder.title}</div>
            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              <div><div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Assignee</div><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} /> {selectedOrder.assignee}</div></div>
              <div><div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Priority</div><div>{selectedOrder.priority}</div></div>
              <div><div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Quantity</div><div style={{ fontWeight: '600' }}>{selectedOrder.quantity || 1} Units</div></div>
            </div>
            <button onClick={generatePO} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
              <Clock size={16} /> Generate PO Document
            </button>
          </div>
          <div className="drawer-section">
            <h4>100% Clarified Order Checklist (Supply CLM)</h4>
            {(() => {
              const checkedCount = clarificationChecklist.filter(c => selectedOrder.checklistState && selectedOrder.checklistState[c.id]).length;
              const totalCount = clarificationChecklist.length;
              const progressPct = Math.round((checkedCount / totalCount) * 100);
              return (
                <div style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>
                    <span>Fulfillment Progress</span>
                    <span style={{ color: progressPct === 100 ? '#10b981' : 'var(--accent-color)' }}>{checkedCount} / {totalCount} ({progressPct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: progressPct === 100 ? '#10b981' : 'var(--accent-color)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                  </div>
                </div>
              );
            })()}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                { title: 'Process 1: Ordering Preparation', items: clarificationChecklist.filter(c => c.id.startsWith('chk_') && parseInt(c.id.split('_')[1]) <= 7) },
                { title: 'Process 2: Material Delivery', items: clarificationChecklist.filter(c => c.id.startsWith('chk_') && parseInt(c.id.split('_')[1]) >= 8) },
                { title: 'Process 3: Custom Clearance', items: clarificationChecklist.filter(c => c.id.startsWith('cc_')) },
                { title: 'Process 4: WH Management', items: clarificationChecklist.filter(c => c.id.startsWith('wh_') || c.id.startsWith('inv_') || c.id.startsWith('acc_')) },
                { title: 'Process 5: EID Last Mile', items: clarificationChecklist.filter(c => c.id.startsWith('eid_')) },
                { title: 'Process 6: Local 3PP Flow', items: clarificationChecklist.filter(c => c.id.startsWith('tpp_')) },
                { title: 'Local LSP & Governance', items: clarificationChecklist.filter(c => c.id.startsWith('lsp_')) },
                { title: 'Post Ordering / Call off', items: clarificationChecklist.filter(c => c.id.startsWith('post_')) },
                { title: 'Other Operational Tasks', items: clarificationChecklist.filter(c => c.id.startsWith('oth_')) }
              ].map((group, gIdx) => (
                <div key={gIdx}>
                  <h5 style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>{group.title}</h5>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {group.items.map(item => {
                      const isChecked = selectedOrder.checklistState && !!selectedOrder.checklistState[item.id];
                      const itemData = selectedOrder.checklistState?.[item.id]?.data;

                      if (item.requiresInput) {
                        const isExpanded = activeFormId === item.id;
                        return (
                          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: isChecked ? '#f0fdf4' : 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: !isChecked ? 'pointer' : 'default' }} onClick={() => !isChecked && setActiveFormId(isExpanded ? null : item.id)}>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                <input type="checkbox" checked={isChecked} readOnly style={{ marginTop: '0.25rem', cursor: 'inherit' }} />
                                <div style={{ fontSize: '0.875rem', color: isChecked ? '#15803d' : 'var(--text-main)', fontWeight: isChecked ? '500' : '400' }}>
                                  {item.text}
                                  {!isChecked && !isExpanded && <div style={{ fontSize: '0.7rem', color: 'var(--accent-color)', marginTop: '0.25rem', fontWeight: '600' }}>Requires Input • Click to expand</div>}
                                </div>
                              </div>
                              {isChecked && <span style={{ fontSize: '0.75rem', backgroundColor: '#10b981', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '1rem', whiteSpace: 'nowrap' }}>Verified Data</span>}
                            </div>
                            
                            {isExpanded && !isChecked && (
                              <form onSubmit={(e) => handleFormSubmit(e, item.id)} style={{ marginTop: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                                {(item.fields || []).map(field => (
                                  <div key={field.name} style={{ marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-main)' }}>{field.label}</label>
                                    {field.type === 'file' ? (
                                      <input 
                                        type="file" 
                                        accept="image/*,.pdf"
                                        onChange={e => setFileUploads(prev => ({ ...prev, [field.name]: e.target.files[0] }))}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', outline: 'none' }}
                                      />
                                    ) : (
                                      <input 
                                        type={field.type} 
                                        required 
                                        placeholder={field.placeholder} 
                                        value={formData[field.name] || ''}
                                        onChange={e => handleFormChange(field.name, e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', outline: 'none' }}
                                      />
                                    )}
                                  </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                  <button type="button" onClick={() => setActiveFormId(null)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '0.375rem', cursor: 'pointer' }} disabled={isUploading}>Cancel</button>
                                  <button type="submit" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }} disabled={isUploading}>
                                    {isUploading ? 'Uploading & Verifying...' : 'Save & Verify'}
                                  </button>
                                </div>
                              </form>
                            )}

                            {isChecked && itemData && (
                              <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '0.375rem', fontSize: '0.8rem' }}>
                                {Object.entries(itemData || {}).map(([key, val]) => {
                                  const isLink = val && typeof val === 'string' && val.startsWith('http');
                                  return (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.25rem' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>{(item.fields || []).find(f => f.name === key)?.label || key}:</span>
                                      <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>
                                        {isLink ? <a href={val} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>View Document</a> : val}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={item.id} className="checklist-item" onClick={() => toggleChecklistItem(selectedOrder.id, item.id)}>
                          <input type="checkbox" className="checklist-checkbox" checked={isChecked} readOnly />
                          <div className={`checklist-text ${isChecked ? 'done' : ''}`}>{item.text}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="drawer-section" style={{ marginTop: '2rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> Audit Trail & History</h4>
            {historyLogs.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '0.5rem' }}>No history recorded yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                {historyLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ minWidth: '40px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500', paddingTop: '2px' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}<br/>
                      {log.created_at ? new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>{log.action}</div>
                      <div style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                        {log.details && log.details.to ? `Moved to ${log.details.to}` : ''}
                        {log.details && log.details.item ? `Checked: ${log.details.item}` : ''}
                        {log.details && log.details.title ? `Created: ${log.details.title}` : ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By: {log.user_email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="drawer-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }} onClick={() => handleDeleteOrder(selectedOrder.id)}>Delete Order</button>
          <button className="btn btn-primary" onClick={() => setSelectedOrder(null)}>Save & Close</button>
        </div>
      </div>
    </>
  );
}
