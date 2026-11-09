import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5174';

async function gotoAuth(page) {
  await page.goto(BASE);
  await page.evaluate(() => localStorage.setItem('moai_tutorial_completed', 'true'));
}

test.beforeAll(async ({ request }) => {
  // Ensure the login-test user exists even after a local DB truncate/reseed.
  await request.post('http://localhost:5000/api/auth/register', {
    data: { email: 'friend.test@example.com', password: 'secret123', company_name: 'PT TEMAN ANDA', role: 'Admin' }
  }).catch(() => {});
});

test('register — POST /api/auth/register fire & user masuk dashboard', async ({ page }) => {
  const email = `qa.${Date.now()}@example.com`;
  let registerStatus = 0;

  await gotoAuth(page);
  await page.locator('.auth-toggle').getByText('Sign Up').click();
  await page.getByPlaceholder('admin@example.com').fill(email);
  await page.getByPlaceholder('e.g. NVIDIA').fill('PT QA REGISTER');
  await page.locator('input[type=password]').fill('pwsecret123');

  const respPromise = page.waitForResponse(r => r.url().includes('/api/auth/register'), { timeout: 15000 });
  await page.locator('.auth-btn').click();
  const resp = await respPromise;
  registerStatus = resp.status();
  const body = await resp.json().catch(() => ({}));

  expect(registerStatus, 'register POST harus firing (bukan dibiarkan tanpa network)').toBe(201);
  expect(body.user && body.user.email).toBe(email);

  // Masuk dashboard setelah register sukses.
  await page.waitForSelector('.content-area', { timeout: 15000 });
  const mail = await page.evaluate(() => localStorage.getItem('moai_auth_session'));
  expect(mail).toContain(email);
});

test('login — POST /api/auth/login fire & user masuk dashboard', async ({ page }) => {
  await gotoAuth(page);
  await page.getByPlaceholder('admin@example.com').fill('friend.test@example.com');
  await page.locator('input[type=password]').fill('secret123');

  const respPromise = page.waitForResponse(r => r.url().includes('/api/auth/login'), { timeout: 15000 });
  await page.locator('.auth-btn').click();
  const resp = await respPromise;

  expect(resp.status(), 'login POST harus 200').toBe(200);
  await page.waitForSelector('.content-area', { timeout: 15000 });
});

test('login salah password — 401 + pesan error tampil (tanpa masuk dashboard)', async ({ page }) => {
  await gotoAuth(page);
  await page.getByPlaceholder('admin@example.com').fill('friend.test@example.com');
  await page.locator('input[type=password]').fill('salah123');

  const respPromise = page.waitForResponse(r => r.url().includes('/api/auth/login'), { timeout: 15000 });
  await page.locator('.auth-btn').click();
  const resp = await respPromise;

  expect(resp.status()).toBe(401);
  await expect(page.locator('.auth-error')).toContainText('Invalid email or password');
  await expect(page.locator('.auth-container')).toBeVisible();
});