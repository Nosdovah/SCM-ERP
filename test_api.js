// Automated REST API Test Suite for MOAI Supply Chain ERP
// Usage: node test_api.js [BASE_URL]
// Example: node test_api.js http://localhost:5000/api
//          node test_api.js https://your-project.vercel.app/api

import { spawn } from 'node:child_process';

const BASE_URL = process.argv[2] || process.env.API_URL || 'http://localhost:5000/api';

console.log(`====================================================`);
console.log(`🧪 Starting MOAI SCM-ERP API Test Suite`);
console.log(`   Target: ${BASE_URL}`);
console.log(`====================================================\n`);

let passedTests = 0;
let failedTests = 0;
let spawnedServer = null;

async function checkOrStartServer() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.ok) {
      console.log(`⚡ Connected to active server at ${BASE_URL}\n`);
      return;
    }
  } catch {
    // Server is not currently reachable
  }

  if (BASE_URL.includes('localhost:5000')) {
    console.log(`⚡ Server not detected on localhost:5000. Auto-starting server/server.js in background...`);
    spawnedServer = spawn('node', ['server/server.js'], {
      stdio: 'pipe'
    });

    const start = Date.now();
    while (Date.now() - start < 10000) {
      try {
        const res = await fetch(`${BASE_URL}/health`);
        if (res.ok) {
          console.log(`✅ Server started successfully! Beginning test suite...\n`);
          return;
        }
      } catch {
        await new Promise(r => setTimeout(r, 400));
      }
    }
    throw new Error('Could not connect to server after 10s of launch.');
  }
}

