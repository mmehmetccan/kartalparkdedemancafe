<?php

require __DIR__ . '/lib.php';

header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$base = '/parkdedemankartal';
if (str_starts_with($uri, $base)) {
    $uri = substr($uri, strlen($base)) ?: '/';
}
if (str_starts_with($uri, '/api')) {
    $uri = substr($uri, 4) ?: '/';
}
$uri = '/' . trim($uri, '/');
if ($uri !== '/') {
    $uri = rtrim($uri, '/');
}

function kpd_match($pattern, $uri, &$params = [])
{
    $params = [];
    $regex = '#^' . preg_replace('#:([a-zA-Z0-9_]+)#', '(?P<$1>[^/]+)', $pattern) . '$#';
    if (!preg_match($regex, $uri, $match)) {
        return false;
    }
    foreach ($match as $key => $value) {
        if (!is_int($key)) {
            $params[$key] = $value;
        }
    }
    return true;
}

try {
    if ($method === 'GET' && $uri === '/health') {
        $db = false;
        $tables = [];
        $dbError = null;
        try {
            $db = (bool) kpd_pdo()->query('SELECT 1')->fetchColumn();
            if (kpd_table_exists('products')) {
                $tables['products'] = (int) kpd_pdo()->query('SELECT COUNT(*) FROM products')->fetchColumn();
            }
            if (kpd_table_exists('users')) {
                $tables['users'] = (int) kpd_pdo()->query('SELECT COUNT(*) FROM users')->fetchColumn();
            }
        } catch (Throwable $error) {
            $db = false;
            $dbError = $error->getMessage();
        }
        kpd_send(200, [
            'ok' => $db,
            'php' => PHP_VERSION,
            'tables' => $tables,
            'dbError' => $dbError,
        ]);
    }

    if ($method === 'POST' && $uri === '/setup') {
        $token = $_GET['token'] ?? '';
        $expected = (string) (kpd_config()['setup_token'] ?? '');
        if ($expected === '' || !hash_equals($expected, $token)) {
            kpd_fail(403, 'auth.insufficient_role');
        }

        $imported = false;
        if (!kpd_table_exists('products')) {
            $candidates = [
                __DIR__ . '/../export/kartalparkdedemancafe.sql',
                __DIR__ . '/seed.sql',
            ];
            $sqlFile = null;
            foreach ($candidates as $candidate) {
                if (is_file($candidate)) {
                    $sqlFile = $candidate;
                    break;
                }
            }
            if (!$sqlFile) {
                kpd_fail(500, 'products.fetch_failed', [], ['errorDetail' => 'SQL dump bulunamadı.']);
            }
            foreach (kpd_split_sql(file_get_contents($sqlFile)) as $statement) {
                kpd_pdo()->exec($statement);
            }
            $imported = true;
        }

        $upgraded = 0;
        if (kpd_table_exists('users')) {
            $users = kpd_pdo()->query('SELECT id, password FROM users')->fetchAll();
            $bootstrap = (string) (kpd_config()['admin_bootstrap_password'] ?? 'admin');
            foreach ($users as $user) {
                if (kpd_is_node_scrypt($user['password'])) {
                    $stmt = kpd_pdo()->prepare('UPDATE users SET password = ? WHERE id = ?');
                    $stmt->execute([kpd_hash_password($bootstrap), $user['id']]);
                    $upgraded++;
                }
            }
        }

        $imagesNormalized = 0;
        $imagePaths = [];
        if (kpd_table_exists('products')) {
            $imagesNormalized = kpd_migrate_product_image_paths();
            $imagePaths = kpd_pdo()->query('SELECT name, image_url FROM products ORDER BY name')->fetchAll();
        }

        kpd_send(200, [
            'ok' => true,
            'imported' => $imported,
            'passwordsUpgraded' => $upgraded,
            'imagesNormalized' => $imagesNormalized,
            'imagePaths' => $imagePaths,
            'products' => kpd_table_exists('products') ? (int) kpd_pdo()->query('SELECT COUNT(*) FROM products')->fetchColumn() : 0,
            'users' => kpd_table_exists('users') ? (int) kpd_pdo()->query('SELECT COUNT(*) FROM users')->fetchColumn() : 0,
        ]);
    }

    if ($method === 'POST' && $uri === '/auth/login') {
        $body = kpd_json_input();
        $requestedRoom = trim((string) ($body['roomNumber'] ?? ''));
        $roomNumber = strtolower($requestedRoom) === 'own' ? 'own' : $requestedRoom;
        if ($roomNumber === '') {
            kpd_fail(400, 'auth.room_required');
        }
        if ($roomNumber !== 'own' && !preg_match('/^[1-6]0(?:0[1-9]|1[0-2])$/', $roomNumber)) {
            kpd_fail(400, 'auth.room_invalid');
        }
        $token = kpd_jwt_sign(['roomNumber' => $roomNumber], 3 * 60 * 60);
        kpd_send(200, [
            'token' => $token,
            'roomNumber' => $roomNumber,
            'expiresAt' => gmdate('c', time() + 3 * 60 * 60),
        ]);
    }

    if ($method === 'GET' && $uri === '/auth/admin/exists') {
        $username = trim((string) ($_GET['username'] ?? ''));
        if (!preg_match('/^[a-zA-Z0-9._-]{3,40}$/', $username)) {
            kpd_send(200, ['exists' => false]);
        }
        $stmt = kpd_pdo()->prepare('SELECT id FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        kpd_send(200, ['exists' => (bool) $stmt->fetchColumn()]);
    }

    if ($method === 'POST' && $uri === '/auth/admin/login') {
        $body = kpd_json_input();
        $username = trim((string) ($body['username'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        if ($username === '' || $password === '') {
            kpd_fail(400, 'auth.credentials_required');
        }
        $stmt = kpd_pdo()->prepare('SELECT id, username, password, role, created_at, updated_at FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if (!$user || !kpd_verify_password($password, $user['password'], $username)) {
            kpd_fail(401, 'auth.invalid_credentials');
        }
        kpd_maybe_upgrade_password($user['id'], $password, $user['password']);
        $token = kpd_jwt_sign(['id' => $user['id'], 'role' => $user['role']], 8 * 60 * 60);
        kpd_send(200, [
            'token' => $token,
            'username' => $user['username'],
            'role' => $user['role'],
        ]);
    }

    if ($method === 'GET' && $uri === '/products') {
        kpd_guest();
        $rows = kpd_pdo()->query(
            'SELECT id, name, category, menu_section, menu_subsection, description, intensity,
                    selling_price, cost_price, image_url, translations, created_at, updated_at
             FROM products WHERE is_available = 1
             ORDER BY menu_section ASC, menu_subsection ASC, name ASC'
        )->fetchAll();
        kpd_send(200, array_map(fn ($row) => kpd_localize_product(kpd_map_product($row)), $rows));
    }

    if ($method === 'GET' && $uri === '/products/menu-sections') {
        kpd_staff(['admin', 'reception', 'chef']);
        kpd_send(200, kpd_menu_sections());
    }

    if ($method === 'POST' && $uri === '/products/upload-image') {
        kpd_staff(['admin', 'reception', 'chef']);
        if (empty($_FILES['image']['tmp_name'])) {
            kpd_fail(400, 'products.image_required');
        }
        $file = $_FILES['image'];
        if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
            kpd_fail(400, 'products.image_upload_failed');
        }
        if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
            kpd_fail(400, 'products.image_upload_failed', [], ['errorDetail' => 'Dosya 5 MB sınırını aşıyor.']);
        }
        $mime = mime_content_type($file['tmp_name']);
        $extensions = [
            'image/jpeg' => '.jpg',
            'image/png' => '.png',
            'image/webp' => '.webp',
            'image/gif' => '.gif',
        ];
        if (!isset($extensions[$mime])) {
            kpd_fail(400, 'products.image_upload_failed', [], ['errorDetail' => 'Yalnızca JPEG, PNG, WEBP veya GIF görselleri yüklenebilir.']);
        }
        $dir = dirname(__DIR__) . '/uploads/products';
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            kpd_fail(400, 'products.image_upload_failed');
        }
        $filename = round(microtime(true) * 1000) . '-' . bin2hex(random_bytes(4)) . $extensions[$mime];
        if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $filename)) {
            kpd_fail(400, 'products.image_upload_failed');
        }
        kpd_send(201, ['imageUrl' => 'uploads/products/' . $filename]);
    }

    if ($method === 'GET' && $uri === '/products/admin/all') {
        kpd_staff(['admin', 'reception', 'chef']);
        $rows = kpd_pdo()->query(
            'SELECT * FROM products ORDER BY menu_section ASC, menu_subsection ASC, name ASC'
        )->fetchAll();
        kpd_send(200, array_map('kpd_map_product', $rows));
    }

    if ($method === 'POST' && $uri === '/products') {
        kpd_staff(['admin', 'reception', 'chef']);
        $product = kpd_normalize_product(kpd_json_input());
        $id = kpd_uuid();
        $stmt = kpd_pdo()->prepare(
            'INSERT INTO products
             (id, name, category, menu_section, menu_subsection, description, intensity,
              selling_price, cost_price, image_url, translations, is_available)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id,
            $product['name'],
            $product['category'],
            $product['menuSection'],
            $product['menuSubsection'],
            $product['description'],
            $product['intensity'],
            $product['sellingPrice'],
            $product['costPrice'],
            $product['imageUrl'],
            json_encode($product['translations'], JSON_UNESCAPED_UNICODE),
            $product['isAvailable'] ? 1 : 0,
        ]);
        $stmt = kpd_pdo()->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$id]);
        kpd_send(201, kpd_map_product($stmt->fetch()));
    }

    if ($method === 'PUT' && kpd_match('/products/:id', $uri, $params) && !str_contains($params['id'], '/')) {
        kpd_staff(['admin', 'reception', 'chef']);
        $product = kpd_normalize_product(kpd_json_input());
        $stmt = kpd_pdo()->prepare(
            'UPDATE products SET
               name = ?, category = ?, menu_section = ?, menu_subsection = ?, description = ?,
               intensity = ?, selling_price = ?, cost_price = ?, image_url = ?, translations = ?,
               is_available = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $product['name'],
            $product['category'],
            $product['menuSection'],
            $product['menuSubsection'],
            $product['description'],
            $product['intensity'],
            $product['sellingPrice'],
            $product['costPrice'],
            $product['imageUrl'],
            json_encode($product['translations'], JSON_UNESCAPED_UNICODE),
            $product['isAvailable'] ? 1 : 0,
            $params['id'],
        ]);
        if ($stmt->rowCount() === 0) {
            $check = kpd_pdo()->prepare('SELECT * FROM products WHERE id = ?');
            $check->execute([$params['id']]);
            if (!$check->fetch()) {
                kpd_fail(404, 'products.not_found');
            }
        }
        $stmt = kpd_pdo()->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$params['id']]);
        kpd_send(200, kpd_map_product($stmt->fetch()));
    }

    if ($method === 'DELETE' && kpd_match('/products/:id', $uri, $params)) {
        kpd_staff(['admin', 'reception', 'chef']);
        $stmt = kpd_pdo()->prepare('DELETE FROM products WHERE id = ?');
        $stmt->execute([$params['id']]);
        if ($stmt->rowCount() === 0) {
            kpd_fail(404, 'products.not_found');
        }
        kpd_ok_message(200, 'products.deleted');
    }

    if ($method === 'POST' && $uri === '/orders') {
        $roomNumber = kpd_guest();
        $body = kpd_json_input();
        $paymentMethod = $body['paymentMethod'] ?? '';
        if (!in_array($paymentMethod, ['Nakit', 'Kredi Kartı'], true)) {
            kpd_fail(400, 'orders.invalid_payment_method');
        }
        $requestedItems = $body['items'] ?? [];
        if (!is_array($requestedItems) || !$requestedItems) {
            kpd_fail(400, 'orders.empty_items');
        }
        $quantities = [];
        foreach ($requestedItems as $item) {
            $productId = (string) ($item['productId'] ?? '');
            $quantity = (int) ($item['quantity'] ?? 0);
            if ($productId === '' || $quantity < 1 || $quantity > 20) {
                kpd_fail(400, 'orders.invalid_items');
            }
            $quantities[$productId] = ($quantities[$productId] ?? 0) + $quantity;
        }
        $ids = array_keys($quantities);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = kpd_pdo()->prepare("SELECT * FROM products WHERE id IN ($placeholders) AND is_available = 1");
        $stmt->execute($ids);
        $products = $stmt->fetchAll();
        if (count($products) !== count($ids)) {
            kpd_fail(400, 'orders.unavailable_product');
        }
        $items = [];
        $totalRevenue = 0;
        $totalCost = 0;
        foreach ($products as $row) {
            $product = kpd_map_product($row);
            $quantity = $quantities[$product['_id']];
            $items[] = [
                'product' => $product['_id'],
                'name' => $product['name'],
                'quantity' => $quantity,
                'unitPrice' => $product['sellingPrice'],
                'costPrice' => $product['costPrice'],
            ];
            $totalRevenue += $product['sellingPrice'] * $quantity;
            $totalCost += $product['costPrice'] * $quantity;
        }
        $id = kpd_uuid();
        $stmt = kpd_pdo()->prepare(
            "INSERT INTO orders
             (id, room_number, is_own_order, items, payment_method, status, total_revenue, total_cost, total_profit)
             VALUES (?, ?, ?, ?, ?, 'Bekliyor', ?, ?, ?)"
        );
        $stmt->execute([
            $id,
            $roomNumber,
            strtolower($roomNumber) === 'own' ? 1 : 0,
            json_encode($items, JSON_UNESCAPED_UNICODE),
            $paymentMethod,
            $totalRevenue,
            $totalCost,
            $totalRevenue - $totalCost,
        ]);
        $stmt = kpd_pdo()->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$id]);
        kpd_send(201, kpd_map_order($stmt->fetch()));
    }

    if ($method === 'GET' && $uri === '/orders/active') {
        kpd_staff();
        $rows = kpd_pdo()->query("SELECT * FROM orders WHERE status = 'Bekliyor' ORDER BY created_at ASC")->fetchAll();
        kpd_send(200, array_map('kpd_map_order', $rows));
    }

    if ($method === 'GET' && $uri === '/orders/stream') {
        kpd_staff();
        ignore_user_abort(true);
        set_time_limit(70);
        header('Content-Type: text/event-stream; charset=utf-8');
        header('Cache-Control: no-cache, no-transform');
        header('X-Accel-Buffering: no');
        echo "retry: 4000\n";
        echo "event: ready\ndata: " . json_encode(['connectedAt' => gmdate('c')]) . "\n\n";
        @ob_flush();
        flush();
        $known = [];
        for ($i = 0; $i < 20; $i++) {
            $rows = kpd_pdo()->query("SELECT * FROM orders WHERE status = 'Bekliyor' ORDER BY created_at ASC")->fetchAll();
            $current = [];
            foreach ($rows as $row) {
                $order = kpd_map_order($row);
                $current[$order['_id']] = $order;
                if ($i > 0 && !isset($known[$order['_id']])) {
                    echo 'event: order:created' . "\n";
                    echo 'data: ' . json_encode($order, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";
                }
            }
            if ($i > 0) {
                foreach ($known as $id => $unused) {
                    if (!isset($current[$id])) {
                        echo "event: order:removed\n";
                        echo 'data: ' . json_encode(['_id' => $id, 'reason' => 'updated']) . "\n\n";
                    }
                }
            }
            $known = $current;
            echo ": ping\n\n";
            @ob_flush();
            flush();
            if (connection_aborted()) {
                break;
            }
            sleep(2);
        }
        exit;
    }

    if ($method === 'GET' && $uri === '/orders/history') {
        kpd_staff();
        $range = kpd_order_range($_GET);
        $stmt = kpd_pdo()->prepare(
            "SELECT * FROM orders
             WHERE status = 'Teslim Edildi' AND delivered_at >= ? AND delivered_at < ?
             ORDER BY delivered_at DESC"
        );
        $stmt->execute([$range['start'], $range['end']]);
        kpd_send(200, array_merge($range, ['orders' => array_map('kpd_map_order', $stmt->fetchAll())]));
    }

    if ($method === 'GET' && $uri === '/orders/summary') {
        kpd_staff(['admin']);
        $range = kpd_order_range($_GET);
        $stmt = kpd_pdo()->prepare(
            "SELECT
               SUM(CASE WHEN is_own_order = 0 THEN 1 ELSE 0 END) AS orderCount,
               SUM(CASE WHEN is_own_order = 0 THEN total_revenue ELSE 0 END) AS revenue,
               SUM(CASE WHEN is_own_order = 0 THEN total_cost ELSE 0 END) AS cost,
               SUM(CASE WHEN is_own_order = 0 THEN total_profit ELSE 0 END) AS profit,
               SUM(CASE WHEN is_own_order = 1 THEN 1 ELSE 0 END) AS ownOrderCount,
               SUM(CASE WHEN is_own_order = 1 THEN total_revenue ELSE 0 END) AS ownBalance
             FROM orders
             WHERE status = 'Teslim Edildi' AND delivered_at >= ? AND delivered_at < ?"
        );
        $stmt->execute([$range['start'], $range['end']]);
        $summary = $stmt->fetch() ?: [];
        kpd_send(200, array_merge($range, [
            'orderCount' => (int) ($summary['orderCount'] ?? 0),
            'revenue' => (float) ($summary['revenue'] ?? 0),
            'cost' => (float) ($summary['cost'] ?? 0),
            'profit' => (float) ($summary['profit'] ?? 0),
            'ownOrderCount' => (int) ($summary['ownOrderCount'] ?? 0),
            'ownBalance' => (float) ($summary['ownBalance'] ?? 0),
        ]));
    }

    if ($method === 'PUT' && kpd_match('/orders/:id/deliver', $uri, $params)) {
        kpd_staff();
        $stmt = kpd_pdo()->prepare(
            "UPDATE orders SET status = 'Teslim Edildi', delivered_at = UTC_TIMESTAMP()
             WHERE id = ? AND status = 'Bekliyor'"
        );
        $stmt->execute([$params['id']]);
        if ($stmt->rowCount() === 0) {
            kpd_fail(404, 'orders.pending_not_found');
        }
        $stmt = kpd_pdo()->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$params['id']]);
        kpd_send(200, kpd_map_order($stmt->fetch()));
    }

    if ($method === 'PUT' && kpd_match('/orders/:id/cancel', $uri, $params)) {
        kpd_staff();
        $stmt = kpd_pdo()->prepare(
            "UPDATE orders SET status = 'İptal Edildi', cancelled_at = UTC_TIMESTAMP()
             WHERE id = ? AND status = 'Bekliyor'"
        );
        $stmt->execute([$params['id']]);
        if ($stmt->rowCount() === 0) {
            kpd_fail(404, 'orders.pending_not_found');
        }
        $stmt = kpd_pdo()->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$params['id']]);
        kpd_send(200, kpd_map_order($stmt->fetch()));
    }

    if ($method === 'POST' && $uri === '/breakfast') {
        kpd_staff(['admin', 'reception']);
        $body = kpd_json_input();
        $roomNumber = trim((string) ($body['roomNumber'] ?? ''));
        $note = trim((string) ($body['note'] ?? ''));
        $guestCount = (int) ($body['guestCount'] ?? 0);
        $requestedTime = trim((string) ($body['requestedTime'] ?? ''));
        $scheduledDate = trim((string) ($body['scheduledDate'] ?? ''));
        $days = (int) ($body['days'] ?? 1);
        if ($roomNumber === '') {
            kpd_fail(400, 'breakfast.room_required');
        }
        if ($guestCount < 1 || $guestCount > 20) {
            kpd_fail(400, 'breakfast.guest_count_invalid');
        }
        if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $requestedTime)) {
            kpd_fail(400, 'breakfast.requested_time_invalid');
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $scheduledDate)) {
            kpd_fail(400, 'breakfast.date_invalid');
        }
        $hotel = kpd_hotel_now();
        $tomorrow = kpd_date_after($hotel['date'], 1);
        if ($scheduledDate < $hotel['date'] || $scheduledDate > $tomorrow) {
            kpd_fail(400, 'breakfast.date_out_of_window');
        }
        if ($scheduledDate === $hotel['date'] && ($hotel['hour'] >= 14 || $requestedTime <= sprintf('%02d:00', $hotel['hour']))) {
            kpd_fail(400, 'breakfast.same_day_time_invalid');
        }
        if ($days < 1 || $days > 30) {
            kpd_fail(400, 'breakfast.days_invalid');
        }
        $planId = kpd_uuid();
        $pdo = kpd_pdo();
        $pdo->beginTransaction();
        $ids = [];
        $stmt = $pdo->prepare(
            "INSERT INTO breakfasts
             (id, room_number, note, guest_count, requested_time, scheduled_date, plan_id, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Bekliyor')"
        );
        for ($index = 0; $index < $days; $index++) {
            $id = kpd_uuid();
            $stmt->execute([
                $id,
                $roomNumber,
                $note,
                $guestCount,
                $requestedTime,
                kpd_date_after($scheduledDate, $index),
                $planId,
            ]);
            $ids[] = $id;
        }
        $pdo->commit();
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("SELECT * FROM breakfasts WHERE id IN ($placeholders) ORDER BY scheduled_date ASC, requested_time ASC");
        $stmt->execute($ids);
        kpd_send(201, [
            'breakfasts' => array_map('kpd_map_breakfast', $stmt->fetchAll()),
            'planId' => $planId,
        ]);
    }

    if ($method === 'GET' && $uri === '/breakfast/active') {
        kpd_staff();
        kpd_cancel_overdue_breakfasts();
        $date = kpd_hotel_now()['date'];
        $stmt = kpd_pdo()->prepare(
            "SELECT * FROM breakfasts
             WHERE status = 'Bekliyor' AND scheduled_date <= ?
             ORDER BY requested_time ASC, created_at ASC"
        );
        $stmt->execute([$date]);
        kpd_send(200, array_map('kpd_map_breakfast', $stmt->fetchAll()));
    }

    if ($method === 'PUT' && kpd_match('/breakfast/:id/deliver', $uri, $params)) {
        kpd_staff();
        kpd_cancel_overdue_breakfasts();
        $stmt = kpd_pdo()->prepare(
            "UPDATE breakfasts SET status = 'Teslim Edildi', delivered_at = UTC_TIMESTAMP()
             WHERE id = ? AND status = 'Bekliyor'"
        );
        $stmt->execute([$params['id']]);
        if ($stmt->rowCount() === 0) {
            kpd_fail(404, 'breakfast.pending_not_found');
        }
        $stmt = kpd_pdo()->prepare('SELECT * FROM breakfasts WHERE id = ?');
        $stmt->execute([$params['id']]);
        kpd_send(200, kpd_map_breakfast($stmt->fetch()));
    }

    if ($method === 'PUT' && kpd_match('/breakfast/:id', $uri, $params)) {
        kpd_staff(['admin', 'reception']);
        $body = kpd_json_input();
        $roomNumber = trim((string) ($body['roomNumber'] ?? ''));
        $note = trim((string) ($body['note'] ?? ''));
        $guestCount = (int) ($body['guestCount'] ?? 0);
        $requestedTime = trim((string) ($body['requestedTime'] ?? ''));
        $scheduledDate = trim((string) ($body['scheduledDate'] ?? ''));
        if ($roomNumber === '') {
            kpd_fail(400, 'breakfast.room_required');
        }
        if ($guestCount < 1 || $guestCount > 20) {
            kpd_fail(400, 'breakfast.guest_count_invalid');
        }
        if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $requestedTime)) {
            kpd_fail(400, 'breakfast.requested_time_invalid');
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $scheduledDate)) {
            kpd_fail(400, 'breakfast.date_invalid');
        }
        $stmt = kpd_pdo()->prepare(
            "UPDATE breakfasts SET
               room_number = ?, note = ?, guest_count = ?, requested_time = ?, scheduled_date = ?
             WHERE id = ? AND status = 'Bekliyor'"
        );
        $stmt->execute([$roomNumber, $note, $guestCount, $requestedTime, $scheduledDate, $params['id']]);
        if ($stmt->rowCount() === 0) {
            kpd_fail(404, 'breakfast.editable_not_found');
        }
        $stmt = kpd_pdo()->prepare('SELECT * FROM breakfasts WHERE id = ?');
        $stmt->execute([$params['id']]);
        kpd_send(200, kpd_map_breakfast($stmt->fetch()));
    }

    if ($method === 'GET' && $uri === '/breakfast/history') {
        kpd_staff();
        $period = in_array($_GET['period'] ?? '', ['day', 'week', 'month'], true) ? $_GET['period'] : 'month';
        $selectedDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) ($_GET['date'] ?? '')) ? $_GET['date'] : kpd_hotel_now()['date'];
        if ($period === 'day') {
            $startDate = $endDate = $selectedDate;
        } elseif ($period === 'week') {
            $selected = new DateTimeImmutable($selectedDate . 'T00:00:00Z');
            $startDate = $selected->modify('-' . (((int) $selected->format('N')) - 1) . ' days')->format('Y-m-d');
            $endDate = kpd_date_after($startDate, 6);
        } else {
            $month = preg_match('/^\d{4}-\d{2}$/', (string) ($_GET['month'] ?? '')) ? $_GET['month'] : substr($selectedDate, 0, 7);
            $startDate = $month . '-01';
            $endDate = (new DateTimeImmutable($startDate . 'T00:00:00Z'))->modify('last day of this month')->format('Y-m-d');
        }
        $stmt = kpd_pdo()->prepare(
            "SELECT * FROM breakfasts
             WHERE status IN ('Teslim Edildi', 'İptal Edildi')
               AND scheduled_date >= ? AND scheduled_date <= ?
             ORDER BY scheduled_date DESC, requested_time DESC"
        );
        $stmt->execute([$startDate, $endDate]);
        kpd_send(200, [
            'period' => $period,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'breakfasts' => array_map('kpd_map_breakfast', $stmt->fetchAll()),
        ]);
    }

    if ($method === 'GET' && $uri === '/admin-users') {
        kpd_staff(['admin']);
        $rows = kpd_pdo()->query('SELECT id, username, role, created_at, updated_at FROM users ORDER BY username ASC')->fetchAll();
        kpd_send(200, array_map('kpd_map_user', $rows));
    }

    if ($method === 'POST' && $uri === '/admin-users') {
        kpd_staff(['admin']);
        $body = kpd_json_input();
        $username = trim((string) ($body['username'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        if (!preg_match('/^[a-zA-Z0-9._-]{3,40}$/', $username)) {
            kpd_fail(400, 'admin_users.username_invalid');
        }
        if (strlen($password) < 8) {
            kpd_fail(400, 'admin_users.password_invalid');
        }
        $role = in_array($body['role'] ?? '', ['admin', 'reception', 'chef'], true) ? $body['role'] : 'reception';
        try {
            $id = kpd_uuid();
            $stmt = kpd_pdo()->prepare('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)');
            $stmt->execute([$id, $username, kpd_hash_password($password), $role]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                kpd_fail(409, 'admin_users.username_taken');
            }
            throw $error;
        }
        $stmt = kpd_pdo()->prepare('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?');
        $stmt->execute([$id]);
        kpd_send(201, kpd_map_user($stmt->fetch()));
    }

    if ($method === 'PUT' && kpd_match('/admin-users/:id/password', $uri, $params)) {
        $actor = kpd_staff(['admin']);
        $password = (string) (kpd_json_input()['password'] ?? '');
        if (strlen($password) < 8) {
            kpd_fail(400, 'admin_users.password_invalid');
        }
        $stmt = kpd_pdo()->prepare('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?');
        $stmt->execute([$params['id']]);
        $user = $stmt->fetch();
        if (!$user) {
            kpd_fail(404, 'admin_users.not_found');
        }
        $stmt = kpd_pdo()->prepare('UPDATE users SET password = ? WHERE id = ?');
        $stmt->execute([kpd_hash_password($password), $params['id']]);
        kpd_ok_message(200, 'admin_users.password_updated', ['username' => $user['username']]);
    }

    if ($method === 'DELETE' && kpd_match('/admin-users/:id', $uri, $params)) {
        $actor = kpd_staff(['admin']);
        $stmt = kpd_pdo()->prepare('SELECT id, username, role FROM users WHERE id = ?');
        $stmt->execute([$params['id']]);
        $user = $stmt->fetch();
        if (!$user) {
            kpd_fail(404, 'admin_users.not_found');
        }
        if ($user['id'] === $actor['id']) {
            kpd_fail(400, 'admin_users.cannot_delete_self');
        }
        if ($user['role'] === 'admin') {
            $adminCount = (int) kpd_pdo()->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
            if ($adminCount <= 1) {
                kpd_fail(400, 'admin_users.cannot_delete_last_admin');
            }
        }
        $stmt = kpd_pdo()->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$user['id']]);
        kpd_ok_message(200, 'admin_users.deleted', ['username' => $user['username']]);
    }

    kpd_send(404, ['message' => 'Not found']);
} catch (InvalidArgumentException $error) {
    kpd_fail(400, 'products.validation_failed', [], ['errorDetail' => $error->getMessage()]);
} catch (Throwable $error) {
    kpd_fail(500, 'auth.admin_login_failed', [], ['errorDetail' => $error->getMessage()]);
}

function kpd_cancel_overdue_breakfasts()
{
    $hotel = kpd_hotel_now();
    $comparison = $hotel['hour'] >= 14 ? '<=' : '<';
    $stmt = kpd_pdo()->prepare(
        "UPDATE breakfasts SET
           status = 'İptal Edildi',
           cancelled_at = UTC_TIMESTAMP(),
           cancellation_reason = '14:00 teslim süresi geçtiği için otomatik iptal edildi.'
         WHERE status = 'Bekliyor' AND scheduled_date $comparison ?"
    );
    $stmt->execute([$hotel['date']]);
}
