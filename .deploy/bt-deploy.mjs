#!/usr/bin/env node
/**
 * 宝塔（Baota / aaPanel）通用自动发版脚本 —— 只用浏览器自动化，不需要 SSH、不需要 API Key。
 *
 *   node .deploy/bt-deploy.mjs                # 线上已是该版本则跳过（幂等）
 *   node .deploy/bt-deploy.mjs --force        # 强制重新上传解压
 *   node .deploy/bt-deploy.mjs --verify-only  # 只做线上四项验收，不碰面板
 *   node .deploy/bt-deploy.mjs --dry-run      # 只登录面板并进到站点根目录，不写任何文件
 *   node .deploy/bt-deploy.mjs --zip=path/to/app.zip
 *
 * 需要的环境变量（也可写在 BT_ENV_FILE 指向的 env 文件里，KEY=VALUE 每行一个）：
 *   BT_USER       面板账号
 *   BT_PASS       面板密码
 *   BT_PANEL      面板地址（含安全入口），如 http://1.2.3.4:32515/abcdef12/
 *   DEPLOY_SITE   对外站点，如 https://example.com
 *   DEPLOY_ROOT   站点根目录绝对路径，如 /www/wwwroot/example.com
 *   CHROME_PATH   可选，默认 C:/Program Files/Google/Chrome/Application/chrome.exe
 *   BT_ENV_FILE   可选，默认 %USERPROFILE%/.config/novacard/baota.env
 *
 * 铁律：
 *   1) 面板 nginx 按 User-Agent 过滤（不含 Mozilla/Opera 就是 404），必须用浏览器；
 *   2) 线上 data/ 是唯一数据源，zip 里不含 data/，脚本也绝不触碰它；
 *   3) 只清理 assets/ 里上一版的 index-*.js|css，不动 .user.ini/.well-known/.htaccess/404.html/config.php。
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/* ---------------------------------- config --------------------------------- */

const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl';
const ZIP = path.resolve(process.argv.find((a) => a.startsWith('--zip='))?.slice(6) || 'novacard-baota.zip');
const FORCE = process.argv.includes('--force');
const VERIFY_ONLY = process.argv.includes('--verify-only');
const DRY_RUN = process.argv.includes('--dry-run');
const CHROME =
  process.env.CHROME_PATH ||
  'C:/Program Files/Google/Chrome/Application/chrome.exe';

// 面板 nginx 对非浏览器 UA 直接 404（不是 IP 白名单），所以必须伪装成正常 Chrome
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

// Exit codes: 0 = deployed or already current; 2 = panel unreachable / flow
// aborted (origin untouched); 3 = uploaded but live verification failed.
// Keeping them distinct stops "panel down" from being reported as "bad deploy".
let phase = 'panel';
const bail = (err) => {
  console.error(`\n[fatal:${phase}]`, err?.message ?? err);
  process.exit(phase === 'verify' ? 3 : 2);
};
// top-level await failures arrive as uncaughtException, plain promises as
// unhandledRejection — handle both, otherwise the exit code is a bare 1.
process.on('uncaughtException', bail);
process.on('unhandledRejection', bail);

function loadEnvFile() {
  const file =
    process.env.BT_ENV_FILE || path.join(os.homedir(), '.config', 'novacard', 'baota.env');
  if (!fs.existsSync(file)) return { file, values: {} };
  const values = Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
  return { file, values };
}

const envFile = loadEnvFile();
const cfg = (key) => process.env[key] || envFile.values[key] || '';

function requireCfg(key, hint) {
  const v = cfg(key);
  if (!v) {
    throw new Error(
      `缺少 ${key}${hint ? `（${hint}）` : ''}：请设置环境变量，或写入 ${envFile.file}`,
    );
  }
  return v;
}

const PANEL = requireCfg('BT_PANEL', '含安全入口的面板地址');
const SITE = requireCfg('DEPLOY_SITE', '对外域名').replace(/\/$/, '');
const ROOT_DIR = requireCfg('DEPLOY_ROOT', '站点根目录绝对路径').replace(/\/$/, '');
const SITE_FOLDER = path.posix.basename(ROOT_DIR);

/* --------------------------------- helpers --------------------------------- */

