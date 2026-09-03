import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CafeCard from "../components/CafeCard";
import ProfileMotDePasse from "../components/ProfileMotDePasse";
import { favorisAPI, LIMITE_MAX } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const ONGLETS = [
  { id: "favoris", label: "Mes Favoris" },
  { id: "reglages", label: "Réglages" }
];

export default function Profile() {
  const navigate = useNavigate();
  const { utilisateur, chargement, connecte, deconnexion } = useAuth();

  const [favoris, setFavoris] = useState([]);
  const [favorisChargement, setFavorisChargement] = useState(true);
  const [favorisErreur, setFavorisErreur] = useState(null);
  const [onglet, setOnglet] = useState("favoris");


  useEffect(() => {
    // Tant que le profil n'est pas revenu de l'API, on ne redirige pas :
    // sinon un rechargement de page éjecterait une session valable.
    if (chargement) return;
    if (!connecte) { navigate("/login"); return; }

    favorisAPI.getAll({ limite: LIMITE_MAX })
      .then((reponse) => setFavoris(reponse.donnees))
      .catch((err) => setFavorisErreur(err.message))
      .finally(() => setFavorisChargement(false));
  }, [chargement, connecte, navigate]);

  const retirerFavori = async (cafeId) => {
    try {
      await favorisAPI.remove(cafeId);
      setFavoris((liste) => liste.filter((cafe) => cafe.id !== cafeId));
    } catch (err) {
      setFavorisErreur(err.message);
    }
  };

  const seDeconnecter = async () => {
    if (!window.confirm("se déconnecter ?")) return;
    await deconnexion();
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-trait pb-6">
        <div>
          <h1 className="text-titre text-encre">{utilisateur?.username ?? "Mon compte"}</h1>
          <p className="chapo">
            {favoris.length} adresse{favoris.length === 1 ? "" : "s"} en favori
          </p>
        </div>
        <button type="button" onClick={seDeconnecter} className="flex items-center text-meta text-rouge underline underline-offset-4">
          Se Déconnecter
        </button>
      </div>

      <div className="mt-6 flex gap-6 border-b border-trait">
        {ONGLETS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={onglet === id}
            onClick={() => setOnglet(id)}
            className={`-mb-px flex items-center border-b-2 px-1 text-meta ${
              onglet === id ? "border-plaque text-encre" : "border-transparent text-gris"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {onglet === "favoris" && (
        <div className="mt-8">
          {favorisChargement ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => <div key={i} className="squelette h-72" />)}
            </div>
          ) : favorisErreur ? (
            <p className="mesure text-corps text-encre">
              {favorisErreur} vos favoris reviennent en rafraîchissant la page.
            </p>
          ) : favoris.length === 0 ? (
            <div className="mesure">
              <p className="text-corps text-encre">
                aucune adresse en favori pour l&apos;instant. le cœur sur une fiche la garde ici.
              </p>
              <Link to="/cafes" className="bouton mt-6">
                Parcourir Le Guide
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {favoris.map((cafe, index) => (
                <li key={cafe.id} className="flex flex-col gap-2">
                  <CafeCard cafe={cafe} initialFavorite prioritaire={index < 3} />
                  <button
                    type="button"
                    onClick={() => retirerFavori(cafe.id)}
                    className="flex items-center self-start text-meta text-gris underline underline-offset-4"
                  >
                    Retirer Des Favoris
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {onglet === "reglages" && (
        <div className="mt-8 flex flex-col gap-10">
          <section>
            <h2 className="mb-4 text-meta text-gris">Changer de mot de passe</h2>
            <ProfileMotDePasse />
          </section>

          <section>
            <h2 className="mb-4 text-meta text-gris">Mes avis</h2>
            <p className="mesure text-corps text-encre">
              vos avis se retrouvent sur la fiche de chaque adresse, à l&apos;endroit où vous les avez écrits.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
