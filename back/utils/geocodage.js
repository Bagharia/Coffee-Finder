const { FRONTEND_URL } = require('../config/env');
const journal = require('./journal');

// Géocode une adresse via Nominatim (OpenStreetMap) — retourne { lat, lon } ou null.
// Best-effort : une adresse non géocodée entre quand même, elle n'apparaît
// simplement pas sur la carte.
//
// Deux précautions que le développement local ne réclame pas mais qu'un
// hébergement impose : un délai maximal, sans quoi un Nominatim lent laisse la
// requête de Wendy suspendue indéfiniment (Express n'a pas de délai par
// défaut) ; et un User-Agent identifiable, exigé par leur politique d'usage —
// une IP de datacenter avec un agent anonyme se fait refuser en 403.
const GEOCODAGE_DELAI_MS = 5000;

const agentNominatim = () => {
    const contact = process.env.NOMINATIM_CONTACT || FRONTEND_URL;
    return `SpotThePlace/1.0 (${contact})`;
};

async function geocodeAdresse(adresse) {
    if (!adresse) return null;
    try {
        const query = encodeURIComponent(`${adresse}, Paris, France`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
        const res = await fetch(url, {
            headers: { 'User-Agent': agentNominatim() },
            signal: AbortSignal.timeout(GEOCODAGE_DELAI_MS)
        });

        // Un 403 ou un 429 renvoie une page HTML : la parser en JSON lèverait
        // une erreur trompeuse, très loin de la vraie cause.
        if (!res.ok) {
            journal.alerte(`[cafes] Nominatim a répondu ${res.status} — adresse non géocodée : ${adresse}`);
            return null;
        }

        const data = await res.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }

        // Sans cette trace, une adresse mal orthographiée disparaît de la carte
        // sans que personne ne sache pourquoi.
        journal.alerte(`[cafes] Nominatim ne connaît pas cette adresse : ${adresse}`);
        return null;
    } catch (err) {
        const cause = err.name === 'TimeoutError'
            ? `pas de réponse en ${GEOCODAGE_DELAI_MS} ms`
            : err.message;
        journal.alerte(`[cafes] géocodage impossible (${cause}) — adresse : ${adresse}`);
        return null;
    }
}

module.exports = { geocodeAdresse, GEOCODAGE_DELAI_MS };
