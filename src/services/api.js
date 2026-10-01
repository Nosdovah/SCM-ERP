// RESTful API Client for MOAI Supply Chain ERP
// Replaces direct Supabase queries and WebSockets with HTTP REST endpoints

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  // Don't set Content-Type header if sending FormData (browser sets boundary automatically)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // 1. Auth API
  auth: {
    login: (email, password) => 
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email, password, company_name, role) => 
      request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, company_name, role }) }),
    logout: () => 
      request('/auth/logout', { method: 'POST' }),
    getMe: () => 
      request('/auth/me'),
    forgotPassword: (email) => 
      request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    updateProfile: (profileData) => 
      request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) })
  },

  // 2. Companies API
  companies: {
    list: () => 
      request('/companies'),
    check: (name) => 
      request(`/companies/check?name=${encodeURIComponent(name)}`),
    create: (name) => 
      request('/companies', { method: 'POST', body: JSON.stringify({ name }) })
  },

  // 3. Company Users (RBAC) API
  companyUsers: {
    list: (company_name) => 
      request(`/company-users?company_name=${encodeURIComponent(company_name)}`),
    create: (user) => 
      request('/company-users', { method: 'POST', body: JSON.stringify(user) }),
    delete: (id) => 
      request(`/company-users/${id}`, { method: 'DELETE' })
  },

  // 4. Orders API (Kanban)
  orders: {
    list: (company_name, priority = 'All', search = '') => {
      let q = `/orders?company_name=${encodeURIComponent(company_name)}`;
      if (priority && priority !== 'All') q += `&priority=${encodeURIComponent(priority)}`;
      if (search) q += `&search=${encodeURIComponent(search)}`;
      return request(q);
    },
    getById: (id) => 
      request(`/orders/${id}`),
    create: (order) => 
      request('/orders', { method: 'POST', body: JSON.stringify(order) }),
    updateStage: (id, stage, user_email, reason) => 
      request(`/orders/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage, user_email, reason }) }),
    updateChecklist: (id, checklistState, user_email, itemText, status, data) => 
      request(`/orders/${id}/checklist`, { method: 'PATCH', body: JSON.stringify({ checklistState, user_email, itemText, status, data }) }),
    delete: (id) => 
      request(`/orders/${id}`, { method: 'DELETE' }),
    deleteByTitle: (title, company_name) => 
      request(`/orders?title=${encodeURIComponent(title)}&company_name=${encodeURIComponent(company_name)}`, { method: 'DELETE' })
  },

  // 5. Items (Master Data) API
  items: {
    list: (company_name) => 
      request(`/items?company_name=${encodeURIComponent(company_name)}`),
    stockList: (company_name) => 
      request(`/items/stock?company_name=${encodeURIComponent(company_name)}`),
    getByName: (name, company_name) => 
      request(`/items/by-name/${encodeURIComponent(name)}?company_name=${encodeURIComponent(company_name)}`),
    create: (item) => 
      request('/items', { method: 'POST', body: JSON.stringify(item) }),
    updateStock: (id, stock_on_hand, increment) => 
      request(`/items/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock_on_hand, increment }) }),
    delete: (id) => 
      request(`/items/${id}`, { method: 'DELETE' })
  },

  // 6. Suppliers (Master Data) API
  suppliers: {
    list: (company_name) => 
      request(`/suppliers?company_name=${encodeURIComponent(company_name)}`),
    create: (supplier) => 
      request('/suppliers', { method: 'POST', body: JSON.stringify(supplier) }),
    delete: (id) => 
      request(`/suppliers/${id}`, { method: 'DELETE' })
  },

  // 7. Order History & Audit Logs API
  orderHistory: {
    list: (company_name, order_id = null, sort = 'desc') => {
      let q = `/order-history?company_name=${encodeURIComponent(company_name)}&sort=${sort}`;
      if (order_id) q += `&order_id=${encodeURIComponent(order_id)}`;
      return request(q);
    },
    getByOrderId: (orderId) => 
      request(`/orders/${orderId}/history`),
    create: (log) => 
      request('/order-history', { method: 'POST', body: JSON.stringify(log) }),
    deleteByOrderId: (orderId) => 
      request(`/orders/${orderId}/history`, { method: 'DELETE' })
  },

  // 8. Notifications API
  notifications: {
    list: (company_name, limit = 20) => 
      request(`/notifications?company_name=${encodeURIComponent(company_name)}&limit=${limit}`)
  },

  // 9. Analytics API
  analytics: {
    getDashboard: (company_name) => 
      request(`/analytics/dashboard?company_name=${encodeURIComponent(company_name)}`)
  },

  // 10. Documents Upload API (Replaces Supabase Storage)
  documents: {
    upload: async (file, order_id, item_id) => {
      const formData = new FormData();
      formData.append('file', file);
      if (order_id) formData.append('order_id', order_id);
      if (item_id) formData.append('item_id', item_id);
      return request('/documents/upload', {
        method: 'POST',
        body: formData
      });
    }
  },

  // 11. Delta Sync API (Replaces WebSockets with Polling / Delta REST)
  sync: {
    orders: (company_name, since) => {
      let q = `/sync/orders?company_name=${encodeURIComponent(company_name)}`;
      if (since) q += `&since=${encodeURIComponent(since)}`;
      return request(q);
    },
    notifications: (company_name, since) => {
      let q = `/sync/notifications?company_name=${encodeURIComponent(company_name)}`;
      if (since) q += `&since=${encodeURIComponent(since)}`;
      return request(q);
    },
    all: (company_name, since) => {
      let q = `/sync/all?company_name=${encodeURIComponent(company_name)}`;
      if (since) q += `&since=${encodeURIComponent(since)}`;
      return request(q);
    }
  }
};

export default api;
