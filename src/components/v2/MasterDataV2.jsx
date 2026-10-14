import { useState, useEffect } from 'react';
import { 
  Database, Plus, Search, Box, Tag, Truck, Users, Barcode, MapPin,
  Pencil, Trash2, ArchiveRestore, Eye, EyeOff
} from 'lucide-react';
import { 
  initialProducts, initialZones, 
  initialBins, initialBrands, initialSuppliers, initialClients 
} from '../../data/v2Data';
import { apiService } from '../../services/apiService';

// Shared modal/form styles for the master-entity forms (brands / suppliers / clients).
const modalOverlay = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const modalCard = {
  backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '620px',
  maxWidth: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
};
const modalTitle = { margin: '0 0 1rem 0', color: 'var(--primary-color)', fontSize: '1.2rem', fontWeight: '700' };
const modalForm = { display: 'flex', flexDirection: 'column', gap: '0.85rem' };
const labelStyle = { fontSize: '0.75rem', fontWeight: '600' };
const inputStyle = { width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' };
const modalActions = { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' };
const cancelBtn = { padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer' };
const submitBtn = { padding: '0.5rem 1.25rem', borderRadius: '0.375rem', border: 'none', backgroundColor: 'var(--accent-color)', color: '#ffffff', fontWeight: '600', cursor: 'pointer' };

// A master-data row is archived when the API soft-deleted it (DELETE without
// ?hard=true sets is_active=false + deleted_at).
const isArchivedRow = (x) => !!x && (x.is_active === false || !!x.deleted_at);

// Reusable "Add" toolbar rendered above the brands / suppliers / clients tabs.
// `archivedCount`/`showArchived`/`onToggleArchived` drive the archive view.
function EntityToolbar({ title, subtitle, count, onAdd, addLabel, testId, archivedCount = 0, showArchived = false, onToggleArchived }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: '#ffffff', padding: '1rem 1.25rem', borderRadius: '0.75rem',
      border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem'
    }}>
      <div>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--primary-color)' }}>{title}</h3>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
          {count} {subtitle}
          {archivedCount > 0 && (
            <span style={{ color: '#b45309', fontWeight: '600' }}> · {archivedCount} diarsipkan</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {archivedCount > 0 && (
          <button
            type="button"
            id="btn-toggle-archived"
            data-testid="btn-toggle-archived"
            onClick={onToggleArchived}
            title={showArchived ? 'Sembunyikan arsip' : 'Tampilkan arsip'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              backgroundColor: showArchived ? '#fef3c7' : '#f1f5f9',
              color: showArchived ? '#b45309' : '#475569',
              border: `1px solid ${showArchived ? '#fcd34d' : 'var(--border-color)'}`,
              padding: '0.5rem 0.8rem', borderRadius: '0.5rem',
              fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer'
            }}
          >
            {showArchived ? <EyeOff size={14} /> : <Eye size={14} />}
            {showArchived ? 'Sembunyikan Arsip' : `Arsip (${archivedCount})`}
          </button>
        )}
        <button
          type="button"
          id={testId}
          data-testid={testId}
          onClick={onAdd}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'var(--accent-color)', color: '#ffffff',
            border: 'none', padding: '0.55rem 1rem', borderRadius: '0.5rem',
            fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer'
          }}
        >
          <Plus size={16} /> {addLabel}
        </button>
      </div>
    </div>
  );
}

