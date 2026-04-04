import { useNavigate } from "react-router-dom";

const FALLBACK = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800";

const BADGE_STYLES = {
  Matcha:       "bg-[rgba(90,122,74,0.12)] text-[#4A6B40]",
  "Bubble Tea": "bg-[rgba(139,92,246,0.10)] text-[#7C3AED]",
  Café:         "bg-[rgba(146,64,14,0.10)] text-[#92400E]",
  Thé:          "bg-[rgba(180,83,9,0.10)] text-[#B45309]",
};

export default function Carousel({ cafes }) {
  const doubled = [...cafes, ...cafes];
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden w-full py-4 carousel-track">
      <div className="flex gap-5 animate-scroll-infinite w-max">
        {doubled.map((cafe, index) => (
          <div
            key={index}
            onClick={() => navigate(`/cafe/${cafe.id}`)}
            className="min-w-[260px] bg-white border border-(--border) rounded-2xl overflow-hidden shrink-0 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div className="overflow-hidden h-40">
              <img
                src={cafe.image_url || FALLBACK}
                alt={cafe.nom}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => { e.target.src = FALLBACK; }}
              />
            </div>
            <div className="p-4">
              <h2 className="font-semibold text-(--text-primary) text-base leading-tight">{cafe.nom}</h2>
              <p className="text-xs text-(--text-muted) mt-1">📍 {cafe.arrondissement}</p>
              <div className="flex gap-1.5 mt-2.5 flex-wrap">
                {cafe.specialite?.split(",").slice(0, 2).map((s, j) => (
                  <span
                    key={j}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      BADGE_STYLES[s.trim()] || "bg-(--bg-section) text-(--text-secondary)"
                    }`}
                  >
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
