// =============================================================================
// MOAI ERP v2 — Persistence layer (PostgreSQL-backed collection store)
// =============================================================================
// Single source of truth for every v2 collection. Persists to a local (or
// remote) PostgreSQL database via the `v2_store` table (one row per collection),
// with a Supabase fallback for the hosted deployment and a last-resort
// in-memory mode.
//
// Design (unchanged from the Supabase version):
//   * collection(name) returns a *stable* array/object reference mutated
//     in-place by the handlers.
//   * ensureReady() hydrates the cache before each /api/v2 request (TTL).
//   * persistAll() is awaited BEFORE the response is flushed on mutating
//     requests (write-before-respond), so the write is durable before the
//     client sees a 2xx.
//   * Seed-once: a collection is seeded only when it has never been hydrated.
//
// Realtime: every successful write emits a `change` event on the shared bus
// (server/db.js) which the SSE endpoint fans out to connected clients.
// =============================================================================

import { getPool, emitChange } from './db.js';

const COLLECTION_TABLE = 'v2_store';
const HYDRATE_TTL_MS = 5000;

/** optional Supabase client (hosted deployment only) */
let supabase = null;

export function bindSupabase(client) {
  supabase = client || null;
}

/** name -> array | object (stable references handed out to callers) */
const cache = new Map();
const initialized = new Set();
const persistedSnapshot = new Map();

let lastHydrateAt = 0;
let hydrateInFlight = null;
let pgAvailable = true;
let lastError = null;

export function collection(name) {
  let ref = cache.get(name);
  if (!ref || !Array.isArray(ref)) {
    ref = [];
    cache.set(name, ref);
  }
  return ref;
}

export function object(name, defaults = {}) {
  let ref = cache.get(name);
  if (!ref || Array.isArray(ref) || typeof ref !== 'object') {
    ref = { ...defaults };
    cache.set(name, ref);
  }
  return ref;
}

function applyValue(name, value) {
  if (Array.isArray(value)) {
    const ref = collection(name);
    const items = value === ref ? value.slice() : value;
    ref.length = 0;
    for (const item of items) ref.push(item);
    return;
  }
  if (value && typeof value === 'object') {
    const ref = object(name, {});
    const source = value === ref ? { ...value } : value;
    for (const key of Object.keys(ref)) delete ref[key];
    Object.assign(ref, source);
    return;
  }
}

function handleError(error, context) {
  lastError = error || null;
  console.warn(`[v2-store] ${context}:`, error?.message || error);
}

function isPgConnectionError(err) {
  const m = String((err && (err.message || err.code)) || '');
  return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|getaddrinfo|connection refused|connect |terminating connection|Connection terminated/i.test(m);
}

export async function ensureReady() {
  const now = Date.now();
  if (now - lastHydrateAt < HYDRATE_TTL_MS) return;
  if (hydrateInFlight) return hydrateInFlight;

  hydrateInFlight = (async () => {
    const seen = new Set();
    const pool = getPool();

    // 1) Hydrate from PostgreSQL (primary)
    if (pool && pgAvailable) {
      try {
        const { rows } = await pool.query(
          `SELECT collection, data, updated_at FROM ${COLLECTION_TABLE}`
        );
        for (const row of rows || []) {
          if (!row || !row.collection) continue;
          applyValue(row.collection, row.data);
          persistedSnapshot.set(row.collection, JSON.stringify(row.data));
          initialized.add(row.collection);
          seen.add(row.collection);
        }
      } catch (err) {
        handleError(err, 'pg hydrate');
        if (isPgConnectionError(err) || /does not exist|no such table|relation .*v2_store/i.test(err?.message || '')) {
          pgAvailable = false;
        }
      }
    }

    // 2) Fallback to Supabase (hosted deployment)
    if (supabase && supabase.from && !seen.size) {
      try {
        const { data, error } = await supabase
          .from(COLLECTION_TABLE)
          .select('collection,data,updated_at');
        if (error) handleError(error, 'supabase hydrate');
        else for (const row of data || []) {
          if (!row || !row.collection) continue;
          applyValue(row.collection, row.data);
          persistedSnapshot.set(row.collection, JSON.stringify(row.data));
          initialized.add(row.collection);
          seen.add(row.collection);
        }
      } catch (err) {
        handleError(err, 'supabase hydrate');
      }
    }

    // 3) Seed any collection that has never been hydrated (seed-once)
    const seeded = await seedMissing(seen);
    if (seeded.length) console.log('[v2-store] seeded collections:', seeded.join(', '));

    lastHydrateAt = Date.now();
  })();

  try { await hydrateInFlight; } catch (err) { handleError(err, 'hydrate await'); }
  return hydrateInFlight;
}

