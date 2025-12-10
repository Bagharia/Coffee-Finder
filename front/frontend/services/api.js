const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Fonction générique pour les requêtes GET
const get = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la requête GET:', error);
    throw error;
  }
};

// Fonction générique pour les requêtes POST
const post = async (endpoint, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la requête POST:', error);
    throw error;
  }
};

// Fonction générique pour les requêtes DELETE
const del = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la requête DELETE:', error);
    throw error;
  }
};

// API des cafés
export const cafesAPI = {
  // Récupérer tous les cafés
  getAll: () => get('/cafes'),

  // Récupérer un café par ID
  getById: (id) => get(`/cafes/${id}`),

  // Rechercher des cafés
  search: (searchTerm) => get(`/cafes/search?q=${encodeURIComponent(searchTerm)}`),

  // Filtrer par arrondissement
  getByArrondissement: (arr) => get(`/cafes/arrondissement/${arr}`),

  // Filtrer par spécialité
  getBySpecialite: (spec) => get(`/cafes/specialite/${encodeURIComponent(spec)}`),

  // Filtrer par WiFi
  getByWifi: (wifi) => get(`/cafes/wifi/${wifi}`),

  // Filtrer par ambiance
  getByAmbiance: (amb) => get(`/cafes/ambiance/${encodeURIComponent(amb)}`),

  // Filtrer par prix
  getByPrice: (prix) => get(`/cafes/prix/${prix}`),

  // Créer un nouveau café
  create: (cafeData) => post('/cafes', cafeData),

  // Supprimer un café
  delete: (id) => del(`/cafes/${id}`),
};

// API des utilisateurs (pour plus tard)
export const usersAPI = {
  // À implémenter selon vos besoins
  login: (credentials) => post('/users/login', credentials),
  register: (userData) => post('/users/register', userData),
};

export default cafesAPI;
