-- ============================================================
-- TogoSaaS - Seed 15 campagnes email (genere)
-- Pre-requis : upgrade-automations-campaigns.sql
-- Idempotent : INSERT ... WHERE NOT EXISTS / UPSERT modeles
-- Nouvelles automatisations : is_active = 0 par defaut
-- ============================================================

SET NAMES utf8mb4;

-- ----- Modeles de message (UPSERT par name) -----
UPDATE message_templates SET subject = '{{nom}}, publiez votre solution sur {{site}}', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Votre compte est pret, mais votre solution n''est pas encore visible sur <strong>Togosaas</strong>.</p><p style="margin:0 0 16px;">Publier votre fiche permet aux Togolais de decouvrir votre SaaS, de vous contacter et de vous faire confiance. Quelques minutes suffisent pour demarrer.</p><p style="margin:0 0 16px;">Completez le nom, la description, un lien d''acces et une capture — puis soumettez pour validation.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead/communautes/nouvelle" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Publier ma solution</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Invite les leads sans solution approuvee a publier ou completer leur SaaS.', updated_at = NOW() WHERE name = 'Publier ta solution';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Publier ta solution', '{{nom}}, publiez votre solution sur {{site}}', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Votre compte est pret, mais votre solution n''est pas encore visible sur <strong>Togosaas</strong>.</p><p style="margin:0 0 16px;">Publier votre fiche permet aux Togolais de decouvrir votre SaaS, de vous contacter et de vous faire confiance. Quelques minutes suffisent pour demarrer.</p><p style="margin:0 0 16px;">Completez le nom, la description, un lien d''acces et une capture — puis soumettez pour validation.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead/communautes/nouvelle" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Publier ma solution</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Invite les leads sans solution approuvee a publier ou completer leur SaaS.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Publier ta solution');

UPDATE message_templates SET subject = 'On croit en vous, {{nom}} — continuez votre aventure SaaS', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Cela fait un moment que nous ne vous avons pas vu sur <strong>Togosaas</strong>. Pas de jugement : construire un produit demande du temps, surtout au Togo ou le quotidien peut etre exigeant.</p><p style="margin:0 0 16px;">Ne baissez pas les bras. Les solutions utiles aux Togolais — paiements, education, sante, commerce, administration — changent des vies. Votre idee peut en faire partie.</p><p style="margin:0 0 16px;">Ignorez les murmures et le decouragement autour de vous. Avancez pas a pas : une fiche claire, un lien qui marche, une premiere mise a jour. Nous sommes la pour vous accompagner.</p><p style="margin:0 0 16px;">Quand vous etes pret, reconnectez-vous a votre espace et reprenez la main.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Retourner sur mon espace</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Encouragement apres 3 semaines sans activite pertinente.', updated_at = NOW() WHERE name = 'Encouragement inactivite';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Encouragement inactivite', 'On croit en vous, {{nom}} — continuez votre aventure SaaS', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Cela fait un moment que nous ne vous avons pas vu sur <strong>Togosaas</strong>. Pas de jugement : construire un produit demande du temps, surtout au Togo ou le quotidien peut etre exigeant.</p><p style="margin:0 0 16px;">Ne baissez pas les bras. Les solutions utiles aux Togolais — paiements, education, sante, commerce, administration — changent des vies. Votre idee peut en faire partie.</p><p style="margin:0 0 16px;">Ignorez les murmures et le decouragement autour de vous. Avancez pas a pas : une fiche claire, un lien qui marche, une premiere mise a jour. Nous sommes la pour vous accompagner.</p><p style="margin:0 0 16px;">Quand vous etes pret, reconnectez-vous a votre espace et reprenez la main.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Retourner sur mon espace</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Encouragement apres 3 semaines sans activite pertinente.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Encouragement inactivite');

