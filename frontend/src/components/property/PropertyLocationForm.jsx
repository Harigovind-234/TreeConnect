import React from 'react';

const PropertyLocationForm = ({ formData, onChange, errors }) => {
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
    <div className="card p-7 border border-color rounded-[16px] bg-card space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-color/40 pb-4">
        <div>
          <h2 className="text-[22px] font-bold text-main tracking-tight">
            3. Property Location &amp; Address
          </h2>
          <p className="text-[15px] text-muted mt-1">
            Provide the property's location so contractors can locate it when a site survey is arranged later.
          </p>
        </div>

        <span className="text-[12px] font-bold text-emerald bg-emerald/10 border border-emerald/20 px-3 py-1.5 rounded-[10px] shrink-0">
          ✓ Pre-filled from Account Profile
        </span>
      </div>

      <div className="space-y-5">
        {/* Row 1: State & District (Two equal desktop columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-main block">
              State <span className="text-red-400">*</span>
            </label>
            <select
              name="state"
              value={formData.state || ''}
              onChange={onChange}
              style={{ height: '50px' }}
              className={`w-full form-input text-[15px] px-4 rounded-[10px] bg-surface/60 border-color ${
                errors?.state ? 'border-red-500' : ''
              }`}
            >
              {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors?.state && (
              <p className="text-[14px] text-red-400 font-medium">{errors.state}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-main block">
              District <span className="text-red-400">*</span>
            </label>
            <select
              name="district"
              value={formData.district || ''}
              onChange={onChange}
              style={{ height: '50px' }}
              className={`w-full form-input text-[15px] px-4 rounded-[10px] bg-surface/60 border-color ${
                errors?.district ? 'border-red-500' : ''
              }`}
            >
              {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors?.district && (
              <p className="text-[14px] text-red-400 font-medium">{errors.district}</p>
            )}
          </div>
        </div>

        {/* Row 2: Local Body (Panchayat) & PIN Code (Two equal desktop columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-main block">
              Local Body <span className="text-[13px] text-muted font-normal">(Panchayat / Municipality)</span>
            </label>
            <input
              type="text"
              name="localBody"
              value={formData.localBody || ''}
              onChange={onChange}
              placeholder="e.g. Meenadom Panchayat / Pala Municipality"
              style={{ height: '50px' }}
              className="w-full form-input text-[15px] px-4 rounded-[10px] bg-surface/60 border-color"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-main block">
              PIN Code <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="pinCode"
              value={formData.pinCode || ''}
              onChange={onChange}
              placeholder="e.g. 686516"
              style={{ height: '50px' }}
              className={`w-full form-input text-[15px] px-4 rounded-[10px] bg-surface/60 border-color ${
                errors?.pinCode ? 'border-red-500' : ''
              }`}
            />
            {errors?.pinCode && (
              <p className="text-[14px] text-red-400 font-medium">{errors.pinCode}</p>
            )}
          </div>
        </div>

        {/* Row 3: House / Plot Address (Full Width across both columns) */}
        <div className="space-y-2">
          <label className="text-[14px] font-semibold text-main block">
            House / Plot Address <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address || ''}
            onChange={onChange}
            placeholder="House Name / No., Street, Landmark"
            style={{ height: '50px' }}
            className={`w-full form-input text-[15px] px-4 rounded-[10px] bg-surface/60 border-color ${
              errors?.address ? 'border-red-500' : ''
            }`}
          />
          {errors?.address && (
            <p className="text-[14px] text-red-400 font-medium">{errors.address}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyLocationForm;
