import { useState } from 'react';
import { 
  BarChart3, TrendingUp, Users, DollarSign 
} from 'lucide-react';
import { initialProducts, calculateTotalValuation } from '../../data/v2Data';

export default function ManagerialV2({ language }) {
  const [subTab, setSubTab] = useState('executive'); // 'executive' | 'aging_report' | 'worker_perf' | 'pnl'

  const [products] = useState(() => {
    try {
      const saved = localStorage.getItem('moai_v2_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load products', e);
    }
    return initialProducts;
  });

  const isId = language === 'id';
  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  const totalValuation = calculateTotalValuation(products);

  // Worker performance mock data from spec
  const workerKPIs = [
    { role: 'Admin Picking', name: 'Ahmad Outbound', lines_picked: 142, units: 280, accuracy: '99.4%', avg_time_task: '4.2 menit', short_pick: '0.2%' },
    { role: 'Admin Packing', name: 'Siti Logistik', orders_packed: 68, units: 195, accuracy: '99.8%', avg_time_order: '6.5 menit', short_pick: '-' },
    { role: 'Admin Return (RMA)', name: 'Doni Return', returns_processed: 12, resolved_value: 48500000, avg_time_res: '1.2 hari', dominant_reason: 'Blue Screen' },
    { role: 'Assembly & QC Tech', name: 'Bambang Perakitan', units_built: 8, components_issued: 56, bom_accuracy: '100%', units_qc: 15, defect_rate: '0.0%' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        backgroundColor: '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '0.75rem',
        border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontWeight: '700', fontSize: '0.875rem' }}>
            <BarChart3 size={18} /> MODUL 6 — MANAGERIAL, BILLING & ANALITIK
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)', margin: '0.25rem 0 0 0' }}>
            {isId ? 'Laporan Keuangan Eksekutif & Kinerja Produktivitas Staf' : 'Executive Finance Reports & Worker Performance'}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isId 
              ? 'Valuasi persediaan, analisis dead stock & modal tertahan, P&L ringkas, dan metrik kinerja harian staf gudang.' 
              : 'Inventory valuation, dead stock & idle capital analysis, summary P&L, and daily warehouse worker metrics.'}
          </p>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
          {[
            { id: 'executive', label: isId ? 'Ikhtisar Eksekutif' : 'Executive Overview', icon: TrendingUp },
            { id: 'worker_perf', label: isId ? 'Kinerja Staf Gudang' : 'Worker Performance', icon: Users },
            { id: 'pnl', label: isId ? 'P&L Ringkas' : 'Summary P&L', icon: DollarSign }
          ].map(t => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 0.85rem', borderRadius: '0.375rem',
                  border: 'none', cursor: 'pointer', fontSize: '0.825rem', fontWeight: active ? '700' : '500',
                  backgroundColor: active ? '#ffffff' : 'transparent',
                  color: active ? 'var(--accent-color)' : 'var(--text-muted)',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {/* ========================================================================= */}
      {subTab === 'executive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Valuasi Gudang (HPP)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)', marginTop: '0.25rem' }}>{formatIDR(totalValuation)}</div>
              <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.25rem' }}>↑ 12% dari bulan lalu</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Omzet Penjualan Berjalan</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#047857', marginTop: '0.25rem' }}>Rp 240.500.000</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>3 Sales Order Aktif</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Modal Tertahan (Idle Capital)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#dc2626', marginTop: '0.25rem' }}>Rp 45.700.000</div>
              <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>Komponen &gt; 90 hari tanpa penjualan</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Net Profit Margin Aktual</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-color)', marginTop: '0.25rem' }}>18.4%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Setelah dipotong biaya garansi servis</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WORKER PERFORMANCE REPORT */}
      {/* ========================================================================= */}
      {subTab === 'worker_perf' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)', fontSize: '1.15rem', fontWeight: '700' }}>
              Laporan Kinerja Harian Petugas Gudang & Perakitan (Daily Workers KPI)
            </h3>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Peran & Nama Staf</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Kuantitas Selesai</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Tingkat Akurasi</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Rata-rata Durasi / Task</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Metrik Khusus</th>
                  </tr>
                </thead>
                <tbody>
                  {workerKPIs.map((w, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{w.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.role}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                        {w.lines_picked ? `${w.lines_picked} lines (${w.units} unit)` : w.orders_packed ? `${w.orders_packed} order (${w.units} unit)` : w.returns_processed ? `${w.returns_processed} kasus retur` : `${w.units_built} PC dirakit`}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: '800' }}>
                          {w.accuracy || w.bom_accuracy}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {w.avg_time_task || w.avg_time_order || w.avg_time_res || '45 menit/unit'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {w.short_pick && w.short_pick !== '-' ? `Short-pick rate: ${w.short_pick}` : w.dominant_reason ? `Alasan utama: ${w.dominant_reason}` : 'Defect QC: 0.0%'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: P&L RINGKAS */}
      {/* ========================================================================= */}
      {subTab === 'pnl' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.2rem', fontWeight: '700' }}>
            Laporan Laba / Rugi Ringkas (Periode Berjalan)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>Total Pendapatan Penjualan (Gross Sales)</span>
              <strong>Rp 240.500.000</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', color: '#dc2626' }}>
              <span>Beban Pokok Penjualan (COGS / HPP)</span>
              <strong>- Rp 188.750.000</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '2px solid var(--border-color)', fontWeight: '700' }}>
              <span>Laba Kotor (Gross Profit)</span>
              <strong style={{ color: '#047857' }}>Rp 51.750.000 (21.5%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', color: '#d97706' }}>
              <span>Beban Klaim Servis & Garansi (Warranty Cost)</span>
              <strong>- Rp 1.800.000</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', color: '#d97706' }}>
              <span>Beban Logistik & 3PL (LSP Billings)</span>
              <strong>- Rp 5.600.000</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary-color)' }}>
              <span>Laba Bersih Operasional (Net Operating Income)</span>
              <span style={{ color: '#047857' }}>Rp 44.350.000 (18.4%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
