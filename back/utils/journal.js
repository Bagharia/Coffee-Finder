// Un `console.log` nu devient illisible dès qu'il arrive dans l'agrégateur de
// logs d'un hébergeur, qui mélange les sorties de toutes les instances sans
// date ni niveau. Deux fonctions suffisent : pas de lib de log dans la stack.
const horodatage = () => new Date().toISOString();

exports.info = (...args) => console.log(horodatage(), 'INFO', ...args);
exports.erreur = (...args) => console.error(horodatage(), 'ERREUR', ...args);
exports.alerte = (...args) => console.warn(horodatage(), 'ALERTE', ...args);
