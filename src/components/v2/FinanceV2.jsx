import { useState, useEffect } from 'react';
import { 
  DollarSign, Calculator, ShieldCheck, 
  ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { initialProducts, initialApBills, initialArInvoices } from '../../data/v2Data';
import { apiService } from '../../services/apiService';

export default function FinanceV2({ language }) {
  const [activeTab, setActiveTab] = useState('cogs'); // 'cogs' | 'ap' | 'ar' | 'warranty' | 'currency'
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

  // AP Bills state
  const [apBills, setApBills] = useState(() => {
    try {
      const saved = localStorage.getItem('moai_v2_ap_bills');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load AP bills', e);
    }
    return initialApBills;
  });

  // AR Invoices state
  const [arInvoices, setArInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('moai_v2_ar_invoices');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load AR invoices', e);
    }
    return initialArInvoices;
  });

  // REST API Mount Fetch
  useEffect(() => {
    apiService.finance.getAPBills().then(data => {
      if (data && Array.isArray(data)) {
        setApBills(data);
        try { localStorage.setItem('moai_v2_ap_bills', JSON.stringify(data)); } catch (err) { console.debug(err); }
      }
    });
    apiService.finance.getARInvoices().then(data => {
      if (data && Array.isArray(data)) {
        setArInvoices(data);
        try { localStorage.setItem('moai_v2_ar_invoices', JSON.stringify(data)); } catch (err) { console.debug(err); }
      }
    });
  }, []);

  const handlePayBill = (billId) => {
    const updatedBills = apBills.map(b => {
      if (b.id === billId) {
        return { ...b, status: 'paid', paid_at: new Date().toISOString() };
      }
      return b;
    });
    setApBills(updatedBills);
    apiService.finance.payAPBill(billId);
    try {
      localStorage.setItem('moai_v2_ap_bills', JSON.stringify(updatedBills));
    } catch (err) {
      console.error('Failed to save AP bills to localStorage', err);
    }
  };

  const handleReconcileInvoice = (invId) => {
    const updatedInvs = arInvoices.map(inv => {
      if (inv.id === invId) {
        return { ...inv, status: 'paid', paid_at: new Date().toISOString() };
      }
      return inv;
    });
    setArInvoices(updatedInvs);
    apiService.finance.reconcileARInvoice(invId);
    try {
      localStorage.setItem('moai_v2_ar_invoices', JSON.stringify(updatedInvs));
    } catch (err) {
      console.error('Failed to save AR invoices to localStorage', err);
    }
  };

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
            <DollarSign size={18} /> MODUL 5 — FINANCE & COSTING
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)', margin: '0.25rem 0 0 0' }}>
            {isId ? 'Kalkulasi HPP / COGS, Utang-Piutang & Biaya Garansi' : 'HPP / COGS Roll-up, AP/AR & Warranty Cost Tracking'}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isId 
              ? 'Roll-up HPP perakitan BOM, utang supplier (AP), piutang klien (AR), pemotongan biaya servis garansi, dan kurs impor USD.' 
              : 'Assembly BOM HPP roll-up, supplier AP bills, client AR invoices, warranty service deductions, and USD import fx rates.'}
          </p>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
          {[
            { id: 'cogs', label: 'HPP / COGS Roll-up', icon: Calculator },
            { id: 'ap', label: isId ? 'Utang Dagang (AP)' : 'AP Bills', icon: ArrowDownLeft },
            { id: 'ar', label: isId ? 'Piutang Klien (AR)' : 'AR Invoices', icon: ArrowUpRight },
            { id: 'warranty', label: isId ? 'Biaya Servis & Garansi' : 'Warranty Cost', icon: ShieldCheck }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
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
      {/* TAB 1: COGS / HPP ROLL-UP */}
      {/* ========================================================================= */}
      {activeTab === 'cogs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1rem', borderRadius: '0.75rem', color: '#1e40af', fontSize: '0.85rem' }}>
            <strong>Metode Penetapan HPP (COGS):</strong>
            <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
              <li><strong>Prebuilt PC:</strong> BOM Roll-up = Akumulasi harga beli aktual 7 komponen spare parts saat perakitan + Biaya Tenaga Kerja (Labor) + Overhead.</li>
              <li><strong>Unit Serialized (CPU, GPU, Laptop):</strong> Specific Identification (HPP persis sesuai harga beli fisik nomor seri tersebut).</li>
              <li><strong>Spare Parts Umum (SSD, RAM, Case):</strong> Weighted Average / FIFO.</li>
            </ul>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Produk</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Metode COGS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>HPP Dasar (Cost)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Harga Jual</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Gross Margin (Rp)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Gross Margin (%)</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const grossMargin = p.unit_price - p.cost_price;
                  const marginPct = ((grossMargin / p.unit_price) * 100).toFixed(1);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sku}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                          {p.is_assembly ? 'BOM ROLL-UP' : p.is_serial ? 'SPECIFIC ID' : 'FIFO / AVERAGE'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                        {formatIDR(p.cost_price)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#047857' }}>
                        {formatIDR(p.unit_price)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>
                        {formatIDR(grossMargin)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: '800' }}>
                          +{marginPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AP BILLS */}
      {/* ========================================================================= */}
      {activeTab === 'ap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>No. Tagihan (AP Bill)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Pemasok (Vendor)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Jatuh Tempo & TOP</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Jumlah Tagihan</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Aksi Pembayaran</th>
                </tr>
              </thead>
              <tbody>
                {apBills.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary-color)' }}>{b.bill_no}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{b.vendor}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div>{b.due_date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Syarat: {b.term}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: '700' }}>{formatIDR(b.amount)}</div>
                      {b.currency === 'USD' && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${b.usd_val?.toLocaleString()} USD</div>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        backgroundColor: b.status.toLowerCase() === 'paid' ? '#ecfdf5' : '#fee2e2', 
                        color: b.status.toLowerCase() === 'paid' ? '#047857' : '#991b1b', 
                        fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' 
                      }}>
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {b.status.toLowerCase() !== 'paid' ? (
                        <button 
                          id={`btn-pay-${b.id}`}
                          onClick={() => handlePayBill(b.id)}
                          style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Bayar via Transfer
                        </button>
                      ) : (
                        <span style={{ color: '#047857', fontWeight: '700', fontSize: '0.75rem' }}>✓ Lunas (Paid)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AR INVOICES */}
      {/* ========================================================================= */}
      {activeTab === 'ar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>No. Faktur (AR Invoice)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Klien / Pelanggan</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Jatuh Tempo</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Piutang</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Aksi Penagihan</th>
                </tr>
              </thead>
              <tbody>
                {arInvoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary-color)' }}>{inv.inv_no}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{inv.client}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{inv.due_date}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>{formatIDR(inv.amount)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                        backgroundColor: inv.status.toLowerCase() === 'paid' ? '#ecfdf5' : '#fef3c7',
                        color: inv.status.toLowerCase() === 'paid' ? '#047857' : '#b45309'
                      }}>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {inv.status.toLowerCase() !== 'paid' ? (
                        <button 
                          id={`btn-reconcile-${inv.id}`}
                          onClick={() => handleReconcileInvoice(inv.id)}
                          style={{ backgroundColor: '#047857', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Rekonsiliasi Bayar
                        </button>
                      ) : (
                        <span style={{ color: '#047857', fontWeight: '700', fontSize: '0.75rem' }}>✓ Lunas (Paid)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WARRANTY COST TRACKING */}
      {/* ========================================================================= */}
      {activeTab === 'warranty' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.15rem', fontWeight: '700' }}>
              Pelacakan Biaya Operasional Garansi & Servis (Warranty Cost)
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Setiap penanganan RMA/servis yang membutuhkan suku cadang pengganti dicatat biayanya agar dapat dikurangkan dari margin kotor produk (menghasilkan Net Margin riil) serta ditagihkan ke prinsipal/vendor bila masih dalam garansi vendor.
            </p>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700' }}>Tiket Servis: SRV-2026-0012 (RMA-2026-0005)</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unit: MOAI Ares Elite Gaming PC (SN-ARES-PC-002) · Klien: PT Telko Solusi Nusantara</div>
              <div style={{ fontSize: '0.8rem', color: '#92400e', marginTop: '0.25rem' }}>Tindakan: Penggantian modul RAM DDR5 32GB (Biaya part: Rp 1.650.000 + Jasa teknisi: Rp 150.000)</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status Klaim Vendor:</div>
              <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                Klaim Vendor Disetujui (Kingston)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
