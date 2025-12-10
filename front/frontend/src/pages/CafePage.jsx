import { useState, useEffect } from "react";
import CafeCard from "../components/CafeCard";
import { cafesAPI } from "../../services/api";

export default function CafePage() {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCafes = async () => {
      try {
        setLoading(true);
        const data = await cafesAPI.getAll();
        setCafes(data);
      } catch (err) {
        setError("Erreur lors du chargement des cafés");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCafes();
  }, []);

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

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {cafes.length > 0 ? (
        cafes.map((cafe) => (
          <CafeCard key={cafe.id} cafe={cafe} />
        ))
      ) : (
        <p className="col-span-full text-center text-gray-500">
          Aucun café trouvé
        </p>
      )}
    </div>
  );
}