import { useState, useEffect } from "react";
import Carousel from "../components/Carousel";
import { cafesAPI } from "../../services/api";

export default function Home() {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCafes = async () => {
      try {
        setLoading(true);
        const data = await cafesAPI.getAll();
        // Limiter aux 5 premiers cafés pour le carousel
        setCafes(data.slice(0, 5));
      } catch (err) {
        setError("Erreur lors du chargement des cafés");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCafes();
  }, []);

  return (
    <div
      className="h-full w-full  text-neutral-900"
    >
      <div className="w-full h-132 flex items-center justify-center bg-white">
          <h1 className="text-4xl font-[georgia]">Presentation du site</h1>
      </div>
      <div className="pt-10">
        <h1 className="flex justify-center text-2xl font-bold px-4 mb-4">Cafés populaires</h1>
        {loading && <p className="text-center">Chargement...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && <Carousel cafes={cafes} />}
    </div>
    </div>
  );
}
