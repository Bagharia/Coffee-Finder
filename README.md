# SpotThePlace

Guide des cafés, salons de thé et bubble tea de Paris. Une seule personne écrit
les avis ; le site sert à les lire chez soi et à retrouver une adresse dans la rue.

Les règles de travail sur ce dépôt (conventions de code, ordre du chantier,
arbitrages) sont tenues à part, hors du dépôt. Ce README ne dit que comment
faire tourner le projet et ce que l'API expose.

---

## Stack

| | |
|---|---|
| Front | React 19, Vite 7, Tailwind 4, React Router 7, Leaflet + react-leaflet |
| Back | Node, Express 5, MySQL/MariaDB via `mysql2/promise`, JWT, bcryptjs |
| Géocodage | Nominatim (OpenStreetMap), appelé à la création d'une adresse |

```
back/                 API Express
  config/             connexion base, variables d'environnement
  controllers/        logique des routes
  db/                 migrations numérotées + jeu de départ
  middleware/         authentification, limiteur de débit, en-têtes
  models/             accès aux comptes
  routes/             déclaration des routes
  utils/              validation et pagination
front/frontend/       application React
  src/components/     composants partagés
  src/pages/          écrans
  src/services/api.js seul point d'entrée vers l'API
```

---

## Démarrer

### 1. La base

MySQL ou MariaDB en local. Depuis `back/`, migrations dans l'ordre :

```bash
mysql -u root -p < db/001_init.sql
mysql -u root -p < db/002_colonnes_cafes.sql
mysql -u root -p < db/003_avis_favoris.sql
mysql -u root -p < db/004_verdict.sql
mysql -u root -p < db/005_horaires.sql
mysql -u root -p < db/seed.sql   # facultatif, cinq adresses d'exemple
```

Les migrations sont numérotées et s'appliquent dans l'ordre, une fois chacune.
Une base créée avant leur mise en place est à jour jusqu'à `002` : reprendre
à `003`.

Les fichiers sont écrits en syntaxe portable : ils passent sur MySQL 8 comme
sur MariaDB. Rejouer une migration déjà appliquée échoue, et c'est voulu — mieux
vaut une erreur bruyante qu'une base dans un état qu'on ne sait plus décrire.

### 2. Le back

```bash
cd back
npm install
cp .env.example .env    # puis renseigner les valeurs
npm run dev             # nodemon
```

Le serveur refuse de démarrer si `DB_HOST`, `DB_USER`, `DB_NAME` ou `JWT_SECRET`
manquent. C'est voulu : un secret de repli écrit dans le code est un secret
public. Générer le sien avec `openssl rand -base64 48`.

### 3. Le front

```bash
cd front/frontend
npm install
npm run dev             # vite, port 5173
```

En développement, Vite relaie `/api` vers le back (`vite.config.js`). Le front
et l'API partagent donc la même origine, ce qui est la condition pour que le
cookie de session circule. `VITE_API_URL` vaut `/api` et il n'y a aucune URL
d'API écrite en dur dans un composant.

Sur macOS, le port 5000 est occupé par le récepteur AirPlay : garder 3000.

---

## Variables d'environnement

### `back/.env`

| Variable | Obligatoire | Rôle |
|---|---|---|
| `PORT` | non (3000) | port d'écoute |
| `DB_HOST`, `DB_USER`, `DB_NAME` | oui | connexion base |
| `DB_PASSWORD` | non | vide accepté en local |
| `JWT_SECRET` | oui | signature des jetons, aucun repli |
| `FRONTEND_URL` | oui en production | origine autorisée par CORS |
| `NODE_ENV` | non | `development` / `production` |
| `TRUST_PROXY` | non | `1` seulement derrière un reverse proxy |
| `COOKIE_SAMESITE` | non (`lax`) | `none` si le front et l'API sont sur deux domaines distincts |

### `front/frontend/.env`

| Variable | Rôle |
|---|---|
| `VITE_API_URL` | racine de l'API. `/api` en développement et en production si l'API est servie sous le même domaine ; sinon l'URL complète |

---

## L'API

Racine : `/api`. Tout est du JSON, y compris les erreurs, y compris les 404.

### Forme des réponses

Une ressource unique est un objet :

```json
{ "id": 12, "nom": "Ten Belles", "arrondissement": "10e", "verdict": "…" }
```

Toute route de liste est paginée et répond une enveloppe :

```json
{ "donnees": [ … ], "page": 1, "limite": 20, "total": 137 }
```

`?page` vaut 1 par défaut, `?limite` vaut 20 et plafonne à 100.

Une erreur est toujours `{ "error": "phrase en français" }`. Le détail technique
reste dans le journal du serveur : le client ne reçoit jamais un message SQL.

### Adresses

