-- 001 — schéma initial : adresses, critères, comptes.
-- Reprend l'ancien init-db-correct.sql, à l'identique, pour que les bases déjà
-- créées avec lui soient considérées comme ayant appliqué cette migration.
-- Le nom de la base n'est plus écrit ici : un hébergeur impose le sien, et un
-- `USE spotheplace` codé en dur rend le fichier inapplicable ailleurs. La base
-- est choisie par la connexion — voir db/migrate.js.

CREATE TABLE IF NOT EXISTS cafes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  arrondissement VARCHAR(50),
  adresse VARCHAR(255),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS criteres_cafe (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cafe_id INT NOT NULL,
  nb_personnes VARCHAR(50),
  horaires VARCHAR(100),
  specialite VARCHAR(255),
  prix VARCHAR(20),
  wifi TINYINT(1) DEFAULT 0,
  prises TINYINT(1) DEFAULT 0,
  travailler TINYINT(1) DEFAULT 0,
  theme VARCHAR(255),
  ambiance VARCHAR(100),
  FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
