import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.QA_BASE ?? 'http://127.0.0.1:5173';
const OUT = path.resolve('research/shots');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});

const issues = [];
const consoleErrors = [];

async function attach(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`${label}: ${message.text()}`);
  });
  page.on('pageerror', (error) => issues.push(`${label}: ${error.message}`));
}

async function revealAll(page) {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const step = Math.max(420, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 90));
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 400));
  });
}

async function fullPageShot(page, filename) {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const header = document.querySelector('header');
    if (header instanceof HTMLElement) header.style.position = 'static';
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, filename), fullPage: true });
  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header instanceof HTMLElement) header.style.position = '';
  });
}

const desktop = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
await attach(desktop, 'desktop');

await desktop.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await desktop.evaluate(() => document.fonts.ready);
await desktop.waitForTimeout(800);
await desktop.screenshot({ path: path.join(OUT, 'home-viewport.png') });
await revealAll(desktop);
await fullPageShot(desktop, 'home-desktop.png');

const homeStats = await desktop.evaluate(() => ({
  title: document.title,
  h1: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim(),
  cards: document.querySelectorAll('a[href^="/service/"]').length,
  bodyHeight: document.body.scrollHeight,
  visibleReveals: document.querySelectorAll('.reveal.is-visible').length,
  totalReveals: document.querySelectorAll('.reveal').length,
}));
console.log('HOME', homeStats);

await desktop.goto(`${BASE}/services`, { waitUntil: 'domcontentloaded' });
await desktop.waitForTimeout(700);
await desktop.screenshot({ path: path.join(OUT, 'services-desktop.png'), fullPage: false });

// Filter to Telegram via sidebar
await desktop.getByRole('button', { name: /^Telegram/ }).first().click();
await desktop.waitForTimeout(500);
const servicesState = await desktop.evaluate(() => ({
  url: location.pathname + location.search,
  countText: document.body.innerText.match(/共\s*[\d,]+\s*项服务/)?.[0],
  cards: document.querySelectorAll('a[href^="/service/"]').length,
}));
console.log('SERVICES', servicesState);
await desktop.screenshot({ path: path.join(OUT, 'services-telegram.png'), fullPage: false });

// Search from a clean catalog state
await desktop.goto(`${BASE}/services`, { waitUntil: 'domcontentloaded' });
await desktop.getByRole('textbox', { name: '搜索服务' }).fill('Instagram 关注');
await desktop.keyboard.press('Enter');
await desktop.waitForTimeout(700);
const searchState = await desktop.evaluate(() => ({
  url: location.pathname + location.search,
  countText: document.body.innerText.match(/共\s*[\d,]+\s*项服务/)?.[0],
  cards: document.querySelectorAll('a[href^="/service/"]').length,
}));
console.log('SEARCH', searchState);
if (!searchState.cards) issues.push('search returned no cards for Instagram 关注');
await desktop.screenshot({ path: path.join(OUT, 'services-search.png'), fullPage: false });

// Detail page
await desktop.goto(`${BASE}/service/885`, { waitUntil: 'domcontentloaded' });
await desktop.waitForTimeout(500);
await desktop.screenshot({ path: path.join(OUT, 'detail-desktop.png'), fullPage: false });
const detailState = await desktop.evaluate(() => ({
  title: document.title,
  h1: document.querySelector('h1')?.textContent?.trim(),
  price: document.body.innerText.includes('0.608'),
}));
console.log('DETAIL', detailState);

// Add to cart (exact text avoids related-card quick-add buttons)
await desktop.getByRole('button', { name: '加入购物车', exact: true }).click();
await desktop.waitForTimeout(600);
await desktop.screenshot({ path: path.join(OUT, 'cart-drawer.png'), fullPage: false });
const cartState = await desktop.evaluate(() => ({
  cart: JSON.parse(localStorage.getItem('tidesmm:cart.v1') ?? '[]'),
  drawerOpen: Boolean(document.querySelector('aside[role="dialog"]')),
}));
console.log('CART', cartState);
if (!cartState.drawerOpen) issues.push('cart drawer did not open after add to cart');

await desktop.getByRole('dialog').getByRole('button', { name: '去结算' }).click();
await desktop.waitForURL(/\/checkout/, { timeout: 10000 });
await desktop.waitForTimeout(800);
await fullPageShot(desktop, 'checkout-desktop.png');

