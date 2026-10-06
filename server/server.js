import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { 
  initialWarehouses, initialZones, initialBins, initialBrands, 
  initialProducts, initialSuppliers, initialClients, initialSerials, 
  initialStockMovements, initialBOM, initialAssemblyOrders, 
  initialPurchaseOrders, initialRequisitions, initialSalesOrders,
  initialApBills, initialArInvoices, initialGRNList, calculateTotalValuation
} from '../src/data/v2Data.js';

// Auto-load .env file if it exists at project root
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  try {
    const envData = fs.readFileSync(envPath, 'utf8');
    envData.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)?$/);
        if (match) {
          const key = match[1];
          let value = (match[2] || '').trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  } catch (err) {
    console.error('Error reading .env file:', err);
  }
}

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

// Local in-memory fallback stores (used when offline or when Supabase keys are not set)
let fallbackOrders = [
  {
    id: 'ORD-8942',
    title: 'MSI Modern Series (Low): Full Polycarbonate, Slim Bezel',
    stage: 'cpo_esta',
    system: 'boq',
    priority: 'High',
    assignee: 'Budi Santoso',
    checklistState: {},
    company_name: 'MANUFACTURE',
    quantity: 50,
    created_at: new Date().toISOString()
  }
];

let fallbackHistory = [
  {
    id: 'hist-1',
    order_id: 'ORD-8942',
    user_email: 'admin@manufacture.com',
    action: 'Created Order',
    details: { title: 'MSI Modern Series (Low): Full Polycarbonate, Slim Bezel', assignee: 'Budi Santoso' },
    company_name: 'MANUFACTURE',
    created_at: new Date().toISOString()
  }
];

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
  let localResult = fallbackOrders;
  if (company_name && company_name !== 'NOT ASSIGNED') {
    localResult = localResult.filter(o => o.company_name === company_name);
  }
  res.json(localResult);
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
  fallbackOrders.unshift(newOrder);
  fallbackHistory.unshift({
    id: `hist-${Date.now()}`,
    order_id: newOrder.id,
    user_email,
    action: 'Created Order',
    details: { title: newOrder.title, assignee: newOrder.assignee },
    company_name,
    created_at: new Date().toISOString()
  });
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
  fallbackOrders = fallbackOrders.filter(o => o.id !== id);
  fallbackHistory = fallbackHistory.filter(h => h.order_id !== id);
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
  res.json(fallbackHistory.filter(h => h.order_id === req.params.id));
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

  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${req.body.order_id || 'doc'}-${Date.now()}-${safeName}`;

  if (supabase) {
    try {
      const { error } = await supabase.storage
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

// -------------------------------------------------------------
// 12. MOAI ERP v2.0 REST API (REVAMPED 6 MODULES - BLUEPRINT SPEC)
// Domain: Computer Distributor & Integrator (Prebuilt, Barebone, Spare Parts)
// -------------------------------------------------------------

let v2Products = initialProducts.map(p => ({ ...p }));
let v2Warehouses = initialWarehouses.map(w => ({ ...w }));
let v2Zones = initialZones.map(z => ({ ...z }));
let v2Bins = initialBins.map(b => ({ ...b }));
let v2Brands = initialBrands.map(b => ({ ...b }));
let v2Suppliers = initialSuppliers.map(s => ({ ...s }));
let v2Clients = initialClients.map(c => ({ ...c }));
let v2Serials = initialSerials.map(s => ({ ...s }));
let v2Movements = initialStockMovements.map(m => ({ ...m }));
let v2BOM = { ...initialBOM, components: initialBOM.components.map(c => ({ ...c })) };
let v2AssemblyOrders = initialAssemblyOrders.map(a => ({ ...a }));
let v2PurchaseOrders = initialPurchaseOrders.map(p => ({ ...p }));
let v2Requisitions = initialRequisitions.map(r => ({ ...r }));
let v2SalesOrders = initialSalesOrders.map(s => ({ ...s }));
let v2ApBills = initialApBills.map(b => ({ ...b }));
let v2ArInvoices = initialArInvoices.map(i => ({ ...i }));
let v2GRNList = initialGRNList.map(g => ({ ...g }));

let v2QCInspections = [
  {
    id: 'qc-01',
    inspection_number: 'QC-2026-0012',
    gr_id: 'grn-01',
    gr_number: 'GRN-2026-0043',
    warehouse_id: 'wh-01',
    inspector: 'Budi Inspector',
    status: 'PENDING',
    qty_inspected: 15,
    qty_pass: 15,
    qty_fail: 0,
    created_at: new Date().toISOString()
  }
];

let v2Payments = [
  {
    id: 'pay-01',
    payment_number: 'PAY-2026-0011',
    type: 'AP',
    ref_bill_id: 'ap-01',
    amount: 88500000,
    currency: 'IDR',
    method: 'transfer',
    paid_at: '2026-09-30',
    note: 'Pembayaran PO Synnex via BCA Virtual Account'
  }
];

let v2PickTasks = [
  {
    id: 'pick-01',
    pick_number: 'PICK-2026-0081',
    so_id: 'so-02',
    so_number: 'SO-2026-0102',
    warehouse_id: 'wh-01',
    type: 'single',
    status: 'IN_PROGRESS',
    assigned_to: 'Ahmad Outbound',
    items_count: 10,
    started_at: '2026-10-01 10:00'
  }
];

let v2PackTasks = [
  {
    id: 'pack-01',
    pack_number: 'PACK-2026-0052',
    pick_task_id: 'pick-01',
    so_id: 'so-02',
    status: 'PACKING',
    packed_by: 'Siti Logistik',
    box_count: 2,
    total_weight_kg: 18.5,
    created_at: '2026-10-01 14:00'
  }
];

let v2DeliveryNotes = [
  {
    id: 'sj-01',
    sj_number: 'SJ-2026-0089',
    so_id: 'so-01',
    so_number: 'SO-2026-0101',
    client_name: 'PT Telko Solusi Nusantara',
    driver_name: 'Joko Prabowo',
    vehicle_no: 'B 9281 KCA',
    status: 'DELIVERED',
    delivered_at: '2026-09-28 14:30',
    received_by: 'Pak Doni (IT Telko)'
  }
];

let v2RTVCases = [
  {
    id: 'rtv-01',
    rtv_number: 'RTV-2026-0004',
    supplier_name: 'PT Asus Technology Indonesia',
    product_name: 'ASUS TUF GAMING B650-PLUS WIFI',
    qty: 1,
    serial_no: 'SN-ASUS-MB-009',
    reason: 'Defective audio chip upon receiving QC',
    status: 'SHIPPED',
    shipped_at: '2026-09-29'
  }
];

let v2RMACases = [
  {
    id: 'rma-01',
    rma_number: 'RMA-2026-0005',
    direction: 'CUSTOMER_RETURN',
    client_name: 'PT Telko Solusi Nusantara',
    serial_no: 'SN-ARES-PC-002',
    product_name: 'MOAI Ares Elite Gaming PC',
    qty: 1,
    reason: 'defective',
    status: 'INSPECTING',
    opened_at: '2026-10-01 16:10',
    disposition: 'pending'
  }
];

let v2WorkerActivities = [
  { worker: 'Ahmad Outbound', role: 'Admin Picking', lines_picked: 142, units: 280, accuracy: '99.4%', avg_time_task: '4.2 min' },
  { worker: 'Siti Logistik', role: 'Admin Packing', orders_packed: 68, units: 195, accuracy: '99.8%', avg_time_order: '6.5 min' },
  { worker: 'Doni Return', role: 'Admin Return (RMA)', returns_processed: 12, resolved_value: 48500000, avg_time_res: '1.2 days' },
  { worker: 'Bambang Perakitan', role: 'Assembly & QC', units_built: 8, components_issued: 56, bom_accuracy: '100%', defect_rate: '0.0%' }
];

// --- MODULE 5: MASTER DATA ENDPOINTS ---
app.get('/api/v2/master/products', async (req, res) => {
  const { category, item_type, search } = req.query;
  if (supabase) {
    try {
      let q = supabase.from('products').select('*');
      if (category) q = q.eq('category', category);
      if (item_type) q = q.eq('item_type', item_type);
      if (search) q = q.ilike('name', `%${search}%`);
      const { data, error } = await q;
      if (!error && data && data.length > 0) return res.json(data);
    } catch {
      // fallback to in-memory store
    }
  }
  let results = [...v2Products];
  if (category) results = results.filter(p => p.category === category);
  if (item_type) results = results.filter(p => p.item_type === item_type);
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.barcode.includes(s));
  }
  res.json(results);
});

app.post('/api/v2/master/products', async (req, res) => {
  const newProduct = {
    id: `prod-${Date.now()}`,
    ...req.body,
    unit_price: Number(req.body.unit_price) || 0,
    cost_price: Number(req.body.cost_price) || 0,
    stock: Number(req.body.stock) || 0,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
      if (!error && data) {
        v2Products.unshift(data);
        return res.status(201).json(data);
      }
    } catch {
      // fallback
    }
  }
  v2Products.unshift(newProduct);
  res.status(201).json(newProduct);
});

app.get('/api/v2/master/products/:id', (req, res) => {
  const p = v2Products.find(item => item.id === req.params.id || item.sku === req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});

app.get('/api/v2/master/warehouses', (_req, res) => res.json(v2Warehouses));
app.get('/api/v2/master/zones', (_req, res) => res.json(v2Zones));
app.get('/api/v2/master/bins', (_req, res) => res.json(v2Bins));
app.post('/api/v2/master/bins', (req, res) => {
  const newBin = { id: `bin-${Date.now()}`, ...req.body };
  v2Bins.push(newBin);
  res.status(201).json(newBin);
});
app.get('/api/v2/master/brands', (_req, res) => res.json(v2Brands));
app.get('/api/v2/master/suppliers', (_req, res) => res.json(v2Suppliers));
app.post('/api/v2/master/suppliers', (req, res) => {
  const newSupp = { id: `supp-${Date.now()}`, ...req.body };
  v2Suppliers.unshift(newSupp);
  res.status(201).json(newSupp);
});
app.get('/api/v2/master/clients', (_req, res) => res.json(v2Clients));
app.post('/api/v2/master/clients', (req, res) => {
  const newClient = { id: `cli-${Date.now()}`, ...req.body };
  v2Clients.unshift(newClient);
  res.status(201).json(newClient);
});
app.get('/api/v2/master/operational', (_req, res) => {
  const opData = v2Products.map(p => ({
    product_id: p.id,
    sku: p.sku,
    min_stock: 5,
    max_stock: 50,
    reorder_point: 10,
    reorder_qty: 20,
    safety_stock: 5,
    is_fast_moving: p.item_type === 'SPARE_PART'
  }));
  res.json(opData);
});

// --- MODULE 1: INVENTORY MANAGEMENT & SERIAL REGISTRY ENDPOINTS ---
app.get('/api/v2/inventory/movements', (_req, res) => res.json(v2Movements));

app.post('/api/v2/inventory/movements', (req, res) => {
  const movement = {
    id: `mov-${Date.now()}`,
    ...req.body,
    qty: Number(req.body.qty) || 0,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };
  // Golden rule: Insert-only into immutable ledger
  v2Movements.unshift(movement);

  // Update corresponding product stock
  const prod = v2Products.find(p => p.sku === movement.sku || p.name === movement.product_name);
  if (prod) {
    prod.stock = Math.max(0, prod.stock + movement.qty);
  }
  res.status(201).json(movement);
});

app.get('/api/v2/inventory/balances', (_req, res) => {
  const totalValuation = calculateTotalValuation(v2Products);
  const byCategory = {
    PREBUILT: v2Products.filter(p => p.item_type === 'PREBUILT').reduce((acc, p) => acc + (p.cost_price * p.stock), 0),
    BAREBONE: v2Products.filter(p => p.item_type === 'BAREBONE').reduce((acc, p) => acc + (p.cost_price * p.stock), 0),
    SPARE_PART: v2Products.filter(p => p.item_type === 'SPARE_PART').reduce((acc, p) => acc + (p.cost_price * p.stock), 0)
  };
  res.json({
    total_sku: v2Products.length,
    total_valuation: totalValuation,
    by_category: byCategory,
    products: v2Products.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      item_type: p.item_type,
      stock_on_hand: p.stock,
      allocated: 2,
      available: Math.max(0, p.stock - 2),
      bin_code: p.bin_code,
      cost_price: p.cost_price,
      valuation: p.cost_price * p.stock
    }))
  });
});

app.get('/api/v2/inventory/serials', (req, res) => {
  const { status, sku } = req.query;
  let results = [...v2Serials];
  if (status) results = results.filter(s => s.status === status);
  if (sku) results = results.filter(s => s.sku === sku);
  res.json(results);
});

app.get('/api/v2/inventory/serials/:serial_no', (req, res) => {
  const sn = v2Serials.find(s => s.serial_no === req.params.serial_no);
  if (!sn) return res.status(404).json({ error: 'Serial number not found in registry' });
  res.json({
    ...sn,
    history: v2Movements.filter(m => m.ref_doc?.includes(sn.serial_no) || m.product_name === sn.product_name)
  });
});

app.post('/api/v2/inventory/serials', (req, res) => {
  const newSN = { id: `sn-${Date.now()}`, ...req.body, created_at: new Date().toISOString() };
  v2Serials.unshift(newSN);
  res.status(201).json(newSN);
});

app.get('/api/v2/inventory/transfers', (_req, res) => {
  const trfMovements = v2Movements.filter(m => m.movement_type.startsWith('TRF_'));
  res.json(trfMovements);
});

app.post('/api/v2/inventory/transfers', (req, res) => {
  const { product_sku, from_bin, to_bin, qty } = req.body;
  const prod = v2Products.find(p => p.sku === product_sku);
  const numQty = Number(qty) || 1;
  const refCode = `TRF-${Date.now().toString().slice(-4)}`;
  const timeNow = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const movOut = {
    id: `mov-${Date.now()}`,
    movement_type: 'TRF_OUT',
    product_name: prod ? prod.name : product_sku,
    qty: -numQty,
    bin_code: from_bin,
    ref_doc: refCode,
    unit_cost: prod ? prod.cost_price : 0,
    created_at: timeNow,
    created_by: 'Inventory Staff'
  };
  const movIn = {
    id: `mov-${Date.now() + 1}`,
    movement_type: 'TRF_IN',
    product_name: prod ? prod.name : product_sku,
    qty: numQty,
    bin_code: to_bin,
    ref_doc: refCode,
    unit_cost: prod ? prod.cost_price : 0,
    created_at: timeNow,
    created_by: 'Inventory Staff'
  };

  v2Movements.unshift(movIn, movOut);
  res.status(201).json({ success: true, ref: refCode, movements: [movOut, movIn] });
});

app.get('/api/v2/inventory/adjustments', (_req, res) => {
  const adjMovements = v2Movements.filter(m => m.movement_type.startsWith('ADJ_'));
  res.json(adjMovements);
});

app.post('/api/v2/inventory/adjustments', (req, res) => {
  const { product_sku, bin_code, qty, reason, note } = req.body;
  const prod = v2Products.find(p => p.sku === product_sku);
  const numQty = Number(qty) || 0;
  const movType = numQty >= 0 ? 'ADJ_IN' : 'ADJ_OUT';

  const mov = {
    id: `mov-${Date.now()}`,
    movement_type: movType,
    product_name: prod ? prod.name : product_sku,
    qty: numQty,
    bin_code: bin_code,
    ref_doc: `ADJ-${Date.now().toString().slice(-4)}`,
    unit_cost: prod ? prod.cost_price : 0,
    note: `${reason}: ${note || ''}`,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
    created_by: 'Supervisor'
  };

  v2Movements.unshift(mov);
  if (prod) prod.stock = Math.max(0, prod.stock + numQty);
  res.status(201).json({ success: true, movement: mov });
});

app.get('/api/v2/inventory/aging', (_req, res) => {
  res.json({
    buckets: {
      '0_30_days': { qty: 110, value: 420000000 },
      '31_60_days': { qty: 45, value: 180000000 },
      '61_90_days': { qty: 20, value: 160000000 },
      '91_180_days': { qty: 12, value: 84150000 },
      'over_180_days': { qty: 4, value: 45700000 }
    },
    idle_capital: 45700000,
    movement_classes: {
      fast: ['SP-SSD-990P-1T', 'SP-RAM-DDR5-32G', 'SP-CPU-7800X3D'],
      medium: ['PB-ARES-78X', 'PB-OFFICE-134', 'BB-NUC13-PRO'],
      slow: ['SP-CASE-CC560', 'SP-PSU-RM750E'],
      dead: ['SP-MB-B650PLUS (Old Batch)']
    }
  });
});

app.get('/api/v2/inventory/rma', (_req, res) => res.json(v2RMACases));
app.post('/api/v2/inventory/rma', (req, res) => {
  const newRMA = {
    id: `rma-${Date.now()}`,
    rma_number: `RMA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    ...req.body,
    status: 'INSPECTING',
    opened_at: new Date().toISOString()
  };
  v2RMACases.unshift(newRMA);

  // If serialized, update serial status
  if (newRMA.serial_no) {
    const sn = v2Serials.find(s => s.serial_no === newRMA.serial_no);
    if (sn) sn.status = 'RMA';
  }
  res.status(201).json(newRMA);
});

