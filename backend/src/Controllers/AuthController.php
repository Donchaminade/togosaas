<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Auth;
use TCH\AutomationEngine;
use TCH\Database;
use TCH\Jwt;
use TCH\RateLimiter;
use TCH\Request;
use TCH\Response;
use TCH\Validator;

final class AuthController
{
    public function register(Request $request): void
    {
        RateLimiter::enforce('register', 5, 3600); // 5 inscriptions / heure / IP

        Validator::make($request->all())->validate([
            'name' => 'required|min:2|max:120',
            'email' => 'required|email|max:160',
            'password' => 'required|min:6|max:72',
            'passwordConfirmation' => 'required|same:password',
            'phone' => 'max:40',
        ])->abortIfFails();

        $db = Database::connection();

        $email = strtolower(trim((string) $request->input('email')));

        $check = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $check->execute(['email' => $email]);
        if ($check->fetch()) {
            Response::error('Un compte existe deja avec cet email.', 409);
        }

        $stmt = $db->prepare(
            'INSERT INTO users (name, email, password_hash, phone, role, created_at)
             VALUES (:name, :email, :hash, :phone, :role, NOW())'
        );
        $stmt->execute([
            'name' => trim((string) $request->input('name')),
            'email' => $email,
            'hash' => password_hash((string) $request->input('password'), PASSWORD_BCRYPT),
            'phone' => $request->input('phone') ? trim((string) $request->input('phone')) : null,
            'role' => 'lead',
        ]);

        $id = (int) $db->lastInsertId();
        $name = trim((string) $request->input('name'));

        AutomationEngine::fire('lead_register', [
            'email' => $email,
            'name' => $name,
            'nom' => $name,
            'user_id' => $id,
        ]);

        $this->respondWithToken($id, 'Compte cree avec succes. Bienvenue !', 201);
    }

    public function login(Request $request): void
    {
        RateLimiter::enforce('login', 8, 300); // 8 tentatives / 5 min / IP

        Validator::make($request->all())->validate([
            'email' => 'required|email',
            'password' => 'required',
        ])->abortIfFails();

        $email = strtolower(trim((string) $request->input('email')));

        $stmt = Database::connection()->prepare(
            'SELECT id, password_hash FROM users WHERE email = :email LIMIT 1'
        );
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();

        if (!$row || !password_verify((string) $request->input('password'), $row['password_hash'])) {
            Response::error('Email ou mot de passe incorrect.', 401);
        }

        $this->respondWithToken((int) $row['id'], 'Connexion reussie.');
    }

    public function me(Request $request): void
    {
        $user = Auth::requireUser();
        Response::success(['user' => $this->publicUser($user)]);
    }

    public function updateProfile(Request $request): void
    {
        $user = Auth::requireUser();
        Validator::make($request->all())->validate([
            'name' => 'required|min:2|max:120',
            'phone' => 'max:40',
            'avatarUrl' => 'max:500',
        ])->abortIfFails();

        $db = Database::connection();

        $avatarUrl = array_key_exists('avatarUrl', $request->all())
            ? self::normalizeAvatarUrl($request->input('avatarUrl'))
            : ($user['avatar_url'] ?? null);

        // Changement de mot de passe optionnel.
        $newPassword = (string) ($request->input('newPassword') ?? '');
        if ($newPassword !== '') {
            Validator::make($request->all())->validate([
                'currentPassword' => 'required',
                'newPassword' => 'required|min:6|max:72',
                'newPasswordConfirmation' => 'required|same:newPassword',
            ])->abortIfFails();

            $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => (int) $user['id']]);
            $row = $stmt->fetch();
            if (!$row || !password_verify((string) $request->input('currentPassword'), $row['password_hash'])) {
                Response::error('Le mot de passe actuel est incorrect.', 422);
            }

            $db->prepare('UPDATE users SET password_hash = :hash, updated_at = NOW() WHERE id = :id')
                ->execute([
                    'hash' => password_hash($newPassword, PASSWORD_BCRYPT),
                    'id' => (int) $user['id'],
                ]);
        }

        $db->prepare(
            'UPDATE users SET name = :name, phone = :phone, avatar_url = :avatar_url, updated_at = NOW() WHERE id = :id'
        )->execute([
            'name' => trim((string) $request->input('name')),
            'phone' => $request->input('phone') ? trim((string) $request->input('phone')) : null,
            'avatar_url' => $avatarUrl,
            'id' => (int) $user['id'],
        ]);

        $stmt = $db->prepare(
            'SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = :id'
        );
        $stmt->execute(['id' => (int) $user['id']]);
        Response::success(['user' => $this->publicUser($stmt->fetch())], 'Profil mis a jour.');
    }

    private static function normalizeAvatarUrl(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $url = trim((string) $value);
        if ($url === '') {
            return null;
        }
        if (!str_starts_with($url, '/uploads/')) {
            Response::error('URL de photo invalide.', 422);
        }
        return mb_substr($url, 0, 500);
    }

    private function respondWithToken(int $userId, string $message, int $status = 200): void
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = :id'
        );
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();

        $token = Jwt::encode([
            'sub' => $userId,
            'role' => $user['role'],
            'email' => $user['email'],
        ]);

        Response::success([
            'token' => $token,
            'user' => $this->publicUser($user),
        ], $message, $status);
    }

    private function publicUser(array $user): array
    {
        return [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'phone' => $user['phone'] ?? null,
            'avatarUrl' => $user['avatar_url'] ?? null,
            'createdAt' => $user['created_at'] ?? null,
        ];
    }
}