UPDATE message_templates SET subject = 'Votre fiche est complete a {{profile_pct}} %', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Votre presence sur <strong>Togosaas</strong> est encore incomplete : <strong>{{profile_pct}} %</strong>.</p><p style="margin:0 0 16px;">Elements a renforcer : <strong>{{missing_fields}}</strong>.</p><p style="margin:0 0 16px;">Une fiche complete (telephone, galerie, liens, logo) inspire confiance et ameliore votre visibilite aupres des visiteurs.</p><p style="margin:0 0 16px;">Prenez quelques minutes pour completer votre espace lead.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Completer ma fiche</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Rappel aux leads reels dont le profil / la fiche est incomplete.', updated_at = NOW() WHERE name = 'Profil incomplet';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Profil incomplet', 'Votre fiche est complete a {{profile_pct}} %', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Votre presence sur <strong>Togosaas</strong> est encore incomplete : <strong>{{profile_pct}} %</strong>.</p><p style="margin:0 0 16px;">Elements a renforcer : <strong>{{missing_fields}}</strong>.</p><p style="margin:0 0 16px;">Une fiche complete (telephone, galerie, liens, logo) inspire confiance et ameliore votre visibilite aupres des visiteurs.</p><p style="margin:0 0 16px;">Prenez quelques minutes pour completer votre espace lead.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Completer ma fiche</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Rappel aux leads reels dont le profil / la fiche est incomplete.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Profil incomplet');

UPDATE message_templates SET subject = '« {{solution}} » est toujours en revue', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Votre solution <strong>« {{solution}} »</strong> est toujours <strong>en attente de validation</strong> par notre equipe.</p><p style="margin:0 0 16px;">Nous examinons chaque soumission avec attention. Des que le statut evolue, vous recevrez un email. Vous pouvez suivre l''avancement depuis votre tableau de bord.</p><p style="margin:0 0 16px;">Si vous souhaitez preciser des informations en attendant, connectez-vous a votre espace lead.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Voir mon tableau de bord</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Rappel au lead que sa solution est en attente de validation.', updated_at = NOW() WHERE name = 'Fiche en attente de validation';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Fiche en attente de validation', '« {{solution}} » est toujours en revue', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Votre solution <strong>« {{solution}} »</strong> est toujours <strong>en attente de validation</strong> par notre equipe.</p><p style="margin:0 0 16px;">Nous examinons chaque soumission avec attention. Des que le statut evolue, vous recevrez un email. Vous pouvez suivre l''avancement depuis votre tableau de bord.</p><p style="margin:0 0 16px;">Si vous souhaitez preciser des informations en attendant, connectez-vous a votre espace lead.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Voir mon tableau de bord</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Rappel au lead que sa solution est en attente de validation.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Fiche en attente de validation');

UPDATE message_templates SET subject = 'Votre solution « {{solution}} » est en ligne', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Excellente nouvelle ! Votre solution <strong>« {{solution}} »</strong> a ete <strong>approuvee</strong> et est desormais en ligne sur Togosaas.</p><p style="margin:0 0 16px;">Statut actuel : <strong>{{statut}}</strong>. Elle est visible par toute la communaute du Hub SaaS du Togo.</p><p style="margin:0 0 16px;">Prochaine etape : partagez votre fiche pour attirer vos premiers visiteurs et avis.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="{{community_url}}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Voir ma solution en ligne</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Notification d''approbation et de publication d''une solution.', updated_at = NOW() WHERE name = 'Solution approuvée';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Solution approuvée', 'Votre solution « {{solution}} » est en ligne', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Excellente nouvelle ! Votre solution <strong>« {{solution}} »</strong> a ete <strong>approuvee</strong> et est desormais en ligne sur Togosaas.</p><p style="margin:0 0 16px;">Statut actuel : <strong>{{statut}}</strong>. Elle est visible par toute la communaute du Hub SaaS du Togo.</p><p style="margin:0 0 16px;">Prochaine etape : partagez votre fiche pour attirer vos premiers visiteurs et avis.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="{{community_url}}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Voir ma solution en ligne</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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

