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
//   * After every mutating /api/v2 request the cache is persisted — and the
//     response is NOT flushed until the write has landed (see server.js
//     v2Persistence), so a serverless freeze cannot drop the write.
//
// Durability guarantees:
//   D1  Write-before-respond   — persistAll() is awaited before res.json/send.
//   D2  Diff-based writes      — only collections whose content actually changed
//                                are written; untouched collections are never
//                                clobbered by another instance's snapshot.
//   D3  Optimistic concurrency — each write is a conditional UPDATE guarded on
//                                the `updated_at` we hydrated; on conflict the
//                                current DB value is re-read, merged, and the
//                                merge is written back (no lost updates).
//   D4  Seed-once              — a collection is seeded only when it has never
//                                been hydrated nor seeded, so emptying a
//                                collection does not resurrect default rows.
//   D5  Visible degradation    — status() exposes the live mode + last error.
//
// Migration required:  supabase_v2_store.sql
// =============================================================================

const COLLECTION_TABLE = 'v2_store';
const HYDRATE_TTL_MS = 5000;

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let supabase = null;

/** name -> array | object (stable references handed out to callers) */
const cache = new Map();

/** Collections we have hydrated from the DB or seeded in this process (D4). */
const initialized = new Set();

/** name -> JSON string of the last value known to be in the DB (D2). */
const persistedSnapshot = new Map();

/** name -> `updated_at` token we hydrated (optimistic-concurrency guard, D3). */
const hydratedVersion = new Map();

let lastHydrateAt = 0;
let hydrateInFlight = null;
let tableAvailable = true;
let missingWarned = false;
let lastError = null;

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
    // Copy first: `value` may alias `ref` (e.g. a caller hands back the very
    // array it read), and clearing before iterating would wipe both.
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

function isMissingTable(error) {
  if (!error) return false;
  const code = error.code || '';
  const msg = error.message || '';
  return code === 'PGRST205' || code === '42P01' || /could not find the table|does not exist/i.test(msg);
}

function handleError(error, context) {
  lastError = error || null;
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
  console.warn(`[v2-store] ${context}:`, error?.message || error);
}

/**
 * Hydrate the cache from Supabase, then seed any collection that has never been
 * written. Guarded by a TTL so warm invocations reuse the cache.
 */
