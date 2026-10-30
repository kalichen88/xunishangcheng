import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const stage = path.join(root, 'release', 'baota-stage');
const releaseDir = path.join(root, 'release');
const zipPath = path.join(releaseDir, 'au9922-baota.zip');
const tokenPath = path.join(releaseDir, 'baota-admin-token.txt');
const siteUrl = (process.env.SITE_URL ?? 'https://mizarapy.com').replace(/\/+$/, '');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  throw new Error('dist/index.html not found; run pnpm build first');
}
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });
fs.mkdirSync(releaseDir, { recursive: true });

fs.cpSync(dist, stage, { recursive: true });
for (const file of ['api.php', 'index.php', 'config.example.php', 'nginx-fallback.conf', 'README-BAOTA.md']) {
  fs.copyFileSync(path.join(root, 'deploy', 'baota', file), path.join(stage, file));
}
fs.copyFileSync(
  path.join(root, 'src', 'data', 'catalog.json'),
  path.join(stage, 'catalog.json'),
);

const token = fs.existsSync(tokenPath)
  ? fs.readFileSync(tokenPath, 'utf8').trim()
  : crypto.randomBytes(24).toString('hex');
fs.writeFileSync(tokenPath, token + '\n');
const config = `<?php
declare(strict_types=1);

if (!defined('AU9922_APP')) {
    http_response_code(403);
    exit;
}

return [
    'admin_token' => '${token}',
    'usdt_address' => 'TVfJbW6i4ERnTbexfJZgRu3ect91ZyDBVX',
    'telegram_bot_token' => '',
    'telegram_chat_id' => '',
];
`;
fs.writeFileSync(path.join(stage, 'config.php'), config);

const textExtensions = new Set(['.html', '.js', '.css', '.json', '.xml', '.txt', '.php', '.md']);
function replaceDomain(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      replaceDomain(full);
      continue;
    }
    if (!textExtensions.has(path.extname(entry.name))) continue;
    const before = fs.readFileSync(full, 'utf8');
    const after = before.replaceAll('https://tidesmm.kalichen80.workers.dev', siteUrl);
    if (after !== before) fs.writeFileSync(full, after);
  }
}
replaceDomain(stage);

// Build id covers every file except index.html, including PHP/config changes.
const files = [];
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (path.relative(stage, full) !== 'index.html') files.push(full);
  }
}
collect(stage);
files.sort();
const hash = crypto.createHash('sha256');
for (const file of files) {
  hash.update(path.relative(stage, file).replaceAll('\\', '/'));
  hash.update('\0');
  hash.update(fs.readFileSync(file));
}
const buildId = hash.digest('hex').slice(0, 16);
const indexPath = path.join(stage, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
indexHtml = indexHtml.replace(
  '</head>',
  `  <meta name="build-id" content="${buildId}" />\n  </head>`,
);
fs.writeFileSync(indexPath, indexHtml);

fs.rmSync(zipPath, { force: true });
execFileSync(
  'pwsh',
  [
    '-NoProfile',
    '-Command',
    `Compress-Archive -Path '${stage.replaceAll("'", "''")}\\*' -DestinationPath '${zipPath.replaceAll("'", "''")}' -Force`,
  ],
  { stdio: 'inherit' },
);

console.log('baota package:', zipPath);
console.log('site url:', siteUrl);
console.log('build id:', buildId);
console.log('admin token:', tokenPath);
console.log('zip size:', (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2), 'MB');
