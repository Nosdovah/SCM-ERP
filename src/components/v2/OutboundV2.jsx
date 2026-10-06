import { useState } from 'react';
import { 
  Send, PackageCheck, Truck, FileText, Barcode, CheckCircle2
} from 'lucide-react';
import { initialSalesOrders } from '../../data/v2Data';

export default function OutboundV2({ language }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'picking' | 'packing' | 'surat_jalan'
  const [salesOrders, setSalesOrders] = useState(initialSalesOrders);

  // Delivery Note modal
  const [showSJModal, setShowSJModal] = useState(false);
  const [selectedSO, setSelectedSO] = useState(null);
  const [sjForm, setSjForm] = useState({ driver_name: 'Joko Prabowo', vehicle_no: 'B 9281 KCA', note: 'Kirim via armada internal PT Kompakom' });

  // Wave Picking state
  const [wavePickingState, setWavePickingState] = useState('IDLE');

  // Packing Station state
  const [packedOrders, setPackedOrders] = useState([
    {
      id: 'pack-01',
      pack_no: 'PACK-2026-0052',
      so_number: 'SO-2026-0102',
      client: 'Diskominfo Pemprov DKI Jakarta',
      items: '10x Lenovo ThinkPad E14 Gen 5',
      box_count: 2,
      weight_kg: 18.5,
      status: 'PACKED'
    }
  ]);
  const [currentPackForm, setCurrentPackForm] = useState({
    so_number: 'SO-2026-0103',
    box_count: 1,
    weight_kg: 4.2,
    notes: 'Segel QC utuh'
  });
  const [packSuccessMsg, setPackSuccessMsg] = useState(null);

  const isId = language === 'id';
  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const handleStartWavePicking = () => {
    setWavePickingState('IN_PROGRESS');
    setTimeout(() => {
      setWavePickingState('COMPLETED');
    }, 400);
  };

  const handleExecutePacking = (e) => {
    e.preventDefault();
    const newPack = {
      id: `pack-${Date.now()}`,
      pack_no: `PACK-2026-00${packedOrders.length + 53}`,
      so_number: currentPackForm.so_number,
      client: currentPackForm.so_number === 'SO-2026-0103' ? 'Toko Jaya Makmur Komputer' : 'Diskominfo Pemprov DKI Jakarta',
      items: currentPackForm.so_number === 'SO-2026-0103' ? '2x AMD Ryzen 7 7800X3D, 5x Kingston DDR5 32GB' : '10x Lenovo ThinkPad E14 Gen 5',
      box_count: currentPackForm.box_count,
      weight_kg: currentPackForm.weight_kg,
      status: 'PACKED'
    };
    setPackedOrders([newPack, ...packedOrders]);
    setPackSuccessMsg(isId ? `Paket ${newPack.pack_no} (${newPack.so_number}) berhasil disegel & siap kirim!` : `Package ${newPack.pack_no} sealed & ready to ship!`);
  };

  const handleCreateSJ = (e) => {
    e.preventDefault();
    if (selectedSO) {
      setSalesOrders(salesOrders.map(s => s.id === selectedSO.id ? { ...s, status: 'SHIPPED' } : s));
      setShowSJModal(false);
      alert(isId 
        ? `Surat Jalan diterbitkan! Movement GI (-) resmi dicatat pada stock ledger dan status order berubah menjadi SHIPPED.` 
        : `Surat Jalan issued! GI (-) movement posted to ledger and order status set to SHIPPED.`);
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
            <Send size={18} /> MODUL 4 — OUTBOUND / SALES & FULFILLMENT
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)', margin: '0.25rem 0 0 0' }}>
            {isId ? 'Pesanan Penjualan, Picking Engine & Surat Jalan' : 'Sales Orders, Picking Engine & Delivery Notes'}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isId 
              ? 'Alokasi stok available, single/wave picking, packing station, dan penerbitan Surat Jalan (GI resmi).' 
              : 'Available stock allocation, single/wave picking, packing station, and official Goods Issue (GI) Delivery Notes.'}
          </p>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
          {[
            { id: 'orders', label: 'Sales Orders', icon: FileText },
            { id: 'picking', label: 'Picking Engine (Single/Wave)', icon: PackageCheck },
            { id: 'packing', label: 'Packing Station', icon: Barcode },
            { id: 'surat_jalan', label: isId ? 'Surat Jalan (GI)' : 'Delivery Notes', icon: Truck }
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
      {/* TAB 1: SALES ORDERS */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>No. Sales Order</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Nama Klien</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tgl Order</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Prioritas</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Nilai Order</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Aksi Pemenuhan</th>
                </tr>
              </thead>
              <tbody>
                {salesOrders.map(so => (
                  <tr key={so.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary-color)' }}>
                      {so.so_number}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                      {so.client_name}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{so.order_date}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                        backgroundColor: so.priority === 'High' ? '#fee2e2' : '#eff6ff',
                        color: so.priority === 'High' ? '#991b1b' : '#1d4ed8'
                      }}>
                        {so.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>
                      {formatIDR(so.total)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                        backgroundColor: so.status === 'DELIVERED' ? '#ecfdf5' : so.status === 'SHIPPED' ? '#f0fdf4' : '#fef3c7',
                        color: so.status === 'DELIVERED' ? '#047857' : so.status === 'SHIPPED' ? '#15803d' : '#b45309'
                      }}>
                        {so.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {so.status === 'PICKING' && (
                        <button
                          onClick={() => { setSelectedSO(so); setShowSJModal(true); }}
                          style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Terbitkan Surat Jalan
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
      {/* TAB 2: PICKING ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'picking' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Single Picking */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', width: 'fit-content' }}>
              SINGLE ORDER PICKING
            </span>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Untuk Order Corporate & B2B Besar</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              1 Picker dialokasikan untuk menyelesaikan 1 nomor SO secara penuh. Daftar item diurutkan berdasarkan urutan bin terdekat: <strong>Zone → Rack → Shelf → Level</strong>.
            </p>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
              <div>Task Aktif: <strong>PICK-2026-0081 (Ref: SO-2026-0102)</strong></div>
              <div>Item: 10x Lenovo ThinkPad E14 Gen 5 (Bin PB-A-1-01)</div>
              <div>Picker: Ahmad Outbound · Status: In Progress (Scan SN)</div>
            </div>
          </div>

          {/* Wave Picking */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', width: 'fit-content' }}>
              BULK / WAVE PICKING
            </span>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Untuk Volume Tinggi & Retail E-Commerce</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Agregasi kuantitas item yang sama dari 10+ Sales Order sekaligus. Petugas mengambil sekali di rak lalu memilah ke staging bin (put-to-light).
            </p>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
              <div>Wave Batch: <strong>WAVE-BATCH-09</strong> (4 SO Retail)</div>
              <div>Total Komponen: 12x RAM 32GB + 8x SSD 1TB</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  id="btn-wave-picking"
                  onClick={handleStartWavePicking}
                  style={{ backgroundColor: wavePickingState === 'COMPLETED' ? '#047857' : '#6d28d9', color: '#ffffff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  {wavePickingState === 'IDLE' ? 'Mulai Wave Picking Teragregasi' : wavePickingState === 'IN_PROGRESS' ? 'Memproses Pengambilan...' : '✓ Wave Picking Selesai (Staging)'}
                </button>
              </div>
              {wavePickingState !== 'IDLE' && (
                <div id="wave-picking-status" style={{ marginTop: '0.5rem', color: wavePickingState === 'COMPLETED' ? '#047857' : '#6d28d9', fontWeight: '700', fontSize: '0.75rem' }}>
                  {wavePickingState === 'COMPLETED' ? '✓ Batch selesai dipilah ke keranjang staging put-to-light' : 'Sedang memindai bin teragregasi di rak SP-*'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PACKING STATION */}
      {/* ========================================================================= */}
      {activeTab === 'packing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Packing form & Station info */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                  MEJA PACKING 01 (AKTIF)
                </span>
                <h3 style={{ margin: '0.4rem 0 0 0', color: 'var(--primary-color)' }}>
                  Packing Station & Verifikasi Barcode Dus
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Verifikasi fisik unit hasil picking, cetak barcode packing list, input jumlah koli/dus, dan penimbangan berat total sebelum Surat Jalan terbit.
                </p>
              </div>
            </div>

            {packSuccessMsg && (
              <div id="pack-success-alert" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '0.5rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <CheckCircle2 size={18} />
                <span>{packSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleExecutePacking} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '1rem', alignItems: 'flex-end', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Nomor Sales Order</label>
                <select 
                  id="pack-select-so"
                  value={currentPackForm.so_number} 
                  onChange={e => setCurrentPackForm({ ...currentPackForm, so_number: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                >
                  <option value="SO-2026-0103">SO-2026-0103 (Toko Jaya Makmur)</option>
                  <option value="SO-2026-0102">SO-2026-0102 (Diskominfo DKI)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Jumlah Koli / Box</label>
                <input 
                  id="pack-box-count"
                  type="number" 
                  min="1" 
                  value={currentPackForm.box_count}
                  onChange={e => setCurrentPackForm({ ...currentPackForm, box_count: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Berat Total (Kg)</label>
                <input 
                  id="pack-weight"
                  type="number" 
                  step="0.1" 
                  value={currentPackForm.weight_kg}
                  onChange={e => setCurrentPackForm({ ...currentPackForm, weight_kg: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Kondisi / Segel</label>
                <input 
                  id="pack-notes"
                  type="text" 
                  value={currentPackForm.notes}
                  onChange={e => setCurrentPackForm({ ...currentPackForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                />
              </div>

              <button 
                id="btn-confirm-pack"
                type="submit"
                style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff', border: 'none', padding: '0.55rem 1rem', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', height: 'fit-content' }}
              >
                Segel Dus & Cetak Label
              </button>
            </form>
          </div>

          {/* Packing History Table */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '700', color: 'var(--primary-color)' }}>
              Daftar Paket Siap Kirim (Packing Completed)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>No. Pack</th>
                  <th style={{ padding: '0.75rem 1rem' }}>No. Sales Order</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Klien</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Rincian Barang</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Koli & Berat</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {packedOrders.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary-color)' }}>{p.pack_no}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{p.so_number}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{p.client}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{p.items}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{p.box_count} Dus ({p.weight_kg} kg)</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                        ✓ {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SURAT JALAN & GI */}
      {/* ========================================================================= */}
      {activeTab === 'surat_jalan' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1rem', borderRadius: '0.5rem', color: '#047857', fontSize: '0.85rem' }}>
            <strong>Aturan Bisnis Kritis:</strong> Penerbitan Surat Jalan (Delivery Note) adalah satu-satunya pemicu resmi pengeluaran stok <strong>GI (Goods Issue)</strong> dari ledger. Dokumen ini juga otomatis menerbitkan draf Invoice (Faktur Piutang) ke modul Finance.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ backgroundColor: '#ecfdf5', color: '#047857', fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
                  TERKIRIM (DELIVERED)
                </span>
                <div style={{ fontWeight: '700', fontSize: '1.05rem', marginTop: '0.35rem' }}>SJ-2026-0089 (Ref: SO-2026-0101)</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Penerima: PT Telko Solusi Nusantara · Driver: Joko Prabowo (B 9281 KCA)</div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: '700' }}>
                ✓ Tanda tangan penerima tercatat
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SURAT JALAN */}
      {showSJModal && selectedSO && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '500px', maxWidth: '90%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Terbitkan Surat Jalan ({selectedSO.so_number})</h3>
            <form onSubmit={handleCreateSJ} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Nama Pengemudi / Driver</label>
                <input type="text" required value={sjForm.driver_name} onChange={e => setSjForm({ ...sjForm, driver_name: e.target.value })} style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Nomor Polisi Kendaraan</label>
                <input type="text" required value={sjForm.vehicle_no} onChange={e => setSjForm({ ...sjForm, vehicle_no: e.target.value })} style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Catatan Pengiriman</label>
                <input type="text" value={sjForm.note} onChange={e => setSjForm({ ...sjForm, note: e.target.value })} style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} />
              </div>

              <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem', color: '#1e40af' }}>
                Konfirmasi ini akan memicu posting mutasi <strong>GI (-)</strong> pada stock movements dan memperbarui status serial number menjadi <strong>SOLD</strong>.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowSJModal(false)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', backgroundColor: 'transparent', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.375rem', backgroundColor: 'var(--accent-color)', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Konfirmasi & Terbitkan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
