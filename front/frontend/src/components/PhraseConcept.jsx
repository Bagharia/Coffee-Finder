// Chemin de la photo de Wendy, une fois fournie (un fichier dans `public/`).
// Tant qu'il est vide, le rond reste un aplat : mieux qu'une image cassée.
const PHOTO_WENDY = null;

/**
 * La phrase qui dit ce qu'est le site et qui écrit (maquette « Accueil final »
 * du 2026-10-10). Sans elle, rien sur l'accueil ne l'expliquait.
 *
 * Le nombre vient du guide, il n'est jamais écrit en dur : une phrase qui
 * annonce 42 adresses quand il y en a 576 ment dès le lendemain.
 */
export default function PhraseConcept({ total }) {
  const debut =
    total > 1 ? `${total} adresses testées une par une`
    : total === 1 ? "une adresse testée"
    : "des adresses testées une par une";

  return (
    <div className="flex items-center gap-3">
      {PHOTO_WENDY ? (
        <img src={PHOTO_WENDY} alt="wendy" width="44" height="44" className="portrait-wendy object-cover" />
      ) : (
        <span className="portrait-wendy" aria-hidden="true" />
      )}
      <p className="text-corps font-semibold leading-snug text-encre">
        {debut} par wendy. un avis franc, pas une note.
      </p>
    </div>
  );
}
