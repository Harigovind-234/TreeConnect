import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Check, Crosshair } from 'lucide-react';

const LocationPicker = ({ value, onChange }) => {
  const [selectedCoords, setSelectedCoords] = useState(value || { lat: 9.5916, lng: 76.5222, addressStr: 'Kottayam, Kerala' });
  const [isPicking, setIsPicking] = useState(false);

  // Preset location pin choices
  const presets = [
    { label: 'Kottayam, Kerala', lat: 9.5916, lng: 76.5222 },
    { label: 'Pala, Kottayam', lat: 9.7099, lng: 76.6836 },
    { label: 'Linn County, Oregon', lat: 44.3976, lng: -122.7362 },
    { label: 'Way anad, Kerala', lat: 11.6854, lng: 76.1320 },
    { label: 'Idukki, Kerala', lat: 9.8494, lng: 76.9810 }
  ];

  const handlePresetSelect = (p) => {
    const coords = { lat: p.lat, lng: p.lng, addressStr: p.label };
    setSelectedCoords(coords);
    if (onChange) {
      onChange(`${p.lat.toFixed(4)}° N, ${p.lng.toFixed(4)}° E (${p.label})`);
    }
  };

  const handleManualLatChange = (newLat) => {
    const coords = { ...selectedCoords, lat: parseFloat(newLat) || 0 };
    setSelectedCoords(coords);
    if (onChange) onChange(`${coords.lat}° N, ${coords.lng}° E`);
  };

  const handleManualLngChange = (newLng) => {
    const coords = { ...selectedCoords, lng: parseFloat(newLng) || 0 };
    setSelectedCoords(coords);
    if (onChange) onChange(`${coords.lat}° N, ${coords.lng}° E`);
  };

  const handleSimulateGPS = () => {
    setIsPicking(true);
    setTimeout(() => {
      const lat = parseFloat((9.59 + Math.random() * 0.2).toFixed(4));
      const lng = parseFloat((76.52 + Math.random() * 0.2).toFixed(4));
      const coords = { lat, lng, addressStr: 'Detected GPS Location' };
      setSelectedCoords(coords);
      if (onChange) onChange(`${lat}° N, ${lng}° E (GPS Live Lock)`);
      setIsPicking(false);
    }, 600);
  };

  return (
    <div className="location-picker-container bg-surface border border-color rounded-md p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <label className="text-sm font-semibold flex items-center gap-2 text-main">
          <MapPin size={16} className="text-emerald" /> Interactive Property Location & Map Coordinates
        </label>
        <button
          type="button"
          onClick={handleSimulateGPS}
          className="btn btn-secondary btn-xs flex items-center gap-1"
          disabled={isPicking}
        >
          <Crosshair size={13} className={isPicking ? 'animate-spin text-emerald' : 'text-emerald'} />
          {isPicking ? 'Locating...' : '📍 Auto-detect GPS'}
        </button>
      </div>

      {/* Simulated Interactive Map Display Card */}
      <div 
        className="map-interactive-box relative w-full h-44 rounded-lg overflow-hidden border border-emerald/30 bg-dark mb-3 cursor-crosshair flex flex-col justify-between p-3"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.12) 0%, rgba(10, 15, 13, 0.95) 75%), linear-gradient(0deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '100% 100%, 24px 24px, 24px 24px'
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const lat = parseFloat((9.50 + (y / rect.height) * 0.2).toFixed(4));
          const lng = parseFloat((76.40 + (x / rect.width) * 0.3).toFixed(4));
          const coords = { lat, lng, addressStr: 'Selected on Map' };
          setSelectedCoords(coords);
          if (onChange) onChange(`${lat}° N, ${lng}° E`);
        }}
      >
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1 bg-dark/80 px-2 py-1 rounded border border-color">
            <Compass size={12} className="text-emerald" /> Satellite Map Grid
          </span>
          <span className="bg-emerald/20 text-emerald px-2 py-0.5 rounded font-mono font-medium text-[11px]">
            Click map to pin
          </span>
        </div>

        {/* Center Animated Target Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-8 h-8 rounded-full bg-emerald/20 animate-ping"></div>
            <div className="w-8 h-8 rounded-full bg-emerald/30 border border-emerald flex items-center justify-center">
              <MapPin size={18} className="text-emerald fill-emerald/30" />
            </div>
          </div>
          <span className="bg-dark/95 border border-emerald/50 text-emerald font-mono text-[11px] px-2 py-0.5 rounded shadow mt-1">
            {selectedCoords.lat}° N, {selectedCoords.lng}° E
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted z-10">
          <span>{selectedCoords.addressStr || 'Selected Boundary Pin'}</span>
          <span className="font-mono text-emerald">Precision: 2.4m</span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="mb-3">
        <span className="text-xs text-muted block mb-1.5 font-medium">Quick Location Presets:</span>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => {
            const isSelected = selectedCoords.addressStr === p.label;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => handlePresetSelect(p)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                  isSelected
                    ? 'bg-emerald/20 border-emerald text-emerald font-medium'
                    : 'bg-dark/50 border-color text-muted hover:text-main hover:border-emerald/40'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Input Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Latitude (°N)</label>
          <input
            type="number"
            step="0.0001"
            value={selectedCoords.lat}
            onChange={(e) => handleManualLatChange(e.target.value)}
            className="form-input text-xs font-mono"
            placeholder="e.g. 9.5916"
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Longitude (°E)</label>
          <input
            type="number"
            step="0.0001"
            value={selectedCoords.lng}
            onChange={(e) => handleManualLngChange(e.target.value)}
            className="form-input text-xs font-mono"
            placeholder="e.g. 76.5222"
          />
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
