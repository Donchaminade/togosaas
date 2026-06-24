-- ============================================================
-- TogoSaaS - Seed des modeles + automatisations (genere)
-- Import via phpMyAdmin (base u878418868_tgsaas), apres install-hostinger.sql.
-- Idempotent : reimportable sans creer de doublons (INSERT ... WHERE NOT EXISTS).
-- Les automatisations sont creees DESACTIVEES (is_active = 0).
-- ============================================================

SET NAMES utf8mb4;

-- ----- Modeles de message -----
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Email de bienvenue', 'Bienvenue sur {{site}}, {{nom}} 👋', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>

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
<p style="margin:0 0 16px;">Bienvenue dans la communaute <strong>Togosaas</strong>, le <strong>Hub SaaS du Togo</strong> ! Nous sommes ravis de vous compter parmi nous.</p><p style="margin:0 0 16px;">Togosaas recense, valorise et connecte les solutions SaaS du Togo — gratuites et payantes, <em>made in Togo</em>. Votre inscription est confirmee : vous pouvez des a present explorer les solutions et decouvrir les pepites de l''ecosysteme.</p><p style="margin:0 0 16px;">Une question, une idee ? Repondez simplement a cet email, nous sommes la pour vous accompagner.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/solutions" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Découvrir les solutions</a></td></tr></table>
              </div>
            </td>
          </tr>

          <!-- Bande drapeau bas -->
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>

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
</html>', 'Message de bienvenue envoye a chaque nouveau lead inscrit.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Email de bienvenue');

INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Solution soumise', 'Nous avons bien recu « {{solution}} »', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>

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
<p style="margin:0 0 16px;">Merci ! Nous avons bien recu votre solution <strong>« {{solution}} »</strong>. Elle est desormais <strong>en attente de validation</strong> par notre equipe.</p><p style="margin:0 0 16px;">Nous examinons chaque soumission avec attention afin de garantir la qualite du contenu publie sur Togosaas. Vous recevrez un email des que son statut evoluera.</p><p style="margin:0 0 16px;">En attendant, vous pouvez suivre l''avancement depuis votre tableau de bord.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Voir mon tableau de bord</a></td></tr></table>
              </div>
            </td>
          </tr>

          <!-- Bande drapeau bas -->
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>

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
</html>', 'Accuse de reception envoye lorsqu''une solution est soumise et en attente de validation.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Solution soumise');

INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Solution approuvée', '🎉 Votre solution « {{solution}} » est en ligne', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>

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
<p style="margin:0 0 16px;">Excellente nouvelle ! Votre solution <strong>« {{solution}} »</strong> a ete <strong>approuvee</strong> et est desormais <strong>en ligne</strong> sur Togosaas. 🎉</p><p style="margin:0 0 16px;">Statut actuel : <strong>{{statut}}</strong>.</p><p style="margin:0 0 16px;">Elle est maintenant visible par toute la communaute du Hub SaaS du Togo. Merci pour votre contribution precieuse a l''ecosysteme !</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/solutions" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Voir ma solution en ligne</a></td></tr></table>
              </div>
            </td>
          </tr>

          <!-- Bande drapeau bas -->
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>

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
</html>', 'Notification d''approbation et de publication d''une solution.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Solution approuvée');

INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Solution rejetée', 'À propos de votre solution « {{solution}} »', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>

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
<p style="margin:0 0 16px;">Merci d''avoir soumis votre solution <strong>« {{solution}} »</strong>. Apres examen attentif, nous ne sommes malheureusement pas en mesure de la publier en l''etat.</p><p style="margin:0 0 16px;">Statut actuel : <strong>{{statut}}</strong>.</p><p style="margin:0 0 16px;">Ne vous decouragez pas : completez ou corrigez les informations, puis <strong>soumettez-la a nouveau</strong>. Nous serons heureux de l''etudier de nouveau.</p><p style="margin:0 0 16px;">Pour toute question, repondez simplement a cet email : nous restons a votre ecoute.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Modifier ma solution</a></td></tr></table>
              </div>
            </td>
          </tr>

          <!-- Bande drapeau bas -->
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>

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
</html>', 'Notification polie de rejet, avec invitation a corriger et resoumettre.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Solution rejetée');

-- ----- Automatisations (desactivees par defaut) -----
INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Bienvenue nouveaux leads', 'lead_register', (SELECT id FROM message_templates WHERE name = 'Email de bienvenue' ORDER BY id LIMIT 1), 0, 'event', NULL, NULL, NULL, NULL, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Bienvenue nouveaux leads');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Accusé de réception solution', 'community_submitted', (SELECT id FROM message_templates WHERE name = 'Solution soumise' ORDER BY id LIMIT 1), 0, 'event', NULL, NULL, NULL, NULL, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Accusé de réception solution');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Notification approbation', 'community_approved', (SELECT id FROM message_templates WHERE name = 'Solution approuvée' ORDER BY id LIMIT 1), 0, 'event', NULL, NULL, NULL, NULL, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Notification approbation');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Notification rejet', 'community_rejected', (SELECT id FROM message_templates WHERE name = 'Solution rejetée' ORDER BY id LIMIT 1), 0, 'event', NULL, NULL, NULL, NULL, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Notification rejet');

