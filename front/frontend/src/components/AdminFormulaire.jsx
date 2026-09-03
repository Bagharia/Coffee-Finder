import AdminHoraires from "./AdminHoraires";
import AdminImage from "./AdminImage";

const SPECIALITES = ["Café", "Matcha", "Bubble Tea", "Thé"];

const PRIX = [
  ["1-10", "1–10 €"],
  ["10-20", "10–20 €"],
  ["20+", "20 € et plus"]
];

const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => (i === 0 ? "1er" : `${i + 1}e`));

const EQUIPEMENTS = [
  ["wifi", "wifi"],
  ["prises", "prises"],
  ["travailler", "pour travailler"]
];

const champ = "w-full border border-trait bg-carte px-3 text-corps text-encre";

/** Formulaire d'ajout et de modification d'une adresse. */
export default function AdminFormulaire({ valeurs, onChange, onEnvoyer, onAnnuler, enCours, erreur, modification, cafeId, onImageTeleversee }) {
  const modifier = (nom, valeur) => onChange({ ...valeurs, [nom]: valeur });

  const basculerSpecialite = (specialite) => {
    const actuelles = valeurs.specialite;
    modifier(
      "specialite",
      actuelles.includes(specialite)
        ? actuelles.filter((s) => s !== specialite)
        : [...actuelles, specialite]
    );
  };

  return (
    <form onSubmit={onEnvoyer} className="flex flex-col gap-5 border border-trait bg-carte p-6">
      <h2 className="text-section text-encre">
        {modification ? "modifier l'adresse" : "ajouter une adresse"}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-meta text-gris">nom</span>
          <input required value={valeurs.nom} onChange={(e) => modifier("nom", e.target.value)} className={champ} />
        </label>

        <label>
          <span className="mb-2 block text-meta text-gris">arrondissement</span>
          <select required value={valeurs.arrondissement} onChange={(e) => modifier("arrondissement", e.target.value)} className={champ}>
            <option value="">à choisir</option>
            {ARRONDISSEMENTS.map((arr) => <option key={arr} value={arr}>{arr}</option>)}
          </select>
        </label>
      </div>

      <label>
        <span className="mb-2 block text-meta text-gris">adresse, géocodée automatiquement</span>
        <input value={valeurs.adresse} onChange={(e) => modifier("adresse", e.target.value)} className={champ} />
      </label>

      <AdminImage
        cafeId={cafeId}
        imageUrl={valeurs.image_url}
        onChangeUrl={(url) => modifier("image_url", url)}
        onTeleverse={(url) => { modifier("image_url", url); onImageTeleversee?.(); }}
      />


      {/* Le verdict est le produit : c'est ce que la fiche affiche en premier. */}
      <label>
        <span className="mb-2 block text-meta text-gris">le verdict</span>
        <textarea
          rows={4}
          value={valeurs.verdict}
          onChange={(e) => modifier("verdict", e.target.value)}
          className={champ}
        />
      </label>

      <label className="flex min-h-11 items-center gap-3 text-corps text-encre">
        <input
          type="checkbox"
          checked={valeurs.coup_de_coeur === 1}
          onChange={(e) => modifier("coup_de_coeur", e.target.checked ? 1 : 0)}
          className="h-4 w-4 accent-plaque"
        />
        coup de cœur
      </label>

      <label>
        <span className="mb-2 block text-meta text-gris">description</span>
        <textarea rows={3} value={valeurs.description} onChange={(e) => modifier("description", e.target.value)} className={champ} />
      </label>

      <fieldset>
        <legend className="mb-2 text-meta text-gris">spécialités</legend>
        <div className="flex flex-wrap gap-2">
          {SPECIALITES.map((specialite) => (
            <button
              key={specialite}
              type="button"
              aria-pressed={valeurs.specialite.includes(specialite)}
              onClick={() => basculerSpecialite(specialite)}
              className={`flex items-center px-4 text-meta ${
                valeurs.specialite.includes(specialite) ? "bg-plaque text-white" : "border border-trait text-encre"
              }`}
            >
              {specialite.toLowerCase()}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-meta text-gris">prix</span>
          <select value={valeurs.prix} onChange={(e) => modifier("prix", e.target.value)} className={champ}>
            {PRIX.map(([valeur, libelle]) => <option key={valeur} value={valeur}>{libelle}</option>)}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-meta text-gris">capacité</span>
          <input value={valeurs.nb_personnes} onChange={(e) => modifier("nb_personnes", e.target.value)} className={champ} />
        </label>

        <label>
          <span className="mb-2 block text-meta text-gris">thème</span>
          <input value={valeurs.theme} onChange={(e) => modifier("theme", e.target.value)} className={champ} />
        </label>

        <label>
          <span className="mb-2 block text-meta text-gris">ambiance</span>
          <input value={valeurs.ambiance} onChange={(e) => modifier("ambiance", e.target.value)} className={champ} />
        </label>
      </div>

      <AdminHoraires plages={valeurs.horaires} onChange={(plages) => modifier("horaires", plages)} />

      <fieldset>
        <legend className="mb-2 text-meta text-gris">équipements</legend>
        <div className="flex flex-col">
          {EQUIPEMENTS.map(([nom, libelle]) => (
            <label key={nom} className="flex min-h-11 items-center gap-3 text-corps text-encre">
              <input
                type="checkbox"
                checked={valeurs[nom] === 1}
                onChange={(e) => modifier(nom, e.target.checked ? 1 : 0)}
                className="h-4 w-4 accent-plaque"
              />
              {libelle}
            </label>
          ))}
        </div>
      </fieldset>

      {erreur && <p className="text-meta text-rouge">{erreur}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={enCours} className="flex items-center bg-plaque px-6 text-white disabled:opacity-60">
          {enCours ? "enregistrement…" : "enregistrer"}
        </button>
        <button type="button" onClick={onAnnuler} className="flex items-center border border-trait px-6 text-encre">
          annuler
        </button>
      </div>
    </form>
  );
}
