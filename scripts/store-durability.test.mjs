// Standalone proof for the persistence layer (server/store.js).
// Uses an in-memory fake of the Supabase query builder to assert the five
// durability guarantees D1–D5 without needing a live database.
import assert from 'node:assert';
import { bindSupabase, collection, ensureReady, persistAll, registerSeed, invalidate, status } from '../server/store.js';

// --- fake Supabase: a table of rows keyed by `collection` --------------------
const db = new Map(); // collection -> { data, updated_at }
let updateCalls = 0, upsertCalls = 0, selectCalls = 0;
let versionClock = 0;
const nextVersion = () => `2026-01-01T00:00:${String(versionClock++).padStart(2, '0')}.000Z`;

function makeClient() {
  return {
    from(table) {
      assert.equal(table, 'v2_store');
      const q = {
        _op: 'select', _filters: {}, _payload: null,
        select() { selectCalls++; return this; },
        eq(col, val) { this._filters[col] = val; return this; },
        update(payload) { this._op = 'update'; this._payload = payload; return this; },
        upsert(rows) {
          upsertCalls++;
          const row = Array.isArray(rows) ? rows[0] : rows;
          // JSONB round-trips through serialization → store a deep copy, exactly
          // like Supabase does (this is why the real client never aliases).
          db.set(row.collection, { data: structuredClone(row.data), updated_at: row.updated_at });
          return Promise.resolve({ error: null });
        },
        maybeSingle() {
          const row = db.get(this._filters.collection);
          return Promise.resolve({ data: row ? { data: structuredClone(row.data), updated_at: row.updated_at } : null, error: null });
        },
        then(resolve) { // awaits as a SELECT/UPDATE terminal
          if (this._op === 'update') {
            updateCalls++;
            const key = this._filters.collection;
            const row = db.get(key);
            const guard = this._filters.updated_at;
            if (row && guard != null && row.updated_at !== guard) {
              return resolve({ data: [], error: null }); // 0 rows → conflict
            }
            const v = nextVersion();
            db.set(key, { data: structuredClone(this._payload.data), updated_at: v });
            return resolve({ data: [{ collection: key, updated_at: v }], error: null });
          }
          const rows = [...db.entries()].map(([collection, r]) => ({ collection, data: structuredClone(r.data), updated_at: r.updated_at }));
          return resolve({ data: rows, error: null });
        }
      };
      return q;
    }
  };
}

const results = [];
function check(name, fn) {
  try { fn(); results.push(['PASS', name]); }
  catch (e) { results.push(['FAIL', name + ' :: ' + e.message]); }
}

const seed = () => ({ products: [{ id: 'p1', sku: 'SKU-1', stock: 10 }], brands: [{ id: 'b1', name: 'Acme' }] });

bindSupabase(makeClient());
registerSeed(seed);

// D4 + D2: first hydrate seeds once and writes only the seeded collections.
await ensureReady();
check('D4 seed runs once', () => {
  assert.equal(collection('products').length, 1);
  assert.equal(db.size, 2);
});

// D4: emptying a collection must NOT resurrect defaults.
collection('products').length = 0;
await persistAll();
check('D4 emptied collection not resurrected', () => {
  assert.equal(collection('products').length, 0);
  assert.deepEqual(db.get('products').data, []);
});
await ensureReady();
check('D4 still empty after re-hydrate', () => assert.equal(collection('products').length, 0));

// D2: persistAll must not touch collections whose content is unchanged.
upsertCalls = 0; updateCalls = 0;
await persistAll(); // nothing changed
check('D2 no-op write when nothing changed', () => assert.equal(upsertCalls + updateCalls, 0));

// D2: only the changed collection is written.
collection('brands').push({ id: 'b2', name: 'Globex' });
upsertCalls = 0; updateCalls = 0;
const r = await persistAll();
check('D2 writes only the changed collection', () => {
  assert.equal(r.written, 1);
  assert.equal(upsertCalls + updateCalls, 1);
});

// D3: a concurrent writer that lands between hydrate and persist is merged,
// not clobbered.
invalidate();
await ensureReady();                       // we hydrate {p1, b1, b2}
const remote = db.get('brands').data;
db.set('brands', { data: [...remote, { id: 'b3', name: 'Initech' }], updated_at: nextVersion() }); // someone else writes
collection('brands').push({ id: 'b4', name: 'Umbrella' }); // we write too
await persistAll();
check('D3 concurrent write merged (no lost update)', () => {
  const ids = db.get('brands').data.map(b => b.id).sort();
  assert.deepEqual(ids, ['b1', 'b2', 'b3', 'b4']);
});

// D5: status is visible.
check('D5 status exposes mode', () => {
  const s = status();
  assert.equal(s.mode, 'supabase');
  assert.equal(s.durable, true);
  assert.ok('lastError' in s);
});

// D5: degradation to memory mode when the table is missing.
bindSupabase({ from: () => ({ select: () => Promise.resolve({ data: null, error: { code: '42P01', message: 'relation "v2_store" does not exist' } }) }) });
invalidate();
await ensureReady();
check('D5 degrades to memory mode on missing table', () => {
  assert.equal(status().mode, 'memory');
  assert.equal(status().durable, false);
});

console.log('\n=== store.js durability proofs ===');
for (const [state, name] of results) console.log(`  [${state}] ${name}`);
const failed = results.filter(([s]) => s === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
