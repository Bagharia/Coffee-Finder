import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CafeCard from "../components/CafeCard";
import AdresseCompacte from "../components/AdresseCompacte";
import VerdictUne from "../components/VerdictUne";
import PhraseConcept from "../components/PhraseConcept";
import { cafesAPI } from "../services/api";
import { useListePaginee } from "../hooks/useListePaginee";

// Le filtre « salon de thé » se lit sur la catégorie « Thé » de la base — la
// DA écrit le mot que Wendy emploie, pas le nom technique de la colonne.
const PILULES = [
  { id: "", label: "tout paris" },
  { id: "Matcha", label: "matcha" },
  { id: "Bubble Tea", label: "bubble tea" },
  { id: "Thé", label: "salon de thé" },
  { id: "travailler", label: "bon pour travailler" }
];

const NB_DERNIERES = 4;

export default function Home() {
  const [une, setUne] = useState(null);
  const [uneChargement, setUneChargement] = useState(true);
  const [avecVerdict, setAvecVerdict] = useState([]);
  const [verdictsChargement, setVerdictsChargement] = useState(true);
  const [totalGuide, setTotalGuide] = useState(null);
  const [filtre, setFiltre] = useState("");
  const [ouvertSeulement, setOuvertSeulement] = useState(false);

  useEffect(() => {
    // Un coup de cœur pour la une. Il lui faut un verdict : sans texte, le bloc
    // n'a plus de raison d'être et l'accueil retombe sur son titre seul.
    cafesAPI.search({ coup_de_coeur: "1" }, { limite: 10 })
      .then((reponse) => setUne(reponse.donnees.find((cafe) => cafe.verdict) ?? null))
      .catch(() => setUne(null))
      .finally(() => setUneChargement(false));

    // La colonne héro est la sélection de Wendy : quatre adresses à verdict
    // suffisent (trois affichées, une de marge si la une en fait partie).
    cafesAPI.search({ avec_verdict: "1" }, { limite: NB_DERNIERES })
      .then((reponse) => setAvecVerdict(reponse.donnees))
      .catch(() => setAvecVerdict([]))
      .finally(() => setVerdictsChargement(false));

    // Seul le total est utile ici (« voir les N adresses sur la carte »).
    cafesAPI.getAll({ limite: 1 })
      .then((reponse) => setTotalGuide(reponse.total))
      .catch(() => setTotalGuide(null));
  }, []);

  // Les filtres partent au serveur : l'accueil ne charge plus tout le guide
  // pour en afficher quatre, et le compte affiché est celui du guide entier.
  const filtresServeur = useMemo(() => {
    const filtres = { tri: "recent" };
    if (filtre === "travailler") filtres.travailler = "1";
    else if (filtre) filtres.specialite = filtre;
    if (ouvertSeulement) filtres.ouvert = "1";
    return filtres;
  }, [filtre, ouvertSeulement]);

  const recuperer = useCallback(
    ({ page }) => cafesAPI.search(filtresServeur, { page, limite: NB_DERNIERES }),
    [filtresServeur]
  );

  const { adresses: dernieres, total, chargement, erreur } = useListePaginee(recuperer, filtresServeur);

  const heroSecondaires = useMemo(
    () => avecVerdict.filter((cafe) => cafe.id !== une?.id).slice(0, 3),
    [avecVerdict, une]
  );

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <PhraseConcept total={totalGuide} />

        {/* Sur téléphone les pilules défilent sur une seule ligne : empilées
            sur trois rangs, elles repoussaient la une sous le pli. */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:gap-3 sm:overflow-visible sm:pb-0">
          {PILULES.map(({ id, label }) => (
            <button
              key={id || "tout"}
              type="button"
              onClick={() => setFiltre(id)}
              className={`${filtre === id ? "bouton" : "bouton-secondaire"} shrink-0 whitespace-nowrap`}
            >
              {label}
            </button>
          ))}

          <button
            type="button"
            aria-pressed={ouvertSeulement}
            onClick={() => setOuvertSeulement((v) => !v)}
            className={`${ouvertSeulement ? "bouton" : "bouton-secondaire"} shrink-0 gap-2 whitespace-nowrap`}
          >
            <span className="plaque-puce" aria-hidden="true" />
            ouvert maintenant
          </button>
        </div>

        <p className="mt-2 text-right text-meta font-bold text-gris" aria-live="polite">
          {chargement ? "on regarde…" : `${total} adresse${total > 1 ? "s" : ""}`}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-3 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <VerdictUne cafe={une} chargement={uneChargement} />

          <div className="grid grid-rows-3 gap-3.5">
            {verdictsChargement ? (
              Array.from({ length: 3 }, (_, i) => <div key={i} className="squelette h-28" />)
            ) : (
              heroSecondaires.map((cafe) => <AdresseCompacte key={cafe.id} cafe={cafe} />)
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <div className="flex flex-wrap items-baseline gap-4">
          <h2 className="text-section text-encre">les dernières adresses</h2>
          <Link to="/cafes" className="ml-auto flex items-center text-meta font-bold text-encre underline underline-offset-4">
            tout le guide →
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {chargement ? (
            Array.from({ length: 4 }, (_, i) => <div key={i} className="squelette h-96" />)
          ) : erreur ? (
            <p className="mesure text-corps text-encre">
              {erreur} le guide se recharge en rafraîchissant la page.
            </p>
          ) : dernieres.length === 0 ? (
            <p className="mesure text-corps text-encre">
              aucune adresse ne correspond à ce filtre pour l&apos;instant. en essayer un autre, ou tout paris.
            </p>
          ) : (
            dernieres.map((cafe) => <CafeCard key={cafe.id} cafe={cafe} />)
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-6 rounded-carte bg-plaque p-6 shadow-carte-vif sm:grid-cols-[220px_1fr_auto]">
          <div className="apercu-carte hidden h-40 rounded-doux sm:block">
            <span className="apercu-carte-point" style={{ left: "28%", top: "32%" }} />
            <span className="apercu-carte-point" style={{ left: "58%", top: "62%" }} />
            <span className="apercu-carte-point" style={{ left: "76%", top: "24%" }} />
          </div>

          <div>
            <p className="text-section text-carte">
              {totalGuide === null ? "voir toutes les adresses sur la carte" : `voir les ${totalGuide} adresses sur la carte`}
            </p>
            <p className="mt-1 text-corps font-bold text-plaque-attenue">
              pour retrouver une adresse une fois dans la rue
            </p>
          </div>

          <Link to="/map" className="bouton-accent">
            ouvrir la carte
          </Link>
        </div>
      </section>
    </div>
  );
}
