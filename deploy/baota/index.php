<?php
declare(strict_types=1);

/**
 * Baota front controller.
 *
 * - /api/*  -> api.php (JSON)
 * - everything else -> index.html (React SPA)
 *
 * Nginx needs to route missing paths to /index.php, which is the default
 * "PHP project" try_files rule in Baota. See README-BAOTA.md.
 */

define('AU9922_APP', true);

$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?: '/';

if (str_starts_with($path, '/data/') || $path === '/config.php') {
    http_response_code(403);
    exit;
}

if (str_starts_with($path, '/api/')) {
    require __DIR__ . '/api.php';
    exit;
}

$index = __DIR__ . '/index.html';
if (!is_file($index)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'index.html is missing';
    exit;
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
readfile($index);
