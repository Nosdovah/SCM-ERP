import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage using in-memory buffer (100% compatible with Vercel Serverless & Supabase Storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// -------------------------------------------------------------
// Initialize Supabase Client (Legacy Infrastructure)
// -------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

if (supabase) {
  console.log(`[REST API] Connected to Supabase backend: ${supabaseUrl}`);
} else {
  console.warn(`[REST API] Warning: SUPABASE_URL / VITE_SUPABASE_URL not found. Please provide credentials in .env or Vercel dashboard.`);
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & USER PROFILE ENDPOINTS
// -------------------------------------------------------------

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ session: data.session, user: data.user, error: null });
  }

  // Local fallback if Supabase credentials are not set
  return res.json({
    session: {
      user: { email, user_metadata: { company_name: 'DEFAULT', role: 'Admin' } },
      token: `mock-token-${Date.now()}`
    },
    error: null
  });
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, company_name, role = 'Admin' } = req.body;
  if (!email || !password || !company_name) {
    return res.status(400).json({ error: 'Email, password, and company name are required' });
  }

  const compUpper = company_name.trim().toUpperCase();

  if (supabase) {
    try {
      // 1. Ensure company exists in public.companies
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id, name')
        .ilike('name', compUpper)
        .maybeSingle();

      if (!existingCompany) {
        await supabase.from('companies').insert([{ name: compUpper }]);
      }

      // 2. Sign up user with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { company_name: compUpper, role }
        }
      });
      if (error) return res.status(400).json({ error: error.message });

      // 3. Register user in public.company_users table
      await supabase.from('company_users').upsert(
        [{ company_name: compUpper, user_email: email, role }],
        { onConflict: 'company_name,user_email' }
      );

      return res.status(201).json({ session: data.session, user: data.user, error: null });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(201).json({
    session: {
      user: { email, user_metadata: { company_name: compUpper, role } },
      token: `mock-token-${Date.now()}`
    },
    error: null
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', async (req, res) => {
  if (supabase) {
    await supabase.auth.signOut();
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (supabase) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' });
    return res.json({ user, authenticated: true });
  }
  res.json({ authenticated: true });
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email, redirectTo } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  if (supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || undefined
    });
    if (error) return res.status(400).json({ error: error.message });
  }
  return res.json({ success: true, message: 'Password reset link dispatched.' });
});

// PUT /api/auth/profile
app.put('/api/auth/profile', async (req, res) => {
  const { email, password, company_name, role } = req.body;
  const updates = {};
  if (email) updates.email = email;
  if (password) updates.password = password;
  if (company_name || role) {
    updates.data = {};
    if (company_name) updates.data.company_name = company_name.trim().toUpperCase();
    if (role) updates.data.role = role;
  }

  if (supabase) {
    try {
      if (company_name) {
        await supabase.from('companies').upsert([{ name: updates.data.company_name }], { onConflict: 'name' });
      }
      const { data, error } = await supabase.auth.updateUser(updates);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true, user: data.user });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.json({ success: true, message: 'Profile updated' });
});

// -------------------------------------------------------------
// 2. COMPANIES ENDPOINTS (public.companies)
// -------------------------------------------------------------

// GET /api/companies
app.get('/api/companies', async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('companies').select('*').order('name');
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  res.json([{ name: 'MANUFACTURE' }, { name: 'DEFAULT' }]);
});

// GET /api/companies/check?name=...
app.get('/api/companies/check', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Company name is required' });

  if (supabase) {
    const { data, error } = await supabase.from('companies').select('id, name').ilike('name', name).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ exists: !!data, company: data });
  }
  res.json({ exists: true, company: { name } });
});

// POST /api/companies
app.post('/api/companies', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Company name is required' });
  const compUpper = name.trim().toUpperCase();

  if (supabase) {
    const { data, error } = await supabase.from('companies').upsert([{ name: compUpper }], { onConflict: 'name' }).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data?.[0] || { name: compUpper });
  }
  res.status(201).json({ id: `comp-${Date.now()}`, name: compUpper });
});

