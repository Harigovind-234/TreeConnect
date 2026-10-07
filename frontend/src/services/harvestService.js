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

  // Schedule site inspection visit
  scheduleInspection: async (requestId, inspectionData) => {
    try {
      const response = await api.post(`/harvest-requests/${requestId}/schedule-inspection`, inspectionData);
      return response.data;
    } catch (error) {
      console.warn(`Falling back to patch for scheduleInspection (${requestId}):`, error);
      // Fallback to updateHarvestRequest
      const response = await api.patch(`/harvest-requests/${requestId}`, {
        site_inspection: {
          status: 'SCHEDULED',
          ...inspectionData,
          scheduled_at: new Date().toISOString()
        },
        inspection_status: 'SCHEDULED'
      });
      return response.data;
    }
  },

  // Complete & certify site inspection report
  completeInspection: async (requestId, auditData) => {
    try {
      const response = await api.post(`/harvest-requests/${requestId}/complete-inspection`, auditData);
      return response.data;
    } catch (error) {
      console.warn(`Falling back to patch for completeInspection (${requestId}):`, error);
      // Fallback to updateHarvestRequest
      const response = await api.patch(`/harvest-requests/${requestId}`, {
        site_inspection: {
          status: 'COMPLETED',
          ...auditData,
          completed_at: new Date().toISOString()
        },
        inspection_status: 'COMPLETED',
        site_inspected: true,
        inspected_at: auditData.inspected_at || new Date().toISOString()
      });
      return response.data;
    }
  },

  // Landowner suggests alternate inspection date
  rescheduleInspection: async (requestId, rescheduleData) => {
    try {
      const response = await api.post(`/harvest-requests/${requestId}/reschedule-inspection`, rescheduleData);
      return response.data;
    } catch (error) {
      console.warn(`Falling back to patch for rescheduleInspection (${requestId}):`, error);
      const response = await api.patch(`/harvest-requests/${requestId}`, {
        site_inspection: {
          reschedule_requested: true,
          reschedule_status: 'PENDING_CONTRACTOR',
          suggested_date: rescheduleData.suggested_date,
          suggested_time_slot: rescheduleData.suggested_time_slot,
          reschedule_reason: rescheduleData.reschedule_reason,
          reschedule_notes: rescheduleData.reschedule_notes,
          reschedule_requested_at: new Date().toISOString()
        },
        reschedule_requested: true,
        inspection_status: 'RESCHEDULE_REQUESTED'
      });
      return response.data;
    }
  },

  // Contractor responds to reschedule (accept, decline, or counter)
  respondReschedule: async (requestId, responseData) => {
    try {
      const response = await api.post(`/harvest-requests/${requestId}/respond-reschedule`, responseData);
      return response.data;
    } catch (error) {
      console.warn(`Falling back to patch for respondReschedule (${requestId}):`, error);
      const isAccept = responseData.action === 'ACCEPT';
      const isCancel = responseData.action === 'CANCEL_REQUEST';
      const updatePayload = isAccept ? {
        site_inspection: {
          scheduled_date: responseData.confirmed_date,
          time_slot: responseData.confirmed_time_slot,
          reschedule_requested: false,
          reschedule_status: 'ACCEPTED',
          status: 'CONFIRMED'
        },
        reschedule_requested: false,
        inspection_scheduled_date: responseData.confirmed_date,
        inspection_status: 'CONFIRMED'
      } : isCancel ? {
        site_inspection: {
          reschedule_requested: false,
          reschedule_status: 'CANCELLED_BY_LANDOWNER'
        },
        reschedule_requested: false,
        inspection_status: 'SCHEDULED'
      } : {
        site_inspection: {
          reschedule_requested: false,
          reschedule_status: 'DECLINED'
        },
        reschedule_requested: false
      };
      const response = await api.patch(`/harvest-requests/${requestId}`, updatePayload);
      return response.data;
    }
  },

  // Decline assigned harvest job (e.g. Inaccessible or high risk after site inspection)
  declineJob: async (requestId, declineData) => {
    try {
      const response = await api.post(`/harvest-requests/${requestId}/decline-job`, declineData);
      return response.data;
    } catch (error) {
      console.warn(`Falling back to patch for declineJob (${requestId}):`, error);
      const response = await api.patch(`/harvest-requests/${requestId}`, {
        status: 'PENDING',
        contractor_decline_reason: declineData.reason || declineData.feedback || 'Site inspection deemed unfeasible',
        assigned_contractor_id: null,
        assigned_contractor_name: null,
        assigned_contractor_email: null,
        inspection_status: 'DECLINED'
      });
      return response.data;
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
  },

  // Delete harvest request
  deleteHarvestRequest: async (id) => {
    try {
      const response = await api.delete(`/harvest-requests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error in harvestService.deleteHarvestRequest (${id}):`, error);
      throw error.response?.data || error;
    }
  }
};

export default harvestService;
