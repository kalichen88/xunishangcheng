import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://127.0.0.1:5173/service/885', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: '加入购物车', exact: true }).click();
await page.waitForTimeout(500);
await page.getByRole('dialog').getByRole('button', { name: '去结算' }).click();
await page.waitForURL(/checkout/);
await page.fill('#name', 'T');
await page.fill('#contact', '@test');
await page.locator('label').filter({ hasText: '我已阅读并同意' }).click();
await page.waitForFunction(() => {
  const b = document.querySelector('button[type="submit"]');
  return b && !b.disabled;
});
await page.getByRole('button', { name: /提交订单/ }).click();
await page.waitForURL(/\/order\//);
await page.waitForTimeout(1500);
console.log(
  await page.evaluate(() => ({
    cart: localStorage.getItem('tidesmm:cart.v1'),
    header: document.querySelector('header')?.innerText,
    badge: [...document.querySelectorAll('header span')].map((el) => el.textContent).filter((t) => t && t.trim().length <= 2),
    cartButton: document.querySelector('header button[aria-label^="购物车"]')?.getAttribute('aria-label'),
  })),
);
await browser.close();
