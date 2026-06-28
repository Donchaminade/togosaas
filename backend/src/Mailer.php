<?php

declare(strict_types=1);

namespace TCH;

/**
 * Client SMTP minimaliste (sans dependance externe) pour l'envoi d'emails
 * transactionnels et de campagnes. Gere l'authentification, SSL implicite
 * (port 465), STARTTLS (port 587) et la generation de messages MIME avec
 * corps HTML + texte alternatif et pieces jointes encodees en base64.
 *
 * Configuration via .env :
 *   MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD,
 *   MAIL_ENCRYPTION (ssl|tls|none), MAIL_FROM_EMAIL, MAIL_FROM_NAME
 */
final class Mailer
{
    private string $host;
    private int $port;
    private string $username;
    private string $password;
    private string $encryption;
    private string $fromEmail;
    private string $fromName;

    /** @var resource|null */
    private $socket = null;

    public function __construct()
    {
        $this->host = (string) env('MAIL_HOST', '');
        $this->username = (string) env('MAIL_USERNAME', '');
        $this->password = (string) env('MAIL_PASSWORD', '');
        $this->encryption = strtolower((string) env('MAIL_ENCRYPTION', 'ssl'));
        if (!in_array($this->encryption, ['ssl', 'tls', 'none'], true)) {
            $this->encryption = 'ssl';
        }

        $defaultPort = $this->encryption === 'tls' ? 587 : ($this->encryption === 'none' ? 25 : 465);
        $this->port = (int) env('MAIL_PORT', $defaultPort);

        $from = (string) env('MAIL_FROM_EMAIL', $this->username);
        $this->fromEmail = $from !== '' ? $from : $this->username;
        $this->fromName = (string) env('MAIL_FROM_NAME', 'TogoSaaS');
    }

    public static function isConfigured(): bool
    {
        $self = new self();
        return $self->host !== '' && $self->username !== '' && $self->password !== '' && $self->fromEmail !== '';
    }

    public function fromAddress(): string
    {
        return $this->fromEmail;
    }

    /**
     * Envoie un email a plusieurs destinataires sur une seule connexion SMTP.
     *
     * @param list<array{email: string, name?: string|null}> $recipients
     * @param list<array{path: string, name: string, mime: string}> $attachments
     * @param callable|null $progress fonction (string $email, bool $ok, ?string $error)
     * @return array<string, array{ok: bool, error: ?string, detail: ?string}> resultats indexes par email
     *
     * Chaque resultat contient :
     *   - 'error'  : message PUBLIC (masque les details techniques en prod).
     *   - 'detail' : vrai message SMTP/technique (a journaliser cote admin, jamais
     *                expose dans une reponse HTTP publique).
     */
    public function sendBulk(array $recipients, string $subject, string $html, array $attachments = [], ?callable $progress = null): array
    {
        $results = [];

        try {
            $this->connect();
            $this->authenticate();
        } catch (\Throwable $e) {
            // Echec de connexion : tous les destinataires sont marques en echec.
            $error = $this->safeError($e->getMessage());
            $detail = $this->rawError($e->getMessage());
            foreach ($recipients as $r) {
                $email = strtolower(trim((string) $r['email']));
                $results[$email] = ['ok' => false, 'error' => $error, 'detail' => $detail];
                if ($progress) {
                    $progress($email, false, $error);
                }
            }
            $this->close();
            return $results;
        }

        $encodedAttachments = $this->encodeAttachments($attachments);

        foreach ($recipients as $r) {
            $email = strtolower(trim((string) $r['email']));
            $name = isset($r['name']) ? (string) $r['name'] : null;

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $results[$email] = ['ok' => false, 'error' => 'Adresse email invalide.', 'detail' => 'Adresse email invalide.'];
                if ($progress) {
                    $progress($email, false, 'Adresse email invalide.');
                }
                continue;
            }

            try {
                $this->deliver($email, $name, $subject, $html, $encodedAttachments);
                $results[$email] = ['ok' => true, 'error' => null, 'detail' => null];
                if ($progress) {
                    $progress($email, true, null);
                }
            } catch (\Throwable $e) {
                $error = $this->safeError($e->getMessage());
                $results[$email] = ['ok' => false, 'error' => $error, 'detail' => $this->rawError($e->getMessage())];
                if ($progress) {
                    $progress($email, false, $error);
                }
                // Reinitialise l'etat de la session pour le destinataire suivant.
                try {
                    $this->command('RSET', [250]);
                } catch (\Throwable $ignored) {
                    // Connexion probablement perdue : on tente de reconnecter.
                    try {
                        $this->close();
                        $this->connect();
                        $this->authenticate();
                    } catch (\Throwable $fatal) {
                        // Inutile de continuer si la reconnexion echoue.
                        break;
                    }
                }
            }
        }

