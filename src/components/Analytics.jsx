import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Activity, Clock, TrendingUp, AlertTriangle, CheckCircle, Package, DollarSign } from 'lucide-react';
import { processes } from '../data/constants';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, RadialBarChart, RadialBar, Cell, ReferenceLine, Legend, PieChart, Pie
} from 'recharts';

// Mock Data for Executive Dashboard (Simulating historical analytics)
const orderFulfillmentData = [
  { day: 'Mon', rate: 92 },
  { day: 'Tue', rate: 94 },
  { day: 'Wed', rate: 93 },
  { day: 'Thu', rate: 96 },
  { day: 'Fri', rate: 95 },
  { day: 'Sat', rate: 98 },
  { day: 'Sun', rate: 97.2 },
];

const invoiceCycleData = [
  { batch: 'B1', time: 48 },
  { batch: 'B2', time: 24 },
  { batch: 'B3', time: 12 },
  { batch: 'B4', time: 4 },
  { batch: 'Current', time: 0.5 },
];

const arAgingData = [
  { name: '0-30 Days', value: 65, color: '#10b981' },
  { name: '31-60 Days', value: 25, color: '#f59e0b' },
  { name: '60+ Days', value: 10, color: '#ef4444' },
];

const turnoverData = [
  { name: 'Turnover', value: 7.8, fill: '#f59e0b' }
];

