<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Database;
use TCH\RateLimiter;
use TCH\Request;
use TCH\Response;
use TCH\Validator;

final class ContactController
{
    public function store(Request $request): void
    {
        RateLimiter::enforce('contact', 5, 600); // 5 messages / 10 min / IP

        Validator::make($request->all())->validate([
            'name' => 'required|min:2|max:120',
            'email' => 'required|email|max:160',
            'subject' => 'max:200',
            'message' => 'required|min:10|max:3000',
        ])->abortIfFails();

        $stmt = Database::connection()->prepare(
            'INSERT INTO contact_messages (name, email, subject, message, is_read, created_at)
             VALUES (:name, :email, :subject, :message, 0, NOW())'
        );
        $stmt->execute([
            'name' => trim((string) $request->input('name')),
            'email' => strtolower(trim((string) $request->input('email'))),
            'subject' => $request->input('subject') ? trim((string) $request->input('subject')) : 'Sans objet',
            'message' => trim((string) $request->input('message')),
        ]);

        Response::success(null, 'Merci ! Votre message a bien ete envoye.', 201);
    }
}