UPDATE message_templates SET subject = 'A propos de votre solution « {{solution}} »', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Merci d''avoir soumis votre solution <strong>« {{solution}} »</strong>. Apres examen, nous ne pouvons pas la publier en l''etat.</p><p style="margin:0 0 16px;">Statut actuel : <strong>{{statut}}</strong>.</p><p style="margin:0 0 16px;">Conseils : precisez la description, ajoutez des captures a jour, verifiez les liens et le positionnement. Puis soumettez a nouveau — nous serons heureux de reexaminer votre fiche.</p><p style="margin:0 0 16px;">Pour toute question, repondez simplement a cet email.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Modifier ma solution</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Notification polie de refus, avec invitation a corriger et resoumettre.', updated_at = NOW() WHERE name = 'Solution rejetée';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Solution rejetée', 'A propos de votre solution « {{solution}} »', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Merci d''avoir soumis votre solution <strong>« {{solution}} »</strong>. Apres examen, nous ne pouvons pas la publier en l''etat.</p><p style="margin:0 0 16px;">Statut actuel : <strong>{{statut}}</strong>.</p><p style="margin:0 0 16px;">Conseils : precisez la description, ajoutez des captures a jour, verifiez les liens et le positionnement. Puis soumettez a nouveau — nous serons heureux de reexaminer votre fiche.</p><p style="margin:0 0 16px;">Pour toute question, repondez simplement a cet email.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Modifier ma solution</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Notification polie de refus, avec invitation a corriger et resoumettre.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Solution rejetée');

UPDATE message_templates SET subject = 'Nouvelle note sur « {{solution}} » : {{rating}}/5', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Bonne nouvelle : quelqu''un vient de noter votre solution <strong>« {{solution}} »</strong>.</p><p style="margin:0 0 16px;">Note recue : <strong>{{rating}}/5</strong>. Moyenne actuelle : <strong>{{rating_avg}}</strong> sur <strong>{{reviews_count}}</strong> avis.</p><p style="margin:0 0 16px;">Consultez votre fiche pour suivre l''engagement et repondre aux avis ecrits le cas echeant.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="{{community_url}}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Voir ma solution</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Notifie le lead proprietaire quand un avis ou une note est depose.', updated_at = NOW() WHERE name = 'Nouveau avis ou note';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Nouveau avis ou note', 'Nouvelle note sur « {{solution}} » : {{rating}}/5', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Bonne nouvelle : quelqu''un vient de noter votre solution <strong>« {{solution}} »</strong>.</p><p style="margin:0 0 16px;">Note recue : <strong>{{rating}}/5</strong>. Moyenne actuelle : <strong>{{rating_avg}}</strong> sur <strong>{{reviews_count}}</strong> avis.</p><p style="margin:0 0 16px;">Consultez votre fiche pour suivre l''engagement et repondre aux avis ecrits le cas echeant.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="{{community_url}}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Voir ma solution</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Notifie le lead proprietaire quand un avis ou une note est depose.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Nouveau avis ou note');

UPDATE message_templates SET subject = '« {{solution}} » obtient le badge {{badge}}', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Felicitations ! Votre solution <strong>« {{solution}} »</strong> atteint le seuil du badge <strong>{{badge}}</strong>.</p><p style="margin:0 0 16px;">Moyenne : <strong>{{rating_avg}}/5</strong> sur <strong>{{reviews_count}}</strong> avis. C''est un signal fort de confiance pour vos visiteurs.</p><p style="margin:0 0 16px;">Continuez a soigner votre fiche et a partager votre lien pour amplifer cette dynamique.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="{{community_url}}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Voir ma fiche</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Felicitations lorsque le seuil Top note est atteint (moyenne et volume d''avis).', updated_at = NOW() WHERE name = 'Badge Top note';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Badge Top note', '« {{solution}} » obtient le badge {{badge}}', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Felicitations ! Votre solution <strong>« {{solution}} »</strong> atteint le seuil du badge <strong>{{badge}}</strong>.</p><p style="margin:0 0 16px;">Moyenne : <strong>{{rating_avg}}/5</strong> sur <strong>{{reviews_count}}</strong> avis. C''est un signal fort de confiance pour vos visiteurs.</p><p style="margin:0 0 16px;">Continuez a soigner votre fiche et a partager votre lien pour amplifer cette dynamique.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="{{community_url}}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Voir ma fiche</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Felicitations lorsque le seuil Top note est atteint (moyenne et volume d''avis).', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Badge Top note');

