const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Si le serveur répond 401, le token est invalide/expiré → déconnexion auto
function handleUnauthorized(response) {
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return response;
}

// Fonction generique pour les requetes GET
const get = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    handleUnauthorized(response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la requete GET:', error);
    throw error;
  }
};

// Fonction pour obtenir le token depuis localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Fonction generique pour les requetes POST
const post = async (endpoint, data, requiresAuth = false) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(requiresAuth ? getAuthHeaders() : {})
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    handleUnauthorized(response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la requete POST:', error);
    throw error;
  }
};

// Fonction generique pour les requetes PUT
const put = async (endpoint, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data),
    });
    handleUnauthorized(response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la requete PUT:', error);
    throw error;
  }
};

// Fonction generique pour les requetes DELETE
const del = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    handleUnauthorized(response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la requete DELETE:', error);
    throw error;
  }
};

// API des cafes
export const cafesAPI = {
  // Recuperer tous les cafes
  getAll: () => get('/cafes'),

  // Recuperer un cafe par ID
  getById: async (id) => {
    const data = await get(`/cafes/${id}`);
    return Array.isArray(data) && data.length > 0 ? data[0] : data;
  },

  // Rechercher des cafes
  search: (searchTerm) => get(`/cafes/search?q=${encodeURIComponent(searchTerm)}`),

  // Filtrer par arrondissement
  getByArrondissement: (arr) => get(`/cafes/arrondissement/${arr}`),

  // Filtrer par specialite
  getBySpecialite: (spec) => get(`/cafes/specialite/${encodeURIComponent(spec)}`),

  // Filtrer par WiFi
  getByWifi: (wifi) => get(`/cafes/wifi/${wifi}`),

  // Filtrer par ambiance
  getByAmbiance: (amb) => get(`/cafes/ambiance/${encodeURIComponent(amb)}`),

  // Filtrer par prix
  getByPrice: (prix) => get(`/cafes/prix/${prix}`),

  // Creer un nouveau cafe (necessite authentification admin)
  create: (cafeData) => post('/cafes', cafeData, true),

  // Modifier un cafe (necessite authentification admin)
  update: (id, cafeData) => put(`/cafes/${id}`, cafeData),

  // Supprimer un cafe (necessite authentification admin)
  delete: (id) => del(`/cafes/${id}`),

  // Nouveautés (30 derniers jours)
  getNouveautes: () => get('/cafes/nouveautes'),

  // Café aléatoire
  getRandom: () => get('/cafes/random'),
};

// API des utilisateurs
export const usersAPI = {
  login: (credentials) => post('/users/login', credentials),
  register: (userData) => post('/users/register', userData),

  // Stocker le token apres connexion
  saveToken: (token) => localStorage.setItem('token', token),

  // Recuperer le token
  getToken: () => localStorage.getItem('token'),

  // Supprimer le token (deconnexion)
  removeToken: () => localStorage.removeItem('token'),

  // Verifier si l'utilisateur est connecte
  isAuthenticated: () => !!localStorage.getItem('token'),
};

// API des avis
export const avisAPI = {
  getByCafe: (cafeId) => get(`/avis/${cafeId}`),
  getMine: (cafeId) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/avis/${cafeId}/mine`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
  },
  save: (cafeId, data) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/avis/${cafeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },
  delete: (cafeId) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/avis/${cafeId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
  },
};

// API des favoris
export const favorisAPI = {
  getAll: () => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/favoris`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
  },
  check: (cafeId) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/favoris/${cafeId}/check`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
  },
  add: (cafeId) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/favoris/${cafeId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
  },
  remove: (cafeId) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/favoris/${cafeId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
  },
};

export default cafesAPI;
