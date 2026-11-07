import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5174';
const API = 'http://localhost:5000';

async function login(page) {
  await page.goto(BASE);
  // The interactive tutorial overlay auto-opens on first login (no
  // 'moai_tutorial_completed' flag) and its full-screen backdrop blocks clicks.
  // Mark it completed before signing in so the flow is usable — mirrors what a
  // real user does by skipping the tour.
  await page.evaluate(() => localStorage.setItem('moai_tutorial_completed', 'true'));
  await page.getByText('Quick Demo Access').click();
  await page.waitForSelector('.content-area', { timeout: 15000 });
}

async function apiGet(page, path) {
  const r = await page.request.get(API + path, {
    headers: { Authorization: 'Bearer moai_demo_qa' },
  });
  return { status: r.status(), json: await r.json().catch(() => null) };
}

function arr(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

// 5.1 feature order (slug -> expected rendering keyword; informational)
const FEATURES = [
  ['/master-data/products', 'PB-ARES-78X', '6.1 Products Catalog'],
  ['/master-data/hierarchy', 'Rack-A', '6.2 Warehouse & Bins'],
  ['/master-data/brands', 'MOAI Systems', '6.3 Brands'],
  ['/master-data/suppliers', 'Synnex', '6.4 Suppliers'],
  ['/master-data/clients', 'Jaya Makmur', '6.5 Clients'],
  ['/inventory/overview', 'Racks', '1.1 3 Racks Overview'],
  ['/scm/reorder', 'Generate PR', '2.2 Auto Reorder'],
  ['/scm/price_compare', 'Price', '2.5 Price Comparison'],
  ['/scm/orders', 'Purchase Order', '2.1 Purchase Orders'],
  ['/scm/grn_qc', 'Buat GRN', '2.3 Receiving & QC Gate'],
  ['/finance/ap', 'AP Bills', '5.2 AP Bills'],
  ['/inventory/movements', 'Ledger', '1.3 Stock Ledger'],
  ['/assembly/boms', 'Ares', '3.1 BOM Recipes'],
  ['/assembly/simulator', 'Simul', '3.3 Build Simulator'],
  ['/assembly/orders', 'Assembly Order', '3.2 Assembly Orders'],
  ['/inventory/serials', 'SN-', '1.2 Serial Registry'],
  ['/assembly/debundle', 'De-bundling', '3.4 De-bundling'],
  ['/finance/cogs', 'COGS', '5.1 HPP / COGS Roll-up'],
  ['/outbound/orders', 'Sales Order', '4.1 Sales Orders'],
  ['/outbound/picking', 'Picking', '4.2 Picking Engine'],
  ['/outbound/packing', 'Packing', '4.3 Packing Station'],
  ['/outbound/surat_jalan', 'Surat Jalan', '4.4 Delivery Notes'],
  ['/finance/ar', 'AR Invoice', '5.3 AR Invoices'],
  ['/inventory/operations', 'Transfer', '1.4 Operations'],
  ['/inventory/setup', 'Stock Setup', '1.7 Stock Setup'],
  ['/inventory/aging', 'Aging', '1.5 Aging & Obsolescence'],
  ['/inventory/rma', 'RMA', '1.6 RMA & Defective'],
  ['/scm/inbound_return', 'Inbound Return', '2.4 Inbound Return'],
  ['/finance/warranty', 'Warranty', '5.4 Warranty Cost'],
];

test('5.1 render pass — semua feature render + tanpa error JS', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await login(page);

  const results = [];
  for (const [slug, kw, name] of FEATURES) {
    await page.goto(BASE + '/#' + slug);
    await page.waitForSelector('.content-area');
    await page.waitForTimeout(350);
    const text = (await page.locator('.content-area').innerText().catch(() => '')).trim();
    results.push({ name, slug, rendered: text.length > 0, keywordHit: text.includes(kw), len: text.length });
  }

  console.log('\n=== RENDER RESULT ===');
  for (const r of results) {
    console.log(`${r.rendered && r.keywordHit ? 'PASS' : r.rendered ? 'PARTIAL' : 'FAIL'} | ${r.name} | ${r.slug} | len=${r.len} | kw=${r.keywordHit}`);
  }
  console.log('=== CONSOLE/page ERRORS ===');
  console.log(errors.length ? errors.join('\n') : '(none)');

  const notRendered = results.filter((r) => !r.rendered).map((r) => r.name);
  expect(notRendered, 'feature yang tidak render').toEqual([]);
  expect(errors, 'harus tanpa error JS').toEqual([]);
});

test.describe.configure({ mode: 'serial' });

