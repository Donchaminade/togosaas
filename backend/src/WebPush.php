<?php

declare(strict_types=1);

namespace TCH;

/**
 * Envoi de notifications Web Push en PHP pur (sans Composer).
 *
 * Implemente le protocole Web Push :
 *   - VAPID : JWT signe en ES256 (P-256) via openssl.
 *   - Chiffrement du payload : content-encoding "aes128gcm" (RFC 8188)
 *     avec derivation ECDH P-256 + HKDF (RFC 8291).
 *   - Envoi HTTP au endpoint via cURL.
 *
 * Pre-requis serveur : extensions openssl + curl, et hash_hkdf()
 * (PHP >= 7.1.2) + openssl_pkey_derive() (PHP >= 7.3). Hostinger les fournit.
 *
 * Les cles VAPID sont lues dans l'environnement (jamais commitees) :
 *   VAPID_PUBLIC_KEY  (point public non compresse, base64url — 65 octets)
 *   VAPID_PRIVATE_KEY (scalaire prive, base64url — 32 octets)
 *   VAPID_SUBJECT     (mailto:... ou https://...)
 *
 * Toute la classe est defensive : aucune exception ne remonte vers la requete
 * hote, on renvoie toujours un tableau de statut.
 */
final class WebPush
{
    /** Taille de record annoncee dans l'entete aes128gcm. */
    private const RECORD_SIZE = 4096;

    /** Duree de vie du JWT VAPID (12 h, max autorise 24 h). */
    private const JWT_TTL = 43200;

    /**
     * La fonctionnalite est-elle configuree et techniquement disponible ?
     */
    public static function isConfigured(): bool
    {
        if (self::publicKey() === null || self::privateKey() === null || self::subject() === null) {
            return false;
        }
        return extension_loaded('openssl')
            && function_exists('hash_hkdf')
            && function_exists('openssl_pkey_derive')
            && function_exists('curl_init');
    }

    /**
     * Envoie une notification a un abonnement.
     *
     * @param array{endpoint:string,p256dh:string,auth:string} $subscription
     * @param string $payload Charge utile (JSON) deja serialisee.
     * @return array{ok:bool,status:int,expired:bool,error:?string}
     */
    public static function send(array $subscription, string $payload): array
    {
        $fail = static fn(string $error, int $status = 0, bool $expired = false): array
            => ['ok' => false, 'status' => $status, 'expired' => $expired, 'error' => $error];

        try {
            if (!self::isConfigured()) {
                return $fail('Web Push non configure (cles VAPID ou extensions manquantes).');
            }

            $endpoint = (string) ($subscription['endpoint'] ?? '');
            if ($endpoint === '' || !filter_var($endpoint, FILTER_VALIDATE_URL)) {
                return $fail('Endpoint invalide.');
            }

            $uaPublic = self::b64urlDecode((string) ($subscription['p256dh'] ?? ''));
            $authSecret = self::b64urlDecode((string) ($subscription['auth'] ?? ''));
            if (strlen($uaPublic) !== 65 || $uaPublic[0] !== "\x04") {
                return $fail('Cle publique d\'abonnement invalide.');
            }
            if (strlen($authSecret) !== 16) {
                return $fail('Secret d\'authentification d\'abonnement invalide.');
            }

            // 1-7. Chiffrement aes128gcm du payload pour cet abonnement.
            $body = self::encryptBody($uaPublic, $authSecret, $payload);
            if ($body === null) {
                return $fail('Chiffrement du payload impossible.');
            }

            // 8. JWT VAPID signe en ES256.
            $jwt = self::buildVapidJwt($endpoint);
            if ($jwt === null) {
                return $fail('Signature VAPID impossible (cle privee invalide).');
            }

            // 9. Envoi HTTP.
            return self::dispatch($endpoint, $body, $jwt);
        } catch (\Throwable $e) {
            return $fail(TCH_DEBUG ? $e->getMessage() : 'Erreur interne Web Push.');
        }
    }

    /* ----------------------------------------------------------------- */
    /* Chiffrement aes128gcm (RFC 8188 + 8291)                            */
    /* ----------------------------------------------------------------- */

