// Limiteur de débit en mémoire, sans dépendance : la stack tient dans une seule
// page de CLAUDE.md et une lib de plus est une dette de plus.
//
// Limite : le compteur vit dans le processus. Un jour où l'API tournera sur
// plusieurs instances, il faudra le sortir en base ou passer à express-rate-limit.

const fenetres = new Map();

// Purge périodique : sans elle, la Map grossit à chaque IP vue.
const PURGE_MS = 10 * 60 * 1000;
setInterval(() => {
  const maintenant = Date.now();
  for (const [cle, entree] of fenetres) {
    if (entree.expireA <= maintenant) fenetres.delete(cle);
  }
}, PURGE_MS).unref();

/**
 * @param {object} options
 * @param {number} options.fenetreMs durée de la fenêtre glissante
 * @param {number} options.max nombre de requêtes autorisées par fenêtre
 * @param {string} options.message message renvoyé au client une fois la limite atteinte
 */
exports.rateLimit = ({ fenetreMs, max, message }) => (req, res, next) => {
  const cle = `${req.baseUrl}${req.path}:${req.ip}`;
  const maintenant = Date.now();
  const entree = fenetres.get(cle);

  if (!entree || entree.expireA <= maintenant) {
    fenetres.set(cle, { compte: 1, expireA: maintenant + fenetreMs });
    return next();
  }

  entree.compte += 1;

  if (entree.compte > max) {
    const secondes = Math.ceil((entree.expireA - maintenant) / 1000);
    res.setHeader('Retry-After', secondes);
    return res.status(429).json({ error: message, reessayerDans: secondes });
  }

  next();
};