// -------------------------------------------------------------
// 3. COMPANY USERS / RBAC ENDPOINTS (public.company_users)
// -------------------------------------------------------------

// GET /api/company-users?company_name=...
app.get('/api/company-users', async (req, res) => {
  const { company_name } = req.query;
  if (supabase) {
    let q = supabase.from('company_users').select('*');
    if (company_name) q = q.eq('company_name', company_name);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  res.json([]);
});

// POST /api/company-users
app.post('/api/company-users', async (req, res) => {
  const { company_name, user_email, role = 'Viewer' } = req.body;
  if (!company_name || !user_email) {
    return res.status(400).json({ error: 'company_name and user_email are required' });
  }

  if (supabase) {
    const { data, error } = await supabase.from('company_users').insert([{ company_name, user_email, role }]).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }
  res.status(201).json([{ id: `cu-${Date.now()}`, company_name, user_email, role }]);
});

// DELETE /api/company-users/:id
app.delete('/api/company-users/:id', async (req, res) => {
  const { id } = req.params;
  if (supabase) {
    const { error } = await supabase.from('company_users').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
  }
  res.json({ success: true, message: 'User deleted' });
});

// -------------------------------------------------------------
// 4. ORDERS ENDPOINTS (public.orders)
// -------------------------------------------------------------

// GET /api/orders?company_name=...
app.get('/api/orders', async (req, res) => {
  const { company_name, priority, search } = req.query;

  if (supabase) {
    let q = supabase.from('orders').select('*');
    if (company_name && company_name !== 'NOT ASSIGNED') {
      q = q.eq('company_name', company_name);
    }
    if (priority && priority !== 'All') {
      q = q.eq('priority', priority);
    }
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    let result = data || [];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(o => 
        (o.title && o.title.toLowerCase().includes(s)) ||
        (o.assignee && o.assignee.toLowerCase().includes(s)) ||
        (o.id && o.id.toLowerCase().includes(s))
      );
    }
    return res.json(result);
  }
  res.json([]);
});

// GET /api/orders/:id
app.get('/api/orders/:id', async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'Order not found' });
    return res.json(data);
  }
  res.status(404).json({ error: 'Order not found' });
});

// POST /api/orders
app.post('/api/orders', async (req, res) => {
  const { id, title, stage, system, priority, assignee, checklistState = {}, company_name = 'DEFAULT', quantity = 1, user_email = 'User' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const newOrder = {
    id: id || `ORD-${Math.floor(Math.random() * 9000) + 1000}`,
    title,
    stage: stage || 'cpo_esta',
    system: system || 'boq',
    priority: priority || 'Medium',
    assignee: assignee || 'Unassigned',
    checklistState,
    company_name,
    quantity: Number(quantity) || 1
  };

  if (supabase) {
    const { data, error } = await supabase.from('orders').insert([newOrder]).select();
    if (error) return res.status(500).json({ error: error.message });

    // Auto-record audit log in order_history
    await supabase.from('order_history').insert([{
      order_id: newOrder.id,
      user_email,
      action: 'Created Order',
      details: { title: newOrder.title, assignee: newOrder.assignee },
      company_name
    }]);

    return res.status(201).json(data?.[0] || newOrder);
  }
  res.status(201).json(newOrder);
});

// PUT /api/orders/:id
app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  if (supabase) {
    const { data, error } = await supabase.from('orders').update(req.body).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data?.[0]);
  }
  res.json({ id, ...req.body });
});