// --- MODULE 3: SUPPLY CHAIN MANAGEMENT (SCM) ENDPOINTS ---
app.get('/api/v2/scm/purchase-orders', (_req, res) => res.json(v2PurchaseOrders));

app.post('/api/v2/scm/purchase-orders', (req, res) => {
  const newPO = {
    id: `po-${Date.now()}`,
    po_number: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'APPROVED',
    order_date: new Date().toISOString().substring(0, 10),
    expected_date: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
    ...req.body
  };
  v2PurchaseOrders.unshift(newPO);
  res.status(201).json(newPO);
});

app.patch('/api/v2/scm/purchase-orders/:id/status', (req, res) => {
  const po = v2PurchaseOrders.find(p => p.id === req.params.id || p.po_number === req.params.id);
  if (!po) return res.status(404).json({ error: 'Purchase Order not found' });
  po.status = req.body.status || po.status;
  res.json(po);
});

app.get('/api/v2/scm/requisitions', (_req, res) => res.json(v2Requisitions));

app.post('/api/v2/scm/requisitions', (req, res) => {
  const newPR = {
    id: `pr-${Date.now()}`,
    pr_number: `PR-AUTO-${Math.floor(100 + Math.random() * 900)}`,
    source: req.body.source || 'AUTO_REORDER',
    status: 'OPEN',
    generated_at: new Date().toISOString(),
    ...req.body
  };
  v2Requisitions.unshift(newPR);
  res.status(201).json(newPR);
});

