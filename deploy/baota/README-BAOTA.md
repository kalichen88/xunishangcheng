# AU9922 宝塔部署包

这个包是给 **宝塔 / Nginx + PHP 8.2** 使用的静态 SPA + PHP 订单后端版本。
不依赖 Node.js、MySQL 或 Cloudflare，订单写入站点根目录下的 `data/orders.php`。

## 包内文件

```text
index.html                React SPA 入口
assets/                   构建后的 JS/CSS
api.php                   /api/health、/api/orders、/api/admin/orders
index.php                 /api/* 交给 api.php；其他路径返回 index.html
config.php                后台令牌、USDT 地址、Telegram 配置
config.example.php        配置样例
catalog.json              3,943 项目录（PHP 校验价格用）
nginx-fallback.conf       宝塔 Nginx 需要改的一行
data/                     首次请求时自动创建（不在 zip 内，不会被覆盖）
```

## 1. 上传

把 zip 上传到宝塔，解压到站点根目录（例如 `/www/wwwroot/mizarapy.com`）。
**不要**解压成 `/www/wwwroot/mizarapy.com/au9922-baota/` 这种嵌套目录。
如果站点已有 `data/`，不要删除；zip 里没有 data，不会覆盖订单。

## 2. Nginx

宝塔默认 PHP 项目的 `location /` 通常已经是：

```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
```

如果不是，按 [nginx-fallback.conf](nginx-fallback.conf) 修改并重载 Nginx。
这是为了让 `/api/health`、`/order/AU-...` 这类没有实体文件的路径进入 `index.php`。

不需要单独配置 `/api/` rewrite，也不需要配置数据库。

## 3. PHP 权限

`data/` 由 PHP 首次请求自动创建。确保 PHP-FPM 用户（通常是 `www`）对站点根目录有写权限：

```bash
chown -R www:www /www/wwwroot/mizarapy.com
chmod -R 775 /www/wwwroot/mizarapy.com/data 2>/dev/null || true
```

如果没有写权限，`/api/orders` 会返回 `server_error`。

## 4. 配置

`config.php` 已生成，包含：

- `admin_token`：后台 `/admin` 登录令牌（也保存在发布目录的 `baota-admin-token.txt`）
- `usdt_address`：`TVfJbW6i4ERnTbexfJZgRu3ect91ZyDBVX`
- `telegram_bot_token` / `telegram_chat_id`：留空则只在站内保存订单

修改配置后无需重启 PHP。

## 5. 验收

```bash
curl -4 -sS https://你的域名/api/health
# {"ok":true,"orderChannel":"database","version":"2.0.0",...}

curl -4 -sS -o /dev/null -w '%{http_code}\n' https://你的域名/data/store.php
# 403

curl -4 -sS -o /dev/null -w '%{http_code}\n' https://你的域名/config.php
# 403
```

后台：`https://你的域名/admin`
输入 `config.php` 中的 `admin_token`。

## 6. 更新

再次发版时只替换静态文件和 PHP 文件，**保留线上 `data/` 与 `config.php`**：

```bash
# 备份
cp -a data /www/backup/au9922-data-$(date +%F)
```

`build-id` 已写入 `index.html`，宝塔自动发版脚本可据此判断线上是否已经是本版本。

## 7. 安全建议

- 在宝塔给站点开启 SSL，并强制 HTTPS。
- 不要把 `data/`、`config.php` 暴露为静态下载；本包的 PHP guard 已对两者直接访问返回 403。
- 定期备份 `data/orders.php`。
- `admin_token` 泄露后，修改 `config.php` 并重新登录后台。
