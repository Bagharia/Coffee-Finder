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

// Même règle que le front (`estOuvert`), écrite en SQL : filtrer « ouvert
// maintenant » sur la page déjà chargée ne montrerait que les ouvertes de cette
// page, alors que la question porte sur tout le guide.
const FUSEAU = 'Europe/Paris';

const FORMAT = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSEAU,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
});

const INDEX_JOUR = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** L'instant à Paris : { jour (1 = lundi … 7), minutes depuis minuit }. */
function instantParis(date = new Date()) {
    const parties = Object.fromEntries(FORMAT.formatToParts(date).map((p) => [p.type, p.value]));

    return {
        jour: INDEX_JOUR[parties.weekday],
        minutes: Number(parties.hour) * 60 + Number(parties.minute)
    };
}

const enHeure = (minutes) => {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    return `${h}:${m}:00`;
};

/**
 * Fragment SQL « ouvert à cet instant », à poser dans un WHERE sur `cafes`.
 *
 * Une plage dont la fermeture est postérieure à l'ouverture se lit sur son
 * jour. Sinon elle déborde après minuit : le soir de son jour, ou le matin du
 * jour suivant — d'où la plage de la veille qui décide à 00h30.
 * Une adresse sans aucune plage n'est jamais retenue : « on ne sait pas » n'est
 * pas « ouvert ».
 *
 * @returns {{ sql: string, valeurs: Array }}
 */
function conditionOuvert(date = new Date()) {
    const { jour, minutes } = instantParis(date);
    const veille = jour === 1 ? 7 : jour - 1;
    const heure = enHeure(minutes);

    return {
        sql: `EXISTS (
            SELECT 1 FROM cafe_horaires h
            WHERE h.cafe_id = cafes.id AND (
                (h.fermeture > h.ouverture AND h.jour = ? AND h.ouverture <= ? AND h.fermeture > ?)
                OR (h.fermeture <= h.ouverture AND h.jour = ? AND h.ouverture <= ?)
                OR (h.fermeture <= h.ouverture AND h.jour = ? AND h.fermeture > ?)
            )
        )`,
        valeurs: [jour, heure, heure, jour, heure, veille, heure]
    };
}

module.exports = { validerHoraires, instantParis, conditionOuvert, HEURE, PLAGES_MAX };
