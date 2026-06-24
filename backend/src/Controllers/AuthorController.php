<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Auth;
use TCH\AuthorHelper;
use TCH\Database;
use TCH\Request;
use TCH\Response;
use TCH\Validator;

final class AuthorController
{
    /** Profil public affiche sur la page A propos. */
    public function show(Request $request): void
    {
        Response::success(['author' => AuthorHelper::serialize(AuthorHelper::get())]);
    }

    public function adminShow(Request $request): void
    {
        Auth::requireSuperAdmin();
        Response::success(['author' => AuthorHelper::serialize(AuthorHelper::get())]);
    }

    public function adminUpdate(Request $request): void
    {
        Auth::requireSuperAdmin();

        Validator::make($request->all())->validate([
            'name' => 'required|min:2|max:160',
            'roleLabel' => 'required|max:160',
            'badgeLabel' => 'required|max:120',
            'quote' => 'required|min:10|max:2000',
            'bio' => 'required|min:10|max:2000',
        ])->abortIfFails();

        $cols = AuthorHelper::columnsFromRequest($request);
        $sets = [];
        foreach (array_keys($cols) as $field) {
            $sets[] = "$field = :$field";
        }

        Database::connection()->prepare(
            'UPDATE site_author SET ' . implode(', ', $sets) . ', updated_at = NOW() WHERE id = 1'
        )->execute($cols);

        Response::success(
            ['author' => AuthorHelper::serialize(AuthorHelper::get())],
            'Profil fondateur mis a jour.'
        );
    }
}
