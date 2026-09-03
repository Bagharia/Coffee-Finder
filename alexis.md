# Journal des décisions techniques — SpotThePlace

À quoi sert ce fichier : chaque modification importante y est expliquée, pas
seulement décrite. Le but n'est pas de savoir *ce qui* a changé — `git log` le
dit mieux — mais de comprendre *pourquoi c'était un problème*, pour reconnaître
le même motif la prochaine fois sans qu'on ait à te le signaler.

Entrée la plus récente en haut. Chaque entrée date du jour où le travail a été
fait, en absolu.

---

## 2026-09-03 — Pagination réelle, contrastes calculés, thème fusionné

### Le guide cachait des adresses sans le dire

Tous les écrans chargeaient avec `limite: LIMITE_MAX`, soit cent adresses, et
affichaient le résultat. À cinq adresses ça ne se voit pas. À cent une, le
guide en cache une silencieusement — aucune erreur, aucun indice, juste une
liste incomplète que personne ne peut distinguer d'une liste complète.

Le passage à une vraie pagination a entraîné une décision moins évidente : le
filtrage devait passer côté serveur. Filtrer localement une page ne filtre que
ce qui est déjà chargé, ce qui est **pire** que pas de filtre du tout — on
croit avoir tout vu. Le prix est un aller-retour réseau à chaque filtre coché,
là où c'était instantané.

C'est un compromis que j'assume mais qui mérite d'être nommé : on échange de la
vivacité aujourd'hui, avec cinq adresses, contre de l'exactitude demain, avec
cent. L'inverse aurait été d'optimiser pour un cas qui cesse d'exister
exactement au moment où le site réussit.

L'API a dû gagner deux filtres au passage (`travailler`, `nouveautes`) : le
front les proposait, l'API ne savait pas les traiter. Personne ne s'en était
aperçu parce que tout se filtrait localement.

**Le réflexe :** une limite haute placée « pour l'instant » est une bombe à
retardement silencieuse. Elle ne casse rien, elle ment — et elle ment
précisément le jour où le contenu devient intéressant.

### Les contrastes, enfin calculés plutôt que crus

La DA annonce des ratios et les appelle un plancher non négociable. Ils
n'avaient jamais été recalculés depuis. Je les ai tous repassés :

Onze paires vérifiées, dix passent — et les chiffres de la DA sont exacts au
centième, ce qui est rassurant sur le sérieux du travail d'origine.

Un échec, réel : `--color-trait` fait **1,36:1** sur papier. Pour un séparateur
c'est parfait, l'œil n'a pas besoin de plus. Mais dix-neuf boutons, `select`,
`input` et `textarea` s'en servaient comme **bordure de contrôle**, et la WCAG
1.4.11 exige 3:1 pour la limite visible d'un contrôle — sans quoi on ne
distingue pas où le champ commence.

La correction n'est pas d'assombrir `--color-trait` : les quarante-cinq
séparateurs deviendraient lourds et la page perdrait sa légèreté. C'est
d'ajouter un second jeton, même teinte assombrie jusqu'à passer
(`--color-trait-fort`, 3,13:1), et de ne l'appliquer qu'aux contrôles.

**Le réflexe :** « contraste suffisant » n'est pas une propriété d'une couleur,
c'est une propriété d'un couple couleur/usage. La même teinte peut être
parfaite en séparateur et fautive en bordure de bouton.

### Un thème proposé, fusionné plutôt qu'appliqué

Un `index.css` de remplacement m'a été proposé, présenté comme remplaçant
« intégralement » l'existant. Vérification faite, il aurait cassé cinq choses en
silence : `.squelette` (neuf fichiers, tous les états de chargement),
`.mesure` (neuf fichiers, la largeur de lecture), `.plaque-carte` et
`.feuille-ouverte` (la carte), et `--text-nom` renommé sans que les quatre
usages suivent.

Il apportait aussi de vraies améliorations : `text-wrap: balance` et `pretty`,
`-webkit-text-size-adjust`, `::selection`, un jeton de rayon. Et deux choses
qu'il présentait comme des apports mais qui existaient déjà en mieux : la règle
des 44px, plus complète dans l'existant (elle couvre `input`/`select`/`textarea`
et exempte les liens en ligne, que la version proposée aurait cassés en leur
imposant 44px au milieu d'un paragraphe), et le focus, plus abouti en vert
documenté à 9,07:1 qu'en rouge uniforme.

Résultat : fusion des quatre apports réels, conservation de tout ce dont le
code dépend.

**Le réflexe :** un fichier qu'on propose de remplacer « intégralement » se
compare d'abord à l'usage réel, classe par classe. Ce qui n'y figure pas ne
disparaît pas avec une erreur — ça disparaît en silence, et le style manquant
ne se voit qu'à l'écran, écran par écran.

---

## 2026-09-03 — Les quatre ajouts, côté écran