UPDATE message_templates SET subject = 'Votre semaine sur Togosaas — « {{solution}} »', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Voici le resume d''engagement de la semaine pour <strong>« {{solution}} »</strong> :</p><p style="margin:0 0 16px;">• Likes cette semaine : <strong>{{likes_week}}</strong><br>• Avis cette semaine : <strong>{{reviews_week}}</strong><br>• Note moyenne : <strong>{{rating_avg}}</strong> (<strong>{{reviews_count}}</strong> avis au total)<br>• Likes au total : <strong>{{likes_count}}</strong></p><p style="margin:0 0 16px;">Connectez-vous pour analyser ces signaux et actualiser votre fiche si besoin.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Ouvrir mon espace</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Resume hebdomadaire likes / avis / note pour les leads avec solution approuvee.', updated_at = NOW() WHERE name = 'Digest hebdo engagement';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Digest hebdo engagement', 'Votre semaine sur Togosaas — « {{solution}} »', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Voici le resume d''engagement de la semaine pour <strong>« {{solution}} »</strong> :</p><p style="margin:0 0 16px;">• Likes cette semaine : <strong>{{likes_week}}</strong><br>• Avis cette semaine : <strong>{{reviews_week}}</strong><br>• Note moyenne : <strong>{{rating_avg}}</strong> (<strong>{{reviews_count}}</strong> avis au total)<br>• Likes au total : <strong>{{likes_count}}</strong></p><p style="margin:0 0 16px;">Connectez-vous pour analyser ces signaux et actualiser votre fiche si besoin.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Ouvrir mon espace</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Resume hebdomadaire likes / avis / note pour les leads avec solution approuvee.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Digest hebdo engagement');

UPDATE message_templates SET subject = 'Pensez a actualiser « {{solution}} »', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Cela fait un moment que votre fiche <strong>« {{solution}} »</strong> n''a pas ete mise a jour.</p><p style="margin:0 0 16px;">Les visiteurs privilegient les informations fraiches : captures recentes, prix a jour, description claire, liens fonctionnels.</p><p style="margin:0 0 16px;">Prenez quelques minutes pour actualiser votre solution sur Togosaas.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Mettre a jour ma fiche</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Rappel periodique (8-12 semaines) pour actualiser captures, prix et description.', updated_at = NOW() WHERE name = 'Mise a jour de fiche';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Mise a jour de fiche', 'Pensez a actualiser « {{solution}} »', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Cela fait un moment que votre fiche <strong>« {{solution}} »</strong> n''a pas ete mise a jour.</p><p style="margin:0 0 16px;">Les visiteurs privilegient les informations fraiches : captures recentes, prix a jour, description claire, liens fonctionnels.</p><p style="margin:0 0 16px;">Prenez quelques minutes pour actualiser votre solution sur Togosaas.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Mettre a jour ma fiche</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Rappel periodique (8-12 semaines) pour actualiser captures, prix et description.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Mise a jour de fiche');

