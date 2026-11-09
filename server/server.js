import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { calculateTotalValuation } from '../src/data/v2Data.js';
import { bindSupabase, collection, ensureReady, persistAll, registerSeed, status as storeStatus } from './store.js';
import { defaultSeed } from './seedData.js';
import { getPool, createCompat, changes } from './db.js';

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
// Generous JSON limit so bulk catalogue imports (e.g. PUT /api/v2/master/products)
// are not rejected by the 100kb default.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Real Supabase client (hosted deployment) — null when not configured.
// Each request is wrapped in a short timeout so a dead/unreachable project
// fails fast (~2.5s) instead of hanging for seconds, letting the v2 endpoints
// fall back to the durable store promptly.
const SUPABASE_FETCH_TIMEOUT_MS = Number(process.env.SUPABASE_FETCH_TIMEOUT_MS || 2500);
const realSupabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, opts = {}) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), SUPABASE_FETCH_TIMEOUT_MS);
          return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
        }
      }
    })
  : null;

// Local PostgreSQL facade: when no Supabase is configured but a local/remote
// Postgres is reachable (DATABASE_URL / default local), legacy handlers go
// through this drop-in compat object (server/db.js).
const localCompat = (!realSupabase && getPool()) ? createCompat() : null;

export const supabase = realSupabase || localCompat;

if (realSupabase) {
  console.log(`[REST API] Connected to Supabase backend: ${supabaseUrl}`);
} else if (localCompat) {
  console.log(`[REST API] Connected to local PostgreSQL backend (v2 store + legacy tables).`);
} else {
  console.warn(`[REST API] Warning: no database configured — running IN-MEMORY (data is NOT durable). Set DATABASE_URL or Supabase keys.`);
}

// Bind the durable v2 collection store (QA-01 fix) and register master-data seeds (QA-03 fix).
// store.js prefers the local Postgres pool (db.js) and falls back to Supabase.
bindSupabase(realSupabase);
registerSeed(defaultSeed);

// Local in-memory fallback stores (used when offline or when Supabase keys are not set)
let fallbackOrders = [];
let fallbackHistory = [];

// -------------------------------------------------------------
// 0. HEALTHCHECK ENDPOINT
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    supabase_connected: !!realSupabase,
    postgres_connected: Boolean(getPool()),
    persistence: storeStatus()
  });
});

// -------------------------------------------------------------
// REALTIME: Server-Sent Events stream of v2 collection changes
// -------------------------------------------------------------
// Clients (EventSource) receive a JSON event per written collection so the UI
// can re-fetch and render live without polling. Placed BEFORE the /api/v2 auth
// gate on purpose — EventSource cannot send an Authorization header.
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (collection) => {
    try { res.write(`data: ${JSON.stringify({ collection, at: Date.now() })}\n\n`); } catch { /* client gone */ }
  };
  const heartbeat = setInterval(() => { try { res.write(': ping\n\n'); } catch { /* ignore */ } }, 15000);
  const onChange = (collection) => send(collection);

  changes.on('change', onChange);
  send('*'); // initial "connected" event

  req.on('close', () => {
    clearInterval(heartbeat);
    changes.off('change', onChange);
  });
});

// Serve locally-uploaded documents (local PostgreSQL compat storage).
app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'data', 'uploads')));

