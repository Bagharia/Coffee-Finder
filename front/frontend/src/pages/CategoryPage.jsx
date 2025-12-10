import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CafeCard from "../components/CafeCard";
import { cafesAPI } from "../../services/api";

export default function CategoryPage() {
  const { category } = useParams();
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mapper les catégories URL vers les spécialités du backend
  const categoryMap = {
    "cafe": "Café",
    "matcha": "Matcha",
    "bubble-tea": "Bubble Tea",
    "bbt": "Bubble Tea",
    "the": "Thé",
    "tea": "Thé"
  };

  const displayNames = {
    "cafe": "Café",
    "matcha": "Matcha",
    "bubble-tea": "Bubble Tea",
    "bbt": "Bubble Tea",
    "the": "Thé",
    "tea": "Thé"
  };

  useEffect(() => {
    const fetchCafes = async () => {
      try {
        setLoading(true);
        const specialite = categoryMap[category] || category;
        const data = await cafesAPI.getBySpecialite(specialite);
        setCafes(data);
      } catch (err) {
        setError("Erreur lors du chargement des cafés");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCafes();
  }, [category]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <p className="text-lg">Chargement des cafés...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  const categoryDisplayName = displayNames[category] || category;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">
          {categoryDisplayName}
        </h1>
        <p className="text-neutral-600">
          {cafes.length} {cafes.length > 1 ? 'cafés trouvés' : 'café trouvé'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {cafes.length > 0 ? (
          cafes.map((cafe) => (
            <CafeCard key={cafe.id} cafe={cafe} />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">
            Aucun café trouvé dans cette catégorie
          </p>
        )}
      </div>
    </div>
  );
}