await desktop.fill('#name', '测试客户');
await desktop.fill('#contact', '@tidesmm_test');
await desktop.fill('#email', 'test@example.com');
await desktop.locator('label').filter({ hasText: '我已阅读并同意' }).click();
await desktop.waitForFunction(() => {
  const button = document.querySelector('button[type="submit"]');
  return button instanceof HTMLButtonElement && !button.disabled;
});
await desktop.getByRole('button', { name: /提交订单/ }).click();
await desktop.waitForURL(/\/order\//, { timeout: 10000 });
await desktop.waitForTimeout(900);
await fullPageShot(desktop, 'order-desktop.png');
const orderState = await desktop.evaluate(() => ({
  url: location.pathname,
  heading: document.querySelector('h1')?.textContent?.trim(),
  orders: JSON.parse(localStorage.getItem('tidesmm:orders.v1') ?? '[]').length,
  cart: JSON.parse(localStorage.getItem('tidesmm:cart.v1') ?? '[]').length,
  cartLabel: document.querySelector('header button[aria-label^="购物车"]')?.getAttribute('aria-label'),
}));
console.log('ORDER', orderState);
if (!orderState.orders) issues.push('order was not saved to localStorage');
if (orderState.cart !== 0) issues.push('cart was not cleared after order');

await desktop.goto(`${BASE}/orders`, { waitUntil: 'domcontentloaded' });
await fullPageShot(desktop, 'orders-desktop.png');

// Search dialog
await desktop.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await desktop.keyboard.press('Control+k');
await desktop.waitForTimeout(400);
await desktop.screenshot({ path: path.join(OUT, 'search-dialog.png'), fullPage: false });
await desktop.keyboard.press('Escape');

// FAQ
await desktop.goto(`${BASE}/faq`, { waitUntil: 'domcontentloaded' });
await desktop.waitForTimeout(400);
await desktop.screenshot({ path: path.join(OUT, 'faq-desktop.png'), fullPage: false });

// Mobile
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await attach(mobile, 'mobile');
await mobile.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await mobile.evaluate(() => document.fonts.ready);
await mobile.waitForTimeout(700);
await revealAll(mobile);
await mobile.evaluate(() => window.scrollTo(0, 0));
await mobile.waitForTimeout(300);
await mobile.screenshot({ path: path.join(OUT, 'home-mobile-top.png') });
await mobile.evaluate(() => window.scrollTo(0, 2400));
await mobile.waitForTimeout(300);
await mobile.screenshot({ path: path.join(OUT, 'home-mobile-mid.png') });
await mobile.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 1200));
await mobile.waitForTimeout(300);
await mobile.screenshot({ path: path.join(OUT, 'home-mobile-bottom.png') });

await mobile.goto(`${BASE}/services`, { waitUntil: 'domcontentloaded' });
await mobile.waitForTimeout(600);
await mobile.screenshot({ path: path.join(OUT, 'services-mobile.png'), fullPage: false });
await mobile.goto(`${BASE}/service/885`, { waitUntil: 'domcontentloaded' });
await mobile.waitForTimeout(500);
await mobile.screenshot({ path: path.join(OUT, 'detail-mobile.png'), fullPage: false });

// Mobile checkout with an item
await mobile.goto(`${BASE}/service/885`, { waitUntil: 'domcontentloaded' });
await mobile.getByRole('button', { name: '加购', exact: true }).click();
await mobile.waitForTimeout(400);
await mobile.getByRole('dialog').getByRole('button', { name: '去结算' }).click();
await mobile.waitForTimeout(700);
await mobile.screenshot({ path: path.join(OUT, 'checkout-mobile.png'), fullPage: false });

// Overflow checks
for (const [label, page] of [
  ['desktop-home', desktop],
  ['mobile-home', mobile],
  ['mobile-services', mobile],
  ['mobile-detail', mobile],
]) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (overflow.scrollWidth > overflow.clientWidth + 2) {
    issues.push(`${label}: horizontal overflow ${overflow.scrollWidth} > ${overflow.clientWidth}`);
  }
}

console.log('CONSOLE ERRORS', consoleErrors);
console.log('ISSUES', issues);

await browser.close();
if (issues.length) process.exitCode = 1;
