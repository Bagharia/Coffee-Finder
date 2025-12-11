const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Fonction generique pour les requetes GET
const get = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
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
  getById: (id) => get(`/cafes/${id}`),

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

export default cafesAPI;