Le back savait faire quatre choses de plus ; aucune n'existait dans
l'interface. Une fonctionnalité qu'on ne peut pas déclencher depuis l'écran
n'existe pas pour la personne qui s'en sert.

### Un message qui mentait

`Admin.jsx` demandait confirmation par : « supprimer « X » ? les avis et
favoris partent avec. » C'était vrai la veille. Depuis la corbeille, la
suppression est réversible et ne touche plus aux avis — le message décrivait
donc une conséquence qui n'existait plus, et il décourageait une action devenue
anodine.

**Le réflexe :** un texte d'interface qui décrit un comportement est une
affirmation sur le code. Quand le comportement change, ce texte est à corriger
au même titre qu'un test qui échoue — sauf que rien ne le signale
automatiquement. Chercher les messages concernés fait partie du changement.

### Le téléversement ne peut pas exister à la création

L'envoi vise une fiche par son identifiant, qui n'existe pas encore quand on
remplit le formulaire de création. Plutôt que de bricoler un envoi en deux
temps ou de garder le fichier en mémoire jusqu'à l'enregistrement, l'écran le
dit : le champ de téléversement n'apparaît qu'en modification, et une phrase
explique que la photo se pose au second passage. Le champ URL, lui, reste
disponible dans les deux cas.

**Le réflexe :** une contrainte technique qu'on ne peut pas supprimer se
raconte à l'utilisateur au lieu d'être masquée par un contournement. Un
formulaire qui explique pourquoi une case est absente est moins déroutant qu'un
mécanisme invisible qui échoue une fois sur dix.

### Deux recherches qui ne trouvent pas la même chose

La recherche de la navbar filtre localement, sans réseau — à cette échelle
c'est plus rapide qu'un appel par lettre tapée, et je l'ai gardée telle quelle
plutôt que de la brancher sur le nouveau `?q=` de l'API.

Mais elle ne regardait ni la description ni le verdict, que l'API couvre
désormais. Deux recherches censées faire la même chose et qui ne trouvent pas
les mêmes adresses, c'est un piège : celui qui teste l'une croit connaître le
comportement de l'autre. Les champs ont donc été alignés, et le commentaire dit
à quel moment il faudra basculer sur l'API — quand le guide dépassera
`LIMITE_MAX`, puisque le chargement local cessera alors d'être complet et que
la recherche locale mentirait par omission.

**Le réflexe :** deux implémentations de la même intention doivent donner le
même résultat, ou l'une des deux doit disparaître. Une divergence silencieuse
entre elles est un bug qui attend son heure.

### La destruction définitive demande deux confirmations

Mettre à la corbeille demande une confirmation ordinaire. Détruire depuis la
corbeille en demande une seconde, plus explicite, qui nomme ce qui part avec :
c'est la seule action de cette interface qu'on ne peut pas défaire. La corbeille
elle-même est repliée par défaut et ne charge son contenu qu'à l'ouverture —
c'est un filet de rattrapage, pas un écran de travail.

---

## 2026-09-03 — Corbeille, doublons, recherche, images

Quatre ajouts d'un coup. Trois sont de petites choses ; le quatrième porte une
réserve qu'il faut avoir en tête au moment d'héberger.

### La suppression détruisait les avis des visiteurs

`DELETE /api/cafes/:id` faisait un vrai `DELETE`, et les contraintes de clé
étrangère emportaient en cascade les critères, les avis et les favoris. Une
seule personne administre le guide : un clic malheureux effaçait sans filet, et
rien dans l'interface ne distinguait « je retire cette fiche » de « je détruis
aussi tout ce que les visiteurs ont écrit dessus ».

Migration 008 : une colonne `supprime_le`. La ligne reste, les cascades ne se
déclenchent pas, la fiche redevient visible d'un `UPDATE`. La destruction
définitive existe toujours mais se demande explicitement (`?definitif=1`).

Le point délicat n'est pas la suppression, c'est **de ne pas oublier le filtre**.
Chaque lecture doit désormais ignorer la corbeille, et un oubli exposerait une
fiche supprimée sur le site public. D'où le filtre posé une seule fois, dans
`listerCafes`, plutôt que recopié dans les douze routes de lecture : une route
ajoutée demain hérite du bon comportement sans que personne n'y pense. Les
routes qui veulent voir la corbeille doivent le demander.

**Le réflexe :** quand une règle doit s'appliquer partout, la poser à l'endroit
par lequel tout passe, jamais à chaque point d'usage. Un filtre de sécurité
qu'on doit se rappeler d'écrire est un filtre qu'on oubliera.

### Deux fiches pouvaient occuper la même adresse

Rien ne l'empêchait. À cinq adresses ça se voit, à cinquante non.

