import { useState, useEffect } from "react";
import { cafesAPI, LIMITE_MAX } from "../services/api";

export default function Admin() {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCafe, setEditingCafe] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    arrondissement: "",
    adresse: "",
    image_url: "",
    description: "",
    specialite: [],
    prix: "1-10",
    wifi: 0,
    prises: 0,
    travailler: 0,
    theme: "",
    ambiance: "",
    nb_personnes: "",
    horaires: "",
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchCafes();
  }, []);

  const fetchCafes = async () => {
    try {
      setLoading(true);
      const reponse = await cafesAPI.getAll({ limite: LIMITE_MAX });
      setCafes(reponse.donnees);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSpecialiteToggle = (specialite) => {
    setFormData((prev) => {
      const currentSpecialites = prev.specialite;
      if (currentSpecialites.includes(specialite)) {
        return {
          ...prev,
          specialite: currentSpecialites.filter((s) => s !== specialite),
        };
      } else {
        return {
          ...prev,
          specialite: [...currentSpecialites, specialite],
        };
      }
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Créer une URL de prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({
          ...formData,
          image_url: reader.result, // On stocke le base64 dans image_url
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cafeData = {
        ...formData,
        specialite: formData.specialite.join(','),
        wifi: Number(formData.wifi),
        prises: Number(formData.prises),
        travailler: Number(formData.travailler),
      };

      if (editingCafe) {
        await cafesAPI.update(editingCafe.id, cafeData);
      } else {
        await cafesAPI.create(cafeData);
      }

      setShowModal(false);
      setEditingCafe(null);
      resetForm();
      fetchCafes();
    } catch (err) {
      setError("Erreur lors de la sauvegarde");
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      arrondissement: "",
      adresse: "",
      image_url: "",
      description: "",
      specialite: [],
      prix: "1-10",
      wifi: 0,
      prises: 0,
      travailler: 0,
      theme: "",
      ambiance: "",
      nb_personnes: "",
      horaires: "",
    });
    setImagePreview(null);
  };

  const handleEdit = (cafe) => {
    setEditingCafe(cafe);
    setFormData({
      nom: cafe.nom || "",
      arrondissement: cafe.arrondissement || "",
      adresse: cafe.adresse || "",
      image_url: cafe.image_url || "",
      description: cafe.description || "",
      specialite: cafe.specialite ? cafe.specialite.split(',').map(s => s.trim()) : [],
      prix: cafe.prix || "1-10",
      wifi: cafe.wifi || 0,
      prises: cafe.prises || 0,
      travailler: cafe.travailler || 0,
      theme: cafe.theme || "",
      ambiance: cafe.ambiance || "",
      nb_personnes: cafe.nb_personnes || "",
      horaires: cafe.horaires || "",
    });
    setImagePreview(null); // Reset preview, l'image existante sera affichée via formData.image_url
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce café ?")) {
      try {
        await cafesAPI.delete(id);
        fetchCafes();
      } catch (err) {
        setError("Erreur lors de la suppression");
        console.error(err);
      }
    }
  };

  const handleAddNew = () => {
    setEditingCafe(null);
    resetForm();
    setImagePreview(null);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-(--background) py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-(--primary)">Admin - Gestion des Cafés</h1>
          <button
            onClick={handleAddNew}
            className="bg-(--secondary) text-(--text-on-primary) px-6 py-3 rounded-lg hover:bg-(--text-light) transition-all duration-300 flex items-center gap-2 font-medium shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un café
          </button>
        </div>

        {error && (
          <div className="bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] border border-(--accent) text-(--primary) px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-(--primary)">Chargement...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cafes.map((cafe) => (
              <div
                key={cafe.id}
                className="bg-(--surface) rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-(--border-light) hover:border-(--secondary)"
              >
                <img
                  src={cafe.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'}
                  alt={cafe.nom}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800';
                  }}
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-(--primary) mb-2">{cafe.nom}</h3>
                  <p className="text-(--text-light) text-sm mb-2">📍 {cafe.adresse || 'Adresse non renseignée'}</p>
                  <p className="text-(--text-light) text-sm mb-2">🏛️ {cafe.arrondissement || 'N/A'}</p>

                  {cafe.specialite && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {cafe.specialite.split(',').map((spec, index) => (
                        <span
                          key={index}
                          className="bg-[color-mix(in_srgb,var(--secondary)_20%,transparent)] text-(--primary) text-xs px-2 py-1 rounded font-medium"
                        >
                          {spec.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 text-xs text-(--primary) mb-3">
                    {cafe.wifi === 1 && <span className="bg-[color-mix(in_srgb,var(--accent)_30%,transparent)] px-2 py-1 rounded">📶 WiFi</span>}
                    {cafe.prises === 1 && <span className="bg-[color-mix(in_srgb,var(--accent)_30%,transparent)] px-2 py-1 rounded">🔌 Prises</span>}
                    {cafe.travailler === 1 && <span className="bg-[color-mix(in_srgb,var(--accent)_30%,transparent)] px-2 py-1 rounded">💼 Travail</span>}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cafe)}
                      className="flex-1 bg-(--secondary) text-(--text-on-primary) px-4 py-2 rounded hover:bg-(--text-light) transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(cafe.id)}
                      className="flex-1 bg-(--accent) text-(--text-on-primary) px-4 py-2 rounded hover:bg-[color-mix(in_srgb,var(--accent)_70%,transparent)] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-(--surface) rounded-lg shadow-2xl max-w-3xl w-full my-8 border-2 border-(--border-light)">
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-(--primary)">
                  {editingCafe ? "Modifier le café" : "Ajouter un café"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-(--primary) hover:text-(--accent) transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-(--primary) mb-1">
                      Nom du café *
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                      className="input-form w-full px-4 py-2 rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-(--primary) mb-1">
                      Arrondissement
                    </label>
                    <input
                      type="text"
                      name="arrondissement"
                      value={formData.arrondissement}
                      onChange={handleChange}
                      placeholder="1er, 2e, 3e..."
                      className="input-form w-full px-4 py-2 rounded-lg outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-(--primary) mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    className="input-form w-full px-4 py-2 rounded-lg outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-(--primary) mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Décrivez l'ambiance, les spécialités, ce qui rend ce café unique..."
                    className="input-form w-full px-4 py-2 rounded-lg outline-none transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-(--primary) mb-2">
                    Image du café
                  </label>

                  {/* Prévisualisation de l'image */}
                  {(imagePreview || formData.image_url) && (
                    <div className="mb-3">
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Aperçu"
                        className="w-full h-48 object-cover rounded-lg border-2 border-(--border-light)"
                      />
                    </div>
                  )}

                  {/* Bouton pour choisir une image */}
                  <div className="flex gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="bg-(--secondary) text-(--text-on-primary) px-4 py-3 rounded-lg hover:bg-(--text-light) transition-all duration-300 text-center font-medium flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Choisir une image
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Option pour entrer une URL */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt("Entrez l'URL de l'image:");
                        if (url) {
                          setFormData({ ...formData, image_url: url });
                          setImagePreview(null);
                        }
                      }}
                      className="bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-(--primary) px-4 py-3 rounded-lg hover:bg-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-all duration-300 font-medium flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      URL
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-(--primary) mb-1">
                      Spécialités
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Café', 'Matcha', 'Bubble Tea', 'Thé'].map((specialite) => (
                        <label
                          key={specialite}
                          className="flex items-center gap-2 cursor-pointer input-form px-4 py-2 rounded-lg hover:border-(--secondary) transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.specialite.includes(specialite)}
                            onChange={() => handleSpecialiteToggle(specialite)}
                            className="w-4 h-4 accent-(--secondary)"
                          />
                          <span className="text-sm font-medium">{specialite}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-(--primary) mb-1">
                      Prix
                    </label>
                    <select
                      name="prix"
                      value={formData.prix}
                      onChange={handleChange}
                      className="input-form w-full px-4 py-2 rounded-lg outline-none transition-colors"
                    >
                      <option value="1-10">1-10€</option>
                      <option value="10-20">10-20€</option>
                      <option value="20+">20€+</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-(--primary) mb-1">
                      Thème
                    </label>
                    <input
                      type="text"
                      name="theme"
                      value={formData.theme}
                      onChange={handleChange}
                      placeholder="Moderne, Classique..."
                      className="input-form w-full px-4 py-2 rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-(--primary) mb-1">
                      Ambiance
                    </label>
                    <input
                      type="text"
                      name="ambiance"
                      value={formData.ambiance}
                      onChange={handleChange}
                      placeholder="Calme, Animée..."
                      className="input-form w-full px-4 py-2 rounded-lg outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-(--primary) mb-1">
                      Nombre de personnes
                    </label>
                    <input
                      type="text"
                      name="nb_personnes"
                      value={formData.nb_personnes}
                      onChange={handleChange}
                      placeholder="1-2, 2-4..."
                      className="input-form w-full px-4 py-2 rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-(--primary) mb-1">
                      Horaires
                    </label>
                    <input
                      type="text"
                      name="horaires"
                      value={formData.horaires}
                      onChange={handleChange}
                      placeholder="8h-18h"
                      className="input-form w-full px-4 py-2 rounded-lg outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="wifi"
                      checked={formData.wifi === 1}
                      onChange={handleChange}
                      className="w-4 h-4 accent-(--secondary)"
                    />
                    <span className="text-sm font-medium text-(--primary)">WiFi disponible</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="prises"
                      checked={formData.prises === 1}
                      onChange={handleChange}
                      className="w-4 h-4 accent-(--secondary)"
                    />
                    <span className="text-sm font-medium text-(--primary)">Prises électriques</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="travailler"
                      checked={formData.travailler === 1}
                      onChange={handleChange}
                      className="w-4 h-4 accent-(--secondary)"
                    />
                    <span className="text-sm font-medium text-(--primary)">Bon pour travailler</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-(--secondary) text-(--text-on-primary) px-6 py-3 rounded-lg hover:bg-(--text-light) transition-all duration-300 font-medium shadow-md"
                  >
                    {editingCafe ? "Mettre à jour" : "Ajouter"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-(--primary) px-6 py-3 rounded-lg hover:bg-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-all duration-300 font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
