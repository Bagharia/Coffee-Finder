// Horaires d'ouverture. Convention de la base : jour 1 = lundi … 7 = dimanche,
// absence de plage pour un jour = fermé ce jour-là, plusieurs plages pour un
// même jour = service coupé.

export const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

// Le fuseau est forcé, jamais déduit. Sur un hébergeur le serveur tourne en
// UTC — deux heures d'écart l'été — et le navigateur d'un lecteur en voyage
// n'est pas non plus à l'heure de Paris. Un guide de Paris répond « ouvert »
// à l'heure de Paris, d'où qu'on le lise.
const FUSEAU = "Europe/Paris";

// `en-US` pour des abréviations de jour stables, `h23` pour que minuit
// s'écrive 00 et non 24.
const FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: FUSEAU,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

const INDEX_JOUR = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** L'instant courant à Paris : { jour, minutes depuis minuit }. */
export function instantParis(date = new Date()) {
  const parties = Object.fromEntries(FORMAT.formatToParts(date).map((p) => [p.type, p.value]));

  return {
    jour: INDEX_JOUR[parties.weekday],
    minutes: Number(parties.hour) * 60 + Number(parties.minute)
  };
}

const enMinutes = (heure) => {
  const [h, m] = heure.split(":");
  return Number(h) * 60 + Number(m);
};

const veille = (jour) => (jour === 1 ? 7 : jour - 1);

/**
 * true ouvert, false fermé, null si l'adresse n'a pas d'horaires renseignés —
 * « on ne sait pas » n'est pas « c'est fermé », et la DA réserve le rouge à
 * l'état fermé avéré.
 */
export function estOuvert(plages, date = new Date()) {
  if (!Array.isArray(plages) || plages.length === 0) return null;

  const { jour, minutes } = instantParis(date);

  for (const plage of plages) {
    const debut = enMinutes(plage.ouverture);
    const fin = enMinutes(plage.fermeture);

    if (fin > debut) {
      if (plage.jour === jour && minutes >= debut && minutes < fin) return true;
      continue;
    }

    // Fermeture après minuit : la plage appartient au jour de son ouverture et
    // déborde sur le suivant. À 00h30 un mardi, c'est la plage du lundi qui
    // décide — un test `debut <= maintenant < fin` répondrait « fermé » alors
    // que la salle est pleine.
    if (plage.jour === jour && minutes >= debut) return true;
    if (plage.jour === veille(jour) && minutes < fin) return true;
  }

  return false;
}

const formaterHeure = (heure) => {
  const [h, m] = heure.split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
};

/** Les sept jours, dans l'ordre, chacun avec ses plages triées. */
export function parJour(plages = []) {
  return JOURS.map((nom, index) => ({
    jour: index + 1,
    nom,
    plages: plages
      .filter((p) => p.jour === index + 1)
      .sort((a, b) => a.ouverture.localeCompare(b.ouverture))
  }));
}

/** « 8h – 17h », « 9h – 15h, 18h – 23h », ou « fermé ». */
export function resumeJour(plagesDuJour) {
  if (plagesDuJour.length === 0) return "fermé";

  return plagesDuJour
    .map((p) => `${formaterHeure(p.ouverture)} – ${formaterHeure(p.fermeture)}`)
    .join(", ");
}
