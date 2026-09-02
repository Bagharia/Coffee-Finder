-- 005 — horaires exploitables.
-- criteres_cafe.horaires est du texte libre ('7h-22h') : on ne peut pas en
-- déduire « ouvert maintenant », qui est pourtant l'un des trois usages
-- autorisés du rouge dans la DA.
-- Convention : jour 1 = lundi … 7 = dimanche. Absence de ligne pour un jour
-- = fermé ce jour-là. Plusieurs lignes par jour = service coupé (midi / soir).

USE spotheplace;

CREATE TABLE IF NOT EXISTS cafe_horaires (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cafe_id INT NOT NULL,
  jour SMALLINT NOT NULL,
  ouverture TIME NOT NULL,
  fermeture TIME NOT NULL,
  UNIQUE KEY horaire_cafe_jour_ouverture (cafe_id, jour, ouverture),
  FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON DELETE CASCADE
);

CREATE INDEX idx_horaires_cafe ON cafe_horaires (cafe_id);
