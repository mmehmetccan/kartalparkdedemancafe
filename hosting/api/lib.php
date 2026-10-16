<?php

function kpd_config()
{
    static $config;
    if ($config === null) {
        $path = __DIR__ . '/config.php';
        if (!is_file($path)) {
            kpd_fail(500, 'Sunucu yapılandırması eksik.');
        }
        $config = require $path;
    }
    return $config;
}

function kpd_pdo()
{
    static $pdo;
    if ($pdo === null) {
        $config = kpd_config();
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $config['db_host'],
            $config['db_port'],
            $config['db_name']
        );
        $pdo = new PDO($dsn, $config['db_user'], $config['db_password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec("SET time_zone = '+00:00'");
    }
    return $pdo;
}

function kpd_uuid()
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return sprintf(
        '%s-%s-%s-%s-%s',
        substr($hex, 0, 8),
        substr($hex, 8, 4),
        substr($hex, 12, 4),
        substr($hex, 16, 4),
        substr($hex, 20, 12)
    );
}

function kpd_json_input()
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function kpd_locale()
{
    $explicit = kpd_normalize_locale($_SERVER['HTTP_X_LOCALE'] ?? $_GET['lang'] ?? '');
    if ($explicit) {
        return $explicit;
    }
    $header = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '';
    foreach (explode(',', $header) as $part) {
        $tag = trim(explode(';', $part)[0]);
        $locale = kpd_normalize_locale($tag);
        if ($locale) {
            return $locale;
        }
    }
    return 'tr';
}

function kpd_normalize_locale($value)
{
    $normalized = strtolower(str_replace('_', '-', trim((string) $value)));
    if ($normalized === '') {
        return null;
    }
    $language = explode('-', $normalized)[0];
    return in_array($language, ['tr', 'en', 'de', 'ar', 'ru'], true) ? $language : null;
}

function kpd_translate($key, $params = [])
{
    static $messages;
    if ($messages === null) {
        $path = __DIR__ . '/messages.json';
        $messages = is_file($path) ? json_decode(file_get_contents($path), true) : [];
    }
    $locale = kpd_locale();
    $template = $messages[$locale][$key] ?? $messages['tr'][$key] ?? $key;
    return preg_replace_callback('/\{(\w+)\}/', function ($match) use ($params) {
        return isset($params[$match[1]]) ? (string) $params[$match[1]] : '';
    }, $template);
}

function kpd_send($status, $payload)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function kpd_fail($status, $key, $params = [], $extra = [])
{
    kpd_send($status, array_merge($extra, [
        'message' => kpd_translate($key, $params),
        'messageKey' => $key,
        'messageParams' => (object) $params,
    ]));
}

function kpd_ok_message($status, $key, $params = [], $extra = [])
{
    kpd_send($status, array_merge($extra, [
        'message' => kpd_translate($key, $params),
        'messageKey' => $key,
        'messageParams' => (object) $params,
    ]));
}

function kpd_iso($value)
{
    if ($value === null || $value === '') {
        return null;
    }
    $text = str_replace(' ', 'T', (string) $value);
    if (!str_contains($text, 'T')) {
        return $text;
    }
    if (!str_ends_with($text, 'Z') && !preg_match('/[+-]\d{2}:\d{2}$/', $text)) {
        $text .= 'Z';
    }
    return $text;
}

function kpd_b64url($data)
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function kpd_b64url_decode($data)
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

function kpd_jwt_sign($payload, $expiresInSeconds)
{
    $secret = kpd_config()['jwt_secret'];
    $now = time();
    $body = array_merge($payload, [
        'iat' => $now,
        'exp' => $now + $expiresInSeconds,
    ]);
    $header = kpd_b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $encoded = kpd_b64url(json_encode($body));
    $signature = kpd_b64url(hash_hmac('sha256', $header . '.' . $encoded, $secret, true));
    return $header . '.' . $encoded . '.' . $signature;
}

