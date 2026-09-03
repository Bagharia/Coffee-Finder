import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CafeCard from "../components/CafeCard";
import { cafesAPI, LIMITE_MAX } from "../services/api";

// L'URL peut arriver sous plusieurs formes selon d'où l'on vient.
// La spécialité stockée en base, elle, est unique.
const SPECIALITES = {
  cafe: "Café",
  "Café": "Café",
  matcha: "Matcha",
  "Matcha": "Matcha",
  "bubble-tea": "Bubble Tea",
  "Bubble Tea": "Bubble Tea",
  bbt: "Bubble Tea",
  the: "Thé",
  tea: "Thé",
  "Thé": "Thé"
};

export default function CategoryPage() {
  const { category } = useParams();
  const specialite = SPECIALITES[category] ?? category;

  // On retient la spécialité à laquelle appartient la réponse : tant qu'elle ne
  // correspond pas à celle de l'URL, l'écran est en chargement. Évite de poser
  // un état en plein corps d'effet à chaque changement de catégorie.
  const [reponse, setReponse] = useState({ specialite: null, cafes: [], erreur: null });
  const chargement = reponse.specialite !== specialite;
  const { cafes, erreur } = reponse;

  useEffect(() => {
    let obsolete = false;

    cafesAPI.getBySpecialite(specialite, { limite: LIMITE_MAX })
      .then((res) => {
        if (!obsolete) setReponse({ specialite, cafes: res.donnees, erreur: null });
      })
      .catch((err) => {
        if (!obsolete) setReponse({ specialite, cafes: [], erreur: err.message });
      });

    // Une réponse qui arrive après un changement de catégorie ne doit pas
    // écraser la nouvelle.
    return () => { obsolete = true; };
  }, [specialite]);

  return (
    <div className="bg-papier">
      <div className="border-b border-trait px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-section text-encre">{specialite.toLowerCase()}</h1>
          <p className="mt-1 text-meta text-gris">
            {chargement
              ? "on regarde…"
              : `${cafes.length} adresse${cafes.length > 1 ? "s" : ""} à paris`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {chargement ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="squelette h-72" />)}
          </div>
        ) : erreur ? (
          <p className="mesure text-corps text-encre">
            {erreur} la liste revient en rafraîchissant la page.
          </p>
        ) : cafes.length === 0 ? (
          <div className="mesure">
            <p className="text-corps text-encre">
              aucune adresse en {specialite.toLowerCase()} dans le guide pour l&apos;instant.
            </p>
            <Link to="/cafes" className="mt-6 inline-flex items-center bg-plaque px-6 text-white">
              parcourir tout le guide
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cafes.map((cafe, index) => (
              <li key={cafe.id}>
                <CafeCard cafe={cafe} prioritaire={index < 4} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