UPDATE message_templates SET subject = 'Votre solution « {{solution}} » merite un petit coup de frais', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Votre solution <strong>« {{solution}} »</strong> est en ligne, mais elle n''a pas ete mise a jour depuis un moment.</p><p style="margin:0 0 16px;">Un petit geste suffit souvent : une nouvelle capture, un prix ajusté, une phrase de mission plus claire. Cela aide les visiteurs a vous faire confiance.</p><p style="margin:0 0 16px;">Nous restons a vos cotes pour valoriser les SaaS made in Togo.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Actualiser ma solution</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Nudge doux pour solutions approuvees sans mise a jour depuis plusieurs semaines.', updated_at = NOW() WHERE name = 'Solution dormante';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Solution dormante', 'Votre solution « {{solution}} » merite un petit coup de frais', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Votre solution <strong>« {{solution}} »</strong> est en ligne, mais elle n''a pas ete mise a jour depuis un moment.</p><p style="margin:0 0 16px;">Un petit geste suffit souvent : une nouvelle capture, un prix ajusté, une phrase de mission plus claire. Cela aide les visiteurs a vous faire confiance.</p><p style="margin:0 0 16px;">Nous restons a vos cotes pour valoriser les SaaS made in Togo.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Actualiser ma solution</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Nudge doux pour solutions approuvees sans mise a jour depuis plusieurs semaines.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Solution dormante');

UPDATE message_templates SET subject = 'Un probleme a ete signale sur « {{solution}} »', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Un utilisateur a signale un probleme concernant votre solution <strong>« {{solution}} »</strong>.</p><p style="margin:0 0 16px;">Nature du signalement : <strong>{{report_category}}</strong>.</p><p style="margin:0 0 16px;">Aucun detail sur l''auteur du signalement n''est partage. Nous vous invitons a verifier vos liens, disponibilite du service et informations publiees. Notre equipe peut vous contacter si une action est necessaire.</p><p style="margin:0 0 16px;">Merci de contribuer a la fiabilite du Hub SaaS du Togo.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Verifier ma fiche</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Notifie le lead qu''un signalement a ete depose (sans exposer le signalant).', updated_at = NOW() WHERE name = 'Signalement sur votre solution';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Signalement sur votre solution', 'Un probleme a ete signale sur « {{solution}} »', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Un utilisateur a signale un probleme concernant votre solution <strong>« {{solution}} »</strong>.</p><p style="margin:0 0 16px;">Nature du signalement : <strong>{{report_category}}</strong>.</p><p style="margin:0 0 16px;">Aucun detail sur l''auteur du signalement n''est partage. Nous vous invitons a verifier vos liens, disponibilite du service et informations publiees. Notre equipe peut vous contacter si une action est necessaire.</p><p style="margin:0 0 16px;">Merci de contribuer a la fiabilite du Hub SaaS du Togo.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Verifier ma fiche</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Notifie le lead qu''un signalement a ete depose (sans exposer le signalant).', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Signalement sur votre solution');

UPDATE message_templates SET subject = 'Digest admin Togosaas — semaine du {{date}}', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Voici le digest hebdomadaire de la plateforme :</p><p style="margin:0 0 16px;">• Nouveaux leads (7j) : <strong>{{new_leads_week}}</strong><br>• Solutions en attente : <strong>{{pending_solutions}}</strong><br>• Signalements en cours : <strong>{{pending_reports}}</strong><br>• Avis signales (7j) : <strong>{{flagged_reviews}}</strong><br>• Emails en echec (7j) : <strong>{{failed_mails_week}}</strong></p><p style="margin:0 0 16px;">Connectez-vous a l''espace admin pour traiter les files prioritaires.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-admin" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Ouvrir l&#039;admin</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Resume hebdo pour admin/subadmin : leads, validations, moderation, echecs email.', updated_at = NOW() WHERE name = 'Digest admin hebdomadaire';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Digest admin hebdomadaire', 'Digest admin Togosaas — semaine du {{date}}', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Voici le digest hebdomadaire de la plateforme :</p><p style="margin:0 0 16px;">• Nouveaux leads (7j) : <strong>{{new_leads_week}}</strong><br>• Solutions en attente : <strong>{{pending_solutions}}</strong><br>• Signalements en cours : <strong>{{pending_reports}}</strong><br>• Avis signales (7j) : <strong>{{flagged_reviews}}</strong><br>• Emails en echec (7j) : <strong>{{failed_mails_week}}</strong></p><p style="margin:0 0 16px;">Connectez-vous a l''espace admin pour traiter les files prioritaires.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-admin" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Ouvrir l&#039;admin</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Resume hebdo pour admin/subadmin : leads, validations, moderation, echecs email.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Digest admin hebdomadaire');

