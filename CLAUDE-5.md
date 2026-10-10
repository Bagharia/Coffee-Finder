# CLAUDE.md — SpotThePlace

Guide des cafés, salons de thé et bubble tea de Paris. Une seule personne écrit
les avis ; le site sert à les lire chez soi et à trouver une adresse dans la rue.

Ce fichier est la source de vérité pour tout travail sur ce dépôt. La direction
artistique complète est dans `DA.md` — la lire avant de toucher au front. Le
raisonnement derrière les décisions passées est dans `alexis.md`, en journal
daté : le consulter avant de défaire quelque chose qui semble inutile.

---

## Stack

| | |
|---|---|
| Front | React 19, Vite 7, Tailwind 4 (`@tailwindcss/vite`), React Router 7, Leaflet + react-leaflet |
| Back | Node, Express 5, MySQL via `mysql2/promise`, JWT, bcryptjs |
| Arbo | `front/frontend/` et `back/`, deux `package.json` séparés |

```bash
cd back && npm run dev            # nodemon, port 3000
cd front/frontend && npm run dev  # vite, port 5173
```

Le front parle au back via `VITE_API_URL`. Aucune URL d'API en dur dans un
composant.

---

## Règles de travail

- **Français partout** : interface, messages d'erreur, commentaires, commits.
- **Tout en minuscules** dans les textes d'interface, titres compris. Gardent
  leur casse : ce qui vient de la base (noms d'adresses, verdicts, messages
  d'erreur de l'API), les noms propres d'une mention légale, les sigles et
  unités, les titres d'onglet. Écrit dans les chaînes, jamais par
  `text-transform` : la transformation CSS toucherait aussi les noms venant de
  la base. Révisions des 2026-09-03, 2026-09-04 et 2026-10-10, la DA garde
  trace des règles précédentes.
- Ne jamais lancer de migration ni de `DROP` sans me demander d'abord.
- Ne pas installer de dépendance sans me demander. La stack ci-dessus suffit
  pour presque tout ; une lib de plus, c'est une dette de plus.
- Quand un composant dépasse 200 lignes, le découper avant d'y ajouter quoi que
  ce soit. Aucun ne dépasse aujourd'hui — `Admin.jsx` (171) est le plus long.
- Modifier un fichier existant plutôt que d'en créer un nouveau à côté.
- **Toute modification importante s'inscrit dans `alexis.md`**, en expliquant
  pourquoi l'état précédent posait problème, pas seulement ce qui a changé.
  Est importante toute modification qui touche la sécurité, le schéma de la
  base, la configuration de déploiement, ou qui revient sur une décision déjà
  prise. `git log` dit ce qui a changé ; `alexis.md` dit pourquoi c'était faux.

---

## Front — règles de code

### Tokens

Toutes les valeurs visuelles passent par le `@theme` de `src/index.css`. Les
classes disponibles : `bg-plaque`, `bg-papier`, `text-encre`, `text-gris`,
`border-trait`, `text-rouge`, `font-voix`, `text-titre`, `text-voix`,
`text-meta`, etc.

Interdit : les valeurs arbitraires Tailwind (`bg-[rgba(90,122,74,0.12)]`,
`text-[#4A6B40]`), les couleurs en dur dans le JSX, la syntaxe `bg-(--var)`
héritée de l'ancien fichier. Si une couleur n'est pas dans le thème, soit elle
n'a pas lieu d'être, soit on l'ajoute au thème — jamais en local.

### Composants

- `.plaque` est le seul geste visuel fort. Un seul par zone d'écran.
- `.voix` est réservé aux avis de Wendy. Jamais pour du texte d'interface.
  Depuis le 2026-10-10 le verdict est en Nunito ; la manuscrite (`.signature`)
  ne sert qu'à « — wendy », sur la une et sur la fiche.
- Aucun emoji dans le rendu. Pictogramme nécessaire = SVG monochrome dans
  `src/icons/`. Les emoji actuels (`💼` dans `WorkScore`, `☕🍵🧋🫖` dans
  `Home`) sont à supprimer.
