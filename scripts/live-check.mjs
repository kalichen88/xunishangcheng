import { chromium } from 'playwright-core';
import path from 'node:path';

const BASE = process.env.QA_BASE ?? 'https://tidesmm.kalichen80.workers.dev';
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

await page.goto(`${BASE}/service/885`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('h1', { timeout: 20000 });
await page.waitForTimeout(500);
await page.getByRole('button', { name: '加入购物车', exact: true }).click();
await page.waitForSelector('aside[role="dialog"]', { timeout: 10000 });
await page.getByRole('dialog').getByRole('button', { name: '去结算' }).click();
await page.waitForURL(/\/checkout/, { timeout: 20000 });
await page.waitForSelector('#name', { timeout: 20000 });
await page.fill('#name', '线上验收');
await page.fill('#contact', '@live_check');
await page.fill('#email', 'live@example.com');
await page.locator('label').filter({ hasText: '我已阅读并同意' }).click();
await page.waitForFunction(() => {
  const button = document.querySelector('button[type="submit"]');
  return button instanceof HTMLButtonElement && !button.disabled;
}, { timeout: 20000 });
const statusText = await page.locator('form').innerText();
console.log('channel copy', statusText.includes('提交到客服后台') ? 'database' : statusText.includes('实时发送') ? 'telegram' : 'local');
await page.getByRole('button', { name: /提交订单/ }).click();
await page.waitForURL(/\/order\//, { timeout: 30000 });
await page.waitForTimeout(800);
await page.screenshot({ path: path.resolve('research/shots/live-order.png'), fullPage: true });
const result = await page.evaluate(() => ({
  url: location.pathname,
  heading: document.querySelector('h1')?.textContent?.trim(),
  body: document.body.innerText.includes('已提交后台'),
  orderId: document.body.innerText.match(/TS-\d{8}-[A-Z0-9]+/)?.[0],
}));
console.log('LIVE ORDER', result);
console.log('ERRORS', errors);
await browser.close();
if (!result.orderId) process.exitCode = 1;
