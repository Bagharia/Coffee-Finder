export default function Footer() {
  const navLinks = [
    { label: "Accueil", href: "/" },
    { label: "Tous les cafés", href: "/cafes" },
    { label: "Matcha", href: "/category/Matcha" },
    { label: "Bubble Tea", href: "/category/Bubble Tea" },
    { label: "Carte", href: "/map" },
  ];

  return (
    <footer className="bg-(--bg-section) border-t border-(--border) pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">☕</span>
              <span className="text-xl font-bold text-(--text-primary)">SpotThePlace</span>
            </div>
            <p className="text-(--text-secondary) text-sm leading-relaxed">
              Votre guide des meilleurs cafés parisiens — matcha, bubble tea & café de spécialité.
            </p>
          </div>

          <div>
            <h3 className="text-(--accent) text-xs font-semibold uppercase tracking-widest mb-5">
              Navigation
            </h3>
            <ul className="space-y-3">
              {navLinks.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-(--text-secondary) hover:text-(--accent) transition-colors text-sm">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-(--accent) text-xs font-semibold uppercase tracking-widest mb-5">
              Paris, France
            </h3>
            <p className="text-(--text-secondary) text-sm leading-relaxed">
              Explorez les 20 arrondissements parisiens et découvrez des adresses uniques pour chaque envie.
            </p>
            <p className="text-(--text-muted) text-sm mt-4">
              🍵 Matcha · 🧋 Bubble Tea · ☕ Café
            </p>
          </div>
        </div>

        <div className="border-t border-(--border) pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-(--text-muted) text-sm">
            © {new Date().getFullYear()} SpotThePlace — Tous droits réservés
          </p>
          <p className="text-(--text-muted) text-sm">
            Fait avec ☕ à Paris
          </p>
        </div>
      </div>
    </footer>
  );
}
