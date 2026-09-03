import { useContext } from "react";
import { ContexteAuth } from "../context/contexteAuth";

/**
 * Donne l'état d'authentification : { utilisateur, chargement, connecte,
 * estAdmin, connexion, inscription, deconnexion, rafraichir }.
 *
 * `chargement` vaut vrai tant que l'API n'a pas répondu qui est connecté.
 * Ne jamais décider d'une redirection avant qu'il soit retombé à faux.
 */
export function useAuth() {
  const contexte = useContext(ContexteAuth);

  if (!contexte) {
    throw new Error("useAuth doit être appelé à l'intérieur d'un AuthProvider.");
  }

  return contexte;
}
