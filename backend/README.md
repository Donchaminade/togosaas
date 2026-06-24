# TogoSaaS — API Backend (PHP / MySQL)

API REST sans framework pour la plateforme TogoSaaS — Hub SaaS du Togo.

## Démarrage rapide

```bash
cp .env.example .env          # renseigner DB_*, JWT_SECRET, ADMIN_*
php database/migrate.php      # crée la base + tables
php database/seed.php         # admin + lead démo + communautés
php -S localhost:8000 -t public public/router.php
```

API disponible sur `http://localhost:8000`.

## Commandes utiles

| Commande | Effet |
|----------|-------|
| `php database/migrate.php` | Applique les migrations en attente |
| `php database/migrate.php --fresh` | Supprime toutes les tables puis re-migre |
| `php database/seed.php` | Insère les données initiales |

## Authentification

JWT (HS256) transmis via le header `Authorization: Bearer <token>`.
Deux rôles : `lead` (par défaut à l'inscription) et `admin`.

## Tables

- `users` — leads & admins (email unique, mot de passe haché bcrypt)
- `communities` — communautés (statut `pending` / `approved` / `rejected`)
- `contact_messages` — messages du formulaire de contact
- `migrations` — suivi des migrations appliquées

## Déploiement Apache

Pointer le `DocumentRoot` vers `backend/public`. Le `.htaccess` fourni
réécrit toutes les requêtes vers `index.php` et préserve le header
`Authorization`.
