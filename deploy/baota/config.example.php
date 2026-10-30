<?php
declare(strict_types=1);

if (!defined('AU9922_APP')) {
    http_response_code(403);
    exit;
}

return [
    // Generate a long random string, for example: php -r "echo bin2hex(random_bytes(24));"
    'admin_token' => 'replace-with-a-long-random-token',
    'usdt_address' => 'TVfJbW6i4ERnTbexfJZgRu3ect91ZyDBVX',
    'telegram_bot_token' => '',
    'telegram_chat_id' => '',
];