La difficulté est que l'égalité de chaînes ne sert à rien ici : « 12 Rue de
Bretagne, 75003 Paris » et « 12 rue de bretagne 75003 paris » sont le même
lieu, et une contrainte `UNIQUE` en base ne les distinguerait pas. La
comparaison se fait donc sur une forme normalisée — sans accents, sans casse,
sans ponctuation.

**Ce que je n'ai pas fait, et pourquoi.** La solution évidente serait de
stocker cette forme normalisée dans une colonne indexée : la vérification
deviendrait une lecture indexée au lieu d'un parcours. Mais ce serait une
deuxième source de vérité pour l'adresse — quelqu'un modifierait `adresse` sans
recalculer sa version normalisée, et les deux divergeraient. C'est exactement
le motif qui a déjà coûté la page des favoris dans ce projet. Elle est donc
recalculée à chaque écriture, qui sont rares sur un guide tenu par une
personne. Si la table grandit, c'est cette fonction-là qu'il faudra revoir, et
le commentaire le dit.

**Le réflexe :** une optimisation qui duplique une donnée se paie en cohérence.
Sur un volume qui ne le justifie pas encore, le parcours naïf est le bon choix
— et il faut écrire dans le code à partir de quand il cessera de l'être.

### La recherche ne cherchait pas

`searchCafes` ne savait faire que de l'égalité stricte et du `FIND_IN_SET`.
Impossible de taper trois lettres et de trouver. Ajout d'un `?q=` qui balaie le
nom, l'adresse, la description et le verdict.

Un `LIKE` suffit à cette échelle ; le commentaire indique quand passer à un
index `FULLTEXT`. Un détail compte : les jokers SQL sont échappés. Sans ça, une
recherche contenant `%` remonte toute la table et `_` remplace silencieusement
n'importe quel caractère — testé, `q=%` renvoie bien zéro résultat.

### Les images : ça marche, et ça ne survivra pas au déploiement

Wendy devait trouver une image hébergée ailleurs et en coller le lien.
Désormais `POST /api/cafes/:id/image` accepte un fichier.

Quelques décisions qui méritent d'être écrites :

- **Le SVG est refusé.** C'est un document qui peut porter du script, et il
  serait servi depuis notre propre origine. Liste blanche de formats, jamais
  liste noire.
- **Le fichier est gardé en mémoire jusqu'à validation**, puis écrit. Écrire
  d'abord et valider ensuite laisserait un fichier orphelin à chaque refus.
- **Le nom est tiré au hasard.** Reprendre celui fourni par le client
  laisserait choisir un chemin, et deux envois du même nom s'écraseraient.
- **L'ancienne image n'est effacée qu'après** la mise à jour en base. Dans
  l'ordre inverse, un échec du `UPDATE` laisserait la fiche pointer vers un
  fichier qu'on vient de supprimer.
- **Servies sous `/api/uploads`** et non à la racine : en développement le
  proxy Vite ne relaie que `/api`, en production le front et l'API partagent
  déjà ce préfixe. Rangées ailleurs, elles seraient introuvables dans l'un des
  deux cas.

**La réserve, à ne pas oublier :** les fichiers vivent sur le disque du
serveur. Chez un hébergeur PaaS ce disque est éphémère — **les images
disparaîtront à chaque redéploiement** s'il n'y a pas de volume persistant.
C'était le compromis assumé au moment de choisir : le stockage sur un service
d'objets (S3, R2, Cloudinary) est la solution durable mais demandait un compte,
des clés et un fournisseur à choisir, pour une fonctionnalité dont on ne sait
pas encore si elle servira beaucoup. C'est écrit dans `ADMIN_GUIDE.md` et dans
le chantier en cours du CLAUDE.md.

**Le réflexe :** un compromis assumé n'est un compromis que s'il est écrit. Non
écrit, c'est un piège qu'on redécouvre le jour du déploiement, quand les images
de Wendy auront disparu sans explication.

---

## 2026-09-03 — Dépendances : 23 vulnérabilités, dont une dans la vérification JWT

Réflexe de fin de chantier : `npm audit` sur les deux paquets, jamais lancé
depuis le début de ce travail. Il ne remonte que ce qui est déjà installé — il
fallait donc juste demander.

Résultat : 8 vulnérabilités au back, 15 au front, dont 19 en sévérité haute.
La plus sérieuse n'était pas où on l'attendrait : `jsonwebtoken@9.0.2` tirait
`jws@3.2.2`, qui **vérifie mal les signatures HMAC**
(GHSA-869p-cjfg-cm3x) — exactement le mécanisme qui protège chaque route admin
de ce projet. `mysql2` en avait deux : une régression d'authentification qui
laisse fuiter le mot de passe en clair, et un déni de service par
décompression. Le reste touchait `express` (`path-to-regexp`, `qs`), `vite` et
`react-router` côté front.