    /**
     * Chiffre $payload pour l'abonne (ua_public 65 oct., auth 16 oct.) et
     * renvoie le corps complet aes128gcm (entete + ciphertext + tag).
     */
    private static function encryptBody(string $uaPublic, string $authSecret, string $payload): ?string
    {
        // 1. Paire de cles ephemere (application server) pour cet envoi.
        $asKey = self::newEcKey();
        if ($asKey === null) {
            return null;
        }
        $asDetails = openssl_pkey_get_details($asKey);
        if ($asDetails === false || !isset($asDetails['ec']['x'], $asDetails['ec']['y'])) {
            return null;
        }
        $asPublic = "\x04" . self::pad32($asDetails['ec']['x']) . self::pad32($asDetails['ec']['y']);

        // 2. Secret partage ECDH(as_private, ua_public).
        $uaPublicPem = self::publicPemFromPoint($uaPublic);
        $sharedSecret = openssl_pkey_derive($uaPublicPem, $asKey, 32);
        if ($sharedSecret === false || strlen($sharedSecret) === 0) {
            return null;
        }

        // 3. IKM (RFC 8291) : HKDF(salt=auth, ikm=ecdh, info="WebPush: info"||0||ua||as).
        $keyInfo = 'WebPush: info' . "\x00" . $uaPublic . $asPublic;
        $ikm = hash_hkdf('sha256', $sharedSecret, 32, $keyInfo, $authSecret);

        // 4. CEK + NONCE (RFC 8188) a partir d'un sel aleatoire.
        $salt = random_bytes(16);
        $cek = hash_hkdf('sha256', $ikm, 16, "Content-Encoding: aes128gcm\x00", $salt);
        $nonce = hash_hkdf('sha256', $ikm, 12, "Content-Encoding: nonce\x00", $salt);

        // 5. Texte clair : payload + delimiteur d'enregistrement (0x02 = dernier).
        $plaintext = $payload . "\x02";

        // 6. Chiffrement AES-128-GCM (AAD vide), tag de 16 octets accole.
        $tag = '';
        $cipher = openssl_encrypt(
            $plaintext,
            'aes-128-gcm',
            $cek,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag,
            '',
            16
        );
        if ($cipher === false) {
            return null;
        }

        // 7. Corps aes128gcm : header (salt|rs|idlen|keyid=as_public) + ciphertext+tag.
        $header = $salt
            . pack('N', self::RECORD_SIZE)
            . chr(strlen($asPublic))
            . $asPublic;

        return $header . $cipher . $tag;
    }

    /* ----------------------------------------------------------------- */
    /* VAPID / JWT                                                        */
    /* ----------------------------------------------------------------- */

    private static function buildVapidJwt(string $endpoint): ?string
    {
        $parts = parse_url($endpoint);
        if ($parts === false || !isset($parts['scheme'], $parts['host'])) {
            return null;
        }
        $audience = $parts['scheme'] . '://' . $parts['host'];
        if (isset($parts['port'])) {
            $audience .= ':' . $parts['port'];
        }

        $header = self::b64urlEncode((string) json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
        $claims = self::b64urlEncode((string) json_encode([
            'aud' => $audience,
            'exp' => time() + self::JWT_TTL,
            'sub' => self::subject(),
        ]));
        $signingInput = $header . '.' . $claims;

        $privatePem = self::vapidPrivatePem();
        if ($privatePem === null) {
            return null;
        }
        $pkey = openssl_pkey_get_private($privatePem);
        if ($pkey === false) {
            return null;
        }

        $derSignature = '';
        if (!openssl_sign($signingInput, $derSignature, $pkey, OPENSSL_ALGO_SHA256)) {
            return null;
        }
        $rawSignature = self::derToRawSignature($derSignature);
        if ($rawSignature === null) {
            return null;
        }

        return $signingInput . '.' . self::b64urlEncode($rawSignature);
    }

    /** Reconstruit le PEM de la cle privee VAPID a partir des valeurs brutes. */
    private static function vapidPrivatePem(): ?string
    {
        $d = self::b64urlDecode((string) self::privateKey());
        $pub = self::b64urlDecode((string) self::publicKey());
        if (strlen($d) !== 32 || strlen($pub) !== 65) {
            return null;
        }
        return self::privatePemFromRaw($d, $pub);
    }

    /* ----------------------------------------------------------------- */
    /* Envoi HTTP                                                         */
    /* ----------------------------------------------------------------- */

    /** @return array{ok:bool,status:int,expired:bool,error:?string} */
    private static function dispatch(string $endpoint, string $body, string $jwt): array
    {
        $headers = [
            'Authorization: vapid t=' . $jwt . ', k=' . self::publicKey(),
            'Content-Encoding: aes128gcm',
            'Content-Type: application/octet-stream',
            'TTL: 2419200',
            'Content-Length: ' . strlen($body),
        ];

        $ch = curl_init($endpoint);
        if ($ch === false) {
            return ['ok' => false, 'status' => 0, 'expired' => false, 'error' => 'cURL indisponible.'];
        }

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);

        $response = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false && $status === 0) {
            return ['ok' => false, 'status' => 0, 'expired' => false, 'error' => $curlError ?: 'Echec reseau.'];
        }

        // 201/200/202 = accepte. 404/410 = abonnement expire (a purger).
        $ok = in_array($status, [200, 201, 202], true);
        $expired = in_array($status, [404, 410], true);
        $error = $ok ? null : ('Statut ' . $status . ($response ? ' : ' . mb_substr((string) $response, 0, 200) : ''));

