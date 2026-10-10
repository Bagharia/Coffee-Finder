import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTitrePage } from "../hooks/useTitrePage";

// Aligné sur ce qu'exige l'API : la refuser côté serveur après l'avoir acceptée
// côté front, c'est faire remplir un formulaire pour rien.
const MOT_DE_PASSE_MIN = 8;

export default function Register() {
  useTitrePage("Créer un compte");
  const navigate = useNavigate();
  const { inscription } = useAuth();
  const [champs, setChamps] = useState({ username: "", email: "", password: "", confirmation: "" });
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  const changer = (e) => setChamps({ ...champs, [e.target.name]: e.target.value });

  const envoyer = async (e) => {
    e.preventDefault();
    setErreur("");

    if (!champs.username || !champs.email || !champs.password) {
      setErreur("tous les champs sont nécessaires.");
      return;
    }
    if (champs.password !== champs.confirmation) {
      setErreur("les deux mots de passe ne correspondent pas.");
      return;
    }
    if (champs.password.length < MOT_DE_PASSE_MIN) {
      setErreur(`le mot de passe fait au moins ${MOT_DE_PASSE_MIN} caractères.`);
      return;
    }

    setEnCours(true);
    try {
      await inscription({
        username: champs.username,
        email: champs.email,
        password: champs.password
      });
      navigate("/");
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-titre text-encre">créer un compte</h1>
      <p className="chapo">pour garder vos adresses et donner votre avis.</p>

      {erreur && <p className="mt-6 text-meta text-rouge">{erreur}</p>}

      <form onSubmit={envoyer} className="mt-8 flex flex-col gap-4">
        <label>
          <span className="mb-2 block text-meta text-gris">nom d&apos;utilisateur</span>
          <input
            type="text"
            name="username"
            value={champs.username}
            onChange={changer}
            autoComplete="username"
            required
            className="w-full border border-trait-fort rounded-carte bg-carte px-3 text-corps text-encre"
          />
        </label>

        <label>
          <span className="mb-2 block text-meta text-gris">email</span>
          <input
            type="email"
            name="email"
            value={champs.email}
            onChange={changer}
            autoComplete="email"
            required
            className="w-full border border-trait-fort rounded-carte bg-carte px-3 text-corps text-encre"
          />
        </label>

        <label>
          <span className="mb-2 block text-meta text-gris">
            mot de passe, {MOT_DE_PASSE_MIN} caractères minimum
          </span>
          <input
            type="password"
            name="password"
            value={champs.password}
            onChange={changer}
            autoComplete="new-password"
            required
            className="w-full border border-trait-fort rounded-carte bg-carte px-3 text-corps text-encre"
          />
        </label>

        <label>
          <span className="mb-2 block text-meta text-gris">confirmation</span>
          <input
            type="password"
            name="confirmation"
            value={champs.confirmation}
            onChange={changer}
            autoComplete="new-password"
            required
            className="w-full border border-trait-fort rounded-carte bg-carte px-3 text-corps text-encre"
          />
        </label>

        <button type="submit" disabled={enCours} className="bouton mt-2">
          {enCours ? "création…" : "créer mon compte"}
        </button>
      </form>

      <p className="mt-8 text-meta text-gris">
        déjà un compte ?{" "}
        <Link to="/login" className="underline underline-offset-4">se connecter</Link>
      </p>
    </div>
  );
}
