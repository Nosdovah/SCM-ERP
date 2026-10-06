import { useState, useEffect } from 'react';
import { 
  ShoppingCart, Truck, ShieldCheck, AlertTriangle, DollarSign, 
  RotateCcw, Plus, CheckCircle2
} from 'lucide-react';
import { 
  initialPurchaseOrders, initialRequisitions, initialGRNList, 
  initialInboundReturns, initialApBills 
} from '../../data/v2Data';
import { apiService } from '../../services/apiService';

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
  const [tab, setTab] = useState('orders'); // 'orders' | 'reorder' | 'grn_qc' | 'inbound_return' | 'price_compare'
  
  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('moai_v2_pos');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load purchase orders', e);
    }
    return initialPurchaseOrders;
  });

  const [requisitions, setRequisitions] = useState(() => {
    try {
      const saved = localStorage.getItem('moai_v2_requisitions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load requisitions', e);
    }
    return initialRequisitions;
  });

  const [grnList, setGrnList] = useState(() => {
    try {
      const saved = localStorage.getItem('moai_v2_grn');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load GRN list', e);
    }
    return initialGRNList;
  });

  // Flow #11 Inbound Return state
  const [inboundReturns, setInboundReturns] = useState(() => {
    try {
      const saved = localStorage.getItem('moai_v2_inbound_returns');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load inbound returns', e);
    }
    return initialInboundReturns;
  });

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  // Form states
  const [showNewPOModal, setShowNewPOModal] = useState(false);
  const [poSuccessBanner, setPoSuccessBanner] = useState(null);
  const [newPoForm, setNewPoForm] = useState({
    supplier_name: '',
    sku: '',
    qty: 1,
    unit_price: 0,
    currency: 'IDR',
    exchange_rate: 1,
    expected_date: ''
  });

  // Inbound Return Form state
  const [returnSuccessBanner, setReturnSuccessBanner] = useState(null);
  const [newReturnForm, setNewReturnForm] = useState({
    po_reference: '',
    supplier_name: '',
    item_name: '',
    qty: 1,
    reason: '',
    refund_amount: 0
  });

  // Inbound QC modal
  const [showQCModal, setShowQCModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [qcForm, setQcForm] = useState({ 
    serialsScanned: '', 
    passCount: 0, 
    failCount: 0, 
    note: '' 
  });

  const isId = language === 'id';
  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  // REST API Mount Fetch
  useEffect(() => {
    apiService.scm.getPurchaseOrders().then(data => {
      if (data && Array.isArray(data)) {
        setPurchaseOrders(data);
        try { localStorage.setItem('moai_v2_pos', JSON.stringify(data)); } catch (err) { console.debug(err); }
      }
    });
    apiService.scm.getRequisitions().then(data => {
      if (data && Array.isArray(data)) {
        setRequisitions(data);
        try { localStorage.setItem('moai_v2_requisitions', JSON.stringify(data)); } catch (err) { console.debug(err); }
      }
    });
    apiService.scm.getGoodsReceipts().then(data => {
      if (data && Array.isArray(data)) {
        setGrnList(data);
        try { localStorage.setItem('moai_v2_grn', JSON.stringify(data)); } catch (err) { console.debug(err); }
      }
    });
    apiService.scm.getRTV().then(data => {
      if (data && Array.isArray(data)) {
        setInboundReturns(data);
        try { localStorage.setItem('moai_v2_inbound_returns', JSON.stringify(data)); } catch (err) { console.debug(err); }
      }
    });
    apiService.masterData.getSuppliers().then(data => {
      if (data && Array.isArray(data)) setSuppliers(data);
    });
    apiService.masterData.getProducts().then(data => {
      if (data && Array.isArray(data)) setProducts(data);
    });
  }, []);

  // Flow #13: Handle Create New PO
  const handleCreatePO = (e) => {
    e.preventDefault();
    const qty = Number(newPoForm.qty) || 1;
    const unitPrice = Number(newPoForm.unit_price) || 0;
    const total = qty * unitPrice;
    const nextNumber = String(purchaseOrders.length + 44).padStart(4, '0');
    const poNum = `PO-2026-${nextNumber}`;

    const foundProd = products.find(p => p.sku === newPoForm.sku);
    const prodName = foundProd ? foundProd.name : newPoForm.sku;

    const newPO = {
      id: `po-${Date.now()}`,
      po_number: poNum,
      supplier_name: newPoForm.supplier_name,
      order_date: new Date().toISOString().substring(0, 10),
      expected_date: newPoForm.expected_date,
      status: 'APPROVED',
      currency: newPoForm.currency,
      exchange_rate: newPoForm.currency === 'USD' ? Number(newPoForm.exchange_rate) : 1,
      total: total,
      items_count: qty,
      item_name: prodName
    };

    const updatedPOs = [newPO, ...purchaseOrders];
    setPurchaseOrders(updatedPOs);
    apiService.scm.createPurchaseOrder(newPO);

    // Auto-create corresponding Goods Receipt Note (GRN) in PENDING_QC status
    const grnNum = `GRN-2026-${nextNumber}`;
    const newGRN = {
      id: `grn-${Date.now()}`,
      gr_number: grnNum,
      po_number: poNum,
      supplier_name: newPO.supplier_name,
      description: `${qty} Unit ${prodName}`,
      status: 'PENDING_QC',
      bin_code: 'QC-IN-01',
      received_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    const updatedGRNs = [newGRN, ...grnList];
    setGrnList(updatedGRNs);

    try {
      localStorage.setItem('moai_v2_pos', JSON.stringify(updatedPOs));
      localStorage.setItem('moai_v2_grn', JSON.stringify(updatedGRNs));
    } catch (err) {
      console.error('Failed to save PO/GRN to localStorage', err);
    }

    setPoSuccessBanner(
      isId
        ? `Purchase Order ${poNum} diterbitkan untuk ${newPO.supplier_name}! Draft Penerimaan ${grnNum} otomatis terdaftar di Gerbang QC.`
        : `Purchase Order ${poNum} issued for ${newPO.supplier_name}! Receiving ${grnNum} registered in QC Gate.`
    );
    setShowNewPOModal(false);
  };

  // 1-Click Convert PR to PO
  const handleConvertPR = (prId) => {
    const pr = requisitions.find(r => r.id === prId);
    if (!pr) return;

    const newPO = createPurchaseOrderFromPR(pr);
    const updatedPOs = [newPO, ...purchaseOrders];
    const updatedPRs = requisitions.map(r => r.id === prId ? { ...r, status: 'CONVERTED' } : r);

    setPurchaseOrders(updatedPOs);
    setRequisitions(updatedPRs);
    apiService.scm.convertRequisition(prId);
    try {
      localStorage.setItem('moai_v2_pos', JSON.stringify(updatedPOs));
      localStorage.setItem('moai_v2_requisitions', JSON.stringify(updatedPRs));
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
    setPoSuccessBanner(isId ? `Purchase Requisition berhasil dikonversi menjadi Purchase Order: ${newPO.po_number}!` : `PR converted to PO: ${newPO.po_number}!`);
  };

  const handleExecuteQC = (e) => {
    e.preventDefault();
    const targetPO = selectedPO || purchaseOrders[0];
    const updatedPOs = purchaseOrders.map(p => p.id === targetPO?.id ? { ...p, status: 'FULL' } : p);
    const updatedGRNs = grnList.map(g => g.po_number === targetPO?.po_number || g.gr_number === 'GRN-2026-0043' ? { ...g, status: 'QC_RELEASED' } : g);

    setPurchaseOrders(updatedPOs);
    setGrnList(updatedGRNs);
    apiService.scm.qcAction(targetPO?.po_number || 'PO-2026-0043', { action: 'PASS', target_bin: 'SP-CPU-A-01' });
    try {
      localStorage.setItem('moai_v2_pos', JSON.stringify(updatedPOs));
      localStorage.setItem('moai_v2_grn', JSON.stringify(updatedGRNs));
    } catch (err) {
      console.error('Failed to save QC state to localStorage', err);
    }

    setShowQCModal(false);
    alert(isId ? `QC Inspection lolos! Unit dipindahkan dari zona QUARANTINE ke rak kategori via movement QC_RELEASE.` : `QC passed! Goods put away to category rack via QC_RELEASE.`);
  };

  // Flow #11 Inbound Return Handlers
  const handleCreateInboundReturn = (e) => {
    e.preventDefault();
    const nextRetNum = `RET-IN-2026-${String(inboundReturns.length + 1).padStart(3, '0')}`;
    const newRet = {
      id: `ret-in-${Date.now()}`,
      ret_number: nextRetNum,
      po_reference: newReturnForm.po_reference,
      supplier_name: newReturnForm.supplier_name,
      item_name: newReturnForm.item_name,
      qty: Number(newReturnForm.qty) || 1,
      reason: newReturnForm.reason,
      status: 'DRAFT',
      shipped_at: null,
      refund_amount: Number(newReturnForm.refund_amount) || 0,
      credit_note_no: null
    };

    const updated = [newRet, ...inboundReturns];
    setInboundReturns(updated);
    apiService.scm.createRTV(newRet);
    try {
      localStorage.setItem('moai_v2_inbound_returns', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save inbound return', err);
    }

    setReturnSuccessBanner(
      isId
        ? `Draft Retur Pembelian ${nextRetNum} berhasil dibuat! Siap dikirimkan kembali ke supplier.`
        : `Inbound Return ${nextRetNum} draft created! Ready to ship back to supplier.`
    );
  };

  const handleShipInboundReturn = (retId) => {
    const updated = inboundReturns.map(r => {
      if (r.id === retId) {
        return {
          ...r,
          status: 'SHIPPED',
          shipped_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
          credit_note_no: `CN-VEND-${Math.floor(100 + Math.random() * 900)}`
        };
      }
      return r;
    });

    setInboundReturns(updated);
    try {
      localStorage.setItem('moai_v2_inbound_returns', JSON.stringify(updated));
      // Optionally reduce AP Bill in Finance
      const rawAp = localStorage.getItem('moai_v2_ap_bills');
      const apBills = rawAp ? JSON.parse(rawAp) : initialApBills;
      const targetRet = inboundReturns.find(r => r.id === retId);
      if (targetRet && apBills.length > 0) {
        const updatedAp = apBills.map(b => ({
          ...b,
          amount: Math.max(0, b.amount - (targetRet.refund_amount || 0))
        }));
        localStorage.setItem('moai_v2_ap_bills', JSON.stringify(updatedAp));
      }
    } catch (err) {
      console.error('Failed to post return shipment', err);
    }

    setReturnSuccessBanner(
      isId
        ? `Retur Pembelian dikirim ke supplier! Movement RET_OUT (-) diposting dan Credit Note pemotong utang AP telah diterbitkan.`
        : `Inbound Return shipped! Movement RET_OUT (-) posted and AP credit note issued.`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner (Modul 2) */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        backgroundColor: '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '0.75rem',
        border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontWeight: '700', fontSize: '0.875rem' }}>
            <Truck size={18} /> MODUL 2 — SUPPLY CHAIN MANAGEMENT (SCM) & INBOUND
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)', margin: '0.25rem 0 0 0' }}>
            {isId ? 'Pengadaan Komponen, Inbound Receiving & Gerbang QC' : 'Procurement, Inbound Receiving & QC Gate'}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isId 
              ? 'Saran reorder otomatis (PR), PO intake, capture serial saat receiving, inspeksi karantina QC, dan retur supplier (Flow #11).' 
              : 'Automated reorder point PR, PO intake, serial capture at receiving, quarantine QC gate, and inbound returns (Flow #11).'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
          {[
            { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
            { id: 'reorder', label: isId ? 'Saran Reorder (PR)' : 'Auto Reorder', icon: AlertTriangle },
            { id: 'grn_qc', label: 'Receiving & QC Gate', icon: ShieldCheck },
            { id: 'inbound_return', label: isId ? 'Retur Pembelian (Flow #11)' : 'Inbound Return', icon: RotateCcw },
            { id: 'price_compare', label: isId ? 'Banding Harga Supplier' : 'Price Comparison', icon: DollarSign }
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                id={`tab-scm-${t.id}`}
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
      {/* TAB 1: PURCHASE ORDERS (PO INTAKE - FLOW #13) */}
      {/* ========================================================================= */}
      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '0.85rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-color)' }}>
                {isId ? 'Daftar Pesanan Pembelian (Purchase Orders)' : 'Purchase Orders List'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isId ? 'Flow #13: PO Intake multi-currency dan integrasi otomatis ke GRN' : 'Flow #13: Multi-currency PO intake & auto GRN generation'}
              </span>
            </div>
            <button
              id="btn-create-po"
              onClick={() => setShowNewPOModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: 'var(--accent-color)', color: '#ffffff',
                border: 'none', padding: '0.55rem 1.15rem', borderRadius: '0.5rem',
                fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              <Plus size={16} /> {isId ? '+ Buat PO Baru' : '+ Create New PO'}
            </button>
          </div>

          {poSuccessBanner && (
            <div id="po-success-banner" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.85rem 1.25rem', borderRadius: '0.5rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
              <CheckCircle2 size={18} />
              <span>{poSuccessBanner}</span>
            </div>
          )}

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
                  <tr key={po.id} id={`po-row-${po.po_number}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary-color)' }}>
                      {po.po_number}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                      {po.supplier_name}
                      {po.item_name && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                          {po.items_count}x {po.item_name}
                        </div>
                      )}
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
                          id={`btn-receive-po-${po.po_number}`}
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
            <strong>Deteksi Reorder Point Otomatis:</strong> Sistem secara proaktif memantau stok komponen fast-moving. Ketika level stok mencapai ambang batas safety stock, saran Purchase Requisition (PR) dibuat otomatis dan dapat dikonversi ke PO dalam 1 klik.
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
              Daftar Barang Masuk & Status Inspeksi QC (Inbound Receiving)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {grnList.map(grn => {
                const isPassed = grn.status === 'QC_RELEASED';
                return (
                  <div key={grn.id} id={`grn-card-${grn.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: isPassed ? '#f0fdf4' : '#f8fafc', borderRadius: '0.5rem', border: `1px solid ${isPassed ? '#bbf7d0' : '#e2e8f0'}` }}>
                    <div>
                      <span style={{ backgroundColor: isPassed ? '#dcfce7' : '#fef3c7', color: isPassed ? '#166534' : '#92400e', fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
                        {isPassed ? 'LOLOS QC (RAK SP-CPU-A-01)' : 'ZONA KARANTINA (QC-IN-01)'}
                      </span>
                      <div style={{ fontWeight: '700', fontSize: '1.05rem', marginTop: '0.35rem' }}>{grn.gr_number} (Ref: {grn.po_number})</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pemasok: {grn.supplier_name} · {grn.description}</div>
                      {isPassed && (
                        <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600', marginTop: '0.25rem' }}>
                          ✓ Status: QC_RELEASED — Stok telah ditambahkan ke inventory utama & AP Bill telah terbit.
                        </div>
                      )}
                    </div>
                    <div>
                      {!isPassed ? (
                        <button
                          id="btn-start-qc"
                          onClick={() => { setSelectedPO(purchaseOrders[1] || purchaseOrders[0]); setShowQCModal(true); }}
                          style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          Mulai Inspeksi QC & Putaway
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#166534', padding: '0.4rem 0.8rem', backgroundColor: '#dcfce7', borderRadius: '0.375rem' }}>
                          Selesai Diproses
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RETUR PEMBELIAN / INBOUND RETURN (FLOW #11) */}
      {/* ========================================================================= */}
      {tab === 'inbound_return' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', padding: '1rem', borderRadius: '0.75rem', color: '#9f1239', fontSize: '0.85rem' }}>
            <strong>Alur Flow #11 (Inbound Return / RTV):</strong> Barang yang ditolak saat inspeksi QC Karantina dikembalikan langsung ke supplier pemasok. Pengiriman retur memicu movement <strong>RET_OUT (-)</strong> pada stock ledger dan penerbitan Credit Note pengurang saldo tagihan utang (AP Bill) di Finance.
          </div>

          {returnSuccessBanner && (
            <div id="inbound-return-success-banner" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.85rem 1.25rem', borderRadius: '0.5rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
              <CheckCircle2 size={18} />
              <span>{returnSuccessBanner}</span>
            </div>
          )}

          {/* Form Create Inbound Return */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontWeight: '700', color: 'var(--primary-color)' }}>
              {isId ? 'Terbitkan Retur Pembelian ke Supplier (Flow #11)' : 'Create Inbound Return Order'}
            </h4>
            <form onSubmit={handleCreateInboundReturn} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '0.85rem', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Referensi PO</label>
                <select
                  id="ret-po-ref"
                  value={newReturnForm.po_reference}
                  onChange={e => setNewReturnForm({ ...newReturnForm, po_reference: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                >
                  {purchaseOrders.map(p => (
                    <option key={p.id} value={p.po_number}>{p.po_number} ({p.supplier_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Pemasok (Supplier)</label>
                <input
                  id="ret-supplier"
                  type="text"
                  required
                  value={newReturnForm.supplier_name}
                  onChange={e => setNewReturnForm({ ...newReturnForm, supplier_name: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Alasan Retur / Cacat</label>
                <input
                  id="ret-reason"
                  type="text"
                  required
                  value={newReturnForm.reason}
                  onChange={e => setNewReturnForm({ ...newReturnForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                />
              </div>

              <button
                id="btn-create-inbound-return"
                type="submit"
                style={{ backgroundColor: '#be123c', color: '#ffffff', border: 'none', padding: '0.55rem 1rem', borderRadius: '0.375rem', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', height: 'fit-content' }}
              >
                + Buat Draft Retur
              </button>
            </form>
          </div>

          {/* Inbound Returns List */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '700', color: 'var(--primary-color)' }}>
              Daftar Retur Pembelian ke Supplier (Flow #11 Registry)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>No. Retur</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Ref PO</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Supplier</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Item & Cacat</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Nilai Pengembalian</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Aksi Kirim / Ledger</th>
                </tr>
              </thead>
              <tbody>
                {inboundReturns.map(ret => (
                  <tr key={ret.id} id={`ret-row-${ret.ret_number}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary-color)' }}>{ret.ret_number}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{ret.po_reference}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{ret.supplier_name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div>{ret.item_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#be123c' }}>{ret.reason}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>{formatIDR(ret.refund_amount)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                        backgroundColor: ret.status === 'SHIPPED' ? '#ecfdf5' : '#fef3c7',
                        color: ret.status === 'SHIPPED' ? '#047857' : '#b45309'
                      }}>
                        {ret.status}
                      </span>
                      {ret.credit_note_no && (
                        <div style={{ fontSize: '0.7rem', color: '#047857', marginTop: '0.2rem' }}>Ref: {ret.credit_note_no}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {ret.status === 'DRAFT' ? (
                        <button
                          id={`btn-ship-return-${ret.ret_number}`}
                          onClick={() => handleShipInboundReturn(ret.id)}
                          style={{ backgroundColor: '#047857', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Kirim ke Supplier & Catat RET_OUT (-)
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: '700' }}>
                          ✓ Dikirim ({ret.shipped_at})
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
      {/* TAB 5: MULTI-VENDOR PRICE COMPARISON */}
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

      {/* ========================================================================= */}
      {/* MODAL: BUAT PO BARU (FLOW #13 ORDER INTAKE) */}
      {/* ========================================================================= */}
      {showNewPOModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '540px', maxWidth: '90%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>
              {isId ? 'Buat Pesanan Pembelian Baru (Purchase Order)' : 'Create New Purchase Order'}
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isId ? 'Entri PO pengadaan komponen baru ke supplier (Flow #13).' : 'Supplier procurement PO intake to trigger inbound receiving.'}
            </p>

            <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Pemasok / Supplier</label>
                <select
                  id="po-supplier-select"
                  value={newPoForm.supplier_name}
                  onChange={e => setNewPoForm({ ...newPoForm, supplier_name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                >
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name} {s.country ? `(${s.country})` : ''}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Pilih Komponen / SKU</label>
                  <select
                    id="po-sku-select"
                    value={newPoForm.sku}
                    onChange={e => {
                      const selSku = e.target.value;
                      const prod = products.find(p => p.sku === selSku);
                      setNewPoForm({ 
                        ...newPoForm, 
                        sku: selSku, 
                        unit_price: prod ? (prod.cost_price || prod.unit_price) : newPoForm.unit_price 
                      });
                    }}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  >
                    <option value="">-- Pilih Komponen / SKU --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.sku}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Jumlah Qty</label>
                  <input
                    id="po-qty"
                    type="number"
                    min="1"
                    required
                    value={newPoForm.qty}
                    onChange={e => setNewPoForm({ ...newPoForm, qty: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Harga Beli Satuan</label>
                  <input
                    id="po-unit-price"
                    type="number"
                    required
                    value={newPoForm.unit_price}
                    onChange={e => setNewPoForm({ ...newPoForm, unit_price: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Estimasi Tiba</label>
                  <input
                    id="po-expected-date"
                    type="date"
                    required
                    value={newPoForm.expected_date}
                    onChange={e => setNewPoForm({ ...newPoForm, expected_date: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                Total Komitmen Beli: <strong>{formatIDR((Number(newPoForm.qty) || 1) * (Number(newPoForm.unit_price) || 0))}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowNewPOModal(false)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', backgroundColor: 'transparent', cursor: 'pointer' }}>Batal</button>
                <button id="btn-submit-po" type="submit" style={{ padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.375rem', backgroundColor: 'var(--accent-color)', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}>Terbitkan Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QC INSPECTION */}
      {/* ========================================================================= */}
      {showQCModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '520px', maxWidth: '90%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Inspeksi QC & Putaway ({selectedPO?.po_number || 'PO Inbound'})</h3>
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
                <button id="btn-confirm-qc" type="submit" style={{ padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#047857', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Konfirmasi QC & Putaway</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
