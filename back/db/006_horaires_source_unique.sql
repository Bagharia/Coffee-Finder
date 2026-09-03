-- 006 — l'horaire n'a plus qu'une source.
-- `criteres_cafe.horaires` était du texte libre ('8h-17h') et `cafe_horaires`
-- décrit la même chose en exploitable. Deux sources pour une information se
-- contredisent toujours : on corrige l'une et on oublie l'autre. La chaîne
-- affichée se dérive désormais des plages, la colonne texte disparaît.
--
-- Le nom de la base n'est pas écrit ici : elle vient de la connexion,
-- voir db/migrate.js.

ALTER TABLE criteres_cafe DROP COLUMN horaires;
