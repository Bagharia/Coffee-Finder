import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { favorisAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const FALLBACK = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800";

const BADGE_STYLES = {
  Matcha:       "bg-[rgba(90,122,74,0.12)] text-[#4A6B40] border border-[rgba(90,122,74,0.2)]",
  "Bubble Tea": "bg-[rgba(139,92,246,0.10)] text-[#7C3AED] border border-[rgba(139,92,246,0.2)]",
  Café:         "bg-[rgba(146,64,14,0.10)] text-[#92400E] border border-[rgba(146,64,14,0.2)]",
  Thé:          "bg-[rgba(180,83,9,0.10)] text-[#B45309] border border-[rgba(180,83,9,0.2)]",
};

function PriceDots({ prix }) {
  const map = { "1-10": 1, "10-20": 2, "20+": 3 };
  const count = map[prix] || 0;
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 3 }, (_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full inline-block ${i < count ? "bg-(--accent)" : "bg-[rgba(0,0,0,0.15)]"}`}
        />
      ))}
    </div>
  );
}

function isNew(created_at) {
  if (!created_at) return false;
  return (Date.now() - new Date(created_at).getTime()) < 30 * 24 * 60 * 60 * 1000;
}

function WorkScore({ cafe }) {
  const score = (cafe.wifi === 1 ? 1 : 0) + (cafe.prises === 1 ? 1 : 0) + (cafe.travailler === 1 ? 1 : 0);
  if (score === 0) return null;
  const colors = ["", "bg-yellow-400", "bg-orange-400", "bg-(--accent)"];
  const labels = ["", "Passable", "Bien", "Idéal"];
  return (
    <div className="flex items-center gap-1.5" title={`Score travail : ${labels[score]}`}>
      <span className="text-xs text-(--text-muted)">💼</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className={`w-2.5 h-2.5 rounded-sm ${i < score ? colors[score] : "bg-[rgba(0,0,0,0.1)]"}`} />
        ))}
      </div>
    </div>
  );
}

export default function CoffeeCard({ cafe, initialFavorite }) {
  const navigate = useNavigate();
  const { connecte: isAuth } = useAuth();
  const [isFav, setIsFav] = useState(initialFavorite ?? false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialFavorite !== undefined) return;
    if (!isAuth) return;
    favorisAPI.check(cafe.id).then(d => setIsFav(d.isFavorite)).catch(() => {});
  }, [cafe.id, isAuth, initialFavorite]);

  const toggleFav = async (e) => {
    e.stopPropagation();
    if (!isAuth) { navigate("/login"); return; }
    setLoading(true);
    try {
      if (isFav) {
        await favorisAPI.remove(cafe.id);
        setIsFav(false);
      } else {
        await favorisAPI.add(cafe.id);
        setIsFav(true);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div
      onClick={() => navigate(`/cafe/${cafe.id}`)}
      className="glass-card rounded-2xl overflow-hidden cursor-pointer group"
    >
      {/* Image */}
      <div className="relative overflow-hidden h-48">
        <img
          src={cafe.image_url || cafe.image || FALLBACK}
          alt={cafe.nom}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => { e.target.src = FALLBACK; }}
        />
        {cafe.prix && (
          <div className="absolute bottom-3 left-3 bg-white/90 rounded-full px-2.5 py-1 flex items-center gap-1.5">
            <PriceDots prix={cafe.prix} />
          </div>
        )}
        {(cafe.note_wendy || cafe.note) && (
          <div className="absolute top-3 right-3 bg-white/90 text-(--text-primary) text-xs px-2.5 py-1 rounded-full font-bold shadow-sm">
            ⭐ {cafe.note_wendy || cafe.note}
          </div>
        )}
        {isNew(cafe.created_at) && (
          <div className="absolute bottom-3 right-3 bg-(--accent) text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm">
            Nouveau
          </div>
        )}
        {/* Bouton favori */}
        <button
          onClick={toggleFav}
          disabled={loading}
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-colors ${isFav ? "fill-red-500 stroke-red-500" : "fill-none stroke-(--text-muted)"}`} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Card body */}
      <div className="p-5">
        <h2 className="font-semibold text-(--text-primary) text-base leading-tight">{cafe.nom}</h2>
        <p className="text-sm text-(--text-muted) mt-1 flex items-center gap-1">
          <span>📍</span> {cafe.arrondissement}
        </p>
        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="flex gap-2 flex-wrap">
            {cafe.specialite?.split(",").slice(0, 2).map((s, i) => (
              <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${BADGE_STYLES[s.trim()] || "bg-(--bg-section) text-(--text-secondary)"}`}>
                {s.trim()}
              </span>
            ))}
          </div>
          <WorkScore cafe={cafe} />
        </div>
      </div>
    </div>
  );
}
