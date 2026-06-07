<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Auth;
use TCH\Request;
use TCH\Response;
use TCH\UploadHelper;

final class UploadController
{
    public function store(Request $request): void
    {
        Auth::requireUser();

        if (empty($_FILES['file'])) {
            Response::error('Aucun fichier envoye.', 422);
        }

        $path = UploadHelper::store($_FILES['file']);
        Response::success(['url' => $path], 'Fichier enregistre.', 201);
    }
}
