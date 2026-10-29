import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
console.log(
  'initial',
  await page.evaluate(() => ({
    reveals: document.querySelectorAll('.reveal').length,
    visible: document.querySelectorAll('.reveal.is-visible').length,
    height: document.body.scrollHeight,
  })),
);
await page.evaluate(async () => {
  const step = 600;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((resolve) => setTimeout(resolve, 180));
  }
});
await page.waitForTimeout(1200);
console.log(
  'after scroll',
  await page.evaluate(() => ({
    reveals: document.querySelectorAll('.reveal').length,
    visible: document.querySelectorAll('.reveal.is-visible').length,
    y: window.scrollY,
    height: document.body.scrollHeight,
    samples: [...document.querySelectorAll('.reveal')].slice(0, 12).map((el) => ({
      cls: el.className,
      top: Math.round(el.getBoundingClientRect().top + window.scrollY),
      opacity: getComputedStyle(el).opacity,
    })),
  })),
);
await page.screenshot({ path: 'research/shots/debug-full.png', fullPage: true });
await page.evaluate(() => window.scrollTo(0, 1500));
await page.waitForTimeout(500);
await page.screenshot({ path: 'research/shots/debug-1500.png' });
await browser.close();
