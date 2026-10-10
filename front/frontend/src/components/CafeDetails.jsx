import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cafesAPI, favorisAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useTitrePage, resumer } from "../hooks/useTitrePage";
import AvisSection from "./AvisSection";
import HorairesSemaine from "./HorairesSemaine";
import FichePratique from "./FichePratique";
import Coeur from "../icons/Coeur";
import Signet from "../icons/Signet";
import { classeCategorie } from "../utils/categories";

export default function CafeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { connecte } = useAuth();

  const [cafe, setCafe] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [favori, setFavori] = useState(false);
  const [favoriEnCours, setFavoriEnCours] = useState(false);

  useEffect(() => {
    setChargement(true);
    cafesAPI.getById(id)
      .then(setCafe)
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, [id]);

  useEffect(() => {
    if (!connecte || !id) return;
    favorisAPI.check(id)
      .then((d) => setFavori(d.isFavorite))
      .catch(() => setFavori(false));
  }, [id, connecte]);

  const basculerFavori = async () => {
    if (!connecte) { navigate("/login"); return; }
    setFavoriEnCours(true);
    try {
      if (favori) {
        await favorisAPI.remove(id);
        setFavori(false);
      } else {
        await favorisAPI.add(id);
        setFavori(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFavoriEnCours(false);
    }
  };

  // Le verdict d'abord : c'est lui qui donne envie, et c'est le produit.
  const titre = cafe
    ? `${cafe.nom}${cafe.arrondissement ? `, ${cafe.arrondissement}` : ""}`
    : erreur ? "Adresse introuvable" : undefined;
  useTitrePage(titre, cafe ? resumer(cafe.verdict || cafe.description) || undefined : undefined);

  if (chargement) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="squelette h-14 w-72" />
        <div className="squelette mt-6 aspect-[3/2] w-full" />
        <div className="squelette mt-8 h-24 w-full" />
      </div>
    );
  }

  if (erreur || !cafe) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="mesure text-corps text-encre">
          {erreur ?? "cette adresse n'existe pas."} elle a peut-être été retirée du guide.
        </p>
        <Link to="/cafes" className="bouton mt-6">
          parcourir le guide
        </Link>
      </div>
    );
  }

  const classe = classeCategorie(cafe.specialite?.split(",")[0]?.trim());

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        {/* En-tête : le geste fort de la fiche. */}
        <h1 className="plaque plaque-lg">
          {cafe.nom}
          {cafe.arrondissement && <span className="ml-3 text-meta text-plaque-attenue">{cafe.arrondissement}</span>}
        </h1>

        <button
          type="button"
          onClick={basculerFavori}
          disabled={favoriEnCours}
          aria-pressed={favori}
          aria-label={favori ? "retirer des favoris" : "ajouter aux favoris"}
          className="flex w-11 shrink-0 items-center justify-center text-gris disabled:opacity-50"
        >
          <Signet rempli={favori} taille={24} />
        </button>
      </div>

      <div className="mt-8 aspect-[3/2] overflow-hidden">
        {cafe.image_url ? (
          <img
            src={cafe.image_url}
            alt={`${cafe.nom}, ${cafe.adresse ?? cafe.arrondissement}`}
            className="h-full w-full object-cover"
            decoding="async"
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <p className={`image-repli ${classe ? `image-repli-${classe}` : ""}`}>{cafe.nom}</p>
        )}
      </div>

      {/* Le verdict passe avant tout le reste : c'est le produit. */}
      {cafe.verdict ? (
        <div className="mt-10">
          <p className="voix">
            {cafe.verdict}
            <span className="signature">— wendy</span>
          </p>
          {cafe.coup_de_coeur === 1 && (
            <p className="plaque mt-5">
              <span className="text-vert-accent"><Coeur rempli taille={14} /></span>
              coup de cœur
            </p>
          )}
        </div>
      ) : (
        cafe.coup_de_coeur === 1 && (
          <p className="plaque mt-10">
            <span className="text-vert-accent"><Coeur rempli taille={14} /></span>
            coup de cœur
          </p>
        )
      )}

      {cafe.description && (
        <p className="mesure mt-8 text-corps text-encre">{cafe.description}</p>
      )}

      <HorairesSemaine plages={cafe.horaires} />

      <FichePratique cafe={cafe} />

      {cafe.adresse && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.adresse)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bouton-secondaire mt-8"
        >
          ouvrir dans un plan
        </a>
      )}

      <div className="mt-12 border-t border-trait pt-10">
        <AvisSection cafeId={id} />
      </div>
    </article>
  );
}