        try {
            $this->command('QUIT', [221]);
        } catch (\Throwable $ignored) {
        }
        $this->close();

        return $results;
    }

    /** Envoi unitaire (email de test, notification). */
    public function send(string $email, ?string $name, string $subject, string $html, array $attachments = []): array
    {
        $results = $this->sendBulk([['email' => $email, 'name' => $name]], $subject, $html, $attachments);
        return $results[strtolower(trim($email))] ?? ['ok' => false, 'error' => 'Erreur inconnue.', 'detail' => 'Erreur inconnue.'];
    }

    /* --------------------------------------------------------------- */
    /* SMTP bas niveau                                                 */
    /* --------------------------------------------------------------- */

    private function connect(): void
    {
        if (!self::isConfigured()) {
            throw new \RuntimeException('SMTP non configure.');
        }

        $transport = $this->encryption === 'ssl' ? 'ssl://' . $this->host : $this->host;
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
                'allow_self_signed' => false,
            ],
        ]);

        $errno = 0;
        $errstr = '';
        $socket = @stream_socket_client(
            $transport . ':' . $this->port,
            $errno,
            $errstr,
            20,
            STREAM_CLIENT_CONNECT,
            $context
        );

        if ($socket === false) {
            throw new \RuntimeException('Connexion SMTP impossible (' . $errstr . ').');
        }

        $this->socket = $socket;
        stream_set_timeout($this->socket, 20);

        $this->expect([220]);

        $hostname = (string) ($_SERVER['SERVER_NAME'] ?? 'localhost');
        $this->command('EHLO ' . $hostname, [250]);

        if ($this->encryption === 'tls') {
            $this->command('STARTTLS', [220]);
            $crypto = @stream_socket_enable_crypto(
                $this->socket,
                true,
                STREAM_CRYPTO_METHOD_TLS_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_1_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT
            );
            if ($crypto !== true) {
                throw new \RuntimeException('Echec de la negociation TLS.');
            }
            $this->command('EHLO ' . $hostname, [250]);
        }
    }

    private function authenticate(): void
    {
        $this->command('AUTH LOGIN', [334]);
        $this->command(base64_encode($this->username), [334]);
        $this->command(base64_encode($this->password), [235]);
    }

    /**
     * @param list<array{name: string, mime: string, data: string}> $encodedAttachments
     */
    private function deliver(string $email, ?string $name, string $subject, string $html, array $encodedAttachments): void
    {
        $this->command('MAIL FROM:<' . $this->fromEmail . '>', [250]);
        $this->command('RCPT TO:<' . $email . '>', [250, 251]);
        $this->command('DATA', [354]);

        $message = $this->buildMessage($email, $name, $subject, $html, $encodedAttachments);
        // Dot-stuffing : double les points en debut de ligne.
        $message = preg_replace('/^\./m', '..', $message);

        $this->write($message . "\r\n.\r\n");
        $this->expect([250]);
    }

    /** @param int[] $expectedCodes */
    private function command(string $command, array $expectedCodes): void
    {
        $this->write($command . "\r\n");
        $this->expect($expectedCodes);
    }

    private function write(string $data): void
    {
        if ($this->socket === null) {
            throw new \RuntimeException('Socket SMTP ferme.');
        }
        if (@fwrite($this->socket, $data) === false) {
            throw new \RuntimeException('Erreur d\'ecriture SMTP.');
        }
    }

    /** @param int[] $expectedCodes */
    private function expect(array $expectedCodes): void
    {
        $response = $this->readResponse();
        $code = (int) substr($response, 0, 3);
        if (!in_array($code, $expectedCodes, true)) {
            throw new \RuntimeException('Reponse SMTP inattendue : ' . trim($response));
        }
    }

    private function readResponse(): string
    {
        if ($this->socket === null) {
            throw new \RuntimeException('Socket SMTP ferme.');
        }

        $data = '';
        while (($line = fgets($this->socket, 515)) !== false) {
            $data .= $line;
            // Une ligne intermediaire a un '-' en 4e position, la derniere un espace.
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
            $meta = stream_get_meta_data($this->socket);
            if (!empty($meta['timed_out'])) {
                throw new \RuntimeException('Delai SMTP depasse.');
            }
        }

        if ($data === '') {
            throw new \RuntimeException('Aucune reponse du serveur SMTP.');
        }

        return $data;
    }

    private function close(): void
    {
        if (is_resource($this->socket)) {
            @fclose($this->socket);
        }
        $this->socket = null;
    }

    /* --------------------------------------------------------------- */
    /* Construction MIME                                               */
    /* --------------------------------------------------------------- */

    /**
     * @param list<array{path: string, name: string, mime: string}> $attachments
     * @return list<array{name: string, mime: string, data: string}>
     */
    private function encodeAttachments(array $attachments): array
    {
        $out = [];
        foreach ($attachments as $att) {
            $path = (string) ($att['path'] ?? '');
            if ($path === '' || !is_file($path)) {
                continue;
            }
            $contents = @file_get_contents($path);
            if ($contents === false) {
                continue;
            }
            $out[] = [
                'name' => (string) ($att['name'] ?? 'fichier'),
                'mime' => (string) ($att['mime'] ?? 'application/octet-stream'),
                'data' => chunk_split(base64_encode($contents)),
            ];
        }
        return $out;
    }

    /**
     * @param list<array{name: string, mime: string, data: string}> $encodedAttachments
     */
    private function buildMessage(string $email, ?string $name, string $subject, string $html, array $encodedAttachments): string
    {
        $eol = "\r\n";
        $boundaryMixed = 'mixed_' . bin2hex(random_bytes(12));
        $boundaryRelated = 'rel_' . bin2hex(random_bytes(12));
        $boundaryAlt = 'alt_' . bin2hex(random_bytes(12));

        $fromHeader = $this->encodeHeaderName($this->fromName) . ' <' . $this->fromEmail . '>';
        $toHeader = $name !== null && trim($name) !== ''
            ? $this->encodeHeaderName($name) . ' <' . $email . '>'
            : '<' . $email . '>';

        $text = $this->htmlToText($html);
        $hasAttachments = $encodedAttachments !== [];
        $inline = $this->inlineLogo($html);
        $hasInline = $inline !== null;

        $headers = [];
        $headers[] = 'Date: ' . date('r');
        $headers[] = 'From: ' . $fromHeader;
        $headers[] = 'To: ' . $toHeader;
        $headers[] = 'Subject: ' . $this->encodeHeaderValue($subject);
        $headers[] = 'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $this->hostnameForId() . '>';
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'X-Mailer: TogoSaaS-Mailer';

        $body = '';

        if ($hasAttachments) {
            // mixed { (related|alternative) , attachment(s) }
            $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundaryMixed . '"';

            $body .= '--' . $boundaryMixed . $eol;
            if ($hasInline) {
                $body .= 'Content-Type: multipart/related; boundary="' . $boundaryRelated . '"' . $eol . $eol;
                $body .= $this->relatedParts($boundaryRelated, $boundaryAlt, $text, $html, $inline, $eol);
                $body .= $eol;
            } else {
                $body .= 'Content-Type: multipart/alternative; boundary="' . $boundaryAlt . '"' . $eol . $eol;
                $body .= $this->alternativeParts($boundaryAlt, $text, $html, $eol);
                $body .= '--' . $boundaryAlt . '--' . $eol . $eol;
            }

            foreach ($encodedAttachments as $att) {
                $safeName = $this->encodeHeaderValue($att['name']);
                $body .= '--' . $boundaryMixed . $eol;
                $body .= 'Content-Type: ' . $att['mime'] . '; name="' . $safeName . '"' . $eol;
                $body .= 'Content-Transfer-Encoding: base64' . $eol;
                $body .= 'Content-Disposition: attachment; filename="' . $safeName . '"' . $eol . $eol;
                $body .= $att['data'] . $eol;
            }

            $body .= '--' . $boundaryMixed . '--' . $eol;
        } elseif ($hasInline) {
            // related { alternative{text,html} , image-inline }
            $headers[] = 'Content-Type: multipart/related; boundary="' . $boundaryRelated . '"';
            $body .= $this->relatedParts($boundaryRelated, $boundaryAlt, $text, $html, $inline, $eol);
        } else {
            $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundaryAlt . '"';
            $body .= $this->alternativeParts($boundaryAlt, $text, $html, $eol);
            $body .= '--' . $boundaryAlt . '--' . $eol;
        }

        return implode($eol, $headers) . $eol . $eol . $body;
    }

    /**
     * Construit un bloc multipart/related : le multipart/alternative (texte+HTML)
     * suivi de la partie image inline referencee par Content-ID.
     *
     * @param array{cid: string, mime: string, filename: string, data: string} $inline
     */
    private function relatedParts(string $boundaryRelated, string $boundaryAlt, string $text, string $html, array $inline, string $eol): string
    {
        $part = '--' . $boundaryRelated . $eol;
        $part .= 'Content-Type: multipart/alternative; boundary="' . $boundaryAlt . '"' . $eol . $eol;
        $part .= $this->alternativeParts($boundaryAlt, $text, $html, $eol);
        $part .= '--' . $boundaryAlt . '--' . $eol . $eol;

        $part .= '--' . $boundaryRelated . $eol;
        $part .= 'Content-Type: ' . $inline['mime'] . $eol;
        $part .= 'Content-Transfer-Encoding: base64' . $eol;
        $part .= 'Content-ID: <' . $inline['cid'] . '>' . $eol;
        $part .= 'Content-Disposition: inline; filename="' . $inline['filename'] . '"' . $eol . $eol;
        $part .= $inline['data'] . $eol;

        $part .= '--' . $boundaryRelated . '--' . $eol;

        return $part;
    }

    /**
     * Charge le logo de marque a integrer en inline (CID) si le HTML y fait
     * reference (cid:brandlogo) et que le fichier existe cote backend.
     *
     * @return array{cid: string, mime: string, filename: string, data: string}|null
     */
    private function inlineLogo(string $html): ?array
    {
        if (strpos($html, 'cid:brandlogo') === false) {
            return null;
        }

        $path = dirname(__DIR__) . '/assets/email-logo.png';
        if (!is_file($path)) {
            return null;
        }

        $contents = @file_get_contents($path);
        if ($contents === false) {
            return null;
        }

        return [
            'cid' => 'brandlogo',
            'mime' => 'image/png',
            'filename' => 'logo.png',
            'data' => chunk_split(base64_encode($contents)),
        ];
    }

    private function alternativeParts(string $boundary, string $text, string $html, string $eol): string
    {
        $part = '--' . $boundary . $eol;
        $part .= 'Content-Type: text/plain; charset=UTF-8' . $eol;
        $part .= 'Content-Transfer-Encoding: base64' . $eol . $eol;
        $part .= chunk_split(base64_encode($text)) . $eol;

        $part .= '--' . $boundary . $eol;
        $part .= 'Content-Type: text/html; charset=UTF-8' . $eol;
        $part .= 'Content-Transfer-Encoding: base64' . $eol . $eol;
        $part .= chunk_split(base64_encode($html)) . $eol;

        return $part;
    }

    private function encodeHeaderValue(string $value): string
    {
        $value = str_replace(["\r", "\n"], '', $value);
        if (preg_match('/[^\x20-\x7E]/', $value)) {
            return '=?UTF-8?B?' . base64_encode($value) . '?=';
        }
        return $value;
    }

    private function encodeHeaderName(string $name): string
    {
        $name = str_replace(['"', "\r", "\n"], '', trim($name));
        if (preg_match('/[^\x20-\x7E]/', $name)) {
            return '=?UTF-8?B?' . base64_encode($name) . '?=';
        }
        return '"' . $name . '"';
    }

    private function htmlToText(string $html): string
    {
        $text = preg_replace('/<\s*br\s*\/?\s*>/i', "\n", $html) ?? $html;
        $text = preg_replace('/<\/\s*(p|div|h[1-6]|li|tr)\s*>/i', "\n", $text) ?? $text;
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace("/[ \t]+/", ' ', $text) ?? $text;
        $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? $text;
        return trim($text);
    }

    private function hostnameForId(): string
    {
        $domain = strstr($this->fromEmail, '@');
        return $domain !== false ? substr($domain, 1) : 'togosaas.local';
    }

    private function safeError(string $message): string
    {
        // Ne pas divulguer les details techniques en production (reponses HTTP).
        if (TCH_DEBUG) {
            return mb_substr($message, 0, 480);
        }
        return 'Echec de l\'envoi (verifiez la configuration SMTP).';
    }

    /**
     * Vrai message technique (SMTP), independamment d'APP_DEBUG.
     * Destine UNIQUEMENT a la journalisation cote admin (automation_logs.error,
     * email_campaign_recipients.error) : ne jamais le renvoyer dans une reponse
     * HTTP publique. Permet de diagnostiquer un email mal saisi / un refus serveur.
     */
    private function rawError(string $message): string
    {
        $message = trim($message);
        if ($message === '') {
            return 'Echec inconnu.';
        }
        return mb_substr($message, 0, 480);
    }
}
