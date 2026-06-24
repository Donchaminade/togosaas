<?php

declare(strict_types=1);

/**
 * Worker des automatisations planifiees.
 *
 * A executer periodiquement via cron (ex. toutes les 5 minutes) :
 *   * /5 * * * * php /chemin/vers/backend/database/automations-worker.php >> /chemin/logs/automations.log 2>&1
 *
 * Il traite :
 *   - les automatisations planifiees dont l'echeance est atteinte ;
 *   - toute entree en attente dans la file (filet de securite).
 *
 * Reserve a l'execution en ligne de commande (CLI) pour des raisons de securite.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Ce script ne peut etre execute qu'en ligne de commande.\n");
}

require_once dirname(__DIR__) . '/src/bootstrap.php';

use TCH\AutomationEngine;

$startedAt = date('Y-m-d H:i:s');

try {
    $summary = AutomationEngine::runDueScheduled();
    // Filet de securite : traite d'eventuelles entrees encore en attente.
    $pending = AutomationEngine::processPending(500, 50);

    printf(
        "[%s] Automatisations: %d declenchees, %d en file | Envois: %d ok, %d echec (+ %d ok / %d echec en file)\n",
        $startedAt,
        $summary['automations'],
        $summary['queued'],
        $summary['sent'],
        $summary['failed'],
        $pending['sent'],
        $pending['failed']
    );
} catch (\Throwable $e) {
    fwrite(STDERR, '[' . $startedAt . '] ERREUR worker automatisations : ' . $e->getMessage() . "\n");
    exit(1);
}
