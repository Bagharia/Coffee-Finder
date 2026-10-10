# DA.md — SpotThePlace

Direction artistique du guide. `CLAUDE-5.md` interdit de toucher au front sans
l'avoir lue : ce fichier est la source de vérité du visuel, et le seul endroit
où une décision esthétique se prend.

**État : tranchée.** Toutes les sections sont fermées.

**Révision du 2026-10-10.** Maquette Claude Design « Accueil final », validée
par Alexis après la relecture d'une personne extérieure. Quatre bascules, toutes
datées dans les sections concernées : le verdict se lit en Nunito et la
manuscrite ne garde que la signature (sections 1, 3, 5) ; l'interface passe
tout en minuscules (section 3) ; le favori devient un signet et le cœur va au
coup de cœur (sections 5, 7) ; le gris secondaire est assombri parce qu'il
échouait au contraste (section 2). Une phrase de concept ouvre l'accueil. Le
pourquoi est dans l'entrée du 2026-10-10 de `alexis.md`.

**Révision du 2026-09-05.** Cette DA remplace la doctrine « plaque de rue »
(rectangle vert presque carré, zéro ombre, zéro couleur de catégorie) par le
langage visuel d'un mockup Claude Design validé par Alexis : palette chaude,
formes en pilule, ombres, couleur par catégorie. Une DA « tranchée » ne
s'écrase pas en silence — elle se révise et se date. L'ancienne version
complète reste consultable via `git log -- DA.md`. Le pourquoi détaillé de
chaque bascule est dans l'entrée du 2026-09-05 de `alexis.md`. Une décision non
couverte ici se prend en cohérence avec la section 1, et se réécrit ici juste
après.

---

## Ce qui est déjà fixé par `CLAUDE-5.md`

Ces points ne se rediscutent pas, ils se respectent.

- Toute valeur visuelle passe par le `@theme` de `src/index.css`. Aucune valeur
  arbitraire Tailwind, aucune couleur en dur dans le JSX.
- `.voix` est réservée aux avis de Wendy. Jamais pour du texte d'interface.
- Aucun emoji dans le rendu. Un pictogramme est un SVG monochrome dans
  `src/icons/`.
- Aucune image externe en dur. L'image manquante est la classe `.image-repli`.
- Le verdict de Wendy s'affiche **en premier** sur chaque fiche.
- Contraste AA partout, focus visible, cibles tactiles à 44 px minimum,
  `prefers-reduced-motion` respecté.

---

## 1. Le parti pris

**Le site tient toujours deux registres qui ne se mélangent jamais** — ça, la
révision ne le touche pas.

- **Repérage.** Tout ce qui sert à trouver un lieu : nom, arrondissement,
  catégorie, prix, horaires, boutons, navigation, états. Nunito, compact.
- **Voix.** Uniquement les mots de Wendy, dans un encart. Depuis le 2026-10-10
  le texte est en Nunito, pour être lu ; c'est l'encart qui le distingue, et une
  signature manuscrite « — wendy » sur la une et sur la fiche. ~~Caveat
  manuscrite, grand corps, ligne courte.~~ Toujours sans guillemets ajoutés.

**Ce qui change : l'ancrage formel.** La plaque de rue parisienne (rectangle,
filet en retrait, aucune ombre) cède la place à un vocabulaire de carnet
d'adresses chaleureux : pilules, cartes à coins arrondis, ombres douces,
couleur par catégorie. Toujours parisien, mais par le propos (arrondissements,
adresses réelles), plus par la citation visuelle du mobilier urbain.

La règle de décision reste la même pour tout composant à venir : un élément
appartient au repérage ou à la voix, jamais aux deux. Un prix est du repérage.
Une phrase de Wendy est de la voix. Un bouton est du repérage, toujours.

---

## 2. Couleurs

Valeurs définitives, dans le `@theme` de `src/index.css`.