| Méthode | Route | Accès |
|---|---|---|
| `GET` | `/api/cafes` | public |
| `GET` | `/api/cafes/:id` | public — 404 si l'adresse n'existe pas |
| `GET` | `/api/cafes/random` | public |
| `GET` | `/api/cafes/nouveautes` | public — 30 derniers jours |
| `GET` | `/api/cafes/search?arrondissement=&specialite=&wifi=&prix=&ambiance=&prises=&theme=&nb_personnes=&horaires=&coup_de_coeur=` | public |
| `GET` | `/api/cafes/arrondissement/:arr` | public |
| `GET` | `/api/cafes/specialite/:spec` | public |
| `GET` | `/api/cafes/wifi/:wifi` | public — `0` ou `1` |
| `GET` | `/api/cafes/prix/:prix` | public — `1-10`, `10-20`, `20+` |
| `GET` | `/api/cafes/ambiance/:amb` | public |
| `POST` | `/api/cafes` | admin |
| `PUT` | `/api/cafes/:id` | admin — ne modifie que les champs envoyés |
| `DELETE` | `/api/cafes/:id` | admin — emporte critères, avis et favoris |

### Comptes

| Méthode | Route | Accès |
|---|---|---|
| `POST` | `/api/users/register` | public — 5 par heure et par IP |
| `POST` | `/api/users/login` | public — 10 par quart d'heure et par IP |
| `POST` | `/api/users/logout` | public — vide le cookie de session |
| `GET` | `/api/users/profile` | jeton |
| `PUT` | `/api/users/change-password` | jeton |

L'inscription crée **toujours** un compte `user` : le champ `role` du corps de
la requête est ignoré. La promotion en admin se fait en base, voir
[`back/ADMIN_GUIDE.md`](./back/ADMIN_GUIDE.md).

### Avis et favoris

| Méthode | Route | Accès |
|---|---|---|
| `GET` | `/api/avis/:cafeId` | public — enveloppe paginée + `moyenne` |
| `GET` | `/api/avis/:cafeId/mine` | jeton — `null` si pas d'avis |
| `POST` | `/api/avis/:cafeId` | jeton — note de 1 à 5, un avis par compte et par adresse |
| `DELETE` | `/api/avis/:cafeId` | jeton |
| `GET` | `/api/favoris` | jeton |
| `GET` | `/api/favoris/:cafeId/check` | jeton |
| `POST` | `/api/favoris/:cafeId` | jeton |
| `DELETE` | `/api/favoris/:cafeId` | jeton |

`GET /api/health` répond `{ "status": "ok" }` sans toucher à la base.

---

## Modèle de données

| Table | Contenu |
|---|---|
| `cafes` | nom, arrondissement, adresse, description, image, coordonnées, `verdict`, `coup_de_coeur` |
| `criteres_cafe` | wifi, prises, prix, ambiance, thème, spécialité, horaires en texte libre |
| `cafe_horaires` | horaires exploitables : `jour` de 1 (lundi) à 7, `ouverture`, `fermeture`. Pas de ligne = fermé ce jour-là |
| `users` | compte, rôle `user` ou `admin` |
| `avis` | note de 1 à 5 et commentaire, `UNIQUE(user_id, cafe_id)` |
| `favoris` | `UNIQUE(user_id, cafe_id)` |

`cafes` et `criteres_cafe` ont chacune une colonne `id`. Sur un `SELECT *` en
jointure, mysql2 écrase la première par la seconde et l'`id` renvoyé au front
est celui des critères. Les requêtes listent donc toujours leurs colonnes et les
aliasent (`cafes.id AS id`, `criteres_cafe.id AS critere_id`).

Le verdict de Wendy vit sur `cafes`, pas dans `avis` : ce n'est pas un avis
parmi d'autres et il n'entre pas dans la moyenne.

---

## Sécurité

- La session est un jeton JWT de 24 h dans un cookie `httpOnly`, `sameSite` et
  `secure` en production. Aucun script de la page ne peut le lire : une
  injection ne suffit plus à voler un compte. Le front ne stocke rien et
  demande à `/api/users/profile` qui est connecté.
- L'en-tête `Authorization: Bearer` reste accepté pour les scripts et la ligne
  de commande, qui n'ont pas de navigateur à protéger.
- Malgré le cookie : aucun rendu de HTML venant de la base, pas de
  `dangerouslySetInnerHTML`.
- Mots de passe hachés avec bcrypt, 8 caractères minimum.
- Toutes les requêtes SQL sont paramétrées.
- Limiteur de débit en mémoire sur la connexion et l'inscription. Il compte par
  processus : le jour où l'API tournera sur plusieurs instances, il faudra le
  déporter.
- En-têtes de sécurité posés à la main dans `middleware/securityHeaders.js`,
  pour ne pas ajouter de dépendance.
- Le dépôt est public : rien de secret ne rentre, jamais, même temporairement.

---

## Scripts

| Depuis | Commande | Effet |
|---|---|---|
| `back/` | `npm run dev` | API avec nodemon |
| `back/` | `npm start` | API |
| `front/frontend/` | `npm run dev` | serveur de développement Vite |
| `front/frontend/` | `npm run build` | build de production |
| `front/frontend/` | `npm run lint` | ESLint |
