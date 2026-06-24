<?php

declare(strict_types=1);

/**
 * Seeder du module d'automatisation : insere/met a jour des MODELES de message
 * a l'identite de marque Togosaas, et cree des AUTOMATISATIONS pretes a activer
 * (desactivees par defaut).
 *
 *   php database/seed-automations.php
 *
 * Idempotence :
 *   - MODELES (message_templates) : UPSERT par `name`. Si le modele existe deja,
 *     son subject / body_html / description sont MIS A JOUR (pour propager le
 *     nouveau design). Sinon il est cree.
 *   - AUTOMATISATIONS (automations) : CREATE-ONLY par `name`. Si elle existe
 *     deja, elle n'est ni recreee ni reactivee (on respecte le choix is_active
 *     de l'admin).
 *
 * Reserve a l'execution en ligne de commande (CLI) pour des raisons de securite.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Ce script ne peut etre execute qu'en ligne de commande.\n");
}

require_once dirname(__DIR__) . '/src/bootstrap.php';

use TCH\Database;

$pdo = Database::connection();

echo "==> TogoSaaS : seed des automatisations d'emails (design de marque)\n";

/* ------------------------------------------------------------------ */
/* Constantes de marque                                              */
/* ------------------------------------------------------------------ */

const BRAND_NAME = 'Togosaas';
const BRAND_BASELINE = 'Hub SaaS du Togo';
const BRAND_TAGLINE = 'Togosaas recense, valorise et connecte les solutions SaaS du Togo — gratuites et payantes, made in Togo.';
const BRAND_SITE_URL = 'https://togosaas.vercel.app';
const BRAND_EMAIL = 'chaminade.dondah.adjolou@gmail.com';
const BRAND_PHONE = '+22899181626';
const BRAND_LOCATION = 'Lomé, Togo';

// Couleurs du drapeau togolais.
const COLOR_GREEN = '#006A4E';
const COLOR_YELLOW = '#FFCE00';
const COLOR_RED = '#D21034';

/* ------------------------------------------------------------------ */
/* Helpers de rendu HTML email (tables + CSS inline, max 600px)       */
/* ------------------------------------------------------------------ */

/**
 * Bande decorative aux couleurs du drapeau togolais (3 segments).
 */
$flagBand = static function (): string {
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">'
        . '<tr style="height:6px;line-height:6px;font-size:0;">'
        . '<td width="33%" style="background-color:' . COLOR_GREEN . ';">&nbsp;</td>'
        . '<td width="34%" style="background-color:' . COLOR_YELLOW . ';">&nbsp;</td>'
        . '<td width="33%" style="background-color:' . COLOR_RED . ';">&nbsp;</td>'
        . '</tr></table>';
};

/**
 * Bouton d'action arrondi (CTA), compatible clients mail.
 */
$ctaButton = static function (string $label, string $url): string {
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;">'
        . '<tr><td align="center" bgcolor="' . COLOR_GREEN . '" style="border-radius:8px;">'
        . '<a href="' . $url . '" target="_blank" '
        . 'style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;'
        . 'font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">'
        . $label . '</a>'
        . '</td></tr></table>';
};

/**
 * Enveloppe le contenu d'un email dans l'habillage de marque complet :
 * fond gris clair, carte blanche, bandes drapeau haut/bas, en-tete logo + nom +
 * tagline, salutation, corps, CTA et pied de page contacts.
 */
$renderEmail = static function (string $bodyInner, string $ctaLabel, string $ctaUrl) use ($flagBand, $ctaButton): string {
    $flag = $flagBand();
    $cta = $ctaButton($ctaLabel, $ctaUrl);

    return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Togosaas</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;">

          <!-- Bande drapeau haut -->
          <tr><td style="padding:0;">$flag</td></tr>

          <!-- En-tete : logo + nom + tagline -->
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
$bodyInner
              <div style="text-align:center;margin:26px 0 6px;">
$cta
              </div>
            </td>
          </tr>

          <!-- Bande drapeau bas -->
          <tr><td style="padding:0;">$flag</td></tr>

          <!-- Pied de page : contacts -->
          <tr>
            <td style="padding:22px 32px 26px;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:#94a3b8;text-align:center;">
              <div style="margin-bottom:6px;">
                <a href="mailto:chaminade.dondah.adjolou@gmail.com" style="color:#006A4E;text-decoration:none;">chaminade.dondah.adjolou@gmail.com</a>
                &nbsp;·&nbsp;
                <a href="tel:+22899181626" style="color:#006A4E;text-decoration:none;">+228 99 18 16 26</a>
                &nbsp;·&nbsp;
                <span>Lomé, Togo</span>
              </div>
              <div style="margin-bottom:8px;">
                <a href="https://togosaas.vercel.app" target="_blank" style="color:#006A4E;text-decoration:none;font-weight:bold;">togosaas.vercel.app</a>
              </div>
              <div style="color:#cbd5e1;">© Togosaas — Hub SaaS du Togo</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
};

