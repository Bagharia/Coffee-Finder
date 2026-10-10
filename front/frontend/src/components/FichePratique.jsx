const PRIX = {
  "1-10": "1–10 €",
  "10-20": "10–20 €",
  "20+": "20 € et plus"
};

/** Informations pratiques : un tableau serré, pas des cartes à pictogrammes. */
export default function FichePratique({ cafe }) {
  const equipements = [
    cafe.wifi === 1 && "wifi",
    cafe.prises === 1 && "prises",
    cafe.travailler === 1 && "pour travailler"
  ].filter(Boolean);

  const lignes = [
    ["adresse", cafe.adresse],
    ["arrondissement", cafe.arrondissement],
    ["prix", cafe.prix ? (PRIX[cafe.prix] ?? cafe.prix) : null],
    ["capacité", cafe.nb_personnes ? `${cafe.nb_personnes} personnes` : null],
    ["spécialité", cafe.specialite?.split(",").map((s) => s.trim().toLowerCase()).join(", ")],
    ["thème", cafe.theme?.toLowerCase()],
    ["ambiance", cafe.ambiance?.toLowerCase()],
    ["équipements", equipements.length > 0 ? equipements.join(", ") : null]
  ].filter(([, valeur]) => Boolean(valeur));

  if (lignes.length === 0) return null;

  return (
    <dl className="mt-10 border-t border-trait">
      {lignes.map(([intitule, valeur]) => (
        <div key={intitule} className="flex gap-6 border-b border-trait py-2.5">
          <dt className="w-36 shrink-0 text-meta text-gris">{intitule}</dt>
          <dd className="text-meta text-encre">{valeur}</dd>
        </div>
      ))}
    </dl>
  );
}
