-- 007 — pouvoir révoquer les sessions.
-- Un JWT est valable jusqu'à son expiration et rien ne peut l'annuler : changer
-- son mot de passe ne déconnectait donc pas les sessions ouvertes. Or on change
-- son mot de passe précisément quand on pense que quelqu'un a accès au compte,
-- et cette personne le gardait encore vingt-quatre heures.
--
-- Le compteur est copié dans le jeton à l'émission et vérifié à chaque requête :
-- l'incrémenter invalide d'un coup tous les jetons déjà émis.
--
-- Le nom de la base n'est pas écrit ici : elle vient de la connexion,
-- voir db/migrate.js.

ALTER TABLE users
  ADD COLUMN jeton_version INT NOT NULL DEFAULT 0;
