// Comparaison d'adresses. Volontairement sans accès à la base : c'est du
// calcul pur, donc testable sans MySQL ni serveur.

/**
 * Réduit une adresse à sa forme comparable : sans accents, sans casse, sans
 * ponctuation, espaces normalisés.
 *
 *   « 12 Rue de Bretagne, 75003 Paris »  →  « 12 rue de bretagne 75003 paris »
 *   « 12 rue de bretagne 75003 PARIS »   →  « 12 rue de bretagne 75003 paris »
 *
 * Le résultat n'est jamais stocké. Le garder en colonne ferait une deuxième
 * source de vérité pour l'adresse — quelqu'un modifierait `adresse` sans
 * recalculer sa forme normalisée, et les deux divergeraient. C'est le motif
 * qui a déjà coûté la page des favoris ; il se recalcule à chaque écriture,
 * qui sont rares sur ce guide.
 */
exports.normaliserAdresse = (adresse) => {
    if (!adresse) return '';

    return String(adresse)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
};

/**
 * Échappe les jokers SQL d'une saisie destinée à un LIKE.
 * Sans ça, une recherche contenant `%` remonterait toute la table, et `_`
 * remplacerait silencieusement n'importe quel caractère.
 */
exports.echapperLike = (texte) => String(texte).replace(/[\\%_]/g, '\\$&');