export default function Analytics({ session, language }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    avgLeadTimes: {},
    totalOrders: 0,
    bottleneckStage: null,
    inventoryValue: 0,
    activeCapEx: 0,
    lowStockItems: 0
  });

  const userCompany = session?.user?.user_metadata?.company_name || 'DEFAULT';

  useEffect(() => {
    if (!supabase) return;

    const fetchAnalyticsData = async () => {
      setLoading(true);
      
      const [
        { data: historyData, error: historyError }, 
        { data: activeOrdersData, error: ordersError },
        { data: itemsData, error: itemsError }
      ] = await Promise.all([
        supabase
          .from('order_history')
          .select('*')
          .eq('company_name', userCompany)
          .order('created_at', { ascending: true }),
        supabase
          .from('orders')
          .select('id, title, quantity')
          .eq('company_name', userCompany),
        supabase
          .from('items')
          .select('name, unit_price, stock_on_hand')
          .eq('company_name', userCompany)
      ]);

      if (historyError || ordersError || itemsError) {
        console.error('Error fetching analytics data');
        setLoading(false);
        return;
      }

      // Filter history logs to ONLY include orders that currently exist
      const activeOrderIds = new Set(activeOrdersData.map(o => o.id));
      const filteredHistory = historyData.filter(log => activeOrderIds.has(log.order_id));

      // Calculate Lead Times
      const stageTimes = {};
      const orders = {};
      filteredHistory.forEach(log => {
        if (!orders[log.order_id]) orders[log.order_id] = [];
        orders[log.order_id].push(log);
      });

      let totalCount = Object.keys(orders).length;

      Object.values(orders).forEach(logs => {
        let currentStageId = 'cpo_esta';
        let lastTimestamp = null;

        logs.forEach(log => {
          if (log.action === 'Created Order') {
            lastTimestamp = new Date(log.created_at).getTime();
            currentStageId = 'cpo_esta';
          }
          else if (log.action === 'Moved Stage' && log.details?.stageId) {
            const currentTimestamp = new Date(log.created_at).getTime();
            
            if (lastTimestamp) {
              const durationMs = currentTimestamp - lastTimestamp;
              if (!stageTimes[currentStageId]) stageTimes[currentStageId] = [];
              stageTimes[currentStageId].push(durationMs);
            }
            
            currentStageId = log.details.stageId;
            lastTimestamp = currentTimestamp;
          }
        });
      });

      // Calculate averages
      const avgLeadTimes = {};
      let maxDuration = 0;
      let bottleneckStage = null;

      Object.keys(stageTimes).forEach(stageId => {
        const durations = stageTimes[stageId];
        if (durations.length === 0) return;
        
        const sum = durations.reduce((a, b) => a + b, 0);
        const avgMs = sum / durations.length;
        
        avgLeadTimes[stageId] = avgMs;
        
        if (avgMs > maxDuration) {
          maxDuration = avgMs;
          bottleneckStage = stageId;
        }
      });

      // Financial Analytics
      let inventoryValue = 0;
      let activeCapEx = 0;
      let lowStockItems = 0;

      const itemsMap = {};
      if (itemsData) {
        itemsData.forEach(item => {
          itemsMap[item.name] = item;
          inventoryValue += (item.stock_on_hand || 0) * (item.unit_price || 0);
          if (item.stock_on_hand < 5) lowStockItems++;
        });
      }

      if (activeOrdersData) {
        activeOrdersData.forEach(order => {
          const item = itemsMap[order.title];
          if (item) {
            activeCapEx += (order.quantity || 1) * (item.unit_price || 0);
          }
        });
      }

      setMetrics({
        avgLeadTimes,
        totalOrders: totalCount,
        bottleneckStage,
        inventoryValue,
        activeCapEx,
        lowStockItems
      });
      setLoading(false);
    };

    fetchAnalyticsData();
  }, [userCompany]);

  const formatDuration = (ms) => {
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `< 1h`;
  };

  const getStageTitle = (stageId) => {
    for (const proc of processes) {
      const s = proc.stages.find(x => x.id === stageId);
      if (s) return language === 'id' ? (s.titleID || s.title) : (s.titleEN || s.title);
    }
    return stageId;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Menganalisis data...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>Executive Dashboard (R2R)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time Supply Chain Health & Financial Analytics</p>
        </div>
        <div style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: '600' }}>
          Data mapped for {userCompany}
        </div>
      </div>

      {/* Top Warning Banner (Customs & Logistics) */}
      <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <AlertTriangle color="#ef4444" size={24} />
        <div>
          <div style={{ fontWeight: '700', color: '#b91c1c' }}>Logistics Alert: Customs Blockage</div>
          <div style={{ fontSize: '0.85rem', color: '#991b1b' }}>1 Shipment Blocked at Port (Missing Proforma Invoice & Import Permit). Average clearance time exceeding <span style={{fontWeight:'bold'}}>3 Days</span> threshold.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Sales & Service Level */}
        <div className="portlet" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>Sales & Service Level</div>
            <div style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: '600' }}>Optimal</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>97.2%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Order Fulfillment Rate (Target {'>'} 96%)</div>
          <div style={{ height: '150px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={orderFulfillmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis domain={[90, 100]} axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip />
                <ReferenceLine y={96} stroke="#ef4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Supply Chain Efficiency */}
        <div className="portlet" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>Supply Chain Efficiency</div>
            <div style={{ fontSize: '0.75rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: '600' }}>Monitor</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>7.8</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Inventory Turnover Ratio (Target 8.0)</div>
          <div style={{ height: '150px', width: '100%', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" cy="100%" 
                innerRadius="60%" outerRadius="100%" 
                barSize={20} data={turnoverData} 
                startAngle={180} endAngle={0}
              >
                <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', fontWeight: '700', fontSize: '1.25rem', color: '#f59e0b' }}>7.8x</div>
          </div>
        </div>

        {/* Liquidity & Cash Flow (AR Aging) */}
        <div className="portlet" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>Liquidity & Cash Flow</div>
            <div style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: '600' }}>Optimal</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>38 Days</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Days Sales Outstanding (DSO Target: 30-50d)</div>
          <div style={{ height: '150px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={arAgingData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                  {arAgingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{fontSize: '0.75rem'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Operations (Time to Invoice) */}
        <div className="portlet" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>Financial Operations</div>
            <div style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: '600' }}>Optimal</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>0.5 Hrs</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Invoice Cycle Time (Target {'<'} 24h)</div>
          <div style={{ height: '150px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invoiceCycleData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="batch" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="time" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-Time Live Data Section */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Real-Time System Metrics</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="portlet" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '0.75rem', color: '#3b82f6' }}>
            <DollarSign size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Capital Exp. (Active)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>${metrics.activeCapEx.toLocaleString()}</div>
          </div>
        </div>

        <div className="portlet" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
          <div style={{ backgroundColor: '#f5f3ff', padding: '1rem', borderRadius: '0.75rem', color: '#8b5cf6' }}>
            <Package size={32} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Inventory Value</div>
              {metrics.lowStockItems > 0 && (
                <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>
                  {metrics.lowStockItems} Low Stock
                </div>
              )}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>${metrics.inventoryValue.toLocaleString()}</div>
          </div>
        </div>

        <div className="portlet" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', border: metrics.bottleneckStage ? '1px solid #fecaca' : '1px solid var(--border-color)' }}>
          <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '0.75rem', color: '#ef4444' }}>
            <Activity size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Primary Bottleneck</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#b91c1c', lineHeight: '1.2' }}>
              {metrics.bottleneckStage ? getStageTitle(metrics.bottleneckStage) : 'No Data'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
