import { useCallback, useMemo, useState } from "react";
import { cafesAPI } from "../services/api";
import { useListePaginee } from "../hooks/useListePaginee";
import AdminListe from "../components/AdminListe";
import AdminRecherche from "../components/AdminRecherche";
import { useTitrePage } from "../hooks/useTitrePage";
import AdminFormulaire from "../components/AdminFormulaire";
import AdminCorbeille from "../components/AdminCorbeille";

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

const PAR_PAGE = 20;

export default function Admin() {
  useTitrePage("Administration");
  const [recherche, setRecherche] = useState("");
  const [erreurAction, setErreurAction] = useState(null);

  const filtres = useMemo(() => (recherche ? { q: recherche } : {}), [recherche]);

  const recuperer = useCallback(
    ({ page }) => cafesAPI.search(filtres, { page, limite: PAR_PAGE }),
    [filtres]
  );

  const {
    adresses: cafes, total, chargement, chargementSuite, erreur: erreurListe,
    encore, chargerPlus, recharger: charger
  } = useListePaginee(recuperer, filtres);

  const erreur = erreurListe ?? erreurAction;

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [enModification, setEnModification] = useState(null);
  const [valeurs, setValeurs] = useState(FORMULAIRE_VIDE);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurFormulaire, setErreurFormulaire] = useState(null);

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
    if (!window.confirm(`mettre « ${cafe.nom} » à la corbeille ? les avis et les favoris sont conservés, et l'adresse pourra être rétablie.`)) return;
    setErreurAction(null);
    try {
      await cafesAPI.delete(cafe.id);
      charger();
    } catch (err) {
      setErreurAction(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-trait pb-6">
        <div>
          <h1 className="text-titre text-encre">administration</h1>
          <p className="chapo">
            {chargement ? "on regarde…" : `${total} adresse${total > 1 ? "s" : ""} ${recherche ? "trouvée" + (total > 1 ? "s" : "") : "au guide"}`}
          </p>
        </div>
        <button type="button" onClick={ouvrirAjout} className="bouton">
          ajouter une adresse
        </button>
      </div>

      <AdminRecherche recherche={recherche} onRechercher={setRecherche} />

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
            cafeId={enModification?.id}
            onImageTeleversee={charger}
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
            {recherche
              ? "aucune adresse ne correspond à cette recherche."
              : "le guide est vide. la première adresse s'ajoute avec le bouton ci-dessus."}
          </p>
        ) : (
          <>
            <AdminListe cafes={cafes} onModifier={ouvrirModification} onSupprimer={supprimer} />

            {encore && (
              <div className="mt-6 flex flex-col items-start gap-2">
                <button type="button" onClick={chargerPlus} disabled={chargementSuite} className="bouton-secondaire">
                  {chargementSuite ? "on charge…" : "voir la suite"}
                </button>
                <p className="text-meta text-gris" aria-live="polite">{cafes.length} sur {total}</p>
              </div>
            )}
          </>
        )}
      </div>

      <AdminCorbeille surChangement={charger} />
    </div>
  );
}
