import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Carousel from "../components/Carousel";
import CafeCard from "../components/CafeCard";
import { cafesAPI, LIMITE_MAX } from "../services/api";

// La carte reste hors du chargement initial : Leaflet pèse plus que le reste du
// guide réuni, et l'aperçu est tout en bas de la page.
const Map = lazy(() => import("../components/Map"));

const CATEGORIES = [
  { label: "café", href: "/category/Café" },
  { label: "matcha", href: "/category/Matcha" },
  { label: "bubble tea", href: "/category/Bubble Tea" },
  { label: "thé", href: "/category/Thé" }
];

export default function Home() {
  const navigate = useNavigate();
  const [cafes, setCafes] = useState([]);
  const [nouveautes, setNouveautes] = useState([]);
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
      {/* Le titre porte la page. Pas de photo de fond : une image d'agence sans
          rapport avec les adresses ne dit rien et coûte deux secondes en 4G. */}
      <section className="border-b border-trait px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-titre text-encre">spotheplace</h1>
          <p className="mesure mt-6 text-corps text-gris">
            les cafés, salons de thé et bubble tea de paris. une adresse, un verdict.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/cafes" className="flex items-center bg-plaque px-6 text-white">
              parcourir le guide
            </Link>
            <button
              type="button"
              onClick={tirerAuSort}
              disabled={tirageEnCours}
              className="flex items-center border border-trait-fort px-6 text-encre disabled:opacity-60"
            >
              {tirageEnCours ? "on cherche…" : "au hasard"}
            </button>
          </div>

          <nav className="mt-10">
            <h2 className="mb-3 text-meta text-gris">spécialités</h2>
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
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-section text-encre">le guide</h2>
            <Link to="/cafes" className="flex items-center text-meta text-gris underline underline-offset-4">
              tout voir
            </Link>
          </div>

          {chargement ? (
            // Squelette : la forme et la place exactes de ce qui arrive, pour
            // que la page ne saute pas quand les adresses tombent.
            <div className="flex gap-5 overflow-hidden">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="squelette h-72 w-64 shrink-0" />
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
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-2 text-section text-encre">arrivées récentes</h2>
            <p className="mb-8 text-meta text-gris">ajoutées au cours des trente derniers jours</p>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {nouveautes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-section text-encre">sur le plan</h2>
            <Link to="/map" className="flex items-center text-meta text-gris underline underline-offset-4">
              ouvrir la carte
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
