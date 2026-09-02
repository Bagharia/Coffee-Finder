-- 003 — avis et favoris.
-- Les deux tables étaient utilisées par les contrôleurs et créées nulle part :
-- un clone frais du dépôt ne démarrait pas.
-- L'index UNIQUE(user_id, cafe_id) n'est pas décoratif : c'est lui qui rend
-- possible l'ON DUPLICATE KEY UPDATE de addOrUpdateAvis, et il interdit à un
-- compte de noter deux fois la même adresse.

USE spotheplace;

CREATE TABLE IF NOT EXISTS avis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cafe_id INT NOT NULL,
  note TINYINT NOT NULL,
  commentaire TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY avis_user_cafe (user_id, cafe_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favoris (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cafe_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY favori_user_cafe (user_id, cafe_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON DELETE CASCADE
);
