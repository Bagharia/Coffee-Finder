import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Liste chargée page par page depuis l'API.
 *
 * Le guide chargeait jusqu'ici toutes les adresses d'un coup, avec
 * `limite: LIMITE_MAX`. Tant qu'il y en a cinq, ça ne se voit pas ; à cent une,
 * l'écran en cache une partie sans rien dire. La pagination n'est donc pas un
 * confort, c'est ce qui empêche le site de mentir le jour où Wendy aura
 * vraiment rempli la base.
 *
 * Le filtrage passe du même coup côté serveur : filtrer localement une page
 * ne filtrerait que ce qui est déjà chargé, ce qui est pire que pas de filtre
 * du tout — on croirait avoir tout vu.
 *
 * @param {(params: object) => Promise<object>} recuperer appel API, reçoit { page }
 * @param {object} filtres relancent le chargement à chaque changement
 */
export function useListePaginee(recuperer, filtres) {
  const [adresses, setAdresses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(true);
  const [chargementSuite, setChargementSuite] = useState(false);
  const [erreur, setErreur] = useState(null);

  // Un changement de filtre pendant qu'une requête vole rendrait une réponse
  // périmée : elle arriverait après la nouvelle et écraserait le bon résultat.
  // Chaque chargement porte un numéro ; seul le dernier a le droit d'écrire.
  const dernier = useRef(0);
  const cle = JSON.stringify(filtres);

  const charger = useCallback(async (numeroPage, ajouter) => {
    const jeton = ++dernier.current;

    if (ajouter) setChargementSuite(true);
    else setChargement(true);

    try {
      const reponse = await recuperer({ page: numeroPage });
      if (jeton !== dernier.current) return;

      setAdresses((liste) => (ajouter ? [...liste, ...reponse.donnees] : reponse.donnees));
      setTotal(reponse.total);
      setPage(numeroPage);
      setErreur(null);
    } catch (err) {
      if (jeton !== dernier.current) return;
      setErreur(err.message);
    } finally {
      if (jeton === dernier.current) {
        setChargement(false);
        setChargementSuite(false);
      }
    }
  }, [recuperer]);

  useEffect(() => {
    charger(1, false);
    // `cle` sérialise les filtres : comparer l'objet lui-même relancerait le
    // chargement à chaque rendu, puisqu'un objet littéral change d'identité.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  const chargerPlus = useCallback(() => charger(page + 1, true), [charger, page]);

  return {
    adresses,
    total,
    chargement,
    chargementSuite,
    erreur,
    encore: adresses.length < total,
    chargerPlus,
    recharger: () => charger(1, false)
  };
}
