# Sécurité — Backend TogoSaaS API

Audit réalisé le 24 juin 2026. Ce document liste les constats, les correctifs appliqués et les recommandations restantes.

## Constats (avant correctifs)

| Sévérité | Problème | Fichier(s) |
|----------|----------|------------|
| **Élevée** | CORS permissif : fallback `*` ou origine arbitraire si `FRONTEND_URL` absent | `public/index.php` |
| **Élevée** | Secret JWT par défaut (`insecure-default-secret`), pas de longueur minimale | `src/Jwt.php` |
| **Élevée** | Pas de validation de l'algorithme JWT (risque de confusion d'algo) | `src/Jwt.php` |
| **Moyenne** | Fuites d'informations : messages PDO bruts, routes 404 détaillées, exceptions non capturées | `Database.php`, `Router.php`, `bootstrap.php` |
| **Moyenne** | Uploads : pas de `is_uploaded_file()`, pas de vérification image réelle, résolution de chemin faible | `UploadHelper.php`, `*AttachmentHelper.php` |
| **Moyenne** | Métadonnées client (`mime`, `originalName`) utilisées telles quelles au téléchargement | `SupportController.php`, `ReportController.php` |
| **Faible** | Absence de headers de sécurité HTTP | `Response.php`, `index.php` |
| **Faible** | Pas de rate limiting sur `/auth/login`, `/auth/register`, `/contact` | — |
| **Info** | Scripts de migration HTTP publics (`migrate-once.php`, `run-migrations.php`) protégés par token mais exposent les erreurs SQL | `public/` |

### Points positifs déjà en place

- Requêtes SQL paramétrées (PDO prepared statements) dans tous les contrôleurs
- Mots de passe hashés avec `PASSWORD_BCRYPT`
- Routes `/admin/*` protégées par `Auth::requireAdmin()`
- Routes `/lead/*` protégées par `Auth::requireUser()` + contrôle de rôle/membership
- Pas de mass assignment direct : mapping explicite via `CommunityHelper::columnsFromRequest()`
- Contrôle IDOR sur les communautés via `CommunityAccessHelper::requireMember()`
- Fichiers support/reports stockés hors webroot (`storage/support`, `storage/reports`)

---

## Correctifs appliqués

### 1. CORS strict (`FRONTEND_URL` uniquement)

- Nouveau helper `Security::applyCors()` : n'émet `Access-Control-Allow-Origin` que si l'origine correspond exactement à `FRONTEND_URL`
- Suppression du fallback `*` et de `FRONTEND_URLS` multi-origines
- Pas de header CORS pour les origines non autorisées

**Fichiers :** `src/Security.php`, `public/index.php`

### 2. Headers de sécurité

Ajoutés sur toutes les réponses JSON et les téléchargements de fichiers :

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

**Fichiers :** `src/Security.php`, `src/Response.php`, `public/index.php`

### 3. Erreurs production-safe

- `Security::publicMessage()` masque les messages contenant SQLSTATE, noms de tables, stack traces en production
- Handler global d'exceptions dans `bootstrap.php`
- Erreurs 404 génériques hors debug
- Connexion BDD : message générique + log serveur

**Fichiers :** `src/Security.php`, `src/Response.php`, `src/bootstrap.php`, `src/Database.php`, `src/Router.php`

### 4. JWT durci

- `JWT_SECRET` obligatoire, minimum 32 caractères (plus de valeur par défaut)
- Validation stricte de l'en-tête `alg: HS256` à la décodification
- Vérification du claim `iss` si présent

**Fichier :** `src/Jwt.php`

### 5. Uploads renforcés

- Vérification `is_uploaded_file()` avant traitement
- Détection MIME via `finfo` + `getimagesize()` pour les images
- Résolution de chemin avec `realpath()` et confinement au répertoire de base (anti path traversal)
- Noms de fichiers originaux nettoyés côté serveur

**Fichiers :** `src/UploadHelper.php`, `src/SupportAttachmentHelper.php`, `src/ReportEvidenceHelper.php`

### 6. Métadonnées d'attachments

- `validateKeys()` relit le MIME réel depuis le disque (ignore le MIME client)
- Téléchargements (`streamAttachment`, `adminEvidence`) utilisent `mimeForPath()` au lieu des métadonnées stockées
- Noms de fichiers sanitizés à la sortie

**Fichiers :** `src/SupportAttachmentHelper.php`, `src/ReportEvidenceHelper.php`, `src/Controllers/SupportController.php`, `src/Controllers/ReportController.php`

---

## Configuration requise

```env
# Obligatoire en production
FRONTEND_URL=https://votre-domaine.com
JWT_SECRET=<au moins 32 caractères aléatoires>
APP_DEBUG=false

# Recommandé
JWT_ISSUER=tch-api
JWT_TTL=86400
MIGRATE_TOKEN=<token distinct de JWT_SECRET>
```

Générer un secret fort :

```bash
openssl rand -base64 48
```

---

## Recommandations restantes (non implémentées)

1. **Rate limiting** — Ajouter une limite par IP sur `/auth/login`, `/auth/register`, `/contact`, `/reports` (Redis, fichier ou middleware Apache/Nginx)
2. **Supprimer les scripts de migration HTTP** — `public/migrate-once.php` et `public/run-migrations.php` après déploiement ; utiliser SSH/CLI uniquement
3. **HSTS** — Configurer `Strict-Transport-Security` au niveau du reverse proxy (Nginx/Apache/Vercel)
4. **CSP** — Content-Security-Policy si l'API sert du HTML un jour
5. **Rotation JWT** — Envisager un mécanisme de révocation (blacklist ou refresh tokens) si des comptes sont compromis
6. **Audit des dépendances** — Pas de Composer lock externe critique actuellement (API sans dépendances tierces)
7. **Logs structurés** — Centraliser les logs d'auth échouée et tentatives suspectes
8. **Mot de passe** — Augmenter le minimum à 8+ caractères et ajouter une politique de complexité si souhaité
9. **FRONTEND_URLS** — Si plusieurs origines sont nécessaires (preview Vercel), réintroduire une liste explicite contrôlée via env, jamais de wildcard

---

## Vérification manuelle

- [ ] `APP_DEBUG=false` : erreur BDD → message générique, pas de nom de table
- [ ] Origine non autorisée → pas de header `Access-Control-Allow-Origin`
- [ ] Origine = `FRONTEND_URL` → CORS OK avec credentials
- [ ] Login sans `JWT_SECRET` valide → échec contrôlé
- [ ] Upload `.php` renommé en `.jpg` → rejeté
- [ ] Routes `/admin/*` sans token → 401/403
