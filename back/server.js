const { PORT, NODE_ENV, FRONTEND_URL } = require('./config/env');
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const { securityHeaders } = require('./middleware/securityHeaders');

const app = express();

app.disable('x-powered-by');

// Derrière un reverse proxy, req.ip vaut l'adresse du proxy et le limiteur de
// débit compte tout le monde ensemble. À n'activer que si un proxy est bien là :
// sinon n'importe qui usurpe son IP via X-Forwarded-For.
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(securityHeaders);

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '100kb' }));

// Vérification de la connexion à la base au démarrage.
db.query('SELECT 1')
  .then(() => {
    console.log('Base de données connectée.');
  })
  .catch((err) => {
    console.error('Connexion à la base impossible :', err.message);
    console.error('Vérifier : MySQL/MariaDB lancé, base créée, migrations appliquées (back/db), .env correct.');
  });

app.use('/api/cafes', require('./routes/cafes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/favoris', require('./routes/favoris'));
app.use('/api/avis', require('./routes/avis'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 global : une route inconnue répond du JSON comme le reste de l'API,
// pas la page HTML par défaut d'Express.
app.use((req, res) => {
  res.status(404).json({ error: `Route inconnue : ${req.method} ${req.originalUrl}` });
});

// Gestionnaire d'erreurs global — dernier filet. Le détail reste au serveur.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[erreur non rattrapée]', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Corps de requête JSON invalide.' });
  }

  res.status(err.status || 500).json({ error: 'Erreur serveur' });
});

app.listen(PORT, () => {
  console.log(`API SpotThePlace sur http://localhost:${PORT} (${NODE_ENV})`);
  console.log(`Origine autorisée : ${FRONTEND_URL}`);
});
