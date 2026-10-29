import { chromium } from 'playwright-core';
import path from 'node:path';

const BASE = process.env.QA_BASE ?? 'http://127.0.0.1:8787';
const TOKEN = process.env.QA_ADMIN_TOKEN ?? 'test-admin-token';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.screenshot({ path: path.resolve('research/shots/admin-login.png') });

await page.fill('#admin-token', 'wrong-token');
await page.getByRole('button', { name: '进入后台' }).click();
await page.waitForTimeout(700);
const wrongError = await page.locator('text=管理令牌不正确').count();
console.log('wrong token error shown', wrongError);

await page.fill('#admin-token', TOKEN);
await page.getByRole('button', { name: '进入后台' }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: path.resolve('research/shots/admin-orders.png'), fullPage: true });

const state = await page.evaluate(() => ({
  heading: document.querySelector('h1')?.textContent?.trim(),
  hasOrder: document.body.innerText.includes('AU-2026'),
  hasCustomer: document.body.innerText.includes('测试客户') || document.body.innerText.includes('后台测试'),
  text: document.body.innerText.slice(0, 600),
}));
console.log('ADMIN', state);
console.log('ERRORS', errors);

await browser.close();
if (!state.hasOrder) process.exitCode = 1;
