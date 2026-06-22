import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Activity, Clock, TrendingUp } from 'lucide-react';
import { processes } from '../data/constants';

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
        console.error('Error fetching analytics data', historyError || ordersError || itemsError);
        setLoading(false);
        return;
      }

      // Filter history logs to ONLY include orders that currently exist
      const activeOrderIds = new Set(activeOrdersData.map(o => o.id));
      const filteredHistory = historyData.filter(log => activeOrderIds.has(log.order_id));

      // Calculate Lead Times
      const stageTimes = {}; // { stageId: [durationMs, durationMs, ...] }
      
      // Group by order
      const orders = {};
      filteredHistory.forEach(log => {
        if (!orders[log.order_id]) orders[log.order_id] = [];
        orders[log.order_id].push(log);
      });

      let totalCount = Object.keys(orders).length;

      Object.values(orders).forEach(logs => {
        let currentStageId = 'cpo_esta'; // Default initial stage
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
          if (item.stock_on_hand < 5) lowStockItems++; // Simple low stock threshold
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
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getStageTitle = (stageId) => {
    for (const proc of processes) {
      const s = proc.stages.find(x => x.id === stageId);
      if (s) return language === 'id' ? (s.titleID || s.title) : (s.titleEN || s.title);
    }
    return stageId;
  };

  return (
    <div className="help-page animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>{language === 'id' ? 'Analitik Bottleneck & Waktu Tunggu' : 'Bottleneck Analytics & Lead Time'}</h2>
        <div style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: '600' }}>
          {language === 'id' ? 'Data dipetakan untuk' : 'Data mapped for'} {userCompany}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>{language === 'id' ? 'Menganalisis ribuan titik data historis...' : 'Analyzing thousands of historical data points...'}</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="portlet" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '0.75rem', color: '#16a34a' }}>
                <TrendingUp size={32} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{language === 'id' ? 'Total Pesanan Terlacak' : 'Total Orders Tracked'}</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>{metrics.totalOrders}</div>
              </div>
            </div>

            <div className="portlet" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '0.75rem', color: '#ef4444' }}>
                <Activity size={32} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{language === 'id' ? 'Bottleneck Utama' : 'Primary Bottleneck'}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.2' }}>
                  {metrics.bottleneckStage ? getStageTitle(metrics.bottleneckStage) : (language === 'id' ? 'Data Tidak Cukup' : 'Insufficient Data')}
                </div>
              </div>
            </div>

            <div className="portlet" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '0.75rem', color: '#3b82f6' }}>
                <Activity size={32} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{language === 'id' ? 'Pengeluaran Modal (Pesanan Aktif)' : 'Capital Exp. (Active Orders)'}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>${metrics.activeCapEx.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              </div>
            </div>

            <div className="portlet" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
              <div style={{ backgroundColor: '#f5f3ff', padding: '1rem', borderRadius: '0.75rem', color: '#8b5cf6' }}>
                <Activity size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{language === 'id' ? 'Total Nilai Inventaris' : 'Total Inventory Value'}</div>
                  {metrics.lowStockItems > 0 && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                      {metrics.lowStockItems} {language === 'id' ? 'Stok Rendah!' : 'Low Stock!'}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>${metrics.inventoryValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              </div>
            </div>
          </div>

          <div className="portlet">
            <div className="portlet-header">
              <Clock size={16} /> {language === 'id' ? 'Rata-rata Waktu Tunggu per Tahap' : 'Average Lead Time per Stage'}
            </div>
            <div style={{ padding: '1.5rem' }}>
              {Object.keys(metrics.avgLeadTimes).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2rem' }}>
                  {language === 'id' ? 'Belum cukup pergerakan historis untuk menghitung waktu tunggu. Cobalah menarik kartu antar kolom untuk menghasilkan data.' : 'Not enough historical movements to calculate lead time. Try dragging cards between columns to generate data.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {Object.entries(metrics.avgLeadTimes)
                    .sort(([, msA], [, msB]) => msB - msA) // Sort by longest duration
                    .map(([stageId, ms]) => {
                      const maxMs = metrics.avgLeadTimes[metrics.bottleneckStage];
                      const pct = Math.round((ms / maxMs) * 100);
                      const isBottleneck = stageId === metrics.bottleneckStage;

                      return (
                        <div key={stageId}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{getStageTitle(stageId)}</span>
                            <span style={{ color: isBottleneck ? '#ef4444' : 'var(--text-muted)', fontWeight: isBottleneck ? '700' : '500' }}>
                              {formatDuration(ms)}
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${pct}%`, 
                              height: '100%', 
                              backgroundColor: isBottleneck ? '#ef4444' : 'var(--primary-color)',
                              borderRadius: '5px' 
                            }}></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
