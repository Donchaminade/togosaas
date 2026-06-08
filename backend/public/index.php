<?php

declare(strict_types=1);

use TCH\Auth;
use TCH\Controllers\AdminController;
use TCH\Controllers\AuthController;
use TCH\Controllers\AuthorController;
use TCH\Controllers\CommunityController;
use TCH\Controllers\CommunityEventController;
use TCH\Controllers\EngagementController;
use TCH\Controllers\ContactController;
use TCH\Controllers\MetaController;
use TCH\Controllers\ReportController;
use TCH\Controllers\SupportController;
use TCH\Controllers\UploadController;
use TCH\Response;
use TCH\Router;
use TCH\HttpMethod;

require_once dirname(__DIR__) . '/src/bootstrap.php';

/* ------------------------------------------------------------------ */
/* Fichiers uploades (/uploads/*) — necessaire sous Apache/Hostinger   */
/* ------------------------------------------------------------------ */
$requestUri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
if (str_starts_with($requestUri, '/uploads/')) {
    $relative = ltrim(substr($requestUri, strlen('/uploads/')), '/');
    if ($relative !== '' && !str_contains($relative, '..')) {
        $file = dirname(__DIR__) . '/storage/uploads/' . $relative;
        if (is_file($file)) {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = $finfo->file($file) ?: 'application/octet-stream';
            header('Content-Type: ' . $mime);
            header('Cache-Control: public, max-age=31536000, immutable');
            readfile($file);
            exit;
        }
    }
    http_response_code(404);
    exit;
}

/* ------------------------------------------------------------------ */
/* CORS                                                                */
/* ------------------------------------------------------------------ */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = array_values(array_filter(array_map(
    static fn(string $u) => rtrim(trim($u), '/'),
    explode(',', (string) env('FRONTEND_URLS', '')),
)));

if ($allowedOrigins === []) {
    $single = rtrim(trim((string) env('FRONTEND_URL', '*')), '/');
    $allowedOrigins = $single !== '' && $single !== '*' ? [$single] : [];
}

if ($allowedOrigins === []) {
    $allowOrigin = $origin !== '' ? $origin : '*';
} elseif ($origin !== '' && in_array(rtrim($origin, '/'), $allowedOrigins, true)) {
    $allowOrigin = $origin;
} else {
    $allowOrigin = $allowedOrigins[0];
}

header('Access-Control-Allow-Origin: ' . $allowOrigin);
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override');
header('Access-Control-Allow-Credentials: true');
header('Vary: Origin');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */
$router = new Router();

// Sante / meta
$router->get('/', fn() => Response::success([
    'name' => 'T.C.H API',
    'version' => '1.0.0',
], 'Bienvenue sur l\'API T.C.H — Togo Communities Hub'));
$router->get('/health', fn() => Response::success(['status' => 'ok']));
$router->get('/meta', [new MetaController(), 'meta']);
$author = new AuthorController();
$router->get('/meta/author', [$author, 'show']);

// Authentification
$auth = new AuthController();
$router->post('/auth/register', [$auth, 'register']);
$router->post('/auth/login', [$auth, 'login']);
$router->get('/auth/me', [$auth, 'me']);
$router->put('/auth/profile', [$auth, 'updateProfile']);

// Upload fichiers (images)
$upload = new UploadController();
$router->post('/upload', [$upload, 'store']);

// Communautes (public)
$communities = new CommunityController();
$router->get('/communities', [$communities, 'index']);
$router->get('/communities/{id}', [$communities, 'show']);
$events = new CommunityEventController();
$router->get('/communities/{id}/events', [$events, 'indexPublic']);
$router->get('/communities/{id}/events/{eventId}', [$events, 'showPublic']);
$engagement = new EngagementController();
$router->get('/communities/{id}/engagement', [$engagement, 'show']);
$router->post('/communities/{id}/like', [$engagement, 'toggleLike']);
$router->post('/communities/{id}/review', [$engagement, 'review']);
$router->get('/meta/countries', [$communities, 'countries']);
$router->get('/meta/neighborhoods', [$communities, 'neighborhoods']);
$router->get('/meta/tags', [$communities, 'tags']);

