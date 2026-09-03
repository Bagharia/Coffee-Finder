import { useEffect, useState } from "react";
import { cafesAPI, LIMITE_MAX } from "../services/api";

/**
 * Les adresses mises à la corbeille.
 *
 * Repliée par défaut : c'est un filet de rattrapage, pas un écran de travail.
 * L'ouvrir déclenche le chargement — inutile d'interroger l'API à chaque visite
 * de la page d'administration pour une liste presque toujours vide.
 */
export default function AdminCorbeille({ surChangement }) {
  const [ouverte, setOuverte] = useState(false);
  const [adresses, setAdresses] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(null);

  useEffect(() => {
    if (!ouverte) return;

    setChargement(true);
    cafesAPI.getCorbeille({ limite: LIMITE_MAX })
      .then((reponse) => { setAdresses(reponse.donnees); setErreur(null); })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, [ouverte]);

  const retirer = (id) => setAdresses((liste) => liste.filter((cafe) => cafe.id !== id));

  const retablir = async (cafe) => {
    setEnCours(cafe.id);
    setErreur(null);
    try {
      await cafesAPI.restaurer(cafe.id);
      retirer(cafe.id);
      surChangement?.();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(null);
    }
  };

  const detruire = async (cafe) => {
    // Deuxième confirmation volontaire : c'est la seule action de cette
    // interface qu'on ne peut pas défaire.
    if (!window.confirm(
      `détruire « ${cafe.nom} » définitivement ? les avis et les favoris de cette adresse partent avec, et rien ne pourra être rétabli.`
    )) return;

    setEnCours(cafe.id);
    setErreur(null);
    try {
      await cafesAPI.supprimerDefinitivement(cafe.id);
      retirer(cafe.id);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(null);
    }
  };

  return (
    <section className="mt-12 border-t border-trait pt-6">
      <button
        type="button"
        onClick={() => setOuverte((etat) => !etat)}
        aria-expanded={ouverte}
        className="flex min-h-11 items-center text-meta text-gris underline underline-offset-4"
      >
        corbeille {ouverte ? "—" : "+"}
      </button>

      {ouverte && (
        <div className="mt-4">
          {chargement && <p className="text-meta text-gris">Chargement…</p>}
          {erreur && <p className="text-meta text-rouge">{erreur}</p>}

          {!chargement && !erreur && adresses.length === 0 && (
            <p className="text-meta text-gris">La Corbeille Est Vide.</p>
          )}

          {adresses.length > 0 && (
            <ul className="border-t border-trait">
              {adresses.map((cafe) => (
                <li key={cafe.id} className="flex flex-wrap items-center gap-4 border-b border-trait py-3">
                  <span className="flex-1 text-corps text-encre">
                    {cafe.nom}
                    <span className="ml-3 text-meta text-gris">{cafe.arrondissement}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => retablir(cafe)}
                    disabled={enCours === cafe.id}
                    className="flex min-h-11 items-center text-meta text-encre underline underline-offset-4 disabled:opacity-50"
                  >
                    Rétablir
                  </button>

                  <button
                    type="button"
                    onClick={() => detruire(cafe)}
                    disabled={enCours === cafe.id}
                    className="flex min-h-11 items-center text-meta text-rouge underline underline-offset-4 disabled:opacity-50"
                  >
                    Détruire
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