| Jeton | Valeur | Rôle | Contraste vérifié |
|---|---|---|---|
| `--color-plaque` | `#16453A` | logo, nav, pied de page, boutons principaux, texte courant | blanc dessus : 10,8:1 |
| `--color-plaque-clair` | `#2C6153` | survol/actif sur fond plaque | |
| `--color-plaque-attenue` | `#B9D2C7` | texte secondaire sur fond plaque foncé | |
| `--color-papier` | `#E9DFCD` | fond de page | |
| `--color-creme` | `#F6EEDF` | halo décoratif de fond, jamais de texte dessus | |
| `--color-carte` | `#FFFDF8` | surfaces de contenu (cartes, encarts de verdict) | |
| `--color-encre` | `#16453A` | texte courant — réutilise le vert de marque | 8,17:1 sur papier · 10,6:1 sur carte |
| `--color-gris` | `#67604D` | texte secondaire, métadonnées | 4,74:1 sur papier · 6,15:1 sur carte. Assombri le 2026-10-10 : l'ancien `#6E6753` ne faisait que 4,27:1 sur le papier de la palette du 2026-09-05, sous le seuil AA — le 4,74 affiché ici datait de l'ancien fond |
| `--color-trait` | `#D6CBAE` | filets, séparateurs, motif de repli neutre | décoratif, hors seuil |
| `--color-trait-fort` | `#8F8460` | bordures interactives (input, bouton secondaire) | ≥3:1 |
| `--color-rouge` | `#A82F26` | erreurs et actions destructrices de formulaire (admin, compte), marqueur sélectionné sur la carte | 5,71:1 sur papier |
| `--color-vert-accent` | `#A9D94A` | « ouvert maintenant », appel à l'action carte — jamais de texte blanc dessus | texte foncé `--color-vert-accent-texte` |

**Couleur par catégorie — décision renversée le 2026-09-05.** L'ancienne DA
refusait un code couleur par spécialité (« ça impose un code arbitraire à
retenir »). Le mockup en fait un principe de lecture rapide de la grille, et
Alexis a tranché en sa faveur en connaissance de l'ancien refus. Deux teintes
par catégorie :

| Catégorie | `-vif` (motif, fond « sans photo ») | `-clair` (encart du verdict) |
|---|---|---|
| Café | `#BC9868` | `#F3EADD` |
| Matcha | `#9FC24E` | `#F1F5E4` |
| Bubble tea | `#E0B0CD` | `#FBEDF5` |
| Thé / salon de thé | `#D9B47E` | `#F6EDDF` |

`--color-encre` par-dessus dans tous les cas : les quatre teintes ont une
luminosité proche du papier, donc un ordre de contraste comparable — pas de
recalcul séparé nécessaire, mais toute nouvelle teinte de catégorie doit être
vérifiée avant d'être ajoutée.

**Le rouge.** Sa portée réelle dans le code n'a jamais été les trois usages
que l'ancienne DA énonçait : il sert depuis le début aux messages d'erreur et
actions destructrices des formulaires (inscription, mot de passe, admin), en
plus du marqueur sélectionné sur la carte. Ça continue. Ce qui change : le
badge « coup de cœur de Wendy » n'est plus rouge — le mockup le traite en
badge plaque sombre avec une puce d'accent vert (`.plaque` + `.plaque-puce`),
et cette DA suit le mockup ici. Le rouge ne se pose jamais sur le vert
(1,59:1) : en cas de besoin, on inverse (surface rouge, texte blanc, 6,77:1).

---

## 3. Typographie

Deux familles, chargées dans `index.html`.

| | Famille | Graisses | Rôle |
|---|---|---|---|
| Repérage | **Nunito** | 400, 600, 700, 800 | navigation, titres, boutons, étiquettes, données |
| Signature | **Caveat** | 600 | « — wendy », sous le verdict de la une et de la fiche. Rien d'autre |

**Révisé le 2026-10-10.** Caveat portait tout le verdict. Sur les cartes, 250 à
300 caractères de manuscrite à 1.15rem se lisaient mal, et c'est le produit.
Le verdict passe en Nunito (`.voix` au corps courant, `.voix-une` à 1rem,
`.voix-carte` à 0.9375rem) ; Caveat ne sert plus qu'à la signature
(`.signature`, 1.25rem). Elle ne figure pas sur les cartes de grille : une seule
personne écrit, la répéter douze fois par page n'apprend rien.

