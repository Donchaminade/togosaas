<?php

declare(strict_types=1);

namespace TCH;

use TCH\Controllers\AuthController;

/**
 * Confirmation d'email a l'inscription (anti-faute de frappe).
 *
 * Conception 100% ADDITIVE : la notion de "verifie" est portee par la table
 * email_verifications, JAMAIS par la table users. Consequence :
 *   - Les comptes existants (aucune ligne) sont consideres comme verifies et
 *     ne sont jamais bloques.
 *   - Seuls les NOUVEAUX comptes recoivent une ligne a l'inscription et sont
 *     "en attente" tant que le lien n'a pas ete consomme.
 * La verification n'est PAS bloquante : c'est un simple bandeau d'invitation.
 */
final class EmailVerificationHelper
{
    /** Duree de validite d'un lien de confirmation. */
    private const TTL_HOURS = 48;

    /**
     * Genere (ou regenere) un lien de confirmation pour un utilisateur et envoie
     * l'email. Best-effort : ne leve jamais d'exception (ne doit pas casser
     * l'inscription). Les adresses sentinelles sont exclues.
     *
     * @return bool true si un email a ete (tente d')envoye.
     */
    public static function issueAndSend(int $userId, string $email, ?string $name): bool
    {
        try {
            $email = strtolower(trim($email));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return false;
            }
            // Ne jamais envoyer vers une adresse sentinelle (compte cree sans email reel).
            if (AuthController::isSentinelEmail($email)) {
                return false;
            }

            $token = self::createToken($userId);
            if ($token === null) {
                return false;
            }

            if (!Mailer::isConfigured()) {
                // Pas de SMTP : la ligne existe (statut "en attente"), l'utilisateur
                // pourra demander un renvoi plus tard. On ne bloque rien.
                return false;
            }

            $link = self::buildLink($token);
            $html = self::emailHtml($name, $link);

            (new Mailer())->send($email, $name, 'Confirmez votre adresse email — TogoSaaS', $html);
            return true;
        } catch (\Throwable $e) {
            if (TCH_DEBUG) {
                error_log('[EmailVerificationHelper::issueAndSend] ' . $e->getMessage());
            }
            return false;
        }
    }

    /** Insere un nouveau token (invalide les precedents non consommes). */
    private static function createToken(int $userId): ?string
    {
        $db = Database::connection();

        // Invalide les tokens en attente precedents (en les marquant consommes
        // sans validation) pour eviter l'accumulation : on garde une seule ligne active.
        $db->prepare(
            "UPDATE email_verifications SET consumed_at = NOW()
             WHERE user_id = :uid AND consumed_at IS NULL"
        )->execute(['uid' => $userId]);

        $token = bin2hex(random_bytes(24)); // 48 caracteres hex
        $expires = (new \DateTimeImmutable('now'))
            ->modify('+' . self::TTL_HOURS . ' hours')
            ->format('Y-m-d H:i:s');

        $db->prepare(
            'INSERT INTO email_verifications (user_id, token, expires_at, created_at)
             VALUES (:uid, :token, :expires, NOW())'
        )->execute(['uid' => $userId, 'token' => $token, 'expires' => $expires]);

        return $token;
    }

    /**
     * Valide un token : verifie expiration + non-consommation, puis le consomme.
     *
     * @return array{ok: bool, message: string}
     */
    public static function verify(string $token): array
    {
        $token = trim($token);
        if ($token === '' || !preg_match('/^[a-f0-9]{32,64}$/i', $token)) {
            return ['ok' => false, 'message' => 'Lien de confirmation invalide.'];
        }

        $db = Database::connection();
        $stmt = $db->prepare('SELECT * FROM email_verifications WHERE token = :token LIMIT 1');
        $stmt->execute(['token' => $token]);
        $row = $stmt->fetch();

        if (!$row) {
            return ['ok' => false, 'message' => 'Lien de confirmation introuvable.'];
        }

        // Deja consomme : on considere l'email comme deja confirme (idempotent).
        if ($row['consumed_at'] !== null) {
            return ['ok' => true, 'message' => 'Votre adresse email est deja confirmee.'];
        }

        if (strtotime((string) $row['expires_at']) < time()) {
            return ['ok' => false, 'message' => 'Ce lien a expire. Demandez un nouvel email de confirmation.'];
        }

        $db->prepare('UPDATE email_verifications SET consumed_at = NOW() WHERE id = :id')
            ->execute(['id' => (int) $row['id']]);

        return ['ok' => true, 'message' => 'Merci ! Votre adresse email est confirmee.'];
    }

    /**
     * Etat de verification d'un utilisateur, sans jamais bloquer les comptes existants.
     *
     * Verifie (emailVerified = true) si :
     *   - aucune ligne n'existe (compte anterieur a la fonctionnalite), OU
     *   - au moins une ligne a ete consommee.
     * En attente sinon (lignes existantes mais aucune consommee).
     */
    public static function isVerified(int $userId): bool
    {
        $db = Database::connection();

        $total = $db->prepare('SELECT COUNT(*) FROM email_verifications WHERE user_id = :uid');
        $total->execute(['uid' => $userId]);
        if ((int) $total->fetchColumn() === 0) {
            return true; // aucun enregistrement : compte existant => non bloque
        }

        $consumed = $db->prepare(
            'SELECT COUNT(*) FROM email_verifications WHERE user_id = :uid AND consumed_at IS NOT NULL'
        );
        $consumed->execute(['uid' => $userId]);
        return (int) $consumed->fetchColumn() > 0;
    }

    private static function buildLink(string $token): string
    {
        $base = self::frontendBaseUrl();
        return $base . '/verifier-email?token=' . urlencode($token);
    }

    private static function frontendBaseUrl(): string
    {
        $origins = Security::allowedOrigins();
        $base = $origins[0] ?? (string) env('FRONTEND_URL', '');
        $base = rtrim((string) $base, '/');
        return $base !== '' ? $base : 'https://togosaas.vercel.app';
    }

    private static function emailHtml(?string $name, string $link): string
    {
        $safeName = htmlspecialchars(trim((string) $name) !== '' ? (string) $name : 'a vous', ENT_QUOTES, 'UTF-8');
        $safeLink = htmlspecialchars($link, ENT_QUOTES, 'UTF-8');

        return <<<HTML
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
  <p style="font-size:16px">Bonjour {$safeName},</p>
  <p style="font-size:15px;line-height:1.6">
    Merci de votre inscription sur <strong>TogoSaaS</strong>. Pour securiser votre
    compte et confirmer que votre adresse email est correcte, cliquez sur le bouton ci-dessous :
  </p>
  <p style="text-align:center;margin:28px 0">
    <a href="{$safeLink}"
       style="background:#006a4e;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:bold;display:inline-block">
      Confirmer mon adresse email
    </a>
  </p>
  <p style="font-size:13px;color:#475569;line-height:1.6">
    Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
    <a href="{$safeLink}" style="color:#006a4e;word-break:break-all">{$safeLink}</a>
  </p>
  <p style="font-size:13px;color:#94a3b8">
    Ce lien expire dans 48 heures. Si vous n'etes pas a l'origine de cette inscription,
    ignorez simplement cet email.
  </p>
</div>
HTML;
    }
}
