import { useState } from 'react';
import { 
  Cpu, Wrench, Layers, Plus, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { initialBOM, initialAssemblyOrders, initialProducts } from '../../data/v2Data';

const generateAssemblySerial = () => `SN-ARES-PC-${Math.floor(1000 + Math.random() * 9000)}`;

export default function AssemblyBOMV2({ session, language }) {
  const [activeTab, setActiveTab] = useState('boms'); // 'boms' | 'orders' | 'simulator' | 'debundle'
  const [bom] = useState(initialBOM);
  const [orders, setOrders] = useState(initialAssemblyOrders);
  const [products] = useState(initialProducts);

  // Simulation state
  const [simQty, setSimQty] = useState(5);

  // New Order State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newOrderQty, setNewOrderQty] = useState(1);

  const isId = language === 'id';
  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  // Calculate BOM costs
  const materialCost = bom.components.reduce((acc, c) => acc + (c.cost * c.qty), 0);
  const totalUnitHPP = materialCost + bom.labor_cost + bom.overhead_cost;

  // Assembly Simulator calculation
  const simulationResults = bom.components.map(c => {
    const prod = products.find(p => p.sku === c.sku);
    const available = prod ? prod.stock : 0;
    const required = c.qty * simQty;
    const isSufficient = available >= required;
    return {
      ...c,
      available,
      required,
      isSufficient,
      deficit: Math.max(0, required - available)
    };
  });

  const canBuildAll = simulationResults.every(r => r.isSufficient);

  // Handle Execute Assembly Order
  const handleCreateOrder = (e) => {
    e.preventDefault();
    const newOrd = {
      id: `asm-${Date.now()}`,
      assembly_number: `ASM-ORD-2026-${String(orders.length + 1).padStart(3, '0')}`,
      product_name: bom.product_name,
      sku: bom.output_sku,
      qty_to_build: Number(newOrderQty),
      status: 'ISSUED',
      target_bin: 'PB-A-1-01',
      created_by: session?.user?.email || 'Bambang Assembly',
      completed_at: null,
      serial_generated: null,
      total_cost: totalUnitHPP * Number(newOrderQty)
    };
    setOrders([newOrd, ...orders]);
    setShowOrderModal(false);
  };

  // Complete Order
  const handleCompleteOrder = (orderId) => {
    const genSerial = generateAssemblySerial();
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'COMPLETED',
          completed_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
          serial_generated: genSerial
        };
      }
      return o;
    }));
    alert(isId ? `Perakitan selesai! Unit masuk ke zona Prebuilt dengan Serial Number: ${genSerial}` : `Assembly completed! Output unit received in Prebuilt zone with SN: ${genSerial}`);
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
            <Wrench size={18} /> MODUL 4 — BILL OF MATERIALS (BOM) & ASSEMBLY ENGINE
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)', margin: '0.25rem 0 0 0' }}>
            {isId ? 'Perakitan Komputer (Prebuilt) & Kanibalisasi (De-bundling)' : 'PC Assembly (Bundling) & De-bundling Engine'}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isId 
              ? 'Kelola resep BOM, simulasi ketersediaan komponen, issue ASM_OUT dari Spare Parts → terima ASM_IN di Prebuilt.' 
              : 'Manage BOM recipes, component availability simulator, issue ASM_OUT from Spare Parts → receive ASM_IN in Prebuilt.'}
          </p>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
          {[
            { id: 'boms', label: isId ? 'Resep BOM' : 'BOM Recipes', icon: Layers },
            { id: 'orders', label: isId ? 'Perintah Perakitan (Orders)' : 'Assembly Orders', icon: Wrench },
            { id: 'simulator', label: isId ? 'Simulasi Ketersediaan' : 'Build Simulator', icon: Cpu },
            { id: 'debundle', label: isId ? 'De-bundling (Kanibalan)' : 'De-bundling', icon: RefreshCw }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BOM RECIPES */}
      {/* ========================================================================= */}
      {activeTab === 'boms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Active BOM Card */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ backgroundColor: '#e0f2fe', color: 'var(--accent-color)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                  VERSI {bom.version} (AKTIF)
                </span>
                <h3 style={{ margin: '0.4rem 0 0 0', color: 'var(--primary-color)', fontSize: '1.25rem', fontWeight: '800' }}>
                  {bom.product_name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Output SKU: <strong>{bom.output_sku}</strong> · Kategori Rak: <strong>Prebuilt (PB-A-1-01)</strong></div>
              </div>

              {/* Total Roll-up Cost */}
              <div style={{ textAlign: 'right', backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Roll-Up HPP per Unit</div>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#047857' }}>{formatIDR(totalUnitHPP)}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Material: {formatIDR(materialCost)} + Biaya Rakit: {formatIDR(bom.labor_cost + bom.overhead_cost)}</div>
              </div>
            </div>

            {/* Components Table */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                Daftar Komponen Spare Parts yang Dibutuhkan:
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>SKU Komponen</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Nama Komponen</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Jumlah (Qty)</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Serial Tracked?</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Biaya Komponen</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {bom.components.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary-color)' }}>{c.sku}</td>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: '600' }}>{c.name}</td>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: '700' }}>{c.qty} pcs</td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        {c.is_serial ? (
                          <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.7rem', fontWeight: '700', padding: '0.15rem 0.4rem', borderRadius: '0.2rem' }}>
                            Wajib SN Spesifik
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Non-serial</span>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>{formatIDR(c.cost)}</td>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: '700', color: 'var(--primary-color)' }}>{formatIDR(c.cost * c.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ASSEMBLY ORDERS */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                Perintah Perakitan Fisik (Assembly Work Orders)
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Alur: DRAFT → PLANNED → ISSUED (ASM_OUT) → COMPLETED (ASM_IN + Generate SN)
              </p>
            </div>
            <button
              onClick={() => setShowOrderModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--accent-color)', color: '#ffffff', border: 'none', padding: '0.55rem 1rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <Plus size={16} /> Buat Assembly Order Baru
            </button>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>No. Assembly</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Produk Target</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Jumlah Dirakit</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Target Bin Gudang</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Serial Number Hasil</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary-color)' }}>
                      {o.assembly_number}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: '600' }}>{o.product_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.sku}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>
                      {o.qty_to_build} Unit
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>
                      {o.target_bin}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                        backgroundColor: o.status === 'COMPLETED' ? '#ecfdf5' : '#fef3c7',
                        color: o.status === 'COMPLETED' ? '#047857' : '#b45309'
                      }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--accent-color)' }}>
                      {o.serial_generated || (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>Pending perakitan</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {o.status === 'ISSUED' && (
                        <button
                          onClick={() => handleCompleteOrder(o.id)}
                          style={{ backgroundColor: '#047857', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Selesaikan & Terbitkan SN
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
      {/* TAB 3: BUILD SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.15rem', fontWeight: '700' }}>
                Simulasi Ketersediaan Komponen (Stock Availability Check)
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Uji apakah stok spare parts saat ini mencukupi untuk merakit sejumlah PC Prebuilt.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Target Jumlah Rakit:</span>
              <input
                type="number" min="1" max="100"
                value={simQty} onChange={e => setSimQty(Math.max(1, Number(e.target.value)))}
                style={{ width: '80px', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '1rem', fontWeight: '700', textAlign: 'center' }}
              />
              <span style={{ fontWeight: '700' }}>Unit</span>
            </div>
          </div>

          {/* Result Banner */}
          <div style={{ 
            backgroundColor: canBuildAll ? '#ecfdf5' : '#fee2e2',
            border: `1px solid ${canBuildAll ? '#a7f3d0' : '#fca5a5'}`,
            padding: '1rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}>
            {canBuildAll ? <CheckCircle2 size={24} color="#047857" /> : <AlertTriangle size={24} color="#991b1b" />}
            <div>
              <div style={{ fontWeight: '800', color: canBuildAll ? '#047857' : '#991b1b', fontSize: '1rem' }}>
                {canBuildAll 
                  ? `Stok Cukup! Anda dapat merakit ${simQty} unit ${bom.product_name}.` 
                  : `Stok Tidak Cukup untuk ${simQty} unit! Terdapat komponen yang kurang.`}
              </div>
              <div style={{ fontSize: '0.8rem', color: canBuildAll ? '#065f46' : '#7f1d1d' }}>
                {canBuildAll 
                  ? 'Semua komponen tersedia di zona Spare Parts. Anda dapat langsung menerbitkan Assembly Order.' 
                  : 'Sistem dapat secara otomatis membuatkan Purchase Requisition (PR) ke supplier untuk kekurangan komponen ini.'}
              </div>
            </div>
          </div>

          {/* Component Check Table */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Komponen</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Kebutuhan per Unit</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Dibutuhkan ({simQty}x)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Stok Tersedia (Available)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status Kelayakan</th>
                </tr>
              </thead>
              <tbody>
                {simulationResults.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{r.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.sku}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{r.qty} pcs</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>{r.required} pcs</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: r.available < r.required ? '#dc2626' : '#047857' }}>
                      {r.available} pcs
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {r.isSufficient ? (
                        <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                          ✓ CUKUP
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                          ✕ KURANG {r.deficit} PCS
                        </span>
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
      {/* TAB 4: DE-BUNDLING (DISASSEMBLY) */}
      {/* ========================================================================= */}
      {activeTab === 'debundle' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.2rem', fontWeight: '700' }}>
            De-bundling / Kanibalisasi PC Prebuilt
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Fitur de-bundling digunakan saat unit PC Prebuilt yang tidak laku atau unit retur dibongkar kembali menjadi komponen suku cadang individu. Sistem akan memposting <strong>ASM_OUT (-)</strong> pada Prebuilt dan <strong>ASM_IN (+)</strong> ke masing-masing bin Spare Parts.
          </p>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>Pilih Unit Prebuilt untuk Dibongkar:</div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', minWidth: '320px' }}>
                <option>MOAI Ares Elite Gaming PC (SN-ARES-PC-001) · PB-A-1-01</option>
              </select>
              <button 
                onClick={() => alert(isId ? 'Unit Prebuilt berhasil dibongkar! 7 komponen spare parts dikembalikan ke rak SP-* dengan movement ASM_IN.' : 'Unit disassembled! Components returned to SP rack with ASM_IN movements.')}
                style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Eksekusi De-bundling (Bongkar Komponen)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW ASSEMBLY ORDER */}
      {showOrderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '480px', maxWidth: '90%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Buat Perintah Perakitan (Assembly Order)</h3>
            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Produk Target Hasil Rakitan</label>
                <input type="text" disabled value={`${bom.product_name} (${bom.output_sku})`} style={{ width: '100%', padding: '0.45rem', backgroundColor: '#f1f5f9', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Jumlah Unit yang Dirakit</label>
                <input type="number" required min="1" max="50" value={newOrderQty} onChange={e => setNewOrderQty(e.target.value)} style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Bin Target Output (Zona Prebuilt)</label>
                <input type="text" disabled value="PB-A-1-01 (Zona Prebuilt)" style={{ width: '100%', padding: '0.45rem', backgroundColor: '#f1f5f9', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontSize: '0.85rem' }} />
              </div>

              <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem', color: '#1e40af' }}>
                Total Estimasi HPP Perakitan: <strong>{formatIDR(totalUnitHPP * newOrderQty)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowOrderModal(false)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', backgroundColor: 'transparent', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.375rem', backgroundColor: 'var(--accent-color)', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Terbitkan Perintah Rakit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
