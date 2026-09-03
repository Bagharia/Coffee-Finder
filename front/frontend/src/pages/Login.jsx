import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { connexion } = useAuth();
  const [champs, setChamps] = useState({ email: "", password: "" });
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  const changer = (e) => setChamps({ ...champs, [e.target.name]: e.target.value });

  const envoyer = async (e) => {
    e.preventDefault();
    setErreur("");

    if (!champs.email || !champs.password) {
      setErreur("email et mot de passe sont nécessaires.");
      return;
    }

    setEnCours(true);
    try {
      await connexion({ email: champs.email, password: champs.password });
      navigate("/");
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-titre text-encre">Connexion</h1>
      <p className="chapo">Pour Retrouver Vos Favoris Et Vos Avis.</p>

      {erreur && <p className="mt-6 text-meta text-rouge">{erreur}</p>}

      <form onSubmit={envoyer} className="mt-8 flex flex-col gap-4">
        <label>
          <span className="mb-2 block text-meta text-gris">Email</span>
          <input
            type="email"
            name="email"
            value={champs.email}
            onChange={changer}
            autoComplete="email"
            required
            className="w-full border border-trait rounded-carte bg-carte px-3 text-corps text-encre"
          />
        </label>

        <label>
          <span className="mb-2 block text-meta text-gris">Mot De Passe</span>
          <input
            type="password"
            name="password"
            value={champs.password}
            onChange={changer}
            autoComplete="current-password"
            required
            className="w-full border border-trait rounded-carte bg-carte px-3 text-corps text-encre"
          />
        </label>

        <button type="submit" disabled={enCours} className="bouton mt-2">
          {enCours ? "connexion…" : "se connecter"}
        </button>
      </form>

      <p className="mt-8 text-meta text-gris">
        pas encore de compte ?{" "}
        <Link to="/register" className="underline underline-offset-4">s&apos;inscrire</Link>
      </p>
    </div>
  );
}
