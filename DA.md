# DA.md — SpotThePlace

Direction artistique du guide. `CLAUDE.md` interdit de toucher au front sans
l'avoir lue : ce fichier est la source de vérité du visuel, et le seul endroit
où une décision esthétique se prend.

**État : tranchée.** Toutes les sections sont fermées. Une décision non couverte
ici se prend en cohérence avec la section 1, et se réécrit ici juste après.

---

## Ce qui est déjà fixé par `CLAUDE.md`

Ces points ne se rediscutent pas, ils se respectent.

- Toute valeur visuelle passe par le `@theme` de `src/index.css`. Aucune valeur
  arbitraire Tailwind, aucune couleur en dur dans le JSX.
- `.plaque` est le seul geste visuel fort. **Un seul par zone d'écran.**
- `.voix` est réservée aux avis de Wendy. Jamais pour du texte d'interface.
- Aucun emoji dans le rendu. Un pictogramme est un SVG monochrome dans
  `src/icons/`.
- Aucune image externe en dur. L'image manquante est la classe `.image-repli`.
- Le verdict de Wendy s'affiche **en premier** sur chaque fiche.
- Le seul mouvement du site est la feuille de la carte, en CSS.
- Contraste AA partout, focus visible, cibles tactiles à 44 px minimum,
  `prefers-reduced-motion` respecté.

---

## 1. Le parti pris

**Le site tient deux registres qui ne se mélangent jamais.**

- **Repérage.** Tout ce qui sert à trouver un lieu : plaque, nom, arrondissement,
  critères, prix, horaires, boutons, navigation, états. Sans-serif, bas de casse,
  compact, sec. C'est de la signalétique urbaine — ça se lit debout, à bout de
  bras, en marchant.
- **Voix.** Uniquement les mots de Wendy. Serif italique, grand corps, ligne
  courte. C'est de la revue — ça se lit posé, et ça se reconnaît sans étiquette.

**La règle de décision, valable pour tout composant à venir :** un élément
appartient à l'un ou à l'autre, jamais aux deux. Un prix est du repérage. Une
phrase de Wendy est de la voix. Un bouton est du repérage, toujours. Si un
élément semble appartenir aux deux, c'est qu'il faut le couper en deux.

L'ancrage formel du registre de repérage est la **plaque de rue parisienne** :
rectangle vert, filet blanc en retrait, texte blanc en bas de casse. C'est du
mobilier de repérage, donc cohérent avec un produit qui sert à trouver un
endroit, et c'est parisien sans passer par le cliché touristique.

---

## 2. Couleurs

Valeurs définitives. Elles sont déjà dans le `@theme` de `src/index.css`.

| Jeton | Valeur | Rôle | Contraste vérifié |
|---|---|---|---|
| `--color-plaque` | `#16453A` | plaques, nav, pied de page, boutons principaux, chrome de la carte | blanc dessus : 10,8:1 |
| `--color-plaque-clair` | `#2C6153` | survol et état actif de la plaque, rien d'autre | |
| `--color-papier` | `#F2EBD9` | fond de page | |
| `--color-carte` | `#FFFDF7` | surfaces de contenu, feuille de la carte | |
| `--color-encre` | `#2A2418` | texte courant | 13,0:1 sur papier |
| `--color-gris` | `#6E6753` | texte secondaire, métadonnées | 4,76:1 sur papier |
| `--color-trait` | `#D6CBAE` | filets, séparateurs | décoratif, hors seuil |
| `--color-rouge` | `#A82F26` | accent unique, voir ci-dessous | 5,71:1 sur papier |

Le gris a été recalculé pour le papier chaud : la valeur froide précédente
tombait à 4,16:1, sous le seuil AA. Ne pas l'éclaircir sans refaire le calcul.

**Pas de couleur par catégorie.** Les quatre couleurs actuelles (matcha, bubble
tea, café, thé) créent quatre systèmes concurrents et imposent un code arbitraire
à retenir. La catégorie s'écrit, sur plaque verte.

### Le rouge — trois usages, et trois seulement

1. **Le coup de cœur de Wendy.**
2. **L'état fermé.** C'est fermé qui est rouge, pas ouvert : le rouge est une
   couleur d'exception, et si on l'allume sur « ouvert » il est allumé partout
   tout le temps et ne signale plus rien.
3. **Le marqueur sélectionné sur la carte.** Un seul à la fois.

Hors de ces trois cas, pas de rouge.

**Le rouge ne se pose jamais sur le vert** : le contraste est de 1,59:1,
illisible. Un élément rouge sur fond vert se traite en inversant — la surface
devient rouge, le texte reste blanc (6,77:1).

