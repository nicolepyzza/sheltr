import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: async (username, password) => {
    const response = await api.post('/api/auth/signup', { username, password });
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },

  getUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },
};

// Pets API
export const petsAPI = {
  getAll: async (page = 1, limit = 20, type = null) => {
    const params = { page, limit };
    if (type) params.type = type;
    const response = await api.get('/api/pets', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/pets/${id}`);
    return response.data;
  },

  create: async (petData) => {
    const formData = new FormData();
    
    Object.keys(petData).forEach((key) => {
      if (key === 'breeds' || key === 'colors') {
        formData.append(key, JSON.stringify(petData[key]));
      } else if (key === 'image' && petData[key]) {
        formData.append('image', {
          uri: petData[key].uri,
          type: petData[key].type || 'image/jpeg',
          name: petData[key].fileName || 'photo.jpg',
        });
      } else {
        formData.append(key, petData[key]);
      }
    });

    const response = await api.post('/api/pets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/api/pets/${id}/status`, { status });
    return response.data;
  },

  claimFound: async (id, claimData) => {
    const formData = new FormData();
    
    if (claimData.photo) {
      formData.append('photo', {
        uri: claimData.photo.uri,
        type: claimData.photo.type || 'image/jpeg',
        name: claimData.photo.fileName || 'found-photo.jpg',
      });
    }
    
    if (claimData.notes) {
      formData.append('notes', claimData.notes);
    }

    const response = await api.post(`/api/pets/${id}/claim-found`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  confirmFound: async (id, claimId) => {
    const response = await api.patch(`/api/pets/${id}/confirm-found`, { claimId });
    return response.data;
  },

  disputeFound: async (id, claimId, reason) => {
    const response = await api.patch(`/api/pets/${id}/dispute-found`, { claimId, reason });
    return response.data;
  },

  claimOwnership: async (id, claimData) => {
    const formData = new FormData();
    
    if (claimData.photo) {
      formData.append('verificationPhoto', {
        uri: claimData.photo.uri,
        type: claimData.photo.type || 'image/jpeg',
        name: claimData.photo.fileName || 'verification.jpg',
      });
    }
    
    formData.append('collarColor', claimData.collarColor || '');
    formData.append('hasMicrochip', claimData.hasMicrochip);
    formData.append('uniqueMarks', claimData.uniqueMarks || '');
    formData.append('microchipId', claimData.microchipId || '');

    const response = await api.post(`/api/pets/${id}/claim-ownership`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  verifyOwnership: async (id, claimId, approved, denialReason = '') => {
    const response = await api.patch(`/api/pets/${id}/verify-ownership`, {
      claimId,
      approved,
      denialReason
    });
    return response.data;
  },
};

// Sightings API
export const sightingsAPI = {
  create: async (sightingData) => {
    const formData = new FormData();
    
    Object.keys(sightingData).forEach((key) => {
      if (key === 'image' && sightingData[key]) {
        formData.append('image', {
          uri: sightingData[key].uri,
          type: sightingData[key].type || 'image/jpeg',
          name: sightingData[key].fileName || 'photo.jpg',
        });
      } else {
        formData.append(key, sightingData[key]);
      }
    });

    const response = await api.post('/api/sightings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getByPetId: async (petId) => {
    const response = await api.get(`/api/sightings/${petId}`);
    return response.data;
  },
};

export default api;
