<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Auth;
use TCH\AutomationEngine;
use TCH\CommunityAccessHelper;
use TCH\CommunityHelper;
use TCH\Database;
use TCH\EngagementHelper;
use TCH\Request;
use TCH\Response;
use TCH\Validator;

final class AdminController
{
    /** Statistiques globales pour le tableau de bord admin. */
    public function stats(Request $request): void
    {
        Auth::requireAdmin();
        $db = Database::connection();

        $count = static function (string $sql) use ($db): int {
            return (int) $db->query($sql)->fetchColumn();
        };

        Response::success([
            'communities' => [
                'total' => $count("SELECT COUNT(*) FROM communities"),
                'pending' => $count("SELECT COUNT(*) FROM communities WHERE status = 'pending'"),
                'approved' => $count("SELECT COUNT(*) FROM communities WHERE status = 'approved'"),
                'rejected' => $count("SELECT COUNT(*) FROM communities WHERE status = 'rejected'"),
            ],
            'leads' => $count("SELECT COUNT(*) FROM users WHERE role = 'lead'"),
            'admins' => $count("SELECT COUNT(*) FROM users WHERE role = 'admin'"),
            'messages' => [
                'total' => $count("SELECT COUNT(*) FROM contact_messages"),
                'unread' => $count("SELECT COUNT(*) FROM contact_messages WHERE is_read = 0"),
            ],
            'reports' => [
                'total' => $count("SELECT COUNT(*) FROM community_reports"),
                'pending' => $count("SELECT COUNT(*) FROM community_reports WHERE status = 'pending'"),
                'investigating' => $count("SELECT COUNT(*) FROM community_reports WHERE status = 'investigating'"),
            ],
        ]);
    }

    /** Creer une communaute au nom d'un lead. */
    public function storeCommunity(Request $request): void
    {
        Auth::requireAdmin();

        Validator::make($request->all())->validate([
            'userId' => 'required|integer',
            'name' => 'required|min:2|max:160',
            'description' => 'required|min:20|max:2000',
            'country' => 'required|max:120',
            'city' => 'max:120',
            'tags' => 'array',
            'leaderName' => 'required|max:160',
            'leaderEmail' => 'required|email|max:160',
            'leaderPhone' => 'max:40',
            'shortDescription' => 'max:300',
            'publicEmail' => 'email|max:160',
            'status' => 'in:pending,approved,rejected',
        ])->abortIfFails();

        $userId = (int) $request->input('userId');
        $db = Database::connection();

        $stmt = $db->prepare("SELECT id, name, email, phone FROM users WHERE id = :id AND role = 'lead'");
        $stmt->execute(['id' => $userId]);
        $owner = $stmt->fetch();
        if (!$owner) {
            Response::error('Lead introuvable.', 404);
        }

        $status = (string) $request->input('status', 'approved');
        if (!in_array($status, ['pending', 'approved', 'rejected'], true)) {
            $status = 'approved';
        }

        $cols = CommunityHelper::withSlug(CommunityHelper::columnsFromRequest($request), $db);
        $cols['user_id'] = $userId;
        $cols['status'] = $status;

        $fields = array_keys($cols);
        $placeholders = array_map(static fn($f) => ':' . $f, $fields);
        $sql = 'INSERT INTO communities (' . implode(',', $fields) . ', created_at, updated_at) VALUES ('
            . implode(',', $placeholders) . ', NOW(), NOW())';
        $db->prepare($sql)->execute($cols);

        $newId = (int) $db->lastInsertId();
        $coLeads = json_decode($cols['co_leads'] ?? '[]', true) ?: [];
        CommunityAccessHelper::syncCoLeadMembers($newId, $coLeads);

        $stmt = $db->prepare(
            'SELECT c.*, u.name AS owner_name, u.email AS owner_email
             FROM communities c LEFT JOIN users u ON u.id = c.user_id WHERE c.id = :id'
        );
        $stmt->execute(['id' => $newId]);
        $row = $stmt->fetch();

        Response::success(
            ['community' => $this->serializeForAdmin($row)],
            'Communaute creee pour ' . $owner['name'] . '.',
            201
        );
    }