---

## 3. Typographie

Deux familles, chargées dans `index.html`, avec pile de repli.

| | Famille | Graisses | Rôle |
|---|---|---|---|
| Repérage | **Archivo** | 400, 500 ; 600 réservé au titre d'accueil | navigation, titres, boutons, étiquettes, données |
| Voix | **Instrument Serif** | 400 italique **uniquement** | les avis de Wendy, rien d'autre |

Instrument Serif n'existe qu'en une seule graisse : **jamais de `font-bold` sur
`.voix`**, la graisse serait synthétisée et le rendu sale. Ses déliés sont fins,
d'où le plancher de taille ci-dessous.

| Jeton | Usage | Taille | Interligne |
|---|---|---|---|
| `text-titre` | titre d'accueil | `clamp(2.5rem, 7vw, 4.5rem)`, `-0.02em`, 600 | 1.02 |
| — | titre de section | 1.75rem, 500 | 1.15 |
| — | nom d'adresse | 1.3125rem, 500 | 1.2 |
| — | corps | 1.0625rem, 400 | 1.6 |
| `text-voix` | verdict, avis | 1.5rem, **jamais sous 1.125rem** | 1.35 |
| `text-meta` | arrondissement, horaires, critères | 0.8125rem, 500 | 1.4 |

Règles fermes :

- **Bas de casse partout.** Pas de capitales espacées en surtitre. Les plaques de
  rue parisiennes sont elles-mêmes en bas de casse.
- Corps sous 70 caractères par ligne, voix sous 46.
- Pas de mise en exergue d'un mot isolé dans un titre.
- Pas de chaînes de métadonnées collées avec des points médians. Une donnée par
  emplacement, le sens porté par la position.
- Pas de numérotation 01 / 02 / 03 sur les adresses : ce n'est pas une séquence,
  le numéro n'encoderait rien. Réservé aux vrais parcours (un itinéraire de
  quartier).

---

## 4. La plaque

Le seul geste fort. Implémentée par `.plaque` dans `src/index.css`.

**Géométrie.** Rectangle, rayon 2 px, fond `--color-plaque`, texte blanc en bas
de casse, graisse 500. Le filet blanc est en retrait de 3 px des bords, obtenu
par `box-shadow` interne — pas par un élément ni une bordure, pour ne rien
décaler. Aucune ombre portée, jamais.

**Deux tailles.** `.plaque` en `text-meta` (étiquettes de catégorie, marqueurs,
logo). `.plaque-lg` en taille nom d'adresse, filet à 4 px (en-tête de fiche).

**Sur la carte.** Un `L.divIcon` portant la classe `.plaque` et **le nom de
l'adresse en toutes lettres**, jamais une épingle. Largeur maximale 140 px, le
nom trop long est coupé par ellipse. Le point d'ancrage est le bord bas-gauche
de la plaque, comme une vraie plaque posée sur la façade.

**Sélection.** `.plaque-active` : la plaque se remplit en `--color-rouge`, le
filet blanc et le texte blanc restent identiques. Rien d'autre ne change —
pas d'agrandissement, pas d'ombre, pas de rebond. Une seule active à la fois.

**Regroupement.** Au-delà d'environ 40 marqueurs visibles, ils fusionnent en une
plaque de la même forme portant le nombre et le mot : « 7 adresses ». Jamais une
pastille ronde chiffrée — la pastille est un vocabulaire d'application mobile
générique, la plaque est le nôtre.

---

## 5. La voix de Wendy

**Ce qui la distingue.** La famille et le corps suffisent : Instrument Serif
italique à 1.5rem au milieu d'une page en Archivo se reconnaît instantanément.
Rien d'autre — pas de guillemets, pas d'encadré, pas de fond teinté, pas de barre
verticale à gauche. La typographie *est* la citation ; ajouter un guillemet, c'est
dire deux fois la même chose.

Un filet `--color-trait` d'un pixel sépare le bloc de ce qui précède. C'est tout.

**Sur une fiche.** Ordre imposé : en-tête plaque (nom, arrondissement), photo ou
`.image-repli`, **puis le verdict**, puis les informations pratiques. Les
informations pratiques sont un tableau serré, pas des cartes à pictogrammes.

**`coup_de_coeur`.** Une plaque rouge portant le mot « coup de cœur », placée
sous le verdict. Pas un pictogramme.

**À ne pas confondre :** `coup_de_coeur` est l'avis de Wendy, les favoris sont
ceux de l'utilisateur. Deux choses différentes, donc deux traitements
différents — le cœur est réservé aux favoris de l'utilisateur, le rouge et le mot
sont réservés à Wendy. Ne jamais utiliser le même signe pour les deux.

