<?php
declare(strict_types=1);

/**
 * AU9922 PHP backend for Baota / Nginx + PHP-FPM.
 *
 * Routes:
 *   GET  /api/health
 *   POST /api/orders
 *   GET  /api/admin/orders?limit=100
 *
 * Orders are stored in data/orders.php. The file starts with a PHP guard so
 * direct requests return 403 and never expose the JSON payload.
 */

if (!defined('AU9922_APP')) {
    define('AU9922_APP', true);
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $error, int $status = 400): never
{
    respond(['ok' => false, 'error' => $error], $status);
}

function cleanText(mixed $value, int $max): string
{
    $text = trim((string) $value);
    if (function_exists('mb_substr')) {
        return mb_substr($text, 0, $max, 'UTF-8');
    }
    return substr($text, 0, $max);
}

function dataDir(): string
{
    return __DIR__ . '/data';
}

function ensureDataDir(): void
{
    $dir = dataDir();
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    $guard = "<?php http_response_code(403); exit; ?>\n";
    foreach (['store.php', 'index.php'] as $name) {
        $path = $dir . '/' . $name;
        if (!is_file($path)) {
            @file_put_contents($path, $guard, LOCK_EX);
        }
    }
    if (!is_file($dir . '/.lock')) {
        @file_put_contents($dir . '/.lock', '', LOCK_EX);
    }
}

function ordersPath(): string
{
    return dataDir() . '/orders.php';
}

function readOrders(): array
{
    ensureDataDir();
    $file = ordersPath();
    if (!is_file($file)) {
        return [];
    }
    $raw = file_get_contents($file);
    if ($raw === false) {
        return [];
    }
    $offset = strpos($raw, '?>');
    if ($offset === false) {
        return [];
    }
    $decoded = json_decode(substr($raw, $offset + 2), true);
    return is_array($decoded) && is_array($decoded['orders'] ?? null) ? $decoded['orders'] : [];
}

function writeOrders(array $orders): void
{
    ensureDataDir();
    $payload = json_encode(
        ['orders' => $orders],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT,
    );
    if ($payload === false) {
        throw new RuntimeException('order encoding failed');
    }
    $content = "<?php http_response_code(403); exit; ?>\n" . $payload;
    $file = ordersPath();
    $tmp = $file . '.tmp';
    file_put_contents($tmp, $content, LOCK_EX);
    rename($tmp, $file);
}