UPDATE message_templates SET subject = 'Jour 3 : publiez votre premiere solution', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Vous etes inscrit depuis trois jours sur <strong>Togosaas</strong>. L''etape suivante : publier votre solution SaaS.</p><p style="margin:0 0 16px;">Une fiche claire (nom, description, lien, capture) suffit pour demarrer le parcours de validation.</p><p style="margin:0 0 16px;">Plus vous publiez tot, plus vite votre produit peut etre decouvert par la communaute.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead/communautes/nouvelle" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Publier ma solution</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Etape J3 de la serie onboarding lead.', updated_at = NOW() WHERE name = 'Onboarding J3 — publier';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Onboarding J3 — publier', 'Jour 3 : publiez votre premiere solution', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Vous etes inscrit depuis trois jours sur <strong>Togosaas</strong>. L''etape suivante : publier votre solution SaaS.</p><p style="margin:0 0 16px;">Une fiche claire (nom, description, lien, capture) suffit pour demarrer le parcours de validation.</p><p style="margin:0 0 16px;">Plus vous publiez tot, plus vite votre produit peut etre decouvert par la communaute.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead/communautes/nouvelle" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Publier ma solution</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Etape J3 de la serie onboarding lead.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Onboarding J3 — publier');

UPDATE message_templates SET subject = 'Jour 7 : completez galerie, equipe et presence', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Une semaine deja sur <strong>Togosaas</strong> ! Pour maximiser votre impact :</p><p style="margin:0 0 16px;">1. Completer la <strong>galerie</strong> (captures a jour)<br>2. Renseigner l''<strong>equipe</strong> (fondateur et co-membres)<br>3. Activer les <strong>notifications</strong> si proposees dans votre navigateur</p><p style="margin:0 0 16px;">Ces details renforcent la confiance et la conversion des visiteurs.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Completer mon espace</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Etape J7 de la serie onboarding lead.', updated_at = NOW() WHERE name = 'Onboarding J7 — completer';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Onboarding J7 — completer', 'Jour 7 : completez galerie, equipe et presence', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Une semaine deja sur <strong>Togosaas</strong> ! Pour maximiser votre impact :</p><p style="margin:0 0 16px;">1. Completer la <strong>galerie</strong> (captures a jour)<br>2. Renseigner l''<strong>equipe</strong> (fondateur et co-membres)<br>3. Activer les <strong>notifications</strong> si proposees dans votre navigateur</p><p style="margin:0 0 16px;">Ces details renforcent la confiance et la conversion des visiteurs.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Completer mon espace</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Etape J7 de la serie onboarding lead.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Onboarding J7 — completer');

UPDATE message_templates SET subject = 'Partagez « {{solution}} » sur LinkedIn et WhatsApp', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Votre solution <strong>« {{solution}} »</strong> est en ligne. Le meilleur levier maintenant : la faire connaitre.</p><p style="margin:0 0 16px;">Partagez votre fiche :<br>• <a href="{{share_linkedin}}" style="color:#006A4E;">LinkedIn</a><br>• <a href="{{share_whatsapp}}" style="color:#006A4E;">WhatsApp</a><br>• Lien direct : <a href="{{community_url}}" style="color:#006A4E;">{{community_url}}</a></p><p style="margin:0 0 16px;">Chaque partage augmente vos chances d''obtenir des avis et de la traction locale.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="{{community_url}}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Voir ma fiche publique</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Reengagement post-approbation : partage social et lien catalogue.', updated_at = NOW() WHERE name = 'Partagez votre solution';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Partagez votre solution', 'Partagez « {{solution}} » sur LinkedIn et WhatsApp', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Votre solution <strong>« {{solution}} »</strong> est en ligne. Le meilleur levier maintenant : la faire connaitre.</p><p style="margin:0 0 16px;">Partagez votre fiche :<br>• <a href="{{share_linkedin}}" style="color:#006A4E;">LinkedIn</a><br>• <a href="{{share_whatsapp}}" style="color:#006A4E;">WhatsApp</a><br>• Lien direct : <a href="{{community_url}}" style="color:#006A4E;">{{community_url}}</a></p><p style="margin:0 0 16px;">Chaque partage augmente vos chances d''obtenir des avis et de la traction locale.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="{{community_url}}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Voir ma fiche publique</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Reengagement post-approbation : partage social et lien catalogue.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Partagez votre solution');

