import React from 'react';

export default function NewOrderModal({ 
  showNewOrderModal, 
  setShowNewOrderModal, 
  newOrderForm, 
  setNewOrderForm, 
  handleCreateOrder, 
  masterItems 
}) {
  if (!showNewOrderModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowNewOrderModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Create New Order</h3>
        {masterItems.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '2rem 0' }}>
             <div style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>No Master Data Items Found</div>
             <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>You must first create an item in the <strong>Master Data</strong> module before you can create a new order.</p>
             <button className="btn" style={{ marginTop: '1.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }} onClick={() => setShowNewOrderModal(false)}>Cancel</button>
           </div>
        ) : (
          <form onSubmit={handleCreateOrder}>
            <div className="form-group">
              <label>Order Title / Item Description</label>
              <select required value={newOrderForm.title} onChange={e => setNewOrderForm({...newOrderForm, title: e.target.value})}>
                <option value="">Select an Item from Master Data</option>
                {masterItems.map(item => <option key={item.name || item} value={item.name || item}>{(item.name || item)} (Stock: {item.stock_on_hand ?? 'N/A'})</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Assignee Name</label>
                <input required type="text" placeholder="e.g. Jane Doe" value={newOrderForm.assignee} onChange={e => setNewOrderForm({...newOrderForm, assignee: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: '0 0 100px' }}>
                <label>Quantity</label>
                <input required type="number" min="1" max={masterItems.find(i => (i.name || i) === newOrderForm.title)?.stock_on_hand ?? ''} value={newOrderForm.quantity} onChange={e => setNewOrderForm({...newOrderForm, quantity: e.target.value === '' ? '' : parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={newOrderForm.priority} onChange={e => setNewOrderForm({...newOrderForm, priority: e.target.value})}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" style={{border: '1px solid var(--border-color)'}} onClick={() => setShowNewOrderModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Order</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
