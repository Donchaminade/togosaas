<div align="center">

# T.C.H — Togo Communities Hub

**La vitrine qui recense, valorise et connecte les communautés du Togo.**

Annuaire public · Espace lead · Modération admin · Signalements anonymes

*Idée et conception : Chaminade Dondah Adjolou*

</div>

---

## Sommaire

1. [Le problème que nous résolvons](#le-problème-que-nous-résolvons)
2. [Notre réponse](#notre-réponse)
3. [Fonctionnalités](#fonctionnalités)
4. [Peut-on déployer maintenant ?](#peut-on-déployer-maintenant-)
5. [Stack technique](#stack-technique)
6. [Installation (développement)](#installation-développement)
7. [Déploiement (production)](#déploiement-production)
8. [Routes & rôles](#routes--rôles)
9. [API (aperçu)](#api-aperçu)
10. [Comptes de démonstration](#comptes-de-démonstration)

---

## Le problème que nous résolvons

Au Togo, les **communautés** — tech, culture, sport, citoyenneté, entrepreneuriat, créatif — existent et bougent. Mais pour une personne qui veut **rejoindre**, **participer** ou simplement **savoir où frapper**, le parcours est souvent frustrant :

| Situation | Ce qui se passe aujourd'hui |
|-----------|----------------------------|
| **Trouver une communauté** | Infos éparpillées sur WhatsApp, Facebook, bouche-à-oreille, anciens liens morts |
| **Contacter un responsable** | Pas de point d'entrée clair : qui est le lead ? quel email ? quel réseau est encore actif ? |
| **Savoir si c'est sérieux** | Difficile de distinguer un groupe actif d'une page abandonnée |
| **Exposer sa propre communauté** | Pas de vitrine centrale : visibilité limitée, pas de référencement commun |
| **Signaler un abus** | Peur de se faire identifier, pas de canal structuré et confidentiel |

**En résumé :** il manque un **hub de confiance** — un endroit unique où l'on **découvre**, **vérifie** et **rejoint** les communautés togolaises, et où les responsables peuvent **exister officiellement** en ligne.

---

## Notre réponse

**T.C.H (Togo Communities Hub)** est une plateforme web qui :

1. **Recense** les communautés togolaises dans un annuaire public, filtrable par ville et thématique
2. **Valorise** chaque communauté via une fiche riche (mission, événements, liens, galerie, co-leads)
3. **Connecte** visiteurs et responsables grâce à des coordonnées publiques vérifiées et un canal de contact central
4. **Protège** l'écosystème via une modération admin et un système de **signalements 100 % anonymes**

> T.C.H n'est pas un réseau social. C'est une **vitrine + annuaire + espace de gestion** pour les communautés, avec une équipe qui valide ce qui est publié.

---

## Fonctionnalités

### Site public (visiteur)

| Fonctionnalité | Description |
|----------------|-------------|
| **Accueil** | Hero animé, statistiques live (communautés, villes, thématiques), CTA inscription et exploration |
| **Annuaire `/communautes`** | Liste des communautés **approuvées**, recherche texte, filtres par **ville du Togo** et par **tag** |
| **Fiche communauté** | Bannière, logo, description, mission, co-leads, galerie, réseaux sociaux, site web, calendrier d'événements |
| **À propos** | Histoire du projet, piliers, profil fondateur (éditable par l'admin) |
| **Contact** | Formulaire vers l'équipe T.C.H + coordonnées |
| **Signalement anonyme** | Tout visiteur ou membre peut signaler une communauté ou un lead, avec preuves, **sans compte** |
| **Suivi de signalement** | Code unique `TCH-XXXX-XXXX-XXXX` pour suivre l'avancement sans révéler son identité |
| **Inscription lead** | Création de compte pour exposer et gérer une communauté |
| **Thème clair / sombre** | Interface adaptée jour et nuit |
| **Navbar flottante** | Navigation moderne, responsive |

### Espace lead (`/espace-lead`)

Pour les responsables de communautés :

| Fonctionnalité | Description |
|----------------|-------------|
| **Tableau de bord** | Vue d'ensemble : communautés, statuts, messages admin non lus |
| **Créer une communauté** | Formulaire complet → soumission en attente de validation |
| **Modifier sa fiche** | Logo, bannière, descriptions, tags, ville, liens, galerie, effectif, etc. |
| **Co-leads** | Désigner des co-responsables (compte existant requis) avec droits limités |
| **Événements** | CRUD d'événements publics (titre, dates, lieu, lien d'inscription) |
| **Chat support** | Messagerie directe avec l'équipe admin |
| **Profil** | Mise à jour nom et téléphone |
| **Workflow validation** | Toute modification repasse la fiche en **« en attente »** jusqu'à ré-approbation admin |

> **Note lead :** vous êtes responsable du contenu publié et des co-leads que vous désignez.

### Espace admin (`/admin`)

Pour l'équipe T.C.H :

| Fonctionnalité | Description |
|----------------|-------------|
| **Vue d'ensemble** | KPI, graphiques (villes actives, communautés par membres), file d'attente |
| **Modération communautés** | Approuver, rejeter, éditer, supprimer ; création au nom d'un lead |
| **Gestion des leads** | Liste, création manuelle, édition, fiche détaillée |
| **Messages contact** | Lecture et marquage des messages reçus via le formulaire public |
| **Chat support** | Réponses individuelles + **message groupé** à tous les leads ou à une sélection |
| **Signalements** | Liste, statuts (`en attente` → `en enquête` → `traité` / `classé`), preuves, notes internes |
| **Page À propos** | Édition du profil fondateur (photo, bio, réseaux) |
| **Sidebar repliable** | Mode icônes seules pour gagner de l'espace |

### Sécurité & modération

- Authentification **JWT** (Bearer token)
- Mots de passe hashés (**bcrypt**)
- Rôles : `lead` et `admin`
- Uploads validés (type MIME, taille max)
- Preuves de signalement en **stockage privé** (accessibles admin uniquement)
- CORS configuré via `FRONTEND_URL`
- Confirmation du mot de passe à l'inscription

---

## Peut-on déployer maintenant ?

### Verdict : **oui pour un lancement pilote / beta contrôlée** — pas encore pour une production « grande échelle » sans quelques actions préalables.

Le produit est **fonctionnel de bout en bout** : annuaire, inscription lead, modération, chat, signalements, événements, co-leads. Vous pouvez le mettre en ligne **dès maintenant** pour :

- tester avec de **vraies communautés pilotes** (5–15 fiches)
- recueillir des retours leads et visiteurs
- valider le workflow de modération au quotidien

### Ce qui est prêt

- [x] Frontend React buildable (`npm run build`)
- [x] API PHP autonome (sans Composer)
- [x] Migrations SQL versionnées + seed
- [x] Auth, rôles, modération, uploads
- [x] Signalements anonymes avec suivi par code
- [x] Interface responsive, dark mode
- [x] `.htaccess` Apache pour le backend

### Checklist avant mise en production

| Priorité | Action |
|----------|--------|
| **Critique** | Changer `JWT_SECRET`, `ADMIN_PASSWORD` et tous les mots de passe par défaut |
| **Critique** | Mettre `APP_DEBUG=false` dans `backend/.env` |
| **Critique** | Rebuild frontend avec la bonne `VITE_API_URL` (URL publique de l'API) |
| **Critique** | Configurer `FRONTEND_URL` (CORS) sur l'URL du site |
| **Critique** | Retirer ou masquer les identifiants démo affichés sur `/connexion` |
| **Haute** | HTTPS sur frontend **et** API |
| **Haute** | Permissions d'écriture sur `backend/storage/uploads` et `backend/storage/reports` |
| **Haute** | Sauvegardes MySQL automatiques |
| **Moyenne** | Nom de domaine + config SPA (fallback `index.html` pour React Router) |
| **Moyenne** | ~~Politique de confidentialité / mentions légales~~ → page `/mentions-legales` disponible |
| **Moyenne** | Rate limiting (contact, login, signalements) — anti-spam |
| **Basse** | Emails transactionnels (validation communauté, reset mot de passe) |
| **Basse** | CDN ou stockage objet pour les uploads (au-delà du disque local) |

### Ce qui manque encore (roadmap)

- Réinitialisation de mot de passe
- Vérification d'email à l'inscription
- Invitation automatique des co-leads par email
- Carte interactive des communautés (aujourd'hui : **filtres par ville**, pas de carte avec pins)
- Tests automatisés (frontend + backend)
- Docker / CI-CD
- Emails automatiques (communauté approuvée, nouveau message, etc.)

---

## Stack technique

| Couche | Technologies |
|--------|--------------|
| **Frontend** | React 19, TypeScript, Vite 6, React Router 7, Tailwind CSS v4, lucide-react |
| **Backend** | PHP 8+ (routeur maison, JWT HS256, validateur léger), PDO |
| **Base de données** | MySQL 5.7+ / 8+ (InnoDB, utf8mb4) |
| **Auth** | JWT Bearer, token en `localStorage` |

---

## Installation (développement)

### Prérequis

- Node.js **18+**
- PHP **8.0+** (`pdo_mysql`, `mbstring`, `json`)
- MySQL (XAMPP, Laragon, WAMP, etc.)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Éditez .env : DB_*, JWT_SECRET, ADMIN_*, FRONTEND_URL

php database/migrate.php
php database/seed.php
php -S localhost:8000 -t public public/router.php
```

API disponible sur **http://localhost:8000**

### 2. Frontend

```bash
# À la racine du projet
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:8000

npm run dev
```

Site disponible sur **http://localhost:3000**

### Structure du projet

```
togo-communities-hub/
├── public/                   # Assets statiques (logos, favicon)
├── src/
│   ├── components/           # UI, layout, dashboard, annuaire
│   ├── context/              # Auth, thème
│   ├── data/togoData.ts      # Villes du Togo, tags
│   ├── lib/api.ts            # Client HTTP
│   └── pages/                # Pages publiques + dashboards
├── backend/
│   ├── public/               # Front controller (index.php, router.php)
│   ├── src/                  # Controllers, Auth, JWT, Helpers
│   ├── database/
│   │   ├── migrations/       # 001 → 010 (users, communities, reports…)
│   │   ├── migrate.php
│   │   └── seed.php
│   └── storage/              # Uploads & preuves (gitignoré)
└── dist/                     # Build production (npm run build)
```

---

## Déploiement (production)

### Frontend (statique)

```bash
VITE_API_URL=https://api.votredomaine.tg npm run build
```

Déployez le contenu de `dist/` sur un hébergeur statique ou nginx/Apache.

**Important :** configurez un **fallback SPA** — toutes les routes (`/communautes`, `/admin`, etc.) doivent renvoyer `index.html`.

Exemple nginx :

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Backend (PHP + MySQL)

- `DocumentRoot` → `backend/public`
- PHP 8+, MySQL accessible
- `.env` production (secrets uniques, `APP_DEBUG=false`)
- Dossiers inscriptibles : `backend/storage/uploads`, `backend/storage/reports`

### Variables d'environnement

**Frontend (`.env`)**

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL publique de l'API (sans slash final) |

**Backend (`backend/.env`)**

| Variable | Description |
|----------|-------------|
| `DB_*` | Connexion MySQL |
| `JWT_SECRET` | Clé secrète longue et aléatoire |
| `JWT_TTL` | Durée du token (défaut 86400 = 24 h) |
| `FRONTEND_URL` | URL du site (CORS) |
| `APP_DEBUG` | `false` en production |
| `ADMIN_*` | Compte admin initial (seed) |
| `MAX_UPLOAD_SIZE` | Taille max upload images (défaut 2 Mo) |

---

## Routes & rôles

### Pages publiques

| Route | Description |
|-------|-------------|
| `/` | Accueil |
| `/a-propos` | À propos |
| `/communautes` | Annuaire |
| `/communautes/:id` | Fiche communauté |
| `/signaler` | Signalement anonyme |
| `/communautes/:id/signaler` | Signalement (communauté pré-sélectionnée) |
| `/signaler/suivi` | Suivi par code |
| `/contact` | Contact |
| `/mentions-legales` | Mentions légales & dédicace |
| `/connexion` · `/inscription` | Auth |

### Espace lead

| Route | Description |
|-------|-------------|
| `/espace-lead` | Vue d'ensemble |
| `/espace-lead/communautes` | Mes communautés |
| `/espace-lead/communautes/nouvelle` | Créer |
| `/espace-lead/communautes/:id` | Éditer (+ onglet événements) |
| `/espace-lead/co-leads` | Co-leads |
| `/espace-lead/evenements` | Calendrier global |
| `/espace-lead/messages` | Chat admin |
| `/espace-lead/profil` | Profil |

### Espace admin

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard (onglets via `?tab=`) |
| `/admin/communautes/nouvelle` | Créer pour un lead |
| `/admin/communautes/:id` | Fiche + modération |
| `/admin/communautes/:id/modifier` | Édition |
| `/admin/leads/:id` | Détail lead |

**Rôles :** `lead` (inscription) · `admin` (seed ou BDD)

---

## API (aperçu)

Réponses JSON : `{ success, message, data, errors? }`

| Domaine | Endpoints clés |
|---------|----------------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile` |
| **Public** | `GET /communities`, `GET /communities/{id}`, `GET /meta`, `GET /meta/author` |
| **Contact** | `POST /contact` |
| **Signalements** | `POST /reports`, `POST /reports/evidence`, `GET /reports/track/{code}`, `GET /reports/categories` |
| **Lead** | `GET/POST/PUT/DELETE /lead/communities`, events, support messages |
| **Upload** | `POST /upload` (auth) |
| **Admin** | `/admin/stats`, `/admin/communities`, `/admin/leads`, `/admin/messages`, `/admin/support`, `/admin/reports`, `/admin/author` |

Documentation complète des routes : `backend/public/index.php`

---

## Comptes de démonstration

Après `php database/seed.php` :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `chaminade.dondah.adjolou@gmail.com` | `Admin@1234` |
| Lead démo | `lead.demo@tch.tg` | `Lead@1234` |

Le seed crée aussi **6 communautés fictives** (GDG Lomé, WTM, Cybersec, etc.) si la table est vide.

> **Ne jamais utiliser ces identifiants en production.**

---

## Migrations base de données

| # | Fichier | Contenu |
|---|---------|---------|
| 001 | `create_users_table` | Utilisateurs (leads + admins) |
| 002 | `create_communities_table` | Communautés (pending / approved / rejected) |
| 003 | `create_contact_messages_table` | Messages contact |
| 004 | `add_community_detail_fields` | Bannière, mission, galerie, co-leads JSON… |
| 005 | `replace_neighborhood_with_country_city` | Pays + ville |
| 006 | `create_community_events_table` | Événements |
| 007 | `create_community_members_table` | Co-leads |
| 008 | `create_support_messages_table` | Chat lead ↔ admin |
| 009 | `create_site_author_table` | Profil fondateur |
| 010 | `create_community_reports_table` | Signalements anonymes |

```bash
php database/migrate.php          # Appliquer
php database/migrate.php --fresh  # Reset complet (destructif)
```

---

## Personnalisation

- **Logos** : `public/logosansfond.png`, `public/navlogo.png`
- **Couleurs** : variables CSS `--color-togo-*` dans `src/index.css`
- **Villes & tags** : `src/data/togoData.ts`
- **Profil fondateur** : éditable depuis `/admin?tab=author`

---

## Licence & contact

Projet porté par **Chaminade Dondah Adjolou**.

Contact : `contact@tch.tg`

---

<div align="center">

**T.C.H — Donnez de la voix aux communautés du Togo.**

</div>
