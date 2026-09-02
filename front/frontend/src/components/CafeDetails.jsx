import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cafesAPI, favorisAPI, usersAPI } from "../services/api";
import AvisSection from "./AvisSection";

const FALLBACK = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800";

const BADGE_STYLES = {
  Matcha:       "bg-[rgba(90,122,74,0.12)] text-[#4A6B40] border border-[rgba(90,122,74,0.2)]",
  "Bubble Tea": "bg-[rgba(139,92,246,0.10)] text-[#7C3AED] border border-[rgba(139,92,246,0.2)]",
  Café:         "bg-[rgba(146,64,14,0.10)] text-[#92400E] border border-[rgba(146,64,14,0.2)]",
  Thé:          "bg-[rgba(180,83,9,0.10)] text-[#B45309] border border-[rgba(180,83,9,0.2)]",
};

function InfoPanel({ label, value, icon }) {
  if (!value) return null;
  return (
    <div className="bg-white border border-(--border) rounded-2xl p-5">
      <p className="text-xs text-(--text-muted) uppercase tracking-wider mb-2">{label}</p>
      <p className="text-(--text-primary) font-semibold text-base flex items-center gap-2">
        {icon && <span>{icon}</span>} {value}
      </p>
    </div>
  );
}

export default function CafeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const isAuth = usersAPI.isAuthenticated();

  useEffect(() => {
    cafesAPI.getById(id)
      .then(setCafe)
      .catch((err) => { console.error(err); setError(err.message); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isAuth || !id) return;
    favorisAPI.check(id).then(d => setIsFav(d.isFavorite)).catch(() => {});
  }, [id, isAuth]);

  const toggleFav = async () => {
    if (!isAuth) { navigate("/login"); return; }
    setFavLoading(true);
    try {
      if (isFav) { await favorisAPI.remove(id); setIsFav(false); }
      else { await favorisAPI.add(id); setIsFav(true); }
    } catch {}
    setFavLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--bg-page) pt-16">
        <div className="skeleton h-[50vh] w-full" />
        <div className="max-w-4xl mx-auto px-8 py-10 space-y-4">
          <div className="skeleton h-10 w-64 rounded-xl" />
          <div className="skeleton h-5 w-40 rounded-lg" />
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !cafe) {
    return (
      <div className="min-h-screen bg-(--bg-page) flex items-center justify-center">
        <div className="text-center">
          <p className="text-(--text-secondary) text-lg mb-6">{error || "Café non trouvé"}</p>
          <button onClick={() => navigate("/")}
            className="bg-(--accent) text-white px-8 py-3 rounded-xl font-semibold hover:bg-(--accent-light) transition-all btn-press">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bg-page) pt-16">
      {/* Hero image */}
      <div className="relative h-[50vh] overflow-hidden">
        <img src={cafe.image_url || FALLBACK} alt={cafe.nom}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = FALLBACK; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="absolute top-6 left-6 bg-white/90 rounded-full px-4 py-2 text-(--text-primary) flex items-center gap-2 hover:bg-white transition-all text-sm font-medium shadow-sm">
          ← Retour
        </button>

        {/* Favori button */}
        <button
          onClick={toggleFav}
          disabled={favLoading}
          className="absolute top-6 left-32 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all hover:scale-110"
          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-colors ${isFav ? "fill-red-500 stroke-red-500" : "fill-none stroke-(--text-muted)"}`} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Note badge */}
        {cafe.note && (
          <div className="absolute top-6 right-6 bg-white/90 text-(--text-primary) text-sm px-3 py-1.5 rounded-full font-bold shadow-sm">
            ⭐ {cafe.note}
          </div>
        )}

        {/* Title overlaid at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-lg">{cafe.nom}</h1>
            <p className="text-white/80 flex items-center gap-2 text-sm drop-shadow">
              📍 {cafe.adresse}{cafe.arrondissement ? ` — ${cafe.arrondissement}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Info content */}
      <div className="max-w-4xl mx-auto px-8 py-10 pb-20">
        {/* Specialty tags */}
        {cafe.specialite && (
          <div className="flex flex-wrap gap-2 mb-8">
            {cafe.specialite.split(",").map((s, i) => (
              <span key={i} className={`px-4 py-1.5 rounded-full text-sm font-medium ${BADGE_STYLES[s.trim()] || "bg-(--bg-section) text-(--text-secondary) border border-(--border)"}`}>
                {s.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {cafe.description && (
          <div className="bg-white border border-(--border) rounded-2xl p-6 mb-8">
            <p className="text-xs text-(--text-muted) uppercase tracking-wider font-semibold mb-3">À propos</p>
            <p className="text-(--text-secondary) leading-relaxed">{cafe.description}</p>
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <InfoPanel label="Prix" value={cafe.prix ? `${cafe.prix} €` : null} icon="💰" />
          <InfoPanel label="Horaires" value={cafe.horaires} icon="🕐" />
          <InfoPanel label="Capacité" value={cafe.nb_personnes ? `${cafe.nb_personnes} personnes` : null} icon="👥" />
        </div>

        {/* Theme & ambiance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <InfoPanel label="Thème" value={cafe.theme} icon="🎨" />
          <InfoPanel label="Ambiance" value={cafe.ambiance} icon="✨" />
        </div>

        {/* Equipment */}
        {(cafe.wifi === 1 || cafe.prises === 1 || cafe.travailler === 1) && (
          <div className="bg-white border border-(--border) rounded-2xl p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs text-(--text-muted) uppercase tracking-wider font-semibold">
                Équipements & Services
              </h3>
              {/* Score travail */}
              {(() => {
                const score = (cafe.wifi === 1 ? 1 : 0) + (cafe.prises === 1 ? 1 : 0) + (cafe.travailler === 1 ? 1 : 0);
                const colors = ["", "bg-yellow-400", "bg-orange-400", "bg-(--accent)"];
                const labels = ["", "Passable pour travailler", "Bien pour travailler", "Idéal pour travailler"];
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-(--text-muted) font-medium">{labels[score]}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: 3 }, (_, i) => (
                        <span key={i} className={`w-3 h-3 rounded-sm ${i < score ? colors[score] : "bg-[rgba(0,0,0,0.08)]"}`} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="flex flex-wrap gap-3">
              {cafe.wifi === 1 && (
                <div className="flex items-center gap-2 bg-(--bg-section) px-4 py-2 rounded-xl">
                  <span>📶</span>
                  <span className="text-(--text-primary) font-medium text-sm">WiFi gratuit</span>
                </div>
              )}
              {cafe.prises === 1 && (
                <div className="flex items-center gap-2 bg-(--bg-section) px-4 py-2 rounded-xl">
                  <span>🔌</span>
                  <span className="text-(--text-primary) font-medium text-sm">Prises électriques</span>
                </div>
              )}
              {cafe.travailler === 1 && (
                <div className="flex items-center gap-2 bg-(--bg-section) px-4 py-2 rounded-xl">
                  <span>💼</span>
                  <span className="text-(--text-primary) font-medium text-sm">Idéal pour travailler</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Avis */}
        <div className="border-t border-(--border) pt-8 mt-8">
          <AvisSection cafeId={id} />
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button onClick={() => navigate("/")}
            className="flex-1 bg-(--accent) text-white py-3.5 rounded-xl font-semibold text-base hover:bg-(--accent-light) transition-all duration-200 btn-press">
            Retour à l'accueil
          </button>
          <button
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.adresse || cafe.nom)}`, "_blank")}
            className="border border-(--border) bg-white px-8 py-3.5 rounded-xl font-semibold text-(--text-primary) hover:border-(--accent) hover:text-(--accent) transition-all">
            Voir sur Maps 🗺️
          </button>
        </div>
      </div>
    </div>
  );
}
