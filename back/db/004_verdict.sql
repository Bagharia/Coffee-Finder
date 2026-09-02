-- 004 — le verdict.
-- Le produit repose sur l'avis de Wendy et le modèle n'avait pas d'endroit où
-- le mettre : il serait devenu un `avis` parmi les autres, noyé dans la
-- moyenne. Le verdict appartient à l'adresse, pas à la table des avis.
--
-- Syntaxe portable MySQL 8 / MariaDB, voir 002.

USE spotheplace;

ALTER TABLE cafes
  ADD COLUMN verdict TEXT NULL,
  ADD COLUMN coup_de_coeur TINYINT(1) NOT NULL DEFAULT 0;
