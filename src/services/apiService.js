// Centralized REST API Service for MOAI ERP v2.0 Operations Modules
const BASE_URL = '/api';

const fetchJson = async (url, options = {}) => {
  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    if (!res.ok) {
      console.warn(`[REST API] HTTP ${res.status} on ${url}`);
      return null;
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.warn(`[REST API] Network error on ${url}:`, err.message);
    return null;
  }
};

export const apiService = {
  // Modul 1: Inventory Management & Serial Registry
  inventory: {
    getBalances: () => fetchJson('/v2/inventory/balances'),
    getSerials: () => fetchJson('/v2/inventory/serials'),
    getMovements: () => fetchJson('/v2/inventory/movements'),
    getTransfers: () => fetchJson('/v2/inventory/transfers'),
    postTransfer: (data) => fetchJson('/v2/inventory/transfers', { method: 'POST', body: JSON.stringify(data) }),
    getAdjustments: () => fetchJson('/v2/inventory/adjustments'),
    postAdjustment: (data) => fetchJson('/v2/inventory/adjustments', { method: 'POST', body: JSON.stringify(data) }),
    getRMACases: () => fetchJson('/v2/inventory/rma'),
    postRMA: (data) => fetchJson('/v2/inventory/rma', { method: 'POST', body: JSON.stringify(data) })
  },

  // Modul 2: Supply Chain Management (SCM) & Inbound
  scm: {
    getPurchaseOrders: () => fetchJson('/v2/scm/purchase-orders'),
    createPurchaseOrder: (data) => fetchJson('/v2/scm/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    getRequisitions: () => fetchJson('/v2/scm/requisitions'),
    convertRequisition: (id) => fetchJson(`/v2/scm/requisitions/${id}/convert`, { method: 'POST' }),
    getGoodsReceipts: () => fetchJson('/v2/scm/goods-receipts'),
    getQCInspections: () => fetchJson('/v2/scm/qc-inspections'),
    qcAction: (id, data) => fetchJson(`/v2/scm/qc-inspections/${id}/action`, { method: 'POST', body: JSON.stringify(data) }),
    getRTV: () => fetchJson('/v2/scm/rtv'),
    createRTV: (data) => fetchJson('/v2/scm/rtv', { method: 'POST', body: JSON.stringify(data) })
  },

  // Modul 3: Bill of Materials (BOM) & Assembly Engine
  assembly: {
    getBOMs: () => fetchJson('/v2/assembly/boms'),
    getOrders: () => fetchJson('/v2/assembly/orders'),
    createOrder: (data) => fetchJson('/v2/assembly/orders', { method: 'POST', body: JSON.stringify(data) }),
    completeOrder: (id) => fetchJson(`/v2/assembly/orders/${id}/complete`, { method: 'PATCH' }),
    debundle: (data) => fetchJson('/v2/assembly/debundle', { method: 'POST', body: JSON.stringify(data) }),
    simulate: (data) => fetchJson('/v2/assembly/simulate', { method: 'POST', body: JSON.stringify(data) })
  },

  // Modul 4: Outbound / Sales & Fulfillment
  outbound: {
    getSalesOrders: () => fetchJson('/v2/outbound/sales-orders'),
    createSalesOrder: (data) => fetchJson('/v2/outbound/sales-orders', { method: 'POST', body: JSON.stringify(data) }),
    getDeliveryNotes: () => fetchJson('/v2/outbound/delivery-notes'),
    createDeliveryNote: (data) => fetchJson('/v2/outbound/delivery-notes', { method: 'POST', body: JSON.stringify(data) }),
    getPackTasks: () => fetchJson('/v2/outbound/pack-tasks'),
    createPackTask: (data) => fetchJson('/v2/outbound/pack-tasks', { method: 'POST', body: JSON.stringify(data) }),
    wavePicking: (data) => fetchJson('/v2/outbound/pick-tasks/wave', { method: 'POST', body: JSON.stringify(data) })
  },

  // Modul 5: Finance & Costing
  finance: {
    getCOGS: () => fetchJson('/v2/finance/cogs'),
    getAPBills: () => fetchJson('/v2/finance/ap-bills'),
    payAPBill: (id) => fetchJson(`/v2/finance/ap-bills/${id}/pay`, { method: 'POST' }),
    getARInvoices: () => fetchJson('/v2/finance/ar-invoices'),
    reconcileARInvoice: (id) => fetchJson(`/v2/finance/ar-invoices/${id}/reconcile`, { method: 'POST' })
  },

  // Modul 6: Master Data v2.0
  masterData: {
    getProducts: () => fetchJson('/v2/master/products'),
    createProduct: (data) => fetchJson('/v2/master/products', { method: 'POST', body: JSON.stringify(data) }),
    getBins: () => fetchJson('/v2/master/bins'),
    createBin: (data) => fetchJson('/v2/master/bins', { method: 'POST', body: JSON.stringify(data) }),
    getWarehouses: () => fetchJson('/v2/master/warehouses'),
    getZones: () => fetchJson('/v2/master/zones'),
    getBrands: () => fetchJson('/v2/master/brands'),
    getSuppliers: () => fetchJson('/v2/master/suppliers'),
    createSupplier: (data) => fetchJson('/v2/master/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    getClients: () => fetchJson('/v2/master/clients'),
    createClient: (data) => fetchJson('/v2/master/clients', { method: 'POST', body: JSON.stringify(data) })
  }
};