app.post('/api/v2/scm/requisitions/:id/convert', (req, res) => {
  const pr = v2Requisitions.find(r => r.id === req.params.id);
  if (!pr) return res.status(404).json({ error: 'Requisition not found' });

  pr.status = 'CONVERTED';
  const newPO = {
    id: `po-${Date.now()}`,
    po_number: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    supplier_name: pr.supplier_name || 'PT Synnex Metrodata Indonesia',
    order_date: new Date().toISOString().substring(0, 10),
    expected_date: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
    status: 'APPROVED',
    currency: 'IDR',
    total: (pr.suggested_qty || 20) * 1850000,
    items_count: 1
  };
  v2PurchaseOrders.unshift(newPO);
  res.json({ success: true, message: 'PR successfully converted to PO', purchase_order: newPO });
});

app.get('/api/v2/scm/goods-receipts', (_req, res) => res.json(v2GRNList));

app.post('/api/v2/scm/goods-receipts', (req, res) => {
  const newGR = {
    id: `grn-${Date.now()}`,
    gr_number: `GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'PENDING_QC',
    bin_code: 'QC-IN-01',
    received_at: new Date().toISOString(),
    ...req.body
  };
  v2GRNList.unshift(newGR);
  res.status(201).json(newGR);
});

app.get('/api/v2/scm/qc-inspections', (_req, res) => res.json(v2QCInspections));

app.post('/api/v2/scm/qc-inspections/:id/action', (req, res) => {
  const { action, target_bin = 'SP-CPU-A-01', note } = req.body;
  const qc = v2QCInspections.find(q => q.id === req.params.id || q.gr_number === req.params.id);

  if (action === 'PASS' || action === 'RELEASE') {
    if (qc) qc.status = 'PASSED';
    const targetGR = v2GRNList.find(g => g.id === qc?.gr_id || g.gr_number === req.params.id || g.id === req.params.id);
    if (targetGR) targetGR.status = 'QC_RELEASED';

    // Post QC_RELEASE movement
    const mov = {
      id: `mov-${Date.now()}`,
      movement_type: 'QC_RELEASE',
      product_name: 'AMD Ryzen 7 7800X3D Processor Box',
      qty: 15,
      bin_code: target_bin,
      ref_doc: targetGR?.gr_number || 'GRN-2026-0043',
      unit_cost: 5900000,
      note: note || 'Lolos inspeksi segel dan boot test',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      created_by: 'QC Inspector'
    };
    v2Movements.unshift(mov);

    // Increment inventory product stock
    const prod = v2Products.find(p => p.sku === 'SP-CPU-7800X3D');
    if (prod) prod.stock += 15;

    // Auto-create AP Bill in Finance
    const apBill = {
      id: `ap-${Date.now()}`,
      bill_no: `BILL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      vendor: targetGR?.supplier_name || 'Silicon Tech Global Ltd',
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
      amount: 15 * 5900000,
      status: 'unpaid',
      term: 'NET 30'
    };
    v2ApBills.unshift(apBill);

    return res.json({
      success: true,
      status: 'PASSED',
      message: 'QC Passed! Released to category racks and AP Bill automatically created.',
      movement: mov,
      ap_bill: apBill
    });
  }

  // Reject / RTV
  if (qc) qc.status = 'REJECTED';
  res.json({ success: true, status: 'REJECTED', message: 'Item rejected and quarantined for vendor return.' });
});

