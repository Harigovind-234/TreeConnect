import { useState, useCallback, useRef } from 'react';
import { loadRazorpay } from '../utils/razorpay';
import paymentService from '../services/paymentService';

export const PAYMENT_STATES = {
  IDLE: 'IDLE',
  LOADING_SCRIPT: 'LOADING_SCRIPT',
  CREATING_ORDER: 'CREATING_ORDER',
  CHECKOUT_OPEN: 'CHECKOUT_OPEN',
  VERIFYING: 'VERIFYING',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION'
};

export const useRazorpayCheckout = () => {
  const [paymentState, setPaymentState] = useState(PAYMENT_STATES.IDLE);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activePayment, setActivePayment] = useState(null);
  const isProcessingRef = useRef(false);

  const pollPaymentStatus = async (paymentId, maxRetries = 5, delayMs = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await new Promise((res) => setTimeout(res, delayMs));
        const statusRes = await paymentService.getPaymentStatus(paymentId);
        if (statusRes?.status === 'VERIFIED') {
          setPaymentState(PAYMENT_STATES.VERIFIED);
          return statusRes;
        }
        if (statusRes?.status === 'FAILED') {
          setPaymentState(PAYMENT_STATES.FAILED);
          setErrorMessage(statusRes?.failure_reason || 'Payment could not be verified by gateway.');
          return statusRes;
        }
      } catch (err) {
        console.warn(`Polling payment status attempt ${attempt} error:`, err);
      }
    }
    setPaymentState(PAYMENT_STATES.PENDING_CONFIRMATION);
    return null;
  };

  const startCheckout = useCallback(async ({
    requestId,
    harvestRequest,
    user,
    onSuccess,
    onFailure,
    onCancel
  }) => {
    if (isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    setErrorMessage(null);

    try {
      // 1. Ensure Razorpay Checkout SDK is loaded
      setPaymentState(PAYMENT_STATES.LOADING_SCRIPT);
      const isLoaded = await loadRazorpay();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Unable to load Razorpay payment gateway SDK. Please check your internet connection.');
      }

      // 2. Initialize Order from Backend
      setPaymentState(PAYMENT_STATES.CREATING_ORDER);
      const orderData = await paymentService.createAdvanceOrder(requestId);
      setActivePayment(orderData);

      // 3. Prepare Checkout Modal Options
      const options = {
        key: orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Fur0pLo5d2MztK',
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'TreeConnect Forestry',
        description: `Advance Mobilization Payment (${orderData.advance_percentage || 27}%)`,
        order_id: orderData.order_id,
        prefill: {
          name: user?.name || user?.fullName || harvestRequest?.ownerName || '',
          email: user?.email || harvestRequest?.owner_email || '',
          contact: user?.phone || harvestRequest?.contactNumber || ''
        },
        notes: {
          harvest_request_id: requestId,
          payment_id: orderData.payment_id
        },
        theme: {
          color: '#10b981' // Emerald primary brand color
        },
        modal: {
          ondismiss: function () {
            // User closed the Razorpay popup without finishing
            isProcessingRef.current = false;
            setPaymentState((current) => {
              if (current !== PAYMENT_STATES.VERIFIED && current !== PAYMENT_STATES.VERIFYING) {
                if (onCancel) onCancel();
                return PAYMENT_STATES.CANCELLED;
              }
              return current;
            });
          }
        },
        handler: async function (response) {
          // Authoritative Server-side Verification
          setPaymentState(PAYMENT_STATES.VERIFYING);
          try {
            const verificationResult = await paymentService.verifyPaymentCallback(
              orderData.payment_id,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            );

            if (verificationResult?.status === 'VERIFIED') {
              setPaymentState(PAYMENT_STATES.VERIFIED);
              setActivePayment(verificationResult);
              isProcessingRef.current = false;
              if (onSuccess) onSuccess(verificationResult);
            } else {
              // Status ambiguous or pending; poll
              const polled = await pollPaymentStatus(orderData.payment_id);
              isProcessingRef.current = false;
              if (polled?.status === 'VERIFIED' && onSuccess) {
                onSuccess(polled);
              }
            }
          } catch (verifyError) {
            console.error('Error during payment callback verification:', verifyError);
            // Initiate background polling before declaring terminal failure
            const polled = await pollPaymentStatus(orderData.payment_id);
            isProcessingRef.current = false;
            if (polled?.status === 'VERIFIED') {
              if (onSuccess) onSuccess(polled);
            } else {
              setPaymentState(PAYMENT_STATES.FAILED);
              const msg = verifyError?.message || 'Payment verification failed on the server.';
              setErrorMessage(msg);
              if (onFailure) onFailure(verifyError);
            }
          }
        }
      };

      // 4. Open Razorpay Checkout modal
      setPaymentState(PAYMENT_STATES.CHECKOUT_OPEN);
      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        isProcessingRef.current = false;
        setPaymentState(PAYMENT_STATES.FAILED);
        const failMsg = resp.error?.description || 'Payment authorization failed at the gateway.';
        setErrorMessage(failMsg);
        if (onFailure) onFailure(resp.error);
      });
      rzpInstance.open();

    } catch (err) {
      isProcessingRef.current = false;
      setPaymentState(PAYMENT_STATES.FAILED);
      const errText = err.message || 'Failed to initialize payment checkout.';
      setErrorMessage(errText);
      if (onFailure) onFailure(err);
    }
  }, []);

  const resetPaymentState = useCallback(() => {
    isProcessingRef.current = false;
    setPaymentState(PAYMENT_STATES.IDLE);
    setErrorMessage(null);
  }, []);

  return {
    paymentState,
    errorMessage,
    activePayment,
    isLoading: [
      PAYMENT_STATES.LOADING_SCRIPT,
      PAYMENT_STATES.CREATING_ORDER,
      PAYMENT_STATES.VERIFYING
    ].includes(paymentState),
    isVerifying: paymentState === PAYMENT_STATES.VERIFYING,
    isSuccess: paymentState === PAYMENT_STATES.VERIFIED,
    startCheckout,
    resetPaymentState
  };
};

export default useRazorpayCheckout;
