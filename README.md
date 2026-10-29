# TideSMM 潮汐增长

一个面向中文用户的社交媒体增长服务商城。以 [smm-x.com](https://smm-x.com/) 的公开服务目录为对标基准，重新设计了品牌、界面、文案与代码；当前上架 **3,959 项服务、10 个平台、8 类服务场景**，价格、起订量和参考时效均来自对标站点的公开价格表快照（2026-10-29）。

站点同时提供中文商城体验与 Cloudflare Workers 部署配置。前端是 React SPA，Worker 负责静态资源、API 健康检查与订单通知。

![TideSMM OG](public/og.png)

## 功能

- **完整服务目录**：3,959 项服务，可按平台、服务类型、关键词筛选与排序。
- **商品详情与价格计算**：按千次 / 整包两种计价方式，自动校验起订量与上限。
- **购物车**：本地持久化、数量调整、目标链接填写、金额实时计算。
- **结算流程**：联系方式、支付方式、备注、服务条款确认；订单编号与进度页。
- **订单记录**：浏览器本地保存，支持重新复制订单信息、邮件发送、联系客服。
- **搜索**：全站快捷搜索（`Ctrl/⌘ + K` 或 `/`），键盘上下选择。
- **响应式设计**：桌面、平板、手机；支持减少动态效果的系统偏好。
- **Cloudflare Worker**：静态资源 + `/api/health` + `/api/orders`。
- **Telegram 订单通知**（可选）：配置 Bot 后，新订单会实时发送给客服。
- **SEO**：标题、描述、Open Graph、JSON-LD、自动生成 sitemap（3,964 个 URL）。
- **安全**：不收集账号密码或验证码；Worker 为所有响应添加安全头。

## 技术栈

- React 19 + TypeScript + Vite 8
- Tailwind CSS 4
- React Router 7
- Cloudflare Workers（静态资源 + API）
- Wrangler 4
- Playwright Core（本地视觉/流程验收脚本）

## 快速开始

要求 Node.js 22+、pnpm 11+。

```bash
pnpm install
pnpm dev
```

打开 <http://127.0.0.1:5173>。

生产构建与 Worker 本地联调：

```bash
pnpm build
pnpm exec wrangler dev
```

打开 <http://127.0.0.1:8787>。此时 `/api/orders` 会返回 503，前端自动回退到「本机订单模式」。

## 部署到 Cloudflare

### 1. 登录

```bash
pnpm exec wrangler login
```

如果环境没有浏览器，也可以使用 API Token：

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
```

### 2. 部署

```bash
pnpm deploy
```

这会执行 `pnpm build`（含 SEO 生成），然后运行 `wrangler deploy`。部署成功后 Wrangler 会输出类似：

```text
https://tidesmm.<your-subdomain>.workers.dev
```

项目名在 [wrangler.jsonc](wrangler.jsonc) 的 `name` 字段。若名称被占用，改成自己的项目名即可；自定义域名可在 Cloudflare Dashboard → Workers → 对应 Worker → Settings → Domains & Routes 绑定。

### 3. 可选：开启 Telegram 订单通知

未配置时，订单保存在客户浏览器，结算页会明确提示「本机订单模式」。配置后，订单会实时发送到你的 Telegram：

1. 在 Telegram 找 `@BotFather` 创建机器人，拿到 Bot Token。
2. 给机器人发送一条消息，然后访问 `https://api.telegram.org/bot<token>/getUpdates` 找到 `chat.id`（也可以把机器人拉进群，使用群 ID）。
3. 写入 Worker Secrets：

```bash
pnpm exec wrangler secret put TELEGRAM_BOT_TOKEN
pnpm exec wrangler secret put TELEGRAM_CHAT_ID
```

4. 刷新站点。`/api/health` 会返回 `{"orderChannel":"telegram"}`，结算页显示「订单会实时发送给客服」。

本地联调可以用 `.dev.vars`（参考 [.dev.vars.example](.dev.vars.example)）或：

```bash
pnpm exec wrangler dev \
  --var TELEGRAM_BOT_TOKEN:test \
  --var TELEGRAM_CHAT_ID:123456
```

`TELEGRAM_API_BASE` 仅用于测试，可指向本地 mock 服务；生产环境不要设置。

## 自动部署（GitHub Actions）

工作流位于 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)。推送到 `main` 后自动构建并部署。

在 GitHub 仓库 Secrets 中配置：

