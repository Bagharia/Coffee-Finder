# Guide d'administration — SpotThePlace

## Préparer la base

Depuis `back/`, migrations dans l'ordre puis, si la base est vide, le jeu de départ :

```bash
mysql -u root -p < db/001_init.sql
mysql -u root -p < db/002_colonnes_cafes.sql
mysql -u root -p < db/003_avis_favoris.sql
mysql -u root -p < db/004_verdict.sql
mysql -u root -p < db/005_horaires.sql
mysql -u root -p < db/seed.sql   # facultatif, jamais en production
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
