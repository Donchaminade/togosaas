# Contribuer à TogoSaaS

Merci de votre intérêt pour **TogoSaaS — Hub SaaS du Togo** ! 🙌
Ce projet est **open source** (licence MIT) et toutes les contributions sont les bienvenues : code, documentation, signalement de bugs, idées de fonctionnalités.

---

## Sommaire

1. [Code de conduite](#code-de-conduite)
2. [Comment contribuer](#comment-contribuer)
3. [Mettre en place l'environnement](#mettre-en-place-lenvironnement)
4. [Workflow Git](#workflow-git)
5. [Convention de commits](#convention-de-commits)
6. [Ouvrir une Pull Request](#ouvrir-une-pull-request)
7. [Signaler un bug / proposer une idée](#signaler-un-bug--proposer-une-idée)

---

## Code de conduite

Soyez respectueux, bienveillant et constructif. Les comportements toxiques, discriminatoires ou de harcèlement ne sont pas tolérés. En contribuant, vous acceptez de maintenir un environnement accueillant pour tous.

---

## Comment contribuer

Il existe plusieurs façons d'aider :

- **Corriger un bug** ou améliorer le code existant
- **Ajouter une fonctionnalité** (voir la roadmap dans le [README](./README.md))
- **Améliorer la documentation** (README, commentaires, guides)
- **Signaler un bug** ou **proposer une idée** via une *issue*
- **Relire et tester** les Pull Requests ouvertes

---

## Mettre en place l'environnement

> Détails complets dans la section **Installation** du [README](./README.md#installation-développement).

### Prérequis

- Node.js **18+**
- PHP **8.0+** (`pdo_mysql`, `mbstring`, `json`)
- MySQL (XAMPP, Laragon, WAMP, etc.)

### 1. Forker & cloner

```bash
# Forkez le dépôt sur GitHub, puis :
git clone https://github.com/<votre-compte>/togosaas.git
cd togosaas
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # Éditez DB_*, JWT_SECRET, ADMIN_*, FRONTEND_URL
php database/migrate.php
php database/seed.php
php -S localhost:8000 -t public public/router.php
```

### 3. Frontend

```bash
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:8000
npm run dev
```

### 4. Vérifier avant de commiter

```bash
npm run lint                # Vérification TypeScript (tsc --noEmit)
npm run build               # Le build doit passer sans erreur
```

---

## Workflow Git

Le projet suit un modèle **`master` → `dev` → branches de travail**.

| Branche | Rôle |
|---------|------|
| `master` (ou `main`) | Production — **ne jamais pousser directement** |
| `dev` | Intégration — **toutes les PR ciblent `dev`** |
| `feature/<nom>` · `fix/<nom>` · `chore/<nom>` | Branches de travail |

### Étapes

```bash
# 1. Récupérer la dernière version de dev
git checkout dev
git pull origin dev

# 2. Créer une branche dédiée et préfixée
git checkout -b feature/ma-fonctionnalite

# 3. Coder, puis commiter (voir convention ci-dessous)
git add .
git commit -m "feat(annuaire): ajoute le filtre par thématique"

# 4. Pousser la branche sur votre fork
git push -u origin feature/ma-fonctionnalite

# 5. Ouvrir une Pull Request vers la branche dev
```

> ⚠️ Ne travaillez **jamais** directement sur `master` ou `dev`. Ne committez pas `.env`, secrets ou identifiants.

---

## Convention de commits

Format : `<type>(<scope>): <résumé à l'impératif>`

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation uniquement |
| `style` | Mise en forme (sans impact logique) |
| `refactor` | Refactorisation sans changement de comportement |
| `perf` | Amélioration de performance |
| `test` | Ajout ou modification de tests |
| `chore` | Tâches diverses (deps, config, build) |

**Exemples :**

```
feat(espace-lead): ajoute la gestion des co-leads
fix(api): gère le solde de portefeuille vide
docs(readme): ajoute les badges de technologies
chore: met à jour le lockfile
```

---

## Ouvrir une Pull Request

Avant de soumettre, vérifiez que :

- [ ] La branche cible est bien **`dev`** (jamais `master`)
- [ ] `npm run lint` passe sans erreur
- [ ] `npm run build` réussit
- [ ] La modification est **scopée** (un sujet par PR)
- [ ] Aucun secret ni `.env` n'est inclus dans le diff
- [ ] La description explique le **pourquoi** du changement
- [ ] Les éventuelles issues liées sont référencées (`Closes #123`)

Une fois la PR ouverte, l'équipe la relit et la valide avant fusion dans `dev`.

---

## Signaler un bug / proposer une idée

Ouvrez une **issue** en précisant :

- **Bug** : étapes de reproduction, comportement attendu vs constaté, captures d'écran, environnement (OS, navigateur, version PHP/Node).
- **Idée / fonctionnalité** : le besoin, le cas d'usage, et une proposition de solution si possible.

---

Merci de faire grandir l'écosystème SaaS du Togo ! 🇹🇬
