import api from './api';

export const paymentService = {
  // 1. Create a Razorpay Order calculated from trusted MongoDB proposal data
  createAdvanceOrder: async (requestId, payload = {}) => {
    try {
      const response = await api.post(`/harvest-requests/${requestId}/advance-payment/order`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error in paymentService.createAdvanceOrder (${requestId}):`, error);
      throw error.response?.data || error;
    }
  },

  // 2. Authoritative Server-side Verification of Checkout Callback
  verifyPaymentCallback: async (paymentId, callbackPayload) => {
    try {
      const response = await api.post(`/payments/${paymentId}/verify-callback`, callbackPayload);
      return response.data;
    } catch (error) {
      console.error(`Error in paymentService.verifyPaymentCallback (${paymentId}):`, error);
      throw error.response?.data || error;
    }
  },

  // 3. Retrieve authoritative payment status
  getPaymentStatus: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error in paymentService.getPaymentStatus (${paymentId}):`, error);
      throw error.response?.data || error;
    }
  }
};

export default paymentService;