function kpd_jwt_verify($token)
{
    $parts = explode('.', (string) $token);
    if (count($parts) !== 3) {
        return null;
    }
    [$header, $encoded, $signature] = $parts;
    $expected = kpd_b64url(hash_hmac('sha256', $header . '.' . $encoded, kpd_config()['jwt_secret'], true));
    if (!hash_equals($expected, $signature)) {
        return null;
    }
    $payload = json_decode(kpd_b64url_decode($encoded), true);
    if (!is_array($payload) || ($payload['exp'] ?? 0) < time()) {
        return null;
    }
    return $payload;
}

function kpd_bearer()
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($header === '' && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $match)) {
        return null;
    }
    return trim($match[1]);
}

function kpd_hash_password($password)
{
    return password_hash($password, PASSWORD_DEFAULT);
}

function kpd_is_node_scrypt($stored)
{
    return is_string($stored) && str_contains($stored, ':') && !str_starts_with($stored, '$');
}

function kpd_verify_password($password, $stored, $username = '')
{
    if (!is_string($stored) || $stored === '') {
        return false;
    }
    if (str_starts_with($stored, '$')) {
        return password_verify($password, $stored);
    }
    if (kpd_is_node_scrypt($stored)) {
        $bootstrap = (string) (kpd_config()['admin_bootstrap_password'] ?? '');
        return $bootstrap !== '' && hash_equals($bootstrap, $password);
    }
    return false;
}

function kpd_maybe_upgrade_password($userId, $password, $stored)
{
    if (!kpd_is_node_scrypt($stored)) {
        return;
    }
    $stmt = kpd_pdo()->prepare('UPDATE users SET password = ? WHERE id = ?');
    $stmt->execute([kpd_hash_password($password), $userId]);
}

function kpd_guest()
{
    $token = kpd_bearer();
    if (!$token) {
        kpd_fail(401, 'auth.guest_session_missing');
    }
    $decoded = kpd_jwt_verify($token);
    if (!$decoded || empty($decoded['roomNumber']) || !empty($decoded['role'])) {
        kpd_fail(401, 'auth.guest_session_invalid');
    }
    $roomNumber = strtolower((string) $decoded['roomNumber']);
    if ($roomNumber !== 'own' && !preg_match('/^[1-6]0(?:0[1-9]|1[0-2])$/', $roomNumber)) {
        kpd_fail(401, 'auth.guest_room_invalid');
    }
    return $roomNumber;
}