Toutes corrigées par `npm update`, dans les plages déjà déclarées par
`package.json` (`^9.0.2`, `^3.15.3`, `^7.9.6`…) : aucune dépendance nouvelle,
aucune borne changée, juste des correctifs déjà couverts par les intervalles
existants et jamais récupérés. `npm audit` retombe à zéro des deux côtés.

**Un effet de bord, et pourquoi je ne l'ai pas laissé filer.** La mise à jour a
fait passer `eslint-plugin-react-hooks` de 7.0.1 à 7.1.1, toujours dans la
plage `^7.0.1`. Cette version active deux règles plus strictes — interdiction
d'appeler `setState` de façon synchrone dans un effet, interdiction de
`Date.now()` pendant le rendu — qui ont fait échouer le lint sur cinq
composants existants, tous écrits avant cette règle et jamais revus depuis.
Corriger ces cinq composants aurait été un vrai chantier, sans rapport avec des
failles de sécurité : rien de ce que ces règles signalent n'est exploitable, ce
sont des recommandations de fraîcheur React. Le plugin n'est d'ailleurs
concerné par aucune vulnérabilité — c'est un outil de développement, jamais
expédié au navigateur. Repointé sur 7.0.1 pour garder le lint propre sans
absorber ce chantier dans une passe de sécurité.

**Le réflexe :** une mise à jour de dépendances peut réparer une faille et
casser autre chose dans le même geste — ici un plugin de lint, ailleurs ça
pourrait être un comportement. Vérifier ce qui a bougé avant de tout accepter
en bloc, et séparer ce qui relève de la sécurité de ce qui relève d'une
opinion plus récente sur comment écrire du code React.

`npm audit` n'a tourné qu'une fois, à la fin. Ça devrait faire partie du
passage régulier, pas d'un grand ménage occasionnel — une vulnérabilité comme
celle de `jws` reste ouverte tant que personne ne demande.

---

## 2026-09-03 — Comptes, mots de passe, sessions

### Le sel, d'abord : il était déjà là

Demande initiale : « n'oublie pas le sel ». Il n'y avait rien à ajouter, et
l'ajouter aurait été une régression.

`bcrypt.hash(motDePasse, 12)` tire un sel au hasard à chaque appel et le range
dans l'empreinte : `$2b$12$<sel sur 22 caractères><empreinte>`. Le même mot de
passe haché deux fois donne deux résultats différents — vérifié sur le compte
réel de Wendy, son sel est bien là.

Un sel « ajouté à la main » finit presque toujours en constante partagée par
tous les comptes, ce qui annule exactement ce à quoi sert un sel : empêcher
qu'une même empreinte trahisse deux mots de passe identiques, et rendre les
tables précalculées inutilisables.

**Le réflexe :** avant d'ajouter une protection à une brique de cryptographie,
vérifier qu'elle ne la fait pas déjà. Ces bibliothèques sont écrites pour être
utilisées sans qu'on les aide.

Ce qui manquait vraiment était à côté : le **coût** était à 10, alors que 12 est
le plancher recommandé aujourd'hui — chaque unité double le travail d'un
attaquant. Relevé à 12, avec réhachage silencieux à la connexion : seule une
connexion réussie donne accès au mot de passe en clair, c'est donc le seul
moment où l'on peut refaire une empreinte obsolète.

### La connexion se lisait au chronomètre

Le code disait, en commentaire, que le message « email ou mot de passe
incorrect » était identique dans les deux cas pour ne pas révéler quels emails
existent. Mesuré :

| | avant | après |
|---|---|---|
| email existant | 70,6 ms | 271 ms |
| email inconnu | **1,4 ms** | 270 ms |

Quand le compte n'existait pas, aucun bcrypt ne tournait et la réponse partait
cinquante fois plus vite. L'intention était juste, l'implémentation la trahissait
sans que rien ne le signale.

Correction : comparer toujours contre un hachage — celui du compte, ou un leurre
calculé une fois au démarrage.

Détail qui vaut la peine : après correction, l'écart s'est **inversé** — 70 ms
contre 276. Le leurre était à coût 12, le mot de passe de Wendy encore à 10. Il
a fallu une connexion réussie, donc un réhachage, pour que les deux s'alignent.
Une protection à temps constant n'est constante que si tout le parc est au même
coût.

**Le réflexe :** une protection qui repose sur un temps de réponse se vérifie au
chronomètre, pas à la lecture. Le commentaire décrivait une intention, pas un
fait.

### Changer son mot de passe ne fermait aucune session

Un JWT est valable jusqu'à son expiration et rien ne l'annule. Changer son mot
de passe laissait donc les sessions ouvertes actives vingt-quatre heures — alors
qu'on change son mot de passe précisément quand on pense que quelqu'un d'autre
a un accès. La seule action de défense disponible ne défendait pas.

