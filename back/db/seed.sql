-- Jeu de données de départ, à exécuter après les migrations, jamais en production.
-- Les images sont volontairement nulles : le front affiche alors son image de
-- repli plutôt qu'une photo d'agence sans rapport avec l'adresse.

USE spotheplace;

INSERT INTO cafes (nom, arrondissement, adresse, description) VALUES
('Café de Flore', '6e', '172 Boulevard Saint-Germain, 75006 Paris', NULL),
('Le Consulat', '18e', '18 Rue Norvins, 75018 Paris', NULL),
('Ten Belles', '10e', '10 Rue de la Grange aux Belles, 75010 Paris', NULL),
('Café Kitsuné', '1er', '51 Galerie de Montpensier, 75001 Paris', NULL),
('Loustic', '3e', '40 Rue Chapon, 75003 Paris', NULL);

INSERT INTO criteres_cafe (cafe_id, nb_personnes, horaires, specialite, prix, wifi, prises, travailler, theme, ambiance) VALUES
(1, '2-4', '7h-22h', 'Café,Pâtisseries', '10-20', 1, 1, 1, 'Classique', 'Calme'),
(2, '2-6', '8h-20h', 'Café,Brunch', '10-20', 0, 0, 0, 'Artistique', 'Animée'),
(3, '1-2', '8h-18h', 'Café', '1-10', 1, 1, 1, 'Moderne', 'Calme'),
(4, '2-4', '9h-19h', 'Café,Matcha', '10-20', 1, 1, 1, 'Japonais', 'Calme'),
(5, '1-3', '8h-17h', 'Café', '1-10', 1, 1, 1, 'Minimaliste', 'Calme');
