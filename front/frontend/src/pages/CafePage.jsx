import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CafeCard from "../components/CafeCard";
import Filters from "../components/Filters";
import { cafesAPI } from "../services/api";

export default function CafePage() {
  const navigate = useNavigate();
  const [cafes, setCafes] = useState([]);
  const [filteredCafes, setFilteredCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [randomLoading, setRandomLoading] = useState(false);

  const goRandom = async () => {
    setRandomLoading(true);
    try {
      const cafe = await cafesAPI.getRandom();
      navigate(`/cafe/${cafe.id}`);
    } catch {}
    setRandomLoading(false);
  };

  useEffect(() => {
    cafesAPI.getAll()
      .then((data) => { setCafes(data); setFilteredCafes(data); })
      .catch((err) => { console.error(err); setError("Erreur lors du chargement des cafés"); })
      .finally(() => setLoading(false));
  }, []);

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
  }, [loading, filteredCafes]);

  const handleFilterChange = (filters) => {
    let filtered = [...cafes];
    if (filters.arrondissement) filtered = filtered.filter((c) => c.arrondissement === filters.arrondissement);
    if (filters.prix) filtered = filtered.filter((c) => c.prix === filters.prix);
    if (filters.ambiance) filtered = filtered.filter((c) => c.ambiance?.toLowerCase().includes(filters.ambiance.toLowerCase()));
    if (filters.wifi) filtered = filtered.filter((c) => c.wifi === 1);
    if (filters.prises) filtered = filtered.filter((c) => c.prises === 1);
    if (filters.travailler) filtered = filtered.filter((c) => c.travailler === 1);
    if (filters.nouveautes) filtered = filtered.filter((c) => {
      if (!c.created_at) return false;
      return (Date.now() - new Date(c.created_at).getTime()) < 30 * 24 * 60 * 60 * 1000;
    });
    setFilteredCafes(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--bg-page) pt-20">
        <div className="bg-(--bg-section) border-b border-(--border) px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="skeleton h-9 w-48 rounded-xl mb-3" />
            <div className="skeleton h-4 w-32 rounded-lg" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 9 }, (_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-(--bg-page) flex items-center justify-center">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bg-page) pt-16">
      <div className="bg-(--bg-section) border-b border-(--border) px-8 py-8">
        <div className="max-w-7xl mx-auto flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-(--text-primary) mb-1 tracking-tight">Tous les cafés</h1>
            <p className="text-(--text-secondary) text-sm">
              {filteredCafes.length} établissement{filteredCafes.length > 1 ? "s" : ""} à Paris
            </p>
          </div>
          <button
            onClick={goRandom}
            disabled={randomLoading}
            className="shrink-0 flex items-center gap-2 border border-(--border) bg-white text-(--text-primary) px-5 py-2.5 rounded-xl font-semibold text-sm hover:border-(--accent) hover:text-(--accent) transition-all btn-press disabled:opacity-60"
          >
            {randomLoading ? (
              <span className="w-4 h-4 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
            ) : "🎲"} Surprends-moi
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Filters onFilterChange={handleFilterChange} />
          </div>
          <div className="lg:col-span-3">
            {filteredCafes.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">☕</p>
                <p className="text-(--text-secondary) text-xl">Aucun café trouvé avec ces critères</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredCafes.map((cafe, i) => (
                  <div key={cafe.id} className={`reveal reveal-delay-${Math.min((i % 3) + 1, 4)}`}>
                    <CafeCard cafe={cafe} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