// PATCH /api/orders/:id/stage (Stage advancement/revert + inventory hook)
app.patch('/api/orders/:id/stage', async (req, res) => {
  const { id } = req.params;
  const { stage, user_email = 'User', reason } = req.body;
  if (!stage) return res.status(400).json({ error: 'stage is required' });

  if (supabase) {
    // 1. Get existing order
    const { data: order, error: fetchErr } = await supabase.from('orders').select('*').eq('id', id).single();
    if (fetchErr || !order) return res.status(404).json({ error: 'Order not found' });

    const oldStage = order.stage;

    // 2. Update order stage
    const { data: updated, error: updateErr } = await supabase.from('orders').update({ stage }).eq('id', id).select().single();
    if (updateErr) return res.status(500).json({ error: updateErr.message });

    // 3. Auto-increment inventory stock if order reached warehouse delivery stages
    if (stage === 'wh_inbound' || stage === 'tpp_delivery') {
      const { data: item } = await supabase
        .from('items')
        .select('id, stock_on_hand')
        .eq('name', order.title)
        .eq('company_name', order.company_name)
        .maybeSingle();

      if (item) {
        const newStock = (item.stock_on_hand || 0) + (order.quantity || 1);
        await supabase.from('items').update({ stock_on_hand: newStock }).eq('id', item.id);
      }
    }

    // 4. Log in public.order_history
    const actionText = reason ? 'Reverted Stage' : 'Moved Stage';
    const logDetails = { from: oldStage, to: stage };
    if (reason) logDetails.reason = reason;

    await supabase.from('order_history').insert([{
      order_id: id,
      user_email,
      action: actionText,
      details: logDetails,
      company_name: order.company_name
    }]);

    return res.json({ success: true, order: updated });
  }

  res.json({ success: true, id, stage });
});

// PATCH /api/orders/:id/checklist
app.patch('/api/orders/:id/checklist', async (req, res) => {
  const { id } = req.params;
  const { checklistState, user_email = 'User', itemText, status, data } = req.body;

  if (supabase) {
    const { data: updated, error } = await supabase.from('orders').update({ checklistState }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });

    if (itemText) {
      await supabase.from('order_history').insert([{
        order_id: id,
        user_email,
        action: 'Updated Checklist',
        details: { item: itemText, status: status || 'Toggled', data },
        company_name: updated.company_name
      }]);
    }

    return res.json({ success: true, order: updated });
  }

  res.json({ success: true, id, checklistState });
});

// DELETE /api/orders/:id
app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  if (supabase) {
    const { error: delErr } = await supabase.from('orders').delete().eq('id', id);
    if (delErr) return res.status(500).json({ error: delErr.message });
    // Also clear associated history
    await supabase.from('order_history').delete().eq('order_id', id);
  }
  res.json({ success: true, message: 'Order deleted' });
});

// DELETE /api/orders (Bulk delete by item title)
app.delete('/api/orders', async (req, res) => {
  const { title, company_name } = req.query;
  if (!title) return res.status(400).json({ error: 'title query parameter is required' });

  if (supabase) {
    let q = supabase.from('orders').delete().eq('title', title);
    if (company_name) q = q.eq('company_name', company_name);
    const { error } = await q;
    if (error) return res.status(500).json({ error: error.message });
  }
  res.json({ success: true, message: 'Orders deleted for title' });
});

// -------------------------------------------------------------
// 5. MASTER DATA: ITEMS / SKUS (public.items)
// -------------------------------------------------------------