UPDATE message_templates SET subject = 'Appel aux solutions {{category}} sur Togosaas', body_html = '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Nous mettons en avant les solutions de la categorie <strong>{{category}}</strong> sur <strong>Togosaas</strong>.</p><p style="margin:0 0 16px;">Si votre produit <strong>« {{solution}} »</strong> s''inscrit dans cette thematique, assurez-vous que votre fiche est complete, a jour et bien taguee.</p><p style="margin:0 0 16px;">C''est le bon moment pour renforcer votre description, vos captures et vos liens d''acces.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Mettre a jour ma fiche</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', description = 'Modele pour campagne manuelle/planifiee filtree par tag (ex. fintech, education).', updated_at = NOW() WHERE name = 'Campagne thematique';
INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
SELECT 'Campagne thematique', 'Appel aux solutions {{category}} sur Togosaas', '<!DOCTYPE html>
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
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
<p style="margin:0 0 16px;">Nous mettons en avant les solutions de la categorie <strong>{{category}}</strong> sur <strong>Togosaas</strong>.</p><p style="margin:0 0 16px;">Si votre produit <strong>« {{solution}} »</strong> s''inscrit dans cette thematique, assurez-vous que votre fiche est complete, a jour et bien taguee.</p><p style="margin:0 0 16px;">C''est le bon moment pour renforcer votre description, vos captures et vos liens d''acces.</p>
              <div style="text-align:center;margin:26px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;"><tr><td align="center" bgcolor="#006A4E" style="border-radius:8px;"><a href="https://togosaas.vercel.app/espace-lead" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Mettre a jour ma fiche</a></td></tr></table>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="height:6px;line-height:6px;font-size:0;"><td width="33%" style="background-color:#006A4E;">&nbsp;</td><td width="34%" style="background-color:#FFCE00;">&nbsp;</td><td width="33%" style="background-color:#D21034;">&nbsp;</td></tr></table></td></tr>
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
</html>', 'Modele pour campagne manuelle/planifiee filtree par tag (ex. fintech, education).', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Campagne thematique');