`users.jeton_version` est maintenant copié dans le jeton et relu à chaque
requête authentifiée. L'incrémenter invalide d'un coup tous les jetons émis.
Vérifié avec deux sessions ouvertes : celle qui change le mot de passe continue
avec un jeton neuf, l'autre reçoit 401.

Ça coûte une lecture sur clé primaire par requête authentifiée. En échange, un
compte supprimé cesse immédiatement d'être utilisable, et le rôle étant relu en
base, une rétrogradation prend effet tout de suite au lieu d'attendre
l'expiration — vérifié en rétrogradant puis re-promouvant le compte sans
toucher à la session.

**Le réflexe :** « signé donc valide » n'est pas « toujours autorisé ». Un jeton
dit ce qui était vrai à son émission ; l'autorisation, elle, se décide au
moment de la requête.

### Un pseudo déjà pris renvoyait 500

`register` vérifiait l'unicité de l'email et pas celle du pseudo, pourtant
`UNIQUE` au schéma. MySQL levait, le `catch` générique répondait
« Erreur serveur ». Sur le seul écran par lequel un visiteur entre, et sans
aucun moyen de deviner quoi corriger.

**Le réflexe :** une contrainte de base de données n'est pas un message
d'erreur. Chaque `UNIQUE` du schéma doit avoir sa vérification côté
application — la contrainte reste le filet, pas l'interface.

### Une vérité recopiée diverge toujours

`GET /api/favoris` répondait 500 : `favoriController` **recopiait** la liste des
colonnes des adresses au lieu de la partager, et la migration 006 n'en avait
corrigé qu'une des deux copies. La page des favoris était cassée sans que rien
ne le dise.

C'est le troisième cas du même motif dans ce journal, après le nom de base écrit
en dur dans les migrations et l'horaire stocké à deux endroits. La liste vit
maintenant dans `utils/cafes.js`, en un exemplaire.

### Des tests, enfin — et le premier qui comptait

`npm test` échouait volontairement, puis annonçait poliment qu'il n'y avait rien.
Il lance désormais `node --test`, intégré à Node, donc sans une dépendance de
plus : 13 tests au back, 10 au front.

Le plus utile est le plus bête. En découpant `cafeController`, j'ai laissé une
constante derrière moi. `node --check` est passé au vert — il ne valide que la
syntaxe, jamais les références — et le serveur a planté au démarrage.
`chargement.test.js` charge tous les modules et attrape cette classe d'erreur en
une seconde.

**Le réflexe :** le test qui vaut le plus n'est pas le plus astucieux, c'est
celui qui rejoue la panne qu'on vient d'avoir. Chaque correctif dont on se dit
« j'aurais aimé le voir plus tôt » mérite son test, écrit sur le moment.

### Ce qui reste ouvert

Pas de « mot de passe oublié » en libre-service : il faudrait envoyer un e-mail,
donc une dépendance et un service d'envoi — une décision, pas un correctif.
En attendant, `npm run user:motdepasse -- <email>` réinitialise depuis la ligne
de commande, avec confirmation, hachage correct et révocation des sessions. Ça
remplace l'`UPDATE` écrit à la main, où une erreur de coût ou de format ne se
voyait qu'au moment où la connexion échouait.

---

## 2026-09-03 — Les horaires deviennent exploitables

`cafe_horaires` existait depuis la migration 005 et **personne ne l'utilisait** :
ni le back qui ne savait pas l'écrire, ni le front qui ne savait pas la lire.
Une table créée pour une fonctionnalité dont le travail s'est arrêté juste
après le schéma. Pendant ce temps `criteres_cafe.horaires` gardait du texte
libre — `'8h-17h'` — dont on ne peut rien déduire.

**Une information, une source.** La colonne texte est supprimée (migration 006).
Deux endroits qui décrivent la même chose se contredisent toujours : on corrige
l'un et on oublie l'autre. La chaîne affichée se dérive maintenant des plages.
C'est le même motif que le nom de base écrit en dur dans les migrations — une
vérité recopiée à deux endroits est une vérité qui va diverger.

**Le piège qu'on ne voit qu'en le cherchant : la fermeture après minuit.** Le
Comptoir Norvège ferme à 1h30, donc sa `fermeture` est *antérieure* à son
`ouverture`. Le test évident — `ouverture <= maintenant < fermeture` — répond
« fermé » à minuit et demi alors que la salle est pleine. Et à 00h30 un mardi,
c'est la plage du **lundi** qui décide : il faut aussi regarder la veille.
Le seed contient volontairement ce cas, plus un service coupé et deux jours de
fermeture. Un jeu de test qui ne contient que des cas faciles ne teste rien —
c'est aussi vrai des données de démonstration que des tests eux-mêmes.