// GET /api/items?company_name=...
app.get('/api/items', async (req, res) => {
  const { company_name } = req.query;
  if (supabase) {
    let q = supabase.from('items').select('*, suppliers(name)');
    if (company_name) q = q.eq('company_name', company_name);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  res.json([]);
});

// GET /api/items/stock?company_name=...
app.get('/api/items/stock', async (req, res) => {
  const { company_name } = req.query;
  if (supabase) {
    let q = supabase.from('items').select('name, stock_on_hand');
    if (company_name) q = q.eq('company_name', company_name);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  res.json([]);
});

// GET /api/items/by-name/:name
app.get('/api/items/by-name/:name', async (req, res) => {
  const { name } = req.params;
  const { company_name } = req.query;
  if (supabase) {
    let q = supabase.from('items').select('*, suppliers(name)').eq('name', name);
    if (company_name) q = q.eq('company_name', company_name);
    const { data, error } = await q.maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Item not found' });
    return res.json(data);
  }
  res.status(404).json({ error: 'Item not found' });
});

// POST /api/items
app.post('/api/items', async (req, res) => {
  const { sku, name, category, supplier_id, company_name = 'DEFAULT', unit_price = 0, stock_on_hand = 0 } = req.body;
  if (!sku || !name) return res.status(400).json({ error: 'sku and name are required' });

  const newItem = {
    sku,
    name,
    category,
    supplier_id: supplier_id || null,
    company_name,
    unit_price: Number(unit_price) || 0,
    stock_on_hand: Number(stock_on_hand) || 0
  };

  if (supabase) {
    const { data, error } = await supabase.from('items').insert([newItem]).select('*, suppliers(name)');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }
  res.status(201).json([newItem]);
});

// PATCH /api/items/:id/stock
app.patch('/api/items/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { stock_on_hand, increment } = req.body;

  if (supabase) {
    let newStock = stock_on_hand;
    if (typeof increment === 'number') {
      const { data: cur } = await supabase.from('items').select('stock_on_hand').eq('id', id).single();
      newStock = (cur?.stock_on_hand || 0) + increment;
    }
    const { data, error } = await supabase.from('items').update({ stock_on_hand: newStock }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, item: data });
  }
  res.json({ success: true });
});

// DELETE /api/items/:id
app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  if (supabase) {
    // 1. Get item name for cascade delete
    const { data: item } = await supabase.from('items').select('name, company_name').eq('id', id).single();
    if (item) {
      await supabase.from('orders').delete().eq('title', item.name).eq('company_name', item.company_name);
    }
    // 2. Delete item
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
  }
  res.json({ success: true, message: 'Item and linked orders deleted' });
});

// -------------------------------------------------------------
// 6. MASTER DATA: SUPPLIERS (public.suppliers)
// -------------------------------------------------------------

// GET /api/suppliers?company_name=...
app.get('/api/suppliers', async (req, res) => {
  const { company_name } = req.query;
  if (supabase) {
    let q = supabase.from('suppliers').select('*');
    if (company_name) q = q.eq('company_name', company_name);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  res.json([]);
});

// POST /api/suppliers
app.post('/api/suppliers', async (req, res) => {
  const { name, company_name = 'DEFAULT' } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  if (supabase) {
    const { data, error } = await supabase.from('suppliers').insert([{ name, company_name }]).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }
  res.status(201).json([{ id: `sup-${Date.now()}`, name, company_name }]);
});

// DELETE /api/suppliers/:id
app.delete('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  if (supabase) {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
  }
  res.json({ success: true, message: 'Supplier deleted' });
});

// -------------------------------------------------------------
// 7. ORDER HISTORY & AUDIT LOGS (public.order_history)
// -------------------------------------------------------------

