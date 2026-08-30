import api from './api';

export const harvestService = {
  // Create a new harvest request
  createHarvestRequest: async (harvestRequestData) => {
    try {
      const response = await api.post('/harvest-requests', harvestRequestData);
      return response.data;
    } catch (error) {
      console.error('Error in harvestService.createHarvestRequest:', error);
      throw error.response?.data || error;
    }
  },

  // Get list of harvest requests (filtered by userEmail, contractorId, or all_records)
  getHarvestRequests: async (params = {}) => {
    try {
      const response = await api.get('/harvest-requests', { params });
      return response.data;
    } catch (error) {
      console.error('Error in harvestService.getHarvestRequests:', error);
      throw error.response?.data || error;
    }
  },

  // Get single harvest request by ID
  getHarvestRequestById: async (id) => {
    try {
      const response = await api.get(`/harvest-requests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error in harvestService.getHarvestRequestById (${id}):`, error);
      throw error.response?.data || error;
    }
  },

  // Update harvest request
  updateHarvestRequest: async (id, updateData) => {
    try {
      const response = await api.patch(`/harvest-requests/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Error in harvestService.updateHarvestRequest (${id}):`, error);
      throw error.response?.data || error;
    }
  },

  // Assign approved contractor
  assignContractor: async (requestId, contractorData) => {
    try {
      const response = await api.post(`/harvest-requests/${requestId}/assign-contractor`, contractorData);
      return response.data;
    } catch (error) {
      console.error(`Error in harvestService.assignContractor (${requestId}):`, error);
      throw error.response?.data || error;
    }
  },

  // Submit contractor assessment / quotation
  submitAssessment: async (requestId, assessmentData) => {
    try {
      const response = await api.post(`/harvest-requests/${requestId}/assessment`, assessmentData);
      return response.data;
    } catch (error) {
      console.error(`Error in harvestService.submitAssessment (${requestId}):`, error);
      throw error.response?.data || error;
    }
  },

  // Get contractor assessment for request
  getAssessment: async (requestId) => {
    try {
      const response = await api.get(`/harvest-requests/${requestId}/assessment`);
      return response.data;
    } catch (error) {
      console.error(`Error in harvestService.getAssessment (${requestId}):`, error);
      throw error.response?.data || error;
    }
  },

  // Landowner action on assessment (Accept, Reject, Request Revision)
  actionAssessment: async (requestId, actionData) => {
    try {
      const response = await api.patch(`/harvest-requests/${requestId}/assessment`, actionData);
      return response.data;
    } catch (error) {
      console.error(`Error in harvestService.actionAssessment (${requestId}):`, error);
      throw error.response?.data || error;
    }
  }
};

export default harvestService;