Règles de capitalisation, de mesure et de ponctuation **inchangées** (voir
l'historique git pour leur raisonnement complet, conservé intégralement) :

- **Tout en minuscules** dans l'interface : navigation, boutons, libellés,
  états, titres. Révisé le 2026-10-10 — ~~majuscule à chaque mot, capitale
  française dans les titres~~ : la règle précédente cohabitait avec des textes
  déjà en minuscules (« tout paris », « s'inscrire ») et les deux se voyaient
  côte à côte dans la barre du haut.
- Gardent leur casse : ce qui vient de la base (noms d'adresses, verdicts de
  Wendy, messages d'erreur de l'API), les noms propres dans une mention légale
  (« OpenStreetMap »), les sigles et unités (« JPEG », « 5 Mo »), et les titres
  d'onglet du navigateur.
- Écrit dans les chaînes elles-mêmes, jamais par `text-transform`.
- Corps sous 70 caractères par ligne, voix sous 46.
- Pas de métadonnées collées par points médians, pas de numérotation 01/02/03.
  Une exception depuis le 2026-10-10, tirée de la maquette : sur téléphone, les
  cartes compactes de l'accueil écrivent « café · 11e » sur une ligne, faute de
  place pour l'étiquette.

---

## 4. La plaque, les pilules et les cartes

**La plaque** garde son rôle d'étiquette forte (badge « coup de cœur »,
catégorie, marqueur de carte) mais change de géométrie : `border-radius: 999px`
au lieu d'un rectangle presque carré, et porte désormais une ombre
(`--shadow-carte`).

**Le nom du site n'est plus une plaque.** Dans le mockup, « spottheplace »
s'écrit en toutes lettres, gras, sans fond ni pilule, en nav comme en pied de
page — la plaque reste réservée aux étiquettes de contenu, pas au wordmark.

**Sur la carte Leaflet.** Toujours un `L.divIcon` portant le nom de l'adresse
en toutes lettres, jamais une simple épingle : le mockup ne le contredit pas
vraiment — son schéma de carte n'est qu'un décor illustratif dans le bandeau
d'appel à l'action, pas une maquette de la vraie carte interactive. La règle
vient d'un besoin d'usage réel (lisible en marchant), pas d'un choix
esthétique : elle est gardée, seulement reskinnée en pilule.

**Regroupement.** Toujours une plaque portant le nombre et le mot (« 7
adresses »), jamais une pastille ronde chiffrée.

**Les cartes de contenu** (adresse, verdict, filtre) utilisent
`--radius-carte` (22px) et `--shadow-carte`, avec `--shadow-carte-vif` au
survol sur les éléments cliquables — voir section 8 sur l'animation.

---

## 5. La voix de Wendy

**Révisé le 2026-10-10.** ~~Ce qui la distingue reste la famille et le corps :
Caveat au milieu d'une page en Nunito se reconnaît instantanément.~~ Ce qui la
distingue est désormais l'encart, et la signature là où le verdict est mis en
avant. Sur la une, le verdict est coupé à quatre lignes : le reste se lit sur la
fiche. La coupe se pose sur le texte et non sur l'encart — sur un bloc qui a du
padding, la ligne suivante dépassait.

La voix n'est plus posée sur un simple filet, elle vit dans un encart — carte blanche (`.voix`,
`.voix-une`) ou carte teintée par catégorie (`.voix-carte.teinte-*`). Toujours
pas de guillemets ajoutés : l'encart remplace le filet comme signal visuel, la
typographie reste la citation.

**Sur une fiche.** Ordre imposé, inchangé : en-tête (nom, arrondissement),
photo ou `.image-repli`, **puis le verdict**, puis les informations pratiques
en tableau serré.

**`coup_de_coeur`.** Un badge `.plaque` sombre portant un cœur plein (accent
vert) et le mot « coup de cœur de wendy ». Révisé le 2026-10-10 : ~~avec
`.plaque-puce`… ça reste un mot, jamais un pictogramme~~. La pastille verte
servait aussi à « ouvert maintenant » : un même signe pour deux sens.

**À ne pas confondre — trois signes, trois sens** (2026-10-10) :

| Signe | Sens |
|---|---|
| cœur plein, dans le badge | le coup de cœur de Wendy |
| signet | l'adresse que le visiteur garde (ses favoris) |
| pastille verte | « ouvert maintenant », et rien d'autre |

~~Le cœur reste exclusivement réservé aux favoris de l'utilisateur.~~ Il
désignait le favori du visiteur à côté d'un badge qui s'appelle « coup de
cœur » : c'est le mot qui a gagné.

---

## 6. L'image de repli

`.image-repli` n'est plus un aplat plaque uni : motif rayé, coloré par
catégorie quand elle est connue (`.image-repli-cafe/matcha/bubble-tea/the`),
neutre (trait/papier) sinon. Le nom de l'adresse reste en bas à gauche, en
`--color-encre`, `text-meta`.

