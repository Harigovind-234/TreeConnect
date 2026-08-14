import React, { useState, useEffect } from 'react';
import { MapPin, Search, Crosshair, CheckCircle2, Layers, Loader2, RefreshCw } from 'lucide-react';

const PropertyMap = ({ onCoordsChange, initialLat = 9.5916, initialLng = 76.5222 }) => {
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

  // Reverse Geocode helper using OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en' } }
      );
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
      console.warn("Reverse geocoding error:", err);
    }
    return { label: `Location (${lat}, ${lng})`, details: null };
  };

  // Fetch Live GPS Location using browser geolocation API
  const handleFetchLiveLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Accessing device GPS...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));

        setLocationStatus('Fetching address details...');
        const { label, details } = await reverseGeocode(lat, lng);

        setCoords({ lat, lng, locationLabel: label });
        setIsPinned(true);
        setIsLocating(false);
        setLocationStatus('Live location acquired!');

        if (onCoordsChange) onCoordsChange(lat, lng, details);

        setTimeout(() => setLocationStatus(''), 3000);
      },
      (error) => {
        console.error("GPS location error:", error);
        setIsLocating(false);
        setLocationStatus('');
        
        let errorMsg = 'Failed to fetch live location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. Please allow location access in your browser.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information unavailable from device GPS.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out. Please try again.';
        }
        alert(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
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
    <div className="card p-7 border border-color rounded-[16px] bg-card space-y-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-main tracking-tight flex items-center gap-2">
            4. GIS Map &amp; Location Pin
          </h2>
          <p className="text-[15px] text-muted mt-1">
            Fetch your live GPS coordinates or search your property location to pin exact boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {locationStatus && (
            <span className="text-xs text-emerald font-semibold animate-pulse">
              {locationStatus}
            </span>
          )}

          {isPinned && (
            <span className="px-3 py-1 rounded-full bg-emerald/15 border border-emerald/40 text-emerald text-[13px] font-bold flex items-center gap-1.5 shadow">
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
            className="form-input text-[14px] px-4 rounded-[10px] bg-surface/60 border-color flex-1"
          />
          <button
            type="submit"
            style={{ height: '46px' }}
            disabled={isSearching}
            className="btn btn-secondary text-[14px] px-4 rounded-[10px] flex items-center gap-1.5 font-semibold hover:border-emerald transition-all"
          >
            {isSearching ? <Loader2 size={15} className="animate-spin text-emerald" /> : <Search size={15} />}
            Search
          </button>
        </form>

        {/* FETCH LIVE GPS LOCATION BUTTON */}
        <button
          type="button"
          onClick={handleFetchLiveLocation}
          style={{ height: '46px' }}
          className="btn btn-primary text-[14px] px-5 rounded-[10px] flex items-center gap-2 font-bold shadow-glow border border-emerald/50"
          disabled={isLocating}
        >
          <Crosshair size={16} className={isLocating ? 'animate-spin text-dark' : 'text-dark'} />
          {isLocating ? 'Acquiring GPS...' : 'Fetch Live Location'}
        </button>

        {/* MAP VIEW MODE TOGGLE */}
        <button
          type="button"
          onClick={() => setMapMode(prev => prev === 'live' ? 'grid' : 'live')}
          style={{ height: '46px' }}
          className="btn btn-secondary text-[13px] px-3.5 rounded-[10px] flex items-center gap-1.5 font-semibold text-muted hover:text-main"
          title="Toggle between OpenStreetMap and High Contrast Grid"
        >
          <Layers size={15} className="text-emerald" />
          {mapMode === 'live' ? 'Map Mode' : 'Grid Mode'}
        </button>
      </div>

      {/* Interactive GIS Map Container */}
      <div className="relative w-full rounded-[14px] overflow-hidden border-2 border-emerald/40 bg-dark shadow-md flex flex-col justify-between" style={{ height: '360px' }}>
        
        {/* Map Header Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[12px] text-muted z-20 pointer-events-none">
          <span className="bg-dark/90 backdrop-blur px-3 py-1.5 rounded-lg border border-color flex items-center gap-1.5 font-semibold text-main shadow pointer-events-auto">
            <MapPin size={14} className="text-emerald" /> 
            {mapMode === 'live' ? 'Live GIS OpenStreetMap View' : 'Interactive Satellite Grid'}
          </span>

          <span className="bg-emerald/20 text-emerald backdrop-blur px-3 py-1.5 rounded-lg text-[12px] font-bold border border-emerald/30 shadow pointer-events-auto flex items-center gap-1">
            <RefreshCw size={12} className={isLocating ? 'animate-spin' : ''} />
            {isLocating ? 'Pinning GPS...' : 'Live GPS Ready'}
          </span>
        </div>

        {/* MAP CONTENT */}
        {mapMode === 'live' ? (
          <div className="w-full h-full relative">
            <iframe
              title="OpenStreetMap GIS Location"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={getEmbedMapUrl()}
              className="w-full h-full rounded-[12px] filter contrast-[1.05] brightness-[0.95]"
            ></iframe>
          </div>
        ) : (
          <div
            onClick={handleMapClick}
            className="w-full h-full relative cursor-crosshair flex flex-col justify-between p-4"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.18) 0%, rgba(10, 15, 13, 0.96) 80%), linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
              backgroundSize: '100% 100%, 28px 28px, 28px 28px'
            }}
          >
            {/* Center Pin Marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
              <div className="w-12 h-12 rounded-full bg-emerald/20 border-2 border-emerald flex items-center justify-center shadow-glow animate-bounce">
                <MapPin size={24} className="text-emerald fill-emerald/40" />
              </div>
            </div>
          </div>
        )}

        {/* Coordinates Details Bar */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between text-[13px] text-muted z-20 bg-dark/95 backdrop-blur px-4 py-2.5 rounded-[10px] border border-emerald/30 shadow-lg gap-2">
          <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
            <MapPin size={15} className="text-emerald flex-shrink-0" />
            <span className="font-semibold text-main truncate text-[13px]">
              {coords.locationLabel}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-emerald font-bold text-[13px] ml-auto">
            <span>Lat: {coords.lat}°</span>
            <span>Lng: {coords.lng}°</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyMap;
