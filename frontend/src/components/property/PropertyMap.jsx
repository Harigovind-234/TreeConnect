import React, { useState, useEffect } from 'react';
import { MapPin, Search, Crosshair, CheckCircle2, Layers, Loader2, RefreshCw } from 'lucide-react';

const KERALA_DISTRICT_COORDS = {
  'Kottayam': { lat: 9.5916, lng: 76.5222, label: 'Kottayam, Kerala' },
  'Wayanad': { lat: 11.6854, lng: 76.1320, label: 'Kalpetta, Wayanad, Kerala' },
  'Idukki': { lat: 9.8497, lng: 76.9806, label: 'Painavu, Idukki, Kerala' },
  'Ernakulam': { lat: 9.9816, lng: 76.2999, label: 'Kochi, Ernakulam, Kerala' },
  'Thrissur': { lat: 10.5276, lng: 76.2144, label: 'Thrissur, Kerala' },
  'Palakkad': { lat: 10.7867, lng: 76.6548, label: 'Palakkad, Kerala' },
  'Kozhikode': { lat: 11.2588, lng: 75.7804, label: 'Kozhikode, Kerala' },
  'Malappuram': { lat: 11.0720, lng: 76.0740, label: 'Malappuram, Kerala' },
  'Kannur': { lat: 11.8745, lng: 75.3704, label: 'Kannur, Kerala' },
  'Kollam': { lat: 8.8932, lng: 76.6141, label: 'Kollam, Kerala' },
  'Alappuzha': { lat: 9.4981, lng: 76.3388, label: 'Alappuzha, Kerala' },
  'Pathanamthitta': { lat: 9.2648, lng: 76.7870, label: 'Pathanamthitta, Kerala' },
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366, label: 'Thiruvananthapuram, Kerala' },
  'Kasaragod': { lat: 12.5102, lng: 74.9852, label: 'Kasaragod, Kerala' }
};

