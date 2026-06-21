import React from 'react';
import { X, User } from 'lucide-react';
import { clarificationChecklist } from '../data/constants';

export default function OrderDrawer({ selectedOrder, setSelectedOrder, toggleChecklistItem }) {
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
            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
              <div><div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Assignee</div><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} /> {selectedOrder.assignee}</div></div>
              <div><div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Priority</div><div>{selectedOrder.priority}</div></div>
            </div>
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
        </div>
        <div className="drawer-footer">
          <button className="btn btn-primary" onClick={() => setSelectedOrder(null)}>Save & Close</button>
        </div>
      </div>
    </>
  );
}
