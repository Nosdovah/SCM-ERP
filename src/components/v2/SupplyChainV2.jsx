import { useState } from 'react';
import { 
  ShoppingCart, Truck, ShieldCheck, AlertTriangle, DollarSign
} from 'lucide-react';
import { 
  initialPurchaseOrders, initialRequisitions 
} from '../../data/v2Data';

const createPurchaseOrderFromPR = (pr) => ({
  id: `po-${Date.now()}`,
  po_number: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
  supplier_name: pr.supplier_name,
  order_date: new Date().toISOString().substring(0, 10),
  expected_date: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
  status: 'APPROVED',
  currency: 'IDR',
  total: pr.suggested_qty * 1850000,
  items_count: 1
});

export default function SupplyChainV2({ language }) {
  const [tab, setTab] = useState('orders'); // 'orders' | 'reorder' | 'grn_qc' | 'price_compare' | 'rtv'
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
  const [requisitions, setRequisitions] = useState(initialRequisitions);

  // Inbound QC modal
  const [showQCModal, setShowQCModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [qcForm, setQcForm] = useState({ serialsScanned: 'SN-AMD-78X-004\nSN-AMD-78X-005', passCount: 2, failCount: 0, note: 'Kondisi segel utuh, lolos uji boot' });

  const isId = language === 'id';
  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  // 1-Click Convert PR to PO
  const handleConvertPR = (prId) => {
    const pr = requisitions.find(r => r.id === prId);
    if (!pr) return;

    const newPO = createPurchaseOrderFromPR(pr);

    setPurchaseOrders([newPO, ...purchaseOrders]);
    setRequisitions(requisitions.map(r => r.id === prId ? { ...r, status: 'CONVERTED' } : r));
    alert(isId ? `Purchase Requisition berhasil dikonversi menjadi Purchase Order: ${newPO.po_number}!` : `PR converted to PO: ${newPO.po_number}!`);
  };

  const handleExecuteQC = (e) => {
    e.preventDefault();
    if (selectedPO) {
      setPurchaseOrders(purchaseOrders.map(p => p.id === selectedPO.id ? { ...p, status: 'FULL' } : p));
      setShowQCModal(false);
      alert(isId ? `QC Inspection lolos! Unit dipindahkan dari zona QUARANTINE ke rak kategori via movement QC_RELEASE.` : `QC passed! Goods put away to category rack via QC_RELEASE.`);
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
            <Truck size={18} /> MODUL 3 — SUPPLY CHAIN MANAGEMENT (SCM) & INBOUND
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)', margin: '0.25rem 0 0 0' }}>
            {isId ? 'Pengadaan Komponen, Inbound Receiving & Gerbang QC' : 'Procurement, Inbound Receiving & QC Gate'}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isId 
              ? 'Saran reorder otomatis (PR), PO multi-currency, capture serial saat receiving, dan inspeksi karantina QC.' 
              : 'Automated reorder point PR, multi-currency POs, serial capture at receiving, and quarantine QC gate.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
          {[
            { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
            { id: 'reorder', label: isId ? 'Saran Reorder (PR)' : 'Auto Reorder', icon: AlertTriangle },
            { id: 'grn_qc', label: 'Receiving & QC Gate', icon: ShieldCheck },
            { id: 'price_compare', label: isId ? 'Banding Harga Supplier' : 'Price Comparison', icon: DollarSign }
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
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
      {/* TAB 1: PURCHASE ORDERS */}
      {/* ========================================================================= */}
      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>No. PO</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Supplier / Vendor</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tgl Order & Estimasi Tiba</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Mata Uang & Total</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Aksi Inbound</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map(po => (
                  <tr key={po.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary-color)' }}>
                      {po.po_number}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                      {po.supplier_name}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div>Order: {po.order_date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tiba: {po.expected_date}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: '700' }}>
                        {po.currency === 'USD' ? `$${po.total.toLocaleString()}` : formatIDR(po.total)}
                      </div>
                      {po.currency === 'USD' && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kurs PO: Rp {po.exchange_rate?.toLocaleString()}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                        backgroundColor: po.status === 'FULL' ? '#ecfdf5' : po.status === 'APPROVED' ? '#eff6ff' : '#fef3c7',
                        color: po.status === 'FULL' ? '#047857' : po.status === 'APPROVED' ? '#1d4ed8' : '#b45309'
                      }}>
                        {po.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {po.status === 'APPROVED' && (
                        <button
                          onClick={() => { setSelectedPO(po); setShowQCModal(true); }}
                          style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Terima & Inspeksi QC
                        </button>
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
      {/* TAB 2: AUTOMATED REORDER SUGGESTIONS (PR) */}
      {/* ========================================================================= */}
      {tab === 'reorder' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1rem', borderRadius: '0.75rem', color: '#1e40af', fontSize: '0.85rem' }}>
            <strong>Deteksi Reorder Point Otomatis:</strong> Sistem secara proaktif memantau stok komponen fast-moving (seperti SSD, RAM, GPU). Ketika level stok mencapai ambang batas safety stock, saran Purchase Requisition (PR) dibuat otomatis dan dapat dikonversi ke PO dalam 1 klik.
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>No. PR</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Produk Komponen</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Stok Saat Ini vs Reorder Point</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Saran Qty Beli</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Rekomendasi Pemasok</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map(pr => (
                  <tr key={pr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary-color)' }}>{pr.pr_number}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{pr.product_name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ color: '#dc2626', fontWeight: '700' }}>{pr.current_stock} pcs</span> (Ambang: {pr.reorder_point} pcs)
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>{pr.suggested_qty} pcs</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{pr.supplier_name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                        backgroundColor: pr.status === 'OPEN' ? '#fef3c7' : '#ecfdf5',
                        color: pr.status === 'OPEN' ? '#b45309' : '#047857'
                      }}>
                        {pr.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {pr.status === 'OPEN' && (
                        <button
                          onClick={() => handleConvertPR(pr.id)}
                          style={{ backgroundColor: '#047857', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Konversi ke PO (1 Klik)
                        </button>
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
      {/* TAB 3: RECEIVING & QC QUARANTINE GATE */}
      {/* ========================================================================= */}
      {tab === 'grn_qc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '1rem', borderRadius: '0.75rem', color: '#92400e', fontSize: '0.85rem' }}>
            <strong>Alur Inbound QC:</strong> PO Disetujui → Barang Datang (GRN) → Scan SN/IMEI → Masuk Zona Karantina (<code>QC-IN-01</code>) → Inspeksi QC (Fisik & Booting) → Lolos: Posting <code>QC_RELEASE</code> ke rak utama (PB/BB/SP). Gagal: <code>RETURN_VENDOR</code> atau Scrap.
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontWeight: '700', color: 'var(--primary-color)' }}>
              Inspeksi QC Menunggu Tindakan
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
                  ZONA KARANTINA (QC-IN-01)
                </span>
                <div style={{ fontWeight: '700', fontSize: '1.05rem', marginTop: '0.35rem' }}>GRN-2026-0043 (Ref: PO-2026-0043)</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pemasok: Silicon Tech Global Ltd · 15 Unit AMD Ryzen & Kingston SSD</div>
              </div>
              <button
                onClick={() => { setSelectedPO(purchaseOrders[1]); setShowQCModal(true); }}
                style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Mulai Inspeksi QC & Putaway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MULTI-VENDOR PRICE COMPARISON */}
      {/* ========================================================================= */}
      {tab === 'price_compare' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.15rem', fontWeight: '700' }}>
              Perbandingan Harga Beli Multi-Vendor (Komponen Kritis)
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Bandingkan harga beli, lead time pengiriman, dan rating defect sebelum menerbitkan Purchase Order.
            </p>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Komponen</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Supplier A (Synnex)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Supplier B (Asus ID)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Supplier C (Silicon HK - USD)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Rekomendasi Sistem</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>AMD Ryzen 7 7800X3D</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: '700', color: '#047857' }}>Rp 5.900.000</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lead time: 3 hari</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>Tidak sedia</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: '600' }}>$365 (Rp 5.712.250)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lead time: 14 hari</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                      Synnex (Lead time tercepat)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>Samsung 990 PRO 1TB</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: '600' }}>Rp 1.850.000</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lead time: 3 hari</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>Tidak sedia</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: '700', color: '#047857' }}>$108 (Rp 1.690.200)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lead time: 12 hari</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                      Silicon HK (Hemat 8.6%)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: QC INSPECTION */}
      {showQCModal && selectedPO && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '520px', maxWidth: '90%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Inspeksi QC & Putaway ({selectedPO.po_number})</h3>
            <form onSubmit={handleExecuteQC} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Scan Serial Number / IMEI Unit yang Diterima</label>
                <textarea
                  rows="3"
                  value={qcForm.serialsScanned}
                  onChange={e => setQcForm({ ...qcForm, serialsScanned: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Jumlah Lolos (Pass)</label>
                  <input type="number" value={qcForm.passCount} onChange={e => setQcForm({ ...qcForm, passCount: Number(e.target.value) })} style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Jumlah Cacat (Reject)</label>
                  <input type="number" value={qcForm.failCount} onChange={e => setQcForm({ ...qcForm, failCount: Number(e.target.value) })} style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Catatan Pengujian QC</label>
                <input type="text" value={qcForm.note} onChange={e => setQcForm({ ...qcForm, note: e.target.value })} style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} />
              </div>

              <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem', color: '#1e40af' }}>
                Setelah konfirmasi: Unit yang lolos akan dibuatkan baris <code>serial_numbers</code> status <code>IN_STOCK</code> dan diposting movement <code>QC_RELEASE</code> ke rak utama.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowQCModal(false)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', backgroundColor: 'transparent', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#047857', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Konfirmasi QC & Putaway</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