// GET /api/order-history?company_name=...
app.get('/api/order-history', async (req, res) => {
  const { company_name, order_id, sort = 'desc' } = req.query;
  if (supabase) {
    let q = supabase.from('order_history').select('*');
    if (company_name) q = q.eq('company_name', company_name);
    if (order_id) q = q.eq('order_id', order_id);
    const { data, error } = await q.order('created_at', { ascending: sort === 'asc' });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  res.json([]);
});

// GET /api/orders/:id/history
app.get('/api/orders/:id/history', async (req, res) => {
  const { id } = req.params;
  if (supabase) {
    const { data, error } = await supabase.from('order_history').select('*').eq('order_id', id).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  res.json([]);
});

// POST /api/order-history
app.post('/api/order-history', async (req, res) => {
  const { order_id, user_email = 'Unknown', action, details = {}, company_name = 'DEFAULT' } = req.body;
  if (!order_id || !action) return res.status(400).json({ error: 'order_id and action are required' });

  if (supabase) {
    const { data, error } = await supabase.from('order_history').insert([{
      order_id,
      user_email,
      action,
      details,
      company_name
    }]).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data?.[0]);
  }
  res.status(201).json({ order_id, action, details });
});

// DELETE /api/orders/:id/history
app.delete('/api/orders/:id/history', async (req, res) => {
  if (supabase) {
    await supabase.from('order_history').delete().eq('order_id', req.params.id);
  }
  res.json({ success: true, message: 'History cleared for order' });
});

// -------------------------------------------------------------
// 8. NOTIFICATIONS ENDPOINT
// -------------------------------------------------------------

// GET /api/notifications?company_name=...&limit=20
app.get('/api/notifications', async (req, res) => {
  const { company_name, limit = 20 } = req.query;
  if (supabase) {
    let q = supabase.from('order_history').select('*');
    if (company_name && company_name !== 'NOT ASSIGNED') {
      q = q.eq('company_name', company_name);
    }
    const { data, error } = await q.order('created_at', { ascending: false }).limit(Number(limit));
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  }
  res.json([]);
});

// -------------------------------------------------------------
// 9. ANALYTICS AGGREGATION ENDPOINT
// -------------------------------------------------------------

// GET /api/analytics/dashboard?company_name=...
app.get('/api/analytics/dashboard', async (req, res) => {
  const { company_name = 'DEFAULT' } = req.query;

  if (supabase) {
    try {
      const [
        { data: historyData }, 
        { data: activeOrders },
        { data: items }
      ] = await Promise.all([
        supabase.from('order_history').select('*').eq('company_name', company_name).order('created_at', { ascending: true }),
        supabase.from('orders').select('id, title, quantity').eq('company_name', company_name),
        supabase.from('items').select('name, unit_price, stock_on_hand').eq('company_name', company_name)
      ]);

      const activeOrderIds = new Set((activeOrders || []).map(o => o.id));
      const filteredHistory = (historyData || []).filter(log => activeOrderIds.has(log.order_id));

      const stageTimes = {};
      const orders = {};
      filteredHistory.forEach(log => {
        if (!orders[log.order_id]) orders[log.order_id] = [];
        orders[log.order_id].push(log);
      });

      Object.values(orders).forEach(orderLogs => {
        const sorted = orderLogs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        for (let i = 0; i < sorted.length - 1; i++) {
          const current = sorted[i];
          const next = sorted[i + 1];
          const stageId = current.details?.stageId || current.details?.to;
          if (stageId) {
            const durationMs = new Date(next.created_at) - new Date(current.created_at);
            if (durationMs >= 0) {
              if (!stageTimes[stageId]) stageTimes[stageId] = [];
              stageTimes[stageId].push(durationMs);
            }
          }
        }
      });

      const avgLeadTimes = {};
      let maxAvgDuration = -1;
      let bottleneckStage = null;

      Object.keys(stageTimes).forEach(stageId => {
        const times = stageTimes[stageId];
        const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
        avgLeadTimes[stageId] = Math.round(avgMs / 60000); // minutes
        if (avgMs > maxAvgDuration) {
          maxAvgDuration = avgMs;
          bottleneckStage = stageId;
        }
      });

      const inventoryValue = (items || []).reduce((sum, item) => sum + ((item.unit_price || 0) * (item.stock_on_hand || 0)), 0);
      const lowStockItems = (items || []).filter(i => (i.stock_on_hand || 0) < 50).length;

      return res.json({
        avgLeadTimes,
        bottleneckStage,
        totalOrders: (activeOrders || []).length,
        inventoryValue,
        lowStockItems,
        historyData: historyData || [],
        activeOrders: activeOrders || [],
        items: items || []
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.json({ avgLeadTimes: {}, totalOrders: 0, inventoryValue: 0, lowStockItems: 0 });
});

// -------------------------------------------------------------
// 10. DOCUMENTS & FILE UPLOADS (Supabase Storage: 'documents' bucket)
// -------------------------------------------------------------

// POST /api/documents/upload
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileExt = req.file.originalname.split('.').pop();
  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${req.body.order_id || 'doc'}-${Date.now()}-${safeName}`;

  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (error) {
        console.error('[Storage Error]', error);
        return res.status(400).json({ error: error.message });
      }

      const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName);
      return res.json({
        success: true,
        fileName,
        publicUrl: publicUrlData.publicUrl
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Mock response if no storage configured
  return res.json({
    success: true,
    fileName,
    publicUrl: `https://placeholder.supabase.co/storage/v1/object/public/documents/${fileName}`
  });
});

// -------------------------------------------------------------
// 11. WEBSOCKETS REPLACEMENT: REST POLLING & DELTA SYNC
// -------------------------------------------------------------

// GET /api/sync/orders?company_name=...&since=<ISO_TIMESTAMP>
app.get('/api/sync/orders', async (req, res) => {
  const { company_name, since } = req.query;

  if (supabase) {
    let q = supabase.from('orders').select('*');
    if (company_name && company_name !== 'NOT ASSIGNED') {
      q = q.eq('company_name', company_name);
    }
    if (since) {
      q = q.gt('created_at', since);
    }
    const { data } = await q.order('created_at', { ascending: false });
    return res.json({
      orders: data || [],
      lastSync: new Date().toISOString()
    });
  }

  res.json({ orders: [], lastSync: new Date().toISOString() });
});

// GET /api/sync/notifications?company_name=...&since=<ISO_TIMESTAMP>
app.get('/api/sync/notifications', async (req, res) => {
  const { company_name, since } = req.query;

  if (supabase) {
    let q = supabase.from('order_history').select('*');
    if (company_name && company_name !== 'NOT ASSIGNED') {
      q = q.eq('company_name', company_name);
    }
    if (since) {
      q = q.gt('created_at', since);
    }
    const { data } = await q.order('created_at', { ascending: false }).limit(20);
    return res.json({
      notifications: data || [],
      newCount: data?.length || 0,
      lastSync: new Date().toISOString()
    });
  }

  res.json({ notifications: [], newCount: 0, lastSync: new Date().toISOString() });
});

// GET /api/sync/all?company_name=...&since=<ISO_TIMESTAMP>
app.get('/api/sync/all', async (req, res) => {
  const { company_name, since } = req.query;

  if (supabase) {
    let ordersQ = supabase.from('orders').select('*');
    let notifQ = supabase.from('order_history').select('*');

    if (company_name && company_name !== 'NOT ASSIGNED') {
      ordersQ = ordersQ.eq('company_name', company_name);
      notifQ = notifQ.eq('company_name', company_name);
    }
    if (since) {
      ordersQ = ordersQ.gt('created_at', since);
      notifQ = notifQ.gt('created_at', since);
    }

    const [{ data: orders }, { data: notifications }] = await Promise.all([
      ordersQ.order('created_at', { ascending: false }),
      notifQ.order('created_at', { ascending: false }).limit(20)
    ]);

    return res.json({
      orders: orders || [],
      notifications: notifications || [],
      lastSync: new Date().toISOString()
    });
  }

  res.json({ orders: [], notifications: [], lastSync: new Date().toISOString() });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    backend: supabase ? 'Supabase PostgreSQL + Storage' : 'Mock/Local',
    timestamp: new Date().toISOString()
  });
});

// Start local dev server if run directly (and not on Vercel Serverless)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 MOAI SCM-ERP REST API Server running on port ${PORT}`);
    console.log(`   Base URL: http://localhost:${PORT}/api`);
    console.log(`   Supabase: ${supabaseUrl || 'Not configured in env'}`);
    console.log(`====================================================`);
  });
}

// Export for Vercel Serverless Function handler
export default app;
