import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Carousel from "../components/Carousel";
import CafeCard from "../components/CafeCard";
import VerdictUne from "../components/VerdictUne";
import { cafesAPI, LIMITE_MAX } from "../services/api";

// La carte reste hors du chargement initial : Leaflet pèse plus que le reste du
// guide réuni, et l'aperçu est tout en bas de la page.
const Map = lazy(() => import("../components/Map"));

const CATEGORIES = [
  { label: "Café", href: "/category/Café" },
  { label: "Matcha", href: "/category/Matcha" },
  { label: "Bubble Tea", href: "/category/Bubble Tea" },
  { label: "Thé", href: "/category/Thé" }
];

export default function Home() {
  const navigate = useNavigate();
  const [cafes, setCafes] = useState([]);
  const [nouveautes, setNouveautes] = useState([]);
  const [une, setUne] = useState(null);
  const [uneChargement, setUneChargement] = useState(true);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [tirageEnCours, setTirageEnCours] = useState(false);

  useEffect(() => {
    cafesAPI.getAll({ limite: LIMITE_MAX })
      .then((reponse) => setCafes(reponse.donnees.slice(0, 8)))
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));

    cafesAPI.getNouveautes()
      .then((reponse) => setNouveautes(reponse.donnees.slice(0, 4)))
      .catch(() => setNouveautes([]));

    // Un coup de cœur pour la une. Il lui faut un verdict : sans texte, le bloc
    // n'a plus de raison d'être et l'accueil retombe sur son titre seul.
    cafesAPI.search({ coup_de_coeur: "1" }, { limite: 10 })
      .then((reponse) => setUne(reponse.donnees.find((cafe) => cafe.verdict) ?? null))
      .catch(() => setUne(null))
      .finally(() => setUneChargement(false));
  }, []);

  const tirerAuSort = async () => {
    setTirageEnCours(true);
    try {
      const cafe = await cafesAPI.getRandom();
      navigate(`/cafe/${cafe.id}`);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setTirageEnCours(false);
    }
  };

  return (
    <div className="bg-papier">
      {/* Le verdict ouvre la page. Le titre du site est déjà dans la barre :
          le répéter en grand ne dirait rien de plus, tandis qu'un avis donne à
          lire dès la première seconde. Aucune photo décorative — celle qui
          s'affiche est celle de l'adresse dont on parle. */}
      <section className="border-b border-trait px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-titre text-encre">Spotheplace</h1>
          <p className="chapo">
            Les Cafés, Salons De Thé Et Bubble Tea De Paris. Une Adresse, Un Verdict.
          </p>

          <div className="mt-12">
            <VerdictUne cafe={une} chargement={uneChargement} />
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link to="/cafes" className="bouton">
              Parcourir Le Guide
            </Link>
            <button
              type="button"
              onClick={tirerAuSort}
              disabled={tirageEnCours}
              className="bouton-secondaire"
            >
              {tirageEnCours ? "on cherche…" : "au hasard"}
            </button>
          </div>

          <nav className="mt-10">
            <h2 className="mb-3 text-meta text-gris">Spécialités</h2>
            <ul className="flex flex-wrap gap-x-6">
              {CATEGORIES.map(({ label, href }) => (
                <li key={href}>
                  <Link to={href} className="flex items-center text-encre underline underline-offset-4">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            </nav>
        </div>
      </section>

      <section className="border-b border-trait px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-section text-encre">Le Guide</h2>
            <Link to="/cafes" className="flex items-center text-meta text-gris underline underline-offset-4">
              Tout Voir
            </Link>
          </div>

          {chargement ? (
            // Squelette : la forme et la place exactes de ce qui arrive, pour
            // que la page ne saute pas quand les adresses tombent.
            <div className="flex gap-5 overflow-hidden">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="squelette h-96 w-80 shrink-0" />
              ))}
            </div>
          ) : erreur ? (
            <p className="mesure text-corps text-encre">
              {erreur} le guide se recharge en rafraîchissant la page.
            </p>
          ) : cafes.length === 0 ? (
            <p className="mesure text-corps text-encre">
              aucune adresse dans le guide pour l&apos;instant. la première arrive bientôt.
            </p>
          ) : (
            <Carousel cafes={cafes} />
          )}
        </div>
      </section>

      {nouveautes.length > 0 && (
        <section className="border-b border-trait px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-2 text-section text-encre">Arrivées Récentes</h2>
            <p className="mb-8 text-meta text-gris">Ajoutées Au Cours Des Trente Derniers Jours</p>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {nouveautes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-section text-encre">Sur Le Plan</h2>
            <Link to="/map" className="flex items-center text-meta text-gris underline underline-offset-4">
              Ouvrir La Carte
            </Link>
          </div>

          <div className="aspect-[4/3] border border-trait sm:aspect-[21/9]">
            <Suspense fallback={<div className="squelette h-full w-full" />}>
              <Map />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
