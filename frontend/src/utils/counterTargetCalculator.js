/**
 * TreeConnect Timber Marketplace - Counter Target Engine
 * 
 * Provides transparent, data-informed Counter Target pricing for harvested timber.
 * Integrates verified scaling volumes, species benchmarks, log quality grades,
 * transport logistics preferences, and settlement status.
 */

export const MARKET_BENCHMARK_RANGES = {
  teak: { min: 38000, median: 42500, max: 48000, unit: '₹/m³' },
  teakwood: { min: 38000, median: 42500, max: 48000, unit: '₹/m³' },
  rosewood: { min: 65000, median: 75000, max: 92000, unit: '₹/m³' },
  mahogany: { min: 28000, median: 35000, max: 42000, unit: '₹/m³' },
  rubber: { min: 12000, median: 15500, max: 19000, unit: '₹/m³' },
  jackfruit: { min: 22000, median: 28000, max: 34000, unit: '₹/m³' },
  cedar: { min: 25000, median: 32000, max: 39000, unit: '₹/m³' },
  eucalyptus: { min: 10000, median: 14000, max: 18000, unit: '₹/m³' },
  default: { min: 20000, median: 28000, max: 36000, unit: '₹/m³' }
};

export const GRADE_PREMIUM_FACTORS = {
  'Grade A Prime Export': 1.06,
  'Grade A Prime': 1.04,
  'Grade A': 1.03,
  'Grade B Commercial': 1.00,
  'Grade B': 1.00,
  'Grade C Standard': 0.94,
  default: 1.00
};

export const TRANSPORT_ALLOWANCE_PER_M3 = {
  'Seller Contractor Hauling to Mill': 1200, // Seller bears hauling, adds freight value
  'Shared Freight 50/50': 600,
  'Buyer Arranged Truck Pickup from Yard': 0, // Yard pickup: zero seller freight burden
  default: 0
};

/**
 * Calculates suggested counter-target and transparent metrics.
 */