// -------------------------------------------------------------
// 1. AUTHENTICATION & USER PROFILE ENDPOINTS
// -------------------------------------------------------------

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Hosted Supabase auth (when configured).
  if (realSupabase) {
    const { data, error } = await realSupabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    return res.json({ session: data.session, user: data.user, error: null });
  }

  // Local durable auth (PostgreSQL) — verify against registered users.
  const emailLower = String(email).trim().toLowerCase();
  const user = v2AuthUsers.find(u => String(u.email || '').toLowerCase() === emailLower);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const [salt, hashHex] = String(user.password_hash || '').split(':');
  let valid = false;
  if (salt && hashHex) {
    try {
      const test = scryptSync(String(password), salt, 64).toString('hex');
      valid = timingSafeEqual(Buffer.from(hashHex, 'hex'), Buffer.from(test, 'hex'));
    } catch { valid = false; }
  }
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const sessionUser = { email: user.email, user_metadata: { company_name: user.company_name, role: user.role } };
  return res.json({ session: { user: sessionUser, token: `moai_token_${Date.now()}` }, user: sessionUser, error: null });
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, company_name, role = 'Admin' } = req.body;
  if (!email || !password || !company_name) {
    return res.status(400).json({ error: 'Email, password, and company name are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const emailLower = String(email).trim().toLowerCase();
  const compUpper = String(company_name).trim().toUpperCase();

  if (v2AuthUsers.some(u => String(u.email || '').toLowerCase() === emailLower)) {
    return res.status(409).json({ error: 'Email already registered. Please sign in.' });
  }

  // Hosted Supabase auth (when configured).
  if (realSupabase) {
    try {
      const { data: existingCompany } = await realSupabase
        .from('companies').select('id, name').ilike('name', compUpper).maybeSingle();
      if (!existingCompany) await realSupabase.from('companies').insert([{ name: compUpper }]);
      const { data, error } = await realSupabase.auth.signUp({ email, password, options: { data: { company_name: compUpper, role } } });
      if (error) return res.status(400).json({ error: error.message });
      await realSupabase.from('company_users').upsert([{ company_name: compUpper, user_email: email, role }], { onConflict: 'company_name,user_email' });
      return res.status(201).json({ session: data.session, user: data.user, error: null });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Local durable registration (PostgreSQL). Passwords are hashed (scrypt) so
  // credentials survive a restart and are never stored in plaintext.
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(password), salt, 64).toString('hex');
  const user = {
    id: `usr-${Date.now()}`,
    email: emailLower,
    password_hash: `${salt}:${hash}`,
    company_name: compUpper,
    role: role || 'Admin',
    created_at: new Date().toISOString()
  };
  v2AuthUsers.push(user);

  // Ensure the company is known to the workspace (v2 store).
  if (!v2Companies.some(c => String(c.name || '').toUpperCase() === compUpper)) {
    v2Companies.push({ id: `comp-${Date.now()}`, name: compUpper, created_at: new Date().toISOString() });
  }

  // /api/auth/* runs before the v2 persistence middleware, so flush explicitly.
  try { await persistAll(); } catch (err) { console.error('[auth] persist failed:', err?.message || err); }

  const sessionUser = { email: user.email, user_metadata: { company_name: user.company_name, role: user.role } };
  return res.status(201).json({ session: { user: sessionUser, token: `moai_token_${Date.now()}` }, user: sessionUser, error: null });
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

// --- Durable v2 collections (QA-01 fix) ------------------------------------
// Stable references hydrated from / persisted to Supabase `v2_store`.
const v2Products = collection('products');
const v2Warehouses = collection('warehouses');
const v2Zones = collection('zones');
const v2Bins = collection('bins');
const v2Brands = collection('brands');
const v2Suppliers = collection('suppliers');
const v2Clients = collection('clients');
const v2Serials = collection('serials');
const v2Movements = collection('movements');
const v2BOMs = collection('boms');
const v2VendorPrices = collection('vendor_prices');
const v2WarrantyTickets = collection('warranty_tickets');

// Resolve the BOM recipe that produces `targetSku` (falls back to the first recipe).
function findBOM(targetSku) {
  const sku = String(targetSku || '').trim();
  if (!v2BOMs.length) return null;
  if (sku) {
    const exact = v2BOMs.find(b => (b.target_sku || b.output_sku) === sku);
    if (exact) return exact;
  }
  return v2BOMs[0];
}
const v2AssemblyOrders = collection('assembly_orders');
const v2PurchaseOrders = collection('purchase_orders');
const v2Requisitions = collection('requisitions');
const v2SalesOrders = collection('sales_orders');
const v2ApBills = collection('ap_bills');
const v2ArInvoices = collection('ar_invoices');
const v2GRNList = collection('goods_receipts');
const v2QCInspections = collection('qc_inspections');
const v2Payments = collection('payments');
const v2PickTasks = collection('pick_tasks');
const v2PackTasks = collection('pack_tasks');
const v2DeliveryNotes = collection('delivery_notes');
const v2RTVCases = collection('rtv_cases');
const v2RMACases = collection('rma_cases');
const v2WorkerActivities = collection('worker_activities');
const v2Companies = collection('companies');
const v2AuthUsers = collection('auth_users');

// --- Authentication guard for the v2 API (QA-02 fix) -----------------------
// Requires a valid Supabase session JWT for every /api/v2 request.
// The client-side "Quick Demo Access" session is honoured only while
// ALLOW_DEMO_ACCESS is not set to "false".
const DEMO_ACCESS_ALLOWED = String(process.env.ALLOW_DEMO_ACCESS ?? 'true').toLowerCase() !== 'false';

async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';

  // No auth backend configured (local dev / offline) -> allow.
  if (!supabase) {
    req.user = { email: 'local-dev', demo: true };
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
  }

  // Demo session issued by the client-side Quick Demo Access button.
  if (token.startsWith('moai_demo_') || token.startsWith('moai_token_')) {
    if (DEMO_ACCESS_ALLOWED) {
      req.user = { email: 'demo@kompakom.co.id', demo: true };
      return next();
    }
    return res.status(401).json({ error: 'Demo access is disabled', code: 'DEMO_DISABLED' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired session', code: 'BAD_TOKEN' });
    }
    req.user = { id: data.user.id, email: data.user.email };
    return next();
  } catch (err) {
    console.warn('[auth] token verification failed:', err?.message || err);
    return res.status(401).json({ error: 'Authentication failed', code: 'AUTH_ERROR' });
  }
}

// Hydrate the cache before handling. For mutating requests the resulting write
// is flushed to Supabase BEFORE the response is sent — on Vercel the function
// can be frozen the instant the response is flushed, so a fire-and-forget write
// (res.on('finish')) would be lost silently. This makes every accepted mutation
// durable before the client sees a 2xx.
async function v2Persistence(req, res, next) {
  try {
    await ensureReady();
  } catch (err) {
    console.debug('[v2-store] hydrate skipped:', err?.message);
  }

  const mutating = req.method !== 'GET' && req.method !== 'HEAD';
  if (mutating) {
    const origJson = res.json.bind(res);
    const origSend = res.send.bind(res);
    let flushing = null;
    const flush = () => {
      if (!flushing) {
        flushing = (async () => {
          if (res.statusCode >= 400) return;
          try {
            await persistAll();
          } catch (err) {
            console.error('[v2-store] persist failed:', err?.message || err);
          }
        })();
      }
      return flushing;
    };
    res.json = (body) => { flush().then(() => origJson(body)); return res; };
    res.send = (body) => { flush().then(() => origSend(body)); return res; };
  }

  next();
}

app.use('/api/v2', authenticate);

// --- Multi-tenant scoping (per-company data separation) ---------------------
// The client sends its company on every request (?company_name= or X-Company
// header). Reads are filtered to that tenant; writes are stamped with it so
// each company's records stay isolated. An untagged record (legacy/shared) is
// visible to every tenant; a tagged record is visible ONLY to its company.
function scopeCompany(arr, req) {
  const companyName = req && req.companyName;
  if (!companyName || !Array.isArray(arr)) return arr;
  const want = String(companyName).trim().toUpperCase();
  return arr.filter((it) => {
    if (!it || typeof it !== 'object') return true;
    const c = it.company_name;
    if (!c) return true; // untagged (legacy/shared) => visible to all
    return String(c).trim().toUpperCase() === want;
  });
}

app.use('/api/v2', (req, res, next) => {
  const src = req.query.company_name || req.headers['x-company'];
  req.companyName = src ? String(src) : null;
  // Stamp writes with the caller's company so new records are tenant-tagged.
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)
      && !req.body.company_name && req.companyName) {
    req.body.company_name = req.companyName;
  }
  next();
});

app.use('/api/v2', v2Persistence);


// --- MODULE 5: MASTER DATA ENDPOINTS ---
app.get('/api/v2/master/products', async (req, res) => {
  const { category, item_type, search, company_name } = req.query;
  // v2 collection store is the source of truth — serve it directly (fast).
  // Only consult the legacy `items` table when the store is empty (migration
  // bridge), so a dead/unreachable Supabase can't stall the master list.
  if (v2Products.length === 0 && supabase) {
    try {
      let q = supabase.from('items').select('*');
      if (category) q = q.eq('category', category);
      if (company_name && company_name !== 'NOT ASSIGNED') q = q.eq('company_name', company_name);
      if (search) q = q.ilike('name', `%${search}%`);
      const { data, error } = await q;
      if (!error && data && data.length > 0) {
        const mapped = data.map(item => ({
          id: item.id,
          sku: item.sku,
          barcode: item.barcode || item.sku,
          name: item.name,
          category: item.category || 'Hardware',
          item_type: item.item_type || (item.category === 'Chassis' ? 'PREBUILT' : 'SPARE_PART'),
          brand: item.brand || 'General',
          uom: item.uom || 'PCS',
          is_serial: !!item.is_serial,
          is_assembly: !!item.is_assembly,
          unit_price: Number(item.unit_price) || 0,
          cost_price: Number(item.cost_price || (item.unit_price ? item.unit_price * 0.8 : 0)),
          stock: Number(item.stock_on_hand ?? item.stock ?? 0),
          bin_code: item.bin_code || 'PB-A-1-01',
          company_name: item.company_name
        }));
        return res.json(mapped);
      }
    } catch (err) {
      console.debug('Error querying Supabase items:', err);
    }
  }
  let results = scopeCompany([...v2Products], req);
  if (category) results = results.filter(p => p.category === category);
  if (item_type) results = results.filter(p => p.item_type === item_type);
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || (p.barcode && p.barcode.includes(s)));
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

// Bulk import / replace of the master product catalogue.
// Used to load a distributor catalogue (e.g. Inventory_List_Update) in one shot.
// Accepts either a bare JSON array or { products: [...] }.
// The v2Persistence middleware persists the collection (durable) before responding.
app.put('/api/v2/master/products', async (req, res) => {
  const body = req.body;
  const incoming = Array.isArray(body)
    ? body
    : (body && Array.isArray(body.products) ? body.products : null);
  if (!incoming) {
    return res.status(400).json({ error: 'Expected a JSON array of products, or { products: [...] }' });
  }
  if (incoming.length > 5000) {
    return res.status(413).json({ error: 'Too many products in one request (max 5000)' });
  }

  const now = new Date().toISOString();
  const normalized = incoming.map((p, i) => ({
    ...p,
    id: p.id || `prod-${String(i + 1).padStart(4, '0')}`,
    sku: String(p.sku || '').trim(),
    unit_price: Number(p.unit_price) || 0,
    cost_price: Number(p.cost_price) || 0,
    stock: Number(p.stock) || 0,
    created_at: p.created_at || now
  }));
  if (normalized.some(p => !p.sku)) {
    return res.status(400).json({ error: 'Every product must have a non-empty sku' });
  }

  // Replace the collection contents in place (keeps the stable reference used by
  // every other handler) then let the middleware persist it before we respond.
  v2Products.length = 0;
  for (const p of normalized) v2Products.push(p);

  res.json({ replaced: true, count: v2Products.length });
});

app.get('/api/v2/master/products/:id', (req, res) => {
  const p = scopeCompany(v2Products, req).find(item => item.id === req.params.id || item.sku === req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});

app.get('/api/v2/master/warehouses', (req, res) => res.json(scopeCompany(v2Warehouses, req)));
app.get('/api/v2/master/zones', (req, res) => res.json(scopeCompany(v2Zones, req)));
app.get('/api/v2/master/bins', (req, res) => res.json(scopeCompany(v2Bins, req)));
app.post('/api/v2/master/bins', (req, res) => {
  const newBin = { id: `bin-${Date.now()}`, ...req.body };
  v2Bins.push(newBin);
  res.status(201).json(newBin);
});
// ---------------------------------------------------------------------------
// Master-entity CRUD (Brands / Suppliers / Clients)
// ---------------------------------------------------------------------------
// DELETE archives by default (is_active=false + deleted_at) so historical
// documents — PO, GRN, SO, AR invoices — keep resolving to a known entity.
// A real removal is available with ?hard=true but is refused (409) while the
// record is still referenced by a transaction.
const isArchivedRow = (x) => x.is_active === false || !!x.deleted_at;
const activeRows = (arr) => arr.filter(x => !isArchivedRow(x));

function countEntityRefs(refCollections, name, code) {
  const needles = [name, code].map(v => String(v || '').trim().toLowerCase()).filter(Boolean);
  if (!needles.length) return 0;
  let total = 0;
  for (const rc of refCollections) {
    for (const row of rc.arr) {
      if (rc.fields.some(f => needles.includes(String(row[f] || '').trim().toLowerCase()))) total += 1;
    }
  }
  return total;
}

// Registers POST (create) / PUT (update) / DELETE (archive|hard) / restore.
// `pick(body, cur)` returns the merged, sanitised record fields.
function registerMasterEntityCrud(cfg) {
  const {
    route, arr, label, idPrefix, codePrefix = '', codeLen = 10, prepend = false,
    defaults = {}, pick, refCollections = []
  } = cfg;

  const autoCode = (name) =>
    `${codePrefix}${String(name).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, codeLen)}`
    || `${codePrefix || 'ENT'}${Date.now().toString().slice(-4)}`;

  const findOne = (id) => arr.find(x => String(x.id) === String(id));

  // ---- CREATE ------------------------------------------------------------
  app.post(route, (req, res) => {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    if (!name) return res.status(400).json({ error: `${label} name is required` });

    const code = String(body.code || '').trim().toUpperCase() || autoCode(name);
    const live = activeRows(arr);
    if (live.some(x => String(x.code || '').toUpperCase() === code)) {
      return res.status(409).json({ error: `${label} code "${code}" already exists` });
    }
    if (live.some(x => String(x.name || '').trim().toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ error: `${label} "${name}" already exists` });
    }

    const base = { ...defaults, name, code };
    const rec = {
      id: `${idPrefix}-${Date.now()}`,
      ...base,
      ...pick(body, base),
      name,
      code,
      is_active: true,
      created_at: new Date().toISOString()
    };
    if (prepend) arr.unshift(rec); else arr.push(rec);
    res.status(201).json(rec);
  });

  // ---- UPDATE ------------------------------------------------------------
  app.put(`${route}/:id`, (req, res) => {
    const cur = findOne(req.params.id);
    if (!cur) return res.status(404).json({ error: `${label} not found` });

    const next = pick(req.body || {}, cur);
    const name = String(next.name || '').trim();
    if (!name) return res.status(400).json({ error: `${label} name is required` });
    const code = String(next.code || '').trim().toUpperCase() || cur.code;

    const clash = arr.find(x => x !== cur && !isArchivedRow(x) && (
      String(x.code || '').toUpperCase() === code ||
      String(x.name || '').trim().toLowerCase() === name.toLowerCase()
    ));
    if (clash) {
      return res.status(409).json({
        error: String(clash.code || '').toUpperCase() === code
          ? `${label} code "${code}" already exists`
          : `${label} "${name}" already exists`
      });
    }

    Object.assign(cur, next, { name, code, updated_at: new Date().toISOString() });
    res.json(cur);
  });

  // ---- DELETE (archive by default, ?hard=true to remove) -----------------
  app.delete(`${route}/:id`, (req, res) => {
    const idx = arr.findIndex(x => String(x.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: `${label} not found` });
    const cur = arr[idx];
    const referenced = countEntityRefs(refCollections, cur.name, cur.code);
    const hard = String(req.query.hard || '').toLowerCase() === 'true';

    if (hard) {
      if (referenced > 0) {
        return res.status(409).json({
          error: `${label} "${cur.name}" is referenced by ${referenced} transaction(s) — archive it instead`,
          referenced
        });
      }
      arr.splice(idx, 1);
      return res.json({ deleted: true, hard: true, id: cur.id, name: cur.name });
    }

    Object.assign(cur, {
      is_active: false,
      deleted_at: new Date().toISOString(),
      deleted_by: req.user?.email || 'system'
    });
    res.json({ ...cur, archived: true, referenced });
  });

  // ---- RESTORE -----------------------------------------------------------
  app.post(`${route}/:id/restore`, (req, res) => {
    const cur = findOne(req.params.id);
    if (!cur) return res.status(404).json({ error: `${label} not found` });
    const clash = activeRows(arr).find(x => x !== cur &&
      String(x.code || '').toUpperCase() === String(cur.code || '').toUpperCase());
    if (clash) {
      return res.status(409).json({ error: `Cannot restore — code "${cur.code}" is now used by "${clash.name}"` });
    }
    delete cur.deleted_at;
    delete cur.deleted_by;
    cur.is_active = true;
    cur.restored_at = new Date().toISOString();
    res.json(cur);
  });
}

// Registers generic UPDATE (PUT) + DELETE (soft-void by default, ?hard=true to
// remove) for v2 reference / config / transactional collections, so every
// module + feature has a full create/read/update/delete surface. Identity keys
// are never overwritten on update. Transactions void (status=VOID) rather than
// hard-delete so the ledger keeps its audit trail ("saldo ⇄ mutasi").
function registerCollectionCrud({ route, arr, idKeys = ['id'], editable = true }) {
  const findOne = (id) => arr.find(x => idKeys.some(k => String(x[k]) === String(id)));

  app.put(`${route}/:id`, (req, res) => {
    if (!editable) return res.status(405).json({ error: 'This collection is not editable' });
    const cur = findOne(req.params.id);
    if (!cur) return res.status(404).json({ error: 'Not found' });
    const body = { ...(req.body || {}) };
    idKeys.forEach((k) => delete body[k]);
    ['id', 'created_at'].forEach((k) => delete body[k]);
    Object.assign(cur, body, { updated_at: new Date().toISOString() });
    res.json(cur);
  });

  app.delete(`${route}/:id`, (req, res) => {
    const idx = arr.findIndex(x => idKeys.some(k => String(x[k]) === String(req.params.id)));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const hard = String(req.query.hard || '').toLowerCase() === 'true';
    if (hard) {
      arr.splice(idx, 1);
      return res.json({ deleted: true, hard: true, id: req.params.id });
    }
    Object.assign(arr[idx], { status: 'VOID', voided_at: new Date().toISOString() });
    res.json({ ...arr[idx], voided: true });
  });
}

// GET is archive-aware: archived rows are hidden unless ?include_archived=true
function listMasterEntities(arr) {
  return (req, res) => {
    const includeArchived = String(req.query.include_archived || '').toLowerCase() === 'true';
    res.json(scopeCompany(includeArchived ? arr : activeRows(arr), req));
  };
}

registerMasterEntityCrud({
  route: '/api/v2/master/brands',
  arr: v2Brands,
  label: 'Brand',
  idPrefix: 'brand',
  codePrefix: '',
  codeLen: 12,
  prepend: false,
  defaults: { description: '' },
  pick: (b, cur) => ({
    name: b.name !== undefined ? String(b.name).trim() : cur.name,
    code: b.code !== undefined ? String(b.code).trim().toUpperCase() : cur.code,
    description: b.description !== undefined ? String(b.description).trim() : (cur.description || '')
  }),
  refCollections: [{ arr: v2Products, fields: ['brand', 'brand_name'] }]
});

app.get('/api/v2/master/brands', listMasterEntities(v2Brands));

registerMasterEntityCrud({
  route: '/api/v2/master/suppliers',
  arr: v2Suppliers,
  label: 'Supplier',
  idPrefix: 'supp',
  codePrefix: 'SUPP-',
  codeLen: 10,
  prepend: true,
  defaults: {
    category: 'Distributor', country: 'Indonesia', currency: 'IDR', rating: 5.0,
    contact: '', phone: '', email: '', address: '', payment_terms: 'NET 30',
    lead_time_days: 7, on_time_rate: '—', defect_rate: '—', is_principal: false
  },
  pick: (s, cur) => ({
    name: s.name !== undefined ? String(s.name).trim() : cur.name,
    code: s.code !== undefined ? String(s.code).trim().toUpperCase() : cur.code,
    category: s.category !== undefined ? String(s.category).trim() : cur.category,
    country: s.country !== undefined ? String(s.country).trim() : cur.country,
    currency: s.currency !== undefined ? String(s.currency).trim().toUpperCase() : cur.currency,
    rating: s.rating !== undefined ? (Number(s.rating) || 5.0) : cur.rating,
    contact: s.contact !== undefined ? String(s.contact).trim() : cur.contact,
    phone: s.phone !== undefined ? String(s.phone).trim() : cur.phone,
    email: s.email !== undefined ? String(s.email).trim() : cur.email,
    address: s.address !== undefined ? String(s.address).trim() : cur.address,
    payment_terms: s.payment_terms !== undefined ? String(s.payment_terms).trim() : cur.payment_terms,
    lead_time_days: s.lead_time_days !== undefined ? (Number(s.lead_time_days) || 0) : cur.lead_time_days,
    is_principal: s.is_principal !== undefined ? !!s.is_principal : cur.is_principal
  }),
  refCollections: [
    { arr: v2PurchaseOrders, fields: ['supplier', 'supplier_name', 'vendor', 'vendor_name'] },
    { arr: v2GRNList, fields: ['supplier', 'supplier_name'] },
    { arr: v2Requisitions, fields: ['supplier', 'supplier_name'] }
  ]
});

// Suppliers keep the legacy Supabase-first read (the `suppliers` table wins
// when populated), falling through to the v2 collection — which is where the
// CRUD routes above write. Archived rows are hidden unless requested.
app.get('/api/v2/master/suppliers', async (req, res) => {
  const { company_name } = req.query;
  const includeArchived = String(req.query.include_archived || '').toLowerCase() === 'true';
  // v2 store first — only fall back to the legacy `suppliers` table when the
  // store is empty, so a dead Supabase can't stall this endpoint.
  if (v2Suppliers.length === 0 && supabase) {
    try {
      let q = supabase.from('suppliers').select('*').order('created_at', { ascending: false });
      if (company_name && company_name !== 'NOT ASSIGNED') q = q.eq('company_name', company_name);
      const { data, error } = await q;
      if (!error && data && data.length > 0) {
        const mapped = data.map(s => ({
          id: s.id,
          code: s.code || `SUPP-${s.id.substring(0, 6).toUpperCase()}`,
          name: s.name,
          category: s.category || 'General Supplier',
          country: s.country || 'Indonesia',
          currency: s.currency || 'IDR',
          rating: s.rating || 5.0,
          payment_terms: s.payment_terms || 'NET 30',
          lead_time_days: s.lead_time_days || 7,
          company_name: s.company_name
        }));
        return res.json(mapped);
      }
    } catch (err) {
      console.debug('Error querying Supabase suppliers:', err);
    }
  }
  res.json(scopeCompany(includeArchived ? v2Suppliers : activeRows(v2Suppliers), req));
});

registerMasterEntityCrud({
  route: '/api/v2/master/clients',
  arr: v2Clients,
  label: 'Client',
  idPrefix: 'cli',
  codePrefix: 'CLI-',
  codeLen: 10,
  prepend: true,
  defaults: {
    segment: 'corporate', contact: '', phone: '', email: '',
    billing_address: '', payment_terms: 'NET 30', credit_limit: 0, outstanding: 0
  },
  pick: (c, cur) => ({
    name: c.name !== undefined ? String(c.name).trim() : cur.name,
    code: c.code !== undefined ? String(c.code).trim().toUpperCase() : cur.code,
    segment: c.segment !== undefined ? String(c.segment).trim().toLowerCase() : cur.segment,
    contact: c.contact !== undefined ? String(c.contact).trim() : cur.contact,
    phone: c.phone !== undefined ? String(c.phone).trim() : cur.phone,
    email: c.email !== undefined ? String(c.email).trim() : cur.email,
    billing_address: c.billing_address !== undefined ? String(c.billing_address).trim() : cur.billing_address,
    payment_terms: c.payment_terms !== undefined ? String(c.payment_terms).trim() : cur.payment_terms,
    credit_limit: c.credit_limit !== undefined ? (Number(c.credit_limit) || 0) : cur.credit_limit,
    outstanding: c.outstanding !== undefined ? (Number(c.outstanding) || 0) : cur.outstanding
  }),
  refCollections: [
    { arr: v2SalesOrders, fields: ['client', 'client_name', 'customer', 'customer_name'] },
    { arr: v2ArInvoices, fields: ['client', 'client_name', 'customer', 'customer_name'] },
    { arr: v2DeliveryNotes, fields: ['client', 'client_name', 'customer', 'customer_name'] }
  ]
});

app.get('/api/v2/master/clients', listMasterEntities(v2Clients));
app.get('/api/v2/master/operational', (req, res) => {
  const opData = scopeCompany(v2Products, req).map(p => ({
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
app.get('/api/v2/inventory/movements', (req, res) => res.json(scopeCompany(v2Movements, req)));

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

app.get('/api/v2/inventory/balances', async (req, res) => {
  let productsList = scopeCompany([...v2Products], req);
  if (supabase && productsList.length === 0) {
    try {
      const { company_name } = req.query;
      let q = supabase.from('items').select('*');
      if (company_name && company_name !== 'NOT ASSIGNED') q = q.eq('company_name', company_name);
      const { data, error } = await q;
      if (!error && data && data.length > 0) {
        productsList = data.map(item => ({
          id: item.id,
          sku: item.sku,
          name: item.name,
          item_type: item.item_type || (item.category === 'Chassis' ? 'PREBUILT' : 'SPARE_PART'),
          stock: Number(item.stock_on_hand ?? item.stock ?? 0),
          stock_on_hand: Number(item.stock_on_hand ?? item.stock ?? 0),
          allocated: 0,
          available: Number(item.stock_on_hand ?? item.stock ?? 0),
          bin_code: item.bin_code || 'PB-A-1-01',
          cost_price: Number(item.cost_price || (item.unit_price ? item.unit_price * 0.8 : 0)),
          valuation: (Number(item.cost_price || (item.unit_price ? item.unit_price * 0.8 : 0))) * (Number(item.stock_on_hand ?? item.stock ?? 0)),
          company_name: item.company_name
        }));
      }
    } catch (err) {
      console.debug('Error getting inventory items for balances:', err);
    }
  }

  const totalValuation = calculateTotalValuation(productsList);
  const byCategory = {
    PREBUILT: productsList.filter(p => p.item_type === 'PREBUILT').reduce((acc, p) => acc + ((p.cost_price || 0) * (p.stock || p.stock_on_hand || 0)), 0),
    BAREBONE: productsList.filter(p => p.item_type === 'BAREBONE').reduce((acc, p) => acc + ((p.cost_price || 0) * (p.stock || p.stock_on_hand || 0)), 0),
    SPARE_PART: productsList.filter(p => p.item_type === 'SPARE_PART').reduce((acc, p) => acc + ((p.cost_price || 0) * (p.stock || p.stock_on_hand || 0)), 0)
  };

  res.json({
    total_sku: productsList.length,
    total_valuation: totalValuation,
    by_category: byCategory,
    products: productsList.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      item_type: p.item_type,
      stock_on_hand: p.stock_on_hand ?? p.stock ?? 0,
      allocated: p.allocated ?? 0,
      available: p.available ?? p.stock ?? 0,
      bin_code: p.bin_code || 'PB-A-1-01',
      cost_price: p.cost_price || 0,
      valuation: (p.cost_price || 0) * (p.stock_on_hand ?? p.stock ?? 0)
    }))
  });
});

app.get('/api/v2/inventory/serials', (req, res) => {
  const { status, sku } = req.query;
  let results = scopeCompany([...v2Serials], req);
  if (status) results = results.filter(s => s.status === status);
  if (sku) results = results.filter(s => s.sku === sku);
  res.json(results);
});

app.get('/api/v2/inventory/serials/:serial_no', (req, res) => {
  const sn = scopeCompany(v2Serials, req).find(s => s.serial_no === req.params.serial_no);
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

app.get('/api/v2/inventory/transfers', (req, res) => {
  const trfMovements = scopeCompany(v2Movements, req).filter(m => m.movement_type.startsWith('TRF_'));
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
    company_name: req.companyName,
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
    company_name: req.companyName,
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

app.get('/api/v2/inventory/adjustments', (req, res) => {
  const adjMovements = scopeCompany(v2Movements, req).filter(m => m.movement_type.startsWith('ADJ_'));
  res.json(adjMovements);
});

app.post('/api/v2/inventory/adjustments', (req, res) => {
  const { product_sku, bin_code, qty, reason, note } = req.body;
  const prod = v2Products.find(p => p.sku === product_sku);
  const numQty = Number(qty) || 0;
  const movType = numQty >= 0 ? 'ADJ_IN' : 'ADJ_OUT';

  const mov = {
    id: `mov-${Date.now()}`,
    company_name: req.companyName,
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

// Bulk stock setup — set the ABSOLUTE on-hand quantity for many SKUs in one shot.
// Purpose: initialise / re-baseline stock master data from a physical count or
// opening balance sheet. Every line that changes is written to the immutable
// ledger as an ADJ_IN / ADJ_OUT movement (never a silent UPDATE on the balance),
// so the golden rule is preserved and the change is fully auditable.
// The v2Persistence middleware flushes the collection to Supabase before the 2xx.
app.post('/api/v2/inventory/stock-setup', (req, res) => {
  const body = req.body || {};
  const items = Array.isArray(body)
    ? body
    : (Array.isArray(body.items) ? body.items : null);
  if (!items) {
    return res.status(400).json({ error: 'Expected { items: [{ sku, qty, bin_code? }] }' });
  }
  if (items.length > 2000) {
    return res.status(413).json({ error: 'Too many items in one request (max 2000)' });
  }

  const reason = String(body.reason || 'Initial Stock Setup').slice(0, 80);
  const note = String(body.note || '').slice(0, 200);
  const actor = (req.user && req.user.email) || 'Inventory Staff';
  const stamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const refCode = `SETUP-${Date.now().toString().slice(-6)}`;

  const applied = [];
  const skipped = [];
  let totalQty = 0;
  let totalValue = 0;
  let changed = 0;

  for (const raw of items) {
    const sku = String((raw && raw.sku) || '').trim();
    if (!sku) { skipped.push({ sku: '', reason: 'missing sku' }); continue; }

    const prod = v2Products.find(p => p.sku === sku);
    if (!prod) { skipped.push({ sku, reason: 'sku not found' }); continue; }

    const target = Math.max(0, Math.trunc(Number(raw.qty) || 0));
    const current = Number(prod.stock ?? prod.stock_on_hand ?? 0) || 0;
    const delta = target - current;

    if (raw.bin_code) prod.bin_code = String(raw.bin_code).trim();

    if (delta !== 0) {
      const mov = {
        id: `mov-${Date.now()}-${applied.length}`,
        company_name: req.companyName,
        movement_type: delta > 0 ? 'ADJ_IN' : 'ADJ_OUT',
        product_name: prod.name,
        sku: prod.sku,
        qty: delta,
        bin_code: prod.bin_code || 'PB-A-1-01',
        ref_doc: refCode,
        unit_cost: Number(prod.cost_price) || 0,
        note: `${reason}${note ? ' · ' + note : ''} (set ${current} -> ${target})`,
        created_at: stamp,
        created_by: actor
      };
      v2Movements.unshift(mov);
      changed += 1;
    }

    prod.stock = target;
    prod.stock_on_hand = target;

    totalQty += target;
    totalValue += target * (Number(prod.cost_price) || 0);
    applied.push({ sku, previous: current, qty: target, delta });
  }

  res.json({
    ok: true,
    ref: refCode,
    applied: applied.length,
    changed,
    skipped,
    total_qty: totalQty,
    total_value: totalValue
  });
});

app.get('/api/v2/inventory/aging', (req, res) => {
  const now = Date.now();
  const ageDays = (v) => {
    const t = new Date(String(v || '').replace(' ', 'T'));
    return Number.isNaN(t.getTime()) ? 0 : Math.max(0, Math.floor((now - t.getTime()) / 86400000));
  };

  // Derive stock age + recent activity from the movement ledger (not hardcoded).
  const lastInbound = new Map();
  const activity = new Map();
  for (const m of scopeCompany(v2Movements, req)) {
    const key = String(m.sku || m.product_name || '').trim();
    if (!key) continue;
    const age = ageDays(m.created_at);
    if (/IN|RECEIPT|_IN/i.test(m.movement_type || '')) {
      if (age < (lastInbound.get(key) ?? Infinity)) lastInbound.set(key, age);
    }
    if (age <= 90) activity.set(key, (activity.get(key) || 0) + Math.abs(Number(m.qty) || 0));
  }

  const buckets = {
    '0_30_days': { qty: 0, value: 0 },
    '31_60_days': { qty: 0, value: 0 },
    '61_90_days': { qty: 0, value: 0 },
    '91_180_days': { qty: 0, value: 0 },
    'over_180_days': { qty: 0, value: 0 }
  };
  const classes = { fast: [], medium: [], slow: [], dead: [] };
  let idleCapital = 0;

  for (const p of scopeCompany(v2Products, req)) {
    const key = p.sku;
    const stockQty = Number(p.stock ?? p.stock_on_hand ?? 0) || 0;
    const value = stockQty * (Number(p.cost_price) || 0);
    const age = lastInbound.has(key) ? lastInbound.get(key) : 0;
    const bucket = age <= 30 ? '0_30_days' : age <= 60 ? '31_60_days' : age <= 90 ? '61_90_days' : age <= 180 ? '91_180_days' : 'over_180_days';
    buckets[bucket].qty += stockQty;
    buckets[bucket].value += value;
    if (age > 90) idleCapital += value;
    const act = activity.get(key) || 0;
    if (stockQty === 0) classes.dead.push(key);
    else if (act > 50) classes.fast.push(key);
    else if (act > 15) classes.medium.push(key);
    else classes.slow.push(key);
  }

  res.json({ buckets, idle_capital: idleCapital, movement_classes: classes });
});

app.get('/api/v2/inventory/rma', (req, res) => res.json(scopeCompany(v2RMACases, req)));
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
app.get('/api/v2/scm/purchase-orders', (req, res) => res.json(scopeCompany(v2PurchaseOrders, req)));

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

app.get('/api/v2/scm/requisitions', (req, res) => res.json(scopeCompany(v2Requisitions, req)));

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
  const prItems = Array.isArray(pr.items) ? pr.items : [];
  const itemsTotal = prItems.reduce((sum, li) => {
    const prod = v2Products.find(p => p.sku === li.sku);
    return sum + ((Number(li.qty) || 0) * (Number(prod?.cost_price) || 0));
  }, 0);
  const newPO = {
    id: `po-${Date.now()}`,
    po_number: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    supplier_name: pr.supplier_name || 'PT Synnex Metrodata Indonesia',
    order_date: new Date().toISOString().substring(0, 10),
    expected_date: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
    status: 'APPROVED',
    currency: 'IDR',
    items: prItems,
    items_count: prItems.length,
    total: itemsTotal || (pr.suggested_qty || 20) * 1850000
  };
  v2PurchaseOrders.unshift(newPO);
  res.json({ success: true, message: 'PR successfully converted to PO', purchase_order: newPO });
});

app.get('/api/v2/scm/goods-receipts', (req, res) => res.json(scopeCompany(v2GRNList, req)));

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

app.get('/api/v2/scm/qc-inspections', (req, res) => res.json(scopeCompany(v2QCInspections, req)));

app.post('/api/v2/scm/qc-inspections/:id/action', (req, res) => {
  const { action, target_bin = 'SP-CPU-A-01', note } = req.body;
  const qc = v2QCInspections.find(q => q.id === req.params.id || q.gr_number === req.params.id);
  // Resolve the received batch by gr_number / id / the buyer's PO reference.
  // The SCM UI passes the PO number here, so without the po_number match the GRN
  // is never found and QC silently falls back to a hardcoded demo line (wrong SKU).
  const targetGR = v2GRNList.find(g =>
    g.id === req.params.id || g.gr_number === req.params.id || g.po_number === req.params.id || g.id === qc?.gr_id
  );

  if (action === 'PASS' || action === 'RELEASE') {
    if (qc) qc.status = 'PASSED';
    if (targetGR) targetGR.status = 'QC_RELEASED';

    // Derive released lines from the GRN (items[] if provided, else the legacy
    // product_sku/qty pair) instead of a hardcoded CPU+15.
    const rawLines = Array.isArray(targetGR?.items) && targetGR.items.length
      ? targetGR.items
      : (targetGR?.product_sku
          ? [{ sku: targetGR.product_sku, name: targetGR.product_name, qty: targetGR.qty, bin_code: target_bin }]
          : []);
    if (!rawLines.length) {
      return res.status(404).json({ success: false, status: 'NOT_FOUND', message: `No GRN/PO matched reference "${req.params.id}" — cannot release stock.` });
    }

    const stamped = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const movements = [];
    let apAmount = 0;
    for (const ln of rawLines) {
      const qty = Number(ln.qty) || 0;
      if (!ln.sku || qty <= 0) continue;
      const prod = v2Products.find(p => p.sku === ln.sku);
      const unitCost = Number(prod?.cost_price) || 0;
      if (prod) prod.stock = (Number(prod.stock) || 0) + qty;
      apAmount += unitCost * qty;
      movements.push({
        id: `mov-${Date.now()}-${movements.length}`,
        movement_type: 'QC_RELEASE',
        product_name: ln.name || prod?.name || ln.sku,
        sku: ln.sku,
        qty,
        bin_code: ln.bin_code || target_bin,
        ref_doc: targetGR?.gr_number || 'GRN-2026-0043',
        unit_cost: unitCost,
        note: note || 'Lolos inspeksi segel dan boot test',
        created_at: stamped,
        created_by: 'QC Inspector'
      });
    }
    for (const m of movements) v2Movements.unshift(m);

    const apBill = apAmount > 0 ? {
      id: `ap-${Date.now()}`,
      bill_no: `BILL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      vendor: targetGR?.supplier_name || 'Silicon Tech Global Ltd',
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
      amount: apAmount,
      status: 'unpaid',
      term: 'NET 30'
    } : null;
    if (apBill) v2ApBills.unshift(apBill);

    return res.json({
      success: true,
      status: 'PASSED',
      message: `QC Passed! Released ${movements.length} line(s)${apBill ? ' and AP Bill automatically created.' : '.'}`,
      movements,
      ap_bill: apBill
    });
  }

  // Reject / RTV
  if (qc) qc.status = 'REJECTED';
  res.json({ success: true, status: 'REJECTED', message: 'Item rejected and quarantined for vendor return.' });
});

app.get('/api/v2/scm/vendor-prices', (req, res) => {
  const bySku = {};
  for (const q of scopeCompany(v2VendorPrices, req)) (bySku[q.sku] = bySku[q.sku] || []).push(q);
  const comparison = Object.entries(bySku).map(([sku, rows]) => {
    const sorted = [...rows].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    return { sku, suppliers: sorted, best_supplier: sorted[0]?.supplier_name, best_price: sorted[0]?.price };
  });
  res.json({ quotes: scopeCompany(v2VendorPrices, req), comparison });
});
app.post('/api/v2/scm/vendor-prices', (req, res) => {
  const q = {
    id: `vp-${Date.now()}`,
    company_name: req.companyName,
    supplier_name: req.body.supplier_name || '',
    sku: String(req.body.sku || '').trim(),
    price: Number(req.body.price) || 0,
    lead_days: Number(req.body.lead_days) || 0,
    defect_rate: req.body.defect_rate || '',
    rating: req.body.rating || '',
    valid_from: req.body.valid_from || new Date().toISOString().substring(0, 10)
  };
  if (!q.sku) return res.status(400).json({ error: 'sku is required' });
  v2VendorPrices.unshift(q);
  res.status(201).json(q);
});

app.get('/api/v2/scm/rtv', (req, res) => res.json(scopeCompany(v2RTVCases, req)));
app.post('/api/v2/scm/rtv', (req, res) => {
  // Create the return case as DRAFT. The physical goods-issue (RTV_OUT) and its
  // balance effect happen at /rtv/:id/ship — matching the two-step UI flow
  // (create draft -> ship). Previously this forced SHIPPED and posted an
  // RTV_OUT movement without touching stock.
  const newRTV = {
    id: `rtv-${Date.now()}`,
    rtv_number: `RTV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'DRAFT',
    ...req.body
  };
  v2RTVCases.unshift(newRTV);
  res.status(201).json({ success: true, rtv: newRTV });
});

// Ship an existing inbound return (RTV) and issue the vendor credit note.
// Previously the client mutated localStorage only, so the shipment was never
// persisted — this endpoint makes it durable.
app.post('/api/v2/scm/rtv/:id/ship', (req, res) => {
  const rtv = v2RTVCases.find(r => r.id === req.params.id);
  if (!rtv) return res.status(404).json({ error: 'RTV case not found', code: 'RTV_NOT_FOUND' });

  rtv.status = 'SHIPPED';
  rtv.shipped_at = new Date().toISOString().replace('T', ' ').substring(0, 16);
  rtv.credit_note_no = rtv.credit_note_no || `CN-VEND-${Math.floor(100 + Math.random() * 900)}`;

  // Post RTV_OUT AND apply it to the stock balance (golden rule — P1).
  const itemName = rtv.item_name || rtv.product_name;
  const qty = Number(rtv.qty || 1);
  const prod = v2Products.find(p => (rtv.product_sku && p.sku === rtv.product_sku) || p.name === itemName);
  const mov = {
    id: `mov-${Date.now()}`,
    movement_type: 'RTV_OUT',
    product_name: itemName,
    sku: prod?.sku || rtv.product_sku || undefined,
    qty: -qty,
    bin_code: rtv.bin_code || 'RMA-HOLD-01',
    ref_doc: rtv.credit_note_no,
    unit_cost: Number(prod?.cost_price) || 0,
    created_at: rtv.shipped_at,
    created_by: 'Return Admin'
  };
  v2Movements.unshift(mov);
  if (prod) prod.stock = Math.max(0, (Number(prod.stock) || 0) - qty);

  // Apply the credit note against the linked AP bill.
  let apBill = null;
  const refund = Number(rtv.refund_amount || 0);
  if (refund > 0) {
    apBill = v2ApBills.find(b =>
      (rtv.ap_bill_id && b.id === rtv.ap_bill_id) ||
      (rtv.po_number && (b.po_number === rtv.po_number || b.ref_doc === rtv.po_number))
    );
    if (apBill) apBill.amount = Math.max(0, Number(apBill.amount || 0) - refund);
  }

  res.json({ success: true, rtv, movement: mov, ap_bill: apBill });
});

// --- MODULE 4: BOM & PC ASSEMBLY ENGINE ENDPOINTS ---
app.get('/api/v2/assembly/boms', (req, res) => res.json(scopeCompany(v2BOMs, req)));
app.post('/api/v2/assembly/boms', (req, res) => {
  const incoming = { ...req.body };
  const sku = String(incoming.target_sku || incoming.output_sku || '').trim();
  if (!sku) return res.status(400).json({ error: 'BOM recipe requires target_sku' });
  const existing = v2BOMs.findIndex(b => (b.target_sku || b.output_sku) === sku);
  const recipe = {
    ...incoming,
    id: incoming.id || `bom-${Date.now()}`,
    version: incoming.version || 'v1.0',
    components: Array.isArray(incoming.components) ? incoming.components : []
  };
  if (existing >= 0) v2BOMs[existing] = recipe;
  else v2BOMs.unshift(recipe);
  res.status(201).json(recipe);
});

app.get('/api/v2/assembly/orders', (req, res) => res.json(scopeCompany(v2AssemblyOrders, req)));

app.post('/api/v2/assembly/orders', (req, res) => {
  const qty = Number(req.body.qty_to_build) || 1;
  const bom = findBOM(req.body.target_sku) || v2BOMs[0];
  if (!bom) return res.status(400).json({ error: 'No BOM recipe defined. Create one first.' });
  const outputSku = bom.output_sku || bom.target_sku;
  const outputProduct = v2Products.find(p => p.sku === outputSku);
  const materialCost = (bom.components || []).reduce((acc, c) => {
    const compProd = v2Products.find(p => p.sku === (c.component_sku || c.sku));
    const cost = Number(c.cost ?? compProd?.cost_price ?? 0) || 0;
    return acc + cost * (Number(c.qty) || 0);
  }, 0);
  const totalUnitHPP = materialCost + (Number(bom.labor_cost) || 0) + (Number(bom.overhead_cost) || 0);

  const newOrder = {
    id: `asm-${Date.now()}`,
    company_name: req.companyName,
    assembly_number: `ASM-ORD-2026-${String(v2AssemblyOrders.length + 1).padStart(3, '0')}`,
    product_name: bom.product_name || outputProduct?.name || outputSku,
    sku: outputSku,
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

  const refDoc = order.assembly_number;
  const movements = [];

  // Consume components: ASM_OUT journal PER component + balance deduction (P2).
  const bom = findBOM(order.sku) || v2BOMs[0];
  (bom?.components || []).forEach((comp, i) => {
    const compSku = comp.component_sku || comp.sku;
    const compProd = v2Products.find(p => p.sku === compSku);
    const used = (Number(comp.qty) || 0) * order.qty_to_build;
    if (compProd) compProd.stock = Math.max(0, (Number(compProd.stock) || 0) - used);
    movements.push({
      id: `mov-${Date.now()}-${i}`,
      movement_type: 'ASM_OUT',
      product_name: compProd?.name || comp.component_name || comp.name || compSku,
      sku: compSku,
      qty: -used,
      bin_code: order.target_bin || 'PB-A-1-01',
      ref_doc: refDoc,
      unit_cost: Number(compProd?.cost_price) || 0,
      created_at: order.completed_at,
      created_by: order.created_by
    });
  });

  const outputProd = v2Products.find(p => p.sku === order.sku);
  if (outputProd) outputProd.stock = (Number(outputProd.stock) || 0) + order.qty_to_build;

  // Receive finished goods: ASM_IN at the ACTUAL rolled-up unit cost (P2).
  const actualUnitCost = order.qty_to_build > 0
    ? (Number(order.total_cost) || 0) / order.qty_to_build
    : (Number(outputProd?.cost_price) || 0);
  movements.push({
    id: `mov-${Date.now()}-out`,
    movement_type: 'ASM_IN',
    product_name: order.product_name,
    sku: order.sku,
    qty: order.qty_to_build,
    bin_code: order.target_bin,
    ref_doc: refDoc,
    unit_cost: actualUnitCost || outputProd?.cost_price || 0,
    created_at: order.completed_at,
    created_by: order.created_by
  });
  for (const m of movements) v2Movements.unshift(m);

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

  res.json({ success: true, order, serial_generated: generatedSN, movements });
});

app.post('/api/v2/assembly/simulate', (req, res) => {
  const qty = Number(req.body.qty) || 1;
  const bom = findBOM(req.body.target_sku) || v2BOMs[0];
  const results = (bom?.components || []).map(c => {
    const sku = c.component_sku || c.sku;
    const prod = v2Products.find(p => p.sku === sku);
    const available = prod ? (Number(prod.stock) || 0) : 0;
    const required = (Number(c.qty) || 0) * qty;
    return {
      sku,
      name: prod?.name || c.component_name || c.name || sku,
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
  const prebuiltCost = Number(prebuilt?.cost_price) || 0;

  if (prebuilt && (Number(prebuilt.stock) || 0) > 0) {
    prebuilt.stock = (Number(prebuilt.stock) || 0) - 1;
  }

  const timeNow = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const refDoc = `DEBUNDLE-${target_serial}`;
  const movements = [];

  // ASM_OUT for the finished good being disassembled.
  movements.push({
    id: `mov-${Date.now()}-0`,
    movement_type: 'ASM_OUT',
    product_name: prebuilt?.name || prebuilt_sku,
    sku: prebuilt_sku,
    qty: -1,
    bin_code: 'PB-A-1-01',
    ref_doc: refDoc,
    unit_cost: prebuiltCost,
    created_at: timeNow,
    created_by: 'Assembly Tech'
  });

  // Restore components WITH an ASM_IN journal per part (P2).
  const bom = findBOM(prebuilt_sku) || v2BOMs[0];
  (bom?.components || []).forEach((comp, i) => {
    const compSku = comp.component_sku || comp.sku;
    const part = v2Products.find(p => p.sku === compSku);
    if (part) part.stock = (Number(part.stock) || 0) + (Number(comp.qty) || 0);
    movements.push({
      id: `mov-${Date.now()}-${i + 1}`,
      movement_type: 'ASM_IN',
      product_name: part?.name || comp.component_name || comp.name || compSku,
      sku: compSku,
      qty: Number(comp.qty) || 0,
      bin_code: 'PB-A-1-01',
      ref_doc: refDoc,
      unit_cost: Number(part?.cost_price) || 0,
      created_at: timeNow,
      created_by: 'Assembly Tech'
    });
  });
  for (const m of movements) v2Movements.unshift(m);

  res.json({
    success: true,
    message: `Prebuilt PC (${target_serial}) successfully disassembled. 7 spare parts returned to inventory.`,
    movements,
    updated_products: v2Products
  });
});

// --- MODULE 4: OUTBOUND / SALES & FULFILLMENT ENDPOINTS ---
app.get('/api/v2/outbound/sales-orders', (req, res) => res.json(scopeCompany(v2SalesOrders, req)));

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

app.get('/api/v2/outbound/pick-tasks', (req, res) => res.json(scopeCompany(v2PickTasks, req)));

app.post('/api/v2/outbound/pick-tasks', (req, res) => {
  const pickTask = {
    id: `pick-${Date.now()}`,
    company_name: req.companyName,
    pick_number: `PICK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'IN_PROGRESS',
    order_id: req.body.order_id || '',
    product_sku: req.body.product_sku || '',
    product_name: req.body.product_name || '',
    qty: Number(req.body.qty) || 0,
    bin_code: req.body.bin_code || '',
    created_at: new Date().toISOString()
  };
  v2PickTasks.unshift(pickTask);
  res.status(201).json({ success: true, pick_task: pickTask });
});

app.post('/api/v2/outbound/pick-tasks/wave', (req, res) => {
  const waveTask = {
    id: `wave-${Date.now()}`,
    company_name: req.companyName,
    batch_number: `WAVE-BATCH-${Math.floor(10 + Math.random() * 90)}`,
    status: 'IN_PROGRESS',
    assigned_orders: req.body.order_ids || [],
    total_lines: Number(req.body.total_lines) || (Array.isArray(req.body.order_ids) ? req.body.order_ids.length : 8),
    created_at: new Date().toISOString()
  };
  v2PickTasks.unshift(waveTask);
  res.status(201).json({ success: true, wave_task: waveTask });
});

app.get('/api/v2/outbound/pack-tasks', (req, res) => res.json(scopeCompany(v2PackTasks, req)));

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

app.get('/api/v2/outbound/delivery-notes', (req, res) => res.json(scopeCompany(v2DeliveryNotes, req)));

app.post('/api/v2/outbound/delivery-notes', (req, res) => {
  const { so_id, driver_name, vehicle_no, note } = req.body;
  const so = v2SalesOrders.find(s => s.id === so_id);

  const sj = {
    id: `sj-${Date.now()}`,
    company_name: req.companyName,
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

  // Execute Goods Issue GI (-) on stock ledger — one movement + balance
  // decrement PER SO line (multi-line outbound, P1).
  const giLines = (Array.isArray(so?.items) && so.items.length) ? so.items : [{ name: 'Lenovo ThinkPad E14 Gen 5', qty: 1 }];
  const giStamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const giMovements = [];
  for (const ln of giLines) {
    const qty = Number(ln.qty || 1);
    const prod = v2Products.find(p => (ln.sku && p.sku === ln.sku) || (ln.name && p.name === ln.name));
    giMovements.push({
      id: `mov-${Date.now()}-${giMovements.length}`,
      company_name: req.companyName,
      movement_type: 'GI',
      product_name: ln.name || prod?.name || 'Lenovo ThinkPad E14 Gen 5',
      sku: ln.sku || prod?.sku || undefined,
      qty: -qty,
      bin_code: 'PB-A-1-01',
      ref_doc: sj.sj_number,
      unit_cost: Number(prod?.cost_price) || 0,
      created_at: giStamp,
      created_by: 'Outbound Admin'
    });
    if (prod) prod.stock = Math.max(0, (Number(prod.stock) || 0) - qty);
  }
  for (const m of giMovements) v2Movements.unshift(m);

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

  res.status(201).json({ success: true, delivery_note: sj, movements: giMovements, invoice: arInv });
});

// --- MODULE 2: FINANCE & COSTING ENDPOINTS ---
app.get('/api/v2/finance/cogs', (req, res) => {
  res.json(scopeCompany(v2Products, req).map(p => {
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

app.get('/api/v2/finance/ap-bills', (req, res) => res.json(scopeCompany(v2ApBills, req)));

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

app.get('/api/v2/finance/ar-invoices', (req, res) => res.json(scopeCompany(v2ArInvoices, req)));

app.post('/api/v2/finance/ar-invoices/:id/pay', (req, res) => {
  const inv = v2ArInvoices.find(i => i.id === req.params.id || i.inv_no === req.params.id);
  if (!inv) return res.status(404).json({ error: 'AR Invoice not found' });

  inv.status = 'paid';
  inv.paid_at = new Date().toISOString();
  res.json({ success: true, invoice: inv });
});

app.get('/api/v2/finance/payments', (req, res) => res.json(scopeCompany(v2Payments, req)));
app.post('/api/v2/finance/payments', (req, res) => {
  const pay = { id: `pay-${Date.now()}`, ...req.body, paid_at: new Date().toISOString() };
  v2Payments.unshift(pay);
  res.status(201).json(pay);
});

app.get('/api/v2/finance/warranty-tickets', (req, res) => {
  const shippedValue = scopeCompany(v2SalesOrders, req)
    .filter(s => s.status === 'SHIPPED')
    .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const provision = Math.round(shippedValue * 0.02); // 2% warranty provision on shipped revenue
  const open = scopeCompany(v2WarrantyTickets, req).filter(t => t.status === 'OPEN');
  const totalEstimate = open.reduce((sum, t) => sum + (Number(t.cost_estimate) || 0), 0);
  res.json({
    tickets: scopeCompany(v2WarrantyTickets, req),
    open_count: open.length,
    total_cost_estimate: totalEstimate,
    provision,
    provision_pct: 2
  });
});
app.post('/api/v2/finance/warranty-tickets', (req, res) => {
  const t = {
    id: `wt-${Date.now()}`,
    company_name: req.companyName,
    ticket_no: `WAR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    serial_no: req.body.serial_no || '',
    sku: req.body.sku || '',
    product_name: req.body.product_name || '',
    issue: req.body.issue || '',
    status: req.body.status || 'OPEN',
    cost_estimate: Number(req.body.cost_estimate) || 0,
    assigned_vendor: req.body.assigned_vendor || '',
    opened_at: new Date().toISOString().substring(0, 10)
  };
  v2WarrantyTickets.unshift(t);
  res.status(201).json(t);
});

app.get('/api/v2/finance/exchange-rates', (_req, res) => {
  res.json({ base: 'IDR', rates: { USD: 15650, SGD: 11800, EUR: 16800 }, date: new Date().toISOString().split('T')[0] });
});

// --- MODULE 6: MANAGERIAL, BILLING & WORKER ANALYTICS ENDPOINTS ---
// --- Generic CRUD surface: every module/feature gets UPDATE + DELETE ---------
// (create + read already exist per collection). Identity keys can't be spoofed.
registerCollectionCrud({ route: '/api/v2/master/products', arr: v2Products, idKeys: ['id', 'sku'], editable: false });
registerCollectionCrud({ route: '/api/v2/master/bins', arr: v2Bins, idKeys: ['id', 'code'] });
registerCollectionCrud({ route: '/api/v2/master/warehouses', arr: v2Warehouses, idKeys: ['id', 'code'] });
registerCollectionCrud({ route: '/api/v2/master/zones', arr: v2Zones, idKeys: ['id', 'code'] });
registerCollectionCrud({ route: '/api/v2/inventory/serials', arr: v2Serials, idKeys: ['id', 'serial_no'] });
registerCollectionCrud({ route: '/api/v2/inventory/rma', arr: v2RMACases, idKeys: ['id'] });
registerCollectionCrud({ route: '/api/v2/scm/requisitions', arr: v2Requisitions, idKeys: ['id'] });
registerCollectionCrud({ route: '/api/v2/scm/purchase-orders', arr: v2PurchaseOrders, idKeys: ['id', 'po_number'] });
registerCollectionCrud({ route: '/api/v2/scm/goods-receipts', arr: v2GRNList, idKeys: ['id', 'gr_number'] });
registerCollectionCrud({ route: '/api/v2/scm/vendor-prices', arr: v2VendorPrices, idKeys: ['id'] });
registerCollectionCrud({ route: '/api/v2/scm/rtv', arr: v2RTVCases, idKeys: ['id'] });
registerCollectionCrud({ route: '/api/v2/assembly/boms', arr: v2BOMs, idKeys: ['id', 'target_sku'] });
registerCollectionCrud({ route: '/api/v2/assembly/orders', arr: v2AssemblyOrders, idKeys: ['id'] });
registerCollectionCrud({ route: '/api/v2/outbound/sales-orders', arr: v2SalesOrders, idKeys: ['id', 'so_number'] });
registerCollectionCrud({ route: '/api/v2/outbound/pick-tasks', arr: v2PickTasks, idKeys: ['id'] });
registerCollectionCrud({ route: '/api/v2/outbound/pack-tasks', arr: v2PackTasks, idKeys: ['id'] });
registerCollectionCrud({ route: '/api/v2/outbound/delivery-notes', arr: v2DeliveryNotes, idKeys: ['id'] });
registerCollectionCrud({ route: '/api/v2/finance/ap-bills', arr: v2ApBills, idKeys: ['id'] });
registerCollectionCrud({ route: '/api/v2/finance/ar-invoices', arr: v2ArInvoices, idKeys: ['id'] });
registerCollectionCrud({ route: '/api/v2/finance/payments', arr: v2Payments, idKeys: ['id'] });
registerCollectionCrud({ route: '/api/v2/finance/warranty-tickets', arr: v2WarrantyTickets, idKeys: ['id'] });

app.get('/api/v2/managerial/executive-dashboard', (req, res) => {
  const totalValuation = calculateTotalValuation(scopeCompany(v2Products, req));
  const totalSales = scopeCompany(v2SalesOrders, req).reduce((sum, s) => sum + (s.total || 0), 0);
  res.json({
    currency: 'IDR',
    total_warehouse_valuation: totalValuation,
    total_sales_revenue: totalSales,
    idle_capital: 0,
    gross_margin_pct: totalSales > 0 ? 15.0 : 0,
    total_skus: scopeCompany(v2Products, req).length,
    active_sales_orders: scopeCompany(v2SalesOrders, req).length,
    active_purchase_orders: scopeCompany(v2PurchaseOrders, req).length
  });
});

app.get('/api/v2/managerial/worker-performance', (req, res) => res.json(scopeCompany(v2WorkerActivities, req)));

app.get('/api/v2/managerial/pnl', (req, res) => {
  const totalSales = scopeCompany(v2SalesOrders, req).reduce((sum, s) => sum + (s.total || 0), 0);
  // HPP diturunkan dari ledger: total barang keluar (GI) dikali biaya aktual,
  // bukan persentase tetap 80% (P4).
  const totalCogs = scopeCompany(v2Movements, req)
    .filter(m => m.movement_type === 'GI')
    .reduce((sum, m) => sum + (Math.abs(Number(m.qty) || 0) * (Number(m.unit_cost) || 0)), 0);
  const grossProfit = totalSales - totalCogs;
  res.json({
    period: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    currency: 'IDR',
    gross_revenue: totalSales,
    cogs: totalCogs,
    gross_profit: grossProfit,
    operating_expenses: 0,
    warranty_service_deduction: 0,
    net_operating_profit: grossProfit
  });
});

// --- MODULE 6b: ACTIVITY FEED (TopNav notification bell) ---
// Derived from the durable v2 store so the bell reflects real operational
// events. Replaces the legacy client-side Supabase realtime channel.
app.get('/api/v2/notifications', (req, res) => {
  const iso = (value) => {
    if (!value) return new Date().toISOString();
    // Movements store "YYYY-MM-DD HH:mm" — normalise to ISO so browsers
    // (Safari) can parse it consistently.
    return String(value).replace(' ', 'T');
  };
  const feed = [];

  for (const m of scopeCompany(v2Movements, req)) {
    const inbound = /IN|RECEIPT|GRN|RETURN/i.test(m.movement_type || '');
    feed.push({
      id: `mv-${m.id}`,
      action: inbound ? 'Stock Received' : 'Stock Movement',
      details: {
        sku: m.sku,
        item: m.product_name || m.sku,
        qty: m.qty,
        to: m.bin_code,
        ref: m.ref_doc
      },
      created_at: iso(m.created_at),
      user_email: m.created_by || 'System'
    });
  }

  for (const gr of v2GRNList) {
    feed.push({
      id: `gr-${gr.id}`,
      action: 'Goods Receipt',
      details: { item: gr.po_id || gr.supplier_name || 'Goods Receipt', to: gr.status, ref: gr.id },
      created_at: iso(gr.created_at || gr.received_at || gr.updated_at),
      user_email: gr.created_by || 'System'
    });
  }

  for (const so of v2SalesOrders) {
    feed.push({
      id: `so-${so.id}`,
      action: 'Sales Order',
      details: { item: so.customer_name || so.client_name || 'Sales Order', to: so.status, ref: so.id },
      created_at: iso(so.created_at),
      user_email: so.created_by || 'System'
    });
  }

  for (const dn of v2DeliveryNotes) {
    feed.push({
      id: `dn-${dn.id}`,
      action: 'Delivery Note',
      details: { item: dn.customer_name || 'Delivery', to: dn.status, ref: dn.id },
      created_at: iso(dn.created_at || dn.issued_at),
      user_email: dn.created_by || 'System'
    });
  }

  feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(feed.slice(0, 20));
});

// --- MODULE 7: ATOMIC DATABASE RPC ENDPOINTS (§7) ---
app.post('/api/v2/rpc/post-grn', async (req, res) => {
  const { gr_id, actor, idempotency_key } = req.body;
  if (!gr_id) return res.status(400).json({ error: 'gr_id is required' });

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('rpc_post_grn', {
        p_gr_id: gr_id,
        p_actor: actor || null,
        p_idempotency_key: idempotency_key || null
      });
      if (!error) return res.json(data);
      console.warn('[RPC rpc_post_grn error, falling back to local]', error.message);
    } catch (err) {
      console.warn('[RPC rpc_post_grn exception]', err.message);
    }
  }

  const gr = v2GRNList.find(g => g.id === gr_id);
  if (gr) gr.status = 'POSTED';
  res.json({ success: true, gr_id, status: 'POSTED', message: 'GRN posted successfully' });
});

app.post('/api/v2/rpc/execute-assembly', async (req, res) => {
  const { asm_id, actor, idempotency_key } = req.body;
  if (!asm_id) return res.status(400).json({ error: 'asm_id is required' });

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('rpc_execute_assembly', {
        p_asm_id: asm_id,
        p_actor: actor || null,
        p_idempotency_key: idempotency_key || null
      });
      if (!error) return res.json(data);
      console.warn('[RPC rpc_execute_assembly error, falling back to local]', error.message);
    } catch (err) {
      console.warn('[RPC rpc_execute_assembly exception]', err.message);
    }
  }

  const ord = v2AssemblyOrders.find(o => o.id === asm_id);
  if (ord) {
    ord.status = 'COMPLETED';
    ord.completed_at = new Date().toISOString();
  }
  res.json({ success: true, asm_id, status: 'COMPLETED', message: 'Assembly order executed successfully' });
});

app.post('/api/v2/rpc/debundle', async (req, res) => {
  const { asm_id, actor, idempotency_key } = req.body;
  if (!asm_id) return res.status(400).json({ error: 'asm_id is required' });

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('rpc_debundle', {
        p_asm_id: asm_id,
        p_actor: actor || null,
        p_idempotency_key: idempotency_key || null
      });
      if (!error) return res.json(data);
    } catch (err) {
      console.warn('[RPC rpc_debundle exception]', err.message);
    }
  }

  const ord = v2AssemblyOrders.find(o => o.id === asm_id);
  if (ord) ord.status = 'CANCELLED';
  res.json({ success: true, asm_id, status: 'CANCELLED', message: 'Debundled successfully' });
});

app.post('/api/v2/rpc/transfer-stock', async (req, res) => {
  const { trf_id, actor, idempotency_key } = req.body;
  if (!trf_id) return res.status(400).json({ error: 'trf_id is required' });

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('rpc_transfer_stock', {
        p_trf_id: trf_id,
        p_actor: actor || null,
        p_idempotency_key: idempotency_key || null
      });
      if (!error) return res.json(data);
    } catch (err) {
      console.warn('[RPC rpc_transfer_stock exception]', err.message);
    }
  }

  res.json({ success: true, trf_id, status: 'RECEIVED', message: 'Transfer executed successfully' });
});

app.post('/api/v2/rpc/allocate-so', async (req, res) => {
  const { so_id } = req.body;
  if (!so_id) return res.status(400).json({ error: 'so_id is required' });

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('rpc_allocate_so', {
        p_so_id: so_id
      });
      if (!error) return res.json(data);
    } catch (err) {
      console.warn('[RPC rpc_allocate_so exception]', err.message);
    }
  }

  const so = v2SalesOrders.find(s => s.id === so_id);
  if (so) so.status = 'ALLOCATED';
  res.json({ success: true, so_id, status: 'ALLOCATED', message: 'SO allocated successfully' });
});

app.post('/api/v2/rpc/ship-order', async (req, res) => {
  const { sj_id, actor, idempotency_key } = req.body;
  if (!sj_id) return res.status(400).json({ error: 'sj_id is required' });

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('rpc_ship_order', {
        p_sj_id: sj_id,
        p_actor: actor || null,
        p_idempotency_key: idempotency_key || null
      });
      if (!error) return res.json(data);
    } catch (err) {
      console.warn('[RPC rpc_ship_order exception]', err.message);
    }
  }

  const sj = v2DeliveryNotes.find(d => d.id === sj_id);
  if (sj) sj.status = 'DELIVERED';
  res.json({ success: true, sj_id, status: 'DELIVERED', message: 'Shipment posted successfully' });
});

// NOTE: the authoritative health probe lives at the top of this file (it also
// reports persistence mode). A duplicate handler here previously shadowed it.

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