// Edit / Delete / Restore controls rendered on every master-entity card.
function EntityCardActions({ isId, archived, onEdit, onDelete, onRestore, testIdPrefix = '' }) {
  const btn = (extra) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '30px', height: '30px', borderRadius: '0.375rem', cursor: 'pointer',
    border: '1px solid var(--border-color)', backgroundColor: '#ffffff', ...extra
  });
  if (archived) {
    return (
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button
          type="button" title={isId ? 'Pulihkan' : 'Restore'}
          id={`${testIdPrefix}restore`} data-testid={`${testIdPrefix}restore`}
          onClick={onRestore}
          style={btn({ color: '#047857', borderColor: '#a7f3d0' })}
        >
          <ArchiveRestore size={15} />
        </button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: '0.35rem' }}>
      <button
        type="button" title={isId ? 'Ubah' : 'Edit'}
        id={`${testIdPrefix}edit`} data-testid={`${testIdPrefix}edit`}
        onClick={onEdit}
        style={btn({ color: 'var(--accent-color)' })}
      >
        <Pencil size={15} />
      </button>
      <button
        type="button" title={isId ? 'Hapus' : 'Delete'}
        id={`${testIdPrefix}delete`} data-testid={`${testIdPrefix}delete`}
        onClick={onDelete}
        style={btn({ color: '#b91c1c', borderColor: '#fca5a5' })}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

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
  const [zones, setZones] = useState(initialZones);
  const [bins, setBins] = useState(initialBins);
  const [brands, setBrands] = useState(initialBrands);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [clients, setClients] = useState(initialClients);

  // Form Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBinModal, setShowBinModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  // Notice banner + in-flight flag for the entity forms
  const [entityNotice, setEntityNotice] = useState(null);
  const [entitySaving, setEntitySaving] = useState(false);

  // Full-CRUD state for the master entities.
  // `editing*` holds the record being edited (null = create mode).
  // `confirmDelete` drives the delete-confirmation modal.
  // `showArchived` toggles the archive view (per active entity tab).
  const [editingBrand, setEditingBrand] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { kind, record }
  const [showArchived, setShowArchived] = useState(false);

  // New Brand Form
  const emptyBrand = { name: '', code: '', description: '' };
  const [newBrand, setNewBrand] = useState(emptyBrand);

  // New Supplier Form
  const emptySupplier = {
    name: '', code: '', category: 'Distributor', country: 'Indonesia', currency: 'IDR',
    rating: 5, contact: '', phone: '', email: '', address: '',
    payment_terms: 'NET 30', lead_time_days: 7, is_principal: false
  };
  const [newSupplier, setNewSupplier] = useState(emptySupplier);

  // New Client Form
  const emptyClient = {
    name: '', code: '', segment: 'corporate', contact: '', phone: '', email: '',
    billing_address: '', payment_terms: 'NET 30', credit_limit: '', outstanding: 0
  };
  const [newClient, setNewClient] = useState(emptyClient);

  // New Product Form
  const [newProd, setNewProd] = useState({
    sku: '',
    barcode: '',
    name: '',
    category: 'Hardware',
    item_type: 'SPARE_PART',
    brand: '',
    uom: 'PCS',
    unit_price: '',
    cost_price: '',
    stock: 0,
    is_serial: false,
    is_assembly: false,
    bin_code: ''
  });

  // New Bin Form
  const [newBin, setNewBin] = useState({
    warehouse_id: '',
    zone_id: '',
    rack: '',
    shelf: '',
    level: '',
    bin_type: 'storage',
    capacity: 50
  });

  const isId = language === 'id';

  // Format Currency
  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (p.name || '').toLowerCase().includes(q) ||
                          (p.sku || '').toLowerCase().includes(q) ||
                          String(p.barcode || '').includes(searchQuery);
    const matchesCat = categoryFilter === 'ALL' || p.item_type === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // REST API Mount Fetch
  useEffect(() => {
    apiService.masterData.getProducts().then(data => {
      if (data && Array.isArray(data)) {
        setProducts(data);
        try { localStorage.setItem('moai_v2_products', JSON.stringify(data)); } catch (err) { console.debug(err); }
      }
    });
    apiService.masterData.getBins().then(data => {
      if (data && Array.isArray(data)) {
        setBins(data);
      }
    });
    apiService.masterData.getZones().then(data => {
      if (data && Array.isArray(data) && data.length > 0) {
        setZones(data);
      }
    });
    apiService.masterData.getBrands().then(data => {
      if (data && Array.isArray(data) && data.length > 0) {
        setBrands(data);
      }
    });
    apiService.masterData.getSuppliers().then(data => {
      if (data && Array.isArray(data)) {
        setSuppliers(data);
      }
    });
    apiService.masterData.getClients().then(data => {
      if (data && Array.isArray(data)) {
        setClients(data);
      }
    });
  }, []);

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
    apiService.masterData.createProduct(created);
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
    apiService.masterData.createBin(createdBin);
    setShowBinModal(false);
  };

  // ---- Master entity CRUD (Brands / Suppliers / Clients) -----------------
  // The list is always fetched *including* archived rows, then split locally so
  // the toolbar can show an archive count and the toggle is instant. Every
  // mutation re-fetches so the view reflects the durable server state instead
  // of an optimistic local guess.
  const reloadBrands = () => apiService.masterData.getBrands({ includeArchived: true })
    .then(d => { if (Array.isArray(d)) setBrands(d); });
  const reloadSuppliers = () => apiService.masterData.getSuppliers({ includeArchived: true })
    .then(d => { if (Array.isArray(d)) setSuppliers(d); });
  const reloadClients = () => apiService.masterData.getClients({ includeArchived: true })
    .then(d => { if (Array.isArray(d)) setClients(d); });

  const brandActive = brands.filter(b => !isArchivedRow(b));
  const brandArchived = brands.filter(isArchivedRow);
  const supplierActive = suppliers.filter(s => !isArchivedRow(s));
  const supplierArchived = suppliers.filter(isArchivedRow);
  const clientActive = clients.filter(c => !isArchivedRow(c));
  const clientArchived = clients.filter(isArchivedRow);

  const visibleBrands = showArchived ? [...brandActive, ...brandArchived] : brandActive;
  const visibleSuppliers = showArchived ? [...supplierActive, ...supplierArchived] : supplierActive;
  const visibleClients = showArchived ? [...clientActive, ...clientArchived] : clientActive;

  // Openers ------------------------------------------------------------------
  const openCreateBrand = () => {
    setEntityNotice(null); setEditingBrand(null); setNewBrand(emptyBrand); setShowBrandModal(true);
  };
  const openEditBrand = (b) => {
    setEntityNotice(null); setEditingBrand(b);
    setNewBrand({ name: b.name || '', code: b.code || '', description: b.description || '' });
    setShowBrandModal(true);
  };
  const openCreateSupplier = () => {
    setEntityNotice(null); setEditingSupplier(null); setNewSupplier(emptySupplier); setShowSupplierModal(true);
  };
  const openEditSupplier = (s) => {
    setEntityNotice(null); setEditingSupplier(s);
    setNewSupplier({
      name: s.name || '', code: s.code || '', category: s.category || 'Distributor',
      country: s.country || 'Indonesia', currency: s.currency || 'IDR',
      rating: s.rating ?? 5, contact: s.contact || '', phone: s.phone || '',
      email: s.email || '', address: s.address || '',
      payment_terms: s.payment_terms || 'NET 30',
      lead_time_days: s.lead_time_days ?? 7, is_principal: !!s.is_principal
    });
    setShowSupplierModal(true);
  };
  const openCreateClient = () => {
    setEntityNotice(null); setEditingClient(null); setNewClient(emptyClient); setShowClientModal(true);
  };
  const openEditClient = (c) => {
    setEntityNotice(null); setEditingClient(c);
    setNewClient({
      name: c.name || '', code: c.code || '', segment: c.segment || 'corporate',
      contact: c.contact || '', phone: c.phone || '', email: c.email || '',
      billing_address: c.billing_address || '', payment_terms: c.payment_terms || 'NET 30',
      credit_limit: c.credit_limit ?? '', outstanding: c.outstanding ?? 0
    });
    setShowClientModal(true);
  };

  // Submit (create OR update) -----------------------------------------------
  const submitEntity = async ({ editing, payload, create, update, reload, label }) => {
    setEntitySaving(true);
    try {
      const res = editing ? await update(editing.id, payload) : await create(payload);
      await reload();
      return { ok: true, res };
    } catch (err) {
      return { ok: false, err, label };
    } finally {
      setEntitySaving(false);
    }
  };

  const handleSubmitBrand = async (e) => {
    e.preventDefault();
    const wasEdit = !!editingBrand;
    const out = await submitEntity({
      editing: editingBrand, payload: newBrand,
      create: apiService.masterData.createBrand, update: apiService.masterData.updateBrand,
      reload: reloadBrands, label: 'brand'
    });
    if (out.ok) {
      setShowBrandModal(false); setEditingBrand(null); setNewBrand(emptyBrand);
      setEntityNotice({ type: 'ok', msg: isId
        ? `Brand "${out.res.name}" (${out.res.code}) berhasil ${wasEdit ? 'diperbarui' : 'ditambahkan'}.`
        : `Brand "${out.res.name}" (${out.res.code}) ${wasEdit ? 'updated' : 'added'}.` });
    } else {
      setEntityNotice({ type: 'err', msg: (isId ? 'Gagal menyimpan brand: ' : 'Failed to save brand: ') + out.err.message });
    }
  };

  const handleSubmitSupplier = async (e) => {
    e.preventDefault();
    const wasEdit = !!editingSupplier;
    const out = await submitEntity({
      editing: editingSupplier, payload: newSupplier,
      create: apiService.masterData.createSupplier, update: apiService.masterData.updateSupplier,
      reload: reloadSuppliers, label: 'supplier'
    });
    if (out.ok) {
      setShowSupplierModal(false); setEditingSupplier(null); setNewSupplier(emptySupplier);
      setEntityNotice({ type: 'ok', msg: isId
        ? `Pemasok "${out.res.name}" (${out.res.code}) berhasil ${wasEdit ? 'diperbarui' : 'ditambahkan'}.`
        : `Supplier "${out.res.name}" (${out.res.code}) ${wasEdit ? 'updated' : 'added'}.` });
    } else {
      setEntityNotice({ type: 'err', msg: (isId ? 'Gagal menyimpan pemasok: ' : 'Failed to save supplier: ') + out.err.message });
    }
  };

  const handleSubmitClient = async (e) => {
    e.preventDefault();
    const wasEdit = !!editingClient;
    const out = await submitEntity({
      editing: editingClient, payload: newClient,
      create: apiService.masterData.createClient, update: apiService.masterData.updateClient,
      reload: reloadClients, label: 'client'
    });
    if (out.ok) {
      setShowClientModal(false); setEditingClient(null); setNewClient(emptyClient);
      setEntityNotice({ type: 'ok', msg: isId
        ? `Klien "${out.res.name}" (${out.res.code}) berhasil ${wasEdit ? 'diperbarui' : 'ditambahkan'}.`
        : `Client "${out.res.name}" (${out.res.code}) ${wasEdit ? 'updated' : 'added'}.` });
    } else {
      setEntityNotice({ type: 'err', msg: (isId ? 'Gagal menyimpan klien: ' : 'Failed to save client: ') + out.err.message });
    }
  };

  // Delete / restore ---------------------------------------------------------
  const ENTITY_META = {
    brand: { label: 'Brand', api: { remove: apiService.masterData.deleteBrand, restore: apiService.masterData.restoreBrand }, reload: reloadBrands },
    supplier: { label: 'Supplier', api: { remove: apiService.masterData.deleteSupplier, restore: apiService.masterData.restoreSupplier }, reload: reloadSuppliers },
    client: { label: 'Client', api: { remove: apiService.masterData.deleteClient, restore: apiService.masterData.restoreClient }, reload: reloadClients }
  };

  const askDelete = (kind, record) => {
    setEntityNotice(null);
    setConfirmDelete({ kind, record, error: null });
  };

  const runDelete = async (hard = false) => {
    if (!confirmDelete) return;
    const { kind, record } = confirmDelete;
    const meta = ENTITY_META[kind];
    setEntitySaving(true);
    try {
      const res = await meta.api.remove(record.id, hard);
      await meta.reload();
      setConfirmDelete(null);
      const refs = res && res.referenced ? res.referenced : 0;
      setEntityNotice({ type: 'ok', msg: isId
        ? (hard
            ? `${meta.label} "${record.name}" dihapus permanen.`
            : `${meta.label} "${record.name}" diarsipkan${refs ? ` (direferensikan ${refs} transaksi — riwayat tetap utuh)` : ''}.`)
        : (hard
            ? `${meta.label} "${record.name}" permanently deleted.`
            : `${meta.label} "${record.name}" archived${refs ? ` (referenced by ${refs} transaction(s) — history preserved)` : ''}.`) });
    } catch (err) {
      setConfirmDelete(c => (c ? { ...c, error: err.message } : c));
    } finally {
      setEntitySaving(false);
    }
  };

  const runRestore = async (kind, record) => {
    const meta = ENTITY_META[kind];
    setEntitySaving(true);
    try {
      const res = await meta.api.restore(record.id);
      await meta.reload();
      setEntityNotice({ type: 'ok', msg: isId
        ? `${meta.label} "${res.name}" berhasil dipulihkan.`
        : `${meta.label} "${res.name}" restored.` });
    } catch (err) {
      setEntityNotice({ type: 'err', msg: (isId ? 'Gagal memulihkan: ' : 'Failed to restore: ') + err.message });
    } finally {
      setEntitySaving(false);
    }
  };

  // Small reusable "Add" toolbar for the entity tabs (defined at module scope below)

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
            <Database size={18} /> MODUL 6 — MASTER DATA
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <EntityToolbar
            title={isId ? 'Master Brand / Merek' : 'Brand Master'}
            subtitle={isId ? 'brand terdaftar di katalog' : 'brands registered in the catalogue'}
            count={brandActive.length}
            archivedCount={brandArchived.length}
            showArchived={showArchived}
            onToggleArchived={() => setShowArchived(v => !v)}
            onAdd={openCreateBrand}
            addLabel={isId ? 'Tambah Brand' : 'Add Brand'}
            testId="btn-add-brand"
          />
          {entityNotice && (
            <div id="entity-notice-banner" data-testid="entity-notice-banner" style={{
              backgroundColor: entityNotice.type === 'ok' ? '#ecfdf5' : '#fee2e2',
              color: entityNotice.type === 'ok' ? '#047857' : '#991b1b',
              border: `1px solid ${entityNotice.type === 'ok' ? '#a7f3d0' : '#fca5a5'}`,
              padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.85rem'
            }}>
              {entityNotice.type === 'ok' ? '✓ ' : '⚠ '}{entityNotice.msg}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {visibleBrands.map(b => (
            <div key={b.id} style={{ 
              backgroundColor: isArchivedRow(b) ? '#f8fafc' : '#ffffff',
              borderRadius: '0.75rem',
              border: `1px ${isArchivedRow(b) ? 'dashed' : 'solid'} var(--border-color)`,
              padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
              opacity: isArchivedRow(b) ? 0.75 : 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '0.5rem', backgroundColor: '#e0f2fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)',
                fontWeight: '800', fontSize: '1.1rem'
              }}>
                {String(b.code || b.name || '??').substring(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--primary-color)', fontSize: '1rem' }}>
                  {b.name}
                  {isArchivedRow(b) && (
                    <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', fontWeight: '700', color: '#b45309', backgroundColor: '#fef3c7', padding: '0.1rem 0.35rem', borderRadius: '0.25rem' }}>
                      {isId ? 'ARSIP' : 'ARCHIVED'}
                    </span>
                  )}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{b.description}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--accent-color)', marginTop: '0.25rem' }}>Kode Brand: {b.code}</div>
              </div>
              <EntityCardActions
                isId={isId} archived={isArchivedRow(b)} testIdPrefix={`brand-${b.id}-`}
                onEdit={() => openEditBrand(b)}
                onDelete={() => askDelete('brand', b)}
                onRestore={() => runRestore('brand', b)}
              />
            </div>
          ))}
          {visibleBrands.length === 0 && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {isId ? 'Belum ada brand. Klik "Tambah Brand".' : 'No brands yet. Click "Add Brand".'}
            </div>
          )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUPPLIERS */}
      {/* ========================================================================= */}
      {activeTab === 'suppliers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <EntityToolbar
            title={isId ? 'Master Pemasok / Vendor' : 'Supplier Master'}
            subtitle={isId ? 'pemasok terdaftar' : 'suppliers registered'}
            count={supplierActive.length}
            archivedCount={supplierArchived.length}
            showArchived={showArchived}
            onToggleArchived={() => setShowArchived(v => !v)}
            onAdd={openCreateSupplier}
            addLabel={isId ? 'Tambah Pemasok' : 'Add Supplier'}
            testId="btn-add-supplier"
          />
          {entityNotice && (
            <div id="entity-notice-banner" data-testid="entity-notice-banner" style={{
              backgroundColor: entityNotice.type === 'ok' ? '#ecfdf5' : '#fee2e2',
              color: entityNotice.type === 'ok' ? '#047857' : '#991b1b',
              border: `1px solid ${entityNotice.type === 'ok' ? '#a7f3d0' : '#fca5a5'}`,
              padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.85rem'
            }}>
              {entityNotice.type === 'ok' ? '✓ ' : '⚠ '}{entityNotice.msg}
            </div>
          )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {visibleSuppliers.map(s => (
            <div key={s.id} style={{ 
              backgroundColor: isArchivedRow(s) ? '#f8fafc' : '#ffffff',
              borderRadius: '0.75rem',
              border: `1px ${isArchivedRow(s) ? 'dashed' : 'solid'} var(--border-color)`,
              padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
              opacity: isArchivedRow(s) ? 0.75 : 1,
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
                  {isArchivedRow(s) && (
                    <span style={{ marginLeft: '0.35rem', fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                      {isId ? 'ARSIP' : 'ARCHIVED'}
                    </span>
                  )}
                  <h4 style={{ margin: '0.4rem 0 0 0', fontWeight: '700', fontSize: '1.05rem', color: 'var(--primary-color)' }}>
                    {s.name}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kode: {s.code}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span style={{ fontWeight: '700', color: 'var(--accent-color)', fontSize: '0.85rem' }}>{s.currency}</span>
                  <EntityCardActions
                    isId={isId} archived={isArchivedRow(s)} testIdPrefix={`supplier-${s.id}-`}
                    onEdit={() => openEditSupplier(s)}
                    onDelete={() => askDelete('supplier', s)}
                    onRestore={() => runRestore('supplier', s)}
                  />
                </div>
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
          {visibleSuppliers.length === 0 && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {isId ? 'Belum ada pemasok. Klik "Tambah Pemasok".' : 'No suppliers yet.'}
            </div>
          )}
        </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CLIENTS */}
      {/* ========================================================================= */}
      {activeTab === 'clients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <EntityToolbar
            title={isId ? 'Master Klien / Pelanggan' : 'Client Master'}
            subtitle={isId ? 'klien terdaftar' : 'clients registered'}
            count={clientActive.length}
            archivedCount={clientArchived.length}
            showArchived={showArchived}
            onToggleArchived={() => setShowArchived(v => !v)}
            onAdd={openCreateClient}
            addLabel={isId ? 'Tambah Klien' : 'Add Client'}
            testId="btn-add-client"
          />
          {entityNotice && (
            <div id="entity-notice-banner" data-testid="entity-notice-banner" style={{
              backgroundColor: entityNotice.type === 'ok' ? '#ecfdf5' : '#fee2e2',
              color: entityNotice.type === 'ok' ? '#047857' : '#991b1b',
              border: `1px solid ${entityNotice.type === 'ok' ? '#a7f3d0' : '#fca5a5'}`,
              padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.85rem'
            }}>
              {entityNotice.type === 'ok' ? '✓ ' : '⚠ '}{entityNotice.msg}
            </div>
          )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {visibleClients.map(c => (
            <div key={c.id} style={{ 
              backgroundColor: isArchivedRow(c) ? '#f8fafc' : '#ffffff',
              borderRadius: '0.75rem',
              border: `1px ${isArchivedRow(c) ? 'dashed' : 'solid'} var(--border-color)`,
              padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
              opacity: isArchivedRow(c) ? 0.75 : 1,
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
                  {isArchivedRow(c) && (
                    <span style={{ marginLeft: '0.35rem', fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                      {isId ? 'ARSIP' : 'ARCHIVED'}
                    </span>
                  )}
                  <h4 style={{ margin: '0.4rem 0 0 0', fontWeight: '700', fontSize: '1.05rem', color: 'var(--primary-color)' }}>
                    {c.name}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kode: {c.code}</div>
                </div>
                <EntityCardActions
                  isId={isId} archived={isArchivedRow(c)} testIdPrefix={`client-${c.id}-`}
                  onEdit={() => openEditClient(c)}
                  onDelete={() => askDelete('client', c)}
                  onRestore={() => runRestore('client', c)}
                />
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
          {visibleClients.length === 0 && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {isId ? 'Belum ada klien. Klik "Tambah Klien".' : 'No clients yet.'}
            </div>
          )}
        </div>
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

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT BRAND */}
      {/* ========================================================================= */}
      {showBrandModal && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={modalTitle}>
              {editingBrand
                ? (isId ? `Ubah Brand — ${editingBrand.name}` : `Edit Brand — ${editingBrand.name}`)
                : (isId ? 'Tambah Master Brand' : 'Add Brand')}
            </h3>
            <form onSubmit={handleSubmitBrand} style={modalForm}>
              <div>
                <label style={labelStyle}>{isId ? 'Nama Brand' : 'Brand Name'} *</label>
                <input
                  type="text" required placeholder="Contoh: MSI"
                  value={newBrand.name} onChange={e => setNewBrand({ ...newBrand, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>{isId ? 'Kode Brand (opsional — dibuat otomatis)' : 'Brand Code (optional — auto)'}</label>
                <input
                  type="text" placeholder="MSI"
                  value={newBrand.code} onChange={e => setNewBrand({ ...newBrand, code: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>{isId ? 'Deskripsi' : 'Description'}</label>
                <input
                  type="text" placeholder={isId ? 'Contoh: Motherboard, GPU, laptop' : 'e.g. Motherboard, GPU, laptop'}
                  value={newBrand.description} onChange={e => setNewBrand({ ...newBrand, description: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={modalActions}>
                <button type="button" onClick={() => { setShowBrandModal(false); setEditingBrand(null); }} style={cancelBtn}>{isId ? 'Batal' : 'Cancel'}</button>
                <button type="submit" disabled={entitySaving} style={{ ...submitBtn, opacity: entitySaving ? 0.6 : 1 }}>
                  {entitySaving ? '…' : (editingBrand
                    ? (isId ? 'Perbarui Brand' : 'Update Brand')
                    : (isId ? 'Simpan Brand' : 'Save Brand'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT SUPPLIER */}
      {/* ========================================================================= */}
      {showSupplierModal && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={modalTitle}>
              {editingSupplier
                ? (isId ? `Ubah Pemasok — ${editingSupplier.name}` : `Edit Supplier — ${editingSupplier.name}`)
                : (isId ? 'Tambah Master Pemasok / Vendor' : 'Add Supplier')}
            </h3>
            <form onSubmit={handleSubmitSupplier} style={modalForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>{isId ? 'Nama Perusahaan' : 'Company Name'} *</label>
                  <input
                    type="text" required placeholder="PT Contoh Distribusi"
                    value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{isId ? 'Kode (opsional)' : 'Code (optional)'}</label>
                  <input
                    type="text" placeholder="SUPP-XXX"
                    value={newSupplier.code} onChange={e => setNewSupplier({ ...newSupplier, code: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>{isId ? 'Kategori' : 'Category'}</label>
                  <select value={newSupplier.category} onChange={e => setNewSupplier({ ...newSupplier, category: e.target.value })} style={inputStyle}>
                    <option value="Distributor">Distributor</option>
                    <option value="Principal">Principal</option>
                    <option value="Importer">Importer</option>
                    <option value="Retailer">Retailer</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{isId ? 'Negara' : 'Country'}</label>
                  <input type="text" value={newSupplier.country} onChange={e => setNewSupplier({ ...newSupplier, country: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Currency</label>
                  <select value={newSupplier.currency} onChange={e => setNewSupplier({ ...newSupplier, currency: e.target.value })} style={inputStyle}>
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                    <option value="SGD">SGD</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>{isId ? 'Kontak PIC' : 'Contact PIC'}</label>
                  <input type="text" placeholder="Budi Santoso" value={newSupplier.contact} onChange={e => setNewSupplier({ ...newSupplier, contact: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{isId ? 'Telepon' : 'Phone'}</label>
                  <input type="text" placeholder="+62-21-..." value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" placeholder="sales@vendor.com" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>{isId ? 'Alamat' : 'Address'}</label>
                <input type="text" value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>{isId ? 'Term of Payment' : 'Payment Terms'}</label>
                  <select value={newSupplier.payment_terms} onChange={e => setNewSupplier({ ...newSupplier, payment_terms: e.target.value })} style={inputStyle}>
                    <option value="COD">COD</option>
                    <option value="NET 14">NET 14</option>
                    <option value="NET 30">NET 30</option>
                    <option value="NET 45">NET 45</option>
                    <option value="NET 60">NET 60</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{isId ? 'Lead Time (hari)' : 'Lead Time (days)'}</label>
                  <input type="number" min="0" value={newSupplier.lead_time_days} onChange={e => setNewSupplier({ ...newSupplier, lead_time_days: Number(e.target.value) })} style={inputStyle} />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={newSupplier.is_principal} onChange={e => setNewSupplier({ ...newSupplier, is_principal: e.target.checked })} />
                <span>{isId ? 'Pemasok ini Principal Resmi (bukan distributor)' : 'This supplier is an Official Principal'}</span>
              </label>

              <div style={modalActions}>
                <button type="button" onClick={() => setShowSupplierModal(false)} style={cancelBtn}>{isId ? 'Batal' : 'Cancel'}</button>
                <button type="submit" disabled={entitySaving} style={{ ...submitBtn, opacity: entitySaving ? 0.6 : 1 }}>
                  {entitySaving ? '…' : (isId ? 'Simpan Pemasok' : 'Save Supplier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT CLIENT */}
      {/* ========================================================================= */}
      {showClientModal && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={modalTitle}>
              {editingClient
                ? (isId ? `Ubah Klien — ${editingClient.name}` : `Edit Client — ${editingClient.name}`)
                : (isId ? 'Tambah Master Klien / Pelanggan' : 'Add Client')}
            </h3>
            <form onSubmit={handleSubmitClient} style={modalForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>{isId ? 'Nama Perusahaan / Instansi' : 'Company / Institution'} *</label>
                  <input
                    type="text" required placeholder="PT Contoh Pelanggan"
                    value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{isId ? 'Kode (opsional)' : 'Code (optional)'}</label>
                  <input
                    type="text" placeholder="CLI-XXX"
                    value={newClient.code} onChange={e => setNewClient({ ...newClient, code: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Segmen</label>
                  <select value={newClient.segment} onChange={e => setNewClient({ ...newClient, segment: e.target.value })} style={inputStyle}>
                    <option value="corporate">Corporate (Perusahaan)</option>
                    <option value="government">Government (Pemerintah)</option>
                    <option value="retail">Retail (Toko)</option>
                    <option value="education">Education (Pendidikan)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{isId ? 'Term of Payment' : 'Payment Terms'}</label>
                  <select value={newClient.payment_terms} onChange={e => setNewClient({ ...newClient, payment_terms: e.target.value })} style={inputStyle}>
                    <option value="COD">COD</option>
                    <option value="NET 14">NET 14</option>
                    <option value="NET 30">NET 30</option>
                    <option value="NET 45">NET 45</option>
                    <option value="NET 60">NET 60</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>{isId ? 'Kontak PIC' : 'Contact PIC'}</label>
                  <input type="text" placeholder="Rian Hidayat" value={newClient.contact} onChange={e => setNewClient({ ...newClient, contact: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{isId ? 'Telepon' : 'Phone'}</label>
                  <input type="text" placeholder="+62-21-..." value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" placeholder="purchasing@client.co.id" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>{isId ? 'Alamat Penagihan' : 'Billing Address'}</label>
                <input type="text" value={newClient.billing_address} onChange={e => setNewClient({ ...newClient, billing_address: e.target.value })} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>{isId ? 'Limit Kredit (Rp)' : 'Credit Limit (IDR)'}</label>
                <input
                  type="number" min="0" placeholder="500000000"
                  value={newClient.credit_limit} onChange={e => setNewClient({ ...newClient, credit_limit: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={modalActions}>
                <button type="button" onClick={() => { setShowClientModal(false); setEditingClient(null); }} style={cancelBtn}>{isId ? 'Batal' : 'Cancel'}</button>
                <button type="submit" disabled={entitySaving} style={{ ...submitBtn, opacity: entitySaving ? 0.6 : 1 }}>
                  {entitySaving ? '…' : (editingClient
                    ? (isId ? 'Perbarui Klien' : 'Update Client')
                    : (isId ? 'Simpan Klien' : 'Save Client'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM DELETE (archive / permanent) */}
      {/* ========================================================================= */}
      {confirmDelete && (
        <div style={modalOverlay} id="confirm-delete-modal" data-testid="confirm-delete-modal">
          <div style={{ ...modalCard, width: '460px' }}>
            <h3 style={{ ...modalTitle, color: '#b91c1c' }}>
              {isId
                ? `Hapus ${ENTITY_META[confirmDelete.kind].label}?`
                : `Delete ${ENTITY_META[confirmDelete.kind].label}?`}
            </h3>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <p style={{ marginTop: 0 }}>
                <strong>{confirmDelete.record.name}</strong>{' '}
                <span style={{ color: 'var(--text-muted)' }}>({confirmDelete.record.code})</span>
              </p>
              <p>
                {isId
                  ? 'Penghapusan default bersifat arsip (soft delete): data disembunyikan dari daftar aktif, tapi riwayat dokumen (PO, GRN, SO, invoice) tetap utuh. Penghapusan permanen hanya bisa dilakukan bila tidak ada transaksi yang merujuk.'
                  : 'The default delete is an archive (soft delete): the record is hidden from the active list while document history (PO, GRN, SO, invoices) stays intact. Permanent deletion is only allowed when nothing references it.'}
              </p>
            </div>

            {confirmDelete.error && (
              <div style={{
                backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5',
                padding: '0.6rem 0.8rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.8rem'
              }}>
                ⚠ {confirmDelete.error}
              </div>
            )}

            <div style={{ ...modalActions, justifyContent: 'space-between' }}>
              <button
                type="button"
                id="btn-hard-delete"
                data-testid="btn-hard-delete"
                disabled={entitySaving}
                onClick={() => runDelete(true)}
                style={{ ...cancelBtn, color: '#b91c1c', borderColor: '#fca5a5' }}
              >
                {isId ? 'Hapus Permanen' : 'Delete Permanently'}
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" id="btn-cancel-delete" onClick={() => setConfirmDelete(null)} style={cancelBtn}>
                  {isId ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="button"
                  id="btn-archive-confirm"
                  data-testid="btn-archive-confirm"
                  disabled={entitySaving}
                  onClick={() => runDelete(false)}
                  style={{ ...submitBtn, backgroundColor: '#b45309', opacity: entitySaving ? 0.6 : 1 }}
                >
                  {entitySaving ? '…' : (isId ? 'Arsipkan' : 'Archive')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