function kpd_staff($roles = ['admin', 'reception', 'chef'])
{
    $token = kpd_bearer();
    if (!$token) {
        kpd_fail(401, 'auth.admin_session_missing');
    }
    $decoded = kpd_jwt_verify($token);
    if (!$decoded || empty($decoded['id']) || !in_array($decoded['role'] ?? '', ['admin', 'reception', 'chef'], true)) {
        kpd_fail(403, 'auth.staff_session_required');
    }
    $stmt = kpd_pdo()->prepare('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$decoded['id']]);
    $user = $stmt->fetch();
    if (!$user) {
        kpd_fail(401, 'auth.staff_account_missing');
    }
    if (!in_array($user['role'], ['admin', 'reception', 'chef'], true)) {
        kpd_fail(403, 'auth.staff_access_missing');
    }
    if (!in_array($user['role'], $roles, true)) {
        kpd_fail(403, 'auth.insufficient_role');
    }
    return kpd_map_user($user);
}

function kpd_map_user($row, $includePassword = false)
{
    if (!$row) {
        return null;
    }
    $user = [
        '_id' => $row['id'],
        'id' => $row['id'],
        'username' => $row['username'],
        'role' => $row['role'],
        'createdAt' => kpd_iso($row['created_at'] ?? null),
        'updatedAt' => kpd_iso($row['updated_at'] ?? null),
    ];
    if ($includePassword) {
        $user['password'] = $row['password'];
    }
    return $user;
}

function kpd_map_product($row)
{
    if (!$row) {
        return null;
    }
    $translations = $row['translations'] ?? '{}';
    if (is_string($translations)) {
        $decoded = json_decode($translations, true);
        $translations = is_array($decoded) ? $decoded : [];
    }
    return [
        '_id' => $row['id'],
        'name' => $row['name'],
        'category' => $row['category'],
        'menuSection' => $row['menu_section'] ?: null,
        'menuSubsection' => $row['menu_subsection'] ?: null,
        'description' => $row['description'] ?: '',
        'intensity' => isset($row['intensity']) ? (int) $row['intensity'] : 3,
        'sellingPrice' => (float) $row['selling_price'],
        'costPrice' => (float) $row['cost_price'],
        'imageUrl' => kpd_normalize_product_image_path($row['image_url'] ?? ''),
        'translations' => $translations,
        'isAvailable' => array_key_exists('is_available', $row) ? (bool) $row['is_available'] : true,
        'createdAt' => kpd_iso($row['created_at'] ?? null),
        'updatedAt' => kpd_iso($row['updated_at'] ?? null),
    ];
}

function kpd_map_order($row)
{
    if (!$row) {
        return null;
    }
    $items = $row['items'] ?? [];
    if (is_string($items)) {
        $items = json_decode($items, true) ?: [];
    }
    $items = array_map(function ($item) {
        return [
            'product' => $item['product'] ?? null,
            'name' => $item['name'] ?? '',
            'quantity' => (int) ($item['quantity'] ?? 0),
            'unitPrice' => (float) ($item['unitPrice'] ?? 0),
            'costPrice' => (float) ($item['costPrice'] ?? 0),
        ];
    }, $items);
    return [
        '_id' => $row['id'],
        'roomNumber' => $row['room_number'],
        'isOwnOrder' => (bool) $row['is_own_order'],
        'items' => $items,
        'paymentMethod' => $row['payment_method'],
        'status' => $row['status'],
        'totalRevenue' => (float) $row['total_revenue'],
        'totalCost' => (float) $row['total_cost'],
        'totalProfit' => (float) $row['total_profit'],
        'deliveredAt' => kpd_iso($row['delivered_at'] ?? null),
        'cancelledAt' => kpd_iso($row['cancelled_at'] ?? null),
        'createdAt' => kpd_iso($row['created_at'] ?? null),
        'updatedAt' => kpd_iso($row['updated_at'] ?? null),
    ];
}

function kpd_map_breakfast($row)
{
    if (!$row) {
        return null;
    }
    return [
        '_id' => $row['id'],
        'roomNumber' => $row['room_number'],
        'note' => $row['note'] ?: '',
        'guestCount' => (int) $row['guest_count'],
        'requestedTime' => $row['requested_time'],
        'scheduledDate' => substr((string) $row['scheduled_date'], 0, 10),
        'planId' => $row['plan_id'] ?: null,
        'status' => $row['status'],
        'deliveredAt' => kpd_iso($row['delivered_at'] ?? null),
        'cancelledAt' => kpd_iso($row['cancelled_at'] ?? null),
        'cancellationReason' => $row['cancellation_reason'] ?: '',
        'createdAt' => kpd_iso($row['created_at'] ?? null),
        'updatedAt' => kpd_iso($row['updated_at'] ?? null),
    ];
}

function kpd_hotel_now()
{
    $tz = new DateTimeZone(kpd_config()['hotel_time_zone'] ?? 'Europe/Istanbul');
    $now = new DateTimeImmutable('now', $tz);
    return [
        'date' => $now->format('Y-m-d'),
        'hour' => (int) $now->format('G'),
    ];
}

function kpd_date_after($date, $days)
{
    return (new DateTimeImmutable($date . 'T00:00:00Z'))->modify(($days >= 0 ? '+' : '') . $days . ' days')->format('Y-m-d');
}

function kpd_menu_sections()
{
    static $sections;
    if ($sections === null) {
        $sections = json_decode(file_get_contents(__DIR__ . '/menu-sections.json'), true);
    }
    return $sections;
}

function kpd_section_children($sectionId)
{
    foreach (kpd_menu_sections() as $section) {
        if ($section['id'] === $sectionId) {
            return array_map(fn ($child) => $child['id'], $section['children'] ?? []);
        }
    }
    return [];
}

function kpd_section_by_id($sectionId)
{
    foreach (kpd_menu_sections() as $section) {
        if ($section['id'] === $sectionId) {
            return $section;
        }
    }
    return null;
}

function kpd_build_category_label($menuSection, $menuSubsection)
{
    $section = kpd_section_by_id($menuSection);
    if (!$section) {
        return '';
    }
    $childLabel = null;
    foreach ($section['children'] ?? [] as $child) {
        if ($child['id'] === $menuSubsection) {
            $childLabel = $child['label'];
            break;
        }
    }
    return $childLabel ? $section['label'] . ' · ' . $childLabel : $section['label'];
}

function kpd_infer_menu($category, $name)
{
    $source = mb_strtolower(trim($category . ' ' . $name), 'UTF-8');
    if (str_contains($source, 'omlet') || str_contains($source, 'omelet') || str_contains($source, 'yumurta') || str_contains($source, 'egg')) {
        return ['menuSection' => 'kahvaltilar', 'menuSubsection' => 'omletler'];
    }
    if (str_contains($source, 'sandvic') || str_contains($source, 'sandviç') || str_contains($source, 'sandwich')) {
        return ['menuSection' => 'kahvaltilar', 'menuSubsection' => 'sandvicler'];
    }
    if (str_contains($source, 'tost') || str_contains($source, 'toast')) {
        return ['menuSection' => 'kahvaltilar', 'menuSubsection' => 'tostlar'];
    }
    if (str_contains($source, 'kahvalti') || str_contains($source, 'kahvaltı') || str_contains($source, 'breakfast') || str_contains($source, 'serpme')) {
        return ['menuSection' => 'kahvaltilar', 'menuSubsection' => 'serpme-kahvalti'];
    }
    if (str_contains($source, 'ana yemek') || str_contains($source, 'anayemek') || str_contains($source, 'main course')) {
        return ['menuSection' => 'ana-yemekler', 'menuSubsection' => null];
    }
    if (str_contains($source, 'ara sicak') || str_contains($source, 'ara sıcak') || str_contains($source, 'appetizer') || str_contains($source, 'starter')) {
        return ['menuSection' => 'ara-sicaklar', 'menuSubsection' => null];
    }
    if (str_contains($source, 'meyve') || str_contains($source, 'fruit')) {
        return ['menuSection' => 'tatli-meyve', 'menuSubsection' => 'meyveler'];
    }
    if (str_contains($source, 'tatli') || str_contains($source, 'tatlı') || str_contains($source, 'dessert')) {
        return ['menuSection' => 'tatli-meyve', 'menuSubsection' => 'tatlilar'];
    }
    $coffee = ['espresso', 'americano', 'cappuccino', 'latte', 'mocha', 'kahve', 'coffee', 'macchiato', 'flat white'];
    foreach ($coffee as $keyword) {
        if (str_contains($source, $keyword)) {
            $cold = str_contains($source, 'iced') || str_contains($source, 'soguk') || str_contains($source, 'soğuk') || str_contains($source, 'cold') || str_contains($source, 'frappe');
            return ['menuSection' => 'kahveler', 'menuSubsection' => $cold ? 'soguk-kahveler' : 'sicak-kahveler'];
        }
    }
    return ['menuSection' => 'icecekler', 'menuSubsection' => null];
}

function kpd_normalize_product($payload)
{
    $sectionIds = array_map(fn ($section) => $section['id'], kpd_menu_sections());
    $menuSection = $payload['menuSection'] ?? null;
    $menuSubsection = $payload['menuSubsection'] ?? null;
    if (!in_array($menuSection, $sectionIds, true)) {
        $inferred = kpd_infer_menu($payload['category'] ?? '', $payload['name'] ?? '');
        $menuSection = $inferred['menuSection'];
        $menuSubsection = $inferred['menuSubsection'];
    }
    $children = kpd_section_children($menuSection);
    if ($menuSubsection && !in_array($menuSubsection, $children, true)) {
        $menuSubsection = null;
    }
    if ($children && !$menuSubsection) {
        $menuSubsection = $children[0];
    }
    if (!$children) {
        $menuSubsection = null;
    }
    $intensity = isset($payload['intensity']) ? (int) round((float) $payload['intensity']) : 3;
    $intensity = max(1, min(5, $intensity));
    $name = trim((string) ($payload['name'] ?? ''));
    if ($name === '') {
        throw new InvalidArgumentException('Ürün adı zorunludur.');
    }
    $sellingPrice = (float) ($payload['sellingPrice'] ?? 0);
    $costPrice = (float) ($payload['costPrice'] ?? 0);
    if ($sellingPrice < 0 || $costPrice < 0) {
        throw new InvalidArgumentException('Fiyatlar geçersiz.');
    }
    return [
        'name' => mb_substr($name, 0, 100),
        'category' => kpd_build_category_label($menuSection, $menuSubsection),
        'menuSection' => $menuSection,
        'menuSubsection' => $menuSubsection,
        'description' => mb_substr((string) ($payload['description'] ?? ''), 0, 700),
        'intensity' => $intensity,
        'sellingPrice' => $sellingPrice,
        'costPrice' => $costPrice,
        'imageUrl' => kpd_normalize_product_image_path($payload['imageUrl'] ?? ''),
        'translations' => is_array($payload['translations'] ?? null) ? $payload['translations'] : [],
        'isAvailable' => ($payload['isAvailable'] ?? true) !== false,
    ];
}

function kpd_localize_product($product)
{
    $locale = kpd_locale();
    if (in_array($locale, ['en', 'de', 'ar', 'ru'], true)) {
        $translation = $product['translations'][$locale] ?? null;
        $product['baseName'] = $product['name'];
        $product['baseDescription'] = $product['description'] ?? '';
        if (!empty($translation['name'])) {
            $product['name'] = $translation['name'];
        }
        if (!empty($translation['description'])) {
            $product['description'] = $translation['description'];
        }
    }
    return $product;
}

function kpd_order_range($query)
{
    $period = in_array($query['period'] ?? '', ['day', 'week', 'month', 'custom'], true) ? $query['period'] : 'month';
    $today = $query['date'] ?? gmdate('Y-m-d');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $today)) {
        $today = gmdate('Y-m-d');
    }
    $todayDate = new DateTimeImmutable($today . 'T00:00:00Z');
    if ($period === 'custom') {
        $start = $query['start'] ?? '';
        $end = $query['end'] ?? '';
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end) || $end < $start) {
            kpd_fail(400, 'orders.invalid_date_range');
        }
        return [
            'period' => $period,
            'start' => $start . ' 00:00:00',
            'end' => kpd_date_after($end, 1) . ' 00:00:00',
            'startDate' => $start,
            'endDate' => $end,
        ];
    }
    if ($period === 'day') {
        return [
            'period' => $period,
            'start' => $today . ' 00:00:00',
            'end' => kpd_date_after($today, 1) . ' 00:00:00',
            'startDate' => $today,
            'endDate' => $today,
        ];
    }
    if ($period === 'week') {
        $offset = ((int) $todayDate->format('N')) - 1;
        $startDate = $todayDate->modify('-' . $offset . ' days')->format('Y-m-d');
        return [
            'period' => $period,
            'start' => $startDate . ' 00:00:00',
            'end' => kpd_date_after($startDate, 7) . ' 00:00:00',
            'startDate' => $startDate,
            'endDate' => kpd_date_after($startDate, 6),
        ];
    }
    $month = preg_match('/^\d{4}-\d{2}$/', (string) ($query['month'] ?? '')) ? $query['month'] : substr($today, 0, 7);
    [$year, $monthNumber] = array_map('intval', explode('-', $month));
    $startDate = sprintf('%04d-%02d-01', $year, $monthNumber);
    $endExclusive = (new DateTimeImmutable($startDate . 'T00:00:00Z'))->modify('first day of next month')->format('Y-m-d');
    return [
        'period' => $period,
        'start' => $startDate . ' 00:00:00',
        'end' => $endExclusive . ' 00:00:00',
        'startDate' => $startDate,
        'endDate' => kpd_date_after($endExclusive, -1),
    ];
}

