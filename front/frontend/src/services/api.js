const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Toutes les requêtes passent ici.
 *
 * La session vit dans un cookie httpOnly posé par l'API : le front ne la lit
 * jamais, il se contente de laisser le navigateur l'envoyer — d'où
 * `credentials: 'include'` partout et plus aucun jeton dans le code.
 *
 * L'API répond { error: "..." } en français : on remonte ce message tel quel,
 * c'est lui que les écrans affichent.
 */
async function requete(endpoint, { methode = 'GET', corps } = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: methode,
    credentials: 'include',
    headers: corps ? { 'Content-Type': 'application/json' } : undefined,
    body: corps ? JSON.stringify(corps) : undefined
  });

  const donnees = await response.json().catch(() => null);

  if (!response.ok) {
    // 401 = plus de session valable. Le contexte d'authentification écoute cet
    // événement et remet l'interface en état déconnecté, sans rechargement.
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('session-expiree'));
    }
    throw new Error(donnees?.error || 'Le serveur est injoignable pour le moment.');
  }

  return donnees;
}

const get = (endpoint) => requete(endpoint);
const post = (endpoint, corps) => requete(endpoint, { methode: 'POST', corps });
const put = (endpoint, corps) => requete(endpoint, { methode: 'PUT', corps });
const del = (endpoint) => requete(endpoint, { methode: 'DELETE' });

// Les routes de liste répondent { donnees, page, limite, total }, jamais un
// tableau nu : c'est ce qui permet de paginer sans changer le contrat.
function requeteListe(endpoint, { page, limite } = {}) {
  const parametres = new URLSearchParams();
  if (page) parametres.set('page', page);
  if (limite) parametres.set('limite', limite);
  const separateur = endpoint.includes('?') ? '&' : '?';
  const suffixe = parametres.toString() ? `${separateur}${parametres}` : '';
  return get(`${endpoint}${suffixe}`);
}

// Limite maximale acceptée par l'API. À utiliser là où l'écran a besoin de
// toutes les adresses d'un coup (carte, recherche de la navbar, admin) —
// au-delà de 100 adresses, ces écrans devront paginer pour de bon.
export const LIMITE_MAX = 100;

export const cafesAPI = {
  getAll: (params) => requeteListe('/cafes', params),
  getById: (id) => get(`/cafes/${id}`),
  search: (filtres, params) => requeteListe(`/cafes/search?${new URLSearchParams(filtres)}`, params),
  getByArrondissement: (arr, params) => requeteListe(`/cafes/arrondissement/${arr}`, params),
  getBySpecialite: (spec, params) => requeteListe(`/cafes/specialite/${encodeURIComponent(spec)}`, params),
  getByWifi: (wifi, params) => requeteListe(`/cafes/wifi/${wifi}`, params),
  getByAmbiance: (amb, params) => requeteListe(`/cafes/ambiance/${encodeURIComponent(amb)}`, params),
  getByPrice: (prix, params) => requeteListe(`/cafes/prix/${prix}`, params),
  getNouveautes: (params) => requeteListe('/cafes/nouveautes', params),
  getRandom: () => get('/cafes/random'),

  create: (cafe) => post('/cafes', cafe),
  update: (id, cafe) => put(`/cafes/${id}`, cafe),
  delete: (id) => del(`/cafes/${id}`)
};

export const usersAPI = {
  login: (identifiants) => post('/users/login', identifiants),
  register: (compte) => post('/users/register', compte),
  logout: () => post('/users/logout'),
  getProfile: () => get('/users/profile'),
  changePassword: (motsDePasse) => put('/users/change-password', motsDePasse)
};

export const avisAPI = {
  // Réponse : { donnees, page, limite, total, moyenne }
  getByCafe: (cafeId, params) => requeteListe(`/avis/${cafeId}`, params),
  getMine: (cafeId) => get(`/avis/${cafeId}/mine`),
  save: (cafeId, avis) => post(`/avis/${cafeId}`, avis),
  delete: (cafeId) => del(`/avis/${cafeId}`)
};

export const favorisAPI = {
  getAll: (params) => requeteListe('/favoris', params),
  check: (cafeId) => get(`/favoris/${cafeId}/check`),
  add: (cafeId) => post(`/favoris/${cafeId}`),
  remove: (cafeId) => del(`/favoris/${cafeId}`)
};

export default cafesAPI;
