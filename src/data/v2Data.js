// ==============================================================================
// MOAI ERP v2.0 - Domain Schema, Configuration & Roles
// All hardcoded mock placeholder arrays removed in favor of dynamic API / DB data.
// ==============================================================================

export const initialWarehouses = [];
export const initialZones = [];
export const initialBins = [];
export const initialBrands = [];
export const initialProducts = [];
export const initialSuppliers = [];
export const initialClients = [];
export const initialSerials = [];
export const initialStockMovements = [];
export const initialBOM = { target_product_id: '', target_sku: '', name: '', version: '1.0', components: [] };
export const initialAssemblyOrders = [];
export const initialPurchaseOrders = [];
export const initialRequisitions = [];
export const initialSalesOrders = [];
export const initialApBills = [];
export const initialArInvoices = [];
export const initialGRNList = [];
export const initialDeliveryNotes = [];
export const initialInboundReturns = [];

export const ERP_ROLES = [
  { id: 'COMPANY_ADMIN', labelEN: 'Company Admin (Full Access)', labelID: 'Admin Perusahaan (Akses Penuh)' },
  { id: 'SCM_ADMIN', labelEN: 'SCM Admin (Procurement & PO)', labelID: 'Admin SCM (Pengadaan & PO)' },
  { id: 'QC_INSPECTOR', labelEN: 'QC Inspector (Receiving & Gate)', labelID: 'Inspektur QC (Receiving & Gate)' },
  { id: 'INVENTORY_ADMIN', labelEN: 'Inventory Admin (Stock & Ledger)', labelID: 'Admin Inventaris (Stok & Ledger)' },
  { id: 'ASSEMBLY_TECH', labelEN: 'Assembly Tech (BOM & Perakitan)', labelID: 'Teknisi Perakitan (BOM & Rakit)' },
  { id: 'OUTBOUND_ADMIN', labelEN: 'Outbound Admin (SO & Surat Jalan)', labelID: 'Admin Outbound (SO & Surat Jalan)' },
  { id: 'PICKING_ADMIN', labelEN: 'Picking Admin (Picking Engine)', labelID: 'Admin Picking (Picking Engine)' },
  { id: 'PACKING_ADMIN', labelEN: 'Packing Admin (Packing Station)', labelID: 'Admin Packing (Packing Station)' },
  { id: 'RETURN_ADMIN', labelEN: 'Return Admin (RMA & Retur Vendor)', labelID: 'Admin Retur (RMA & RTV)' },
  { id: 'FINANCE_ADMIN', labelEN: 'Finance Admin (COGS, AP/AR & P&L)', labelID: 'Admin Keuangan (HPP, AP/AR & P&L)' },
  { id: 'SALES', labelEN: 'Sales Representative (SO Client)', labelID: 'Sales (Pesanan Klien)' },
  { id: 'SUPER_ADMIN', labelEN: 'Super Admin (Multi-Tenant Platform)', labelID: 'Super Admin (Lintas Tenant)' },
  { id: 'VIEWER', labelEN: 'Viewer (Read Only)', labelID: 'Pengamat (Hanya Baca)' }
];

export const calculateTotalValuation = (productsList) => {
  return (productsList || []).reduce((acc, p) => acc + ((p.cost_price || 0) * (p.stock || 0)), 0);
};
