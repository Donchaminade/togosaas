# Déploiement TogoSaaS — Hostinger (API) + Vercel (frontend)

Architecture cible :

| Composant | Hébergeur | URL |
|-----------|-----------|-----|
| **API PHP + MySQL** | **Hostinger** | `https://tch.grosbit.com` |
| **Frontend React** | **Vercel** | ex. `https://hub.grosbit.com` ou `https://xxx.vercel.app` |

---

## 1. Backend sur Hostinger — `tch.grosbit.com`

### 1.1 Créer le sous-domaine

1. hPanel Hostinger → **Domaines** → **Sous-domaines**
2. Créer **`tch.grosbit.com`**
3. Dossier cible : ex. `tch` ou `public_html/tch`
4. **Document root** : pointer vers le dossier `public` du backend  
   (`.../tch/public` ou équivalent)

> Le point d'entrée web doit être **`backend/public`** (là où se trouve `index.php`).

### 1.2 Base MySQL

1. hPanel → **Bases de données MySQL** → créer base + utilisateur
2. Noter : hôte (`localhost`), nom de base, utilisateur, mot de passe

### 1.3 Envoyer les fichiers

Via **Gestionnaire de fichiers** ou **FTP**, uploadez tout le dossier `backend/` :

```
backend/
├── public/          ← document root de tch.grosbit.com
├── src/
├── config/
├── database/        ← migrations uniquement (pas d'exports SQL)
├── storage/         ← doit être inscriptible (775)
└── .env             ← à créer sur le serveur (ne pas committer)
```

**Ne pas uploader :**
- `.env` local de votre PC (créer un `.env` neuf sur Hostinger)
- Dumps SQL (`.sql`) — ils contiennent mots de passe hashés et données sensibles
- Le dossier `.private/` à la racine du projet (exports locaux)

**Ne pas** exposer `src/`, `database/` ou `.env` comme document root. Des fichiers `.htaccess` bloquent l'accès HTTP direct à ces dossiers si le document root est mal configuré.

### 1.4 Fichier `.env` production

Copiez `backend/.env.production.example` → `backend/.env` et renseignez :

```env
DB_HOST=localhost
DB_NAME=u123456789_tch
DB_USER=u123456789_tch
DB_PASS=...

JWT_SECRET=...   # openssl rand -hex 32

APP_ENV=production
APP_DEBUG=false

# URL du site Vercel (pas tch.grosbit.com — c'est l'API ici)
FRONTEND_URL=https://votre-projet.vercel.app
# ou FRONTEND_URLS=https://hub.grosbit.com,https://xxx.vercel.app
```

### 1.5 Permissions

Dossiers inscriptibles par PHP (avatars, logos, chat, signalements) :

```bash
chmod -R 775 storage/
```

Sous Hostinger : clic droit → Permissions → `775` sur `storage/` et sous-dossiers.

### 1.6 Importer la base (depuis votre PC local)

**Regénérer un export local** (fichier hors du dossier `backend`, jamais déployé) :

```bash
cd backend
php database/export-for-hostinger.php
```

Le fichier est créé dans :

```
.private/db-exports/tch_export_YYYYMMDD_HHMMSS.sql
```

**Via phpMyAdmin Hostinger :**

1. hPanel → **Bases de données** → **phpMyAdmin**
2. Sélectionner la base **`u878418868_tchdb`**
3. Onglet **Importer** → choisir le fichier `.sql` généré
4. Format : SQL · Encodage : `utf-8` → **Exécuter**

> Supprimez le fichier `.sql` de votre PC après import. Ne l'uploadez jamais dans `public_html/`.

**`.env` Hostinger (base de données) :**

```env
DB_HOST=localhost
DB_NAME=u878418868_tchdb
DB_USER=u878418868_tch
DB_PASS=...   # mot de passe MySQL Hostinger
```

### 1.7 Migrations & seed (alternative)

**SSH** (si activé sur Hostinger) :

```bash
cd ~/domains/tch.grosbit.com/backend   # adaptez le chemin
php database/migrate.php
php database/seed.php
```

**Sans SSH** : exécutez en local en pointant vers la BDD Hostinger (autoriser IP distante dans hPanel) :

```bash
cd backend
php database/migrate.php
php database/seed.php
```

### 1.8 Vérifier l'API

Ouvrir : **`https://tch.grosbit.com/health`**  
Réponse attendue : `{"success":true,"data":{"status":"ok"},...}`

---

## 2. Frontend sur Vercel

### 2.1 Importer le projet

1. [vercel.com](https://vercel.com) → **Add New Project**
2. Importer le repo Git (dossier racine = `togo-communities-hub`)
3. Framework : **Vite**
4. Build command : `npm run build`
5. Output directory : `dist`

### 2.2 Variable d'environnement

Dans **Settings → Environment Variables** :

| Nom | Valeur | Environnements |
|-----|--------|----------------|
| `VITE_API_URL` | `https://tch.grosbit.com` | Production, Preview, Development |

> Pas de slash final. Rebuild obligatoire après modification.

### 2.3 Déployer

Push sur la branche principale → Vercel build et déploie automatiquement.

Le fichier `vercel.json` gère le **fallback SPA** (routes React `/communautes`, `/admin`, etc.).

### 2.4 Domaine custom frontend (optionnel)

Vercel → **Settings → Domains** → ajouter ex. `hub.grosbit.com` ou `www.grosbit.com`  
Configurer le CNAME/DNS selon les instructions Vercel.

Mettre à jour **`FRONTEND_URL`** (ou `FRONTEND_URLS`) dans le `.env` backend Hostinger avec cette URL frontend.

---

## 3. Checklist finale

- [ ] `https://tch.grosbit.com/health` OK
- [ ] `APP_DEBUG=false` sur le backend
- [ ] `JWT_SECRET` unique en production
- [ ] `FRONTEND_URL` = URL exacte du site **Vercel** (pas l'API)
- [ ] `VITE_API_URL=https://tch.grosbit.com` sur Vercel
- [ ] Migrations appliquées
- [ ] `storage/` inscriptible (775)
- [ ] Connexion / inscription testées
- [ ] Upload logo communauté testé
- [ ] Mot de passe admin seed changé après 1ère connexion

---

## 4. Dépannage

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| CORS bloqué | `FRONTEND_URL` incorrect | URL exacte du **frontend** Vercel, avec `https`, sans `/` final |
| 404 sur routes React | Fallback SPA manquant | `vercel.json` présent à la racine |
| API 500 | `.env` / MySQL | Logs Hostinger, vérifier identifiants DB |
| Images uploadées cassées | Permissions `storage/` | `chmod 775 storage/uploads` |
| Auth ne marche pas | Header Authorization perdu | `.htaccess` dans `public/` (déjà inclus) |

---

## 5. Mises à jour

**Frontend** : push Git → Vercel rebuild auto.

**Backend** : uploader fichiers modifiés via FTP, puis si migrations :

```bash
php database/migrate.php
```
