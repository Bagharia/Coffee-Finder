-- Jeu de données de démonstration, à exécuter après les migrations, jamais en
-- production. Le nom de la base n'est pas écrit ici : la choisir à la connexion.
--
--   mysql -u <user> -p <base> < db/seed.sql
--
-- Les cinq établissements sont **inventés**, posés à de vraies adresses
-- parisiennes. Le dépôt est public : attribuer à Wendy des avis fabriqués sur
-- des commerces existants n'a aucune raison d'être. Les adresses, elles, sont
-- réelles, pour que les coordonnées et le rendu de la carte soient
-- représentatifs. Vérifié le 2026-09-03 : aucun de ces noms ne correspond à un
-- commerce parisien connu d'OpenStreetMap.
--
-- Coordonnées géocodées via Nominatim, écrites en dur : un seed ne dépend pas
-- d'un service réseau. Photos servies par Wikimedia Commons, licences libres.
--
-- `width=640` et non 1200 : les cartes affichent 320 à 380 px et la vedette
-- 760. Demander 1200 quadruplait le poids de la page d'accueil — 1,1 Mo, quand
-- la DA vise une première image utile sous deux secondes en 4G.
--
-- Les critères sont volontairement contrastés — trois tranches de prix, wifi et
-- prises mélangés, cinq ambiances — pour que les filtres aient de quoi trier.

DELETE FROM cafe_horaires;
DELETE FROM criteres_cafe;
DELETE FROM cafes;
ALTER TABLE cafes AUTO_INCREMENT = 1;

INSERT INTO cafes (id, nom, arrondissement, adresse, description, image_url, latitude, longitude, verdict, coup_de_coeur) VALUES
(1, 'Le Tamis', '3e', '12 Rue de Bretagne, 75003 Paris',
 'Une salle en longueur, torréfaction sur place, huit places assises et une table haute contre la vitrine.',
 'https://commons.wikimedia.org/wiki/Special:FilePath/Cozy_coffee_shop_corner_%28Unsplash%29.jpg?width=640',
 48.86262420, 2.36327170,
 'Le meilleur filtre du quartier, et le seul endroit où on me demande ce que je veux boire au lieu de me servir le café du jour. La table haute contre la vitrine est la bonne place : lumière correcte, deux prises dessous, et le bruit de la machine reste derrière. Arriver avant dix heures, après il n''y a plus rien.',
 1),

(2, 'Bocal et Carafe', '11e', '45 Rue de Charonne, 75011 Paris',
 'Grande salle carrelée, cuisine ouverte, terrasse de six tables. Service coupé entre le déjeuner et le soir.',
 'https://commons.wikimedia.org/wiki/Special:FilePath/Baristas_at_work_%28Unsplash%29.jpg?width=640',
 48.85338180, 2.37716520,
 'On y vient manger, pas travailler — et c''est très bien comme ça. Le brunch tient ses promesses, la salle est bruyante dès midi, il n''y a pas une prise accessible. Y aller à deux, un dimanche, sans ordinateur. Fermé lundi et mardi, ce que j''oublie une fois sur deux.',
 0),

(3, 'La Petite Verse', '9e', '8 Rue des Martyrs, 75009 Paris',
 'Salon de thé sur deux niveaux. L''étage est plus calme que la salle du bas, et presque personne n''y monte.',
 'https://commons.wikimedia.org/wiki/Special:FilePath/Cafe_with_light_bulbs_hanging_%28Unsplash%29.jpg?width=640',
 48.87708270, 2.33938890,
 'La carte des thés est sérieuse et les pâtisseries suivent, ce qui est rare. Mais le vrai argument est l''étage : quatre tables, une fenêtre, et un silence qu''on ne trouve pas à ce prix dans le quartier. J''y ai écrit la moitié de ce site. Fermé le lundi.',
 1),

(4, 'Maison Perlée', '14e', '25 Rue Daguerre, 75014 Paris',
 'Comptoir de bubble tea sur la rue piétonne. Trois tabourets, tout se prend à emporter.',
 'https://commons.wikimedia.org/wiki/Special:FilePath/Crew_Collective_and_Caf%C3%A9%2C_Montr%C3%A9al%2C_Canada_%28Unsplash_ZNog43hBeE8%29.jpg?width=640',
 48.83415060, 2.32891870,
 'Le matcha est bon et le thé au lait perlé aussi, ce qui n''arrive jamais dans la même adresse. Ce n''est pas un café, c''est un comptoir : on commande debout, on repart avec son gobelet. Ouvert tous les jours, y compris le dimanche, ce qui vaut le déplacement à soi seul.',
 0),