/**
 * UPSERT d'un modele par `name` : cree s'il n'existe pas, sinon met a jour
 * subject / body_html / description.
 *
 * @return array{0:int,1:string} [id, action] action ∈ {created, updated}
 */
$upsertTemplate = static function (PDO $pdo, string $name, string $subject, string $bodyHtml, string $description): array {
    $stmt = $pdo->prepare('SELECT id FROM message_templates WHERE name = :name LIMIT 1');
    $stmt->execute(['name' => $name]);
    $id = $stmt->fetchColumn();

    if ($id !== false) {
        $update = $pdo->prepare(
            'UPDATE message_templates
                SET subject = :subject, body_html = :body_html, description = :description, updated_at = NOW()
              WHERE id = :id'
        );
        $update->execute([
            'subject' => $subject,
            'body_html' => $bodyHtml,
            'description' => $description,
            'id' => (int) $id,
        ]);

        return [(int) $id, 'updated'];
    }

    $insert = $pdo->prepare(
        'INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
         VALUES (:name, :subject, :body_html, :description, NOW(), NOW())'
    );
    $insert->execute([
        'name' => $name,
        'subject' => $subject,
        'body_html' => $bodyHtml,
        'description' => $description,
    ]);

    return [(int) $pdo->lastInsertId(), 'created'];
};

/**
 * CREATE-ONLY d'une automatisation par `name` : creee desactivee si absente,
 * sinon laissee telle quelle (on respecte is_active choisi par l'admin).
 *
 * @return array{0:int,1:bool} [id, created]
 */
$ensureAutomation = static function (PDO $pdo, string $name, string $trigger, int $templateId): array {
    $stmt = $pdo->prepare('SELECT id FROM automations WHERE name = :name LIMIT 1');
    $stmt->execute(['name' => $name]);
    $id = $stmt->fetchColumn();

    if ($id !== false) {
        return [(int) $id, false];
    }

    $insert = $pdo->prepare(
        'INSERT INTO automations
            (name, trigger_event, template_id, is_active, audience, audience_user_ids,
             schedule_config, last_run_at, next_run_at, created_at, updated_at)
         VALUES
            (:name, :trigger_event, :template_id, 0, :audience, NULL,
             NULL, NULL, NULL, NOW(), NOW())'
    );
    $insert->execute([
        'name' => $name,
        'trigger_event' => $trigger,
        'template_id' => $templateId,
        'audience' => 'event',
    ]);

    return [(int) $pdo->lastInsertId(), true];
};

/* ------------------------------------------------------------------ */
/* Definition des modeles                                            */
/* ------------------------------------------------------------------ */

$p = static function (string $html): string {
    return '<p style="margin:0 0 16px;">' . $html . '</p>';
};

