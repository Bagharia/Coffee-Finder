import { Link } from "react-router-dom";
import { useTitrePage } from "../hooks/useTitrePage";

/** Une URL que le guide ne connaît pas. */
export default function Introuvable() {
  useTitrePage("Page introuvable");
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-titre text-encre">page introuvable</h1>
      <p className="mesure mt-6 text-corps text-encre">
        cette adresse n&apos;existe pas dans le guide. le lien est peut-être
        ancien, ou mal recopié.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/cafes" className="bouton">parcourir le guide</Link>
        <Link to="/" className="bouton-secondaire">retour à l&apos;accueil</Link>
      </div>
    </div>
  );
}