app.get('/api/v2/scm/vendor-prices', (_req, res) => {
  res.json([
    { supplier: 'PT Synnex Metrodata Indonesia', sku: 'SP-SSD-990P-1T', price: 1850000, lead_days: 3, defect_rate: '0.4%', rating: 'A' },
    { supplier: 'Silicon Tech Global Ltd', sku: 'SP-SSD-990P-1T', price: 1720000, lead_days: 12, defect_rate: '1.2%', rating: 'B+' },
    { supplier: 'PT Asus Technology Indonesia', sku: 'SP-MB-B650PLUS', price: 3400000, lead_days: 5, defect_rate: '0.8%', rating: 'A' }
  ]);
});

app.get('/api/v2/scm/rtv', (_req, res) => res.json(v2RTVCases));
app.post('/api/v2/scm/rtv', (req, res) => {
  const newRTV = {
    id: `rtv-${Date.now()}`,
    rtv_number: `RTV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'SHIPPED',
    shipped_at: new Date().toISOString().substring(0, 10),
    ...req.body
  };
  v2RTVCases.unshift(newRTV);

  // Post RTV_OUT movement
  const mov = {
    id: `mov-${Date.now()}`,
    movement_type: 'RTV_OUT',
    product_name: newRTV.product_name,
    qty: -Number(newRTV.qty || 1),
    bin_code: 'RMA-HOLD-01',
    ref_doc: newRTV.rtv_number,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
    created_by: 'Return Admin'
  };
  v2Movements.unshift(mov);
  res.status(201).json({ success: true, rtv: newRTV, movement: mov });
});

// --- MODULE 4: BOM & PC ASSEMBLY ENGINE ENDPOINTS ---
app.get('/api/v2/assembly/boms', (_req, res) => res.json([v2BOM]));
app.post('/api/v2/assembly/boms', (req, res) => {
  v2BOM = { ...v2BOM, ...req.body };
  res.status(201).json(v2BOM);
});

app.get('/api/v2/assembly/orders', (_req, res) => res.json(v2AssemblyOrders));

app.post('/api/v2/assembly/orders', (req, res) => {
  const qty = Number(req.body.qty_to_build) || 1;
  const materialCost = v2BOM.components.reduce((acc, c) => acc + (c.cost * c.qty), 0);
  const totalUnitHPP = materialCost + v2BOM.labor_cost + v2BOM.overhead_cost;

  const newOrder = {
    id: `asm-${Date.now()}`,
    assembly_number: `ASM-ORD-2026-${String(v2AssemblyOrders.length + 1).padStart(3, '0')}`,
    product_name: v2BOM.product_name,
    sku: v2BOM.output_sku,
    qty_to_build: qty,
    status: 'ISSUED',
    target_bin: req.body.target_bin || 'PB-A-1-01',
    created_by: req.body.created_by || 'Bambang Assembly',
    completed_at: null,
    serial_generated: null,
    total_cost: totalUnitHPP * qty,
    note: req.body.note || ''
  };

  v2AssemblyOrders.unshift(newOrder);
  res.status(201).json(newOrder);
});

app.patch('/api/v2/assembly/orders/:id/complete', (req, res) => {
  const order = v2AssemblyOrders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Assembly order not found' });

  const generatedSN = `SN-ARES-PC-${Math.floor(1000 + Math.random() * 9000)}`;
  order.status = 'COMPLETED';
  order.completed_at = new Date().toISOString().replace('T', ' ').substring(0, 16);
  order.serial_generated = generatedSN;

  // Deduct components (ASM_OUT) and receive prebuilt output (ASM_IN)
  v2BOM.components.forEach(comp => {
    const compProd = v2Products.find(p => p.sku === comp.sku);
    if (compProd) compProd.stock = Math.max(0, compProd.stock - (comp.qty * order.qty_to_build));
  });

  const outputProd = v2Products.find(p => p.sku === order.sku);
  if (outputProd) outputProd.stock += order.qty_to_build;

  // Record movement ASM_IN
  v2Movements.unshift({
    id: `mov-${Date.now()}`,
    movement_type: 'ASM_IN',
    product_name: order.product_name,
    qty: order.qty_to_build,
    bin_code: order.target_bin,
    ref_doc: order.assembly_number,
    unit_cost: 25450000,
    created_at: order.completed_at,
    created_by: order.created_by
  });

  // Register serial number
  v2Serials.unshift({
    id: `sn-${Date.now()}`,
    serial_no: generatedSN,
    product_name: order.product_name,
    sku: order.sku,
    status: 'IN_STOCK',
    bin_code: order.target_bin,
    unit_cost: 25450000,
    received_at: new Date().toISOString().substring(0, 10),
    customer_warranty_end: new Date(Date.now() + 365 * 86400000).toISOString().substring(0, 10)
  });

  res.json({ success: true, order, serial_generated: generatedSN });
});

app.post('/api/v2/assembly/simulate', (req, res) => {
  const qty = Number(req.body.qty) || 1;
  const results = v2BOM.components.map(c => {
    const prod = v2Products.find(p => p.sku === c.sku);
    const available = prod ? prod.stock : 0;
    const required = c.qty * qty;
    return {
      sku: c.sku,
      name: c.name,
      required,
      available,
      isSufficient: available >= required,
      deficit: Math.max(0, required - available)
    };
  });
  const canBuildAll = results.every(r => r.isSufficient);
  res.json({ canBuildAll, target_qty: qty, components: results });
});

app.post('/api/v2/assembly/debundle', (req, res) => {
  const { prebuilt_sku = 'PB-ARES-78X', target_serial = 'SN-ARES-PC-001' } = req.body;
  const prebuilt = v2Products.find(p => p.sku === prebuilt_sku);

  if (prebuilt && prebuilt.stock > 0) {
    prebuilt.stock -= 1;
  }

  // Restore 7 spare parts components
  v2BOM.components.forEach(comp => {
    const part = v2Products.find(p => p.sku === comp.sku);
    if (part) part.stock += comp.qty;
  });

  // Record movements
  const timeNow = new Date().toISOString().replace('T', ' ').substring(0, 16);
  v2Movements.unshift({
    id: `mov-${Date.now()}`,
    movement_type: 'ASM_OUT',
    product_name: prebuilt?.name || prebuilt_sku,
    qty: -1,
    bin_code: 'PB-A-1-01',
    ref_doc: `DEBUNDLE-${target_serial}`,
    unit_cost: 25450000,
    created_at: timeNow,
    created_by: 'Assembly Tech'
  });

  res.json({
    success: true,
    message: `Prebuilt PC (${target_serial}) successfully disassembled. 7 spare parts returned to inventory.`,
    updated_products: v2Products
  });
});

// --- MODULE 4: OUTBOUND / SALES & FULFILLMENT ENDPOINTS ---
app.get('/api/v2/outbound/sales-orders', (_req, res) => res.json(v2SalesOrders));

app.post('/api/v2/outbound/sales-orders', (req, res) => {
  const newSO = {
    id: `so-${Date.now()}`,
    so_number: `SO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'CONFIRMED',
    order_date: new Date().toISOString().substring(0, 10),
    ...req.body
  };
  v2SalesOrders.unshift(newSO);
  res.status(201).json(newSO);
});

