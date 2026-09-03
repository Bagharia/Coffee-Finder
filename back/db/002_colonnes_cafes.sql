-- 002 — colonnes manquantes sur `cafes`.
-- `description` était écrite par les contrôleurs sans exister au schéma :
-- toute création d'adresse échouait. `latitude`/`longitude` reprennent
-- l'ancien add-coordinates.sql.
--
-- Syntaxe portable MySQL 8 / MariaDB : pas de IF NOT EXISTS sur ADD COLUMN,
-- que MySQL ne connaît pas. Une migration s'applique une fois, dans l'ordre ;
-- la rejouer échoue bruyamment, et c'est le comportement voulu.
-- Le nom de la base n'est plus écrit ici : un hébergeur impose le sien, et un
-- `USE spotheplace` codé en dur rend le fichier inapplicable ailleurs. La base
-- est choisie par la connexion — voir db/migrate.js.

ALTER TABLE cafes
  ADD COLUMN description TEXT NULL AFTER adresse,
  ADD COLUMN latitude DECIMAL(10, 8) NULL,
  ADD COLUMN longitude DECIMAL(11, 8) NULL;