---

## 6. L'image de repli

`.image-repli` occupe la place de la photo absente, et ce sera le cas le plus
fréquent tant que la base n'est pas remplie.

Aplat `--color-plaque` plein cadre, même rapport que la photo qu'elle remplace.
Le nom de l'adresse en blanc, `text-meta`, aligné en bas à gauche, avec le même
retrait que le filet de la plaque. Rien d'autre : pas de trame, pas de
pictogramme, pas d'initiale — une initiale seule sur un aplat se lit comme un
avatar, ce qui suggère une personne et non un lieu.

Une adresse sans photo doit avoir l'air assumée, pas cassée.

---

## 7. Les pictogrammes

**Le texte est le défaut.** La signalétique urbaine s'écrit : une plaque de rue
n'a pas d'icône. Les critères s'affichent en toutes lettres — « wifi, prises,
5–9 € » — et les emoji actuels sont retirés sans être remplacés. Un pictogramme
posé à côté de son propre libellé n'ajoute aucune information, c'est de la
décoration, et un jeu d'icônes dessiné à la chaîne trahit le bricolage plus vite
que n'importe quel autre élément d'interface.

**Deux exceptions**, les seuls éléments qui apparaissent seuls sans libellé,
parce qu'ils sont répétés à chaque adresse et qu'un mot y serait encombrant :

| Pictogramme | Usage | `aria-label` |
|---|---|---|
| cœur | favori de l'utilisateur | « ajouter aux favoris » / « retirer des favoris » |
| réglages | accès au compte | « réglages du compte » |

Le cœur est **exclusivement** le favori de l'utilisateur. Le coup de cœur de
Wendy est une plaque rouge portant le mot (section 5) et n'emprunte jamais ce
signe.

SVG monochrome dans `src/icons/`, un fichier par pictogramme, `fill="none"`,
`stroke="currentColor"`, trait 1,5 px sur une grille de 24, extrémités droites
et angles vifs. Taille de base 20 px.

Un troisième pictogramme ne s'ajoute pas parce qu'il « ferait joli » : il
s'ajoute quand un élément doit apparaître seul, sans libellé, de façon répétée.

---

## 8. Les quatre états

Tout écran qui charge des données en a quatre. `CLAUDE.md` fixe le ton, cette
section fixe la forme.

- **Chargement.** Squelette de contenu : des blocs à la forme et à la place
  exactes du contenu à venir, remplis en `--color-trait`, sans animation de
  balayage. Pas de roue qui tourne — le squelette dit combien d'éléments
  arrivent et empêche la page de sauter quand ils arrivent.
- **Vide.** Une invitation à agir. « aucune adresse dans le 19e pour l'instant.
  proposer la vôtre ». Jamais « aucun résultat ».
- **Erreur.** Ce qui s'est passé, puis quoi faire. Sans « oups », sans excuse.
- **Contenu.** Le cas normal.

Les trois premiers utilisent le registre de repérage. Jamais la voix : ce n'est
pas Wendy qui parle quand le réseau tombe.

---

## 9. Interdits

À relire avant chaque commit front.

1. Aucun emoji dans le rendu, et pas de pictogramme décoratif à côté d'un
   libellé qui dit déjà la même chose.
2. Aucune image externe en dur, aucune photo d'agence sans rapport avec le lieu.
3. Pas de valeurs arbitraires Tailwind, pas de couleur hors du `@theme`.
4. Pas d'alias de compatibilité. L'ancien `index.css` avait `--gold` pointant sur
   du vert : quand un jeton ment sur son nom, le système est mort.
5. Une seule couleur d'accent, trois usages, jamais sur le vert.
6. Pas de `font-bold` sur `.voix`, pas de `.voix` sous 1.125rem, pas de `.voix`
   sur du texte d'interface.
7. Pas d'ombre portée. Nulle part.
8. Pas d'animation en dehors de la feuille de la carte.

---

## 10. L'ordre du chantier

1. `src/index.css` remplacé par les jetons, polices chargées dans `index.html`
2. `CafeCard.jsx` — badges, `WorkScore`, `PriceDots` purgés des valeurs en dur
3. `Navbar.jsx` et `Footer.jsx` — la plaque comme logo
4. `Home.jsx` — retrait du hero photo, de `HERO_IMG`, de `FEATURES` et de
   l'`IntersectionObserver`
5. `Map.jsx` — marqueurs en plaques, feuille remontable
6. Fiche adresse, puis pages de compte
