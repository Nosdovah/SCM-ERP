import React from 'react';
import { Activity, Search, ShoppingCart } from 'lucide-react';

export default function DashboardMetrics({ companyTasks }) {
  return (
    <div className="metrics-grid">
      <div className="metric-card animate-fade-in" style={{animationDelay: '0.1s'}}>
        <div className="metric-title">Active Orders <Activity size={16} /></div>
        <div className="metric-value">{companyTasks.length}</div>
      </div>
      <div className="metric-card animate-fade-in" style={{animationDelay: '0.2s'}}>
        <div className="metric-title">Planning Phase <Search size={16} /></div>
        <div className="metric-value">{companyTasks.filter(t => ['cpo_esta','vc_wbs','review_stock','premium_proposal'].includes(t.stage)).length}</div>
      </div>
      <div className="metric-card animate-fade-in" style={{animationDelay: '0.3s'}}>
        <div className="metric-title">Delivery Phase <ShoppingCart size={16} /></div>
        <div className="metric-value">{companyTasks.filter(t => ['release_inquiry','po_creation','hub_activities','material_calloff'].includes(t.stage)).length}</div>
      </div>
    </div>
  );
}