async function seedMissing(seen) {
  if (!seedProvider) return [];
  const defaults = seedProvider() || {};
  const seeded = [];
  for (const [name, value] of Object.entries(defaults)) {
    if (value === undefined) continue;
    const empty = Array.isArray(value) ? value.length === 0 : false;
    if (empty) continue;
    const already = initialized.has(name) || seen.has(name);
    // A collection persisted as an EMPTY array/object (e.g. after a bad bulk
    // import or partial seed) must be re-seeded — "seed-once" must not mean
    // "seed-once-even-if-the-later persisted value is empty".
    const existing = cache.get(name);
    const existingEmpty = !existing || (Array.isArray(existing)
      ? existing.length === 0
      : Object.keys(existing).length === 0);
    if (already && !existingEmpty) continue;
    applyValue(name, value);
    initialized.add(name);
    seeded.push(name);
  }
  if (seeded.length) await persistAll();
  return seeded;
}

export async function persistAll() {
  const pool = getPool();

  const changed = [];
  for (const [name, value] of cache.entries()) {
    const json = JSON.stringify(value);
    if (persistedSnapshot.get(name) === json) continue;
    changed.push({ name, value });
  }
  if (!changed.length) return { mode: currentMode(), written: 0 };

  let written = 0;

  // --- PostgreSQL primary path -------------------------------------------------
  if (pool && pgAvailable) {
    for (const { name, value } of changed) {
      try {
        await pool.query(
          `INSERT INTO ${COLLECTION_TABLE} (collection, data, updated_at)
           VALUES ($1, $2::jsonb, $3)
           ON CONFLICT (collection)
           DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
          [name, JSON.stringify(value), new Date().toISOString()]
        );
        persistedSnapshot.set(name, JSON.stringify(value));
        written += 1;
        emitChange(name);
      } catch (err) {
        handleError(err, `pg persist:${name}`);
        if (isPgConnectionError(err)) pgAvailable = false;
      }
    }
    if (written) lastHydrateAt = Date.now();
    return { mode: currentMode(), written };
  }

  // --- Supabase fallback path (hosted) -----------------------------------------
  if (supabase && supabase.from) {
    for (const { name, value } of changed) {
      try {
        const { error } = await supabase
          .from(COLLECTION_TABLE)
          .upsert([{ collection: name, data: value, updated_at: new Date().toISOString() }], { onConflict: 'collection' });
        if (error) { handleError(error, `supabase persist:${name}`); continue; }
        persistedSnapshot.set(name, JSON.stringify(value));
        written += 1;
        emitChange(name);
      } catch (err) {
        handleError(err, `supabase persist:${name}`);
      }
    }
    if (written) lastHydrateAt = Date.now();
    return { mode: currentMode(), written };
  }

  // --- In-memory (no DB configured) --------------------------------------------
  for (const { name, value } of changed) persistedSnapshot.set(name, JSON.stringify(value));
  return { mode: currentMode(), written: 0 };
}

export function invalidate() { lastHydrateAt = 0; }

function currentMode() {
  const pool = getPool();
  if (pool && pgAvailable) return 'postgres';
  if (supabase && supabase.from) return 'supabase';
  return 'memory';
}

export function status() {
  const mode = currentMode();
  return {
    mode,
    durable: mode === 'postgres' || mode === 'supabase',
    table: COLLECTION_TABLE,
    collections: cache.size,
    lastError: lastError ? String(lastError.message || lastError) : null
  };
}

// --- seeding --------------------------------------------------------------------

let seedProvider = null;

export function registerSeed(provider) {
  seedProvider = provider;
}