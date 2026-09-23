import React from 'react';
import { Loader2, CheckCircle2, MapPin } from 'lucide-react';

const PropertyLocationForm = ({
  formData,
  onChange,
  errors,
  isFetchingPin,
  pinStatusMessage,
  onFetchPinLocation
}) => {
  const stateOptions = Array.from(new Set([
    formData.state,
    'Kerala',
    'Oregon',
    'Karnataka',
    'Tamil Nadu',
    'Goa',
    'Maharashtra',
    'Washington'
  ])).filter(Boolean);

  const districtOptions = Array.from(new Set([
    formData.district,
    'Kottayam',
    'Wayanad',
    'Idukki',
    'Ernakulam',
    'Thrissur',
    'Palakkad',
    'Kozhikode',
    'Malappuram',
    'Kannur',
    'Kollam',
    'Alappuzha',
    'Pathanamthitta',
    'Thiruvananthapuram',
    'Kasaragod',
    'Linn County',
    'Benton County'
  ])).filter(Boolean);

  return (
    <div className="ld-card p-6 sm:p-8 space-y-6 shadow-2xl bg-[#0b1710] border border-emerald-500/20 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-5 border-b border-emerald-500/20">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
            3. Property Location &amp; Address
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
            Provide the property's location so contractors can locate it when a site survey is arranged.
          </p>
        </div>

        <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1.5 rounded-md shrink-0">
          ✓ Pre-filled from Account Profile
        </span>
      </div>

      <div className="space-y-5">
        {/* Row 1: State & District */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="ld-label">
              STATE <span className="text-rose-400 font-bold">*</span>
            </label>
            <select
              name="state"
              value={formData.state || ''}
              onChange={onChange}
              className={`ld-select ${errors?.state ? 'border-rose-500' : ''}`}
            >
              {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors?.state && (
              <p className="text-xs sm:text-sm text-rose-400 font-semibold mt-1">{errors.state}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="ld-label">
              DISTRICT <span className="text-rose-400 font-bold">*</span>
            </label>
            <select
              name="district"
              value={formData.district || ''}
              onChange={onChange}
              className={`ld-select ${errors?.district ? 'border-rose-500' : ''}`}
            >
              {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors?.district && (
              <p className="text-xs sm:text-sm text-rose-400 font-semibold mt-1">{errors.district}</p>
            )}
          </div>
        </div>

        {/* Row 2: Local Body & PIN Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="ld-label">
              LOCAL BODY <span className="text-slate-400 font-normal lowercase text-xs">(Panchayat / Municipality)</span>
            </label>
            <input
              type="text"
              name="localBody"
              value={formData.localBody || ''}
              onChange={onChange}
              placeholder="e.g. Meenadom Panchayat / Pala Municipality"
              className="ld-input"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="ld-label mb-0">
                PIN CODE <span className="text-rose-400 font-bold">*</span>
              </label>
              {isFetchingPin && (
                <span className="text-xs text-emerald-400 font-bold animate-pulse flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin text-emerald-400" /> Fetching location...
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                name="pinCode"
                value={formData.pinCode || ''}
                onChange={onChange}
                maxLength={6}
                placeholder="e.g. 686516"
                className={`ld-input pr-28 ${errors?.pinCode ? 'border-rose-500' : ''}`}
              />
              <button
                type="button"
                onClick={onFetchPinLocation}
                disabled={isFetchingPin || !formData.pinCode || String(formData.pinCode).trim().length < 6}
                className="absolute right-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1 shrink-0"
              >
                {isFetchingPin ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <MapPin size={12} className="text-emerald-400" />
                )}
                <span>Auto-Fill</span>
              </button>
            </div>
            {pinStatusMessage && (
              <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
                <span>{pinStatusMessage}</span>
              </p>
            )}
            {errors?.pinCode && (
              <p className="text-xs sm:text-sm text-rose-400 font-semibold mt-1">{errors.pinCode}</p>
            )}
          </div>
        </div>

        {/* Row 3: Address */}
        <div className="space-y-2">
          <label className="ld-label">
            HOUSE / PLOT ADDRESS <span className="text-rose-400 font-bold">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address || ''}
            onChange={onChange}
            placeholder="House Name / No., Street, Landmark"
            className={`ld-input ${errors?.address ? 'border-rose-500' : ''}`}
          />
          {errors?.address && (
            <p className="text-xs sm:text-sm text-rose-400 font-semibold mt-1">{errors.address}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyLocationForm;
