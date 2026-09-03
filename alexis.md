# Journal des décisions techniques — SpotThePlace

À quoi sert ce fichier : chaque modification importante y est expliquée, pas
seulement décrite. Le but n'est pas de savoir *ce qui* a changé — `git log` le
dit mieux — mais de comprendre *pourquoi c'était un problème*, pour reconnaître
le même motif la prochaine fois sans qu'on ait à te le signaler.

Entrée la plus récente en haut. Chaque entrée date du jour où le travail a été
fait, en absolu.

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
