<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Request;
use TCH\Response;

final class MetaController
{
    /** Donnees de reference utiles au frontend (pays + tags). */
    public function meta(Request $request): void
    {
        Response::success([
            'countries' => CommunityController::COUNTRIES,
            'tags' => CommunityController::TAGS,
        ]);
    }
}
