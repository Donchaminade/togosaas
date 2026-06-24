<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Auth;
use TCH\AutomationEngine;
use TCH\Database;
use TCH\RateLimiter;
use TCH\ReportEvidenceHelper;
use TCH\ReportHelper;
use TCH\Request;
use TCH\Response;
use TCH\Security;
use TCH\Validator;

final class ReportController
{
    /** Televersement anonyme de preuves (stockage prive). */
    public function uploadEvidence(Request $request): void
    {
        RateLimiter::enforce('report-evidence', 30, 1800); // 30 fichiers / 30 min / IP

        if (empty($_FILES['file'])) {
            Response::error('Aucun fichier envoye.', 422);
        }

        $meta = ReportEvidenceHelper::store($_FILES['file']);
        Response::success(['evidence' => $meta], 'Fichier enregistre.', 201);
    }

    /** Deposer un signalement anonyme. */
    public function store(Request $request): void
    {
        RateLimiter::enforce('report', 5, 1800); // 5 signalements / 30 min / IP

        Validator::make($request->all())->validate([
            'communityId' => 'required|integer',
            'targetType' => 'required|in:community,lead',
            'category' => 'required|in:' . implode(',', array_keys(ReportHelper::CATEGORIES)),
            'description' => 'required|min:30|max:5000',
            'evidence' => 'array',
        ])->abortIfFails();

        $communityId = (int) $request->input('communityId');
        $db = Database::connection();

        $stmt = $db->prepare("SELECT id, name, status FROM communities WHERE id = :id");
        $stmt->execute(['id' => $communityId]);
        $community = $stmt->fetch();

        if (!$community || $community['status'] !== 'approved') {
            Response::error('Solution introuvable ou non eligible au signalement.', 404);
        }

        $evidenceInput = $request->input('evidence', []);
        if (!is_array($evidenceInput)) {
            $evidenceInput = [];
        }
        $evidence = ReportEvidenceHelper::validateKeys($evidenceInput);

        $trackingCode = $this->uniqueTrackingCode($db);

        $db->prepare(
            'INSERT INTO community_reports
             (community_id, target_type, category, description, evidence, tracking_code, status, created_at)
             VALUES (:cid, :target, :category, :description, :evidence, :code, \'pending\', NOW())'
        )->execute([
            'cid' => $communityId,
            'target' => (string) $request->input('targetType'),
            'category' => (string) $request->input('category'),
            'description' => trim((string) $request->input('description')),
            'evidence' => json_encode($evidence, JSON_UNESCAPED_UNICODE),
            'code' => $trackingCode,
        ]);

        Response::success([
            'trackingCode' => $trackingCode,
            'message' => 'Votre signalement a ete recu. Conservez votre code de suivi.',
        ], 'Signalement enregistre. Merci pour votre vigilance.', 201);
    }

    /** Suivi anonyme via code (aucune donnee personnelle). */
    public function track(Request $request): void
    {
        $code = strtoupper(trim((string) $request->param('code')));
        if ($code === '') {
            Response::error('Code invalide.', 422);
        }

        $stmt = Database::connection()->prepare(
            'SELECT tracking_code, status, created_at, reviewed_at FROM community_reports WHERE tracking_code = :code LIMIT 1'
        );
        $stmt->execute(['code' => $code]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::error('Aucun signalement trouve pour ce code.', 404);
        }

        Response::success(['report' => ReportHelper::serializePublicTrack($row)]);
    }

    /** Liste admin. */
    public function adminIndex(Request $request): void
    {
        Auth::requireAdmin();
        $db = Database::connection();

        $status = (string) $request->query('status', '');
        $sql = 'SELECT r.*, c.name AS community_name, c.leader_name, u.id AS owner_id, u.name AS owner_name, u.email AS owner_email
                FROM community_reports r
                INNER JOIN communities c ON c.id = r.community_id
                LEFT JOIN users u ON u.id = c.user_id';
        $params = [];

        if (in_array($status, ['pending', 'investigating', 'resolved', 'dismissed'], true)) {
            $sql .= ' WHERE r.status = :status';
            $params['status'] = $status;
        }
        $sql .= ' ORDER BY r.created_at DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $reports = array_map(
            static fn($r) => ReportHelper::serialize($r, true),
            $stmt->fetchAll()
        );

        Response::success(['reports' => $reports]);
    }

    /** Detail admin. */
    public function adminShow(Request $request): void
    {
        Auth::requireAdmin();
        $row = $this->findAdminRow((int) $request->param('id'));
        if (!$row) {
            Response::error('Signalement introuvable.', 404);
        }
        Response::success(['report' => ReportHelper::serialize($row, true)]);
    }

