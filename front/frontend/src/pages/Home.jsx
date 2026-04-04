import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Carousel from "../components/Carousel";
import CafeCard from "../components/CafeCard";
import Map from "../components/Map";
import { cafesAPI } from "../services/api";

const HERO_IMG = "https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=2532&auto=format&fit=crop";

const CATEGORIES = [
  { icon: "☕", label: "Café",       sub: "Spécialités du monde entier", href: "/category/Café",       delay: 1 },
  { icon: "🍵", label: "Matcha",     sub: "Zen japonais à Paris",        href: "/category/Matcha",     delay: 2 },
  { icon: "🧋", label: "Bubble Tea", sub: "Saveurs asiatiques",          href: "/category/Bubble Tea", delay: 3 },
  { icon: "🫖", label: "Thé",        sub: "Collection de thés rares",    href: "/category/Thé",        delay: 4 },
];

const FEATURES = [
  { icon: "📶", title: "WiFi & Prises",       desc: "Filtrez les cafés équipés pour travailler confortablement toute la journée.", delay: 1 },
  { icon: "🎨", title: "Ambiance curatée",     desc: "Classique, Japonais, Minimaliste — trouvez l'atmosphère qui vous correspond.", delay: 2 },
  { icon: "📍", title: "Paris arrondissement", desc: "Localisez le café parfait dans votre quartier parmi les 20 arrondissements.", delay: 3 },
];

