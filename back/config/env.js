require('dotenv').config();

// Variables sans lesquelles le serveur ne doit pas démarrer.
// DB_PASSWORD est volontairement absent : un mot de passe vide est une
// configuration locale valable. JWT_SECRET, lui, n'a pas de repli : un secret
// par défaut dans le code est un secret public, donc pas un secret.
const REQUISES = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];

const manquantes = REQUISES.filter((cle) => !process.env[cle]);

if (manquantes.length > 0) {
  throw new Error(
    `Variables d'environnement manquantes : ${manquantes.join(', ')}. ` +
    'Copier back/.env.example vers back/.env et les renseigner.'
  );
}

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET,
  // Origine autorisée par CORS. En production, une absence de valeur ferait
  // silencieusement tomber l'API sur localhost : on préfère l'échec bruyant.
  FRONTEND_URL: process.env.FRONTEND_URL || (
    process.env.NODE_ENV === 'production'
      ? (() => { throw new Error('FRONTEND_URL est obligatoire en production.'); })()
      : 'http://localhost:5173'
  ),
  DB: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME
  }
};
