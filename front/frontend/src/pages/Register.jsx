import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersAPI } from "../services/api";

const IMG = "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=2069&auto=format&fit=crop";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.username || !formData.email || !formData.password) { setError("Tous les champs sont requis"); return; }
    if (formData.password !== formData.confirmPassword) { setError("Les mots de passe ne correspondent pas"); return; }
    if (formData.password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères"); return; }
    try {
      setLoading(true);
      const response = await usersAPI.register({ username: formData.username, email: formData.email, password: formData.password });
      usersAPI.saveToken(response.token);
      navigate("/");
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-(--bg-page)">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={IMG} alt="Coffee shop" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-14 pb-16">
          <p className="text-white/70 text-sm font-semibold tracking-widest uppercase mb-4">SpotThePlace</p>
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Rejoignez la<br />communauté parisienne
          </h2>
          <p className="text-white/60 text-base leading-relaxed">
            Sauvegardez vos cafés favoris,<br />partagez vos découvertes
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10 text-center">
            <span className="text-4xl">☕</span>
            <p className="text-(--accent) font-semibold mt-2">SpotThePlace</p>
          </div>
          <h2 className="text-2xl font-bold text-(--text-primary) mb-1 tracking-tight">Créer un compte</h2>
          <p className="text-(--text-secondary) mb-8 text-sm">Rejoignez-nous et découvrez Paris autrement</p>
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">Nom d'utilisateur</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange}
                placeholder="votre_pseudo" className="input-dark" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="votre@email.com" className="input-dark" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">Mot de passe</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                placeholder="••••••••" className="input-dark" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">Confirmer le mot de passe</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                placeholder="••••••••" className="input-dark" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-(--accent) text-white py-3 rounded-xl font-semibold text-sm hover:bg-(--accent-light) transition-all duration-200 btn-press mt-2 disabled:opacity-50">
              {loading ? "Inscription..." : "S'inscrire"}
            </button>
          </form>
          <p className="text-center text-(--text-muted) mt-6 text-sm">
            Déjà un compte ?{" "}
            <a href="/login" className="text-(--accent) hover:text-(--accent-light) transition-colors font-medium">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