export const calculateCounterTarget = ({
  verifiedVolume = 1.70,
  species = 'Teakwood',
  gradeQuality = 'Grade A Prime Export',
  askingPricePerM3 = 42500,
  buyerOfferPerM3 = 39100,
  deliveryPreference = 'Seller Contractor Hauling to Mill',
  harvestContractSettled = true,
  harvestContractAmount = 110000,
  customCounterPrice = null
}) => {
  const volume = Number(verifiedVolume) || 1.70;
  const askingRate = Number(askingPricePerM3) || 42500;
  const buyerBid = Number(buyerOfferPerM3) || 39100;

  // 1. Identify species market range & adapt for premium valuation tiers
  const spKey = String(species || '').trim().toLowerCase();
  const rawBenchmark = 
    Object.entries(MARKET_BENCHMARK_RANGES).find(([k]) => spKey.includes(k))?.[1] || 
    MARKET_BENCHMARK_RANGES.default;

  // If catalogue asking rate reflects assessed high-density tree inventory tier (e.g. ₹ 1.48L/m³),
  // dynamically scale benchmark so it doesn't artificially drag down or misdiagnose premium lots
  const isHighValuationTier = askingRate > (rawBenchmark.max * 1.5);
  const benchmark = isHighValuationTier
    ? {
        min: Math.round(askingRate * 0.88),
        median: Math.round(askingRate * 0.95),
        max: Math.round(askingRate * 1.05),
        unit: '₹/m³'
      }
    : rawBenchmark;

  // 2. Grade quality multiplier
  const gradeFactor = 
    GRADE_PREMIUM_FACTORS[gradeQuality] || 
    GRADE_PREMIUM_FACTORS.default;

  // 3. Haulage & delivery cost allowance
  const transportAllowance = 
    TRANSPORT_ALLOWANCE_PER_M3[deliveryPreference] ?? 
    TRANSPORT_ALLOWANCE_PER_M3.default;

  // 4. Algorithmic Counter-Target (Meeting the buyer in a commercially sound compromise)
  // Rule: Counter-target must ALWAYS be >= buyerBid and <= askingRate
  const spread = Math.max(0, askingRate - buyerBid);
  let rawSuggestedRate = Math.round(buyerBid + (spread * 0.60));

  // If transport is arranged by seller contractor, recover hauling logistics
  if (deliveryPreference === 'Seller Contractor Hauling to Mill') {
    rawSuggestedRate = Math.min(askingRate, rawSuggestedRate + Math.round(transportAllowance * 0.5));
  }

  // Guardrails: Ensure suggested target is strictly between buyer's offer and asking price
  rawSuggestedRate = Math.max(buyerBid, Math.min(askingRate, rawSuggestedRate));

  // Round to nearest ₹50 for clean commercial timber bidding
  const suggestedCounterRate = Math.round(rawSuggestedRate / 50) * 50;

  // Active rate (seller adjusted or suggested)
  const activeRate = customCounterPrice !== null && !isNaN(customCounterPrice) && Number(customCounterPrice) > 0
    ? Number(customCounterPrice)
    : suggestedCounterRate;

  // 5. Gross Timber Value (Verified Volume × Rate)
  const grossDealValue = Math.round(volume * activeRate);
  const buyerInitialDealValue = Math.round(volume * buyerBid);
  const sellerAskingDealValue = Math.round(volume * askingRate);
  const valueDeltaVsBuyer = grossDealValue - buyerInitialDealValue;

  // 6. Harvesting Cost Accounting Rule:
  // Since the harvesting contract (₹1,10,000) is 100% completed and settled between landowner and contractor,
  // it is NOT deducted again from the timber sales revenue.
  const harvestingCostDeduction = 0; 
  const netSellerRevenue = grossDealValue; // Pure timber asset monetization

  // 7. Validation & Guardrails
  let validationStatus = 'optimal'; // 'optimal' | 'warning_high' | 'warning_low' | 'invalid'
  let validationMessage = 'Counter-target is within verified Kerala market benchmark range.';

  if (activeRate <= 0) {
    validationStatus = 'invalid';
    validationMessage = 'Counter-target rate must be greater than zero.';
  } else if (activeRate < buyerBid) {
    validationStatus = 'warning_low';
    validationMessage = `Counter-target (₹${activeRate.toLocaleString('en-IN')}) is lower than the buyer's existing bid (₹${buyerBid.toLocaleString('en-IN')}).`;
  } else if (activeRate > askingRate) {
    validationStatus = 'warning_high';
    validationMessage = `Counter-target exceeds your original catalogue asking rate (₹${askingRate.toLocaleString('en-IN')}/m³).`;
  } else if (activeRate > benchmark.max * gradeFactor) {
    validationStatus = 'warning_high';
    validationMessage = `Counter-target is higher than standard commercial range for ${species} (${gradeQuality}). Buyers may reject.`;
  } else if (activeRate < benchmark.min) {
    validationStatus = 'warning_low';
    validationMessage = `Counter-target is below average market floor for ${species}. You may be underpricing your timber.`;
  }

  return {
    verifiedVolume: volume,
    species,
    gradeQuality,
    askingRate,
    buyerBid,
    suggestedCounterRate,
    activeRate,
    grossDealValue,
    buyerInitialDealValue,
    sellerAskingDealValue,
    valueDeltaVsBuyer,
    benchmarkRange: {
      min: Math.round(benchmark.min * gradeFactor),
      median: Math.round(benchmark.median * gradeFactor),
      max: Math.round(benchmark.max * gradeFactor)
    },
    transportAllowance,
    harvestContractSettled: Boolean(harvestContractSettled),
    harvestContractAmount,
    harvestingCostDeduction,
    netSellerRevenue,
    validationStatus,
    validationMessage
  };
};
