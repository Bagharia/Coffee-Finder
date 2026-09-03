# Guide d'administration — SpotThePlace

## Préparer la base

Les migrations ne s'appliquent plus à la main. Depuis `back/`, une seule commande :

```bash
npm run db:migrate
```

Elle applique, dans l'ordre, les fichiers `db/0XX_*.sql` qui manquent, et note
chacun dans la table `schema_migrations`. Relancée, elle ne fait rien. La base
visée est celle du `.env` — les fichiers SQL ne contiennent plus de nom de base
en dur, sans quoi ils seraient inapplicables chez un hébergeur.

```bash
npm run db:migrate -- --etat       # ce qui est appliqué, ce qui attend
npm run db:migrate -- --baseline   # tout marquer appliqué sans exécuter
```

`--baseline` sert une fois, sur une base montée à la main avant l'arrivée du
runner : elle a le bon schéma mais pas la table de suivi. L'utiliser sur une
base réellement vide la laisserait vide en la déclarant à jour.

Le jeu de données de démonstration reste séparé, et n'est pas une migration :

```bash
mysql -u <user> -p <base> < db/seed.sql   # jamais en production
```

## Créer un compte administrateur

`POST /api/users/register` crée **toujours** un compte `user`. Le champ `role`
envoyé dans le corps de la requête est ignoré : sans ça, n'importe qui se
fabriquerait un compte admin depuis le formulaire d'inscription.

La promotion se fait en base, à la main, et c'est voulu :

```bash
# 1. créer le compte normalement
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@spotheplace.fr","password":"un-mot-de-passe-long","username":"Wendy"}'
```

```sql
-- 2. le promouvoir
UPDATE users SET role = 'admin' WHERE email = 'admin@spotheplace.fr';
```

La session ouverte à l'inscription porte encore `role: user`. Il faut se
reconnecter après la promotion pour obtenir une session admin.

## Se connecter

La session est un cookie `httpOnly` : l'API ne renvoie plus de jeton dans le
corps de la réponse. En ligne de commande, il faut donc un bocal à cookies.

```bash
curl -c session.txt -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@spotheplace.fr","password":"un-mot-de-passe-long"}'
```

Les appels suivants réutilisent ce fichier avec `-b session.txt`. L'en-tête
`Authorization: Bearer <jeton>` reste accepté pour les scripts qui préfèrent
gérer leur jeton eux-mêmes.

Le mot de passe fait au minimum 8 caractères, à l'inscription comme au
changement. Après 10 tentatives de connexion ratées depuis la même adresse IP
en 15 minutes, l'API répond 429.

## Ajouter une adresse

```bash
curl -b session.txt -X POST http://localhost:3000/api/cafes \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Café Example",
    "arrondissement": "10e",
    "adresse": "123 Rue de la Paix",
    "description": "Deux salles, une terrasse au sud.",
    "verdict": "Le meilleur matcha du quartier, et la seule table où on tient à deux avec un ordinateur.",
    "coup_de_coeur": 1,
    "nb_personnes": "20-50",
    "horaires": "8h-20h",
    "specialite": "Café,Matcha",
    "prix": "10-20",
    "wifi": 1,
    "prises": 1,
    "travailler": 1,
    "theme": "Moderne",
    "ambiance": "Calme"
  }'
```

`nom` et `arrondissement` sont obligatoires. `prix` vaut `1-10`, `10-20` ou `20+`.
L'adresse est géocodée automatiquement via Nominatim : si le géocodage échoue,
la fiche est créée quand même mais n'apparaît pas sur la carte.

## Modifier, supprimer

```bash
curl -b session.txt -X PUT http://localhost:3000/api/cafes/1 \
  -H "Content-Type: application/json" \
  -d '{"coup_de_coeur": 1}'

curl -b session.txt -X DELETE http://localhost:3000/api/cafes/1
```

Un `PUT` ne touche que les champs envoyés. Une suppression emporte les critères,
les avis et les favoris de l'adresse (cascade).

## Qui peut quoi

| Routes | Accès |
|---|---|
| `POST`, `PUT`, `DELETE /api/cafes` | session admin |
| `/api/favoris/*`, `POST`/`DELETE /api/avis/*`, `/api/users/profile`, `/api/users/change-password` | session utilisateur |
| `GET /api/cafes/*`, `GET /api/avis/:cafeId`, `/api/health` | public |

La liste complète des routes et le format des réponses sont dans le README à la
racine du dépôt.

---

## Héberger l'API

### Variables à renseigner

Au-delà de celles du `.env.example`, quatre méritent une décision consciente.

| Variable | En production |
|---|---|
| `NODE_ENV` | `production` — c'est elle qui pose le cookie de session en `secure` |
| `TRUST_PROXY` | **obligatoire**, le serveur refuse de démarrer sans. `1` derrière un reverse proxy (tous les PaaS), `0` si l'API est exposée directement |
| `DB_SSL` | `1` chez tout hébergeur de base managée, qui refuse le clair |
| `NOMINATIM_CONTACT` | une adresse e-mail ou l'URL du site — sans elle, le géocodage depuis une IP de datacenter finit en 403 |

`TRUST_PROXY` n'a pas de défaut sûr, d'où le refus de démarrer : à `0` derrière
un proxy, `req.ip` vaut l'adresse du proxy et le limiteur de débit range tous
les visiteurs dans le même compteur — dix échecs de connexion, venus de
n'importe qui, verrouillent le site pour tout le monde pendant quinze minutes.
À `1` sans proxy devant, n'importe qui usurpe son adresse via un en-tête
`X-Forwarded-For` forgé et contourne la limite.

### Où servir le front

Le back ne sert que du JSON : il n'y a pas de `express.static`, le front est
déployé séparément. Deux montages possibles, et le choix décide du cookie.

**Même domaine** (`site.fr` pour le front, `site.fr/api` via un reverse proxy,
ou `api.site.fr` en sous-domaine) : garder `VITE_API_URL=/api` et
`COOKIE_SAMESITE=lax`. C'est le montage le plus simple et le plus sûr.

**Deux domaines distincts** (front sur Vercel, API ailleurs) : mettre l'URL
complète de l'API dans `VITE_API_URL`, `FRONTEND_URL` sur l'URL exacte du
front, et `COOKIE_SAMESITE=none`. Ce dernier impose HTTPS **des deux côtés** :
sans quoi le navigateur jette le cookie de session sans le moindre message, et
la connexion échoue sans erreur visible.

### Sonde de disponibilité

Pointer le healthcheck de l'hébergeur sur `GET /api/health`. Elle interroge la
base : `200 {"status":"ok"}` si tout répond, `503 {"status":"degrade"}` si la
base est injoignable. En production, une base injoignable au démarrage arrête
le processus en code 1 plutôt que de laisser l'API se déclarer disponible.

### Redéploiement

Le serveur intercepte `SIGTERM` : il cesse d'accepter des connexions, laisse
finir les requêtes en vol, ferme le pool MySQL, puis sort. Au-delà de dix
secondes, il se coupe de force. Rien à configurer, mais laisser à l'hébergeur
au moins quinze secondes de délai d'arrêt s'il permet de le régler.

### Limites connues

Le limiteur de débit compte dans la mémoire du processus (`middleware/rateLimit.js`).
Deux instances derrière un répartiteur, et chacune autorise le quota complet.
Tant que l'API tourne en un seul exemplaire, c'est sans effet ; passer à
plusieurs impose de sortir les compteurs en base ou dans un cache partagé.