    /** Liste de toutes les communautes (filtrable par statut). */
    public function communities(Request $request): void
    {
        Auth::requireAdmin();
        $db = Database::connection();

        $sql = 'SELECT c.*, u.name AS owner_name, u.email AS owner_email
                FROM communities c LEFT JOIN users u ON u.id = c.user_id';
        $params = [];

        $status = (string) $request->query('status', '');
        if (in_array($status, ['pending', 'approved', 'rejected'], true)) {
            $sql .= ' WHERE c.status = :status';
            $params['status'] = $status;
        }
        $sql .= ' ORDER BY c.created_at DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $rows = array_map([$this, 'serializeForAdmin'], $stmt->fetchAll());

        // Enrichit chaque solution avec sa note moyenne et son nombre d'avis.
        $ids = array_values(array_filter(array_map(static fn ($r) => $r['id'] ?? null, $rows)));
        if ($ids !== []) {
            $statsMap = EngagementHelper::statsForCommunityIds($ids);
            foreach ($rows as &$row) {
                $stats = $statsMap[$row['id'] ?? 0] ?? null;
                $row['ratingAvg'] = $stats['ratingAvg'] ?? null;
                $row['reviewsCount'] = $stats['reviewsCount'] ?? 0;
            }
            unset($row);
        }

        Response::success(['communities' => $rows]);
    }

    /** Approuver / rejeter / remettre en attente une communaute. */
    public function updateStatus(Request $request): void
    {
        Auth::requireAdmin();
        Validator::make($request->all())->validate([
            'status' => 'required|in:pending,approved,rejected',
        ])->abortIfFails();

        $id = (int) $request->param('id');
        $status = (string) $request->input('status');

        $db = Database::connection();
        $stmt = $db->prepare('SELECT id FROM communities WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetch()) {
            Response::error('Communaute introuvable.', 404);
        }

        $db->prepare('UPDATE communities SET status = :status, updated_at = NOW() WHERE id = :id')
            ->execute(['status' => $status, 'id' => $id]);

        $labels = ['approved' => 'approuvee', 'rejected' => 'rejetee', 'pending' => 'remise en attente'];

        if ($status === 'approved' || $status === 'rejected') {
            $info = $db->prepare(
                'SELECT c.name, c.leader_name, c.leader_email, u.name AS owner_name, u.email AS owner_email
                 FROM communities c LEFT JOIN users u ON u.id = c.user_id WHERE c.id = :id LIMIT 1'
            );
            $info->execute(['id' => $id]);
            $row = $info->fetch() ?: [];
            $email = (string) ($row['owner_email'] ?? $row['leader_email'] ?? '');
            $name = (string) ($row['owner_name'] ?? $row['leader_name'] ?? '');

            AutomationEngine::fire($status === 'approved' ? 'community_approved' : 'community_rejected', [
                'email' => $email,
                'name' => $name,
                'nom' => $name,
                'solution' => (string) ($row['name'] ?? ''),
                'statut' => $labels[$status],
            ]);
        }

        Response::success(['id' => $id, 'status' => $status], 'Communaute ' . $labels[$status] . '.');
    }

