require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const db = require('./config/db');

// Configuration CORS sécurisée
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.set('json spaces', 2);
}

// Test de la connexion à la base de données
db.query('SELECT 1')
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    console.error('Please check:');
    console.error('1. MySQL/MariaDB is running');
    console.error('2. Database "spotheplace" exists');
    console.error('3. .env credentials are correct');
  });

const cafesRoutes = require('./routes/cafes');
const usersRoutes = require('./routes/users');
const favorisRoutes = require('./routes/favoris');
const avisRoutes = require('./routes/avis');

app.use('/api/cafes', cafesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/favoris', favorisRoutes);
app.use('/api/avis', avisRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
  console.log(`📍 API available at http://localhost:${port}`);
});