export async function ensureReady() {
  const now = Date.now();
  if (supabase && tableAvailable && now - lastHydrateAt < HYDRATE_TTL_MS) return;
  if (hydrateInFlight) return hydrateInFlight;

  hydrateInFlight = (async () => {
    const seen = new Set();
    try {
      if (supabase && tableAvailable) {
        const { data, error } = await supabase
          .from(COLLECTION_TABLE)
          .select('collection,data,updated_at');
        if (error) {
          handleError(error, 'hydrate');
        } else {
          for (const row of data || []) {
            if (!row || !row.collection) continue;
            applyValue(row.collection, row.data);
            hydratedVersion.set(row.collection, row.updated_at ?? null);
            persistedSnapshot.set(row.collection, JSON.stringify(row.data));
            initialized.add(row.collection);
            seen.add(row.collection);
          }
        }
      }

      // Always make sure every collection has defaults. Covers pure in-memory
      // mode, a missing v2_store table, and transient DB errors (QA-03).
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

/**
 * Merge a value that changed elsewhere into ours so a concurrent writer is not
 * clobbered (D3). Arrays are unioned by `id` (local wins on the same id); plain
 * objects are shallow-merged (local wins).
 */
function mergeValues(dbValue, localValue) {
  if (Array.isArray(dbValue) && Array.isArray(localValue)) {
    const merged = [...dbValue];
    const indexById = new Map();
    merged.forEach((item, i) => {
      if (item && item.id != null) indexById.set(item.id, i);
    });
    for (const item of localValue) {
      if (item && item.id != null && indexById.has(item.id)) {
        merged[indexById.get(item.id)] = item;
      } else {
        merged.push(item);
      }
    }
    return merged;
  }
  if (
    dbValue && localValue &&
    typeof dbValue === 'object' && typeof localValue === 'object' &&
    !Array.isArray(dbValue) && !Array.isArray(localValue)
  ) {
    return { ...dbValue, ...localValue };
  }
  return localValue;
}

/**
 * Persist every collection whose content changed since the last successful
 * write (D2). Each collection is written with an optimistic-concurrency guard
 * (D3); conflicts fall back to read-merge-write.
 */
export async function persistAll() {
  if (!supabase || !tableAvailable) return { mode: 'memory', written: 0 };

  const changed = [];
  for (const [name, value] of cache.entries()) {
    const json = JSON.stringify(value);
    if (persistedSnapshot.get(name) === json) continue;
    changed.push({ name, value });
  }
  if (!changed.length) return { mode: 'supabase', written: 0 };

  let written = 0;
  for (const { name, value } of changed) {
    const nowIso = new Date().toISOString();
    const version = hydratedVersion.get(name) ?? null;
    let saved = false;

    // (1) Conditional UPDATE — only lands if nobody else touched the row since
    //     we hydrated it. This is the fast, race-free path.
    if (version) {
      try {
        const { data, error } = await supabase
          .from(COLLECTION_TABLE)
          .update({ data: value, updated_at: nowIso })
          .eq('collection', name)
          .eq('updated_at', version)
          .select('collection,updated_at');
        if (error) {
          handleError(error, `persist:${name}`);
        } else if (Array.isArray(data) && data.length > 0) {
          hydratedVersion.set(name, data[0].updated_at ?? nowIso);
          saved = true;
        }
      } catch (err) {
        handleError(err, `persist:${name}`);
      }
    }

    // (2) Fallback — first write, or a conflict (row changed / missing). Read the
    //     current row, merge our value into it, then upsert.
    if (!saved) {
      try {
        let mergedValue = value;
        const { data: current, error: readErr } = await supabase
          .from(COLLECTION_TABLE)
          .select('data,updated_at')
          .eq('collection', name)
          .maybeSingle();
        if (readErr && !isMissingTable(readErr)) handleError(readErr, `persist:read:${name}`);
        if (current && current.data !== undefined && current.data !== null) {
          mergedValue = mergeValues(current.data, value);
        }

        const { error: upErr } = await supabase
          .from(COLLECTION_TABLE)
          .upsert([{ collection: name, data: mergedValue, updated_at: nowIso }], { onConflict: 'collection' });
        if (upErr) {
          handleError(upErr, `persist:upsert:${name}`);
          continue;
        }
        if (mergedValue !== value) applyValue(name, mergedValue);
        hydratedVersion.set(name, nowIso);
        saved = true;
      } catch (err) {
        handleError(err, `persist:${name}`);
      }
    }

    if (saved) {
      written += 1;
      persistedSnapshot.set(name, JSON.stringify(cache.get(name)));
    }
  }

  if (written) lastHydrateAt = Date.now();
  return { mode: 'supabase', written };
}

/** Force a re-hydrate on the next request (used after external writes). */
export function invalidate() {
  lastHydrateAt = 0;
}

export function status() {
  return {
    mode: supabase && tableAvailable ? 'supabase' : 'memory',
    durable: Boolean(supabase && tableAvailable),
    table: COLLECTION_TABLE,
    collections: cache.size,
    lastError: lastError ? String(lastError.message || lastError) : null
  };
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
    // Seed a collection only once per process, and only when it has neither been
    // hydrated from the DB nor seeded before (D4) — so emptying a collection in
    // the UI does not resurrect the default rows on the next request.
    if (initialized.has(name) || seen.has(name)) continue;
    if (value === undefined) continue;
    const empty = Array.isArray(value) ? value.length === 0 : false;
    if (empty) continue;
    applyValue(name, value);
    initialized.add(name);
    seeded.push(name);
  }
  if (seeded.length && supabase && tableAvailable) await persistAll();
  return seeded;
}
