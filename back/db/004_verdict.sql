-- 004 — le verdict.
-- Le produit repose sur l'avis de Wendy et le modèle n'avait pas d'endroit où
-- le mettre : il serait devenu un `avis` parmi les autres, noyé dans la moyenne.
-- Le verdict appartient à l'adresse, pas à la table des avis de lecteurs.

USE spotheplace;

ALTER TABLE cafes
  ADD COLUMN IF NOT EXISTS verdict TEXT NULL,
  ADD COLUMN IF NOT EXISTS coup_de_coeur TINYINT(1) NOT NULL DEFAULT 0;
