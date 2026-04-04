import { useState } from "react";

const EMPTY_FILTERS = {
  arrondissement: "",
  wifi: "",
  prix: "",
  ambiance: "",
  travailler: "",
  prises: "",
  nouveautes: "",
};

export default function Filters({ onFilterChange }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const handleChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    onFilterChange(EMPTY_FILTERS);
  };

  const selectClass = "w-full input-dark text-sm appearance-none";

  const checkboxItems = [
    { key: "nouveautes", label: "Nouveautés",          icon: "✨" },
    { key: "wifi",       label: "WiFi disponible",     icon: "📶" },
    { key: "prises",     label: "Prises électriques",  icon: "🔌" },
    { key: "travailler", label: "Bon pour travailler", icon: "💼" },
  ];

  return (
    <div className="bg-white border border-(--border) rounded-2xl p-5 sticky top-24">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-base font-bold text-(--text-primary)">Filtres</h2>
        <button
          onClick={resetFilters}
          className="text-xs text-(--text-muted) hover:text-(--accent) transition-colors border border-(--border) hover:border-(--accent) px-3 py-1 rounded-full"
        >
          Réinitialiser
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-(--text-muted) uppercase tracking-wider mb-2">
            Arrondissement
          </label>
          <select
            value={filters.arrondissement}
            onChange={(e) => handleChange("arrondissement", e.target.value)}
            className={selectClass}
          >
            <option value="">Tous</option>
            {Array.from({ length: 20 }, (_, i) => {
              const n = i + 1;
              const label = n === 1 ? "1er" : `${n}e`;
              return <option key={label} value={label}>{label}</option>;
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-(--text-muted) uppercase tracking-wider mb-2">
            Prix
          </label>
          <select
            value={filters.prix}
            onChange={(e) => handleChange("prix", e.target.value)}
            className={selectClass}
          >
            <option value="">Tous</option>
            <option value="1-10">1–10 €</option>
            <option value="10-20">10–20 €</option>
            <option value="20+">20 €+</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-(--text-muted) uppercase tracking-wider mb-2">
            Ambiance
          </label>
          <select
            value={filters.ambiance}
            onChange={(e) => handleChange("ambiance", e.target.value)}
            className={selectClass}
          >
            <option value="">Toutes</option>
            <option value="sombre">Sombre</option>
            <option value="soft">Soft</option>
            <option value="lumineux">Lumineux</option>
            <option value="calme">Calme</option>
            <option value="animée">Animée</option>
          </select>
        </div>

        <div className="space-y-3 pt-3 border-t border-(--border)">
          <p className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">Équipements</p>
          {checkboxItems.map((item) => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
              <button
                type="button"
                onClick={() => handleChange(item.key, filters[item.key] ? "" : "1")}
                className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all shrink-0 ${
                  filters[item.key]
                    ? "bg-(--accent) border-(--accent)"
                    : "border-(--border) group-hover:border-(--accent)"
                }`}
              >
                {filters[item.key] && (
                  <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-(--text-secondary) group-hover:text-(--text-primary) transition-colors">
                {item.icon} {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
