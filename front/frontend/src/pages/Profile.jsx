import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CafeCard from "../components/CafeCard";
import ProfileMotDePasse from "../components/ProfileMotDePasse";
import { favorisAPI } from "../services/api";
import { useListePaginee } from "../hooks/useListePaginee";
import { useAuth } from "../hooks/useAuth";
import { useTitrePage } from "../hooks/useTitrePage";

const ONGLETS = [
  { id: "favoris", label: "mes favoris" },
  { id: "reglages", label: "réglages" }
];

const PAR_PAGE = 12;

export default function Profile() {
  useTitrePage("Mon compte");
  const navigate = useNavigate();
  const { utilisateur, chargement, connecte, deconnexion } = useAuth();
  const [onglet, setOnglet] = useState("favoris");
  const [erreurRetrait, setErreurRetrait] = useState(null);

  // Tant que le profil n'est pas revenu de l'API, on ne redirige pas :
  // sinon un rechargement de page éjecterait une session valable.
  useEffect(() => {
    if (!chargement && !connecte) navigate("/login");
  }, [chargement, connecte, navigate]);

  const recuperer = useCallback(
    ({ page }) => (connecte ? favorisAPI.getAll({ page, limite: PAR_PAGE }) : Promise.resolve({ donnees: [], total: 0 })),
    [connecte]
  );

  const {
    adresses: favoris, total, chargement: favorisChargement, chargementSuite,
    erreur: favorisErreur, encore, chargerPlus, recharger
  } = useListePaginee(recuperer, { connecte });

  const retirerFavori = async (cafeId) => {
    setErreurRetrait(null);
    try {
      await favorisAPI.remove(cafeId);
      recharger();
    } catch (err) {
      setErreurRetrait(err.message);
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
            {total} adresse{total === 1 ? "" : "s"} en favori
          </p>
        </div>
        <button type="button" onClick={seDeconnecter} className="flex items-center text-meta text-rouge underline underline-offset-4">
          se déconnecter
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
          {chargement || favorisChargement ? (
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
                parcourir le guide
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
                    retirer des favoris
                  </button>
                </li>
              ))}
            </ul>
          )}

          {erreurRetrait && <p className="mt-4 text-meta text-rouge">{erreurRetrait}</p>}

          {encore && (
            <div className="mt-10 flex flex-col items-center gap-2">
              <button type="button" onClick={chargerPlus} disabled={chargementSuite} className="bouton-secondaire">
                {chargementSuite ? "on charge…" : "voir la suite"}
              </button>
              <p className="text-meta text-gris" aria-live="polite">{favoris.length} sur {total}</p>
            </div>
          )}
        </div>
      )}

      {onglet === "reglages" && (
        <div className="mt-8 flex flex-col gap-10">
          <section>
            <h2 className="mb-4 text-meta text-gris">changer de mot de passe</h2>
            <ProfileMotDePasse />
          </section>

          <section>
            <h2 className="mb-4 text-meta text-gris">mes avis</h2>
            <p className="mesure text-corps text-encre">
              vos avis se retrouvent sur la fiche de chaque adresse, à l&apos;endroit où vous les avez écrits.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
