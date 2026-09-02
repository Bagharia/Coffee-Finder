import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CafeCard from "../components/CafeCard";
import { cafesAPI, LIMITE_MAX } from "../services/api";

const CATEGORY_CONFIG = {
  cafe:        { label: "Café",       icon: "☕", heroClass: "hero-coffee", accentColor: "rgba(146,64,14,0.08)" },
  Café:        { label: "Café",       icon: "☕", heroClass: "hero-coffee", accentColor: "rgba(146,64,14,0.08)" },
  matcha:      { label: "Matcha",     icon: "🍵", heroClass: "hero-matcha", accentColor: "rgba(90,122,74,0.10)" },
  Matcha:      { label: "Matcha",     icon: "🍵", heroClass: "hero-matcha", accentColor: "rgba(90,122,74,0.10)" },
  "bubble-tea":{ label: "Bubble Tea", icon: "🧋", heroClass: "hero-bbt",    accentColor: "rgba(139,92,246,0.08)" },
  "Bubble Tea":{ label: "Bubble Tea", icon: "🧋", heroClass: "hero-bbt",    accentColor: "rgba(139,92,246,0.08)" },
  bbt:         { label: "Bubble Tea", icon: "🧋", heroClass: "hero-bbt",    accentColor: "rgba(139,92,246,0.08)" },
  the:         { label: "Thé",        icon: "🫖", heroClass: "hero-tea",    accentColor: "rgba(180,83,9,0.08)" },
  Thé:         { label: "Thé",        icon: "🫖", heroClass: "hero-tea",    accentColor: "rgba(180,83,9,0.08)" },
  tea:         { label: "Thé",        icon: "🫖", heroClass: "hero-tea",    accentColor: "rgba(180,83,9,0.08)" },
};

const SPEC_MAP = {
  cafe: "Café", matcha: "Matcha", "bubble-tea": "Bubble Tea", bbt: "Bubble Tea",
  the: "Thé", tea: "Thé",
};

export default function CategoryPage() {
  const { category } = useParams();
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = CATEGORY_CONFIG[category] || {
    label: category,
    icon: "☕",
    heroClass: "hero-coffee",
    accentColor: "rgba(146,64,14,0.08)",
  };

  useEffect(() => {
    const specialite = SPEC_MAP[category] || category;
    setLoading(true);
    cafesAPI.getBySpecialite(specialite, { limite: LIMITE_MAX })
      .then((reponse) => setCafes(reponse.donnees))
      .catch((err) => { console.error(err); setError(err.message); })
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    if (!loading) {
      const els = document.querySelectorAll(".reveal");
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
          });
        },
        { threshold: 0.1 }
      );
      els.forEach((el) => io.observe(el));
      return () => io.disconnect();
    }
  }, [loading, cafes]);

  return (
    <div className="min-h-screen bg-(--bg-page)">
      {/* Themed hero banner */}
      <div className={`${config.heroClass} pt-28 pb-14 px-8 relative overflow-hidden`}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-6xl mb-3 anim-fade-up">{config.icon}</div>
          <h1 className="text-4xl md:text-5xl font-bold text-(--text-primary) mb-2 anim-fade-up tracking-tight"
            style={{ animationDelay: "0.1s" }}>
            {config.label}
          </h1>
          <p className="text-(--text-secondary) text-lg anim-fade-up" style={{ animationDelay: "0.2s" }}>
            {loading ? "Chargement..." : `${cafes.length} établissement${cafes.length > 1 ? "s" : ""} à Paris`}
          </p>
        </div>
      </div>

      {/* Card grid */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton h-64 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-red-500 py-20">{error}</p>
        ) : cafes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{config.icon}</div>
            <p className="text-(--text-secondary) text-xl">
              Aucun café trouvé dans la catégorie {config.label}
            </p>
            <a href="/cafes"
              className="inline-block mt-6 bg-(--accent) text-white px-8 py-3 rounded-xl font-semibold hover:bg-(--accent-light) transition-all btn-press">
              Voir tous les cafés
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {cafes.map((cafe, i) => (
              <div key={cafe.id} className={`reveal reveal-delay-${Math.min((i % 4) + 1, 4)}`}>
                <CafeCard cafe={cafe} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
