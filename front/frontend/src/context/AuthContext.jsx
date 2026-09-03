import { useCallback, useEffect, useMemo, useState } from "react";
import { usersAPI } from "../services/api";
import { ContexteAuth } from "./contexteAuth";

// Depuis que la session vit dans un cookie httpOnly, le front ne peut plus lire
// le jeton — donc plus question de décoder un JWT côté navigateur pour savoir
// qui est connecté. La seule source de vérité est l'API : on lui demande.

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

  const rafraichir = useCallback(async () => {
    try {
      setUtilisateur(await usersAPI.getProfile());
    } catch {
      // Pas de session valable : ce n'est pas une erreur, c'est un visiteur.
      setUtilisateur(null);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  // Une session expirée en cours de navigation remet l'interface en état
  // déconnecté sans recharger la page.
  useEffect(() => {
    const surExpiration = () => setUtilisateur(null);
    window.addEventListener("session-expiree", surExpiration);
    return () => window.removeEventListener("session-expiree", surExpiration);
  }, []);

  const connexion = useCallback(async (identifiants) => {
    const { user } = await usersAPI.login(identifiants);
    setUtilisateur(user);
    return user;
  }, []);

  const inscription = useCallback(async (compte) => {
    const { user } = await usersAPI.register(compte);
    setUtilisateur(user);
    return user;
  }, []);

  const deconnexion = useCallback(async () => {
    try {
      await usersAPI.logout();
    } finally {
      // Même si l'appel échoue, l'interface repasse en visiteur : le cookie
      // est de toute façon inutilisable de ce côté-ci.
      setUtilisateur(null);
    }
  }, []);

  const valeur = useMemo(() => ({
    utilisateur,
    chargement,
    connecte: utilisateur !== null,
    estAdmin: utilisateur?.role === "admin",
    connexion,
    inscription,
    deconnexion,
    rafraichir
  }), [utilisateur, chargement, connexion, inscription, deconnexion, rafraichir]);

  return <ContexteAuth.Provider value={valeur}>{children}</ContexteAuth.Provider>;
}
