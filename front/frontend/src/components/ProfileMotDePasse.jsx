import { useState } from "react";
import { usersAPI } from "../services/api";

// Aligné sur ce qu'exige l'API : la refuser côté serveur après l'avoir acceptée
// côté front, c'est faire remplir un formulaire pour rien.
const MOT_DE_PASSE_MIN = 8;

const champ = "w-full rounded-carte border border-trait-fort bg-carte px-3 text-corps text-encre";

export default function ProfileMotDePasse() {
  const [valeurs, setValeurs] = useState({ actuel: "", nouveau: "", confirmation: "" });
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const modifier = (nom) => (e) => setValeurs((v) => ({ ...v, [nom]: e.target.value }));

  const envoyer = async (e) => {
    e.preventDefault();
    setErreur("");
    setSucces(false);

    if (valeurs.nouveau !== valeurs.confirmation) {
      setErreur("les deux mots de passe ne correspondent pas.");
      return;
    }
    if (valeurs.nouveau.length < MOT_DE_PASSE_MIN) {
      setErreur(`le nouveau mot de passe fait au moins ${MOT_DE_PASSE_MIN} caractères.`);
      return;
    }

    setEnCours(true);
    try {
      await usersAPI.changePassword({
        currentPassword: valeurs.actuel,
        newPassword: valeurs.nouveau
      });
      setSucces(true);
      setValeurs({ actuel: "", nouveau: "", confirmation: "" });
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <form onSubmit={envoyer} className="flex max-w-sm flex-col gap-3">
      <label>
        <span className="mb-2 block text-meta text-gris">mot de passe actuel</span>
        <input type="password" autoComplete="current-password" value={valeurs.actuel} onChange={modifier("actuel")} required className={champ} />
      </label>

      <label>
        <span className="mb-2 block text-meta text-gris">
          nouveau mot de passe, {MOT_DE_PASSE_MIN} caractères minimum
        </span>
        <input type="password" autoComplete="new-password" value={valeurs.nouveau} onChange={modifier("nouveau")} required className={champ} />
      </label>

      <label>
        <span className="mb-2 block text-meta text-gris">confirmation</span>
        <input type="password" autoComplete="new-password" value={valeurs.confirmation} onChange={modifier("confirmation")} required className={champ} />
      </label>

      {erreur && <p className="text-meta text-rouge">{erreur}</p>}
      {succes && <p className="text-meta text-encre">mot de passe modifié.</p>}

      <button type="submit" disabled={enCours} className="bouton mt-2">
        {enCours ? "modification…" : "modifier"}
      </button>
    </form>
  );
}