    /** Mise a jour admin (enquete, notes, action). */
    public function adminUpdate(Request $request): void
    {
        Auth::requireAdmin();
        $id = (int) $request->param('id');

        Validator::make($request->all())->validate([
            'status' => 'in:pending,investigating,resolved,dismissed',
            'adminNotes' => 'max:5000',
            'adminAction' => 'max:2000',
        ])->abortIfFails();

        $row = $this->findAdminRow($id);
        if (!$row) {
            Response::error('Signalement introuvable.', 404);
        }

        $status = (string) $request->input('status', $row['status']);
        $adminNotes = $request->input('adminNotes');
        $adminAction = $request->input('adminAction');

        $reviewedAt = in_array($status, ['resolved', 'dismissed'], true) ? date('Y-m-d H:i:s') : null;

        Database::connection()->prepare(
            'UPDATE community_reports SET
                status = :status,
                admin_notes = :notes,
                admin_action = :action,
                reviewed_at = COALESCE(:reviewed, reviewed_at),
                updated_at = NOW()
             WHERE id = :id'
        )->execute([
            'status' => $status,
            'notes' => $adminNotes !== null && $adminNotes !== '' ? trim((string) $adminNotes) : $row['admin_notes'],
            'action' => $adminAction !== null && $adminAction !== '' ? trim((string) $adminAction) : $row['admin_action'],
            'reviewed' => $reviewedAt,
            'id' => $id,
        ]);

        $updated = $this->findAdminRow($id);

        if ($status !== ($row['status'] ?? '') && $updated) {
            $statusLabels = [
                'pending' => 'en attente',
                'investigating' => 'en cours d\'analyse',
                'resolved' => 'traite',
                'dismissed' => 'classe',
            ];
            $email = (string) ($updated['owner_email'] ?? '');
            $name = (string) ($updated['owner_name'] ?? $updated['leader_name'] ?? '');

            AutomationEngine::fire('report_status_changed', [
                'email' => $email,
                'name' => $name,
                'nom' => $name,
                'solution' => (string) ($updated['community_name'] ?? ''),
                'statut' => $statusLabels[$status] ?? $status,
                'code' => (string) ($updated['tracking_code'] ?? ''),
            ]);
        }

        Response::success(['report' => ReportHelper::serialize($updated, true)], 'Signalement mis a jour.');
    }

    /** Suppression definitive d'un signalement. */
    public function adminDestroy(Request $request): void
    {
        Auth::requireSuperAdmin();
        $id = (int) $request->param('id');

        $row = $this->findAdminRow($id);
        if (!$row) {
            Response::error('Signalement introuvable.', 404);
        }

        $evidence = json_decode($row['evidence'] ?? '[]', true) ?: [];
        if (is_array($evidence)) {
            ReportEvidenceHelper::deleteEvidenceList($evidence);
        }

        Database::connection()->prepare('DELETE FROM community_reports WHERE id = :id')->execute(['id' => $id]);

        Response::success(null, 'Signalement supprime definitivement.');
    }

    /** Telecharger / afficher une preuve (admin uniquement). */
    public function adminEvidence(Request $request): void
    {
        Auth::requireAdmin();
        $id = (int) $request->param('id');
        $index = (int) $request->param('index');

        $row = $this->findAdminRow($id);
        if (!$row) {
            Response::error('Signalement introuvable.', 404);
        }

        $evidence = json_decode($row['evidence'] ?? '[]', true) ?: [];
        if (!isset($evidence[$index])) {
            Response::error('Preuve introuvable.', 404);
        }

        $item = $evidence[$index];
        $path = ReportEvidenceHelper::resolvePath((string) ($item['key'] ?? ''));
        if (!$path) {
            Response::error('Fichier introuvable.', 404);
        }

        $mime = ReportEvidenceHelper::mimeForPath($path) ?? 'application/octet-stream';
        $name = basename((string) ($item['originalName'] ?? 'preuve'));
        $name = preg_replace('/[^\w.\-() ]+/u', '_', $name) ?: 'preuve';

        Security::applyHeaders();
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . (string) filesize($path));
        header('Content-Disposition: inline; filename="' . rawurlencode($name) . '"');
        header('Cache-Control: private, no-store');
        readfile($path);
        exit;
    }

    public function categories(Request $request): void
    {
        $list = [];
        foreach (ReportHelper::CATEGORIES as $id => $label) {
            $list[] = ['id' => $id, 'label' => $label];
        }
        Response::success(['categories' => $list]);
    }

    private function findAdminRow(int $id): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT r.*, c.name AS community_name, c.leader_name, u.id AS owner_id, u.name AS owner_name, u.email AS owner_email
             FROM community_reports r
             INNER JOIN communities c ON c.id = r.community_id
             LEFT JOIN users u ON u.id = c.user_id
             WHERE r.id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private function uniqueTrackingCode(\PDO $db): string
    {
        for ($i = 0; $i < 8; $i++) {
            $code = ReportHelper::generateTrackingCode();
            $check = $db->prepare('SELECT id FROM community_reports WHERE tracking_code = :code LIMIT 1');
            $check->execute(['code' => $code]);
            if (!$check->fetch()) {
                return $code;
            }
        }
        Response::error('Impossible de generer un code de suivi.', 500);
    }
}