function curl(args) {
  return execFileSync(CURL, args, { encoding: 'utf8' });
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function getText(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const body = curl(['-sS', '-4', '-m', '20', '-A', UA, url]);
      if (body) return body;
    } catch (e) {
      console.log(`[http] 第 ${i + 1} 次失败：${String(e.message).split('\n')[0]}`);
    }
    sleep(1500);
  }
  throw new Error(`取不到 ${url}`);
}

const statusOf = (url, head = false) =>
  curl([
    ...(head ? ['-I'] : []),
    '-sS', '-4', '-m', '20', '-A', UA, '-o', process.platform === 'win32' ? 'NUL' : '/dev/null',
    '-w', '%{http_code}', url,
  ]).trim();

const assetsOf = (html) => [...new Set([...html.matchAll(/\/assets\/([^"'?#\s]+)/g)].map((m) => m[1]))];
/** Build fingerprint stamped into index.html by the packager (covers PHP-only changes). */
const buildIdOf = (html) => html.match(/<meta\s+name="build-id"\s+content="([^"]+)"/i)?.[1] ?? null;

/* ------------------------------ acceptance checks ---------------------------- */

function verify(newAssets, expectBuild) {
  const html = getText(`${SITE}/?v=${Date.now()}`);
  const live = assetsOf(html);
  const liveBuild = buildIdOf(html);
  const missing = newAssets.filter((n) => !live.includes(n));
  for (const n of newAssets) {
    console.log('[asset]', n, statusOf(`${SITE}/assets/${n}`, true));
  }
  const health = getText(`${SITE}/api/health?t=${Date.now()}`);
  const guard = statusOf(`${SITE}/data/store.php`);
  console.log('[build id] live =', liveBuild, '| expected =', expectBuild);
  console.log('[health]', health);
  console.log('[data guard] /data/store.php →', guard, '(应为 403)');

  const okHealth = /"ok"\s*:\s*true/.test(health);
  const okGuard = guard === '403' || guard === '404';
  const okBuild = !expectBuild || liveBuild === expectBuild;
  if (missing.length) throw new Error(`页面仍引用旧 assets，缺少：${missing.join(', ')}`);
  if (!okBuild) throw new Error(`线上 build-id (${liveBuild}) 与本次 (${expectBuild}) 不一致`);
  if (!okHealth) throw new Error('健康检查未返回 {"ok":true,...}');
  if (!okGuard) throw new Error(`/data/store.php 返回 ${guard}，应被拒绝（403/404）`);
}

/* --------------------------------- main flow -------------------------------- */

if (!fs.existsSync(CHROME) && !VERIFY_ONLY) {
  throw new Error(`找不到浏览器：${CHROME}（用 CHROME_PATH 指定）`);
}

let newAssets = [];
let localBuild = null;
if (fs.existsSync(ZIP)) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bt-deploy-'));
  try {
    execFileSync('tar', ['-xf', ZIP, '-C', tmp, 'index.html']);
    const localHtml = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
    newAssets = assetsOf(localHtml);
    localBuild = buildIdOf(localHtml);
  } catch (e) {
    console.log('[zip] 读取 index.html 失败：', String(e.message).split('\n')[0]);
  }
  if (!newAssets.length) throw new Error('zip 里的 index.html 没有引用任何 assets/，拒绝发布');
} else if (!VERIFY_ONLY) {
  throw new Error(`找不到安装包：${ZIP}（先构建并打包，或用 --zip= 指定）`);
}

console.log('面板        :', PANEL);
console.log('站点        :', SITE);
console.log('根目录      :', ROOT_DIR, `(文件管理器里的目录名：${SITE_FOLDER})`);
console.log('本次 assets :', newAssets.join(', ') || '(verify-only)');
console.log('本次 build  :', localBuild ?? '(zip 未盖 build-id，退回 assets 比对)');

if (VERIFY_ONLY) {
  verify(newAssets, localBuild);
  console.log('✅ 验收通过（未改动线上）');
  process.exit(0);
}

const liveHtml = getText(`${SITE}/?t=${Date.now()}`);
const liveAssets = assetsOf(liveHtml);
const liveBuild = buildIdOf(liveHtml);
const staleAssets = liveAssets.filter((n) => !newAssets.includes(n));
console.log('线上 assets :', liveAssets.join(', ') || '(none)');
console.log('线上 build  :', liveBuild ?? '(旧包，无 build-id)');

// Prefer the build fingerprint: it also changes when only PHP changed.
const sameBuild = Boolean(localBuild && liveBuild && localBuild === liveBuild);
const sameAssets = newAssets.every((n) => liveAssets.includes(n));
if (!FORCE && !DRY_RUN && (sameBuild || (!localBuild && sameAssets))) {
  console.log('线上已经是这个版本，无需发布（需要重发请加 --force）');
  process.exit(0);
}

const { user, pass } = (() => {
  const u = cfg('BT_USER');
  const p = cfg('BT_PASS');
  if (!u || !p) {
    throw new Error(`缺少面板凭据：请设置 BT_USER/BT_PASS，或写入 ${envFile.file}`);
  }
  return { user: u, pass: p };
})();

const zipName = path.basename(ZIP);
const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--ignore-certificate-errors', '--disable-blink-features=AutomationControlled'],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN', userAgent: UA });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

const calls = [];
page.on('requestfinished', async (req) => {
  if (!req.url().includes('/files?')) return;
  const h = await req.allHeaders();
  calls.push({
    method: req.method(),
    action: new URL(req.url()).searchParams.get('action'),
    body: (req.postDataBuffer()?.toString('utf8') ?? '').slice(0, 500),
    tokenHeader: h['x-http-token'] ? 'x-http-token: <redacted>' : null,
    cookieNames: (h.cookie || '').split(';').map((s) => s.split('=')[0].trim()).filter(Boolean),
  });
});

async function clickVisibleText(text) {
  const locs = await page.getByText(text, { exact: true }).all();
  for (let i = locs.length - 1; i >= 0; i--) {
    if (await locs[i].isVisible().catch(() => false)) {
      await locs[i].click();
      return true;
    }
  }
  return false;
}

async function openSiteRoot() {
  await page.getByText('文件', { exact: true }).first().click();
  await page.waitForTimeout(3500);
  await page.getByText(SITE_FOLDER, { exact: true }).first().dblclick();
  await page.waitForTimeout(3500);
}

async function closeOverlays() {
  const dialogs = page.locator('[role="dialog"]:visible');
  if (!(await dialogs.count())) return;
  const btn = dialogs.last().locator('.el-dialog__headerbtn, [aria-label="Close"], [aria-label="关闭"]').first();
  if (await btn.count()) await btn.click().catch(() => {});
  await page.waitForTimeout(700);
  if (await page.locator('[role="dialog"]:visible').count()) await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(700);
  if (await page.locator('[role="dialog"]:visible').count()) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await openSiteRoot();
  }
}

async function deleteFile(name) {
  const item = page.getByText(name, { exact: true }).first();
  if (!(await item.count()) || !(await item.isVisible().catch(() => false))) return false;
  await item.click({ button: 'right' });
  await page.waitForTimeout(800);
  if (!(await clickVisibleText('删除'))) throw new Error(`右键菜单里没有“删除”: ${name}`);
  await page.waitForTimeout(1000);
  const dlg = page.locator('[role="dialog"]:visible').last();
  const yes = dlg.getByRole('button', { name: /确定|确认删除|删除/ }).last();
  if (await yes.count()) await yes.click();
  await page.waitForTimeout(2200);
  console.log('[删除]', name);
  return true;
}

try {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(PANEL, { waitUntil: 'domcontentloaded', timeout: 45000 });
      break;
    } catch (e) {
      if (i === 2) throw e;
      console.log('[panel] 连接超时，重试…');
      await page.waitForTimeout(3000);
    }
  }
  await page.waitForTimeout(1200);
  if (await page.locator('input[name="username"]').count()) {
    await page.locator('input[name="username"]').fill(user);
    await page.locator('input[name="password"]').fill(pass);
    await page.locator('button:has-text("登录")').first().click();
    await page.waitForTimeout(5000);
  }
  if (!(await page.getByText('文件', { exact: true }).count())) {
    await page.screenshot({ path: '.deploy/deploy-login-fail.png', fullPage: true });
    throw new Error(`登录失败，当前地址 ${page.url()}`);
  }
  console.log('[登录] ok →', page.url());

  await openSiteRoot();
  if (DRY_RUN) {
    const body = await page.locator('body').innerText();
    const present = newAssets.filter((n) => body.includes(n));
    console.log('[dry-run] 已进入站点根目录（未写入任何文件）');
    console.log('[dry-run] 目录里可见的文件条目：', (body.match(/[A-Za-z0-9._-]+\.(js|css|php|html|zip|json|svg|ini)/g) || []).slice(0, 20).join(', ') || '(未解析到)');
    console.log('[dry-run] 本次 zip 的 assets 已在线：', present.join(', ') || '(none)');
    fs.mkdirSync('.deploy', { recursive: true });
    await page.screenshot({ path: '.deploy/dry-run.png', fullPage: true });
    console.log('[dry-run] ok，截图 .deploy/dry-run.png');
    await browser.close();
    process.exit(0);
  }
  await deleteFile(zipName);

  await page.getByText('上传/下载', { exact: true }).first().click();
  await page.waitForTimeout(1200);
  const box = page.locator('[role="dialog"]').filter({ hasText: '上传文件到' }).last();
  if (!(await box.count())) throw new Error('上传弹窗没打开');
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 15000 }),
    box.getByRole('button', { name: '上传文件' }).click(),
  ]);
  await chooser.setFiles(ZIP);
  await page.waitForTimeout(800);
  await box.getByText('开始上传', { exact: true }).click();
  let uploaded = false;
  for (let i = 0; i < 60 && !uploaded; i++) {
    await page.waitForTimeout(1000);
    uploaded = (await box.innerText().catch(() => '')).includes('上传成功');
  }
  if (!uploaded) {
    console.log(await box.innerText().catch(() => ''));
    throw new Error('上传没有出现“上传成功”');
  }
  console.log('[上传] ok');
  await closeOverlays();

  await page.getByText(zipName, { exact: true }).first().waitFor({ state: 'visible', timeout: 20000 });
  await page.getByText(zipName, { exact: true }).first().click({ button: 'right' });
  await page.waitForTimeout(900);
  if (!(await clickVisibleText('解压'))) throw new Error('右键菜单里没有“解压”');
  await page.waitForTimeout(1500);
  const dlg = page.locator('[role="dialog"]').filter({ hasText: '解压文件' }).last();
  if (!(await dlg.count())) throw new Error('解压弹窗没打开');
  const target = await dlg.locator('input').nth(1).inputValue().catch(() => ''); // 第 0 个是文件名！
  if (target.replace(/\/$/, '') !== ROOT_DIR) {
    throw new Error(`解压目标不对：${target}（应为 ${ROOT_DIR}）`);
  }
  await dlg.getByRole('button', { name: '解压' }).last().click();
  let unzipped = false;
  for (let i = 0; i < 60 && !unzipped; i++) {
    await page.waitForTimeout(1000);
    if (!(await dlg.isVisible().catch(() => false))) unzipped = true;
    else if ((await dlg.innerText().catch(() => '')).includes('解压成功')) unzipped = true;
  }
  if (!unzipped) throw new Error('解压未完成');
  console.log('[解压] ok →', ROOT_DIR);
  await page.waitForTimeout(2000);

  await deleteFile(zipName);

  const assetsItem = page.getByText('assets', { exact: true }).first();
  if (!(await assetsItem.count())) throw new Error('解压后找不到 assets/ 目录');
  await assetsItem.dblclick();
  await page.waitForTimeout(2500);
  const listing = await page.locator('body').innerText();
  for (const n of newAssets) {
    if (!listing.includes(n)) throw new Error(`新资源没解压出来：${n}`);
  }
  for (const n of staleAssets) await deleteFile(n);

  fs.writeFileSync('.deploy/panel-requests.json', JSON.stringify(calls, null, 2));
  await page.screenshot({ path: '.deploy/deploy-done.png', fullPage: true });
} finally {
  await browser.close();
}

/* ------------------------------- 线上验收 ------------------------------- */

phase = 'verify';
let ok = false;
for (let i = 0; i < 10 && !ok; i++) {
  try {
    const html = getText(`${SITE}/?v=${Date.now()}`, 1);
    ok =
      newAssets.every((n) => html.includes(n)) &&
      (!localBuild || buildIdOf(html) === localBuild);
  } catch {
    /* retry */
  }
  if (!ok) await new Promise((r) => setTimeout(r, 1500));
}
verify(newAssets, localBuild);
console.log('✅ 发布成功');
process.exit(0);
