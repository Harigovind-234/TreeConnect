import api from './api';

export const propertyService = {
  // Register new property in database
  registerProperty: async (propertyData) => {
    try {
      const response = await api.post('/properties', propertyData);
      return response.data;
    } catch (error) {
      console.error('Error in propertyService.registerProperty:', error);
      throw error.response?.data || error;
    }
  },

  // Get all registered properties
  getProperties: async (params = {}) => {
    try {
      const response = await api.get('/properties', { params });
      return response.data;
    } catch (error) {
      console.error('Error in propertyService.getProperties:', error);
      throw error.response?.data || error;
    }
  },

  // Get property by ID
  getPropertyById: async (id) => {
    try {
      const response = await api.get(`/properties/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error in propertyService.getPropertyById (${id}):`, error);
      throw error.response?.data || error;
    }
  },

  // Update property in DB
  updateProperty: async (id, updatedData) => {
    try {
      const response = await api.put(`/properties/${id}`, updatedData);
      return response.data;
    } catch (error) {
      console.error(`Error in propertyService.updateProperty (${id}):`, error);
      throw error.response?.data || error;
    }
  },

  // Delete property from DB
  deleteProperty: async (id) => {
    try {
      const response = await api.delete(`/properties/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error in propertyService.deleteProperty (${id}):`, error);
      throw error.response?.data || error;
    }
  },

  // Save tree inventory in DB
  addTreeInventory: async (inventoryData) => {
    try {
      const response = await api.post('/properties/tree-inventory', inventoryData);
      return response.data;
    } catch (error) {
      console.error('Error in propertyService.addTreeInventory:', error);
      throw error.response?.data || error;
    }
  },

  // Get tree inventories from DB
  getTreeInventories: async (params = {}) => {
    try {
      const response = await api.get('/properties/tree-inventory', { params });
      return response.data;
    } catch (error) {
      console.error('Error in propertyService.getTreeInventories:', error);
      throw error.response?.data || error;
    }
  },

  // Delete tree inventory record from DB
  deleteTreeInventory: async (id) => {
    try {
      const response = await api.delete(`/properties/tree-inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error in propertyService.deleteTreeInventory (${id}):`, error);
      throw error.response?.data || error;
    }
  },

  // Get Timber Reference Rate for species & district
  getTimberReferenceRate: async (species, district) => {
    try {
      const response = await api.get('/properties/timber-reference-rate', {
        params: { species, district }
      });
      return response.data;
    } catch (error) {
      console.error('Error in propertyService.getTimberReferenceRate:', error);
      return { reference_rate: null, message: 'Reference rate unavailable' };
    }
  },

  // Calculate Timber Value dynamically via backend API
  calculateTimberValue: async (payload) => {
    try {
      const response = await api.post('/properties/calculate-timber-value', payload);
      return response.data;
    } catch (error) {
      console.error('Error in propertyService.calculateTimberValue:', error);
      return { reference_rate: null, approximate_timber_value: null, message: 'Reference rate unavailable' };
    }
  }
};

export default propertyService;
