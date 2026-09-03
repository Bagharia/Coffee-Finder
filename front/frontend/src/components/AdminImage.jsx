import { useRef, useState } from "react";
import { cafesAPI } from "../services/api";

const FORMATS = "image/jpeg,image/png,image/webp,image/avif";

/**
 * Photo d'une adresse : téléverser un fichier, ou coller l'adresse d'une image
 * hébergée ailleurs.
 *
 * Le téléversement n'est possible qu'en modification : il vise une fiche par
 * son identifiant, qui n'existe pas encore au moment de la création. Sur une
 * nouvelle adresse, seul le champ URL est proposé — la photo se téléverse au
 * second passage.
 *
 * Une adresse sans photo n'est pas un défaut : la DA en fait le cas normal et
 * `.image-repli` occupe la place. Rien n'est obligatoire ici.
 */
export default function AdminImage({ cafeId, nom, imageUrl, onChangeUrl, onTeleverse }) {
  const champFichier = useRef(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  const televerser = async (fichier) => {
    if (!fichier) return;

    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await cafesAPI.televerserImage(cafeId, fichier);
      onTeleverse(reponse.image_url);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
      // Sans ça, renvoyer le même fichier après une erreur ne déclencherait
      // aucun événement : le champ n'aurait pas changé de valeur.
      if (champFichier.current) champFichier.current.value = "";
    }
  };

  const retirer = async () => {
    setEnCours(true);
    setErreur(null);
    try {
      await cafesAPI.supprimerImage(cafeId);
      onTeleverse("");
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <fieldset>
      <legend className="mb-2 text-meta text-gris">Photo</legend>

      {imageUrl && (
        <div className="mb-3 flex items-start gap-4">
          <img
            src={imageUrl}
            alt={nom ? `photo actuelle de ${nom}` : "photo actuelle de l'adresse"}
            loading="lazy"
            className="h-24 w-32 shrink-0 rounded-carte border border-trait object-cover"
          />
          {cafeId && (
            <button
              type="button"
              onClick={retirer}
              disabled={enCours}
              className="flex min-h-11 items-center text-meta text-rouge underline underline-offset-4 disabled:opacity-50"
            >
              Retirer La Photo
            </button>
          )}
        </div>
      )}

      {cafeId ? (
        <label className="flex flex-col gap-2">
          <span className="text-meta text-gris">
            Téléverser Un Fichier — JPEG, PNG, WebP Ou AVIF, 5 Mo Au Maximum
          </span>
          <input
            ref={champFichier}
            type="file"
            accept={FORMATS}
            disabled={enCours}
            onChange={(e) => televerser(e.target.files?.[0])}
            className="text-corps text-encre file:mr-3 file:border file:border-trait-fort file:bg-carte file:px-3 file:py-1 file:text-meta file:text-encre"
          />
        </label>
      ) : (
        <p className="text-meta text-gris">
          le téléversement sera possible une fois l&apos;adresse enregistrée.
        </p>
      )}

      <label className="mt-3 block">
        <span className="mb-2 block text-meta text-gris">
          ou adresse d&apos;une image hébergée ailleurs, 500 caractères maximum
        </span>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => onChangeUrl(e.target.value)}
          className="w-full border border-trait-fort rounded-carte bg-carte px-3 text-corps text-encre"
        />
      </label>

      {enCours && <p className="mt-2 text-meta text-gris">Envoi En Cours…</p>}
      {erreur && <p className="mt-2 text-meta text-rouge">{erreur}</p>}
    </fieldset>
  );
}
