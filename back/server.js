const { PORT, NODE_ENV, FRONTEND_URL, TRUST_PROXY, EN_PRODUCTION } = require('./config/env');
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const { securityHeaders } = require('./middleware/securityHeaders');
const journal = require('./utils/journal');
const { DOSSIER: DOSSIER_UPLOADS } = require('./utils/televersement');

const app = express();

app.disable('x-powered-by');

// Derrière un reverse proxy, req.ip vaut l'adresse du proxy et le limiteur de
// débit compte tout le monde ensemble. À n'activer que si un proxy est bien là :
// sinon n'importe qui usurpe son IP via X-Forwarded-For. En production, le choix
// est exigé explicitement — voir config/env.js.
if (TRUST_PROXY) {
  app.set('trust proxy', 1);
}

app.use(securityHeaders);

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '100kb' }));

// Vérification de la connexion à la base au démarrage. En développement, on
// laisse le serveur vivre : c'est souvent MySQL qu'on a oublié de lancer, et
// un message suffit. En production, un serveur qui répond alors que sa base
// est injoignable est pire qu'un serveur mort : l'hébergeur le croit sain et
// laisse le trafic arriver sur des 500. On sort en échec.
db.query('SELECT 1')
  .then(() => {
    journal.info('Base de données connectée.');
  })
  .catch((err) => {
    journal.erreur('Connexion à la base impossible :', err.message);

    if (EN_PRODUCTION) {
      journal.erreur('Arrêt : une API sans base ne doit pas se déclarer disponible.');
      process.exit(1);
    }

    journal.erreur('Vérifier : MySQL/MariaDB lancé, base créée, migrations appliquées (back/db), .env correct.');
  });

// Images téléversées. Sous /api pour que le proxy Vite les relaie en
// développement et qu'elles partagent l'origine du front en production.
// `dotfiles: 'deny'` et l'absence d'index empêchent de lister le dossier ou
// d'aller chercher autre chose que les fichiers qu'on y a écrits.
app.use('/api/uploads', express.static(DOSSIER_UPLOADS, {
    index: false,
    dotfiles: 'deny',
    maxAge: '7d',
    setHeaders: (res) => {
        // Le nom des fichiers est tiré au hasard et ne change jamais : une
        // image peut être gardée longtemps. Mais elle reste servie comme une
        // pièce jointe inerte, jamais interprétée par le navigateur.
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'inline');
    }
}));

app.use('/api/cafes', require('./routes/cafes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/favoris', require('./routes/favoris'));
app.use('/api/avis', require('./routes/avis'));

// Sonde de disponibilité. Elle interroge la base : répondre « ok » sans l'avoir
// touchée revient à certifier sain un serveur qui renvoie des 500 sur toutes
// les autres routes, et c'est la panne la plus longue à diagnostiquer.
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', base: 'ok' });
  } catch (err) {
    journal.erreur('[health] base injoignable :', err.message);
    res.status(503).json({ status: 'degrade', base: 'injoignable' });
  }
});

// 404 global : une route inconnue répond du JSON comme le reste de l'API,
// pas la page HTML par défaut d'Express.
app.use((req, res) => {
  res.status(404).json({ error: `Route inconnue : ${req.method} ${req.originalUrl}` });
});

// Gestionnaire d'erreurs global — dernier filet. Le détail reste au serveur.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  journal.erreur('[erreur non rattrapée]', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Corps de requête JSON invalide.' });
  }

  res.status(err.status || 500).json({ error: 'Erreur serveur' });
});

const serveur = app.listen(PORT, () => {
  journal.info(`API SpotThePlace sur http://localhost:${PORT} (${NODE_ENV})`);
  journal.info(`Origine autorisée : ${FRONTEND_URL}`);
  journal.info(`trust proxy : ${TRUST_PROXY ? 'activé' : 'désactivé'}`);
});

// Arrêt propre. Un hébergeur envoie SIGTERM puis tue le processus quelques
// secondes plus tard : sans ce bloc, les requêtes en vol sont coupées net à
// chaque redéploiement et le pool MySQL n'est jamais rendu.
const DELAI_ARRET_MS = 10_000;
let arretEnCours = false;

const arreter = (signal) => {
  if (arretEnCours) return;
  arretEnCours = true;

  journal.info(`${signal} reçu — arrêt en cours.`);

  // Filet : si une requête ne se termine jamais, on ne reste pas suspendu
  // jusqu'à ce que l'hébergeur nous tue sans ménagement.
  const minuteur = setTimeout(() => {
    journal.erreur(`Arrêt forcé après ${DELAI_ARRET_MS} ms : des connexions traînaient.`);
    process.exit(1);
  }, DELAI_ARRET_MS);

  minuteur.unref();

  serveur.close(async () => {
    try {
      await db.end();
      journal.info('Pool MySQL fermé. Arrêt terminé.');
      process.exit(0);
    } catch (err) {
      journal.erreur('Fermeture du pool MySQL impossible :', err.message);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => arreter('SIGTERM'));
process.on('SIGINT', () => arreter('SIGINT'));
