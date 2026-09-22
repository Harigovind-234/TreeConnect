/**
 * Utility functions for Timber Reference Rate & Approximate Timber Value calculations.
 * Standardized across Tree Inventory, Harvest Requests, and Marketplace.
 *
 * Source of truth for reference rates: Kerala Government timber market reference data.
 */

export const DEFAULT_TIMBER_RATES_MAP = {
  teak: 139490,
  teakwood: 139490,
  rosewood: 210000,
  mahogany: 85000,
  rubber: 38000,
  sandalwood: 350000,
  coconut: 22000,
  jackfruit: 45000,
  eucalyptus: 28000,
  pine: 32000,
  'western red cedar': 65000,
  cedar: 65000,
  'douglas fir': 55000,
  mango: 32000,
  other: 30000
};

/**
 * Get timber reference rate (₹/m³) for a given tree species.
 * Defaults to ₹139,490 / m³ for Teak / Teakwood, or ₹30,000 for unknown species.
 */
export const getTimberReferenceRate = (species = 'Teak') => {
  if (!species) return 139490;
  const spLower = String(species).trim().toLowerCase();

  if (spLower.includes('sandalwood')) return 350000;
  if (spLower.includes('rosewood')) return 210000;
  if (spLower.includes('teak')) return 139490;
  if (spLower.includes('mahogany')) return 85000;
  if (spLower.includes('cedar')) return 65000;
  if (spLower.includes('douglas')) return 55000;
  if (spLower.includes('jackfruit')) return 45000;
  if (spLower.includes('rubber')) return 38000;
  if (spLower.includes('pine')) return 32000;
  if (spLower.includes('mango')) return 32000;
  if (spLower.includes('eucalyptus')) return 28000;
  if (spLower.includes('coconut')) return 22000;

  return 30000;
};

/**
 * Safely parse numeric estimated volume in m³ from string or number.
 * e.g. "1.50 m³" -> 1.5, "1.8 m³" -> 1.8, 1.5 -> 1.5
 */
export const parseVolumeNumber = (volumeInput) => {
  if (volumeInput === undefined || volumeInput === null || volumeInput === '') return 0;
  if (typeof volumeInput === 'number') return isNaN(volumeInput) ? 0 : volumeInput;
  const str = String(volumeInput).trim();
  const match = str.match(/[\d.]+/);
  if (!match) return 0;
  const num = parseFloat(match[0]);
  return isNaN(num) ? 0 : num;
};

/**
 * Calculate approximate timber value (Approx. Value = Estimated Volume * Reference Rate)
 * Volume (m³) * Reference Rate (₹/m³) = Approx Timber Value (₹)
 */
export const calculateApproxTimberValue = (species = 'Teak', volumeInput = 0, customRate = null) => {
  const vol = parseVolumeNumber(volumeInput);
  const rate = (customRate !== null && customRate !== undefined && !isNaN(customRate))
    ? Number(customRate)
    : getTimberReferenceRate(species);
  return Math.round(vol * rate);
};

/**
 * Format currency to Indian Rupee (INR) format (e.g. ₹ 2,09,235)
 */
export const formatINR = (amount) => {
  const num = Number(amount) || 0;
  return `₹ ${num.toLocaleString('en-IN')}`;
};

/**
 * Standard disclaimer message for inventory & harvest request timber value estimates
 */
export const TIMBER_VALUE_DISCLAIMER = "*Approximate reference value only. Final timber value will be determined after contractor site inspection, assessment, and negotiation.*";