- Aucune URL Unsplash en dur. L'image de repli est la classe `.image-repli`.
- Pas de `<div>` cliquable : un lien est un `<a>`/`<Link>`, une action est un
  `<button>`. Ça conditionne le clavier et les lecteurs d'écran.

### États obligatoires

Tout écran qui charge des données a **quatre** états écrits, pas un :
chargement, vide, erreur, contenu. L'état vide est une invitation à agir
(« aucune adresse dans le 19e pour l'instant. proposer la vôtre »), jamais
« aucun résultat ». L'erreur dit ce qui s'est passé et quoi faire, sans
« oups » ni excuse.

### Accessibilité — plancher non négociable

- Contraste AA sur tout texte, recalculé le 2026-09-03 : blanc sur plaque
  10,79:1, encre sur papier 12,95:1, gris sur papier 4,74:1 depuis le 2026-10-10
  (`#67604D` ; l'ancien `#6E6753` ne faisait que 4,27:1 sur la palette du
  2026-09-05 — passe de justesse, ne pas éclaircir sans refaire le calcul), rouge sur papier 5,70:1, blanc sur
  rouge 6,78:1.
- **La bordure d'un contrôle n'est pas un filet décoratif.** `--color-trait`
  (1,36:1) convient aux séparateurs ; un bouton, un `select`, un `input` ou un
  `textarea` portent `--color-trait-fort` (3,13:1), seuil exigé par WCAG 1.4.11
  pour la limite visible d'un contrôle.
- Focus visible partout (déjà dans `index.css`, ne pas le désactiver).
- Cibles tactiles à 44px minimum : le site s'utilise debout, en marchant.
- `prefers-reduced-motion` respecté.
- Toute image porte un `alt` décrivant l'adresse, pas « photo ».

### Performance

Cible : première image utile sous 2 s en 4G moyenne, c'est le contexte réel
d'usage.

- Images en `loading="lazy"` sauf la première visible, `width`/`height`
  toujours renseignés pour éviter les sauts de mise en page.
- Leaflet et la page carte en `React.lazy` : la carte ne doit pas peser sur le
  chargement du guide.
- Pas de dépendance d'animation. Le seul mouvement du site est la feuille de la
  carte, en CSS.

### Carte

- Marqueurs en `L.divIcon` portant la classe `.plaque` et le nom de l'adresse.
  Pas d'épingle générique : le nom doit être lisible directement sur la carte.
- Une seule adresse sélectionnée à la fois, en `.plaque-active`.
- Regrouper les marqueurs au-delà de ~40 adresses visibles, sinon le rendu
  s'effondre sur mobile.
- Charger les adresses par cadre visible quand la base dépassera quelques
  centaines de lignes, pas la table entière.

---

## Back — règles de code

- Les contrôleurs répondent avec `res.json(...)`. Interdit :
  `res.setHeader` + `JSON.stringify(rows, null, 2)` — c'est du poids réseau
  inutile sur chaque réponse.
- **Jamais de `SELECT *` sur une jointure.** `cafes` et `criteres_cafe` ont
  toutes les deux une colonne `id` : mysql2 écrase la première par la seconde,
  donc l'`id` renvoyé au front est celui des critères, pas celui du café.
  Lister les colonnes et aliaser (`cafes.id AS id`, `criteres_cafe.id AS
  critere_id`).
- Requêtes toujours paramétrées (`?`). C'est déjà le cas, ça doit le rester.
- **Toute lecture d'adresses ignore la corbeille** (`cafes.supprime_le IS NULL`).
  Le filtre est posé une fois dans `listerCafes`, pas recopié route par route :
  l'oubli exposerait des fiches supprimées. Une route qui veut les voir passe
  `portee` explicitement.
- Une saisie destinée à un `LIKE` passe par `echapperLike`. Sans ça, un `%`
  dans la recherche remonte toute la table.
- La liste de colonnes des adresses vit dans `utils/cafes.js`, en un seul
  exemplaire. Elle a été recopiée dans `favoriController` par le passé : la
  migration 006 n'en a corrigé qu'une, et la page des favoris a répondu 500.
- `npm test` lance de vrais tests (`node --test`, aucune dépendance), au back
  comme au front. En ajouter avec chaque correctif dont on aurait aimé qu'il
  soit attrapé plus tôt. `chargement.test.js` charge tous les modules :
  `node --check` ne valide que la syntaxe, jamais les références.
- Une ressource absente répond 404 depuis le corps de la fonction, pas depuis le
  `catch` — un `catch` ne sait pas distinguer « absent » de « base en panne ».
- Une ressource unique répond un objet, pas un tableau d'un élément.
- Un `catch` journalise l'erreur complète côté serveur et renvoie un message
  générique au client. Jamais le message SQL brut.
- Pagination obligatoire sur toute route de liste (`?page`, `?limite`, défaut
  20, plafond appliqué dans `utils/validation.js`). **Et le front doit s'en
  servir** : charger avec `limite: LIMITE_MAX` cache silencieusement les
  adresses au-delà de la centième. Le guide et les catégories passent par
  `useListePaginee`.
- Tout appel réseau sortant porte un délai maximal (`AbortSignal.timeout`).
  Express n'en impose aucun : sans lui, un service lent suspend la requête
  indéfiniment. Voir `geocodeAdresse` dans `cafeController.js`.
- Un `catch` qui renvoie une valeur neutre trace toujours la raison. Un échec
  silencieux se paie plus tard, et bien plus cher.

### Sécurité — acquis, à ne pas régresser

Les sept corrections listées ici ont toutes été faites. Elles sont conservées
sous forme de règles : ce sont des propriétés à préserver, pas des tâches.

1. `register` force `role: 'user'`. Le champ `role` du corps de requête est
   ignoré, sinon n'importe qui se fabrique un admin depuis le formulaire
   d'inscription. La promotion se fait en base, à la main.
2. Aucun repli pour `JWT_SECRET`. Un secret par défaut écrit dans le code est
   un secret public. Le serveur refuse de démarrer sans la variable.
3. Aucun `.env` ni `node_modules/` suivi par git. Le `.env` qui reste dans
   l'historique ne contenait que des valeurs d'exemple — vérifié le 2026-09-03,
   rien de réel n'a fuité.
4. Limiteur de débit sur `/login`, `/register`, `/change-password` et les
   écritures d'avis. Toute route qui compare un secret ou écrit en base en a
   besoin, pas seulement `/login`.
5. Validation d'entrée sur toutes les routes d'écriture, via `utils/validation.js`.
6. Gestionnaire d'erreurs global, 404 global et en-têtes de sécurité écrits à la
   main dans `middleware/securityHeaders.js` — pas de `helmet`, la stack suffit.
7. `FRONTEND_URL` obligatoire en production : sans elle, l'origine CORS se
   replierait silencieusement sur `localhost:5173`.
8. **Connexion à temps constant.** `login` compare toujours contre un hachage,
   celui du compte ou un leurre calculé au démarrage. Sans ça l'absence de
   compte se lisait au chronomètre — 1,4 ms contre 70 — et le message identique
   dans les deux cas ne protégeait rien.
9. **Sessions révocables.** `users.jeton_version` est copié dans le jeton et
   relu à chaque requête. Changer son mot de passe l'incrémente et déconnecte
   les autres sessions. Le rôle est relu en base au passage : une
   rétrogradation prend effet tout de suite, sans attendre l'expiration.
10. **Coût bcrypt à 12**, avec réhachage silencieux à la connexion pour les
    comptes créés avant. Ne jamais ajouter de sel : bcrypt en tire un au hasard
    et le range dans l'empreinte. Un sel écrit à la main serait au mieux
    redondant, au pire partagé entre les comptes — donc inutile.
11. **Unicité du pseudo vérifiée** avant l'insertion, avec repli sur
    `ER_DUP_ENTRY` pour les inscriptions simultanées. Un pseudo déjà pris
    répondait 500 sur le seul écran par lequel un visiteur entre.

### Jeton de session

Le jeton vit dans un cookie `httpOnly`, plus dans le stockage du navigateur :
aucun script de la page ne peut le lire, donc une injection ne suffit plus à
voler une session. L'en-tête `Authorization: Bearer` reste accepté pour les
scripts en ligne de commande, qui n'ont pas de navigateur à protéger.

Ça ne dispense de rien côté front : aucun `dangerouslySetInnerHTML`, aucun rendu
de HTML venant de la base, aucune dépendance ajoutée sans raison.

La portée du cookie dépend du montage choisi à l'hébergement — voir
`back/ADMIN_GUIDE.md`, section « Héberger l'API ».

---

## Données

### État actuel

Schéma en cinq migrations numérotées dans `back/db/`, appliquées par
`npm run db:migrate` et suivies dans la table `schema_migrations`. Les fichiers
SQL ne nomment plus la base : elle vient de la connexion, sinon ils seraient
inapplicables chez un hébergeur.

Tables : `cafes`, `criteres_cafe`, `users`, `avis`, `favoris`, `cafe_horaires`.

Contenu au 2026-09-03 : les cinq adresses du jeu de départ, complétées par
l'API (coordonnées géocodées, verdict, photo, critères). Un compte admin,
`admin@spotheplace.fr`. Aucun avis, aucun favori.

**Les horaires ont une source unique.** `cafe_horaires` porte les plages
exploitables (jour 1 = lundi … 7 = dimanche, aucune plage = fermé, plusieurs
plages = service coupé). La colonne texte `criteres_cafe.horaires` a été
supprimée en migration 006 : deux sources pour une même information finissent
toujours par se contredire. L'API renvoie `horaires` sous forme de tableau,
`front/frontend/src/utils/horaires.js` calcule l'état courant.

Deux règles à ne pas défaire : une fermeture après minuit s'écrit `fermeture`
antérieure à `ouverture` et déborde sur le lendemain — c'est la plage de la
veille qui décide à 00h30 ; et le fuseau est forcé à `Europe/Paris`, jamais
déduit du serveur ni du navigateur.

**Rien n'est rejouable.** — plus vrai : `db/seed.sql` reflète l'état de
démonstration complet, coordonnées, verdicts, photos et horaires compris. Les
cinq établissements sont inventés, à de vraies adresses parisiennes : le dépôt
est public, on n'y attribue pas d'avis fabriqués à des commerces existants.

### À ajouter

**Les fermetures exceptionnelles** — congés d'août, jours fériés. Une deuxième
table et un deuxième écran d'admin : à faire quand les horaires hebdomadaires
auront servi, pas avant.

---

## Git

- Le dépôt est public. Rien de secret ne rentre, jamais, même temporairement —
  l'historique garde tout.
- Un commit par intention, message en français à l'impératif
  (`corrige le rôle forcé à l'inscription`).
- `node_modules/` ne se commite pas.

---

## Chantier en cours

**Fait.** Refonte du front (tokens, `CafeCard`, `Navbar`/`Footer`, `Home`,
`Map`, fiche adresse, pages de compte) ; les sept points de sécurité ;
la préparation du back à l'hébergement ; les horaires exploitables et
« ouvert maintenant » — détail et raisonnement dans `alexis.md`.

**Aussi fait.** Corbeille (suppression réversible), refus des doublons
d'adresse, recherche libre `?q=`, téléversement d'images sur le disque local —
et leurs écrans côté front : corbeille repliable dans `/admin`, téléversement
avec aperçu, recherche de la navbar élargie aux mêmes champs que l'API.

**Reste.**

1. Wendy saisit de vraies adresses. Le reste attend ça.
2. Les fermetures exceptionnelles, si le besoin se confirme.
3. **Le stockage des images avant d'héberger.** Elles vivent sur le disque du
   serveur : chez un PaaS ce disque est éphémère et elles disparaîtraient à
   chaque redéploiement. Volume persistant, ou passage sur un service d'objets.
4. Une sauvegarde automatique de la base — proposée, pas encore faite.
5. Le déploiement, en suivant `back/ADMIN_GUIDE.md` — pas avant que le guide
   contienne assez d'adresses réelles pour valoir d'être montré.