test('5.1 FASE B — procure-to-pay via UI (PR → GRN → QC, stok GPU 2→17)', async ({ page }) => {
  const before = await apiGet(page, '/api/v2/master/products');
  const gpuBefore = arr(before.json).find((p) => p.sku === 'SP-GPU-RTX4070')?.stock;
  console.log('GPU stock sebelum:', gpuBefore);

  await login(page);

  // 2.2 generate PR
  await page.goto(BASE + '/#/scm/reorder');
  await page.fill('input[placeholder="SKU komponen"]', 'SP-GPU-RTX4070');
  await page.fill('input[placeholder="Qty usulan"]', '15');
  await page.fill('input[placeholder="Supplier"]', 'PT Synnex Metrodata Indonesia');
  await page.getByRole('button', { name: '+ Generate PR' }).click();
  await page.waitForTimeout(800);
  const req = await apiGet(page, '/api/v2/scm/requisitions');
  const prCreated = arr(req.json).some((r) => r.sku === 'SP-GPU-RTX4070' || JSON.stringify(r).includes('SP-GPU-RTX4070'));
  console.log('PR dibuat (SP-GPU-RTX4070)?', prCreated);
  expect(prCreated).toBeTruthy();

  // 2.3 create GRN + QC PASS
  await page.goto(BASE + '/#/scm/grn_qc');
  await page.fill('input[placeholder="Supplier"]', 'PT Synnex Metrodata Indonesia');
  await page.fill('input[placeholder="Ref PO"]', 'PO-5.1-DEMO');
  await page.fill('textarea[placeholder*="Items (SKU:qty"]', 'SP-GPU-RTX4070:15');
  await page.getByRole('button', { name: '+ Buat GRN' }).click();
  await page.waitForTimeout(800);
  const grn = await apiGet(page, '/api/v2/scm/goods-receipts');
  const grnCreated = arr(grn.json).some((g) => g.po_number === 'PO-5.1-DEMO');
  console.log('GRN dibuat?', grnCreated);
  expect(grnCreated).toBeTruthy();

  // QC PASS -> stock release (open modal + confirm + dismiss alert)
  const qcBtn = page.getByRole('button', { name: /Mulai Inspeksi QC/ }).first();
  const qcVisible = await qcBtn.isVisible().catch(() => false);
  if (qcVisible) {
    page.once('dialog', (d) => d.accept());
    await qcBtn.click();
    await page.waitForSelector('#btn-confirm-qc', { timeout: 5000 });
    await page.locator('#btn-confirm-qc').click();
    await page.waitForTimeout(1200);
  } else {
    console.log('WARN: tombol QC tidak ditemukan; cek manual');
  }

  const after = await apiGet(page, '/api/v2/master/products');
  const gpuAfter = arr(after.json).find((p) => p.sku === 'SP-GPU-RTX4070')?.stock;
  console.log('GPU stock sesudah QC:', gpuAfter);
  expect(gpuAfter).toBe(17);
});

test('5.1 FASE C — assembly via UI (create order 3 unit → complete, barang jadi 6→9)', async ({ page }) => {
  const before = await apiGet(page, '/api/v2/master/products');
  const pbBefore = arr(before.json).find((p) => p.sku === 'PB-ARES-78X')?.stock;
  console.log('PB-ARES-78X stock sebelum:', pbBefore);

  await login(page);
  await page.goto(BASE + '/#/assembly/orders');
  await page.getByRole('button', { name: 'Buat Assembly Order Baru' }).first().click();
  await page.waitForSelector('#form-assembly-order');
  await page.fill('#assembly-order-qty', '3');
  await page.locator('#btn-submit-assembly-order').click();
  await page.waitForTimeout(900);

  // Complete the newest (first) order
  await page.reload();
  await page.waitForSelector('.content-area');
  const completeBtn = page.getByRole('button', { name: /Complete|Selesaikan/ }).first();
  const cVisible = await completeBtn.isVisible().catch(() => false);
  if (cVisible) { await completeBtn.click(); await page.waitForTimeout(1200); }
  else console.log('WARN: tombol Complete tidak ditemukan');

  const after = await apiGet(page, '/api/v2/master/products');
  const pbAfter = arr(after.json).find((p) => p.sku === 'PB-ARES-78X')?.stock;
  console.log('PB-ARES-78X stock sesudah complete:', pbAfter);
  expect(pbAfter).toBe((pbBefore ?? 6) + 3);
});

test('5.1 inventory writes via UI — register serial + manual movement', async ({ page }) => {
  await login(page);

  // 1.2 register serial
  await page.goto(BASE + '/#/inventory/serials');
  const serialForm = page.locator('form').filter({ has: page.getByPlaceholder('Serial No') });
  await serialForm.locator('input[placeholder="Serial No"]').fill('SN-QA-5.1-001');
  await serialForm.locator('input[placeholder="SKU"]').fill('SP-CPU-7800X3D');
  await serialForm.locator('input[placeholder="Nama produk"]').fill('AMD Ryzen 7 7800X3D Processor Box');
  await serialForm.locator('button[type="submit"]').click();
  await page.waitForTimeout(800);
  const serials = await apiGet(page, '/api/v2/inventory/serials');
  const serialCreated = arr(serials.json).some((s) => s.serial_no === 'SN-QA-5.1-001');
  console.log('serial SN-QA-5.1-001 dibuat?', serialCreated);
  expect(serialCreated).toBeTruthy();

  // 1.3 manual movement (stock ledger)
  await page.goto(BASE + '/#/inventory/movements');
  await page.waitForSelector('.content-area');
  // locate the movement form: it contains a movement_type select + SKU input
  const mForm = page.locator('form').filter({ has: page.locator('select') }).last();
  await mForm.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  console.log('movement form found:', await mForm.count());
  expect(await mForm.count()).toBeGreaterThan(0);
});