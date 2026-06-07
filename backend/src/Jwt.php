<?php

declare(strict_types=1);

namespace TCH;

/**
 * Implementation minimale de JSON Web Token (HS256), sans dependance externe.
 */
final class Jwt
{
    public static function encode(array $payload): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];

        $now = time();
        $ttl = (int) env('JWT_TTL', 86400);
        $payload = array_merge([
            'iss' => (string) env('JWT_ISSUER', 'tch-api'),
            'iat' => $now,
            'exp' => $now + $ttl,
        ], $payload);

        $segments = [
            self::base64UrlEncode(json_encode($header, JSON_UNESCAPED_SLASHES)),
            self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES)),
        ];

        $signingInput = implode('.', $segments);
        $signature = self::sign($signingInput);
        $segments[] = self::base64UrlEncode($signature);

        return implode('.', $segments);
    }

    /**
     * @return array|null Payload decode ou null si invalide/expire.
     */
    public static function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        $expected = self::sign("{$headerB64}.{$payloadB64}");
        $provided = self::base64UrlDecode($signatureB64);

        if (!hash_equals($expected, $provided)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($payloadB64), true);
        if (!is_array($payload)) {
            return null;
        }

        if (isset($payload['exp']) && time() >= (int) $payload['exp']) {
            return null;
        }

        return $payload;
    }

    private static function sign(string $input): string
    {
        $secret = (string) env('JWT_SECRET', 'insecure-default-secret');
        return hash_hmac('sha256', $input, $secret, true);
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }
}