function withStoreLock(callable $callback, int $lockType = LOCK_EX): mixed
{
    ensureDataDir();
    $handle = fopen(dataDir() . '/.lock', 'c');
    if ($handle === false) {
        throw new RuntimeException('cannot open order lock');
    }
    try {
        flock($handle, $lockType);
        return $callback();
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function newOrderId(): string
{
    return 'AU-' . gmdate('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
}

function money(int $cents): string
{
    return '$' . number_format($cents / 100, 2, '.', ',');
}

function escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function sendTelegram(array $config, array $order, int $totalCents): bool
{
    $token = trim((string) ($config['telegram_bot_token'] ?? ''));
    $chatId = trim((string) ($config['telegram_chat_id'] ?? ''));
    if ($token === '' || $chatId === '' || !function_exists('curl_init')) {
        return false;
    }

    $lines = [
        '<b>🛒 AU9922 新订单</b>',
        '<b>' . escape((string) $order['id']) . '</b>',
        '客户：' . escape((string) $order['customer']['name']),
        '联系：' . escape((string) $order['customer']['contact']),
        '支付：USDT-TRC20',
        '',
        '<b>服务明细</b>',
    ];
    foreach ($order['items'] as $index => $item) {
        $unit = $item['pricing'] === 'fixed' ? '件' : '1k';
        $lines[] = ($index + 1) . '. ' . escape((string) $item['name']);
        $lines[] = '   ' . (int) $item['quantity'] . ' × $' . $item['rate'] . ' / ' . $unit
            . ' = ' . money((int) $item['subtotalCents']);
        if (!empty($item['target'])) {
            $lines[] = '   目标：' . escape((string) $item['target']);
        }
    }
    $lines[] = '';
    $lines[] = '<b>应付：' . money($totalCents) . '（' . number_format($totalCents / 100, 2, '.', '') . ' USDT）</b>';
    $lines[] = '收款地址（TRC20）：<code>' . escape((string) ($config['usdt_address'] ?? '')) . '</code>';
    $lines[] = '转账后请客户把 TxID 发给客服核对。';

    $ch = curl_init('https://api.telegram.org/bot' . $token . '/sendMessage');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 6,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_POSTFIELDS => http_build_query([
            'chat_id' => $chatId,
            'text' => implode("\n", $lines),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => 'true',
        ]),
    ]);
    $ok = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return $ok !== false && $status >= 200 && $status < 300;
}

try {
    $config = require __DIR__ . '/config.php';
    if (!is_array($config)) {
        fail('config_invalid', 503);
    }

    $catalogRaw = file_get_contents(__DIR__ . '/catalog.json');
    $catalog = $catalogRaw === false ? null : json_decode($catalogRaw, true);
    if (!is_array($catalog) || !is_array($catalog['services'] ?? null)) {
        fail('catalog_unavailable', 503);
    }
    $services = [];
    foreach ($catalog['services'] as $service) {
        $services[(int) $service['id']] = $service;
    }

    $path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?: '';
    $route = (string) ($_GET['route'] ?? '');
    if ($route === '' && str_starts_with($path, '/api/')) {
        $route = substr($path, 5);
    }
    $route = trim($route, '/');
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

    if ($route === 'health') {
        if ($method !== 'GET') {
            fail('method_not_allowed', 405);
        }
        respond([
            'ok' => true,
            'orderChannel' => 'database',
            'version' => '2.0.0',
            'telegram' => trim((string) ($config['telegram_bot_token'] ?? '')) !== ''
                && trim((string) ($config['telegram_chat_id'] ?? '')) !== '',
        ]);
    }

    if ($route === 'orders') {
        if ($method !== 'POST') {
            fail('method_not_allowed', 405);
        }
        $raw = file_get_contents('php://input');
        if ($raw === false || strlen($raw) > 1_000_000) {
            fail('payload_too_large', 413);
        }
        $input = json_decode($raw, true);
        if (!is_array($input)) {
            fail('invalid_json');
        }

        $customerRaw = $input['customer'] ?? null;
        if (!is_array($customerRaw)) {
            fail('invalid_customer');
        }
        $name = cleanText($customerRaw['name'] ?? '', 80);
        $contact = cleanText($customerRaw['contact'] ?? '', 160);
        $email = cleanText($customerRaw['email'] ?? '', 160);
        $payment = cleanText($customerRaw['payment'] ?? '', 20);
        $note = cleanText($customerRaw['note'] ?? '', 500);
        if ($name === '') {
            fail('name_required');
        }
        if (strlen($contact) < 3) {
            fail('contact_required');
        }
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            fail('email_invalid');
        }
        if ($payment !== 'usdt') {
            fail('payment_invalid');
        }

        $rawItems = $input['items'] ?? null;
        if (!is_array($rawItems) || count($rawItems) < 1 || count($rawItems) > 50) {
            fail('items_invalid');
        }
        $items = [];
        $totalCents = 0;
        foreach ($rawItems as $rawItem) {
            if (!is_array($rawItem)) {
                fail('item_invalid');
            }
            $id = (int) ($rawItem['id'] ?? 0);
            $service = $services[$id] ?? null;
            if (!is_array($service)) {
                fail('service_not_found');
            }
            $quantity = (int) ($rawItem['quantity'] ?? 0);
            $min = (int) $service['min'];
            $max = (int) $service['max'];
            if ($quantity < $min || $quantity > $max) {
                fail('quantity_invalid');
            }
            $rate = (float) $service['rate'];
            $pricing = (string) $service['pricing'];
            $subtotal = max(
                1,
                (int) round(($pricing === 'fixed' ? $rate * $quantity : $rate * $quantity / 1000) * 100),
            );
            $target = cleanText($rawItem['target'] ?? '', 500);
            $items[] = [
                'serviceId' => $id,
                'name' => (string) $service['name'],
                'platform' => (string) $service['platformName'],
                'quantity' => $quantity,
                'target' => $target,
                'rate' => $rate,
                'rateCny' => (float) ($service['rateCny'] ?? 0),
                'pricing' => $pricing,
                'subtotalCents' => $subtotal,
            ];
            $totalCents += $subtotal;
        }

        $customer = [
            'name' => $name,
            'contact' => $contact,
            'email' => $email,
            'payment' => 'usdt',
            'note' => $note,
        ];
        $order = [
            'id' => newOrderId(),
            'createdAt' => gmdate('c'),
            'customer' => $customer,
            'items' => $items,
            'totalCents' => $totalCents,
            'telegramSent' => false,
            'channel' => 'database',
        ];
        $notified = sendTelegram($config, $order, $totalCents);
        $order['telegramSent'] = $notified;

        withStoreLock(static function () use ($order): void {
            $orders = readOrders();
            array_unshift($orders, $order);
            writeOrders(array_slice($orders, 0, 5000));
        });

        respond([
            'ok' => true,
            'orderId' => $order['id'],
            'totalCents' => $totalCents,
            'stored' => true,
            'notified' => $notified,
        ]);
    }

    if ($route === 'admin/orders') {
        if ($method !== 'GET') {
            fail('method_not_allowed', 405);
        }
        $auth = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
        $expected = (string) ($config['admin_token'] ?? '');
        if (
            $expected === ''
            || !preg_match('/^Bearer\s+(.+)$/i', $auth, $matches)
            || !hash_equals($expected, trim($matches[1]))
        ) {
            fail('unauthorized', 401);
        }
        $limit = (int) ($_GET['limit'] ?? 100);
        $limit = max(1, min(200, $limit));
        $orders = withStoreLock(static fn (): array => readOrders(), LOCK_SH);
        usort(
            $orders,
            static fn (array $a, array $b): int => strcmp((string) $b['createdAt'], (string) $a['createdAt']),
        );
        $orders = array_slice($orders, 0, $limit);
        respond(['ok' => true, 'count' => count($orders), 'orders' => $orders]);
    }

    fail('not_found', 404);
} catch (Throwable $error) {
    error_log('[au9922] ' . $error->getMessage());
    fail('server_error', 500);
}
