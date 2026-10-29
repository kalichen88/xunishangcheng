import { chromium } from 'playwright-core';
import path from 'node:path';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&family=Noto+Serif+SC:wght@600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1200px;height:630px;background:#10120c;color:#fbf9f4;font-family:"Noto Sans SC",sans-serif;overflow:hidden;position:relative}
  .grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(251,249,244,.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(251,249,244,.06) 1px,transparent 1px);background-size:56px 56px;mask-image:radial-gradient(ellipse 90% 80% at 60% 35%,#000 30%,transparent 78%)}
  .wrap{position:relative;display:flex;height:100%;padding:58px 64px}
  .left{width:58%;display:flex;flex-direction:column}
  .brand{display:flex;align-items:center;gap:12px}
  .mark{width:42px;height:42px;border-radius:13px;background:#10120c;border:1px solid rgba(251,249,244,.18);display:grid;place-items:center}
  .brandname{font-family:"Space Grotesk";font-size:24px;font-weight:700;letter-spacing:-.04em}
  .cn{margin-top:4px;font-size:9px;letter-spacing:.26em;color:rgba(251,249,244,.42)}
  .tag{margin-top:58px;font-family:"Space Grotesk";font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#ddfc6d}
  h1{margin-top:16px;font-family:"Noto Serif SC";font-size:72px;line-height:1.08;letter-spacing:-.04em;font-weight:600}
  h1 em{font-style:normal;color:#ddfc6d}
  .sub{margin-top:24px;font-size:15px;line-height:1.8;color:rgba(251,249,244,.55);max-width:500px}
  .chips{margin-top:28px;display:flex;gap:8px}
  .chip{border:1px solid rgba(251,249,244,.14);border-radius:999px;padding:7px 13px;font-size:10px;color:rgba(251,249,244,.55)}
  .right{position:relative;flex:1}
  .lime{position:absolute;right:8px;top:36px;width:330px;border-radius:28px;background:#ddfc6d;color:#10120c;padding:28px;transform:rotate(2.5deg);box-shadow:0 30px 60px -20px rgba(0,0,0,.6)}
  .lime .label{font-family:"Space Grotesk";font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:rgba(16,18,12,.45);display:flex;justify-content:space-between}
  .big{font-family:"Space Grotesk";font-size:68px;font-weight:600;letter-spacing:-.06em;line-height:1;margin-top:26px}
  .lime p{margin-top:8px;font-size:14px;font-weight:500}
  .bars{margin-top:28px;display:flex;align-items:flex-end;gap:6px;height:62px}
  .bar{flex:1;background:rgba(16,18,12,.24);border-radius:3px 3px 0 0}
  .bar:last-child{background:#10120c}
  .card{position:absolute;right:40px;bottom:26px;width:330px;border-radius:24px;background:#fbf9f4;color:#10120c;padding:20px;transform:rotate(-2deg);box-shadow:0 30px 60px -20px rgba(0,0,0,.55)}
  .card .top{display:flex;justify-content:space-between;align-items:center;font-family:"Space Grotesk";font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#6b6f62}
  .status{background:rgba(24,201,140,.12);color:#18c98c;border-radius:999px;padding:4px 9px;font-family:"Noto Sans SC";font-size:9px;letter-spacing:0;text-transform:none}
  .service{display:flex;align-items:center;gap:12px;margin-top:16px}
  .tg{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#2AABEE,#1E8FC4);display:grid;place-items:center}
  .sname{font-size:12px;font-weight:600;line-height:1.4}
  .smeta{margin-top:3px;font-size:9px;color:#6b6f62}
  .progress{margin-top:18px}
  .prow{display:flex;justify-content:space-between;font-size:9px;color:#6b6f62}
  .track{margin-top:7px;height:5px;border-radius:999px;background:rgba(16,18,12,.08);overflow:hidden}
  .fill{height:100%;width:68%;border-radius:999px;background:#10120c}
  .stats{display:flex;justify-content:space-between;margin-top:16px;border-top:1px solid #e4dfd2;padding-top:12px;text-align:center}
  .stat b{display:block;font-family:"Space Grotesk";font-size:12px}
  .stat span{display:block;margin-top:2px;font-size:8px;color:#6b6f62}
  .pill{position:absolute;right:20px;bottom:178px;border:1px solid rgba(251,249,244,.15);background:rgba(16,18,12,.8);border-radius:999px;padding:9px 14px;font-size:10px;color:rgba(251,249,244,.7)}
  .foot{position:absolute;left:64px;bottom:42px;font-family:"Space Grotesk";font-size:10px;letter-spacing:.14em;color:rgba(251,249,244,.28)}
</style></head>
<body>
<div class="grid"></div>
<div class="wrap">
  <div class="left">
    <div class="brand">
      <div class="mark"><svg width="26" height="26" viewBox="0 0 64 64"><path d="M13 38.5c6.4 0 6.4-9 12.8-9s6.4 9 12.8 9 6.4-9 12.4-9" fill="none" stroke="#ddfc6d" stroke-width="4.6" stroke-linecap="round"/><path d="M13 48c6.4 0 6.4-5.2 12.8-5.2S32.2 48 38.6 48s6.4-5.2 12.4-5.2" fill="none" stroke="#ddfc6d" stroke-width="3.2" stroke-linecap="round" opacity=".55"/></svg></div>
      <div><div class="brandname">TideSMM</div><div class="cn">潮汐增长</div></div>
    </div>
    <div class="tag">Social growth store · 2026</div>
    <h1>把流量，<br>做成<em>增长</em>。</h1>
    <p class="sub">10 个主流平台，3,959 项明码标价的社媒增长服务。<br>按千次计费，按需起量，一个购物车完成选购。</p>
    <div class="chips"><span class="chip">Telegram</span><span class="chip">Instagram</span><span class="chip">TikTok</span><span class="chip">YouTube</span><span class="chip">X / Twitter</span></div>
  </div>
  <div class="right">
    <div class="lime">
      <div class="label"><span>Tide Index</span><span>2026</span></div>
      <div class="big">3,959</div>
      <p>项服务，随时可下单</p>
      <div class="bars"><span class="bar" style="height:38%"></span><span class="bar" style="height:52%"></span><span class="bar" style="height:45%"></span><span class="bar" style="height:64%"></span><span class="bar" style="height:57%"></span><span class="bar" style="height:74%"></span><span class="bar" style="height:66%"></span><span class="bar" style="height:88%"></span><span class="bar" style="height:79%"></span><span class="bar" style="height:98%"></span></div>
    </div>
    <div class="pill">参考交付 · 59 分钟</div>
    <div class="card">
      <div class="top"><span>示例订单</span><span class="status">进行中</span></div>
      <div class="service">
        <div class="tg"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></div>
        <div><div class="sname">Telegram 成员 90天不掉落</div><div class="smeta">¥0.608 / 千次 · 起订 100</div></div>
      </div>
      <div class="progress"><div class="prow"><span>参考进度</span><span>68%</span></div><div class="track"><div class="fill"></div></div></div>
      <div class="stats"><div class="stat"><b>100</b><span>起订</span></div><div class="stat"><b>¥0.06</b><span>小计</span></div><div class="stat"><b>59 分钟</b><span>参考时效</span></div></div>
    </div>
  </div>
</div>
<div class="foot">TIDESMM · SOCIAL GROWTH STORE</div>
</body></html>`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);
await page.screenshot({ path: path.resolve('public/og.png') });
await browser.close();
console.log('og.png written');
