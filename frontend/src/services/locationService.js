// Kerala Districts List
export const KERALA_DISTRICTS = [
  'Kozhikode',
  'Wayanad',
  'Ernakulam',
  'Thiruvananthapuram',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kannur',
  'Kasaragod',
  'Idukki',
  'Kottayam',
  'Alappuzha',
  'Pathanamthitta',
  'Kollam'
];

// Major Indian Districts for quick reference
export const OTHER_MAJOR_DISTRICTS = [
  'Bengaluru Urban',
  'Bengaluru Rural',
  'Mysuru',
  'Mangaluru (Dakshina Kannada)',
  'Coimbatore',
  'Nilgiris',
  'Chennai',
  'Madurai',
  'Hyderabad',
  'Mumbai Suburban',
  'Pune',
  'Delhi'
];

// State & Country names that must NOT be entered as District
export const INVALID_DISTRICT_NAMES = [
  'india', 'bharat', 'united states', 'usa', 'us', 'united kingdom', 'uk', 'canada',
  'australia', 'uae', 'united arab emirates', 'saudi arabia', 'qatar', 'singapore', 'germany',
  'kerala', 'tamil nadu', 'karnataka', 'andhra pradesh', 'telangana', 'maharashtra',
  'gujarat', 'delhi', 'punjab', 'rajasthan', 'west bengal', 'goa', 'california', 'texas', 'new york'
];

// Fallback PIN code prefix to District & State mapping (for Kerala & South India)
const PIN_PREFIX_MAP = {
  '673': { district: 'Kozhikode', state: 'Kerala', country: 'India' },
  '670': { district: 'Kannur', state: 'Kerala', country: 'India' },
  '671': { district: 'Kasaragod', state: 'Kerala', country: 'India' },
  '676': { district: 'Malappuram', state: 'Kerala', country: 'India' },
  '678': { district: 'Palakkad', state: 'Kerala', country: 'India' },
  '679': { district: 'Palakkad', state: 'Kerala', country: 'India' },
  '680': { district: 'Thrissur', state: 'Kerala', country: 'India' },
  '682': { district: 'Ernakulam', state: 'Kerala', country: 'India' },
  '683': { district: 'Ernakulam', state: 'Kerala', country: 'India' },
  '685': { district: 'Idukki', state: 'Kerala', country: 'India' },
  '686': { district: 'Kottayam', state: 'Kerala', country: 'India' },
  '688': { district: 'Alappuzha', state: 'Kerala', country: 'India' },
  '689': { district: 'Pathanamthitta', state: 'Kerala', country: 'India' },
  '691': { district: 'Kollam', state: 'Kerala', country: 'India' },
  '695': { district: 'Thiruvananthapuram', state: 'Kerala', country: 'India' },
  '560': { district: 'Bengaluru Urban', state: 'Karnataka', country: 'India' },
  '600': { district: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  '641': { district: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  '500': { district: 'Hyderabad', state: 'Telangana', country: 'India' },
  '400': { district: 'Mumbai', state: 'Maharashtra', country: 'India' },
  '110': { district: 'Delhi', state: 'Delhi', country: 'India' }
};

export const locationService = {
  /**
   * Check if a given string is a state or country instead of a district
   */
  isInvalidDistrict(districtName) {
    if (!districtName) return false;
    const clean = districtName.trim().toLowerCase();
    return INVALID_DISTRICT_NAMES.includes(clean);
  },

  /**
   * Fetch location info (District, State, Country) by PIN code
  /**
   * Fetch location info (District, State, Country, Local Body, Lat/Lng) by PIN code
   */
  async fetchLocationByPinCode(pincode) {
    const cleanPin = String(pincode || '').trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      return null;
    }

    // 1. Try India Post API (Official Postal Directory)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          const cleanPlace = (po.Name || '').replace(/\s+(B\.O|S\.O|H\.O|\(BO\)|\(SO\)|\(HO\))$/i, '').trim();
          const blockName = (po.Block && po.Block !== 'NA') ? po.Block.trim() : '';

          let localBodyName = '';
          if (cleanPlace && cleanPlace.toLowerCase() !== (po.District || '').toLowerCase()) {
            localBodyName = `${cleanPlace} Panchayat`;
          } else if (blockName && blockName.toLowerCase() !== (po.District || '').toLowerCase()) {
            localBodyName = `${blockName} Panchayat`;
          } else if (cleanPlace) {
            localBodyName = `${cleanPlace} Municipality`;
          }

          return {
            district: po.District || po.Division || '',
            state: po.State || 'Kerala',
            country: po.Country || 'India',
            placeName: cleanPlace,
            village: cleanPlace,
            block: blockName,
            localBody: localBodyName,
            source: 'api'
          };
        }
      }
    } catch (err) {
      console.warn("India Post API fetch failed/timed out, attempting Nominatim fallback:", err);
    }

    // 2. Secondary Fallback: Nominatim OpenStreetMap Geocoding API
    try {
      const nomController = new AbortController();
      const nomTimeoutId = setTimeout(() => nomController.abort(), 3500);

      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${cleanPin}&country=India&format=json&addressdetails=1`,
        {
          signal: nomController.signal,
          headers: { 'User-Agent': 'TreeConnectApp/1.0' }
        }
      );
      clearTimeout(nomTimeoutId);

      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (Array.isArray(nomData) && nomData.length > 0) {
          const first = nomData[0];
          const addr = first.address || {};
          const dist = addr.state_district || addr.county || addr.city || addr.town || '';
          const state = addr.state || 'Kerala';
          const place = addr.suburb || addr.town || addr.village || addr.city || dist;
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);

          return {
            district: dist,
            state: state,
            country: 'India',
            placeName: place,
            village: place,
            localBody: place ? `${place} Panchayat` : '',
            latitude: !isNaN(lat) ? lat : undefined,
            longitude: !isNaN(lng) ? lng : undefined,
            source: 'nominatim'
          };
        }
      }
    } catch (err) {
      console.warn("Nominatim API PIN fetch failed:", err);
    }

    // 3. Fallback prefix lookup dictionary
    const prefix3 = cleanPin.substring(0, 3);
    if (PIN_PREFIX_MAP[prefix3]) {
      const fallbackData = PIN_PREFIX_MAP[prefix3];
      return {
        ...fallbackData,
        localBody: fallbackData.district ? `${fallbackData.district} Panchayat` : '',
        source: 'fallback'
      };
    }

    return null;
  },

  /**
   * Get default state and country for a known district
   */
  getDefaultsForDistrict(districtName) {
    if (!districtName) return { state: '', country: '' };
    const clean = districtName.trim();
    if (KERALA_DISTRICTS.some(d => d.toLowerCase() === clean.toLowerCase())) {
      return { state: 'Kerala', country: 'India' };
    }
    if (OTHER_MAJOR_DISTRICTS.some(d => d.toLowerCase() === clean.toLowerCase())) {
      if (clean.toLowerCase().includes('bengaluru')) return { state: 'Karnataka', country: 'India' };
      if (clean.toLowerCase().includes('chennai') || clean.toLowerCase().includes('coimbatore')) return { state: 'Tamil Nadu', country: 'India' };
      if (clean.toLowerCase().includes('mumbai') || clean.toLowerCase().includes('pune')) return { state: 'Maharashtra', country: 'India' };
      if (clean.toLowerCase().includes('hyderabad')) return { state: 'Telangana', country: 'India' };
      return { state: 'India', country: 'India' };
    }
    return { state: '', country: 'India' };
  }
};
