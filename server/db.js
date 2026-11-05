// =============================================================================
// MOAI ERP — Local PostgreSQL data layer (drop-in for @supabase/supabase-js)
// =============================================================================
// Provides:
//   1. `pool`        — a node-postgres Pool used by store.js for the v2 store.
//   2. `createCompat()` — an object shaped like the Supabase client, so the
//      legacy /api handlers in server.js keep working unchanged:
//        compat.from(table)   -> fluent query builder (select/eq/ilike/order/
//                                 limit/gt/single/maybeSingle/insert/upsert/
//                                 update/delete/.select()).
//        compat.auth         -> local dev auth (accepts demo + any credentials).
//        compat.storage      -> local filesystem storage.
//        compat.rpc          -> returns an error so handlers fall back to their
//                                 local in-store logic (which is now durable).
//   3. `changes`       — an in-process EventEmitter for realtime fan-out (SSE).
// =============================================================================
import pg from 'pg';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

// Load .env / .env.local so DATABASE_URL is available before the pool is built,
// independent of server.js's own loader (ESM imports are hoisted, so server.js's
// loader runs AFTER this module is evaluated).
function loadEnv(file) {
  try {
    const p = path.resolve(process.cwd(), file);
    if (!fs.existsSync(p)) return;
    const data = fs.readFileSync(p, 'utf8');
    for (const line of data.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const m = t.match(/^([\w.-]+)\s*=\s*(.*)?$/);
      if (!m) continue;
      let v = (m[2] || '').trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  } catch { /* ignore */ }
}
loadEnv('.env');
loadEnv('.env.local');

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL
  || process.env.PG_CONNECTION_STRING
  || 'postgres://moai:moai_local_pw@127.0.0.1:5432/moai_erp';

let pool = null;
const poolError = { message: null };

try {
  pool = new Pool({ connectionString, max: 10 });
  pool.on('error', (err) => { poolError.message = err?.message || String(err); });
} catch (err) {
  poolError.message = err?.message || String(err);
}

// ---- realtime bus (in-process) ---------------------------------------------
export const changes = new EventEmitter();
changes.setMaxListeners(200);

export function emitChange(collection) {
  if (collection) changes.emit('change', collection);
  else changes.emit('change', '*');
}

export function getPool() { return pool; }
export function poolLastError() { return poolError.message; }

export async function ping() {
  if (!pool) return { ok: false, error: 'no pool' };
  try {
    const { rows } = await pool.query('select now() as now');
    return { ok: true, now: rows[0].now };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

// ---- ident quoting ----------------------------------------------------------
const qid = (s) => `"${String(s).replace(/"/g, '""')}"`;

function toParam(v) {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v) || (typeof v === 'object')) return JSON.stringify(v);
  return v;
}

// ---- fluent query builder ----------------------------------------------------
const SUPPORTED_OPS = { '=': '=', 'ILIKE': 'ILIKE', '>': '>' };

class Query {
  constructor(table) {
    this._table = table;
    this._method = 'select';
    this._selectCols = '*';
    this._wheres = [];
    this._orderBy = [];
    this._limit = null;
    this._single = false;      // false | 'single' | 'maybe'
    this._data = null;         // rows (insert/upsert) or object (update)
    this._onConflict = null;
    this._joinSuppliers = false;
  }

  select(cols) { this._selectCols = cols || '*'; if (String(this._selectCols).includes('suppliers(')) this._joinSuppliers = true; return this; }
  eq(col, val) { this._wheres.push(['=', col, val]); return this; }
  ilike(col, val) { this._wheres.push(['ILIKE', col, val]); return this; }
  gt(col, val) { this._wheres.push(['>', col, val]); return this; }
  order(col, opts = {}) { this._orderBy.push([col, opts && opts.ascending === false ? 'DESC' : 'ASC']); return this; }
  limit(n) { this._limit = n; return this; }
  maybeSingle() { this._single = 'maybe'; return this; }
  single() { this._single = 'single'; return this; }
  insert(rows) { this._method = 'insert'; this._data = Array.isArray(rows) ? rows : [rows]; return this; }
  upsert(rows, opts = {}) { this._method = 'insert'; this._data = Array.isArray(rows) ? rows : [rows]; this._onConflict = opts.onConflict || null; return this; }
  update(obj) { this._method = 'update'; this._data = obj; return this; }
  delete() { this._method = 'delete'; return this; }

  then(resolve, reject) { return this._run().then(resolve, reject); }
  catch(reject) { return this._run().catch(reject); }

  _whereClause(params) {
    if (!this._wheres.length) return { sql: '', params };
    const parts = [];
    for (const [op, col, val] of this._wheres) {
      params.push(toParam(val));
      parts.push(`${qid(col)} ${SUPPORTED_OPS[op] || op} $${params.length}`);
    }
    return { sql: ` WHERE ${parts.join(' AND ')}`, params };
  }

  _orderClause() {
    if (!this._orderBy.length) return '';
    const parts = this._orderBy.map(([col, dir]) => `${qid(col)} ${dir}`);
    return ` ORDER BY ${parts.join(', ')}`;
  }

  _limitClause() {
    return this._limit != null ? ` LIMIT ${Math.max(0, Math.trunc(this._limit))}` : '';
  }

  async _run() {
    if (!pool) return { data: this._method === 'select' ? [] : null, error: { message: poolError.message || 'no database connection' } };
    try {
      switch (this._method) {
        case 'select': return await this._runSelect();
        case 'insert': return await this._runInsert();
        case 'update': return await this._runUpdate();
        case 'delete': return await this._runDelete();
        default: return { data: null, error: { message: 'unknown method' } };
      }
    } catch (err) {
      return { data: null, error: { message: err?.message || String(err) } };
    }
  }

  async _runSelect() {
    let params = [];
    const { sql: whereSql, params: wParams } = this._whereClause(params);
    params = wParams;
    const orderSql = this._orderClause();
    const limitSql = this._limitClause();

    let selectSql;
    if (this._joinSuppliers) {
      // `select('*, suppliers(name)')` on items -> LEFT JOIN suppliers
      selectSql = `SELECT ${qid(this._table)}.*, jsonb_build_object('name', suppliers.name) AS suppliers FROM ${qid(this._table)} LEFT JOIN suppliers ON ${qid(this._table)}.supplier_id = suppliers.id`;
    } else if (this._selectCols === '*' ) {
      selectSql = `SELECT * FROM ${qid(this._table)}`;
    } else {
      const cols = String(this._selectCols).split(',').map(c => qid(c.trim())).join(', ');
      selectSql = `SELECT ${cols} FROM ${qid(this._table)}`;
    }

    const sql = `${selectSql}${whereSql}${orderSql}${limitSql}`;
    const { rows } = await pool.query(sql, params);

    let result = rows;
    for (const r of result) {
      if (r && r.checklistState && typeof r.checklistState === 'string') r.checklistState = safeJson(r.checklistState);
      if (r && r.details && typeof r.details === 'string') r.details = safeJson(r.details);
      if (r && r.suppliers && typeof r.suppliers === 'string') r.suppliers = safeJson(r.suppliers);
    }

    if (this._single === 'single') {
      if (!result.length) return { data: null, error: { code: 'PGRST116', message: 'no rows returned' } };
      return { data: result[0], error: null };
    }
    if (this._single === 'maybe') {
      return { data: result[0] || null, error: null };
    }
    return { data: result, error: null };
  }

  async _runInsert() {
    if (!this._data || !this._data.length) return { data: [], error: { message: 'no rows to insert' } };
    const rows = this._data;
    const keys = Object.keys(rows[0]);
    const cols = keys.map(k => qid(k)).join(', ');
    const nowIso = new Date().toISOString();

    // gather values; ensure jsonb for object/array columns
    let values = [];
    const paramSqls = [];
    const colList = [];
    for (const key of keys) {
      colList.push(qid(key));
    }
    for (const row of rows) {
      const rowParams = keys.map((k) => {
        const v = row[k];
        if (v === undefined) return null;
        if (Array.isArray(v) || (typeof v === 'object' && v !== null)) {
          values.push(JSON.stringify(v));
          const i = values.length;
          return `$${i}::jsonb`;
        }
        values.push(v);
        const i = values.length;
        return `$${i}`;
      });
      paramSqls.push(`(${rowParams.join(', ')})`);
    }

    let sql = `INSERT INTO ${qid(this._table)} (${colList.join(', ')}) VALUES ${paramSqls.join(', ')}`;
    if (this._onConflict) {
      const target = this._onConflict.split(',').map(s => qid(s.trim())).join(', ');
      const updates = keys.map(k => `${qid(k)} = EXCLUDED.${qid(k)}`).join(', ');
      sql += ` ON CONFLICT (${target}) DO UPDATE SET ${updates}`;
    }
    sql += ` RETURNING *`;

    const { rows: inserted } = await pool.query(sql, values);
    const clean = inserted.map(r => normalizeRow(r));
    emitChange(this._table);
    if (this._single === 'single') return { data: clean[0] || null, error: null };
    return { data: clean, error: null };
  }

  async _runUpdate() {
    if (!this._data) return { data: null, error: { message: 'nothing to update' } };
    const entries = Object.entries(this._data).filter(([, v]) => v !== undefined);
    if (!entries.length) return { data: null, error: { message: 'empty update' } };

    const params = [];
    const setSql = entries.map(([k, v]) => {
      if (Array.isArray(v) || (typeof v === 'object' && v !== null)) {
        params.push(JSON.stringify(v));
        return `${qid(k)} = $${params.length}::jsonb`;
      }
      params.push(v);
      return `${qid(k)} = $${params.length}`;
    }).join(', ');

    const where = this._whereClause(params);
    const sql = `UPDATE ${qid(this._table)} SET ${setSql}${where.sql} RETURNING *`;
    const { rows } = await pool.query(sql, where.params);
    const clean = rows.map(r => normalizeRow(r));
    if (!clean.length) return { data: null, error: { code: 'PGRST116', message: 'no rows updated' } };
    emitChange(this._table);
    if (this._single === 'single') return { data: clean[0], error: null };
    return { data: clean, error: null };
  }

  async _runDelete() {
    let params = [];
    const empty = this._whereClause(params);
    const sql = `DELETE FROM ${qid(this._table)}${empty.sql}`;
    await pool.query(sql, empty.params);
    emitChange(this._table);
    return { data: null, error: null };
  }
}

function safeJson(s) { try { return JSON.parse(s); } catch { return s; } }
function normalizeRow(r) { return r; }

// ---- supabase-js compatible facade (for server.js legacy handlers) ---------
export function createCompat() {
  return {
    from: (table) => new Query(table),

    auth: {
      async signInWithPassword({ email, password }) {
        const user = { email, user_metadata: { company_name: 'DEFAULT', role: 'Admin' } };
        const session = { user, access_token: `local_token_${Date.now()}` };
        return { data: { session, user }, error: null };
      },
      async signUp({ email, options = {} }) {
        return { data: { session: null, user: { email, user_metadata: options.data || {} } }, error: null };
      },
      async signOut() { return { error: null }; },
      async getUser() { return { data: { user: { id: 'local-dev', email: 'local@dev' } }, error: null }; },
      async updateUser(updates) { return { data: { user: updates }, error: null }; },
      async resetPasswordForEmail() { return { error: null }; },
      async getSession() { return { data: { session: null }, error: null }; },
      async onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; }
    },

    storage: {
      from(bucket = 'documents') {
        const dir = path.resolve(process.cwd(), 'server', 'data', 'uploads', bucket);
        fs.mkdirSync(dir, { recursive: true });
        return {
          async upload(name, buffer, opts = {}) {
            try {
              fs.writeFileSync(path.join(dir, name), buffer);
              return { error: null };
            } catch (err) {
              return { error: { message: err.message } };
            }
          },
          getPublicUrl(name) {
            return { data: { publicUrl: `/uploads/${bucket}/${name}` } };
          }
        };
      }
    },

    // RPC calls intentionally return an error so the /api/v2/rpc handlers fall
    // back to their local (now durable) in-store logic.
    async rpc() { return { data: null, error: { message: 'local rpc fallback' } }; }
  };
}

export default { getPool, ping, emitChange, changes, createCompat };