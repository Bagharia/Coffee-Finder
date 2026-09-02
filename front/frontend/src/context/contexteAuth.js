import { createContext } from "react";

// Le contexte vit dans son propre fichier : le rafraîchissement à chaud de Vite
// ne fonctionne que si un module de composants n'exporte que des composants.
export const ContexteAuth = createContext(null);
