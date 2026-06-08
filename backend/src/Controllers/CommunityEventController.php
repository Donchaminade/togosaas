<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Database;
use TCH\EventHelper;
use TCH\Request;
use TCH\Response;
use TCH\Validator;

final class CommunityEventController
{
    /** Liste publique des evenements d'une communaute approuvee. */
    public function indexPublic(Request $request): void
    {
        $community = $this->findApprovedCommunity((string) $request->param('id'));
        if (!$community) {
            Response::error('Communaute introuvable.', 404);
        }

        $communityId = (int) $community['id'];
        $upcomingOnly = $request->query('upcoming', '0') === '1';
        Response::success([
            'events' => EventHelper::listForCommunity($communityId, $upcomingOnly),
        ]);
    }

    /** Detail public d'un evenement. */
    public function showPublic(Request $request): void
    {
        $community = $this->findApprovedCommunity((string) $request->param('id'));
        if (!$community) {
            Response::error('Communaute introuvable.', 404);
        }

        $communityId = (int) $community['id'];
        $eventId = (int) $request->param('eventId');
        $event = $this->findOwnedEvent($communityId, $eventId);
        if (!$event) {
            Response::error('Evenement introuvable.', 404);
        }

        $serialized = EventHelper::serialize($event);
        $serialized['communityName'] = $community['name'];
        $serialized['communitySlug'] = $community['slug'] ?? null;
        $serialized['organizerName'] = $community['leader_name'] ?? $community['name'];

        Response::success(['event' => $serialized]);
    }

    /** Liste complete pour le lead proprietaire. */
    public function indexLead(Request $request): void
    {
        $communityId = (int) $request->param('id');
        EventHelper::requireCommunityOwner($communityId);

        Response::success([
            'events' => EventHelper::listForCommunity($communityId, false),
        ]);
    }

    public function store(Request $request): void
    {
        $communityId = (int) $request->param('id');
        EventHelper::requireCommunityOwner($communityId);
        $this->validatePayload($request);

        $cols = EventHelper::columnsFromRequest($request);
        $cols['community_id'] = $communityId;

        $db = Database::connection();
        $fields = array_keys($cols);
        $placeholders = array_map(fn($f) => ':' . $f, $fields);
        $sql = 'INSERT INTO community_events (' . implode(',', $fields) . ', created_at, updated_at)
                VALUES (' . implode(',', $placeholders) . ', NOW(), NOW())';
        $db->prepare($sql)->execute($cols);

        $row = EventHelper::find((int) $db->lastInsertId());
        Response::success(['event' => EventHelper::serialize($row)], 'Evenement cree.', 201);
    }

    public function update(Request $request): void
    {
        $communityId = (int) $request->param('id');
        $eventId = (int) $request->param('eventId');
        EventHelper::requireCommunityOwner($communityId);
        $this->validatePayload($request);

        $existing = $this->findOwnedEvent($communityId, $eventId);
        if (!$existing) {
            Response::error('Evenement introuvable.', 404);
        }

        $cols = EventHelper::columnsFromRequest($request);
        $sets = array_map(fn($f) => "{$f} = :{$f}", array_keys($cols));
        $cols['id'] = $eventId;

        Database::connection()->prepare(
            'UPDATE community_events SET ' . implode(', ', $sets) . ', updated_at = NOW() WHERE id = :id'
        )->execute($cols);

        $row = EventHelper::find($eventId);
        Response::success(['event' => EventHelper::serialize($row)], 'Evenement mis a jour.');
    }

    public function destroy(Request $request): void
    {
        $communityId = (int) $request->param('id');
        $eventId = (int) $request->param('eventId');
        EventHelper::requireCommunityOwner($communityId);

        if (!$this->findOwnedEvent($communityId, $eventId)) {
            Response::error('Evenement introuvable.', 404);
        }

        Database::connection()->prepare('DELETE FROM community_events WHERE id = :id')
            ->execute(['id' => $eventId]);

        Response::success(null, 'Evenement supprime.');
    }

    private function validatePayload(Request $request): void
    {
        Validator::make($request->all())->validate([
            'title' => 'required|max:200',
            'description' => 'max:2000',
            'startsAt' => 'required',
            'location' => 'max:255',
            'eventUrl' => 'max:500',
            'posterUrl' => 'max:500',
        ])->abortIfFails();
    }

    private function findApprovedCommunity(string $identifier): ?array
    {
        $identifier = trim($identifier);
        if ($identifier === '') {
            return null;
        }

        $db = Database::connection();
        if (ctype_digit($identifier)) {
            $stmt = $db->prepare(
                "SELECT id, name, slug, leader_name FROM communities WHERE id = :id AND status = 'approved' LIMIT 1"
            );
            $stmt->execute(['id' => (int) $identifier]);
        } else {
            $stmt = $db->prepare(
                "SELECT id, name, slug, leader_name FROM communities WHERE slug = :slug AND status = 'approved' LIMIT 1"
            );
            $stmt->execute(['slug' => $identifier]);
        }

        return $stmt->fetch() ?: null;
    }

    private function findOwnedEvent(int $communityId, int $eventId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM community_events WHERE id = :eid AND community_id = :cid LIMIT 1'
        );
        $stmt->execute(['eid' => $eventId, 'cid' => $communityId]);
        return $stmt->fetch() ?: null;
    }
}
