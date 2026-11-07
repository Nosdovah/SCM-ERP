import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5174';
const OUT = '/home/octarine/projects/SCM-ERP/qa_screenshots/ui_51';

const shots = [
  ['/inventory/overview', 'm1_inventory_racks'],
  ['/scm/reorder', 'm2_scm_reorder'],
  ['/scm/grn_qc', 'm2_scm_receiving_qc'],
  ['/scm/price_compare', 'm2_scm_price_compare'],
  ['/assembly/orders', 'm3_assembly_orders'],
  ['/assembly/simulator', 'm3_build_simulator'],
  ['/inventory/serials', 'm1_serial_registry'],
  ['/inventory/movements', 'm1_stock_ledger'],
  ['/outbound/orders', 'm4_sales_orders'],
  ['/finance/ap', 'm5_ap_bills'],
  ['/finance/warranty', 'm5_warranty'],
  ['/master-data/products', 'm6_products'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE);
await page.evaluate(() => localStorage.setItem('moai_tutorial_completed', 'true'));
await page.getByText('Quick Demo Access').click();
await page.waitForSelector('.content-area');

for (const [slug, name] of shots) {
  await page.goto(BASE + '/#' + slug);
  await page.waitForSelector('.content-area');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log('saved', name);
}
await browser.close();
console.log('DONE ->', OUT);