    /** Mise a jour complete d'une communaute par l'admin (statut preserve). */
    public function update(Request $request): void
    {
        Auth::requireAdmin();
        $id = (int) $request->param('id');

        $db = Database::connection();
        $stmt = $db->prepare('SELECT id FROM communities WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetch()) {
            Response::error('Communaute introuvable.', 404);
        }

        Validator::make($request->all())->validate([
            'name' => 'required|min:2|max:160',
            'description' => 'required|min:20|max:2000',
            'country' => 'required|max:120',
            'city' => 'max:120',
            'tags' => 'array',
            'leaderName' => 'required|max:160',
            'leaderEmail' => 'required|email|max:160',
            'leaderPhone' => 'max:40',
            'shortDescription' => 'max:300',
            'publicEmail' => 'email|max:160',
        ])->abortIfFails();

        $cols = CommunityHelper::withSlug(CommunityHelper::columnsFromRequest($request), $db, $id);

        // L'admin peut aussi changer le statut directement depuis l'edition.
        $status = (string) $request->input('status', '');
        if (in_array($status, ['pending', 'approved', 'rejected'], true)) {
            $cols['status'] = $status;
        }

        $sets = [];
        foreach (array_keys($cols) as $field) {
            $sets[] = "$field = :$field";
        }
        $cols['id'] = $id;

        $sql = 'UPDATE communities SET ' . implode(', ', $sets) . ', updated_at = NOW() WHERE id = :id';
        $db->prepare($sql)->execute($cols);

        Response::success(['id' => $id], 'Communaute mise a jour.');
    }

    private function nullable($value): ?string
    {
        return ($value !== null && $value !== '') ? trim((string) $value) : null;
    }

    /** Suppression d'une communaute par l'admin (action sensible : super-admin). */
    public function destroy(Request $request): void
    {
        Auth::requireSuperAdmin();
        $id = (int) $request->param('id');
        Database::connection()->prepare('DELETE FROM communities WHERE id = :id')->execute(['id' => $id]);
        Response::success(null, 'Communaute supprimee.');
    }