app.patch('/api/v2/outbound/sales-orders/:id/status', (req, res) => {
  const so = v2SalesOrders.find(s => s.id === req.params.id);
  if (!so) return res.status(404).json({ error: 'Sales Order not found' });
  so.status = req.body.status || so.status;
  res.json(so);
});

app.get('/api/v2/outbound/pick-tasks', (_req, res) => res.json(v2PickTasks));

app.post('/api/v2/outbound/pick-tasks/wave', (req, res) => {
  const waveTask = {
    id: `wave-${Date.now()}`,
    batch_number: `WAVE-BATCH-${Math.floor(10 + Math.random() * 90)}`,
    status: 'IN_PROGRESS',
    assigned_orders: req.body.order_ids || ['so-02', 'so-03'],
    total_lines: 8,
    created_at: new Date().toISOString()
  };
  res.status(201).json({ success: true, wave_task: waveTask });
});

app.get('/api/v2/outbound/pack-tasks', (_req, res) => res.json(v2PackTasks));

app.post('/api/v2/outbound/pack-tasks', (req, res) => {
  const newPack = {
    id: `pack-${Date.now()}`,
    pack_number: `PACK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'COMPLETED',
    packed_by: req.body.packed_by || 'Siti Logistik',
    box_count: Number(req.body.box_count) || 1,
    total_weight_kg: Number(req.body.total_weight_kg) || 5.0,
    created_at: new Date().toISOString(),
    ...req.body
  };
  v2PackTasks.unshift(newPack);
  res.status(201).json(newPack);
});

app.get('/api/v2/outbound/delivery-notes', (_req, res) => res.json(v2DeliveryNotes));

app.post('/api/v2/outbound/delivery-notes', (req, res) => {
  const { so_id, driver_name, vehicle_no, note } = req.body;
  const so = v2SalesOrders.find(s => s.id === so_id);

  const sj = {
    id: `sj-${Date.now()}`,
    sj_number: `SJ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    so_id: so_id,
    so_number: so ? so.so_number : 'SO-2026-0102',
    client_name: so ? so.client_name : 'Diskominfo DKI',
    driver_name: driver_name || 'Joko Prabowo',
    vehicle_no: vehicle_no || 'B 9281 KCA',
    status: 'SHIPPED',
    delivered_at: null,
    note: note || ''
  };
  v2DeliveryNotes.unshift(sj);

  // Update SO status
  if (so) so.status = 'SHIPPED';

  // Execute Goods Issue GI (-) on stock ledger
  v2Movements.unshift({
    id: `mov-${Date.now()}`,
    movement_type: 'GI',
    product_name: so?.items?.[0]?.name || 'Lenovo ThinkPad E14 Gen 5',
    qty: -Number(so?.items?.[0]?.qty || 1),
    bin_code: 'PB-A-1-01',
    ref_doc: sj.sj_number,
    unit_cost: 14500000,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
    created_by: 'Outbound Admin'
  });

  // Create AR Invoice in Finance
  const arInv = {
    id: `ar-${Date.now()}`,
    inv_no: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    client: sj.client_name,
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
    amount: so ? so.total : 168000000,
    status: 'unpaid',
    term: 'NET 30'
  };
  v2ArInvoices.unshift(arInv);

  res.status(201).json({ success: true, delivery_note: sj, invoice: arInv });
});

