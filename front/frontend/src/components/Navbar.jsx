import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usersAPI, cafesAPI } from "../services/api";

function getIsAdmin() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allCafes, setAllCafes] = useState([]);
  const searchRef = useRef(null);
  const timeoutRef = useRef(null);
  const isAuthenticated = usersAPI.isAuthenticated();
  const isAdmin = getIsAdmin();

  // Charger tous les cafés une fois pour la recherche
  useEffect(() => {
    cafesAPI.getAll().then(setAllCafes).catch(() => {});
  }, []);

  // Filtrage local en temps réel
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      allCafes.filter(c =>
        c.nom?.toLowerCase().includes(q) ||
        c.arrondissement?.toLowerCase().includes(q) ||
        c.specialite?.toLowerCase().includes(q) ||
        c.adresse?.toLowerCase().includes(q)
      ).slice(0, 6)
    );
  }, [searchQuery, allCafes]);


  const goToCafe = (id) => {
    setSearchOpen(false);
    navigate(`/cafe/${id}`);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setShowDropdown(false), 300);
  };

  const categories = [
    { label: "Tous les cafés", href: "/cafes", icon: "🗂️" },
    { label: "Café", href: "/category/Café", icon: "☕" },
    { label: "Matcha", href: "/category/Matcha", icon: "🍵" },
    { label: "Bubble Tea", href: "/category/Bubble Tea", icon: "🧋" },
    { label: "Thé", href: "/category/Thé", icon: "🫖" },
  ];

  return (
    <>
      <nav
        className={`w-full h-16 fixed top-0 z-50 flex items-center px-8 justify-between border-b transition-all duration-300 ${
          scrolled ? "navbar-solid" : "navbar-transparent"
        }`}
      >
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <span className="text-2xl transition-transform duration-300 group-hover:rotate-12 inline-block">
            ☕
          </span>
          <span className="font-bold text-lg tracking-wide text-(--text-primary)">
            SpotThePlace
          </span>
        </a>

        {/* Desktop navigation */}
        <div className="hidden md:flex gap-8 items-center">
          <a
            href="/"
            className="nav-underline text-(--text-secondary) hover:text-(--text-primary) transition-colors duration-200 font-medium text-sm"
          >
            Accueil
          </a>

          {/* Dropdown Cafés */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button className="nav-underline text-(--text-secondary) hover:text-(--text-primary) transition-colors duration-200 font-medium flex items-center gap-1 cursor-pointer text-sm">
              Cafés
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 mt-3 w-52 bg-white border border-(--border) rounded-xl py-2 z-50 shadow-lg anim-fade-in">
                {categories.map((cat) => (
                  <a
                    key={cat.href}
                    href={cat.href}
                    className="flex items-center gap-3 px-4 py-2.5 text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-section) transition-colors duration-150 font-medium text-sm"
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <a
            href="/map"
            className="nav-underline text-(--text-secondary) hover:text-(--text-primary) transition-colors duration-200 font-medium text-sm"
          >
            Carte
          </a>
          {isAdmin && (
            <a
              href="/admin"
              className="nav-underline text-(--text-muted) hover:text-(--text-secondary) transition-colors duration-200 font-medium text-xs"
            >
              Admin
            </a>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="hidden md:block relative" ref={searchRef}>
            <div className="flex items-center gap-2 bg-(--bg-section) border border-(--border) rounded-xl px-3 py-1.5 w-44 focus-within:border-(--accent) focus-within:w-60 transition-all duration-300">
              <svg className="w-3.5 h-3.5 text-(--text-muted) shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setSearchQuery(""); setSearchResults([]); }
                  if (e.key === "Enter" && searchResults.length > 0) goToCafe(searchResults[0].id);
                }}
                placeholder="Rechercher..."
                className="bg-transparent outline-none text-(--text-primary) text-sm placeholder:text-(--text-muted) w-full"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="text-(--text-muted) hover:text-(--text-primary) transition-colors shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-(--border) rounded-xl shadow-lg overflow-hidden z-50">
                {searchResults.length > 0 ? searchResults.map((cafe) => (
                  <button
                    key={cafe.id}
                    onClick={() => { goToCafe(cafe.id); setSearchQuery(""); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-(--bg-section) transition-colors text-left group"
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-(--bg-section)">
                      <img src={cafe.image_url || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=80"} alt={cafe.nom} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-(--text-primary) text-sm truncate group-hover:text-(--accent) transition-colors">{cafe.nom}</p>
                      <p className="text-(--text-muted) text-xs truncate">{cafe.arrondissement}{cafe.specialite ? ` · ${cafe.specialite.split(",")[0].trim()}` : ""}</p>
                    </div>
                  </button>
                )) : (
                  <div className="px-4 py-6 text-center text-(--text-muted) text-sm">Aucun résultat pour "{searchQuery}"</div>
                )}
              </div>
            )}
          </div>
            {isAuthenticated ? (
            <a
              href="/profile"
              className="w-9 h-9 rounded-full border border-(--border) flex items-center justify-center hover:border-(--accent) transition-all duration-200 bg-white"
            >
              <svg viewBox="0 0 32 32" className="w-5 h-5 fill-(--text-secondary)">
                <path d="M16,16A7,7,0,1,0,9,9,7,7,0,0,0,16,16ZM16,4a5,5,0,1,1-5,5A5,5,0,0,1,16,4Z" />
                <path d="M17,18H15A11,11,0,0,0,4,29a1,1,0,0,0,1,1H27a1,1,0,0,0,1-1A11,11,0,0,0,17,18ZM6.06,28A9,9,0,0,1,15,20h2a9,9,0,0,1,8.94,8Z" />
              </svg>
            </a>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <a
                href="/login"
                className="text-(--text-secondary) hover:text-(--text-primary) transition-colors duration-200 font-medium text-sm px-4 py-2"
              >
                Connexion
              </a>
              <a
                href="/register"
                className="bg-(--accent) text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-(--accent-light) transition-all duration-200 btn-press"
              >
                S'inscrire
              </a>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <span
              className={`block w-5 h-0.5 bg-(--text-primary) transition-all duration-300 ${
                mobileOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-(--text-primary) transition-all duration-300 ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-(--text-primary) transition-all duration-300 ${
                mobileOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-72 bg-(--bg-page) border-l border-(--border) p-8 slide-in-right flex flex-col gap-6 pt-20">
            <a href="/" onClick={() => setMobileOpen(false)} className="text-(--text-primary) text-xl font-semibold hover:text-(--accent) transition-colors">
              Accueil
            </a>
            <div className="border-t border-(--border) pt-4">
              <p className="text-(--text-muted) text-xs font-semibold uppercase tracking-widest mb-4">Spécialités</p>
              {categories.map((cat) => (
                <a
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 py-2.5 text-(--text-secondary) hover:text-(--accent) transition-colors font-medium"
                >
                  <span>{cat.icon}</span> {cat.label}
                </a>
              ))}
            </div>
            <a href="/map" onClick={() => setMobileOpen(false)} className="text-(--text-primary) text-xl font-semibold hover:text-(--accent) transition-colors">
              Carte
            </a>
            {isAdmin && (
              <a href="/admin" onClick={() => setMobileOpen(false)} className="text-(--text-muted) text-sm font-medium hover:text-(--accent) transition-colors">
                Admin
              </a>
            )}
            <div className="mt-auto flex flex-col gap-3">
              {isAuthenticated ? (
                <a href="/profile" onClick={() => setMobileOpen(false)}
                  className="w-full text-center border border-(--border) text-(--text-secondary) py-3 rounded-lg hover:border-(--accent) hover:text-(--accent) transition-all font-medium">
                  Mon profil
                </a>
              ) : (
                <>
                  <a href="/login" onClick={() => setMobileOpen(false)}
                    className="w-full text-center border border-(--border) text-(--text-secondary) py-3 rounded-lg hover:border-(--accent) hover:text-(--accent) transition-all font-medium">
                    Connexion
                  </a>
                  <a href="/register" onClick={() => setMobileOpen(false)}
                    className="w-full text-center bg-(--accent) text-white py-3 rounded-lg font-semibold hover:bg-(--accent-light) transition-all">
                    S'inscrire
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