function kpd_split_sql($sql)
{
    $sql = preg_replace('/CREATE DATABASE.*?;/is', '', $sql);
    $sql = preg_replace('/USE\s+`?[\w]+`?\s*;/i', '', $sql);
    $statements = [];
    $buffer = '';
    foreach (explode("\n", $sql) as $line) {
        $trim = ltrim($line);
        if ($trim === '' || str_starts_with($trim, '--') || str_starts_with($trim, '/*')) {
            continue;
        }
        $buffer .= $line . "\n";
        if (str_ends_with(rtrim($line), ';')) {
            $statement = trim($buffer);
            if ($statement !== '' && $statement !== ';') {
                $statements[] = $statement;
            }
            $buffer = '';
        }
    }
    return $statements;
}

function kpd_table_exists($name)
{
    $stmt = kpd_pdo()->prepare(
        'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?'
    );
    $stmt->execute([$name]);
    return (int) $stmt->fetchColumn() > 0;
}

function kpd_normalize_product_image_path($value)
{
    $path = trim((string) $value);
    if ($path === '') {
        return '';
    }
    if (preg_match('#^https?://#i', $path)) {
        $path = parse_url($path, PHP_URL_PATH) ?: '';
    }
    $path = str_replace('\\', '/', $path);
    $path = preg_replace('#^/+#', '', $path);
    $path = preg_replace('#^(parkdedemankartal|api)/+#i', '', $path);
    $path = preg_replace('#^/+#', '', $path);
    if ($path === '' || str_contains($path, '..')) {
        return '';
    }
    $path = preg_replace('#^(menu-products/[^/]+)-v\d+(\.[a-z0-9]+)$#i', '$1$2', $path);
    if (!str_contains($path, '/')) {
        $path = 'menu-products/' . $path;
    }
    if (str_starts_with($path, 'menu-products/')) {
        $path = preg_replace('#\.(png|jpe?g)$#i', '.webp', $path);
    } elseif (preg_match('#^uploads/products/.+\.(png|jpe?g)$#i', $path)) {
        $webp = preg_replace('#\.(png|jpe?g)$#i', '.webp', $path);
        if (is_file(dirname(__DIR__) . '/' . $webp)) {
            $path = $webp;
        }
    }
    return $path;
}

function kpd_migrate_product_image_paths()
{
    if (!kpd_table_exists('products')) {
        return 0;
    }
    $updated = 0;
    $rows = kpd_pdo()->query('SELECT id, image_url FROM products')->fetchAll();
    $stmt = kpd_pdo()->prepare('UPDATE products SET image_url = ? WHERE id = ?');
    foreach ($rows as $row) {
        $next = kpd_normalize_product_image_path($row['image_url'] ?? '');
        if ($next !== (string) ($row['image_url'] ?? '')) {
            $stmt->execute([$next, $row['id']]);
            $updated++;
        }
    }
    return $updated;
}
