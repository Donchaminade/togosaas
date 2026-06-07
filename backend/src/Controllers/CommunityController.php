<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Auth;
use TCH\CommunityAccessHelper;
use TCH\CommunityHelper;
use TCH\Database;
use TCH\EventHelper;
use TCH\Request;
use TCH\Response;
use TCH\Validator;

final class CommunityController
{
    /** Liste publique des communautes approuvees. */
    public function index(Request $request): void
    {
        $db = Database::connection();
        $where = ["status = 'approved'"];
        $params = [];

        if ($q = trim((string) $request->query('q', ''))) {
            $where[] = '(name LIKE :q OR description LIKE :q OR tags LIKE :q OR city LIKE :q OR country LIKE :q)';
            $params['q'] = '%' . $q . '%';
        }
        if ($country = trim((string) $request->query('country', ''))) {
            $where[] = 'country = :country';
            $params['country'] = $country;
        }
        if ($tag = trim((string) $request->query('tag', ''))) {
            $where[] = 'tags LIKE :tag';
            $params['tag'] = '%"' . $tag . '"%';
        }

        $sql = 'SELECT * FROM communities WHERE ' . implode(' AND ', $where) . ' ORDER BY created_at DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $rows = array_map(fn($r) => CommunityHelper::serialize($r, 'list'), $stmt->fetchAll());
        Response::success(['communities' => $rows]);
    }

    /** Detail public complet d'une communaute approuvee. */
    public function show(Request $request): void
    {
        $row = $this->findByIdentifier((string) $request->param('id'));

        if (!$row) {
            Response::error('Communaute introuvable.', 404);
        }

        $id = (int) $row['id'];
        $user = Auth::user();
        $membership = $user
            ? CommunityAccessHelper::getMembershipRole($id, (int) $user['id'], ($user['role'] ?? '') === 'admin')
            : null;
        $canView = $row['status'] === 'approved' || $membership !== null;

        if (!$canView) {
            Response::error('Communaute introuvable.', 404);
        }

        if ($membership === 'admin') {
            $community = CommunityHelper::serializeForAdmin($row);
            $community['events'] = EventHelper::listForCommunity($id, false);
            Response::success(['community' => $community]);
            return;
        }

        if ($membership !== null) {
            $row['membership_role'] = $membership;
        }

        $mode = $membership !== null ? 'private' : 'detail';
        $community = CommunityHelper::serialize($row, $mode);
        $community['events'] = EventHelper::listForCommunity($id, false);
        Response::success(['community' => $community]);
    }

    public function mine(Request $request): void
    {
        $user = Auth::requireUser();
        $uid = (int) $user['id'];

        $stmt = Database::connection()->prepare(
            'SELECT c.*, \'owner\' AS membership_role FROM communities c WHERE c.user_id = :uid
             UNION
             SELECT c.*, cm.role AS membership_role FROM communities c
             INNER JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = :uid2
             WHERE c.user_id != :uid3
             ORDER BY created_at DESC'
        );
        $stmt->execute(['uid' => $uid, 'uid2' => $uid, 'uid3' => $uid]);

        $rows = array_map(fn($r) => CommunityHelper::serialize($r, 'private'), $stmt->fetchAll());
        Response::success(['communities' => $rows]);
    }

    public function showMine(Request $request): void
    {
        $id = (int) $request->param('id');
        $access = CommunityAccessHelper::requireMember($id);
        $row = $access['community'];
        $row['membership_role'] = $access['role'] === 'admin' ? 'owner' : $access['role'];

        Response::success(['community' => CommunityHelper::serialize($row, 'private')]);
    }

    public function store(Request $request): void
    {
        $user = Auth::requireUser();
        $this->validatePayload($request, true);

        $db = Database::connection();
        $cols = CommunityHelper::withSlug(CommunityHelper::columnsFromRequest($request), $db);
        $cols['user_id'] = (int) $user['id'];
        $cols['status'] = 'pending';

        $fields = array_keys($cols);
        $placeholders = array_map(fn($f) => ':' . $f, $fields);
        $sql = 'INSERT INTO communities (' . implode(',', $fields) . ', created_at, updated_at) VALUES ('
            . implode(',', $placeholders) . ', NOW(), NOW())';

        $db->prepare($sql)->execute($cols);

        $newId = (int) $db->lastInsertId();
        $coLeads = json_decode($cols['co_leads'] ?? '[]', true) ?: [];
        CommunityAccessHelper::syncCoLeadMembers($newId, $coLeads);

        $row = $this->find($newId);
        $row['membership_role'] = 'owner';
        Response::success(
            ['community' => CommunityHelper::serialize($row, 'private')],
            'Communaute soumise. Elle sera visible apres validation par un administrateur.',
            201
        );
    }