// --- MODULE 2: FINANCE & COSTING ENDPOINTS ---
app.get('/api/v2/finance/cogs', (_req, res) => {
  res.json(v2Products.map(p => {
    const grossMargin = p.unit_price - p.cost_price;
    const marginPct = p.unit_price > 0 ? ((grossMargin / p.unit_price) * 100).toFixed(1) : 0;
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      method: p.is_assembly ? 'BOM_ROLLUP' : p.is_serial ? 'SPECIFIC_ID' : 'FIFO_AVERAGE',
      cost_price: p.cost_price,
      unit_price: p.unit_price,
      gross_margin: grossMargin,
      margin_pct: Number(marginPct)
    };
  }));
});

app.get('/api/v2/finance/ap-bills', (_req, res) => res.json(v2ApBills));

app.post('/api/v2/finance/ap-bills/:id/pay', (req, res) => {
  const bill = v2ApBills.find(b => b.id === req.params.id || b.bill_no === req.params.id);
  if (!bill) return res.status(404).json({ error: 'AP Bill not found' });

  bill.status = 'PAID';
  bill.paid_at = new Date().toISOString();

  const payRecord = {
    id: `pay-${Date.now()}`,
    payment_number: `PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'AP',
    ref_bill_id: bill.id,
    amount: bill.amount,
    currency: bill.currency || 'IDR',
    method: req.body.method || 'transfer',
    paid_at: bill.paid_at
  };
  v2Payments.unshift(payRecord);

  res.json({ success: true, message: `Payment completed for ${bill.bill_no}`, bill, payment: payRecord });
});

app.get('/api/v2/finance/ar-invoices', (_req, res) => res.json(v2ArInvoices));

app.post('/api/v2/finance/ar-invoices/:id/pay', (req, res) => {
  const inv = v2ArInvoices.find(i => i.id === req.params.id || i.inv_no === req.params.id);
  if (!inv) return res.status(404).json({ error: 'AR Invoice not found' });

  inv.status = 'paid';
  inv.paid_at = new Date().toISOString();
  res.json({ success: true, invoice: inv });
});

app.get('/api/v2/finance/payments', (_req, res) => res.json(v2Payments));
app.post('/api/v2/finance/payments', (req, res) => {
  const pay = { id: `pay-${Date.now()}`, ...req.body, paid_at: new Date().toISOString() };
  v2Payments.unshift(pay);
  res.status(201).json(pay);
});

app.get('/api/v2/finance/warranty-tickets', (_req, res) => {
  res.json([
    { ticket_no: 'SRV-2026-0012', client: 'PT Telko Solusi', issue: 'RTX 4070 Fan Rattling', part_cost: 0, labor_cost: 250000, status: 'REPAIRED', claim_vendor: true }
  ]);
});

app.get('/api/v2/finance/exchange-rates', (_req, res) => {
  res.json({ base: 'IDR', rates: { USD: 15650, SGD: 11800, EUR: 16800 }, date: '2026-10-06' });
});

// --- MODULE 6: MANAGERIAL, BILLING & WORKER ANALYTICS ENDPOINTS ---
app.get('/api/v2/managerial/executive-dashboard', (_req, res) => {
  const totalValuation = calculateTotalValuation(v2Products);
  const totalSales = v2SalesOrders.reduce((sum, s) => sum + (s.total || 0), 0);
  const idleCapital = 45700000;
  res.json({
    currency: 'IDR',
    total_warehouse_valuation: totalValuation,
    total_sales_revenue: totalSales,
    idle_capital: idleCapital,
    gross_margin_pct: 18.4,
    total_skus: v2Products.length,
    active_sales_orders: v2SalesOrders.length,
    active_purchase_orders: v2PurchaseOrders.length
  });
});

app.get('/api/v2/managerial/worker-performance', (_req, res) => res.json(v2WorkerActivities));

app.get('/api/v2/managerial/pnl', (_req, res) => {
  res.json({
    period: 'October 2026',
    currency: 'IDR',
    gross_revenue: 240500000,
    cogs: 196248000,
    gross_profit: 44252000,
    operating_expenses: 12500000,
    warranty_service_deduction: 750000,
    net_operating_profit: 31002000
  });
});

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
