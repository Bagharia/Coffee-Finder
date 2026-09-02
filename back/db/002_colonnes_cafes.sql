-- 002 — colonnes manquantes sur `cafes`.
-- `description` était écrite par les contrôleurs sans exister au schéma :
-- toute création d'adresse échouait. `latitude`/`longitude` reprennent
-- l'ancien add-coordinates.sql.
-- Note : ADD COLUMN IF NOT EXISTS est une syntaxe MariaDB. Sur MySQL 8,
-- retirer les IF NOT EXISTS et n'exécuter la migration qu'une fois.

USE spotheplace;

ALTER TABLE cafes
  ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER adresse,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL;
