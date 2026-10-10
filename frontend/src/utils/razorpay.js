let razorpayScriptPromise = null;

/**
 * Dynamically loads the official Razorpay Checkout SDK script safely.
 * Returns a Promise that resolves to true if loaded or window.Razorpay is available.
 */
export const loadRazorpay = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve, reject) => {
    // Check if already in DOM
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => {
        razorpayScriptPromise = null;
        reject(new Error('Failed to load Razorpay Checkout script.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      razorpayScriptPromise = null;
      document.body.removeChild(script);
      reject(new Error('Failed to load Razorpay Checkout SDK from CDN.'));
    };

    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};
