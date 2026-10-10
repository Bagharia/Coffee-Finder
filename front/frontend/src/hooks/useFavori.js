import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { favorisAPI } from "../services/api";
import { useAuth } from "./useAuth";

/**
 * État et bascule du favori d'une adresse — extrait de `CafeCard` quand
 * `VerdictUne` (carte héro) a eu besoin du même bouton cœur (DA du
 * 2026-09-05 : le mockup montre le cœur aussi sur la carte "coup de cœur").
 */
export function useFavori(cafeId, initialFavorite) {
  const navigate = useNavigate();
  const { connecte } = useAuth();
  const [favori, setFavori] = useState(initialFavorite ?? false);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!cafeId) return;
    if (initialFavorite !== undefined) return;
    if (!connecte) return;
    favorisAPI.check(cafeId)
      .then((d) => setFavori(d.isFavorite))
      .catch(() => setFavori(false));
  }, [cafeId, connecte, initialFavorite]);

  const basculer = async () => {
    if (!connecte) { navigate("/login"); return; }
    setEnCours(true);
    try {
      if (favori) {
        await favorisAPI.remove(cafeId);
        setFavori(false);
      } else {
        await favorisAPI.add(cafeId);
        setFavori(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnCours(false);
    }
  };

  return { favori, enCours, basculer };
}