const PropertyMap = ({ onCoordsChange, initialLat = 9.5916, initialLng = 76.5222, addressData }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [mapMode, setMapMode] = useState('live'); // 'live' or 'grid'
  const [locationStatus, setLocationStatus] = useState('');

  const [coords, setCoords] = useState({
    lat: initialLat,
    lng: initialLng,
    locationLabel: 'Meenachil, Pala, Kottayam'
  });

  // Reverse Geocode helper with AbortController 3s timeout to prevent hanging
  const reverseGeocode = async (lat, lng) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          const addr = data.address || {};
          const district = addr.state_district || addr.county || addr.city || addr.district || '';
          const state = addr.state || '';
          const village = addr.village || addr.town || addr.suburb || addr.hamlet || '';
          const postcode = addr.postcode || '';
          const address = addr.road || addr.suburb || addr.neighbourhood || village || data.display_name.split(',')[0] || '';

          return {
            label: data.display_name,
            details: { district, state, village, postcode, address }
          };
        }
      }
    } catch (err) {
      console.warn("Reverse geocoding timeout or error:", err);
    }
    return { label: `Location (${lat}, ${lng})`, details: null };
  };

  // Forward Geocode query helper
  const geocodeQuery = async (queryStr) => {
    if (!queryStr || !queryStr.trim()) return null;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr.trim())}&limit=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
      if (response.ok) {
        const results = await response.json();
        if (results && results.length > 0) {
          const item = results[0];
          const lat = parseFloat(parseFloat(item.lat).toFixed(6));
          const lng = parseFloat(parseFloat(item.lon).toFixed(6));
          const label = item.display_name;
          const { details } = await reverseGeocode(lat, lng);
          return { lat, lng, label, details };
        }
      }
    } catch (e) {
      console.warn("Geocoding failed for query:", queryStr, e);
    }
    return null;
  };

  // Auto-sync map location whenever user updates form location fields (district, localBody, village, pinCode, address)
  useEffect(() => {
    if (!addressData) return;

    const parts = [
      addressData.village,
      addressData.localBody,
      addressData.district,
      addressData.state || 'Kerala',
      addressData.pinCode
    ].filter(p => p && typeof p === 'string' && p.trim().length > 0 && !p.toLowerCase().includes('treeconnect address'));

    const queryStr = parts.join(', ');

    let isMounted = true;
    const timer = setTimeout(async () => {
      if (queryStr) {
        const geo = await geocodeQuery(queryStr);
        if (geo && isMounted) {
          setCoords({ lat: geo.lat, lng: geo.lng, locationLabel: geo.label });
          setIsPinned(true);
          if (onCoordsChange) onCoordsChange(geo.lat, geo.lng, geo.details);
          return;
        }
      }

      if (addressData.district && KERALA_DISTRICT_COORDS[addressData.district] && isMounted) {
        const dCoord = KERALA_DISTRICT_COORDS[addressData.district];
        const { label, details } = await reverseGeocode(dCoord.lat, dCoord.lng);
        if (isMounted) {
          setCoords({ lat: dCoord.lat, lng: dCoord.lng, locationLabel: label || dCoord.label });
          setIsPinned(true);
          if (onCoordsChange) onCoordsChange(dCoord.lat, dCoord.lng, details);
        }
      }
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [addressData?.district, addressData?.localBody, addressData?.village, addressData?.pinCode, addressData?.address]);

  // Fetch Location using device GPS API or CORS-friendly multi-provider IP fallbacks
  const fetchIPLocation = async () => {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch('https://ipwho.is/', { signal: controller.signal });
      clearTimeout(tid);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false && data.latitude && data.longitude) {
          return {
            lat: parseFloat(parseFloat(data.latitude).toFixed(6)),
            lng: parseFloat(parseFloat(data.longitude).toFixed(6)),
            label: `${data.city || data.region || 'Local Area'}, ${data.region || ''}`
          };
        }
      }
    } catch (e) { }

    const controller2 = new AbortController();
    const tid2 = setTimeout(() => controller2.abort(), 2500);
    try {
      const res2 = await fetch('https://freeipapi.com/api/json', { signal: controller2.signal });
      clearTimeout(tid2);
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && data2.latitude && data2.longitude) {
          return {
            lat: parseFloat(parseFloat(data2.latitude).toFixed(6)),
            lng: parseFloat(parseFloat(data2.longitude).toFixed(6)),
            label: `${data2.cityName || data2.regionName || ''}, ${data2.regionName || ''}`
          };
        }
      }
    } catch (e) { }

    return null;
  };

  const handleFetchLiveLocation = async () => {
    setIsLocating(true);
    setLocationStatus('Acquiring location...');

    const applyPosition = async (lat, lng, statusMsg) => {
      const initialLabel = `Lat: ${lat}°, Lng: ${lng}°`;
      setCoords({ lat, lng, locationLabel: initialLabel });
      setIsPinned(true);
      setIsLocating(false);
      setLocationStatus(statusMsg || 'Location pinned!');

      try {
        const { label, details } = await reverseGeocode(lat, lng);
        setCoords(prev => ({ ...prev, locationLabel: label || initialLabel }));
        if (onCoordsChange) onCoordsChange(lat, lng, details);
      } catch (e) {
        if (onCoordsChange) onCoordsChange(lat, lng, null);
      }

      setTimeout(() => setLocationStatus(''), 4000);
    };

    const resolveFallbackLocation = async () => {
      // 1. Multi-provider IP Geolocation (ipwho.is / freeipapi)
      setLocationStatus('Fetching network location...');
      const ipLoc = await fetchIPLocation();
      if (ipLoc) {
        await applyPosition(ipLoc.lat, ipLoc.lng, 'Live network location acquired!');
        return true;
      }

      // 2. Try Geocoding Property Address fields if entered by user
      if (addressData) {
        const parts = [
          addressData.address,
          addressData.village,
          addressData.localBody,
          addressData.district,
          addressData.state || 'Kerala',
          addressData.pinCode
        ].filter(p => p && typeof p === 'string' && p.trim().length > 0 && !p.toLowerCase().includes('treeconnect address'));

        if (parts.length > 0) {
          setLocationStatus('Geocoding property address...');
          const query = parts.join(', ');
          const geoRes = await geocodeQuery(query);
          if (geoRes) {
            applyPosition(
              geoRes.lat,
              geoRes.lng,
              `Pinned from property address (${addressData.district || 'Kerala'})`
            );
            return true;
          }
        }

        // 3. Try District Fallback
        const districtName = addressData.district;
        if (districtName && KERALA_DISTRICT_COORDS[districtName]) {
          const dCoord = KERALA_DISTRICT_COORDS[districtName];
          await applyPosition(dCoord.lat, dCoord.lng, `Pinned to ${districtName} District`);
          return true;
        }
      }

      // 4. Default Fallback
      const defaultLat = initialLat || 9.5916;
      const defaultLng = initialLng || 76.5222;
      await applyPosition(defaultLat, defaultLng, 'Location pinned');
      return false;
    };

    if (!navigator.geolocation) {
      await resolveFallbackLocation();
      return;
    }

    // Set a safety timeout of 3.5 seconds on browser Geolocation API
    let hasResponded = false;
    const gpsTimer = setTimeout(async () => {
      if (!hasResponded) {
        hasResponded = true;
        console.warn("Browser Geolocation timed out after 3.5s, switching to IP & address fallback...");
        await resolveFallbackLocation();
      }
    }, 3500);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (hasResponded) return;
        hasResponded = true;
        clearTimeout(gpsTimer);

        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        await applyPosition(lat, lng, 'Live GPS location acquired!');
      },
      async (error) => {
        if (hasResponded) return;
        hasResponded = true;
        clearTimeout(gpsTimer);

        console.warn("Browser GPS error or permission denied:", error);
        await resolveFallbackLocation();
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
    );
  };

  // Search Location using OpenStreetMap Nominatim
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );

      if (response.ok) {
        const results = await response.json();
        if (results && results.length > 0) {
          const item = results[0];
          const lat = parseFloat(parseFloat(item.lat).toFixed(6));
          const lng = parseFloat(parseFloat(item.lon).toFixed(6));
          const label = item.display_name;

          setCoords({ lat, lng, locationLabel: label });
          setIsPinned(true);

          const { details } = await reverseGeocode(lat, lng);
          if (onCoordsChange) onCoordsChange(lat, lng, details);
        } else {
          alert(`No location results found for "${searchQuery}"`);
        }
      }
    } catch (err) {
      console.error("Location search error:", err);
      alert("Error searching location. Please check network connection.");
    } finally {
      setIsSearching(false);
    }
  };

  // Manual Canvas Click
  const handleMapClick = async (e) => {
    if (mapMode === 'live') return; // Iframe handles standard map clicks in live mode
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const latDelta = (y / rect.height - 0.5) * -0.05;
    const lngDelta = (x / rect.width - 0.5) * 0.05;

    const newLat = parseFloat((coords.lat + latDelta).toFixed(6));
    const newLng = parseFloat((coords.lng + lngDelta).toFixed(6));

    const { label, details } = await reverseGeocode(newLat, newLng);

    setCoords({ lat: newLat, lng: newLng, locationLabel: label });
    setIsPinned(true);
    if (onCoordsChange) onCoordsChange(newLat, newLng, details);
  };

  // Generate OpenStreetMap Embed URL
  const getEmbedMapUrl = () => {
    const delta = 0.008;
    const bbox = `${coords.lng - delta}%2C${coords.lat - delta}%2C${coords.lng + delta}%2C${coords.lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`;
  };

  return (
    <div className="ld-card p-6 sm:p-8 space-y-6 shadow-2xl bg-[#0b1710] border border-emerald-500/20 rounded-xl">
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-emerald-500/20">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
            4. GIS Map &amp; Location Pin
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
            Fetch your live GPS coordinates or search your property location to pin exact boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {locationStatus && (
            <span className="text-xs text-emerald-400 font-semibold animate-pulse">
              {locationStatus}
            </span>
          )}

          {isPinned && (
            <span className="px-3 py-1.5 rounded-md bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow">
              <CheckCircle2 size={15} /> Location Pinned
            </span>
          )}
        </div>
      </div>

      {/* Map Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[280px] flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search town, village, district or landmark"
            style={{ height: '46px' }}
            className="text-sm px-4 rounded-lg bg-[#050e08] border-2 border-emerald-600/30 text-white placeholder-slate-500 flex-1 focus:outline-none focus:border-emerald-400 font-medium"
          />
          <button
            type="submit"
            style={{ height: '46px' }}
            disabled={isSearching}
            className="px-4 bg-[#0a1810] hover:bg-[#0f2418] text-white border border-emerald-600/40 text-sm rounded-lg flex items-center gap-1.5 font-bold cursor-pointer transition-all shrink-0"
          >
            {isSearching ? <Loader2 size={15} className="animate-spin text-emerald-400" /> : <Search size={15} />}
            Search
          </button>
        </form>

        {/* FETCH LIVE GPS LOCATION BUTTON */}
        <button
          type="button"
          onClick={handleFetchLiveLocation}
          style={{ height: '46px' }}
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm px-5 rounded-lg flex items-center gap-2 font-bold shadow-md shadow-emerald-950/80 border border-emerald-400/30 cursor-pointer transition-all shrink-0"
          disabled={isLocating}
        >
          <Crosshair size={16} className={isLocating ? 'animate-spin text-white' : 'text-white'} />
          {isLocating ? 'Acquiring GPS...' : 'Fetch Live Location'}
        </button>

        {/* MAP VIEW MODE TOGGLE */}
        <button
          type="button"
          onClick={() => setMapMode(prev => prev === 'live' ? 'grid' : 'live')}
          style={{ height: '46px' }}
          className="bg-[#0a1810] hover:bg-[#0f2418] text-slate-300 hover:text-white border border-emerald-600/40 text-xs font-bold px-4 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
          title="Toggle between OpenStreetMap and High Contrast Grid"
        >
          <Layers size={15} className="text-emerald-400" />
          {mapMode === 'live' ? 'Map Mode' : 'Grid Mode'}
        </button>
      </div>

      {/* Interactive GIS Map Container */}
      <div className="relative w-full rounded-xl overflow-hidden border-2 border-emerald-600/40 bg-[#040a06] shadow-2xl flex flex-col justify-between" style={{ height: '360px' }}>
        
        {/* Map Header Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs z-20 pointer-events-none">
          <span className="bg-[#050e08]/90 backdrop-blur px-3 py-1.5 rounded-md border border-emerald-700/60 flex items-center gap-1.5 font-bold text-white shadow pointer-events-auto">
            <MapPin size={14} className="text-emerald-400" /> 
            {mapMode === 'live' ? 'Live GIS OpenStreetMap View' : 'Interactive Satellite Grid'}
          </span>

          <span className="bg-emerald-950/80 text-emerald-300 backdrop-blur px-3 py-1.5 rounded-md text-xs font-extrabold border border-emerald-700/60 shadow pointer-events-auto flex items-center gap-1.5">
            <RefreshCw size={13} className={isLocating ? 'animate-spin' : ''} />
            {isLocating ? 'Pinning GPS...' : 'Live GPS Ready'}
          </span>
        </div>

        {/* MAP CONTENT */}
        {mapMode === 'live' ? (
          <div className="w-full h-full relative">
            <iframe
              key={`${coords.lat}-${coords.lng}`}
              title="OpenStreetMap GIS Location"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={getEmbedMapUrl()}
              className="w-full h-full filter contrast-[1.05] brightness-[0.95]"
            ></iframe>
          </div>
        ) : (
          <div
            onClick={handleMapClick}
            className="w-full h-full relative cursor-crosshair flex flex-col justify-between p-4"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.18) 0%, rgba(5, 14, 8, 0.96) 80%), linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
              backgroundSize: '100% 100%, 28px 28px, 28px 28px'
            }}
          >
            {/* Center Pin Marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg animate-bounce">
                <MapPin size={24} className="text-emerald-400 fill-emerald-400/40" />
              </div>
            </div>
          </div>
        )}

        {/* Coordinates Details Bar */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between text-xs z-20 bg-[#050e08]/95 backdrop-blur px-4 py-2.5 rounded-lg border border-emerald-700/60 shadow-xl gap-2">
          <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
            <MapPin size={15} className="text-emerald-400 flex-shrink-0" />
            <span className="font-semibold text-white truncate text-xs">
              {coords.locationLabel}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-emerald-400 font-extrabold text-xs ml-auto">
            <span>Lat: {coords.lat}°</span>
            <span>Lng: {coords.lng}°</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyMap;