    /** Creer un compte lead (par l'admin). */
    public function storeLead(Request $request): void
    {
        Auth::requireAdmin();

        Validator::make($request->all())->validate([
            'name' => 'required|min:2|max:120',
            'email' => 'required|email|max:160',
            'password' => 'required|min:6|max:72',
            'phone' => 'max:40',
        ])->abortIfFails();

        $db = Database::connection();
        $email = strtolower(trim((string) $request->input('email')));

        $check = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $check->execute(['email' => $email]);
        if ($check->fetch()) {
            Response::error('Un compte existe deja avec cet email.', 409);
        }

        $db->prepare(
            'INSERT INTO users (name, email, password_hash, phone, role, created_at)
             VALUES (:name, :email, :hash, :phone, :role, NOW())'
        )->execute([
            'name' => trim((string) $request->input('name')),
            'email' => $email,
            'hash' => password_hash((string) $request->input('password'), PASSWORD_BCRYPT),
            'phone' => $this->nullable($request->input('phone')),
            'role' => 'lead',
        ]);

        $id = (int) $db->lastInsertId();
        $stmt = $db->prepare(
            "SELECT u.id, u.name, u.email, u.phone, u.created_at,
                    COUNT(c.id) AS communities_count
             FROM users u
             LEFT JOIN communities c ON c.user_id = u.id
             WHERE u.id = :id
             GROUP BY u.id, u.name, u.email, u.phone, u.created_at"
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        Response::success([
            'lead' => [
                'id' => (int) $row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'phone' => $row['phone'],
                'createdAt' => $row['created_at'],
                'communitiesCount' => (int) $row['communities_count'],
            ],
        ], 'Lead cree avec succes.', 201);
    }

    /** Liste des leads inscrits avec le nombre de leurs communautes. */
    public function leads(Request $request): void
    {
        Auth::requireAdmin();
        $sql = "SELECT u.id, u.name, u.email, u.phone, u.created_at,
                       COUNT(c.id) AS communities_count
                FROM users u
                LEFT JOIN communities c ON c.user_id = u.id
                WHERE u.role = 'lead'
                GROUP BY u.id, u.name, u.email, u.phone, u.created_at
                ORDER BY u.created_at DESC";
        $rows = Database::connection()->query($sql)->fetchAll();

        $leads = array_map(static fn($r) => [
            'id' => (int) $r['id'],
            'name' => $r['name'],
            'email' => $r['email'],
            'phone' => $r['phone'],
            'createdAt' => $r['created_at'],
            'communitiesCount' => (int) $r['communities_count'],
        ], $rows);

        Response::success(['leads' => $leads]);
    }

    /** Fiche d'un lead avec ses communautes. */
    public function showLead(Request $request): void
    {
        Auth::requireAdmin();
        $id = (int) $request->param('id');
        $db = Database::connection();

        $stmt = $db->prepare(
            "SELECT id, name, email, phone, created_at, updated_at
             FROM users WHERE id = :id AND role = 'lead'"
        );
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Lead introuvable.', 404);
        }

        $stmt = $db->prepare(
            'SELECT c.*, u.name AS owner_name, u.email AS owner_email
             FROM communities c
             LEFT JOIN users u ON u.id = c.user_id
             WHERE c.user_id = :uid
             ORDER BY c.created_at DESC'
        );
        $stmt->execute(['uid' => $id]);
        $communities = array_map([$this, 'serializeForAdmin'], $stmt->fetchAll());

        Response::success([
            'lead' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'createdAt' => $user['created_at'],
                'updatedAt' => $user['updated_at'] ?? null,
                'communitiesCount' => count($communities),
            ],
            'communities' => $communities,
        ]);
    }

    /** Mettre a jour le profil d'un lead. */
    public function updateLead(Request $request): void
    {
        Auth::requireAdmin();
        Validator::make($request->all())->validate([
            'name' => 'required|max:120',
            'email' => 'required|email|max:160',
            'phone' => 'nullable|max:40',
        ])->abortIfFails();

        $id = (int) $request->param('id');
        $name = trim((string) $request->input('name'));
        $email = strtolower(trim((string) $request->input('email')));
        $phone = $this->nullable($request->input('phone'));

        $db = Database::connection();
        $stmt = $db->prepare("SELECT id, email FROM users WHERE id = :id AND role = 'lead'");
        $stmt->execute(['id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::error('Lead introuvable.', 404);
        }

        if ($email !== $existing['email']) {
            $check = $db->prepare('SELECT id FROM users WHERE email = :email AND id != :id');
            $check->execute(['email' => $email, 'id' => $id]);
            if ($check->fetch()) {
                Response::error('Cet email est deja utilise.', 422);
            }
        }

        $db->prepare(
            'UPDATE users SET name = :name, email = :email, phone = :phone WHERE id = :id'
        )->execute(['name' => $name, 'email' => $email, 'phone' => $phone, 'id' => $id]);

        Response::success(['id' => $id], 'Lead mis a jour.');
    }

    /** Liste des utilisateurs (filtrable par role). */
    public function users(Request $request): void
    {
        Auth::requireSuperAdmin();
        $role = (string) $request->query('role', '');

        $sql = "SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar_url, u.created_at,
                       (SELECT COUNT(*) FROM communities c WHERE c.user_id = u.id) AS communities_count
                FROM users u";
        $params = [];

        if (in_array($role, ['lead', 'admin', 'subadmin'], true)) {
            $sql .= ' WHERE u.role = :role';
            $params['role'] = $role;
        }

        $sql .= " ORDER BY FIELD(u.role, 'admin', 'subadmin', 'lead'), u.created_at DESC";

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        Response::success(['users' => array_map([$this, 'serializeUser'], $rows)]);
    }

    /** Creer un compte du staff : administrateur ou subadmin (super-admin uniquement). */
    public function storeAdmin(Request $request): void
    {
        Auth::requireSuperAdmin();

        Validator::make($request->all())->validate([
            'name' => 'required|min:2|max:120',
            'email' => 'required|email|max:160',
            'password' => 'required|min:6|max:72',
            'phone' => 'max:40',
            'role' => 'in:admin,subadmin',
        ])->abortIfFails();

        $role = (string) $request->input('role', 'admin');
        if (!in_array($role, ['admin', 'subadmin'], true)) {
            $role = 'admin';
        }

        $db = Database::connection();
        $email = strtolower(trim((string) $request->input('email')));

        $check = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $check->execute(['email' => $email]);
        if ($check->fetch()) {
            Response::error('Un compte existe deja avec cet email.', 409);
        }

        $db->prepare(
            'INSERT INTO users (name, email, password_hash, phone, role, created_at)
             VALUES (:name, :email, :hash, :phone, :role, NOW())'
        )->execute([
            'name' => trim((string) $request->input('name')),
            'email' => $email,
            'hash' => password_hash((string) $request->input('password'), PASSWORD_BCRYPT),
            'phone' => $this->nullable($request->input('phone')),
            'role' => $role,
        ]);

        $id = (int) $db->lastInsertId();
        $stmt = $db->prepare(
            'SELECT id, name, email, phone, role, avatar_url, created_at FROM users WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        $label = $role === 'subadmin' ? 'Sous-administrateur cree avec succes.' : 'Administrateur cree avec succes.';
        Response::success(['user' => $this->serializeUser($row)], $label, 201);
    }

    /** Mettre a jour un utilisateur (profil et/ou role). */
    public function updateUser(Request $request): void
    {
        $current = Auth::requireSuperAdmin();
        $id = (int) $request->param('id');

        Validator::make($request->all())->validate([
            'name' => 'required|max:120',
            'email' => 'required|email|max:160',
            'phone' => 'nullable|max:40',
            'role' => 'in:lead,admin,subadmin',
        ])->abortIfFails();

        $name = trim((string) $request->input('name'));
        $email = strtolower(trim((string) $request->input('email')));
        $phone = $this->nullable($request->input('phone'));
        $newRole = (string) $request->input('role');

        $db = Database::connection();
        $stmt = $db->prepare('SELECT id, email, role FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::error('Utilisateur introuvable.', 404);
        }

        if ($email !== $existing['email']) {
            $check = $db->prepare('SELECT id FROM users WHERE email = :email AND id != :id');
            $check->execute(['email' => $email, 'id' => $id]);
            if ($check->fetch()) {
                Response::error('Cet email est deja utilise.', 422);
            }
        }

        $oldRole = (string) $existing['role'];
        if ($newRole !== $oldRole) {
            self::assertRoleChangeAllowed($current, $id, $oldRole, $newRole, $db);
        }

        $db->prepare(
            'UPDATE users SET name = :name, email = :email, phone = :phone, role = :role, updated_at = NOW() WHERE id = :id'
        )->execute([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'role' => $newRole,
            'id' => $id,
        ]);

        $stmt = $db->prepare(
            'SELECT id, name, email, phone, role, avatar_url, created_at FROM users WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        Response::success(['user' => $this->serializeUser($row)], 'Utilisateur mis a jour.');
    }

    /** Fiche detaillee d'un utilisateur (admin ou lead). */
    public function showUser(Request $request): void
    {
        Auth::requireSuperAdmin();
        $id = (int) $request->param('id');
        $db = Database::connection();

        $stmt = $db->prepare(
            "SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar_url, u.created_at, u.updated_at,
                    (SELECT COUNT(*) FROM communities c WHERE c.user_id = u.id) AS communities_count
             FROM users u WHERE u.id = :id LIMIT 1"
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::error('Utilisateur introuvable.', 404);
        }

        $communities = [];
        if (($row['role'] ?? '') === 'lead') {
            $cStmt = $db->prepare(
                'SELECT c.*, u.name AS owner_name, u.email AS owner_email
                 FROM communities c
                 LEFT JOIN users u ON u.id = c.user_id
                 WHERE c.user_id = :uid
                 ORDER BY c.created_at DESC'
            );
            $cStmt->execute(['uid' => $id]);
            $communities = array_map([$this, 'serializeForAdmin'], $cStmt->fetchAll());
        }

        $user = $this->serializeUser($row);
        $user['updatedAt'] = $row['updated_at'] ?? null;

        Response::success(['user' => $user, 'communities' => $communities]);
    }

    /** Suppression definitive d'un utilisateur. */
    public function destroyUser(Request $request): void
    {
        $current = Auth::requireSuperAdmin();
        $id = (int) $request->param('id');
        $db = Database::connection();

        if ((int) $current['id'] === $id) {
            Response::error('Vous ne pouvez pas supprimer votre propre compte.', 422);
        }

        $stmt = $db->prepare('SELECT id, role, name FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::error('Utilisateur introuvable.', 404);
        }

        if (($existing['role'] ?? '') === 'admin') {
            $count = (int) $db->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
            if ($count <= 1) {
                Response::error('Impossible de supprimer le dernier administrateur.', 422);
            }
        }

        $countStmt = $db->prepare('SELECT COUNT(*) FROM communities WHERE user_id = :id');
        $countStmt->execute(['id' => $id]);
        $ownedCommunities = (int) $countStmt->fetchColumn();

        if ($ownedCommunities > 0) {
            $label = $ownedCommunities === 1 ? 'communauté' : 'communautés';
            Response::error(
                "Impossible de supprimer cet utilisateur : il est responsable de {$ownedCommunities} {$label}. "
                . 'Supprimez d\'abord ces communautés ou réassignez le rôle de responsable à un co-lead.',
                422
            );
        }

        try {
            $del = $db->prepare('DELETE FROM users WHERE id = :id');
            $del->execute(['id' => $id]);
            if ($del->rowCount() === 0) {
                Response::error('Suppression impossible : utilisateur introuvable.', 404);
            }
        } catch (\PDOException $e) {
            Response::error('Suppression impossible : des donnees liees bloquent la suppression.', 422);
        }

        Response::success(null, 'Utilisateur supprime definitivement.');
    }

    private static function assertRoleChangeAllowed(array $current, int $targetId, string $oldRole, string $newRole, \PDO $db): void
    {
        // Perte d'un super-administrateur (admin -> lead ou admin -> subadmin).
        if ($oldRole === 'admin' && $newRole !== 'admin') {
            if ((int) $current['id'] === $targetId) {
                Response::error('Vous ne pouvez pas retirer vos propres droits administrateur.', 422);
            }
            $count = (int) $db->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
            if ($count <= 1) {
                Response::error('Impossible de retirer le dernier administrateur.', 422);
            }
        }
    }

    private function serializeUser(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'phone' => $row['phone'] ?? null,
            'role' => $row['role'],
            'avatarUrl' => $row['avatar_url'] ?? null,
            'createdAt' => $row['created_at'],
            'communitiesCount' => (int) ($row['communities_count'] ?? 0),
        ];
    }

    /** Messages de contact recus. */
    public function messages(Request $request): void
    {
        Auth::requireAdmin();
        $rows = Database::connection()
            ->query('SELECT * FROM contact_messages ORDER BY created_at DESC')
            ->fetchAll();

        $messages = array_map(static fn($r) => [
            'id' => (int) $r['id'],
            'name' => $r['name'],
            'email' => $r['email'],
            'subject' => $r['subject'],
            'message' => $r['message'],
            'isRead' => (bool) $r['is_read'],
            'createdAt' => $r['created_at'],
        ], $rows);

        Response::success(['messages' => $messages]);
    }

    public function markMessageRead(Request $request): void
    {
        Auth::requireAdmin();
        $id = (int) $request->param('id');
        Database::connection()->prepare('UPDATE contact_messages SET is_read = 1 WHERE id = :id')
            ->execute(['id' => $id]);
        Response::success(null, 'Message marque comme lu.');
    }

    private function serializeForAdmin(array $row): array
    {
        return CommunityHelper::serializeForAdmin($row);
    }
}
