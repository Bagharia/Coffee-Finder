const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Si le serveur répond 401, le jeton est invalide ou expiré → déconnexion.
function traiterNonAutorise(response) {
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}

function entetesAuth() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Toutes les requêtes passent ici.
 * L'API répond { error: "..." } en français sur les erreurs : on remonte ce
 * message tel quel, c'est lui que les écrans affichent. Un « HTTP error 400 »
 * ne dit rien à personne.
 */
async function requete(endpoint, { methode = 'GET', corps, auth = false } = {}) {
  const options = {
    method: methode,
    headers: {
      ...(corps ? { 'Content-Type': 'application/json' } : {}),
      ...(auth ? entetesAuth() : {})
    },
    ...(corps ? { body: JSON.stringify(corps) } : {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  traiterNonAutorise(response);

  const donnees = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(donnees?.error || 'Le serveur est injoignable pour le moment.');
  }

  return donnees;
}

const get = (endpoint, auth = false) => requete(endpoint, { auth });
const post = (endpoint, corps, auth = false) => requete(endpoint, { methode: 'POST', corps, auth });
const put = (endpoint, corps) => requete(endpoint, { methode: 'PUT', corps, auth: true });
const del = (endpoint) => requete(endpoint, { methode: 'DELETE', auth: true });

// Les routes de liste répondent { donnees, page, limite, total }, jamais un
// tableau nu : c'est ce qui permet de paginer sans changer le contrat.
function requeteListe(endpoint, { page, limite } = {}, auth = false) {
  const parametres = new URLSearchParams();
  if (page) parametres.set('page', page);
  if (limite) parametres.set('limite', limite);
  const suffixe = parametres.toString() ? `?${parametres}` : '';
  return get(`${endpoint}${suffixe}`, auth);
}

// Limite maximale acceptée par l'API. À utiliser là où l'écran a besoin de
// toutes les adresses d'un coup (carte, recherche de la navbar, admin) —
// au-delà de 100 adresses, ces écrans devront paginer pour de bon.
export const LIMITE_MAX = 100;

export const cafesAPI = {
  getAll: (params) => requeteListe('/cafes', params),
  getById: (id) => get(`/cafes/${id}`),
  search: (parametres) => requeteListe(`/cafes/search?${new URLSearchParams(parametres)}`),
  getByArrondissement: (arr, params) => requeteListe(`/cafes/arrondissement/${arr}`, params),
  getBySpecialite: (spec, params) => requeteListe(`/cafes/specialite/${encodeURIComponent(spec)}`, params),
  getByWifi: (wifi, params) => requeteListe(`/cafes/wifi/${wifi}`, params),
  getByAmbiance: (amb, params) => requeteListe(`/cafes/ambiance/${encodeURIComponent(amb)}`, params),
  getByPrice: (prix, params) => requeteListe(`/cafes/prix/${prix}`, params),
  getNouveautes: (params) => requeteListe('/cafes/nouveautes', params),
  getRandom: () => get('/cafes/random'),

  create: (cafe) => post('/cafes', cafe, true),
  update: (id, cafe) => put(`/cafes/${id}`, cafe),
  delete: (id) => del(`/cafes/${id}`)
};

export const usersAPI = {
  login: (identifiants) => post('/users/login', identifiants),
  register: (compte) => post('/users/register', compte),
  getProfile: () => get('/users/profile', true),
  changePassword: (motsDePasse) => put('/users/change-password', motsDePasse),

  saveToken: (token) => localStorage.setItem('token', token),
  getToken: () => localStorage.getItem('token'),
  removeToken: () => localStorage.removeItem('token'),
  isAuthenticated: () => !!localStorage.getItem('token')
};

export const avisAPI = {
  // Réponse : { donnees, page, limite, total, moyenne }
  getByCafe: (cafeId, params) => requeteListe(`/avis/${cafeId}`, params),
  getMine: (cafeId) => get(`/avis/${cafeId}/mine`, true),
  save: (cafeId, avis) => post(`/avis/${cafeId}`, avis, true),
  delete: (cafeId) => del(`/avis/${cafeId}`)
};

export const favorisAPI = {
  getAll: (params) => requeteListe('/favoris', params, true),
  check: (cafeId) => get(`/favoris/${cafeId}/check`, true),
  add: (cafeId) => post(`/favoris/${cafeId}`, undefined, true),
  remove: (cafeId) => del(`/favoris/${cafeId}`)
};

export default cafesAPI;
