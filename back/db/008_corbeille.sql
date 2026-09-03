-- 008 — suppression douce.
-- `DELETE FROM cafes` emportait les critères, les avis et les favoris en
-- cascade, définitivement. Une seule personne administre le guide : un clic
-- malheureux effaçait le travail sans filet, et rien dans l'interface ne
-- distingue « je supprime cette fiche » de « je supprime cette fiche et tous
-- les avis que les visiteurs y ont laissés ».
--
-- Une date de suppression plutôt qu'un DELETE : la ligne reste, les cascades
-- ne se déclenchent pas, et la fiche redevient visible d'un UPDATE.
-- La suppression définitive reste possible, mais elle se demande explicitement.
--
-- Le nom de la base n'est pas écrit ici : elle vient de la connexion,
-- voir db/migrate.js.

ALTER TABLE cafes
  ADD COLUMN supprime_le TIMESTAMP NULL DEFAULT NULL;

-- Toutes les lectures filtrent sur cette colonne : sans index, chaque liste
-- deviendrait un parcours complet de la table.
CREATE INDEX cafes_supprime_le ON cafes (supprime_le);
