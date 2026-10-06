import { useState } from 'react';
import { 
  Database, Plus, Search, Box, Tag, Truck, Users, Barcode, MapPin
} from 'lucide-react';
import { 
  initialProducts, initialZones, 
  initialBins, initialBrands, initialSuppliers, initialClients 
} from '../../data/v2Data';

export default function MasterDataV2({ language }) {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'hierarchy' | 'brands' | 'suppliers' | 'clients'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('moai_v2_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load products from localStorage', e);
    }
    return initialProducts;
  });
  const [zones] = useState(initialZones);
  const [bins, setBins] = useState(initialBins);
  const [brands] = useState(initialBrands);
  const [suppliers] = useState(initialSuppliers);
  const [clients] = useState(initialClients);

  // Form Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBinModal, setShowBinModal] = useState(false);

  // New Product Form
  const [newProd, setNewProd] = useState({
    sku: '',
    barcode: '',
    name: '',
    category: 'Processor',
    item_type: 'SPARE_PART',
    brand: 'AMD',
    uom: 'PCS',
    unit_price: '',
    cost_price: '',
    stock: 10,
    is_serial: true,
    is_assembly: false,
    bin_code: 'SP-CPU-A-01'
  });

  // New Bin Form
  const [newBin, setNewBin] = useState({
    warehouse_id: 'wh-01',
    zone_id: 'zone-sp',
    rack: 'Rack-E',
    shelf: 'Shelf-1',
    level: '01',
    bin_type: 'storage',
    capacity: 100
  });

  const isId = language === 'id';

  // Format Currency
  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.barcode.includes(searchQuery);
    const matchesCat = categoryFilter === 'ALL' || p.item_type === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreateProduct = (e) => {
    e.preventDefault();
    const created = {
      ...newProd,
      id: `prod-${Date.now()}`,
      unit_price: Number(newProd.unit_price) || 0,
      cost_price: Number(newProd.cost_price) || 0,
      stock: Number(newProd.stock) || 0
    };
    const updated = [created, ...products];
    setProducts(updated);
    try {
      localStorage.setItem('moai_v2_products', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save products to localStorage', err);
    }
    setShowProductModal(false);
    setNewProd({
      sku: '', barcode: '', name: '', category: 'Processor', item_type: 'SPARE_PART',
      brand: 'AMD', uom: 'PCS', unit_price: '', cost_price: '', stock: 10,
      is_serial: true, is_assembly: false, bin_code: 'SP-CPU-A-01'
    });
  };

  const handleCreateBin = (e) => {
    e.preventDefault();
    const targetZone = zones.find(z => z.id === newBin.zone_id);
    const zonePrefix = targetZone ? targetZone.category.substring(0, 2) : 'ZN';
    const generatedCode = `${zonePrefix}-${newBin.rack.replace('Rack-', '')}-${newBin.shelf.replace('Shelf-', '')}-${newBin.level}`;
    const createdBin = {
      id: `bin-${Date.now()}`,
      ...newBin,
      code: generatedCode
    };
    setBins([...bins, createdBin]);
    setShowBinModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner / Breadcrumb */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        backgroundColor: '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '0.75rem',
        border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontWeight: '700', fontSize: '0.875rem' }}>
            <Database size={18} /> MODUL 5 — MASTER DATA
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)', margin: '0.25rem 0 0 0' }}>
            {isId ? 'Katalog Produk, Tata Letak Gudang & Entitas Bisnis' : 'Product Catalog, Warehouse Layout & Business Entities'}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isId ? 'Manajemen 3 kategori inventaris (Prebuilt, Barebone, Spare Parts), hierarki fisik bin/rak, brand, dan relasi mitra.' : 'Manage 3 physical inventory categories (Prebuilt, Barebone, Spare Parts), physical rack/bin hierarchy, brands, and partners.'}
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
          {[
            { id: 'products', label: isId ? 'Katalog Produk' : 'Products Catalog', icon: Box },
            { id: 'hierarchy', label: isId ? 'Hierarki Fisik Gudang' : 'Warehouse & Bins', icon: MapPin },
            { id: 'brands', label: 'Brands', icon: Tag },
            { id: 'suppliers', label: isId ? 'Pemasok (Suppliers)' : 'Suppliers', icon: Truck },
            { id: 'clients', label: isId ? 'Klien / Pelanggan' : 'Clients', icon: Users }
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
                  border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: active ? '700' : '500',
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

      {/* ========================================================================= */}
      {/* TAB 1: PRODUCTS CATALOG */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Sub Navigation & Filter */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.75rem',
            border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '300px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={isId ? 'Cari SKU, Barcode, atau Nama Produk...' : 'Search SKU, Barcode, or Product Name...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                    borderRadius: '0.5rem', border: '1px solid var(--border-color)',
                    fontSize: '0.875rem', outline: 'none'
                  }}
                />
              </div>

              {/* 3 Physical Category Pills */}
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {[
                  { id: 'ALL', label: isId ? 'Semua (11)' : 'All' },
                  { id: 'PREBUILT', label: 'Prebuilt (PC Jadi)', color: '#3b82f6' },
                  { id: 'BAREBONE', label: 'Barebone (Setengah Jadi)', color: '#8b5cf6' },
                  { id: 'SPARE_PART', label: 'Spare Parts (Komponen)', color: '#10b981' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    style={{
                      padding: '0.4rem 0.75rem', borderRadius: '2rem',
                      border: categoryFilter === cat.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                      backgroundColor: categoryFilter === cat.id ? '#e0f2fe' : '#ffffff',
                      color: categoryFilter === cat.id ? 'var(--accent-color)' : 'var(--text-main)',
                      fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowProductModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: 'var(--accent-color)', color: '#ffffff',
                border: 'none', padding: '0.55rem 1rem', borderRadius: '0.5rem',
                fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer'
              }}
            >
              <Plus size={16} /> {isId ? 'Tambah Produk Baru' : 'Add New Product'}
            </button>
          </div>

          {/* Product Table */}
          <div style={{ 
            backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>SKU / Barcode</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{isId ? 'Nama Produk' : 'Product Name'}</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Kategori Rak</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Brand</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Lokasi Bin</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Stok / Satuan</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>HPP / Harga Jual</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Karakteristik</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, idx) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{p.sku}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Barcode size={12} /> {p.barcode}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.category}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '0.375rem',
                        fontSize: '0.75rem', fontWeight: '700',
                        backgroundColor: p.item_type === 'PREBUILT' ? '#eff6ff' : p.item_type === 'BAREBONE' ? '#f5f3ff' : '#ecfdf5',
                        color: p.item_type === 'PREBUILT' ? '#1d4ed8' : p.item_type === 'BAREBONE' ? '#6d28d9' : '#047857'
                      }}>
                        {p.item_type}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{p.brand}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '600', backgroundColor: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>
                        {p.bin_code || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem', color: p.stock <= 5 ? '#dc2626' : 'var(--text-main)' }}>
                        {p.stock}
                      </span> {p.uom}
                      {p.stock <= 5 && <span style={{ marginLeft: '0.35rem', color: '#dc2626', fontSize: '0.7rem', fontWeight: '700' }}>(Low)</span>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: '700', color: '#047857' }}>{formatIDR(p.unit_price)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HPP: {formatIDR(p.cost_price)}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {p.is_serial && (
                          <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: '700' }}>
                            SN/IMEI
                          </span>
                        )}
                        {p.is_assembly && (
                          <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: '700' }}>
                            BOM Assembly
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WAREHOUSE & PHYSICAL BIN HIERARCHY */}
      {/* ========================================================================= */}
      {activeTab === 'hierarchy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Explanation Banner */}
          <div style={{ 
            backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem',
            padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1rem', fontWeight: '700' }}>
                {isId ? 'Struktur Tata Letak Fisik Berjenjang' : 'Tiered Physical Layout Structure'}
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#1d4ed8', fontSize: '0.85rem' }}>
                {isId 
                  ? 'Hierarki: Gudang → Zona Kategori (Prebuilt, Barebone, Spare Parts, Karantina, RMA) → Rack → Shelf → Bin (Slot Barcode).' 
                  : 'Hierarchy: Warehouse → Category Zone (Prebuilt, Barebone, Spare Parts, Quarantine, RMA) → Rack → Shelf → Bin.'}
              </p>
              <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#1e3a8a', backgroundColor: '#dbeafe', padding: '0.35rem 0.65rem', borderRadius: '0.375rem', display: 'inline-block' }}>
                Format Barcode: &#123;zone&#125;-&#123;rack&#125;-&#123;shelf&#125;-&#123;level&#125; (Contoh: PB-A-1-01, SP-RAM-B-02)
              </div>
            </div>
            <button
              onClick={() => setShowBinModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: 'var(--accent-color)', color: '#ffffff',
                border: 'none', padding: '0.55rem 1rem', borderRadius: '0.5rem',
                fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer'
              }}
            >
              <Plus size={16} /> {isId ? 'Tambah Slot Bin' : 'Add New Bin'}
            </button>
          </div>

          {/* Zones Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {zones.map(z => {
              const zoneBins = bins.filter(b => b.zone_id === z.id);
              const badgeColors = {
                PREBUILT: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
                BAREBONE: { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
                SPARE_PART: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
                QUARANTINE: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
                RMA: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
              }[z.category] || { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };

              return (
                <div key={z.id} style={{ 
                  backgroundColor: '#ffffff', borderRadius: '0.75rem',
                  border: `1px solid ${badgeColors.border}`, padding: '1.25rem',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ 
                        fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase',
                        backgroundColor: badgeColors.bg, color: badgeColors.text,
                        padding: '0.2rem 0.5rem', borderRadius: '0.375rem'
                      }}>
                        {z.category}
                      </span>
                      <h4 style={{ margin: '0.4rem 0 0 0', fontSize: '1.05rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                        {z.name}
                      </h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kode: {z.code}</div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '0.375rem' }}>
                      {zoneBins.length} Bins
                    </span>
                  </div>

                  {/* Bin Slots Pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {zoneBins.map(b => (
                      <div key={b.id} style={{ 
                        backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem',
                        padding: '0.4rem 0.6rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column'
                      }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary-color)' }}>
                          {b.code}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {b.rack} · {b.shelf} (Kapasitas: {b.capacity})
                        </div>
                      </div>
                    ))}
                    {zoneBins.length === 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {isId ? 'Belum ada bin di zona ini' : 'No bins configured'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BRANDS */}
      {/* ========================================================================= */}
      {activeTab === 'brands' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {brands.map(b => (
            <div key={b.id} style={{ 
              backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)',
              padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '0.5rem', backgroundColor: '#e0f2fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)',
                fontWeight: '800', fontSize: '1.1rem'
              }}>
                {b.code.substring(0, 2)}
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--primary-color)', fontSize: '1rem' }}>{b.name}</h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{b.description}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--accent-color)', marginTop: '0.25rem' }}>Kode Brand: {b.code}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUPPLIERS */}
      {/* ========================================================================= */}
      {activeTab === 'suppliers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {suppliers.map(s => (
            <div key={s.id} style={{ 
              backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)',
              padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ 
                    fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                    backgroundColor: s.is_principal ? '#fef3c7' : '#f1f5f9',
                    color: s.is_principal ? '#b45309' : '#475569'
                  }}>
                    {s.is_principal ? 'PRINCIPAL RESMI' : 'DISTRIBUTOR / VENDOR'}
                  </span>
                  <h4 style={{ margin: '0.4rem 0 0 0', fontWeight: '700', fontSize: '1.05rem', color: 'var(--primary-color)' }}>
                    {s.name}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kode: {s.code}</div>
                </div>
                <span style={{ fontWeight: '700', color: 'var(--accent-color)', fontSize: '0.85rem' }}>{s.currency}</span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div><strong>Kontak PIC:</strong> {s.contact} ({s.phone})</div>
                <div><strong>Email:</strong> {s.email}</div>
                <div><strong>Term of Payment:</strong> {s.payment_terms}</div>
              </div>

              {/* Performance Indicator */}
              <div style={{ 
                backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '0.5rem',
                border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between',
                fontSize: '0.75rem'
              }}>
                <div>Lead Time: <strong>{s.lead_time_days} hari</strong></div>
                <div>On-Time: <strong style={{ color: '#047857' }}>{s.on_time_rate}</strong></div>
                <div>Defect Rate: <strong style={{ color: '#b91c1c' }}>{s.defect_rate}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CLIENTS */}
      {/* ========================================================================= */}
      {activeTab === 'clients' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {clients.map(c => (
            <div key={c.id} style={{ 
              backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-color)',
              padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ 
                    fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
                    backgroundColor: c.segment === 'government' ? '#f5f3ff' : c.segment === 'corporate' ? '#eff6ff' : '#ecfdf5',
                    color: c.segment === 'government' ? '#6d28d9' : c.segment === 'corporate' ? '#1d4ed8' : '#047857',
                    padding: '0.2rem 0.5rem', borderRadius: '0.25rem'
                  }}>
                    {c.segment}
                  </span>
                  <h4 style={{ margin: '0.4rem 0 0 0', fontWeight: '700', fontSize: '1.05rem', color: 'var(--primary-color)' }}>
                    {c.name}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kode: {c.code}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div><strong>Kontak PIC:</strong> {c.contact} ({c.phone})</div>
                <div><strong>Email:</strong> {c.email}</div>
                <div><strong>Payment Terms:</strong> {c.payment_terms}</div>
              </div>

              {/* Credit Limit & Outstanding */}
              <div style={{ 
                backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '0.5rem',
                border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between',
                fontSize: '0.75rem'
              }}>
                <div>Credit Limit: <strong>{formatIDR(c.credit_limit)}</strong></div>
                <div>Outstanding: <strong style={{ color: c.outstanding > 0 ? '#b91c1c' : '#047857' }}>{formatIDR(c.outstanding)}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PRODUCT */}
      {/* ========================================================================= */}
      {showProductModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '560px',
            maxWidth: '90%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)', fontSize: '1.2rem', fontWeight: '700' }}>
              {isId ? 'Tambah Master Produk Komputer' : 'Add Computer Product'}
            </h3>
            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>SKU</label>
                  <input
                    type="text" required placeholder="Contoh: PB-GAMING-01"
                    value={newProd.sku} onChange={e => setNewProd({ ...newProd, sku: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Barcode / EAN</label>
                  <input
                    type="text" placeholder="899..."
                    value={newProd.barcode} onChange={e => setNewProd({ ...newProd, barcode: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>{isId ? 'Nama Lengkap Produk' : 'Full Product Name'}</label>
                <input
                  type="text" required placeholder="Contoh: AMD Ryzen 7 7800X3D Processor Box"
                  value={newProd.name} onChange={e => setNewProd({ ...newProd, name: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Kategori Rak Fisik</label>
                  <select
                    value={newProd.item_type}
                    onChange={e => setNewProd({ ...newProd, item_type: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    <option value="PREBUILT">PREBUILT (Barang Jadi)</option>
                    <option value="BAREBONE">BAREBONE (Setengah Jadi)</option>
                    <option value="SPARE_PART">SPARE_PART (Komponen)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Brand</label>
                  <select
                    value={newProd.brand}
                    onChange={e => setNewProd({ ...newProd, brand: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Estimasi HPP (Rp)</label>
                  <input
                    type="number" required placeholder="5000000"
                    value={newProd.cost_price} onChange={e => setNewProd({ ...newProd, cost_price: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Harga Jual (Rp)</label>
                  <input
                    type="number" required placeholder="6500000"
                    value={newProd.unit_price} onChange={e => setNewProd({ ...newProd, unit_price: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Flags */}
              <div style={{ display: 'flex', gap: '1.5rem', padding: '0.5rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newProd.is_serial}
                    onChange={e => setNewProd({ ...newProd, is_serial: e.target.checked })}
                  />
                  <span>Wajib Serial Number (SN/IMEI)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newProd.is_assembly}
                    onChange={e => setNewProd({ ...newProd, is_assembly: e.target.checked })}
                  />
                  <span>Dirakit via BOM (Prebuilt)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '0.375rem', border: 'none', backgroundColor: 'var(--accent-color)', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD BIN */}
      {/* ========================================================================= */}
      {showBinModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '480px',
            maxWidth: '90%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)', fontSize: '1.2rem', fontWeight: '700' }}>
              {isId ? 'Tambah Lokasi Slot Bin Baru' : 'Add New Bin Slot'}
            </h3>
            <form onSubmit={handleCreateBin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Zona Kategori Rak</label>
                <select
                  value={newBin.zone_id}
                  onChange={e => setNewBin({ ...newBin, zone_id: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                >
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name} ({z.category})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Rack</label>
                  <input
                    type="text" required placeholder="Rack-A"
                    value={newBin.rack} onChange={e => setNewBin({ ...newBin, rack: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Shelf</label>
                  <input
                    type="text" required placeholder="Shelf-1"
                    value={newBin.shelf} onChange={e => setNewBin({ ...newBin, shelf: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Level</label>
                  <input
                    type="text" required placeholder="01"
                    value={newBin.level} onChange={e => setNewBin({ ...newBin, level: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Kapasitas Maksimal Unit</label>
                <input
                  type="number" required placeholder="100"
                  value={newBin.capacity} onChange={e => setNewBin({ ...newBin, capacity: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBinModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '0.375rem', border: 'none', backgroundColor: 'var(--accent-color)', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Simpan Bin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