$templates = [
    'Email de bienvenue' => [
        'subject' => 'Bienvenue sur {{site}}, {{nom}} 👋',
        'description' => 'Message de bienvenue envoye a chaque nouveau lead inscrit.',
        'body' => $renderEmail(
            $p('Bienvenue dans la communaute <strong>Togosaas</strong>, le <strong>Hub SaaS du Togo</strong> ! Nous sommes ravis de vous compter parmi nous.')
            . $p('Togosaas recense, valorise et connecte les solutions SaaS du Togo — gratuites et payantes, <em>made in Togo</em>. Votre inscription est confirmee : vous pouvez des a present explorer les solutions et decouvrir les pepites de l\'ecosysteme.')
            . $p('Une question, une idee ? Repondez simplement a cet email, nous sommes la pour vous accompagner.'),
            'Découvrir les solutions',
            'https://togosaas.vercel.app/solutions'
        ),
    ],
    'Solution soumise' => [
        'subject' => 'Nous avons bien recu « {{solution}} »',
        'description' => 'Accuse de reception envoye lorsqu\'une solution est soumise et en attente de validation.',
        'body' => $renderEmail(
            $p('Merci ! Nous avons bien recu votre solution <strong>« {{solution}} »</strong>. Elle est desormais <strong>en attente de validation</strong> par notre equipe.')
            . $p('Nous examinons chaque soumission avec attention afin de garantir la qualite du contenu publie sur Togosaas. Vous recevrez un email des que son statut evoluera.')
            . $p('En attendant, vous pouvez suivre l\'avancement depuis votre tableau de bord.'),
            'Voir mon tableau de bord',
            'https://togosaas.vercel.app/espace-lead'
        ),
    ],
    'Solution approuvée' => [
        'subject' => '🎉 Votre solution « {{solution}} » est en ligne',
        'description' => 'Notification d\'approbation et de publication d\'une solution.',
        'body' => $renderEmail(
            $p('Excellente nouvelle ! Votre solution <strong>« {{solution}} »</strong> a ete <strong>approuvee</strong> et est desormais <strong>en ligne</strong> sur Togosaas. 🎉')
            . $p('Statut actuel : <strong>{{statut}}</strong>.')
            . $p('Elle est maintenant visible par toute la communaute du Hub SaaS du Togo. Merci pour votre contribution precieuse a l\'ecosysteme !'),
            'Voir ma solution en ligne',
            'https://togosaas.vercel.app/solutions'
        ),
    ],
    'Solution rejetée' => [
        'subject' => 'À propos de votre solution « {{solution}} »',
        'description' => 'Notification polie de rejet, avec invitation a corriger et resoumettre.',
        'body' => $renderEmail(
            $p('Merci d\'avoir soumis votre solution <strong>« {{solution}} »</strong>. Apres examen attentif, nous ne sommes malheureusement pas en mesure de la publier en l\'etat.')
            . $p('Statut actuel : <strong>{{statut}}</strong>.')
            . $p('Ne vous decouragez pas : completez ou corrigez les informations, puis <strong>soumettez-la a nouveau</strong>. Nous serons heureux de l\'etudier de nouveau.')
            . $p('Pour toute question, repondez simplement a cet email : nous restons a votre ecoute.'),
            'Modifier ma solution',
            'https://togosaas.vercel.app/espace-lead'
        ),
    ],
];

/* ------------------------------------------------------------------ */
/* Definition des automatisations                                    */
/* ------------------------------------------------------------------ */

$automations = [
    'Bienvenue nouveaux leads' => [
        'trigger' => 'lead_register',
        'template' => 'Email de bienvenue',
    ],
    'Accusé de réception solution' => [
        'trigger' => 'community_submitted',
        'template' => 'Solution soumise',
    ],
    'Notification approbation' => [
        'trigger' => 'community_approved',
        'template' => 'Solution approuvée',
    ],
    'Notification rejet' => [
        'trigger' => 'community_rejected',
        'template' => 'Solution rejetée',
    ],
];

/* ------------------------------------------------------------------ */
/* Upsert des modeles                                                */
/* ------------------------------------------------------------------ */

echo "\n-- Modeles de message --\n";

$templateIds = [];
$templatesCreated = 0;
$templatesUpdated = 0;

foreach ($templates as $name => $tpl) {
    [$id, $action] = $upsertTemplate($pdo, $name, $tpl['subject'], $tpl['body'], $tpl['description']);
    $templateIds[$name] = $id;

    if ($action === 'created') {
        $templatesCreated++;
        echo "    [OK] Modele cree : « {$name} » (id {$id})\n";
    } else {
        $templatesUpdated++;
        echo "    [MAJ] Modele mis a jour : « {$name} » (id {$id})\n";
    }
}

/* ------------------------------------------------------------------ */
/* Creation des automatisations (create-only)                        */
/* ------------------------------------------------------------------ */

echo "\n-- Automatisations (create-only, desactivees par defaut) --\n";

$automationsCreated = 0;
$automationsExisting = 0;

foreach ($automations as $name => $auto) {
    $templateId = $templateIds[$auto['template']] ?? null;

    if ($templateId === null) {
        echo "    [!] Modele introuvable pour « {$name} » : {$auto['template']} (ignore)\n";
        continue;
    }

    [$id, $created] = $ensureAutomation($pdo, $name, $auto['trigger'], $templateId);

    if ($created) {
        $automationsCreated++;
        echo "    [OK] Automatisation creee : « {$name} » -> {$auto['trigger']} (id {$id}, inactive)\n";
    } else {
        $automationsExisting++;
        echo "    [=] Automatisation deja existante : « {$name} » (id {$id}, inchangee)\n";
    }
}

/* ------------------------------------------------------------------ */
/* Resume                                                            */
/* ------------------------------------------------------------------ */

echo "\n==> Resume\n";
echo "    Modeles        : {$templatesCreated} cree(s), {$templatesUpdated} mis a jour\n";
echo "    Automatisations : {$automationsCreated} creee(s), {$automationsExisting} deja existante(s)\n";

if ($automationsCreated > 0) {
    echo "\n    Astuce : les nouvelles automatisations sont DESACTIVEES. Activez-les depuis l'admin apres relecture.\n";
}

echo "\n==> Seed des automatisations termine.\n";