    public function update(Request $request): void
    {
        $id = (int) $request->param('id');
        $access = CommunityAccessHelper::requireMember($id);
        $role = $access['role'];

        $this->validatePayload($request, $role === 'owner' || $role === 'admin');

        $cols = CommunityHelper::columnsFromRequest($request);

        if ($role === 'co_lead') {
            $cols = CommunityAccessHelper::filterColumnsForCoLead($cols);
        } else {
            $cols = CommunityHelper::withSlug($cols, Database::connection(), $id);
            $cols['status'] = 'pending';
            $coLeads = json_decode($cols['co_leads'] ?? '[]', true) ?: [];
            CommunityAccessHelper::syncCoLeadMembers($id, $coLeads);
        }

        if ($cols === []) {
            Response::error('Aucune modification autorisee.', 422);
        }

        $sets = [];
        foreach (array_keys($cols) as $field) {
            $sets[] = "$field = :$field";
        }
        $cols['id'] = $id;

        Database::connection()->prepare(
            'UPDATE communities SET ' . implode(', ', $sets) . ', updated_at = NOW() WHERE id = :id'
        )->execute($cols);

        $row = $this->find($id);
        $row['membership_role'] = $role === 'admin' ? 'owner' : $role;

        $message = $role === 'co_lead'
            ? 'Modifications enregistrees.'
            : 'Communaute mise a jour. Elle sera de nouveau verifiee par un administrateur.';

        Response::success(
            ['community' => CommunityHelper::serialize($row, 'private')],
            $message
        );
    }

    public function destroy(Request $request): void
    {
        CommunityAccessHelper::requireMember((int) $request->param('id'), true);

        $id = (int) $request->param('id');
        Database::connection()->prepare('DELETE FROM communities WHERE id = :id')->execute(['id' => $id]);
        Response::success(null, 'Communaute supprimee.');
    }

    public function countries(Request $request): void
    {
        Response::success(['countries' => self::COUNTRIES]);
    }

    /** @deprecated Utiliser /meta/countries */
    public function neighborhoods(Request $request): void
    {
        $this->countries($request);
    }

    public function tags(Request $request): void
    {
        Response::success(['tags' => self::TAGS]);
    }

    private function find(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM communities WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    private function findByIdentifier(string $identifier): ?array
    {
        $identifier = trim($identifier);
        if ($identifier === '') {
            return null;
        }

        if (ctype_digit($identifier)) {
            return $this->find((int) $identifier);
        }

        $stmt = Database::connection()->prepare(
            'SELECT * FROM communities WHERE slug = :slug LIMIT 1'
        );
        $stmt->execute(['slug' => $identifier]);

        return $stmt->fetch() ?: null;
    }

    private function validatePayload(Request $request, bool $full = true): void
    {
        $rules = [
            'description' => 'required|min:20|max:2000',
            'tags' => 'array',
            'shortDescription' => 'max:300',
            'publicEmail' => 'email|max:160',
        ];

        if ($full) {
            $rules = array_merge($rules, [
                'name' => 'required|min:2|max:160',
                'country' => 'required|max:120',
                'city' => 'max:120',
                'leaderName' => 'required|max:160',
                'leaderEmail' => 'required|email|max:160',
                'leaderPhone' => 'max:40',
            ]);
        }

        Validator::make($request->all())->validate($rules)->abortIfFails();
    }

    public const COUNTRIES = [
        ['code' => 'TG', 'name' => 'Togo'],
        ['code' => 'BJ', 'name' => 'Bénin'],
        ['code' => 'BF', 'name' => 'Burkina Faso'],
        ['code' => 'CI', 'name' => 'Côte d\'Ivoire'],
        ['code' => 'GH', 'name' => 'Ghana'],
        ['code' => 'GN', 'name' => 'Guinée'],
        ['code' => 'ML', 'name' => 'Mali'],
        ['code' => 'NE', 'name' => 'Niger'],
        ['code' => 'SN', 'name' => 'Sénégal'],
        ['code' => 'CM', 'name' => 'Cameroun'],
        ['code' => 'FR', 'name' => 'France'],
        ['code' => 'BE', 'name' => 'Belgique'],
        ['code' => 'CA', 'name' => 'Canada'],
        ['code' => 'US', 'name' => 'États-Unis'],
    ];

    public const TAGS = [
        'Google Tech', 'Web', 'Mobile', 'Cloud', 'AI / ML', 'Inclusion', 'Mentorat',
        'UX / UI', 'Design', 'Figma', 'Sécurité', 'Ethical Hacking', 'Réseaux',
        'Data Science', 'Python', 'React', 'NodeJS', 'Flutter', 'Open Source',
    ];
}