(5, 'Comptoir Norvège', '20e', '60 Rue de Belleville, 75020 Paris',
 'Café de quartier ouvert jusqu''à une heure et demie du matin. Calme le matin, plein à partir de dix-huit heures.',
 'https://commons.wikimedia.org/wiki/Special:FilePath/Drip_brewing_%28Unsplash%29.jpg?width=640',
 48.87331400, 2.38245300,
 'Deux adresses en une. Avant midi c''est une salle de travail : de la place, des prises le long du mur, personne pour vous presser. Après dix-huit heures c''est un bar, et il ne faut plus rien espérer y faire. Savoir laquelle des deux on vient chercher.',
 0);

-- La colonne texte `horaires` a disparu en migration 006 : les horaires ne
-- vivent plus que dans cafe_horaires, plus bas.
INSERT INTO criteres_cafe (cafe_id, nb_personnes, specialite, prix, wifi, prises, travailler, theme, ambiance) VALUES
(1, '1-2', 'Café',              '1-10',  1, 1, 1, 'Minimaliste', 'Calme'),
(2, '2-6', 'Café,Brunch',       '10-20', 1, 0, 0, 'Moderne',     'Animée'),
(3, '1-3', 'Thé,Pâtisseries',   '10-20', 1, 1, 1, 'Classique',   'Calme'),
(4, '2-4', 'Bubble tea,Matcha', '1-10',  0, 0, 0, 'Japonais',    'Animée'),
(5, '2-6', 'Café',              '10-20', 1, 1, 1, 'Nordique',    'Animée');

-- Horaires exploitables. Convention de la migration 005 : jour 1 = lundi …
-- 7 = dimanche, absence de ligne pour un jour = fermé ce jour-là, plusieurs
-- lignes pour un même jour = service coupé.
--
-- Deux cas volontaires, parce qu'ils cassent toute implémentation naïve de
-- « ouvert maintenant » :
--   - Bocal et Carafe ferme lundi et mardi, et coupe entre 15h et 18h.
--   - Comptoir Norvège ferme à 1h30, soit après minuit : sa fermeture est
--     *antérieure* à son ouverture. Un test `ouverture <= maintenant <=
--     fermeture` répond « fermé » à minuit et demi, ce qui est faux.
INSERT INTO cafe_horaires (cafe_id, jour, ouverture, fermeture) VALUES
-- Le Tamis — lundi à vendredi 8h-17h, samedi 9h-18h, dimanche fermé
(1, 1, '08:00:00', '17:00:00'),
(1, 2, '08:00:00', '17:00:00'),
(1, 3, '08:00:00', '17:00:00'),
(1, 4, '08:00:00', '17:00:00'),
(1, 5, '08:00:00', '17:00:00'),
(1, 6, '09:00:00', '18:00:00'),

-- Bocal et Carafe — mercredi à dimanche, service coupé. Lundi et mardi fermés.
(2, 3, '09:00:00', '15:00:00'),
(2, 3, '18:00:00', '23:00:00'),
(2, 4, '09:00:00', '15:00:00'),
(2, 4, '18:00:00', '23:00:00'),
(2, 5, '09:00:00', '15:00:00'),
(2, 5, '18:00:00', '23:00:00'),
(2, 6, '09:00:00', '15:00:00'),
(2, 6, '18:00:00', '23:00:00'),
(2, 7, '09:00:00', '15:00:00'),

-- La Petite Verse — mardi à dimanche 10h-19h, lundi fermé
(3, 2, '10:00:00', '19:00:00'),
(3, 3, '10:00:00', '19:00:00'),
(3, 4, '10:00:00', '19:00:00'),
(3, 5, '10:00:00', '19:00:00'),
(3, 6, '10:00:00', '19:00:00'),
(3, 7, '10:00:00', '19:00:00'),

-- Maison Perlée — tous les jours 11h-19h30
(4, 1, '11:00:00', '19:30:00'),
(4, 2, '11:00:00', '19:30:00'),
(4, 3, '11:00:00', '19:30:00'),
(4, 4, '11:00:00', '19:30:00'),
(4, 5, '11:00:00', '19:30:00'),
(4, 6, '11:00:00', '19:30:00'),
(4, 7, '11:00:00', '19:30:00'),

-- Comptoir Norvège — tous les jours 8h-1h30, fermeture après minuit
(5, 1, '08:00:00', '01:30:00'),
(5, 2, '08:00:00', '01:30:00'),
(5, 3, '08:00:00', '01:30:00'),
(5, 4, '08:00:00', '01:30:00'),
(5, 5, '08:00:00', '01:30:00'),
(5, 6, '08:00:00', '01:30:00'),
(5, 7, '08:00:00', '01:30:00');
