// Validation d'entrée partagée par les contrôleurs.
// Règle : une route d'écriture ne touche jamais la base avant d'avoir borné
// ce qu'elle reçoit. Les messages sont en français, ils sont affichés tels quels.

const LIMITE_DEFAUT = 20;
const LIMITE_MAX = 100;

/**
 * Lit ?page et ?limite et les borne. Toute route de liste passe par ici.
 * @returns {{ page: number, limite: number, offset: number }}
 */
exports.lirePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limiteDemandee = Number.parseInt(query.limite, 10) || LIMITE_DEFAUT;
  const limite = Math.min(LIMITE_MAX, Math.max(1, limiteDemandee));

  return { page, limite, offset: (page - 1) * limite };
};

/** Enveloppe de réponse commune à toutes les routes de liste. */
exports.reponsePaginee = (donnees, { page, limite }, total) => ({
  donnees,
  page,
  limite,
  total
});

// Volontairement permissif : le rôle de cette vérification est d'écarter les
// saisies manifestement fausses, pas d'arbitrer la RFC 5322.
const FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

exports.MOT_DE_PASSE_MIN = 8;

/**
 * Valide un corps de requête à partir d'un schéma simple.
 * @param {object} corps req.body
 * @param {object} schema { champ: { requis, type, min, max, valeurs } }
 * @returns {string[]} liste des erreurs, vide si tout passe
 */
exports.valider = (corps, schema) => {
  const erreurs = [];

  for (const [champ, regle] of Object.entries(schema)) {
    const valeur = corps[champ];
    const absent = valeur === undefined || valeur === null || valeur === '';

    if (absent) {
      if (regle.requis) erreurs.push(`${champ} est obligatoire.`);
      continue;
    }

    if (regle.type === 'email' && !FORMAT_EMAIL.test(String(valeur))) {
      erreurs.push('Format d\'email invalide.');
      continue;
    }

    if (regle.type === 'entier') {
      const nombre = Number(valeur);
      if (!Number.isInteger(nombre)) {
        erreurs.push(`${champ} doit être un nombre entier.`);
        continue;
      }
      if (regle.min !== undefined && nombre < regle.min) {
        erreurs.push(`${champ} doit valoir au moins ${regle.min}.`);
      }
      if (regle.max !== undefined && nombre > regle.max) {
        erreurs.push(`${champ} ne peut pas dépasser ${regle.max}.`);
      }
      continue;
    }

    if (regle.type === 'booleen') {
      if (![0, 1, true, false, '0', '1'].includes(valeur)) {
        erreurs.push(`${champ} doit valoir 0 ou 1.`);
      }
      continue;
    }

    const texte = String(valeur);
    if (regle.min !== undefined && texte.length < regle.min) {
      erreurs.push(`${champ} doit faire au moins ${regle.min} caractères.`);
    }
    if (regle.max !== undefined && texte.length > regle.max) {
      erreurs.push(`${champ} ne peut pas dépasser ${regle.max} caractères.`);
    }
    if (regle.valeurs && !regle.valeurs.includes(texte)) {
      erreurs.push(`${champ} doit valoir : ${regle.valeurs.join(', ')}.`);
    }
  }

  return erreurs;
};

/** Convertit une valeur reçue en 0/1 pour les colonnes TINYINT(1). */
exports.versBooleen = (valeur, defaut = 0) => {
  if (valeur === undefined || valeur === null || valeur === '') return defaut;
  return valeur === true || valeur === 1 || valeur === '1' ? 1 : 0;
};