// Espace lead (proprietaire de communaute)
$router->get('/lead/communities', [$communities, 'mine']);
$router->get('/lead/communities/{id}', [$communities, 'showMine']);
$router->post('/lead/communities', [$communities, 'store']);
$router->put('/lead/communities/{id}', [$communities, 'update']);
$router->delete('/lead/communities/{id}', [$communities, 'destroy']);
$router->get('/lead/communities/{id}/events', [$events, 'indexLead']);
$router->post('/lead/communities/{id}/events', [$events, 'store']);
$router->put('/lead/communities/{id}/events/{eventId}', [$events, 'update']);
$router->delete('/lead/communities/{id}/events/{eventId}', [$events, 'destroy']);

// Support lead <-> admin
$support = new SupportController();
$router->get('/lead/support/messages', [$support, 'leadMessages']);
$router->post('/lead/support/messages', [$support, 'leadSend']);
$router->post('/lead/support/attachments', [$support, 'leadUploadAttachment']);
$router->get('/lead/support/messages/{messageId}/attachments/{index}', [$support, 'leadDownloadAttachment']);
$router->patch('/lead/support/messages/{messageId}', [$support, 'leadUpdateMessage']);
$router->delete('/lead/support/messages/{messageId}', [$support, 'leadDeleteMessage']);
$router->get('/lead/support/unread', [$support, 'leadUnread']);

// Contact
$contact = new ContactController();
$router->post('/contact', [$contact, 'store']);

// Signalements anonymes
$reports = new ReportController();
$router->get('/reports/categories', [$reports, 'categories']);
$router->post('/reports/evidence', [$reports, 'uploadEvidence']);
$router->post('/reports', [$reports, 'store']);
$router->get('/reports/track/{code}', [$reports, 'track']);

// Espace admin
$admin = new AdminController();
$router->get('/admin/stats', [$admin, 'stats']);
$router->get('/admin/communities', [$admin, 'communities']);
$router->post('/admin/communities', [$admin, 'storeCommunity']);
$router->patch('/admin/communities/{id}/status', [$admin, 'updateStatus']);
$router->put('/admin/communities/{id}', [$admin, 'update']);
$router->delete('/admin/communities/{id}', [$admin, 'destroy']);
$router->get('/admin/leads', [$admin, 'leads']);
$router->post('/admin/leads', [$admin, 'storeLead']);
$router->get('/admin/leads/{id}', [$admin, 'showLead']);
$router->put('/admin/leads/{id}', [$admin, 'updateLead']);
$router->get('/admin/users', [$admin, 'users']);
$router->post('/admin/admins', [$admin, 'storeAdmin']);
$router->get('/admin/users/{id}', [$admin, 'showUser']);
$router->put('/admin/users/{id}', [$admin, 'updateUser']);
$router->delete('/admin/users/{id}', [$admin, 'destroyUser']);
$router->get('/admin/messages', [$admin, 'messages']);
$router->patch('/admin/messages/{id}/read', [$admin, 'markMessageRead']);
$router->get('/admin/support/conversations', [$support, 'adminConversations']);
$router->get('/admin/support/leads/{userId}/messages', [$support, 'adminThread']);
$router->post('/admin/support/leads/{userId}/messages', [$support, 'adminSend']);
$router->post('/admin/support/attachments', [$support, 'adminUploadAttachment']);
$router->get('/admin/support/messages/{messageId}/attachments/{index}', [$support, 'adminDownloadAttachment']);
$router->patch('/admin/support/messages/{messageId}', [$support, 'adminUpdateMessage']);
$router->delete('/admin/support/messages/{messageId}', [$support, 'adminDeleteMessage']);
$router->post('/admin/support/broadcast', [$support, 'adminBroadcast']);
$router->get('/admin/author', [$author, 'adminShow']);
$router->put('/admin/author', [$author, 'adminUpdate']);
$router->get('/admin/reports', [$reports, 'adminIndex']);
$router->get('/admin/reports/{id}', [$reports, 'adminShow']);
$router->put('/admin/reports/{id}', [$reports, 'adminUpdate']);
$router->delete('/admin/reports/{id}', [$reports, 'adminDestroy']);
$router->get('/admin/reports/{id}/evidence/{index}', [$reports, 'adminEvidence']);

/* ------------------------------------------------------------------ */
/* Dispatch                                                            */
/* ------------------------------------------------------------------ */
$router->dispatch(
    HttpMethod::resolve(),
    $_SERVER['REQUEST_URI'] ?? '/'
);
