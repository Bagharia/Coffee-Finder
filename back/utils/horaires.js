// Validation des horaires reçus par l'API. Volontairement sans accès à la
// base : c'est du calcul pur, donc testable sans MySQL ni serveur.

// Jour 1 = lundi … 7 = dimanche. Absence de ligne pour un jour = fermé ce
// jour-là. Plusieurs lignes pour un même jour = service coupé.
const HEURE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const PLAGES_MAX = 28;

/**
 * Valide le tableau d'horaires reçu. Renvoie { erreur } ou { plages }.
 * `undefined` signifie « ne touche pas aux horaires » ; un tableau vide
 * signifie « cette adresse n'a plus d'horaires », ce qui est différent.
 */
function validerHoraires(horaires) {
    if (horaires === undefined) return { plages: undefined };
    if (!Array.isArray(horaires)) return { erreur: 'horaires doit être un tableau de plages.' };
    if (horaires.length > PLAGES_MAX) {
        return { erreur: `horaires : ${PLAGES_MAX} plages au maximum, ${horaires.length} reçues.` };
    }

    const plages = [];
    const vues = new Set();

    for (const plage of horaires) {
        const jour = Number(plage?.jour);
        if (!Number.isInteger(jour) || jour < 1 || jour > 7) {
            return { erreur: 'horaires : jour doit être un entier de 1 (lundi) à 7 (dimanche).' };
        }

        const ouverture = String(plage?.ouverture ?? '');
        const fermeture = String(plage?.fermeture ?? '');

        if (!HEURE.test(ouverture) || !HEURE.test(fermeture)) {
            return { erreur: 'horaires : ouverture et fermeture doivent être au format HH:MM.' };
        }

        const debut = ouverture.length === 5 ? `${ouverture}:00` : ouverture;
        const fin = fermeture.length === 5 ? `${fermeture}:00` : fermeture;

        // Une plage qui commence et finit à la même heure ne veut rien dire, et
        // se lirait comme « ouvert vingt-quatre heures » côté front.
        if (debut === fin) {
            return { erreur: 'horaires : une plage ne peut pas ouvrir et fermer à la même heure.' };
        }

        // L'index UNIQUE(cafe_id, jour, ouverture) rejetterait le doublon avec
        // une erreur SQL illisible : autant le dire clairement ici.
        const cle = `${jour}-${debut}`;
        if (vues.has(cle)) {
            return { erreur: `horaires : deux plages commencent à ${ouverture} le même jour.` };
        }
        vues.add(cle);

        plages.push({ jour, ouverture: debut, fermeture: fin });
    }

    return { plages };
}

module.exports = { validerHoraires, HEURE, PLAGES_MAX };
