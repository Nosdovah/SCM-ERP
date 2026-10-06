import { useState } from 'react';
import { 
  Layers, Search, Barcode, ShieldAlert, 
  ArrowRightLeft, Clock, AlertTriangle, 
  History
} from 'lucide-react';
import { 
  initialProducts, initialSerials, initialStockMovements, initialBins 
} from '../../data/v2Data';

export default function InventoryManagementV2({ session, language }) {
  const [subTab, setSubTab] = useState('overview'); // 'overview' | 'serials' | 'movements' | 'operations' | 'aging' | 'rma'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('moai_v2_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load products from localStorage', e);
    }
    return initialProducts;
  });
  const [serials, setSerials] = useState(() => {
    try {
      const saved = localStorage.getItem('moai_v2_serials');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialSerials;
  });
  const [movements, setMovements] = useState(initialStockMovements);
  const [bins] = useState(initialBins);

  // Transfer & Adjustment Modals & Notices
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [transferNotice, setTransferNotice] = useState(null);
  const [adjNotice, setAdjNotice] = useState(null);
  const [newTransfer, setNewTransfer] = useState({ product_sku: 'SP-RAM-DDR5-32G', from_bin: 'SP-RAM-B-01', to_bin: 'SP-RAM-B-02', qty: 5 });
  const [newAdj, setNewAdj] = useState({ product_sku: 'SP-SSD-990P-1T', bin_code: 'SP-SSD-B-01', reason: 'damage', qty: -1, note: 'Patah saat handling gudang' });

  // RMA State & Notices (Flow #7)
  const [rmaCases, setRmaCases] = useState(() => {
    try {
      const saved = localStorage.getItem('moai_v2_rma_cases');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'rma-01',
        rma_number: 'RMA-2026-0005',
        type: 'CUSTOMER_RETURN',
        product_name: 'MOAI Ares Elite Gaming PC',
        serial_no: 'SN-ARES-PC-002',
        client_name: 'PT Telko Solusi Nusantara',
        reason: 'Blue Screen saat render video',
        status: 'OPEN',
        bin_code: 'RMA-HOLD-01'
      }
    ];
  });
  const [rmaNotice, setRmaNotice] = useState(null);

  // Stock Opname Session (Flow #6)
  const [opnameSession, setOpnameSession] = useState({
    session_no: 'OPN-2026-001',
    warehouse: 'Gudang Pusat (Central)',
    zone: 'SPARE_PART (SP-*)',
    status: 'COUNTING',
    items: [
      { sku: 'SP-RAM-DDR5-32G', name: 'Kingston Fury Beast DDR5 32GB', system_qty: 45, counted_qty: 45, variance: 0 },
      { sku: 'SP-SSD-990P-1T', name: 'Samsung 990 PRO NVMe 1TB', system_qty: 38, counted_qty: 37, variance: -1 },
      { sku: 'SP-GPU-RTX4070S', name: 'MSI GeForce RTX 4070 Super 12GB', system_qty: 12, counted_qty: 12, variance: 0 }
    ]
  });
  const [opnameNotice, setOpnameNotice] = useState(null);

  const isId = language === 'id';
  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  // Calculations for KPI
  const totalValuation = products.reduce((acc, p) => acc + (p.stock * p.cost_price), 0);
  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const serializedCount = serials.filter(s => s.status === 'IN_STOCK').length;
  const rmaCount = serials.filter(s => s.status === 'RMA' || s.status === 'DEFECTIVE').length;

  // Filtered Serials
  const filteredSerials = serials.filter(s => 
    s.serial_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Transfer
  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    const prod = products.find(p => p.sku === newTransfer.product_sku);
    if (!prod) return;

    const newMov = {
      id: `mov-${Date.now()}`,
      movement_type: 'TRF_OUT',
      product_name: prod.name,
      qty: -Number(newTransfer.qty),
      bin_code: newTransfer.from_bin,
      ref_doc: `TRF-${Date.now().toString().slice(-4)}`,
      unit_cost: prod.cost_price,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      created_by: session?.user?.email || 'Inventory Staff'
    };
    const newMovIn = {
      ...newMov,
      id: `mov-${Date.now() + 1}`,
      movement_type: 'TRF_IN',
      qty: Number(newTransfer.qty),
      bin_code: newTransfer.to_bin
    };

    const updatedMovs = [newMovIn, newMov, ...movements];
    setMovements(updatedMovs);
    setShowTransferModal(false);
    setTransferNotice(isId ? `Transfer stok ${newTransfer.qty} unit dari ${newTransfer.from_bin} ke ${newTransfer.to_bin} berhasil diposting ke ledger!` : `Stock transfer posted to ledger successfully!`);
  };

  // Handle Adjustment
  const handleExecuteAdjustment = (e) => {
    e.preventDefault();
    const prod = products.find(p => p.sku === newAdj.product_sku);
    if (!prod) return;

    const qty = Number(newAdj.qty);
    const movType = qty >= 0 ? 'ADJ_IN' : 'ADJ_OUT';

    const newMov = {
      id: `mov-${Date.now()}`,
      movement_type: movType,
      product_name: prod.name,
      qty: qty,
      bin_code: newAdj.bin_code,
      ref_doc: `ADJ-${Date.now().toString().slice(-4)}`,
      unit_cost: prod.cost_price,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      created_by: session?.user?.email || 'Supervisor',
      note: `${newAdj.reason}: ${newAdj.note}`
    };

    const updatedProds = products.map(p => p.sku === prod.sku ? { ...p, stock: Math.max(0, p.stock + qty) } : p);
    const updatedMovs = [newMov, ...movements];
    setProducts(updatedProds);
    setMovements(updatedMovs);
    setShowAdjModal(false);
    setAdjNotice(isId ? `Penyesuaian stok (${movType} ${qty}) berhasil diposting ke ledger!` : `Stock adjustment posted to ledger!`);
    try {
      localStorage.setItem('moai_v2_products', JSON.stringify(updatedProds));
    } catch (err) {
      console.error(err);
    }
  };

  // RMA Handlers (Flow #7)
  const handleSendToService = (rmaId) => {
    const updated = rmaCases.map(c => c.id === rmaId ? { ...c, status: 'SERVICE_TICKET_CREATED' } : c);
    setRmaCases(updated);
    const updatedSerials = serials.map(s => s.serial_no === 'SN-ARES-PC-002' ? { ...s, status: 'WARRANTY_SERVICE' } : s);
    setSerials(updatedSerials);
    try {
      localStorage.setItem('moai_v2_rma_cases', JSON.stringify(updated));
      localStorage.setItem('moai_v2_serials', JSON.stringify(updatedSerials));
    } catch (e) {
      console.error(e);
    }
    setRmaNotice(isId ? 'Kasus RMA dialihkan ke Tiket Servis Garansi! Status Serial berubah menjadi WARRANTY_SERVICE.' : 'RMA transferred to Service Ticket! Serial status set to WARRANTY_SERVICE.');
  };

  const handleReturnToVendor = (rmaId) => {
    const updated = rmaCases.map(c => c.id === rmaId ? { ...c, status: 'RETURNED_VENDOR' } : c);
    setRmaCases(updated);
    const updatedSerials = serials.map(s => s.serial_no === 'SN-ARES-PC-002' ? { ...s, status: 'RETURNED_VENDOR' } : s);
    setSerials(updatedSerials);
    const newMov = {
      id: `mov-${Date.now()}`,
      movement_type: 'RTV_OUT',
      product_name: 'MOAI Ares Elite Gaming PC',
      qty: -1,
      bin_code: 'RMA-HOLD-01',
      ref_doc: 'RTV-2026-0005',
      unit_cost: 25450000,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      created_by: session?.user?.email || 'RMA Staff'
    };
    setMovements(prev => [newMov, ...prev]);
    try {
      localStorage.setItem('moai_v2_rma_cases', JSON.stringify(updated));
      localStorage.setItem('moai_v2_serials', JSON.stringify(updatedSerials));
    } catch (e) {
      console.error(e);
    }
    setRmaNotice(isId ? 'Barang diproses Return to Vendor (RTV)! Movement RTV_OUT (-1) resmi dicatat pada stock ledger.' : 'Return to Vendor (RTV) processed! RTV_OUT (-1) posted to stock ledger.');
  };

  // Stock Opname Handler (Flow #6)
  const handlePostOpname = () => {
    setOpnameSession(prev => ({ ...prev, status: 'POSTED' }));
    const newMov = {
      id: `mov-${Date.now()}`,
      movement_type: 'OPN_OUT',
      product_name: 'Samsung 990 PRO NVMe 1TB',
      qty: -1,
      bin_code: 'SP-SSD-B-01',
      ref_doc: opnameSession.session_no,
      unit_cost: 1650000,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      created_by: session?.user?.email || 'Opname Lead'
    };
    setMovements(prev => [newMov, ...prev]);
    setOpnameNotice(isId ? `Sesi Opname ${opnameSession.session_no} berhasil diposting! Selisih stok diposting ke ledger.` : `Stock opname posted! Variance movement recorded in ledger.`);
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
            <Layers size={18} /> MODUL 1 — INVENTORY MANAGEMENT (WMS)
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)', margin: '0.25rem 0 0 0' }}>
            {isId ? 'Manajemen Stok 3 Kategori Rak & Serial Registry' : '3-Category Inventory Management & Serial Registry'}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isId 
              ? 'Pilar Immutable Stock Ledger, unit tracking SN/IMEI, transfer bin atomik, penuaan stok, dan RMA.' 
              : 'Immutable Stock Ledger pillar, SN/IMEI unit tracking, atomic bin transfers, stock aging, and RMA.'}
          </p>
        </div>

        {/* Subtab Switcher */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
          {[
            { id: 'overview', label: isId ? 'Stok 3 Kategori' : '3 Racks Overview', icon: Layers },
            { id: 'serials', label: 'Serial Registry (SN/IMEI)', icon: Barcode },
            { id: 'movements', label: isId ? 'Buku Besar Stok (Ledger)' : 'Stock Ledger', icon: History },
            { id: 'operations', label: isId ? 'Transfer & Opname' : 'Operations', icon: ArrowRightLeft },
            { id: 'aging', label: isId ? 'Penuaan & Dead Stock' : 'Aging & Obsolescence', icon: Clock },
            { id: 'rma', label: isId ? 'RMA & Karantina' : 'RMA & Defective', icon: ShieldAlert }
          ].map(tab => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                data-testid={`tab-${tab.id}`}
                onClick={() => setSubTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 0.85rem', borderRadius: '0.375rem',
                  border: 'none', cursor: 'pointer', fontSize: '0.825rem', fontWeight: active ? '700' : '500',
                  backgroundColor: active ? '#ffffff' : 'transparent',
                  color: active ? 'var(--accent-color)' : 'var(--text-muted)',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Valuasi Stok Aktif</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary-color)', marginTop: '0.25rem' }}>{formatIDR(totalValuation)}</div>
          <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.2rem' }}>{products.length} SKU Produk Tersedia</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Unit Serial Terdaftar (In-Stock)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-color)', marginTop: '0.25rem' }}>{serializedCount} Unit</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>CPU, GPU, Laptop & Prebuilt</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Item Low Stock Alert</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: lowStockCount > 0 ? '#dc2626' : '#047857', marginTop: '0.25rem' }}>{lowStockCount} SKU</div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.2rem' }}>Di bawah safety stock</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Unit di Zona Karantina / RMA</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#d97706', marginTop: '0.25rem' }}>{rmaCount} Unit</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Terpisah dari stok jual</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: 3-CATEGORY OVERVIEW */}
      {/* ========================================================================= */}
      {subTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Category Filter Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              {
                id: 'PREBUILT', title: '1. Zona Rak Prebuilt (PB-*)',
                desc: 'Laptop & Desktop PC siap jual. Serialized & lolos QC final.',
                badge: '#3b82f6', count: products.filter(p => p.item_type === 'PREBUILT').length
              },
              {
                id: 'BAREBONE', title: '2. Zona Rak Barebone (BB-*)',
                desc: 'Mini PC & Desktop setengah jadi. Siap dirakit lebih lanjut.',
                badge: '#8b5cf6', count: products.filter(p => p.item_type === 'BAREBONE').length
              },
              {
                id: 'SPARE_PART', title: '3. Zona Rak Spare Parts (SP-*)',
                desc: 'Komponen (CPU, RAM, SSD, GPU, PSU). Fast moving & harga dinamis.',
                badge: '#10b981', count: products.filter(p => p.item_type === 'SPARE_PART').length
              }
            ].map(cat => {
              const active = categoryFilter === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setCategoryFilter(active ? 'ALL' : cat.id)}
                  style={{
                    backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.75rem',
                    border: active ? `2px solid ${cat.badge}` : '1px solid var(--border-color)',
                    cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: active ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--primary-color)' }}>{cat.title}</h4>
                    <span style={{ backgroundColor: cat.badge, color: '#ffffff', fontSize: '0.75rem', fontWeight: '800', padding: '0.15rem 0.5rem', borderRadius: '1rem' }}>
                      {cat.count} SKU
                    </span>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Stock Balances Table */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Produk / SKU</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Kategori Rak</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Lokasi Bin Fisik</th>
                  <th style={{ padding: '0.75rem 1rem' }}>On Hand (Fisik)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Allocated (Terikat SO)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Available (Siap Jual)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Nilai Aset (HPP)</th>
                </tr>
              </thead>
              <tbody>
                {products
                  .filter(p => categoryFilter === 'ALL' || p.item_type === categoryFilter)
                  .map(p => {
                    const allocated = serials.filter(s => s.sku === p.sku && s.status === 'ALLOCATED').length;
                    const available = Math.max(0, p.stock - allocated);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ 
                            fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                            backgroundColor: p.item_type === 'PREBUILT' ? '#eff6ff' : p.item_type === 'BAREBONE' ? '#f5f3ff' : '#ecfdf5',
                            color: p.item_type === 'PREBUILT' ? '#1d4ed8' : p.item_type === 'BAREBONE' ? '#6d28d9' : '#047857'
                          }}>
                            {p.item_type}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '600' }}>
                          {p.bin_code}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>
                          {p.stock} {p.uom}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#d97706', fontWeight: '600' }}>
                          {allocated} {p.uom}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#047857', fontWeight: '800' }}>
                          {available} {p.uom}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                          {formatIDR(p.stock * p.cost_price)}
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
      {/* SUBTAB 2: SERIAL NUMBER REGISTRY */}
      {/* ========================================================================= */}
      {subTab === 'serials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search bar */}
          <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={isId ? 'Ketik Serial Number, Nama Unit, atau SKU untuk melacak...' : 'Type Serial Number, Unit Name, or SKU to trace...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          {/* Serials Table */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Serial Number (SN / IMEI)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Nama Produk & SKU</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status Unit</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Lokasi Bin</th>
                  <th style={{ padding: '0.75rem 1rem' }}>HPP Unit</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Garansi Vendor</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Catatan / Catatan RMA</th>
                </tr>
              </thead>
              <tbody>
                {filteredSerials.map(s => {
                  const statusColors = {
                    IN_STOCK: { bg: '#ecfdf5', text: '#047857' },
                    ALLOCATED: { bg: '#eff6ff', text: '#1d4ed8' },
                    SOLD: { bg: '#f1f5f9', text: '#475569' },
                    RMA: { bg: '#fef3c7', text: '#b45309' },
                    DEFECTIVE: { bg: '#fee2e2', text: '#991b1b' }
                  }[s.status] || { bg: '#f1f5f9', text: '#334155' };

                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--accent-color)' }}>
                          {s.serial_no}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tgl Terima: {s.received_at}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: '600' }}>{s.product_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.sku}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ 
                          fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                          backgroundColor: statusColors.bg, color: statusColors.text
                        }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '600' }}>
                        {s.bin_code || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                        {formatIDR(s.unit_cost)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                        {s.vendor_warranty_end ? `s.d. ${s.vendor_warranty_end}` : '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {s.note || (s.status === 'SOLD' ? `Terjual ke klien (Garansi s.d ${s.customer_warranty_end})` : '-')}
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
      {/* SUBTAB 3: IMMUTABLE STOCK LEDGER */}
      {/* ========================================================================= */}
      {subTab === 'movements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Banner rule */}
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '0.85rem 1.25rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#92400e' }}>
            <AlertTriangle size={18} />
            <div>
              <strong>{isId ? 'Aturan Emas Stock Ledger:' : 'Golden Rule of Stock Ledger:'}</strong> {isId ? 'Data mutasi ini bersifat immutable (kekal). Tidak pernah ada perintah UPDATE saldo stok secara langsung. Semua pergerakan dicatat baris per baris secara berurutan.' : 'Stock movements are strictly immutable. There is no direct UPDATE on stock balances; all events are recorded chronologically.'}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Waktu & User</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Jenis Mutasi (Movement Type)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Produk</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Qty (+ / -)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Bin Gudang</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Dokumen Sumber</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Biaya / Unit</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => {
                  const isPositive = m.qty > 0;
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: '600' }}>{m.created_at}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.created_by}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ 
                          fontFamily: 'monospace', fontWeight: '800', fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                          backgroundColor: isPositive ? '#ecfdf5' : '#fee2e2',
                          color: isPositive ? '#047857' : '#991b1b'
                        }}>
                          {m.movement_type}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                        {m.product_name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ 
                          fontWeight: '800', fontSize: '0.95rem',
                          color: isPositive ? '#047857' : '#dc2626'
                        }}>
                          {isPositive ? `+${m.qty}` : m.qty}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>
                        {m.bin_code}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--accent-color)' }}>
                        {m.ref_doc}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                        {formatIDR(m.unit_cost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}      {/* ========================================================================= */}
      {/* SUBTAB 4: OPERATIONS (TRANSFER, ADJUSTMENT & STOCK OPNAME) */}
      {/* ========================================================================= */}
      {subTab === 'operations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Notifications */}
          {transferNotice && (
            <div id="transfer-success-banner" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>
              ✓ {transferNotice}
            </div>
          )}
          {adjNotice && (
            <div id="adj-success-banner" style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>
              ✓ {adjNotice}
            </div>
          )}
          {opnameNotice && (
            <div id="opname-success-banner" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>
              ✓ {opnameNotice}
            </div>
          )}

          {/* Action Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Transfer Card */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.15rem', fontWeight: '700' }}>
                    {isId ? 'Transfer Stok Antar-Bin / Gudang' : 'Stock Transfer Between Bins'}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Posting transaksi atomik: 1 pasang TRF_OUT (-) dan TRF_IN (+).
                  </p>
                </div>
                <button
                  id="btn-create-transfer"
                  onClick={() => setShowTransferModal(true)}
                  style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  + Buat Transfer
                </button>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Alur Status: <strong>DRAFT → PENDING → APPROVED → IN_TRANSIT → RECEIVED → CLOSED</strong>
              </div>
            </div>

            {/* Adjustment Card */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.15rem', fontWeight: '700' }}>
                    {isId ? 'Penyesuaian Stok (Quantity Adjustment)' : 'Quantity Adjustment'}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Koreksi ad-hoc: barang rusak, hilang, atau ditemukan (Segregation of Duties).
                  </p>
                </div>
                <button
                  id="btn-create-adjustment"
                  onClick={() => setShowAdjModal(true)}
                  style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  + Koreksi Stok
                </button>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Alur Status: <strong>DRAFT → PENDING_APPROVAL → APPROVED → POSTED</strong>
              </div>
            </div>
          </div>

          {/* Stock Opname Section (Flow #6) */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.15rem', fontWeight: '700' }}>
                    Sesi Stock Opname Fisik ({opnameSession.session_no})
                  </h3>
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                    backgroundColor: opnameSession.status === 'POSTED' ? '#ecfdf5' : '#fef3c7',
                    color: opnameSession.status === 'POSTED' ? '#047857' : '#b45309'
                  }}>
                    {opnameSession.status}
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Lokasi: {opnameSession.warehouse} · Zona: {opnameSession.zone} · Metode: Blind Count dengan Rekonsiliasi Otomatis
                </p>
              </div>
              <div>
                {opnameSession.status !== 'POSTED' ? (
                  <button
                    id="btn-post-opname"
                    onClick={handlePostOpname}
                    style={{ backgroundColor: '#047857', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Posting Variance ke Ledger
                  </button>
                ) : (
                  <span style={{ color: '#047857', fontWeight: '700', fontSize: '0.85rem' }}>
                    ✓ Hasil Opname Selesai Diposting (CLOSED)
                  </span>
                )}
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>SKU & Nama Komponen</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Saldo Sistem</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Hitung Fisik (Counted)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Selisih (Variance)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Tindakan Ledger</th>
                  </tr>
                </thead>
                <tbody>
                  {opnameSession.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                        <div>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.sku}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{item.system_qty} Unit</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>{item.counted_qty} Unit</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: item.variance === 0 ? '#047857' : '#dc2626' }}>
                        {item.variance === 0 ? '0 (Sesuai)' : `${item.variance} Unit`}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.variance === 0 ? 'Saldo Akurat' : opnameSession.status === 'POSTED' ? 'OPN_OUT Diposting (-1)' : 'Menunggu Posting'}
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
      {/* SUBTAB 5: AGING & OBSOLESCENCE */}
      {/* ========================================================================= */}
      {subTab === 'aging' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
            {[
              { bucket: '0–30 Hari', label: 'Fresh Stock', count: 'Rp 142.500.000', color: '#047857' },
              { bucket: '31–60 Hari', label: 'Normal Turnover', count: 'Rp 65.000.000', color: '#0284c7' },
              { bucket: '61–90 Hari', label: 'Slow Down', count: 'Rp 28.400.000', color: '#eab308' },
              { bucket: '91–180 Hari', label: 'At Risk', count: 'Rp 12.800.000', color: '#f97316' },
              { bucket: '>180 Hari', label: 'Dead Stock / Obsolescence', count: 'Rp 4.500.000', color: '#dc2626' }
            ].map(b => (
              <div key={b.bucket} style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: b.color }}>{b.bucket}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '0.25rem' }}>{b.count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.label}</div>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontWeight: '700', color: 'var(--primary-color)' }}>
              Rekomendasi Otomatis Barang Lambat Terjual (Slow Moving)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #fde68a' }}>
                <div>
                  <strong>DeepCool CC560 V2 Mid-Tower ATX Case</strong> (Umur Stok: 112 Hari tanpa penjualan)
                  <div style={{ fontSize: '0.8rem', color: '#92400e' }}>Stok: 25 pcs · Nilai Tertahan: Rp 18.750.000</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{ padding: '0.35rem 0.75rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#d97706', color: '#ffffff', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer' }}>
                    Bundling ke BOM PC
                  </button>
                  <button style={{ padding: '0.35rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #d97706', backgroundColor: 'transparent', color: '#92400e', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer' }}>
                    Promo Diskon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 6: RMA & DEFECTIVE */}
      {/* ========================================================================= */}
      {subTab === 'rma' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '0.75rem', color: '#991b1b', fontSize: '0.85rem' }}>
            <strong>Prinsip Penting:</strong> Barang RMA / Defective <strong>TIDAK PERNAH</strong> masuk ke saldo stok siap jual. Unit disimpan secara terisolasi di <strong>Zone RMA (RMA-HOLD-01)</strong> sampai selesai inspeksi teknis.
          </div>

          {rmaNotice && (
            <div id="rma-success-banner" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>
              ✓ {rmaNotice}
            </div>
          )}

          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontWeight: '700', color: 'var(--primary-color)' }}>
              Kasus RMA Aktif
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {rmaCases.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ 
                      backgroundColor: c.status === 'SERVICE_TICKET_CREATED' ? '#eff6ff' : c.status === 'RETURNED_VENDOR' ? '#fef3c7' : '#fee2e2', 
                      color: c.status === 'SERVICE_TICKET_CREATED' ? '#1d4ed8' : c.status === 'RETURNED_VENDOR' ? '#b45309' : '#991b1b', 
                      fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' 
                    }}>
                      {c.type} · {c.status}
                    </span>
                    <div style={{ fontWeight: '700', marginTop: '0.35rem' }}>{c.rma_number} — {c.product_name} ({c.serial_no})</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Klien: {c.client_name} · Alasan: {c.reason}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {c.status === 'OPEN' ? (
                      <>
                        <button 
                          id={`btn-rma-service-${c.id}`}
                          onClick={() => handleSendToService(c.id)}
                          style={{ backgroundColor: '#047857', color: '#ffffff', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Kirim ke Servis (Tiket)
                        </button>
                        <button 
                          id={`btn-rma-rtv-${c.id}`}
                          onClick={() => handleReturnToVendor(c.id)}
                          style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Return ke Vendor (RTV)
                        </button>
                      </>
                    ) : (
                      <span style={{ color: '#047857', fontWeight: '700', fontSize: '0.8rem' }}>
                        ✓ {c.status === 'SERVICE_TICKET_CREATED' ? 'Dialihkan ke Servis Garansi' : 'RTV Out Diposting'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER STOK */}
      {showTransferModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '480px', maxWidth: '90%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Buat Transfer Antar-Bin</h3>
            <form onSubmit={handleExecuteTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Produk</label>
                <select 
                  value={newTransfer.product_sku} 
                  onChange={e => setNewTransfer({ ...newTransfer, product_sku: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                >
                  {products.map(p => <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Dari Bin Asal</label>
                  <select 
                    value={newTransfer.from_bin} 
                    onChange={e => setNewTransfer({ ...newTransfer, from_bin: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    {bins.map(b => <option key={b.id} value={b.code}>{b.code}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Ke Bin Tujuan</label>
                  <select 
                    value={newTransfer.to_bin} 
                    onChange={e => setNewTransfer({ ...newTransfer, to_bin: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    {bins.map(b => <option key={b.id} value={b.code}>{b.code}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Jumlah Unit Dipindahkan</label>
                <input 
                  type="number" required min="1" 
                  value={newTransfer.qty} 
                  onChange={e => setNewTransfer({ ...newTransfer, qty: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowTransferModal(false)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', backgroundColor: 'transparent', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.375rem', backgroundColor: 'var(--accent-color)', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Posting Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KOREKSI / ADJUSTMENT */}
      {showAdjModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '480px', maxWidth: '90%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Buat Koreksi Stok Ad-Hoc</h3>
            <form onSubmit={handleExecuteAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Produk</label>
                <select 
                  value={newAdj.product_sku} 
                  onChange={e => setNewAdj({ ...newAdj, product_sku: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                >
                  {products.map(p => <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Alasan Koreksi</label>
                  <select 
                    value={newAdj.reason} 
                    onChange={e => setNewAdj({ ...newAdj, reason: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    <option value="damage">Barang Rusak (Damage)</option>
                    <option value="loss">Barang Hilang (Loss)</option>
                    <option value="found">Barang Ditemukan (Found)</option>
                    <option value="correction">Koreksi Salah Hitung</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Qty Selisih (+ / -)</label>
                  <input 
                    type="number" required 
                    value={newAdj.qty} 
                    onChange={e => setNewAdj({ ...newAdj, qty: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Catatan / Bukti Audit</label>
                <input 
                  type="text" required 
                  value={newAdj.note} 
                  onChange={e => setNewAdj({ ...newAdj, note: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAdjModal(false)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', backgroundColor: 'transparent', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#d97706', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Posting Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