**Le fuseau ne se déduit pas, il se déclare.** « Ouvert maintenant » n'a de sens
qu'à l'heure de Paris. Calculé sur le serveur, un hébergeur tourne en UTC :
deux heures d'écart l'été, le site annonce fermé à 20h. Calculé sur le
navigateur, c'est l'heure du lecteur : juste chez toi, faux pour quelqu'un qui
consulte depuis l'étranger — et un guide de Paris se lit beaucoup en voyage.
`Europe/Paris` est écrit en dur dans `utils/horaires.js`.

**Calculé sur le front, pas sur le back.** L'état change à chaque minute : si
l'API le renvoyait, chaque réponse serait périmée en soixante secondes et
incachable. L'API envoie les plages, le front conclut — et se rafraîchit tout
seul chaque minute, sans quoi une page laissée ouverte annoncerait « ouvert »
toute la nuit.

**Le rouge reste une exception.** La DA n'autorise le rouge que sur trois
choses, dont l'état fermé. « Ouvert » s'écrit donc en noir : allumer le rouge
sur ouvert le rendrait permanent, et une couleur allumée en permanence ne
signale plus rien. Le tableau de la semaine reste neutre aussi — sept « fermé »
en rouge feraient de la couleur d'exception une couleur de fond.

**Un bouton qui décide si la fonctionnalité sera utilisée.** L'écran d'admin a
un « copier le lundi sur toute la semaine ». Neuf adresses sur dix ouvrent aux
mêmes heures tous les jours ; faire saisir sept fois la même ligne est le
meilleur moyen que les horaires ne soient jamais remplis. Une fonctionnalité
pénible à alimenter est une fonctionnalité vide.

**Le réflexe :** une table sans code qui la lit n'est pas une fonctionnalité en
attente, c'est une dette qui ment sur ce que le produit sait faire. Soit on la
finit, soit on la retire. Et quand on la finit, chercher d'abord le cas qui
casse l'implémentation naïve — ici minuit — parce qu'il existe presque toujours.

---

## 2026-09-03 — Rendre le back hébergeable

Le code métier était sain : validation partout, requêtes paramétrées, cookie
`httpOnly`, en-têtes de sécurité. Ce qui manquait n'était pas du métier, c'était
de **l'exploitation** : tout ce qui ne se voit pas tant qu'on développe sur sa
propre machine, où la base est à `localhost`, où il n'y a pas de proxy, pas de
redéploiement, pas de surveillance.

C'est le motif commun aux huit points ci-dessous, et c'est la leçon principale :
**un code qui marche en local n'a pas été testé contre les conditions de la
production, il a été testé contre leur absence.**

### 1. La connexion à la base ne pouvait pas être chiffrée

`config/db.js` passait au pool exactement ce que contenait `config/env.js` :
hôte, utilisateur, mot de passe, nom de base. Rien d'autre n'était prévu.

En local, MariaDB écoute sur `127.0.0.1` : le trafic ne sort pas de la machine,
le clair ne pose pas de problème. Toute base managée (Railway, Aiven, Scaleway,
PlanetScale) est à l'autre bout d'un réseau et **refuse la connexion en clair** —
`mysql2` n'active TLS que si on lui passe un objet `ssl`. Sans lui, l'échec
arrive au handshake, avant la moindre requête, avec un message qui ne parle pas
de TLS.

Ajouté : `DB_SSL=1` et `DB_SSL_CA` pour les fournisseurs à autorité privée.

**Le réflexe :** une dépendance externe qui « marche » en local marche souvent
parce qu'elle est locale. La question à se poser est « qu'est-ce que ce service
exigera quand il sera ailleurs ? », et le chiffrement en est presque toujours.

### 2. Les migrations n'étaient applicables que chez toi

Chaque fichier `db/*.sql` commençait par `USE spotheplace;`, et `001` créait la
base elle-même. Le nom de la base était donc **écrit en dur dans le schéma**.

Un hébergeur impose son nom de base — souvent généré, souvent illisible. Les six
fichiers étaient inapplicables tels quels, et il n'y avait aucun moyen de le
découvrir avant le jour du déploiement.

Pire, il n'existait aucune trace de ce qui avait déjà été appliqué. `002` et
`004` sont des `ALTER TABLE ADD COLUMN` : les relancer échoue. Sur une base en
ligne, la seule façon de savoir où on en était était de lire le schéma et de
deviner. C'est exactement la situation où on finit par appliquer une migration
deux fois, ou pas du tout.

Ajouté : `USE` et `CREATE DATABASE` retirés (la base vient de la connexion), et
`db/migrate.js` qui inscrit chaque migration appliquée dans `schema_migrations`.

**Le réflexe :** un fichier de schéma ne nomme jamais sa propre base, et un
projet qui a plus de deux migrations a besoin de savoir lesquelles sont passées.
Ce n'est pas de la sophistication, c'est le minimum pour ne pas travailler à
l'aveugle.

### 3. Le limiteur de débit se serait retourné contre toi

