require('dotenv').config();

// `fetch` global (géocodage Nominatim) et `AbortSignal.timeout` n'existent qu'à
// partir de Node 18. Un hébergeur libre de choisir sa version prend parfois une
// LTS plus ancienne : sans ce garde-fou, ça ne casse pas au démarrage mais à la
// première création d'adresse, ce qui est bien plus long à comprendre.
const NODE_MIN = 18;
const majeur = Number.parseInt(process.versions.node.split('.')[0], 10);

if (majeur < NODE_MIN) {
  throw new Error(
    `Node ${NODE_MIN}+ est requis (version détectée : ${process.versions.node}). ` +
    'Le géocodage utilise fetch et AbortSignal.timeout, absents avant.'
  );
}

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

const NODE_ENV = process.env.NODE_ENV || 'development';
const EN_PRODUCTION = NODE_ENV === 'production';

// 'lax' suffit quand le front et l'API partagent le même domaine — en
// développement grâce au proxy Vite, en production si l'API est un
// sous-domaine du site. Deux domaines distincts imposent 'none'.
const SAMESITE_VALIDES = ['lax', 'strict', 'none'];
const COOKIE_SAMESITE = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();

if (!SAMESITE_VALIDES.includes(COOKIE_SAMESITE)) {
  throw new Error(`COOKIE_SAMESITE doit valoir : ${SAMESITE_VALIDES.join(', ')}.`);
}

// Le limiteur de débit compte par `req.ip`. Derrière un reverse proxy sans
// `trust proxy`, req.ip vaut l'adresse du proxy : les dix échecs de connexion
// autorisés deviennent dix pour l'ensemble des visiteurs, et le premier venu
// verrouille le site. À l'inverse, l'activer sans proxy devant laisse n'importe
// qui usurper son IP via X-Forwarded-For. Aucun défaut n'est sûr dans les deux
// cas : en production, on exige un choix explicite.
if (EN_PRODUCTION && process.env.TRUST_PROXY === undefined) {
  throw new Error(
    'TRUST_PROXY est obligatoire en production : 1 si l\'API est derrière un ' +
    'reverse proxy (cas de tous les hébergeurs PaaS), 0 si elle est exposée ' +
    'directement. Sans proxy annoncé, le limiteur de débit range tous les ' +
    'visiteurs sous la même IP.'
  );
}

const TRUST_PROXY = process.env.TRUST_PROXY === '1';

// Racine publique du site (celle du front), sans barre finale. Le sitemap exige
// des URL absolues : en production, un défaut serait une adresse fausse
// publiée à tous les moteurs de recherche, d'où l'échec bruyant.
const lireSiteUrl = () => {
  const brut = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');

  if (!brut) {
    if (EN_PRODUCTION) {
      throw new Error('SITE_URL est obligatoire en production (ex. https://spotheplace.fr), pour le sitemap.');
    }
    return 'http://localhost:5173';
  }

  try {
    const { protocol, pathname } = new URL(brut);
    if (!['http:', 'https:'].includes(protocol) || pathname !== '/') throw new Error();
  } catch {
    throw new Error(`SITE_URL doit être une racine http(s) sans chemin (reçu : ${brut}).`);
  }

  return brut;
};

const SITE_URL = lireSiteUrl();

// Les bases managées (Railway, Aiven, Scaleway, PlanetScale…) refusent les
// connexions en clair. mysql2 n'active TLS que si on lui passe un objet `ssl` :
// sans lui, la connexion est rejetée au handshake, avant toute requête.
// DB_SSL_CA sert aux fournisseurs qui signent avec leur propre autorité.
const fs = require('node:fs');

const sslBase = () => {
  if (!process.env.DB_SSL_CA) return { minVersion: 'TLSv1.2' };

  try {
    return { minVersion: 'TLSv1.2', ca: fs.readFileSync(process.env.DB_SSL_CA, 'utf8') };
  } catch (err) {
    throw new Error(`DB_SSL_CA illisible (${process.env.DB_SSL_CA}) : ${err.message}`);
  }
};

const DB_SSL = process.env.DB_SSL === '1' ? sslBase() : undefined;

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  COOKIE_SAMESITE,
  NODE_ENV,
  EN_PRODUCTION,
  TRUST_PROXY,
  SITE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  // Origine autorisée par CORS. En production, une absence de valeur ferait
  // silencieusement tomber l'API sur localhost : on préfère l'échec bruyant.
  FRONTEND_URL: process.env.FRONTEND_URL || (
    EN_PRODUCTION
      ? (() => { throw new Error('FRONTEND_URL est obligatoire en production.'); })()
      : 'http://localhost:5173'
  ),
  DB: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    // `undefined` laisse mysql2 en clair, comme avant, pour le développement local.
    ...(DB_SSL ? { ssl: DB_SSL } : {})
  }
};
