const { NODE_ENV, COOKIE_SAMESITE } = require('../config/env');

// Le jeton vit dans un cookie `httpOnly` : aucun script de la page ne peut le
// lire, donc une injection ne suffit plus à voler une session. C'est la
// contrepartie du stockage navigateur, qui était lisible par n'importe quoi.
const NOM_JETON = 'jeton';
const DUREE_MS = 24 * 60 * 60 * 1000;

// `sameSite: 'none'` impose `secure`, sinon le navigateur refuse le cookie.
const options = () => ({
  httpOnly: true,
  secure: NODE_ENV === 'production' || COOKIE_SAMESITE === 'none',
  sameSite: COOKIE_SAMESITE,
  path: '/'
});

exports.NOM_JETON = NOM_JETON;

exports.poserJeton = (res, jeton) => {
  res.cookie(NOM_JETON, jeton, { ...options(), maxAge: DUREE_MS });
};

exports.retirerJeton = (res) => {
  res.clearCookie(NOM_JETON, options());
};

/**
 * Lit le jeton, du cookie d'abord, de l'en-tête Authorization ensuite.
 * L'en-tête reste accepté pour les appels en ligne de commande et les scripts :
 * eux n'ont pas de navigateur à protéger.
 */
exports.lireJeton = (req) => {
  const brut = req.headers.cookie;

  if (brut) {
    for (const morceau of brut.split(';')) {
      const separateur = morceau.indexOf('=');
      if (separateur === -1) continue;
      if (morceau.slice(0, separateur).trim() !== NOM_JETON) continue;
      return decodeURIComponent(morceau.slice(separateur + 1).trim());
    }
  }

  const entete = req.headers.authorization;
  if (entete && entete.startsWith('Bearer ')) {
    return entete.slice(7).trim();
  }

  return null;
};
