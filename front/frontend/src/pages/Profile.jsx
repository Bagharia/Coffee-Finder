import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CafeCard from "../components/CafeCard";
import { favorisAPI, usersAPI, LIMITE_MAX } from "../services/api";
import { useAuth } from "../hooks/useAuth";

function Stars({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} viewBox="0 0 24 24" className="w-4 h-4" fill={value >= s ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { utilisateur, chargement, connecte, deconnexion } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("favorites");

  useEffect(() => {
    // Tant que le profil n'est pas revenu de l'API, on ne redirige pas :
    // sinon un rechargement de page éjecterait une session valable.
    if (chargement) return;
    if (!connecte) { navigate("/login"); return; }

    favorisAPI.getAll({ limite: LIMITE_MAX })
      .then(reponse => setFavorites(reponse.donnees))
      .catch(() => setFavorites([]))
      .finally(() => setFavLoading(false));
  }, [chargement, connecte, navigate]);

  const removeFav = async (cafeId) => {
    try {
      await favorisAPI.remove(cafeId);
      setFavorites(prev => prev.filter(c => c.id !== cafeId));
    } catch {}
  };

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(""); setPwSuccess(false);
    if (pwForm.next !== pwForm.confirm) { setPwError("Les mots de passe ne correspondent pas"); return; }
    if (pwForm.next.length < 8) { setPwError("Au moins 8 caractères requis"); return; }
    setPwLoading(true);
    try {
      await usersAPI.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwSuccess(true);
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Voulez-vous vraiment vous déconnecter ?")) return;
    await deconnexion();
    navigate("/");
  };

  // Le profil vient de l'API : le front ne peut plus lire le jeton, et il y
  // trouvait de toute façon l'email au lieu du nom, que le JWT ne portait pas.
  const username = utilisateur?.username || utilisateur?.email || "Utilisateur";
  const isAdmin = utilisateur?.role === 'admin';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6B8F5E&color=fff&size=128`;

  const tabs = [
    { id: "favorites", label: "Mes Favoris", icon: "❤️" },
    { id: "avis", label: "Mes Avis", icon: "⭐" },
    { id: "settings", label: "Paramètres", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-(--bg-page) pt-20 px-4 pb-16">
      <div className="max-w-5xl mx-auto">

        {/* Header profil */}
        <div className="bg-white border border-(--border) rounded-2xl p-6 mb-6 flex items-center gap-6">
          <img src={avatarUrl} alt={username} className="w-20 h-20 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-(--text-primary)">{username}</h1>
              {isAdmin && (
                <span className="text-xs bg-(--accent) text-white px-2.5 py-1 rounded-full font-semibold">Admin</span>
              )}
            </div>
            <p className="text-(--text-muted) text-sm">{favorites.length} café{favorites.length !== 1 ? "s" : ""} en favori</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-(--text-muted) hover:text-red-500 transition-colors font-medium"
          >
            Se déconnecter
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-(--border)">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-(--accent) text-(--accent)"
                  : "border-transparent text-(--text-muted) hover:text-(--text-primary)"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Favoris */}
        {activeTab === "favorites" && (
          <div>
            {favLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}
              </div>
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map(cafe => (
                  <div key={cafe.id} className="relative group/card">
                    <CafeCard cafe={cafe} initialFavorite={true} />
                    <button
                      onClick={() => removeFav(cafe.id)}
                      className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-red-50 transition-all z-10"
                      title="Retirer des favoris"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-red-500 stroke-red-500" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">☕</div>
                <p className="text-(--text-secondary) text-lg mb-6">Pas encore de favoris</p>
                <button onClick={() => navigate("/cafes")}
                  className="bg-(--accent) text-white px-6 py-3 rounded-xl font-semibold hover:bg-(--accent-light) transition-all btn-press">
                  Découvrir des cafés
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mes Avis */}
        {activeTab === "avis" && (
          <div className="bg-white border border-(--border) rounded-2xl p-6">
            <p className="text-(--text-muted) text-sm text-center py-10">
              Retrouvez vos avis directement sur la page de chaque café.
              <br /><br />
              <a href="/cafes" className="text-(--accent) font-semibold hover:underline">Parcourir les cafés →</a>
            </p>
          </div>
        )}

        {/* Paramètres */}
        {activeTab === "settings" && (
          <div className="bg-white border border-(--border) rounded-2xl p-6 space-y-6">

            {/* Changer le mot de passe */}
            <div className="border-b border-(--border) pb-6">
              <h3 className="font-semibold text-(--text-primary) mb-4">Changer le mot de passe</h3>
              <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
                <input
                  type="password"
                  placeholder="Mot de passe actuel"
                  value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                  className="input-form w-full px-4 py-2.5 rounded-xl outline-none text-sm"
                  required
                />
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={pwForm.next}
                  onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                  className="input-form w-full px-4 py-2.5 rounded-xl outline-none text-sm"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirmer le nouveau mot de passe"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  className="input-form w-full px-4 py-2.5 rounded-xl outline-none text-sm"
                  required
                />
                {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
                {pwSuccess && <p className="text-(--accent) text-sm font-medium">Mot de passe modifié !</p>}
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="bg-(--accent) text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-(--accent-light) transition-all disabled:opacity-60 btn-press"
                >
                  {pwLoading ? "Modification..." : "Modifier"}
                </button>
              </form>
            </div>

            {/* Session */}
            <div className="border-b border-(--border) pb-6">
              <h3 className="font-semibold text-(--text-primary) mb-3">Session</h3>
              <button
                onClick={handleLogout}
                className="bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-xl font-medium hover:bg-red-100 transition-all text-sm"
              >
                Se déconnecter
              </button>
            </div>
            {isAdmin && (
              <div>
                <h3 className="font-semibold text-(--text-primary) mb-3">Administration</h3>
                <button onClick={() => navigate("/admin")}
                  className="bg-(--accent) text-white px-5 py-2.5 rounded-xl font-medium hover:bg-(--accent-light) transition-all text-sm">
                  Accéder au panel admin
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
