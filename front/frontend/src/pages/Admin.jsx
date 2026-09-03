import { useEffect, useState } from "react";
import { cafesAPI, LIMITE_MAX } from "../services/api";
import AdminFormulaire from "../components/AdminFormulaire";

const FORMULAIRE_VIDE = {
  nom: "",
  arrondissement: "",
  adresse: "",
  image_url: "",
  description: "",
  verdict: "",
  coup_de_coeur: 0,
  specialite: [],
  prix: "1-10",
  wifi: 0,
  prises: 0,
  travailler: 0,
  theme: "",
  ambiance: "",
  nb_personnes: "",
  horaires: []
};

export default function Admin() {
  const [cafes, setCafes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [enModification, setEnModification] = useState(null);
  const [valeurs, setValeurs] = useState(FORMULAIRE_VIDE);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurFormulaire, setErreurFormulaire] = useState(null);

  const charger = () => {
    setChargement(true);
    cafesAPI.getAll({ limite: LIMITE_MAX })
      .then((reponse) => { setCafes(reponse.donnees); setErreur(null); })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  };

  useEffect(charger, []);

  const ouvrirAjout = () => {
    setEnModification(null);
    setValeurs(FORMULAIRE_VIDE);
    setErreurFormulaire(null);
    setFormulaireOuvert(true);
  };

  const ouvrirModification = (cafe) => {
    setEnModification(cafe);
    setValeurs({
      ...FORMULAIRE_VIDE,
      ...cafe,
      // L'API renvoie les spécialités en texte, le formulaire les manipule en liste.
      specialite: cafe.specialite ? cafe.specialite.split(",").map((s) => s.trim()) : [],
      description: cafe.description ?? "",
      verdict: cafe.verdict ?? "",
      adresse: cafe.adresse ?? "",
      image_url: cafe.image_url ?? "",
      theme: cafe.theme ?? "",
      ambiance: cafe.ambiance ?? "",
      nb_personnes: cafe.nb_personnes ?? "",
      // L'API renvoie des TIME en HH:MM:SS, les champs <input type="time">
      // veulent du HH:MM.
      horaires: (cafe.horaires ?? []).map((p) => ({
        jour: p.jour,
        ouverture: p.ouverture.slice(0, 5),
        fermeture: p.fermeture.slice(0, 5)
      })),
      prix: cafe.prix ?? "1-10"
    });
    setErreurFormulaire(null);
    setFormulaireOuvert(true);
  };

  const envoyer = async (e) => {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreurFormulaire(null);

    const charge = { ...valeurs, specialite: valeurs.specialite.join(",") };

    try {
      if (enModification) await cafesAPI.update(enModification.id, charge);
      else await cafesAPI.create(charge);

      setFormulaireOuvert(false);
      setEnModification(null);
      setValeurs(FORMULAIRE_VIDE);
      charger();
    } catch (err) {
      setErreurFormulaire(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const supprimer = async (cafe) => {
    if (!window.confirm(`supprimer « ${cafe.nom} » ? les avis et favoris partent avec.`)) return;
    try {
      await cafesAPI.delete(cafe.id);
      charger();
    } catch (err) {
      setErreur(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-trait pb-6">
        <div>
          <h1 className="text-section text-encre">administration</h1>
          <p className="mt-1 text-meta text-gris">
            {chargement ? "on regarde…" : `${cafes.length} adresse${cafes.length > 1 ? "s" : ""} au guide`}
          </p>
        </div>
        <button type="button" onClick={ouvrirAjout} className="flex items-center bg-plaque px-6 text-white">
          ajouter une adresse
        </button>
      </div>

      {formulaireOuvert && (
        <div className="mt-8">
          <AdminFormulaire
            valeurs={valeurs}
            onChange={setValeurs}
            onEnvoyer={envoyer}
            onAnnuler={() => setFormulaireOuvert(false)}
            enCours={envoiEnCours}
            erreur={erreurFormulaire}
            modification={Boolean(enModification)}
          />
        </div>
      )}

      <div className="mt-8">
        {chargement ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="squelette h-16 w-full" />)}
          </div>
        ) : erreur ? (
          <p className="mesure text-corps text-encre">
            {erreur} la liste revient en rafraîchissant la page.
          </p>
        ) : cafes.length === 0 ? (
          <p className="mesure text-corps text-encre">
            le guide est vide. la première adresse s&apos;ajoute avec le bouton ci-dessus.
          </p>
        ) : (
          <ul className="border-t border-trait">
            {cafes.map((cafe) => (
              <li key={cafe.id} className="flex flex-wrap items-center gap-4 border-b border-trait py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-encre">{cafe.nom}</p>
                  <p className="text-meta text-gris">{cafe.arrondissement}</p>
                </div>

                {cafe.coup_de_coeur === 1 && <span className="text-meta text-rouge">coup de cœur</span>}
                {!cafe.verdict && <span className="text-meta text-gris">sans verdict</span>}

                <button type="button" onClick={() => ouvrirModification(cafe)} className="flex items-center text-meta text-encre underline underline-offset-4">
                  modifier
                </button>
                <button type="button" onClick={() => supprimer(cafe)} className="flex items-center text-meta text-rouge underline underline-offset-4">
                  supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