-- ----- Automatisations (CREATE-ONLY, is_active = 0) -----
INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Publier ta solution', 'scheduled', (SELECT id FROM message_templates WHERE name = 'Publier ta solution' ORDER BY id LIMIT 1), 0, 'leads_no_solution', NULL, '{"mode":"weekly","dayOfWeek":2,"time":"09:00","cooldown_days":14}', NULL, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Publier ta solution');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Encouragement inactivite 3 semaines', 'scheduled', (SELECT id FROM message_templates WHERE name = 'Encouragement inactivite' ORDER BY id LIMIT 1), 0, 'leads_inactive', NULL, '{"mode":"daily","time":"10:00","inactive_days":21,"cooldown_days":21}', NULL, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Encouragement inactivite 3 semaines');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Profil incomplet', 'scheduled', (SELECT id FROM message_templates WHERE name = 'Profil incomplet' ORDER BY id LIMIT 1), 0, 'leads_incomplete_profile', NULL, '{"mode":"weekly","dayOfWeek":3,"time":"09:30","cooldown_days":14}', NULL, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Profil incomplet');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Fiche en attente de validation', 'scheduled', (SELECT id FROM message_templates WHERE name = 'Fiche en attente de validation' ORDER BY id LIMIT 1), 0, 'leads_pending_review', NULL, '{"mode":"daily","time":"11:00","cooldown_days":7}', NULL, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Fiche en attente de validation');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Notification approbation', 'community_approved', (SELECT id FROM message_templates WHERE name = 'Solution approuvée' ORDER BY id LIMIT 1), 0, 'event', NULL, NULL, NULL, NULL, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Notification approbation');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Notification rejet', 'community_rejected', (SELECT id FROM message_templates WHERE name = 'Solution rejetée' ORDER BY id LIMIT 1), 0, 'event', NULL, NULL, NULL, NULL, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Notification rejet');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Nouveau avis ou note', 'review_created', (SELECT id FROM message_templates WHERE name = 'Nouveau avis ou note' ORDER BY id LIMIT 1), 0, 'event', NULL, '{"cooldown_days":1}', NULL, NULL, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Nouveau avis ou note');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Badge Top note atteint', 'rating_threshold', (SELECT id FROM message_templates WHERE name = 'Badge Top note' ORDER BY id LIMIT 1), 0, 'event', NULL, '{"cooldown_days":365}', NULL, NULL, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Badge Top note atteint');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Digest hebdo engagement', 'scheduled', (SELECT id FROM message_templates WHERE name = 'Digest hebdo engagement' ORDER BY id LIMIT 1), 0, 'leads_with_solution', NULL, '{"mode":"weekly","dayOfWeek":1,"time":"08:30","cooldown_days":6}', NULL, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Digest hebdo engagement');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Rappel mise a jour de fiche', 'scheduled', (SELECT id FROM message_templates WHERE name = 'Mise a jour de fiche' ORDER BY id LIMIT 1), 0, 'leads_stale_profile', NULL, '{"mode":"monthly","dayOfMonth":1,"time":"09:00","stale_weeks":10,"cooldown_days":56}', NULL, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Rappel mise a jour de fiche');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Solution dormante', 'scheduled', (SELECT id FROM message_templates WHERE name = 'Solution dormante' ORDER BY id LIMIT 1), 0, 'leads_dormant_solution', NULL, '{"mode":"weekly","dayOfWeek":4,"time":"09:00","dormant_weeks":6,"cooldown_days":42}', NULL, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Solution dormante');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Signalement sur votre solution', 'report_filed', (SELECT id FROM message_templates WHERE name = 'Signalement sur votre solution' ORDER BY id LIMIT 1), 0, 'event', NULL, '{"cooldown_days":1}', NULL, NULL, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Signalement sur votre solution');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Digest admin hebdomadaire', 'scheduled', (SELECT id FROM message_templates WHERE name = 'Digest admin hebdomadaire' ORDER BY id LIMIT 1), 0, 'admins', NULL, '{"mode":"weekly","dayOfWeek":1,"time":"08:00","cooldown_days":6}', NULL, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Digest admin hebdomadaire');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Onboarding J3 — publier', 'scheduled', (SELECT id FROM message_templates WHERE name = 'Onboarding J3 — publier' ORDER BY id LIMIT 1), 0, 'leads_onboarding_d3', NULL, '{"mode":"daily","time":"09:15","cooldown_days":365}', NULL, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Onboarding J3 — publier');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Onboarding J7 — completer', 'scheduled', (SELECT id FROM message_templates WHERE name = 'Onboarding J7 — completer' ORDER BY id LIMIT 1), 0, 'leads_onboarding_d7', NULL, '{"mode":"daily","time":"09:20","cooldown_days":365}', NULL, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Onboarding J7 — completer');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Partagez votre solution', 'community_approved', (SELECT id FROM message_templates WHERE name = 'Partagez votre solution' ORDER BY id LIMIT 1), 0, 'event', NULL, '{"cooldown_days":30}', NULL, NULL, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Partagez votre solution');

INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)
SELECT 'Campagne thematique', 'manual', (SELECT id FROM message_templates WHERE name = 'Campagne thematique' ORDER BY id LIMIT 1), 0, 'category_tag', NULL, '{"tag":"fintech","cooldown_days":30}', NULL, NULL, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = 'Campagne thematique');

-- Fin du seed campagnes.