async function test(name, fn) {
  try {
    process.stdout.write(`⏳ Testing: ${name}... `);
    await fn();
    console.log(`✅ PASS`);
    passedTests++;
  } catch (err) {
    console.log(`❌ FAIL`);
    console.error(`   Error: ${err.message}`);
    failedTests++;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorBody}`);
  }
  return res.json();
}

async function runSuite() {
  let createdOrderId = null;

  try {
    await checkOrStartServer();

    // 1. Healthcheck
    await test('GET /health (Server Health & Supabase Backend status)', async () => {
      const data = await request('/health');
      if (data.status !== 'healthy') throw new Error(`Status not healthy: ${data.status}`);
    });

    // 2. Companies
    await test('GET /companies (List Companies)', async () => {
      const data = await request('/companies');
      if (!Array.isArray(data)) throw new Error('Response is not an array');
    });

    await test('POST /companies (Register/Upsert Company)', async () => {
      const data = await request('/companies', {
        method: 'POST',
        body: JSON.stringify({ name: 'TEST_CORP_' + Date.now() })
      });
      if (!data.name) throw new Error('Company name not returned');
    });

    // 3. Suppliers & Items
    await test('GET /suppliers (List Suppliers for MANUFACTURE)', async () => {
      const data = await request('/suppliers?company_name=MANUFACTURE');
      if (!Array.isArray(data)) throw new Error('Response is not an array');
    });

    await test('GET /items (List SKUs & Check Stock)', async () => {
      const data = await request('/items?company_name=MANUFACTURE');
      if (!Array.isArray(data)) throw new Error('Response is not an array');
    });

    // 4. Orders CRUD & State Transition
    await test('POST /orders (Create Kanban Order)', async () => {
      createdOrderId = `TEST-${Date.now()}`;
      const newOrder = {
        id: createdOrderId,
        title: 'MSI Modern Series (Low): Full Polycarbonate, Slim Bezel',
        stage: 'cpo_esta',
        priority: 'High',
        assignee: 'CI Bot Tester',
        quantity: 10,
        company_name: 'MANUFACTURE',
        user_email: 'tester@moai.erp'
      };
      const data = await request('/orders', {
        method: 'POST',
        body: JSON.stringify(newOrder)
      });
      if (!data.id) throw new Error('Order creation did not return id');
    });

    await test('GET /orders (Fetch Orders and Verify Created Order)', async () => {
      const data = await request('/orders?company_name=MANUFACTURE');
      const found = data.find(o => o.id === createdOrderId);
      if (!found) throw new Error(`Created order ${createdOrderId} not found in listing`);
    });

    await test('PATCH /orders/:id/stage (Advance Order Stage to vc_wbs)', async () => {
      const data = await request(`/orders/${createdOrderId}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({
          stage: 'vc_wbs',
          user_email: 'tester@moai.erp'
        })
      });
      if (!data.success) throw new Error('Failed to update stage');
    });

    await test('PATCH /orders/:id/checklist (Toggle Checklist Item)', async () => {
      const data = await request(`/orders/${createdOrderId}/checklist`, {
        method: 'PATCH',
        body: JSON.stringify({
          checklistState: { test_checklist_id: true },
          itemText: 'CI Test Checklist',
          status: 'Completed',
          user_email: 'tester@moai.erp'
        })
      });
      if (!data.success) throw new Error('Failed to update checklist');
    });

    // 5. Order History & Notifications
    await test('GET /orders/:id/history (Verify Audit Trail)', async () => {
      const data = await request(`/orders/${createdOrderId}/history`);
      if (!Array.isArray(data) || data.length === 0) throw new Error('Audit logs empty for order');
    });

    await test('GET /notifications (Fetch Recent Company Activity)', async () => {
      const data = await request('/notifications?company_name=MANUFACTURE&limit=5');
      if (!Array.isArray(data)) throw new Error('Notifications response is not an array');
    });

    // 6. Analytics Aggregation
    await test('GET /analytics/dashboard (Calculate Lead Times & Valuation)', async () => {
      const data = await request('/analytics/dashboard?company_name=MANUFACTURE');
      if (typeof data.totalOrders !== 'number') throw new Error('totalOrders missing');
      if (typeof data.inventoryValue !== 'number') throw new Error('inventoryValue missing');
    });

    // 7. REST Delta Sync (WebSockets Replacement)
    await test('GET /sync/all (Delta Polling Sync for Kanban & Notifications)', async () => {
      const data = await request('/sync/all?company_name=MANUFACTURE');
      if (!Array.isArray(data.orders) || !Array.isArray(data.notifications)) {
        throw new Error('Sync response does not contain orders and notifications arrays');
      }
    });

    // 8. Modul v2.0 REST API Endpoints
    await test('GET /v2/master/products (Master Data v2.0 - 12 SKUs)', async () => {
      const data = await request('/v2/master/products');
      if (!Array.isArray(data) || data.length === 0) throw new Error('v2 products list is empty');
    });

    await test('GET /v2/inventory/balances (Stock Balances & Ledger Summary)', async () => {
      const data = await request('/v2/inventory/balances');
      if (typeof data.total_valuation !== 'number' || data.total_valuation <= 0) {
        throw new Error('Inventory valuation missing or non-positive');
      }
    });

    await test('GET /v2/inventory/movements (Stock Ledger Immutable Movements)', async () => {
      const data = await request('/v2/inventory/movements');
      if (!Array.isArray(data)) throw new Error('Stock movements is not an array');
    });

    await test('GET /v2/scm/purchase-orders (SCM Purchase Orders)', async () => {
      const data = await request('/v2/scm/purchase-orders');
      if (!Array.isArray(data)) throw new Error('Purchase orders is not an array');
    });

    await test('GET /v2/assembly/boms (BOM Assembly Recipes)', async () => {
      const data = await request('/v2/assembly/boms');
      if (!Array.isArray(data) || data.length === 0) throw new Error('BOM recipes is empty');
    });

    await test('GET /v2/outbound/sales-orders (Outbound Sales Orders)', async () => {
      const data = await request('/v2/outbound/sales-orders');
      if (!Array.isArray(data)) throw new Error('Sales orders is not an array');
    });

    await test('GET /v2/finance/ap-bills (Finance AP Bills)', async () => {
      const data = await request('/v2/finance/ap-bills');
      if (!Array.isArray(data)) throw new Error('AP bills is not an array');
    });

    await test('GET /v2/managerial/executive-dashboard (Managerial Executive Overview)', async () => {
      const data = await request('/v2/managerial/executive-dashboard');
      if (typeof data.total_warehouse_valuation !== 'number') throw new Error('Total valuation missing');
    });

    // 8b. Atomic Database RPC Endpoints (§7)
    await test('POST /v2/rpc/post-grn (Atomic GRN Inbound & AP Bill RPC)', async () => {
      const data = await request('/v2/rpc/post-grn', {
        method: 'POST',
        body: JSON.stringify({ gr_id: 'grn-test-01', actor: '00000000-0000-0000-0000-000000000001' })
      });
      if (!data.success || data.status !== 'POSTED') throw new Error('Failed to post GRN via RPC');
    });

    await test('POST /v2/rpc/execute-assembly (Atomic BOM Assembly Roll-up RPC)', async () => {
      const data = await request('/v2/rpc/execute-assembly', {
        method: 'POST',
        body: JSON.stringify({ asm_id: 'asm-test-01', actor: '00000000-0000-0000-0000-000000000001' })
      });
      if (!data.success || data.status !== 'COMPLETED') throw new Error('Failed to execute assembly via RPC');
    });

    await test('POST /v2/rpc/debundle (Atomic Prebuilt Debundling RPC)', async () => {
      const data = await request('/v2/rpc/debundle', {
        method: 'POST',
        body: JSON.stringify({ asm_id: 'asm-test-01', actor: '00000000-0000-0000-0000-000000000001' })
      });
      if (!data.success || data.status !== 'CANCELLED') throw new Error('Failed to debundle via RPC');
    });

    await test('POST /v2/rpc/transfer-stock (Atomic Stock Bin Transfer TRF_OUT/IN RPC)', async () => {
      const data = await request('/v2/rpc/transfer-stock', {
        method: 'POST',
        body: JSON.stringify({ trf_id: 'trf-test-01', actor: '00000000-0000-0000-0000-000000000001' })
      });
      if (!data.success || data.status !== 'RECEIVED') throw new Error('Failed to transfer stock via RPC');
    });

    await test('POST /v2/rpc/allocate-so (Atomic SO Inventory Allocation RPC)', async () => {
      const data = await request('/v2/rpc/allocate-so', {
        method: 'POST',
        body: JSON.stringify({ so_id: 'so-test-01' })
      });
      if (!data.success || data.status !== 'ALLOCATED') throw new Error('Failed to allocate SO via RPC');
    });

    await test('POST /v2/rpc/ship-order (Atomic Goods Issue & AR Invoice RPC)', async () => {
      const data = await request('/v2/rpc/ship-order', {
        method: 'POST',
        body: JSON.stringify({ sj_id: 'sj-test-01', actor: '00000000-0000-0000-0000-000000000001' })
      });
      if (!data.success || data.status !== 'DELIVERED') throw new Error('Failed to ship order via RPC');
    });

    // 8.5 Master Data entity forms (Brands / Suppliers / Clients)
    await test('POST /v2/master/brands (Create Brand)', async () => {
      const code = `TESTBR${Date.now().toString().slice(-6)}`;
      const data = await request('/v2/master/brands', {
        method: 'POST',
        body: JSON.stringify({ name: `Test Brand ${code}`, code, description: 'CI test brand' })
      });
      if (!data.id || data.code !== code) throw new Error('Brand not created with expected code');
      // Duplicate code must be rejected with a 409
      const dupRes = await fetch(`${BASE_URL}/v2/master/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ci-test' },
        body: JSON.stringify({ name: `Test Brand Dup ${code}`, code })
      });
      if (dupRes.status !== 409) throw new Error(`Expected 409 on duplicate brand code, got ${dupRes.status}`);
    });

    await test('POST /v2/master/suppliers (Create Supplier)', async () => {
      const data = await request('/v2/master/suppliers', {
        method: 'POST',
        body: JSON.stringify({ name: `PT Test Supplier ${Date.now()}`, category: 'Distributor', payment_terms: 'NET 30' })
      });
      if (!data.id || !data.code) throw new Error('Supplier not created with generated code');
    });

    await test('POST /v2/master/suppliers (Reject missing name → 400)', async () => {
      const res = await fetch(`${BASE_URL}/v2/master/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ci-test' },
        body: JSON.stringify({ category: 'Distributor' })
      });
      if (res.status !== 400) throw new Error(`Expected 400 on missing name, got ${res.status}`);
    });

    await test('POST /v2/master/clients (Create Client)', async () => {
      const data = await request('/v2/master/clients', {
        method: 'POST',
        body: JSON.stringify({ name: `PT Test Client ${Date.now()}`, segment: 'corporate', credit_limit: 500000000 })
      });
      if (!data.id || !data.code) throw new Error('Client not created with generated code');
      if (data.credit_limit !== 500000000) throw new Error('Client credit_limit not persisted as number');
    });

    // 8.6 Master Data full CRUD (Update / Archive / Restore / Hard delete)
    const rawCall = (path, opts = {}) => fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ci-test' },
      ...opts
    });
    const listOf = async (path) => (await (await rawCall(path)).json());

    for (const ent of [
      { p: 'brands', label: 'Brand', create: { name: `CRUD Brand ${Date.now()}`, description: 'tmp' }, upd: { name: `CRUD Brand U ${Date.now()}`, description: 'updated' } },
      { p: 'suppliers', label: 'Supplier', create: { name: `PT CRUD Supplier ${Date.now()}`, lead_time_days: 9 }, upd: { lead_time_days: 21 } },
      { p: 'clients', label: 'Client', create: { name: `PT CRUD Client ${Date.now()}`, credit_limit: 1000000 }, upd: { credit_limit: 2500000 } }
    ]) {
      await test(`CRUD /v2/master/${ent.p} (update → archive → restore → hard delete)`, async () => {
        const baseline = (await listOf(`/v2/master/${ent.p}`)).length;

        const created = await (await rawCall(`/v2/master/${ent.p}`, { method: 'POST', body: JSON.stringify(ent.create) })).json();
        if (!created.id) throw new Error('create failed');
        const id = created.id;

        // UPDATE
        const updRes = await rawCall(`/v2/master/${ent.p}/${id}`, { method: 'PUT', body: JSON.stringify(ent.upd) });
        if (updRes.status !== 200) throw new Error(`update expected 200, got ${updRes.status}`);
        const upd = await updRes.json();
        if (!upd.updated_at) throw new Error('update did not stamp updated_at');
        for (const [k, v] of Object.entries(ent.upd)) {
          if (upd[k] !== v) throw new Error(`update did not persist ${k}=${v} (got ${upd[k]})`);
        }

        // UPDATE 404 / 400 / 409
        if ((await rawCall(`/v2/master/${ent.p}/nope-xyz`, { method: 'PUT', body: JSON.stringify(ent.upd) })).status !== 404) {
          throw new Error('update unknown id should be 404');
        }
        if ((await rawCall(`/v2/master/${ent.p}/${id}`, { method: 'PUT', body: JSON.stringify({ name: '   ' }) })).status !== 400) {
          throw new Error('update blank name should be 400');
        }

        // ARCHIVE
        const delRes = await rawCall(`/v2/master/${ent.p}/${id}`, { method: 'DELETE' });
        if (delRes.status !== 200) throw new Error(`delete expected 200, got ${delRes.status}`);
        const del = await delRes.json();
        if (del.archived !== true) throw new Error('delete should archive by default');
        if ((await listOf(`/v2/master/${ent.p}`)).length !== baseline) throw new Error('archived row still listed');
        if ((await listOf(`/v2/master/${ent.p}?include_archived=true`)).length !== baseline + 1) {
          throw new Error('include_archived did not surface the archived row');
        }

        // RESTORE
        const resRes = await rawCall(`/v2/master/${ent.p}/${id}/restore`, { method: 'POST', body: '{}' });
        if (resRes.status !== 200) throw new Error(`restore expected 200, got ${resRes.status}`);
        if ((await listOf(`/v2/master/${ent.p}`)).length !== baseline + 1) throw new Error('restored row not listed');

        // HARD DELETE
        const hardRes = await rawCall(`/v2/master/${ent.p}/${id}?hard=true`, { method: 'DELETE' });
        if (hardRes.status !== 200) throw new Error(`hard delete expected 200, got ${hardRes.status}`);
        if ((await listOf(`/v2/master/${ent.p}`)).length !== baseline) throw new Error('hard delete did not remove the row');

        // 404 paths
        if ((await rawCall(`/v2/master/${ent.p}/nope-xyz`, { method: 'DELETE' })).status !== 404) throw new Error('delete unknown should be 404');
        if ((await rawCall(`/v2/master/${ent.p}/nope-xyz/restore`, { method: 'POST', body: '{}' })).status !== 404) throw new Error('restore unknown should be 404');
      });
    }

    await test('CRUD reference guard (archive referenced entity allowed, hard delete refused)', async () => {
      const brands = await listOf('/v2/master/brands');
      if (!brands.length) throw new Error('no seeded brand to test the guard with');
      const target = brands[0];

      const arch = await rawCall(`/v2/master/brands/${target.id}`, { method: 'DELETE' });
      if (arch.status !== 200) throw new Error(`archive of referenced brand should succeed, got ${arch.status}`);
      const archBody = await arch.json();
      if (typeof archBody.referenced !== 'number') throw new Error('archive response missing referenced count');

      const hard = await rawCall(`/v2/master/brands/${target.id}?hard=true`, { method: 'DELETE' });
      if (hard.status !== 409) throw new Error(`hard delete of referenced brand should be 409, got ${hard.status}`);

      // Leave no trace behind.
      const restored = await rawCall(`/v2/master/brands/${target.id}/restore`, { method: 'POST', body: '{}' });
      if (restored.status !== 200) throw new Error('cleanup restore failed');
      if (!(await listOf('/v2/master/brands')).some(b => b.id === target.id)) throw new Error('brand not restored after guard test');
    });

    // 9. Cleanup test order
    if (createdOrderId) {
      await test(`DELETE /orders/:id (Cleanup Test Order ${createdOrderId})`, async () => {
        const data = await request(`/orders/${createdOrderId}`, { method: 'DELETE' });
        if (!data.success) throw new Error('Failed to delete test order');
      });
    }

  } finally {
    if (spawnedServer) {
      spawnedServer.kill();
    }
  }

  // Summary Report
  console.log(`\n====================================================`);
  console.log(`📊 Test Summary:`);
  console.log(`   Total Tests:  ${passedTests + failedTests}`);
  console.log(`   Passed:       ${passedTests} ✅`);
  console.log(`   Failed:       ${failedTests} ❌`);
  console.log(`====================================================`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  if (spawnedServer) spawnedServer.kill();
  process.exit(1);
});
process.on('SIGTERM', () => {
  if (spawnedServer) spawnedServer.kill();
  process.exit(1);
});

runSuite().catch(err => {
  console.error('\nFatal error executing test suite:', err);
  if (spawnedServer) spawnedServer.kill();
  process.exit(1);
});