`middleware/rateLimit.js` compte par `req.ip`. Derrière un reverse proxy — et
**tous** les hébergeurs PaaS en mettent un — `req.ip` ne vaut plus l'adresse du
visiteur mais celle du proxy. Tout le monde partage alors le même compteur.

Conséquence concrète : la limite « 10 tentatives de connexion ratées par 15
minutes » devient dix tentatives **pour l'ensemble du site**. Dix échecs de
n'importe qui, et plus personne ne peut se connecter. Wendy comprise. Une
protection anti-bruteforce transformée en interrupteur de coupure à disposition
du premier venu.

Express règle ça avec `app.set('trust proxy', 1)`, mais l'activer sans proxy
devant est tout aussi dangereux : n'importe qui usurpe alors son adresse via un
en-tête `X-Forwarded-For` forgé et contourne la limite.

Aucun défaut n'est sûr dans les deux cas. Donc : en production, le serveur
**refuse de démarrer** tant que `TRUST_PROXY` ne vaut pas explicitement `0` ou `1`.

**Le réflexe :** quand un réglage n'a pas de valeur par défaut correcte dans
tous les contextes, ne pas en choisir une — exiger la décision, bruyamment, au
démarrage. Un défaut silencieux qui se trompe est bien pire qu'un refus de
démarrer.

### 4. La version de Node n'était écrite nulle part

`package.json` n'avait pas de champ `engines`. Un hébergeur libre de choisir
prend parfois une LTS ancienne.

Le code utilise `fetch` en global, qui n'existe qu'à partir de Node 18. Sur une
version antérieure, le serveur démarre normalement, sert les pages, répond aux
listes — et casse **à la première création d'adresse**, dans le géocodage. Une
panne qui n'arrive pas au démarrage mais des heures plus tard, sur une seule
fonctionnalité, est plusieurs fois plus longue à diagnostiquer.

Ajouté : `engines: >=18`, doublé d'un contrôle explicite au chargement de la
config, qui dit quelle version manque et pourquoi.

**Le réflexe :** déclarer ce dont on dépend. Une contrainte non écrite n'est pas
une contrainte, c'est une chance.

### 5. La sonde de santé mentait

`GET /api/health` renvoyait `{status:"ok"}` sans jamais toucher la base. Et au
démarrage, si la connexion échouait, `server.js` **écrivait l'erreur puis
laissait le serveur démarrer quand même**.

Les deux ensemble donnent le pire scénario possible : l'hébergeur interroge la
sonde, reçoit « ok », déclare le service sain et lui envoie tout le trafic —
lequel reçoit des 500 sur chaque route. Le tableau de bord est vert, le site est
mort, et rien dans les logs ne pointe vers la cause.

Corrigé : la sonde fait un `SELECT 1` et répond 503 si la base ne répond pas ;
en production, une base injoignable au démarrage sort en code 1.

**Le réflexe :** une sonde de disponibilité qui ne vérifie rien est pire que pas
de sonde du tout — elle transforme une panne franche en panne invisible. Et un
service qui ne peut pas faire son travail doit refuser de se déclarer prêt.

### 6. Chaque redéploiement coupait les requêtes en cours

Aucun `SIGTERM` n'était intercepté. Un hébergeur envoie ce signal puis tue le
processus quelques secondes plus tard. Sans rien pour l'écouter : requêtes en
vol coupées net, connexions MySQL jamais rendues.

Ce n'est pas dramatique sur un site à faible trafic — c'est simplement l'écart
entre un déploiement qu'on ose faire à toute heure et un déploiement qu'on
repousse au soir « au cas où ».

Ajouté : arrêt propre, avec coupure forcée à 10 secondes si une requête ne
finit jamais.

**Le réflexe :** un processus qui tourne en production est démarré *et arrêté*
en permanence. L'arrêt fait partie du programme.

### 7. Le géocodage pouvait suspendre l'API indéfiniment

L'appel à Nominatim se faisait par un `fetch` **sans délai maximal**. Express
n'impose aucun délai par défaut. Si Nominatim ralentit, la requête de Wendy
reste pendue — pas d'erreur, pas de réponse, juste un formulaire figé.

Deux problèmes de plus, du même genre :

- Le `User-Agent` était `SpotThePlace/1.0`, sans contact. La politique d'usage
  de Nominatim exige une application identifiable, et une IP de datacenter avec
  un agent anonyme se fait refuser en 403. Le service qui marche depuis ta
  connexion personnelle peut très bien être bloqué depuis un serveur.
- Le `catch` avalait tout et renvoyait `null`. Une adresse mal orthographiée
  disparaissait donc de la carte **en silence**, sans que personne ne sache
  pourquoi.

Corrigé : délai de 5 s, contact dans le `User-Agent` (`NOMINATIM_CONTACT`),
vérification du code HTTP avant de parser, et une alerte tracée dans chacun des
trois cas d'échec.