**Ce qui n'est volontairement pas repris du mockup** : ses libellés
« PHOTO HERO — 1er plan boisson » etc. étaient des indications pour le
photographe à l'intérieur du canvas de conception, pas du texte destiné à
s'afficher en production. Les reproduire aurait affiché un texte de maquette
aux utilisateurs.

Une adresse sans photo doit avoir l'air assumée, pas cassée — ça ne change
pas.

---

## 7. Les pictogrammes

Le texte reste le défaut — les critères s'écrivent (« wifi, prises,
5–9 € »). Les exceptions, révisées le 2026-10-10 :

| Pictogramme | Usage | `aria-label` |
|---|---|---|
| signet | favori de l'utilisateur (~~cœur~~ jusqu'au 2026-10-10) | « ajouter aux favoris » / « retirer des favoris » |
| cœur | coup de cœur de Wendy, dans son badge | décoratif, le badge porte le mot |
| réglages | accès au compte | « réglages du compte » |
| loupe | recherche, dont le bouton du téléphone | « chercher une adresse » |
| réticule | « près de moi » sur la carte | le bouton porte le mot |

Un troisième pictogramme ne s'ajoute pas parce qu'il « ferait joli ».

---

## 8. Les quatre états, et l'animation

Les quatre états (chargement/vide/erreur/contenu) et leur registre
(repérage, jamais voix) sont inchangés.

**L'animation, en revanche, est étendue.** L'ancien interdit n°7 (« pas
d'animation en dehors de la feuille de la carte ») ne peut pas tenir une fois
les ombres adoptées : les cartes cliquables ont une transition d'ombre au
survol (le mockup en met sur presque chaque bloc). Nouvelle règle : **toute
carte ou bouton cliquable peut avoir une transition d'ombre au survol
(`shadow-carte` → `shadow-carte-vif`), jamais de mouvement ni de mise à
l'échelle**, et `prefers-reduced-motion` coupe toujours tout. La feuille de la
carte reste le seul déplacement du site.

---

## 9. Interdits

À relire avant chaque commit front.

1. Aucun emoji dans le rendu, et pas de pictogramme décoratif à côté d'un
   libellé qui dit déjà la même chose. Une exception assumée le 2026-10-10 : le
   cœur du badge « coup de cœur » (section 5).
2. Aucune image externe en dur, aucune photo d'agence sans rapport avec le
   lieu.
3. Pas de valeurs arbitraires Tailwind, pas de couleur hors du `@theme`.
4. Pas d'alias de compatibilité : un jeton qui ne fait pas ce que son nom dit
   est un système mort.
5. ~~Pas de `.voix` sous 1.15rem~~ (**levé le 2026-10-10**, la voix n'est plus
   une manuscrite — voir section 3). Reste : pas de `.voix` ni de `.signature`
   sur du texte d'interface.
6. Le rouge ne se pose jamais sur le vert.
7. ~~Pas d'ombre portée. Nulle part.~~ **Abrogé le 2026-09-05** — voir section 4.
8. ~~Pas d'animation en dehors de la feuille de la carte.~~ **Assoupli le
   2026-09-05** — voir section 8 : transition d'ombre au survol autorisée,
   rien d'autre.
9. ~~Pas de couleur par catégorie.~~ **Abrogé le 2026-09-05** — voir section 2.

Les entrées 7 à 9 sont barrées et non supprimées : la révision se lit, elle ne
s'efface pas.

---

## 10. L'ordre du chantier (révision du 2026-09-05)

1. `src/index.css` et `index.html` — nouveaux jetons et polices. **Fait.**
2. `DA.md` et `alexis.md` — cette révision. **Fait.**
3. `Navbar.jsx`, `NavbarRecherche.jsx`, `NavbarMenuMobile.jsx`, `Footer.jsx` —
   entête et recherche du mockup, lien « mes favoris » vers l'onglet déjà
   existant de `Profile.jsx` (pas de page dédiée : la duplication n'apportait
   rien).
4. `CafeCard.jsx`, `VerdictUne.jsx`, `Carousel.jsx` — étiquette par catégorie,
   carte héro.
5. `Home.jsx` — filtres rapides, grille héro, bandeau carte.
6. Propagation aux pages restantes (guide, fiche, compte, admin, carte) via
   les mêmes jetons et classes.
