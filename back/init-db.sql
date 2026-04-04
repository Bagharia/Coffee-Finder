-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS spotheplace;
USE spotheplace;

-- Table des cafés
CREATE TABLE IF NOT EXISTS cafes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(500),
  rating DECIMAL(2, 1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des spécialités (relation many-to-many)
CREATE TABLE IF NOT EXISTS specialties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS cafe_specialties (
  cafe_id INT,
  specialty_id INT,
  PRIMARY KEY (cafe_id, specialty_id),
  FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON DELETE CASCADE,
  FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE CASCADE
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
INSERT IGNORE INTO cafes (name, address, description, image, rating) VALUES
('Café de Flore', '172 Boulevard Saint-Germain, 75006 Paris', 'Un café historique de Saint-Germain-des-Prés', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800', 4.5),
('Le Consulat', '18 Rue Norvins, 75018 Paris', 'Charmant café à Montmartre', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800', 4.7),
('Ten Belles', '10 Rue de la Grange aux Belles, 75010 Paris', 'Coffee shop spécialisé', 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800', 4.3),
('Café Kitsuné', '51 Galerie de Montpensier, 75001 Paris', 'Café japonais dans le Palais Royal', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', 4.6),
('Loustic', '40 Rue Chapon, 75003 Paris', 'Torréfacteur artisanal', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800', 4.8);

-- Insertion des spécialités
INSERT IGNORE INTO specialties (name) VALUES
('Café'),
('Thé'),
('Pâtisseries'),
('Matcha'),
('Bubble Tea'),
('Brunch');

-- Lier les cafés aux spécialités
INSERT IGNORE INTO cafe_specialties (cafe_id, specialty_id) VALUES
(1, 1), (1, 3),
(2, 1), (2, 3),
(3, 1),
(4, 1), (4, 4),
(5, 1);
