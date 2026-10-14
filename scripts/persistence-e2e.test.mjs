// End-to-end proof of D1 (write-before-respond) + hydration across a restart.
//
// A minimal PostgREST-compatible mock stands in for Supabase. Its writes are
// deliberately SLOW (WRITE_DELAY_MS). If the server persisted *after* flushing
// the response (the old res.on('finish') behaviour), the POST would return in a
// few ms and the row would land later. If it persists *before* responding (the
// fix), the POST must block for at least WRITE_DELAY_MS and the row is durable
// the instant the client sees 2xx.
import { spawn } from 'node:child_process';
import http from 'node:http';
import assert from 'node:assert';

const WRITE_DELAY_MS = 400;
const MOCK_PORT = 5599;
const APP_PORT = 5600;

const rows = new Map(); // collection -> { data, updated_at }

function parseFilters(url) {
  const f = {};
  for (const [k, v] of url.searchParams.entries()) {
    if (['select', 'on_conflict', 'limit', 'offset', 'order'].includes(k)) continue;
    const m = /^eq\.(.*)$/.exec(v);
    if (m) f[k] = m[1];
  }
  return f;
}

const mock = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${MOCK_PORT}`);
  const body = [];
  req.on('data', c => body.push(c));
  req.on('end', () => {
    const raw = Buffer.concat(body).toString();
    const send = (code, payload) => {
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    };

    if (req.method === 'PATCH') {                       // conditional UPDATE
      const filters = parseFilters(url);
      const row = rows.get(filters.collection);
      const patch = JSON.parse(raw || '{}');
      setTimeout(() => {                                 // simulate slow write
        if (!row || (filters.updated_at != null && row.updated_at !== filters.updated_at)) {
          return send(200, []);
        }
        const updated_at = `v${Date.now()}`;
        rows.set(filters.collection, { data: patch.data, updated_at });
        send(200, [{ collection: filters.collection, updated_at }]);
      }, WRITE_DELAY_MS);
      return;
    }
    if (req.method === 'POST') {                        // upsert
      const patch = JSON.parse(raw || '{}');
      const list = Array.isArray(patch) ? patch : [patch];
      setTimeout(() => {
        for (const r of list) rows.set(r.collection, { data: r.data, updated_at: `v${Date.now()}` });
        send(201, list.map(r => ({ collection: r.collection })));
      }, WRITE_DELAY_MS);
      return;
    }
    // GET
    const filters = parseFilters(url);
    if (filters.collection) {
      const row = rows.get(filters.collection);
      if (url.searchParams.get('select') === 'data,updated_at') {
        return send(200, row ? { data: row.data, updated_at: row.updated_at } : null);
      }
      return send(200, row ? [{ collection: filters.collection, ...row }] : []);
    }
    send(200, [...rows.entries()].map(([collection, r]) => ({ collection, ...r })));
  });
});

await new Promise(r => mock.listen(MOCK_PORT, r));

const appEnv = {
  ...process.env,
  PORT: String(APP_PORT),
  NODE_ENV: 'development',
  VERCEL: '',
  SUPABASE_URL: `http://localhost:${MOCK_PORT}`,
  SUPABASE_ANON_KEY: 'mock-key',
  ALLOW_DEMO_ACCESS: 'true'
};

function startApp() {
  const p = spawn('node', ['server/server.js'], { env: appEnv, cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
  p.stderr.on('data', d => process.stderr.write('[app] ' + d));
  return p;
}
const waitForHealth = async () => {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://localhost:${APP_PORT}/api/health`);
      if (r.ok) return await r.json();
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('server did not become healthy');
};

const results = [];
const check = (name, fn) => { try { fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' :: ' + e.message]); } };

let app = startApp();
let health = await waitForHealth();

check('health reports durable supabase persistence', () => {
  assert.equal(health.persistence.mode, 'supabase');
  assert.equal(health.persistence.durable, true);
});

// Trigger the first /api/v2 request so the store hydrates + seeds, then let the
// delayed writes land.
await fetch(`http://localhost:${APP_PORT}/api/v2/inventory/serials`, { headers: { Authorization: 'Bearer demo' } });
await new Promise(r => setTimeout(r, WRITE_DELAY_MS + 400));
const seededProducts = rows.get('products')?.data?.length ?? 0;
check('master data seeded into the (mock) database', () => assert.ok(seededProducts > 0, `expected seeded products, got ${seededProducts}`));

// D1: a mutating request must block for the slow write before it answers.
const t0 = Date.now();
const post = await fetch(`http://localhost:${APP_PORT}/api/v2/inventory/serials`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer demo' },
  body: JSON.stringify({ serial_no: 'SN-E2E-1', sku: 'SKU-1', status: 'AVAILABLE' })
});
const elapsed = Date.now() - t0;
check('D1 mutation response waits for the durable write', () => assert.ok(elapsed >= WRITE_DELAY_MS, `response came back in ${elapsed}ms, expected >= ${WRITE_DELAY_MS}ms`));
check('D1 mutation was accepted', () => assert.equal(post.status, 201));
check('D1 row is durable the moment the client sees 2xx', () => {
  const serials = rows.get('serials')?.data ?? [];
  assert.ok(serials.some(s => s.serial_no === 'SN-E2E-1'), 'serial not found in DB right after the response');
});

// D1 continued: a restart must re-hydrate the persisted row (proves it is in the
// database, not merely in the process cache).
app.kill('SIGTERM');
await new Promise(r => setTimeout(r, 400));
app = startApp();
await waitForHealth();
const after = await (await fetch(`http://localhost:${APP_PORT}/api/v2/inventory/serials`, { headers: { Authorization: 'Bearer demo' } })).json();
check('data survives a process restart (hydrated from DB)', () => {
  assert.ok(Array.isArray(after) && after.some(s => s.serial_no === 'SN-E2E-1'), 'serial lost after restart');
});

app.kill('SIGTERM');
mock.close();

console.log('\n=== end-to-end persistence proofs (D1) ===');
for (const [state, name] of results) console.log(`  [${state}] ${name}`);
const failed = results.filter(([s]) => s === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