**Le réflexe :** tout appel réseau sortant a besoin d'un délai maximal. Et un
`catch` qui renvoie une valeur neutre sans rien écrire transforme une panne en
comportement bizarre — c'est la forme de bug la plus coûteuse à retrouver.

### 8. Le montage front / API n'était écrit nulle part

Le back ne sert que du JSON, il n'y a pas d'`express.static` : le front est
déployé séparément. Ce n'est pas un défaut, c'est un choix — mais il commande
la configuration du cookie de session, et rien ne le disait.

Sur deux domaines distincts, `COOKIE_SAMESITE` doit passer à `none`, ce qui
impose HTTPS des deux côtés. Sinon le navigateur **jette le cookie sans le
moindre message** : la connexion échoue, la console est vide, et on cherche le
bug dans le code d'authentification alors qu'il est dans la configuration.

Documenté dans `back/ADMIN_GUIDE.md`, section « Héberger l'API », avec les deux
montages possibles.

**Le réflexe :** ce qui n'est écrit nulle part sera redécouvert dans l'urgence.
Une décision d'architecture qui contraint la configuration doit être écrite à
côté de la configuration.

### En marge, du même esprit

- **`change-password` n'avait pas de limite de débit.** Il vérifie l'ancien mot
  de passe : une session volée permettait de le forcer à l'aveugle, et chaque
  essai coûte un `bcrypt` complet, donc du processeur serveur. Toute route qui
  compare un secret a besoin d'une limite, pas seulement `/login`.
- **La clé du limiteur incluait le chemin exact.** Sur `/avis/:cafeId`, le
  chemin change à chaque café : la limite aurait été comptée par café au lieu
  de par visiteur. Un plafond mal découpé donne l'illusion d'une protection.
- **`npm test` échouait volontairement.** Certains hébergeurs lancent les tests
  pendant le build : un échec délibéré aurait cassé le déploiement. Il sort
  maintenant en 0 avec un message honnête — il n'y a pas de test, autant le dire
  sans faire échouer la chaîne.
- **Les logs n'avaient ni date ni niveau.** Lisible dans un terminal qu'on
  regarde, illisible dans un agrégateur qui mélange les sorties de toutes les
  instances. `utils/journal.js` horodate et étiquette.

---

## 2026-09-03 — Base remplie et compte administrateur

Le schéma était complet mais les cinq adresses du jeu de départ n'avaient ni
coordonnées, ni verdict, ni photo : carte vide et fiches creuses. Aucun compte
n'existait, donc `/admin` était inatteignable.

Rempli **via l'API en session admin** plutôt qu'en SQL direct. La différence
compte : le géocodage Nominatim se déclenche tout seul sur `POST`/`PUT`, et
surtout ça teste le chemin exact que Wendy empruntera. Remplir en SQL aurait
donné la même base et n'aurait rien prouvé.

Compte créé par `POST /api/users/register` puis promu en base — l'API ignore
volontairement un `role` envoyé dans le corps de la requête, sinon n'importe qui
se fabriquerait un compte admin depuis le formulaire d'inscription.

**Point ouvert :** rien de tout ça n'est dans un fichier de seed. Un réimport
de `db/seed.sql` et les cinq fiches redeviennent vides.

**Le réflexe :** quand un état a demandé du travail à construire, se demander ce
qui le reconstruit. S'il n'existe que dans une base locale, il n'existe qu'une
fois.

---

## Ce qui revient d'une entrée à l'autre

Trois motifs, à reconnaître avant qu'on te les signale :

1. **L'échec silencieux.** Un `catch` qui renvoie `null`, une sonde qui répond
   « ok » sans vérifier, un serveur qui démarre sans sa base, un cookie jeté par
   le navigateur. À chaque fois, le système continue de tourner en donnant un
   résultat faux. Toujours préférer l'échec bruyant et immédiat.
2. **Le défaut implicite.** `TRUST_PROXY` absent, version de Node non déclarée,
   nom de base en dur. Une valeur non écrite est une valeur choisie par quelqu'un
   d'autre — souvent mal.
3. **Le local pris pour la référence.** Pas de TLS, pas de proxy, pas de délai
   réseau, pas de redéploiement. Ta machine est le seul environnement où rien de
   tout ça n'existe.
4. **La vérité recopiée.** Le nom de la base écrit dans chaque migration,
   l'horaire stocké en texte et en table, la liste de colonnes dupliquée entre
   deux contrôleurs. À chaque fois on corrige un endroit et on oublie l'autre.
   Trois occurrences en une journée : c'est le motif le plus fréquent de ce
   journal.
5. **L'intention prise pour un fait.** Un commentaire qui affirme que deux
   chemins sont indiscernables, alors que le chronomètre les sépare d'un facteur
   cinquante. Ce que le code dit de lui-même se vérifie, surtout quand c'est
   rassurant.