export default function Home() {
  const navigate = useNavigate();
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nouveautes, setNouveautes] = useState([]);
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
      .then((data) => setCafes(data.slice(0, 8)))
      .catch(console.error)
      .finally(() => setLoading(false));
    cafesAPI.getNouveautes()
      .then((data) => setNouveautes(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [cafes]);

  return (
    <div className="bg-(--bg-page)">

      {/* HERO — fullscreen style Rural Architecture */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">

        {/* Photo fond plein écran */}
        <img
          src={HERO_IMG}
          alt="Café parisien"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay gradient — plus sombre en bas pour lisibilité du texte */}
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-black/10" />

        {/* Navbar zone — espace pour la navbar fixe */}

        {/* Texte haut gauche — catégorie */}
        <div className="absolute top-24 left-8 md:left-14 anim-fade-up">
          <p className="text-white/70 text-xs font-semibold tracking-[0.25em] uppercase">
            Paris · Cafés · Spécialités
          </p>
        </div>

        {/* Texte bas gauche — titre principal */}
        <div className="absolute bottom-0 left-0 right-0 px-8 md:px-14 pb-10 md:pb-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">

            {/* Gauche — nom + description */}
            <div>
              <p className="text-white/60 text-sm mb-3 anim-fade-up" style={{ animationDelay: "0.05s" }}>
                Matcha · Bubble Tea · Café de spécialité
              </p>
              <h1
                className="text-[clamp(3rem,10vw,8rem)] font-black leading-none text-white tracking-tight anim-fade-up"
                style={{ animationDelay: "0.1s" }}
              >
                SpotThePlace
              </h1>
              <p className="text-white/70 text-base mt-3 max-w-md anim-fade-up" style={{ animationDelay: "0.18s" }}>
                Des adresses soigneusement sélectionnées<br className="hidden md:block" /> pour chaque envie à Paris.
              </p>

              {/* Pills catégories */}
              <div className="flex flex-wrap gap-2 mt-5 anim-fade-up" style={{ animationDelay: "0.24s" }}>
                {[
                  { label: "☕ Café",       href: "/category/Café" },
                  { label: "🍵 Matcha",     href: "/category/Matcha" },
                  { label: "🧋 Bubble Tea", href: "/category/Bubble Tea" },
                  { label: "🫖 Thé",        href: "/category/Thé" },
                ].map((tag) => (
                  <a key={tag.label} href={tag.href}
                    className="text-xs text-white/80 border border-white/30 px-3.5 py-1.5 rounded-full hover:bg-white/20 hover:border-white/60 transition-all backdrop-blur-sm">
                    {tag.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Droite — CTA */}
            <div className="flex flex-col gap-3 items-start md:items-end shrink-0 anim-fade-up" style={{ animationDelay: "0.2s" }}>
              <a href="/cafes"
                className="flex items-center gap-3 bg-white text-(--text-primary) px-7 py-4 rounded-xl font-semibold text-sm hover:bg-(--accent) hover:text-white transition-all duration-200 btn-press shadow-lg group">
                Explorer les cafés
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <button
                onClick={goRandom}
                disabled={randomLoading}
                className="flex items-center gap-2 border border-white/40 text-white px-7 py-4 rounded-xl font-semibold text-sm hover:bg-white/15 transition-all duration-200 btn-press backdrop-blur-sm disabled:opacity-60"
              >
                {randomLoading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <span>🎲</span>
                }
                Surprends-moi
              </button>
            </div>
          </div>
        </div>

        {/* Indicateur scroll */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1.5 animate-bounce">
          <span className="text-white/40 text-xs tracking-widest uppercase">Scroll</span>
          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* SPECIALTY SHOWCASE */}
      <section className="py-24 px-6 bg-(--bg-section)">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-(--text-primary) mb-3 reveal tracking-tight">
              Nos spécialités
            </h2>
            <p className="text-(--text-secondary) text-lg reveal reveal-delay-1">
              Chaque lieu, une expérience unique
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <a key={cat.label} href={cat.href}
                className={`group bg-white border border-(--border) rounded-2xl p-6 text-center cursor-pointer reveal reveal-delay-${cat.delay} transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-(--accent)`}>
                <span className="text-4xl mb-3 block transition-transform duration-300 group-hover:scale-110">
                  {cat.icon}
                </span>
                <h3 className="text-base font-bold text-(--text-primary) mb-1">{cat.label}</h3>
                <p className="text-xs text-(--text-secondary)">{cat.sub}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CAFÉS DU MOMENT */}
      <section className="py-20 bg-(--bg-page)">
        <div className="mb-8 px-8 md:px-12 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-(--text-primary) reveal tracking-tight">Cafés du moment</h2>
            <p className="text-(--text-secondary) mt-1 text-sm reveal reveal-delay-1">
              Découvrez nos coups de cœur parisiens
            </p>
          </div>
          <a href="/cafes"
            className="hidden md:block text-(--accent) hover:text-(--accent-light) transition-colors font-medium text-sm">
            Voir tout →
          </a>
        </div>

        {loading ? (
          <div className="flex gap-5 px-8 overflow-hidden">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="min-w-[260px] h-60 skeleton rounded-2xl shrink-0" />
            ))}
          </div>
        ) : (
          <Carousel cafes={cafes} />
        )}

        <div className="mt-6 px-8 md:hidden">
          <a href="/cafes"
            className="block w-full text-center border border-(--border) text-(--text-secondary) py-3 rounded-xl hover:border-(--accent) hover:text-(--accent) transition-all font-medium text-sm bg-white">
            Voir tous les cafés →
          </a>
        </div>
      </section>

      {/* NOUVEAUTÉS */}
      {nouveautes.length > 0 && (
        <section className="py-20 px-6 bg-(--bg-page)">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-(--accent) text-white text-xs font-semibold px-3 py-1 rounded-full reveal">Nouveaux</span>
                </div>
                <h2 className="text-3xl font-bold text-(--text-primary) reveal tracking-tight">Arrivées récentes</h2>
                <p className="text-(--text-secondary) mt-1 text-sm reveal reveal-delay-1">Ajoutés au cours des 30 derniers jours</p>
              </div>
              <a href="/cafes" className="hidden md:block text-(--accent) hover:text-(--accent-light) transition-colors font-medium text-sm">
                Voir tout →
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {nouveautes.map((cafe, i) => (
                <div key={cafe.id} className={`reveal reveal-delay-${i + 1}`}>
                  <CafeCard cafe={cafe} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CARTE */}
      <section className="py-24 px-6 bg-(--bg-section)">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-(--text-primary) mb-2 reveal tracking-tight">
                Trouvez un café près de vous
              </h2>
              <p className="text-(--text-secondary) text-lg reveal reveal-delay-1">
                100+ adresses géolocalisées dans Paris
              </p>
            </div>
            <a href="/map"
              className="reveal reveal-delay-2 shrink-0 bg-(--accent) text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-(--accent-light) transition-all duration-200 btn-press shadow-sm self-start md:self-auto">
              Ouvrir la carte complète →
            </a>
          </div>
          <div className="reveal rounded-2xl overflow-hidden border border-(--border) shadow-sm" style={{ height: "420px" }}>
            <Map />
          </div>
        </div>
      </section>

      {/* POURQUOI SPOTTHEPLACE */}
      <section className="py-24 px-6 bg-(--bg-section)">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-(--text-primary) mb-3 reveal tracking-tight">
            Pourquoi SpotThePlace ?
          </h2>
          <p className="text-(--text-secondary) text-lg mb-14 reveal reveal-delay-1">
            Tout ce qu&apos;il vous faut pour trouver l&apos;adresse parfaite
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title}
                className={`bg-white border border-(--border) rounded-2xl p-7 text-center reveal reveal-delay-${f.delay}`}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-base font-bold text-(--text-primary) mb-2">{f.title}</h3>
                <p className="text-(--text-secondary) leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 reveal reveal-delay-2">
            <a href="/cafes"
              className="inline-block bg-(--accent) text-white px-10 py-4 rounded-xl font-semibold text-base hover:bg-(--accent-light) transition-all duration-200 btn-press shadow-sm">
              Trouver mon café
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
