<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/vendor/autoload.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function validateTokenAndRole() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Authorization header missing or invalid']);
        exit();
    }
    $token = $matches[1];

    $keycloakUrl = 'http://keycloak:8080';
    $realm = 'reports-realm';
    $certsUrl = "{$keycloakUrl}/realms/{$realm}/protocol/openid-connect/certs";
    $certsResponse = file_get_contents($certsUrl);
    if ($certsResponse === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch Keycloak certificates']);
        exit();
    }
    $jwkSet = json_decode($certsResponse, true);

    try {
        $decoded = \Firebase\JWT\JWT::decode($token, \Firebase\JWT\JWK::parseKeySet($jwkSet));
        $payload = (array)$decoded;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Token validation failed: ' . $e->getMessage()]);
        exit();
    }

    $hasProtheticRole = false;
    
    // Проверяем realm_access.roles
    if (isset($payload['realm_access'])) {
        $realmAccess = $payload['realm_access'];
        if (is_object($realmAccess)) {
            $realmAccess = (array)$realmAccess;
        }
        if (isset($realmAccess['roles']) && is_array($realmAccess['roles']) && in_array('prothetic_user', $realmAccess['roles'])) {
            $hasProtheticRole = true;
        }
    }
    
    // Проверяем resource_access
    if (isset($payload['resource_access'])) {
        $resourceAccess = $payload['resource_access'];
        if (is_object($resourceAccess)) {
            $resourceAccess = (array)$resourceAccess;
        }
        foreach ($resourceAccess as $client => $access) {
            if (is_object($access)) {
                $access = (array)$access;
            }
            if (isset($access['roles']) && is_array($access['roles']) && in_array('prothetic_user', $access['roles'])) {
                $hasProtheticRole = true;
                break;
            }
        }
    }
    if (!$hasProtheticRole) {
        http_response_code(401);
        echo json_encode(['error' => 'Access denied. Role prothetic_user required']);
        exit();
    }
    return $payload;
}

// Роутинг
switch ($path) {
    case '/reports':
        if ($method === 'GET') {
            getReports();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
    case '/reports/':
        if ($method === 'GET') {
            getReports();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}

function getReports() {
    // Проверяем токен и роль
    $userInfo = validateTokenAndRole();
    
    // Генерируем произвольные данные для отчётов
    $reports = [];
    
    for ($i = 1; $i <= 10; $i++) {
        $reports[] = [
            'id' => $i,
            'title' => 'Отчёт №' . $i,
            'description' => 'Описание отчёта №' . $i,
            'created_at' => date('Y-m-d H:i:s', time() - rand(0, 86400 * 30)), // Случайная дата за последний месяц
            'status' => ['active', 'draft', 'archived'][rand(0, 2)],
            'author' => ['Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.'][rand(0, 2)],
            'metrics' => [
                'total_users' => rand(100, 10000),
                'active_users' => rand(50, 5000),
                'revenue' => rand(10000, 1000000),
                'growth_rate' => rand(-20, 50) / 10
            ]
        ];
    }
    
    // Поддержка пагинации
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;
    
    $paginatedReports = array_slice($reports, $offset, $limit);
    
    echo json_encode([
        'data' => $paginatedReports,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => count($reports),
            'total_pages' => ceil(count($reports) / $limit)
        ],
        'user' => [
            'username' => $userInfo['preferred_username'] ?? 'unknown',
            'email' => $userInfo['email'] ?? 'unknown'
        ]
    ], JSON_UNESCAPED_UNICODE);
}
?> 