        return ['ok' => $ok, 'status' => $status, 'expired' => $expired, 'error' => $error];
    }

    /* ----------------------------------------------------------------- */
    /* Outils cryptographiques / encodage                                */
    /* ----------------------------------------------------------------- */

    /** Cree une paire de cles EC P-256 (tolerant a l'absence de openssl.cnf sous Windows). */
    private static function newEcKey()
    {
        $base = [
            'private_key_type' => OPENSSL_KEYTYPE_EC,
            'curve_name' => 'prime256v1',
        ];

        $key = @openssl_pkey_new($base);
        if ($key !== false) {
            return $key;
        }

        // Repli : fournir explicitement un fichier de config (utile sous Windows/XAMPP).
        foreach (self::opensslConfigCandidates() as $cnf) {
            $key = @openssl_pkey_new($base + ['config' => $cnf]);
            if ($key !== false) {
                return $key;
            }
        }
        return null;
    }

    /** @return list<string> */
    private static function opensslConfigCandidates(): array
    {
        $candidates = [];
        $env = getenv('OPENSSL_CONF');
        if (is_string($env) && $env !== '') {
            $candidates[] = $env;
        }
        $candidates[] = 'C:/xampp/apache/conf/openssl.cnf';
        $candidates[] = 'C:/xampp/php/extras/ssl/openssl.cnf';
        return array_values(array_filter($candidates, 'is_file'));
    }

    /** Construit un PEM "PUBLIC KEY" (SPKI) a partir d'un point non compresse (65 octets). */
    private static function publicPemFromPoint(string $point): string
    {
        // SEQUENCE { SEQUENCE { OID ecPublicKey, OID prime256v1 }, BIT STRING point }
        $der = "\x30\x59"
            . "\x30\x13"
            . "\x06\x07\x2a\x86\x48\xce\x3d\x02\x01"
            . "\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07"
            . "\x03\x42\x00" . $point;

        return self::derToPem($der, 'PUBLIC KEY');
    }

    /** Construit un PEM "PRIVATE KEY" (PKCS8) a partir du scalaire (32) + point public (65). */
    private static function privatePemFromRaw(string $d, string $point): string
    {
        $pubXY = substr($point, 1); // retire l'octet 0x04 -> 64 octets
        $der = "\x30\x81\x87"
            . "\x02\x01\x00"
            . "\x30\x13"
            . "\x06\x07\x2a\x86\x48\xce\x3d\x02\x01"
            . "\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07"
            . "\x04\x6d"
            . "\x30\x6b"
            . "\x02\x01\x01"
            . "\x04\x20" . $d
            . "\xa1\x44"
            . "\x03\x42\x00\x04" . $pubXY;

        return self::derToPem($der, 'PRIVATE KEY');
    }

    private static function derToPem(string $der, string $label): string
    {
        return "-----BEGIN {$label}-----\n"
            . chunk_split(base64_encode($der), 64, "\n")
            . "-----END {$label}-----\n";
    }

    /** Convertit une signature ECDSA DER en R||S brut (64 octets). */
    private static function derToRawSignature(string $der): ?string
    {
        $offset = 0;
        $len = strlen($der);
        if ($len < 8 || $der[$offset++] !== "\x30") {
            return null;
        }
        // Longueur de la SEQUENCE (forme courte attendue pour P-256).
        $seqLen = ord($der[$offset++]);
        if ($seqLen & 0x80) {
            // Forme longue : on saute les octets de longueur.
            $n = $seqLen & 0x7f;
            $offset += $n;
        }

        $readInt = static function (string $der, int &$offset) use ($len): ?string {
            if ($offset >= $len || $der[$offset++] !== "\x02") {
                return null;
            }
            $intLen = ord($der[$offset++]);
            if ($offset + $intLen > $len) {
                return null;
            }
            $val = substr($der, $offset, $intLen);
            $offset += $intLen;
            // Retire les zeros de tete (issus de l'encodage DER des entiers signes).
            $val = ltrim($val, "\x00");
            // Re-pad a 32 octets.
            return str_pad($val, 32, "\x00", STR_PAD_LEFT);
        };

        $r = $readInt($der, $offset);
        $s = $readInt($der, $offset);
        if ($r === null || $s === null || strlen($r) !== 32 || strlen($s) !== 32) {
            return null;
        }
        return $r . $s;
    }

    private static function pad32(string $s): string
    {
        return str_pad($s, 32, "\x00", STR_PAD_LEFT);
    }

    public static function b64urlEncode(string $bin): string
    {
        return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
    }

    public static function b64urlDecode(string $txt): string
    {
        $txt = strtr($txt, '-_', '+/');
        $remainder = strlen($txt) % 4;
        if ($remainder) {
            $txt .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode($txt) ?: '';
    }

    /* ----------------------------------------------------------------- */
    /* Config                                                            */
    /* ----------------------------------------------------------------- */

    private static function publicKey(): ?string
    {
        $v = env('VAPID_PUBLIC_KEY');
        return is_string($v) && $v !== '' ? $v : null;
    }

    private static function privateKey(): ?string
    {
        $v = env('VAPID_PRIVATE_KEY');
        return is_string($v) && $v !== '' ? $v : null;
    }

    private static function subject(): ?string
    {
        $v = env('VAPID_SUBJECT');
        return is_string($v) && $v !== '' ? $v : null;
    }
}
