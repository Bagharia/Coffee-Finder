import { useCallback, useState } from "react";

const MESSAGES = {
  1: "la position est refusée. l'autoriser dans les réglages du navigateur pour ce site, puis réessayer.",
  2: "la position est introuvable pour le moment. réessayer dehors, ou avec le wifi activé.",
  3: "la position met trop de temps à arriver. réessayer.",
  absent: "ce navigateur ne sait pas donner votre position.",
  inconnu: "la position n'a pas pu être lue."
};

/**
 * Position de la personne, sur demande.
 *
 * Une lecture unique, déclenchée par un bouton : jamais de suivi continu
 * (`watchPosition`). Le suivi viderait la batterie d'une personne qui marche,
 * et la carte ne « suit » pas l'utilisateur — c'est une règle de ce site.
 * Le navigateur demande lui-même l'autorisation, et la position reste dans cet
 * onglet : elle n'est envoyée à aucun serveur.
 *
 * Elle exige un contexte sécurisé (HTTPS, ou localhost en développement).
 *
 * @returns {{ statut: "inactif"|"recherche"|"trouvee"|"erreur", position: ?{lat:number, lon:number, instant:number}, message: ?string, localiser: () => void }}
 */
export function useGeolocalisation() {
  const [etat, setEtat] = useState({ statut: "inactif", position: null, message: null });

  const localiser = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setEtat((e) => ({ ...e, statut: "erreur", message: MESSAGES.absent }));
      return;
    }

    setEtat((e) => ({ ...e, statut: "recherche", message: null }));

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setEtat({
        statut: "trouvee",
        // `instant` distingue deux lectures identiques : le recentrage de la
        // carte doit se rejouer à chaque appui, même sans avoir bougé.
        position: { lat: coords.latitude, lon: coords.longitude, instant: Date.now() },
        message: null
      }),
      (err) => setEtat((e) => ({
        statut: "erreur",
        position: e.position,
        message: MESSAGES[err.code] ?? MESSAGES.inconnu
      })),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { ...etat, localiser };
}
