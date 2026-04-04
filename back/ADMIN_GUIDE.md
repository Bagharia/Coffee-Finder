# Guide d'administration - Coffee Finder

## Configuration de la base de données

1. Exécutez le script SQL pour créer la table users :
```sql
mysql -u votre_user -p votre_database < setup_admin.sql
```

## Créer un compte administrateur

### Via API (recommandé)

Utilisez un outil comme Postman, Thunder Client ou curl :

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@coffee-finder.com",
    "password": "VotreMotDePasseSecurise123!",
    "nom": "Admin",
    "role": "admin"
  }'
```

Vous recevrez une réponse avec un token JWT :
```json
{
  "message": "Utilisateur créé avec succès",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@coffee-finder.com",
    "nom": "Admin",
    "role": "admin"
  }
}
```

## Se connecter en tant qu'admin

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@coffee-finder.com",
    "password": "VotreMotDePasseSecurise123!"
  }'
```

## Utiliser le token pour ajouter des cafés

Une fois connecté, utilisez le token reçu pour créer des cafés :

```bash
curl -X POST http://localhost:3000/api/cafes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -d '{
    "nom": "Café Example",
    "arrondissement": "10e",
    "adresse": "123 Rue de la Paix",
    "image_url": "https://example.com/image.jpg",
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

## Supprimer un café (admin uniquement)

```bash
curl -X DELETE http://localhost:3000/api/cafes/1 \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

## Routes protégées

Les routes suivantes nécessitent un token admin :
- `POST /api/cafes` - Créer un café
- `DELETE /api/cafes/:id` - Supprimer un café

## Routes publiques

Ces routes sont accessibles sans authentification :
- `GET /api/cafes` - Liste de tous les cafés
- `GET /api/cafes/:id` - Détails d'un café
- `GET /api/cafes/search` - Recherche de cafés
- `GET /api/cafes/specialite/:spec` - Cafés par spécialité
- etc.

## Routes utilisateurs

- `POST /api/users/register` - Créer un compte
- `POST /api/users/login` - Se connecter
- `GET /api/users/profile` - Voir son profil (token requis)