- `CLOUDFLARE_API_TOKEN`：在 Cloudflare Dashboard → My Profile → API Tokens 创建，权限至少包含 `Workers Scripts:Edit`、`Workers Routes:Edit`、`Account Settings:Read`。
- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare Dashboard 右侧的 Account ID。

Telegram 的两个 Secret 不需要放进 GitHub：它们是 Worker 的运行期 Secret，配置一次后持续生效。

## 目录结构

```text
.
├─ src/
│  ├─ pages/            # 首页、目录、详情、购物车、结算、订单、FAQ、法律页
│  ├─ components/       # 布局、导航、商品卡、购物车抽屉、搜索、Toast
│  ├─ lib/              # 目录索引、价格计算、本地订单、API 客户端
│  ├─ content/          # FAQ 文案
│  ├─ config.ts         # 品牌、联系方式、支付方式
│  └─ data/catalog.json # 构建后的商品目录
├─ data/
│  └─ catalog.source.json # 公开价格表快照（3,959 项，已剔除补差价条目）
├─ worker/
│  └─ index.ts          # Worker：静态资源、健康检查、订单通知
├─ scripts/
│  ├─ build-catalog.mjs # 快照 → 商城目录
│  ├─ build-seo.mjs     # sitemap.xml + robots.txt
│  ├─ build-og.mjs      # Open Graph 图片
│  └─ qa.mjs            # Playwright 全流程验收
├─ wrangler.jsonc
└─ .github/workflows/deploy.yml
```

## 商品目录

商品来源是对标站点的公开「服务价格」表。快照保存在 `data/catalog.source.json`，构建脚本会：

- 统一平台名称（Telegram、Instagram、TikTok、YouTube、X / Twitter、Facebook、WhatsApp、Discord、LinkedIn、Threads）；
- 推导服务场景（成员/关注、浏览/播放、点赞/表情、评论、分享/转发、直播/空间、助力/加速、其他）；
- 根据起订与上限判断「每千次」或「整包」计价；
- 生成搜索索引、精选服务与平台统计。

重新生成：

```bash
pnpm catalog
```

商品名称、价格、参考时效来自对标站点公开页面，仅作为目录数据使用；本项目的品牌、视觉、文案和代码为独立实现，未复制对方页面素材或营销文案。上架前请自行核对供应能力、价格与合规性。

## 上线前检查清单

- [ ] 替换 `src/config.ts` 中的品牌名、邮箱与 Telegram 客服地址。
- [ ] 修改 `wrangler.jsonc` 的 `name`，并更新 `index.html`、`scripts/build-seo.mjs` 中的站点 URL（或构建时设置 `SITE_URL`）。
- [ ] 配置 Telegram Bot，或明确保留「本机订单模式」。
- [ ] 确认支付方式与收款账户；当前版本不直接处理在线支付。
- [ ] 让专业人士审核 `服务条款`、`隐私政策`，补充经营主体信息。
- [ ] 确认商品目录、价格与目标平台规则的合规性。
- [ ] 为 `/api/orders` 配置 Cloudflare Rate Limiting 或 WAF 规则（公开接口，当前没有验证码）。
- [ ] 在 Worker 中设置自定义域名并检查 HTTPS。

## 当前边界

首版聚焦「目录 + 购物车 + 订单请求」：

- 未接入在线支付、会员登录、余额系统与自助 API；
- 未配置 Telegram 时，订单只保存在客户浏览器，需要客户复制订单信息发送给客服；
- 订单通知通道成功时，订单会发送到 Telegram，但不会写入数据库；请自行做好客服侧归档；
- 商品价格来自快照，实际结算前由客服确认。

这些边界都已在页面文案中明确说明，避免让客户误以为订单已经自动支付或自动进入交付。

## 验收

```bash
pnpm check      # 应用与 Worker 类型检查
pnpm build      # 生产构建
node scripts/qa.mjs
```

`qa.mjs` 使用系统 Chrome（`C:\Program Files\Google\Chrome\Application\chrome.exe`）跑通首页 → 目录筛选 → 搜索 → 详情 → 加购 → 结算 → 订单页，并输出桌面/移动端截图。其他平台请修改脚本中的 Chrome 路径。

## 说明

本项目与 Telegram、Meta、TikTok、YouTube、X 等平台没有隶属关系。所有平台名称与商标归其各自所有者。社交媒体增长服务可能受到目标平台服务条款或当地法律限制，运营方应自行评估并承担合规责任。
