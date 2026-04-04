-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS spotheplace;
USE spotheplace;

-- Table des cafés
CREATE TABLE IF NOT EXISTS cafes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  arrondissement VARCHAR(50),
  adresse VARCHAR(255),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des critères des cafés
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

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion de quelques données de test
INSERT INTO cafes (nom, arrondissement, adresse, image_url) VALUES
('Café de Flore', '6e', '172 Boulevard Saint-Germain, 75006 Paris', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'),
('Le Consulat', '18e', '18 Rue Norvins, 75018 Paris', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800'),
('Ten Belles', '10e', '10 Rue de la Grange aux Belles, 75010 Paris', 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800'),
('Café Kitsuné', '1er', '51 Galerie de Montpensier, 75001 Paris', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800'),
('Loustic', '3e', '40 Rue Chapon, 75003 Paris', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800');

-- Insertion des critères pour chaque café
INSERT INTO criteres_cafe (cafe_id, nb_personnes, horaires, specialite, prix, wifi, prises, travailler, theme, ambiance) VALUES
(1, '2-4', '7h-22h', 'Café,Pâtisseries', '10-20', 1, 1, 1, 'Classique', 'Calme'),
(2, '2-6', '8h-20h', 'Café,Brunch', '10-20', 0, 0, 0, 'Artistique', 'Animée'),
(3, '1-2', '8h-18h', 'Café', '1-10', 1, 1, 1, 'Moderne', 'Calme'),
(4, '2-4', '9h-19h', 'Café,Matcha', '10-20', 1, 1, 1, 'Japonais', 'Calme'),
(5, '1-3', '8h-17h', 'Café', '1-10', 1, 1, 1, 'Minimaliste', 'Calme');
