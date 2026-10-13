// =============================================================================
// MOAI ERP v2 — Persistence Layer (Supabase-backed collection store)
// =============================================================================
// Fixes QA-01 (data not durable on Vercel serverless) by making Supabase the
// single source of truth for every v2 collection.
//
// Design:
//   * Each collection ("products", "suppliers", ...) is stored as ONE row in the
//     `public.v2_store` table:  (collection TEXT PK, data JSONB, updated_at).
//   * `collection(name)` returns a *stable* array reference that is mutated
//     in-place by hydration, so the existing handlers keep working unchanged
//     (they still call .push()/.unshift()/.find()/[...spread]).
//   * Before every /api/v2 request the cache is re-hydrated (TTL guarded).
//   * After every mutating /api/v2 request the whole cache is persisted.
//   * If Supabase is not configured (local dev) or the table is missing, the
//     store silently degrades to a pure in-memory store.
//
// Migration required:  supabase_v2_store.sql
// =============================================================================

const COLLECTION_TABLE = 'v2_store';
const HYDRATE_TTL_MS = 5000;

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let supabase = null;

/** name -> array | object (stable references handed out to callers) */
const cache = new Map();

let lastHydrateAt = 0;
let hydrateInFlight = null;
let tableAvailable = true;
let missingWarned = false;

export function bindSupabase(client) {
  supabase = client || null;
}

/** Stable array reference for a collection. Safe to mutate in place. */
export function collection(name) {
  let ref = cache.get(name);
  if (!ref || !Array.isArray(ref)) {
    ref = [];
    cache.set(name, ref);
  }
  return ref;
}

/** Stable object reference for a singleton document. Safe to mutate in place. */
export function object(name, defaults = {}) {
  let ref = cache.get(name);
  if (!ref || Array.isArray(ref) || typeof ref !== 'object') {
    ref = { ...defaults };
    cache.set(name, ref);
  }
  return ref;
}

/** Replace the *contents* of a stable reference without breaking identity. */
function applyValue(name, value) {
  if (Array.isArray(value)) {
    const ref = collection(name);
    ref.length = 0;
    for (const item of value) ref.push(item);
    return;
  }
  if (value && typeof value === 'object') {
    const ref = object(name, {});
    for (const key of Object.keys(ref)) delete ref[key];
    Object.assign(ref, value);
    return;
  }
}

function isMissingTable(error) {
  if (!error) return false;
  const code = error.code || '';
  const msg = error.message || '';
  return code === 'PGRST205' || code === '42P01' || /could not find the table|does not exist/i.test(msg);
}

function handleError(error, context) {
  if (isMissingTable(error)) {
    tableAvailable = false;
    if (!missingWarned) {
      missingWarned = true;
      console.warn(
        `[v2-store] Table "${COLLECTION_TABLE}" not found — running in IN-MEMORY mode. ` +
        `Run supabase_v2_store.sql to enable durable persistence.`
      );
    }
    return;
  }
  console.warn(`[v2-store] ${context}:`, error.message || error);
}

/**
 * Hydrate the cache from Supabase, then seed any collection that has never
 * been written. Guarded by a TTL so warm invocations reuse the cache.
 */
export async function ensureReady() {
  const now = Date.now();
  if (supabase && tableAvailable && now - lastHydrateAt < HYDRATE_TTL_MS) return;
  if (hydrateInFlight) return hydrateInFlight;

  hydrateInFlight = (async () => {
    let seen = new Set();
    try {
      if (supabase && tableAvailable) {
        const { data, error } = await supabase
          .from(COLLECTION_TABLE)
          .select('collection,data');
        if (error) {
          handleError(error, 'hydrate');
        } else {
          for (const row of data || []) {
            if (!row || !row.collection) continue;
            applyValue(row.collection, row.data);
            seen.add(row.collection);
          }
        }
      }

      // Always make sure every collection has defaults. This covers pure
      // in-memory mode, a missing v2_store table, and any transient DB error —
      // seedMissing() skips collections that already hold data (QA-03).
      const seeded = await seedMissing(seen);
      if (seeded.length) console.log('[v2-store] seeded collections:', seeded.join(', '));

      lastHydrateAt = Date.now();
    } catch (err) {
      handleError(err, 'hydrate');
    } finally {
      hydrateInFlight = null;
    }
  })();

  return hydrateInFlight;
}

/** Persist every cached collection. Called after each mutating request. */
export async function persistAll() {
  if (!supabase || !tableAvailable) return;
  const rows = [];
  for (const [name, value] of cache.entries()) {
    rows.push({ collection: name, data: value, updated_at: new Date().toISOString() });
  }
  if (!rows.length) return;
  try {
    const { error } = await supabase
      .from(COLLECTION_TABLE)
      .upsert(rows, { onConflict: 'collection' });
    if (error) return handleError(error, 'persist');
    lastHydrateAt = Date.now();
  } catch (err) {
    handleError(err, 'persist');
  }
}

/** Force a re-hydrate on the next request (used after external writes). */
export function invalidate() {
  lastHydrateAt = 0;
}

export function status() {
  return { mode: supabase && tableAvailable ? 'supabase' : 'memory', table: COLLECTION_TABLE };
}

// --- seeding ---------------------------------------------------------------

let seedProvider = null;

/** Register a function () => ({ collectionName: defaultValue }). */
export function registerSeed(provider) {
  seedProvider = provider;
}

async function seedMissing(seen) {
  if (!seedProvider) return [];
  const defaults = seedProvider() || {};
  const seeded = [];
  for (const [name, value] of Object.entries(defaults)) {
    if (seen.has(name)) continue;
    if (value === undefined) continue;
    const empty = Array.isArray(value) ? value.length === 0 : false;
    if (empty) continue;
    // Skip collections that already hold data in the cache (memory mode re-runs
    // this on every request with an empty `seen` set).
    const existing = cache.get(name);
    const alreadyFilled = Array.isArray(existing)
      ? existing.length > 0
      : Boolean(existing && typeof existing === 'object' && Object.keys(existing).length > 0);
    if (alreadyFilled) continue;
    applyValue(name, value);
    seeded.push(name);
  }
  if (seeded.length && supabase && tableAvailable) await persistAll();
  return seeded;
}
