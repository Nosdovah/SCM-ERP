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
