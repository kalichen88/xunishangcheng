# AGENTS.md — 虚拟商城（AU9922 / tidesmm）

> 详细背景见 `README.md`；本文件只写"照抄即用"的命令和边界。
> 包管理固定 **pnpm**，不要用 npm/yarn（仓库有 `pnpm-lock.yaml`）。

## 1. 技术栈

- React 19 + TypeScript + Vite 8 + Tailwind 4 + React Router 7
- Cloudflare Workers（静态资源 + `/api/*`）+ D1（库名 `tidesmm-orders`）+ Wrangler 4
- 验收脚本：Playwright Core，使用系统 Chrome

## 2. 常用命令

| 目的 | 命令 |
|---|---|
| 安装依赖 | `pnpm install` |
| 本地开发 | `pnpm dev` → http://127.0.0.1:5173 |
| 类型检查（应用 + Worker） | `pnpm check` |
| 生产构建 | `pnpm build`（含 SEO 预生成） |
| Worker 本地联调 | `pnpm build; pnpm exec wrangler dev` → http://127.0.0.1:8787 |
| 全流程验收（浏览器） | `node scripts/qa.mjs`（需先 `pnpm build`） |
| 重新生成商品目录 | `pnpm catalog` |
| 部署 | `pnpm deploy`（= build + wrangler deploy，需 `pnpm exec wrangler login`） |
| 部署预检（不发布） | `pnpm deploy:dry` |

**最低验证线**：`pnpm check`。改了页面/购物车/结算流程再加 `pnpm build` + `node scripts/qa.mjs`。
三条没绿不要说"完成"。

## 3. 目录地图

```
src/pages/       页面（Home/Services/ServiceDetail/Cart/Checkout/Orders/OrderDetail/Admin/Faq/Legal）
src/components/  布局、商品卡、购物车抽屉、搜索、Toast
src/lib/         api.ts（Worker 客户端）、catalog.ts（索引）、pricing.ts（计价）、orders.ts、storage.ts、types.ts
src/config.ts    品牌、客服 Telegram、USDT 收款地址、汇率开关
src/data/catalog.json   构建产物（由 pnpm catalog 生成，勿手改）
data/catalog.source.json 公开价格表原始快照（3,959 条）
worker/index.ts  Worker：静态资源、/api/health、/api/orders、/api/admin/orders、Telegram 通知
worker/schema.sql D1 建表语句
scripts/         build-catalog / build-seo / build-og / qa / live-check
```

## 4. 硬性约定

- 价格：源数据是人民币快照，构建时按 **1 USD = 7 CNY** 换算，全站以 USD 展示；`1 USD = 1 USDT`。
- 支付：仅 USDT-TRC20，**人工核对到账**，页面不扣款、不收集银行卡；不要写成"自动到账"。
- 目录数据只改 `data/catalog.source.json`，然后跑 `pnpm catalog`；不要直接改 `src/data/catalog.json`。
- `wrangler.jsonc` 的 `d1_databases[0].database_id` 与 `ADMIN_TOKEN`/`TELEGRAM_*` Secrets 属于线上配置，改动前先说明影响。
- 不在代码、日志、提交里出现 `ADMIN_TOKEN`、Bot Token、`.dev.vars` 内容。

## 5. 禁区

- `dist/`、`src/data/catalog.json`、`public/sitemap.xml` 等生成物：改源重新生成，不要手改。
- `node_modules/`、`.wrangler/`：不要读、不要提交。
- 不要为了让类型检查通过而放宽 `tsconfig*.json` 或加 `any`；先看真实类型来源。

## 6. 完成标准

1. `pnpm check` 通过；涉及界面/流程时 `pnpm build` + `node scripts/qa.mjs` 通过并给出截图路径；
2. 说明访问的 URL / 点击的按钮 / 期望结果与实际结果；
3. 列出改动文件、风险点、回滚方式（`git restore <file>`）。
