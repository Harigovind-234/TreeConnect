import React from 'react';
import { Zap, Home, Truck, ShieldAlert, Mountain, Droplets, FileText } from 'lucide-react';

const PropertyInformationForm = ({ formData, onChange, propertyType, errors }) => {
  const isResidential = propertyType === 'Residential Property';

  const availableRisks = [
    { id: 'electric_wires', label: 'Overhead Electric Wires (KSEB)', icon: Zap, accent: 'text-amber-400' },
    { id: 'near_house', label: 'Close to House / Roof Structure', icon: Home, accent: 'text-emerald-400' },
    { id: 'narrow_gate', label: 'Narrow Gate / Lane Access', icon: Truck, accent: 'text-blue-400' },
    { id: 'neighbor_fence', label: 'Near Neighbor Fences / Boundary', icon: ShieldAlert, accent: 'text-purple-400' },
    { id: 'sloped_terrain', label: 'Sloped / Slippery Hillside Ground', icon: Mountain, accent: 'text-amber-300' },
    { id: 'near_well', label: 'Near Water Well / Septic Tank', icon: Droplets, accent: 'text-cyan-400' }
  ];

  const handleToggleRisk = (riskLabel) => {
    const current = formData.riskFactors || [];
    const updated = current.includes(riskLabel)
      ? current.filter(r => r !== riskLabel)
      : [...current, riskLabel];
    
    onChange({
      target: {
        name: 'riskFactors',
        value: updated
      }
    });
  };

  return (
    <div className="card p-7 border border-color rounded-[16px] bg-card space-y-6 shadow-sm">
      <div>
        <h2 className="text-[22px] font-bold text-main tracking-tight">
          2. Basic Property Information
        </h2>
        <p className="text-[15px] text-muted mt-1">
          Provide the basic details of the property.
        </p>
      </div>

      <div className="space-y-5">
        {/* Property Name (Full Width) */}
        <div className="space-y-2">
          <label className="text-[14px] font-semibold text-main block">
            Property Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="propertyName"
            value={formData.propertyName || ''}
            onChange={onChange}
            placeholder="My Home / Green Compound / Plantation Stand #1"
            style={{ height: '50px' }}
            className={`w-full form-input text-[15px] px-4 rounded-[10px] bg-surface/60 border-color ${
              errors.propertyName ? 'border-red-500' : ''
            }`}
          />
          {errors.propertyName && (
            <p className="text-[14px] text-red-400 font-medium">{errors.propertyName}</p>
          )}
        </div>

        {/* Owner Name & Contact Number (Two columns on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-main block">
              Owner Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName || ''}
              onChange={onChange}
              placeholder="Enter property owner's full name"
              style={{ height: '50px' }}
              className={`w-full form-input text-[15px] px-4 rounded-[10px] bg-surface/60 border-color ${
                errors.ownerName ? 'border-red-500' : ''
              }`}
            />
            {errors.ownerName && (
              <p className="text-[14px] text-red-400 font-medium">{errors.ownerName}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-main block">
              Contact Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber || ''}
              onChange={onChange}
              placeholder="+91 98765 43210"
              style={{ height: '50px' }}
              className={`w-full form-input text-[15px] px-4 rounded-[10px] bg-surface/60 border-color ${
                errors.contactNumber ? 'border-red-500' : ''
              }`}
            />
            {errors.contactNumber && (
              <p className="text-[14px] text-red-400 font-medium">{errors.contactNumber}</p>
            )}
          </div>
        </div>

        {/* Approximate Property Area */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <label className="text-[14px] font-semibold text-main block">
              Approximate Property Area {!isResidential && <span className="text-red-400">*</span>}
            </label>
            <span className="text-[13px] text-muted italic">
              Optional for small residential properties.
            </span>
          </div>

          <div className="flex gap-3">
            <input
              type="number"
              step="0.01"
              name="totalArea"
              value={formData.totalArea || ''}
              onChange={onChange}
              placeholder="e.g. 15"
              style={{ height: '50px' }}
              className={`w-full form-input flex-1 text-[15px] px-4 rounded-[10px] bg-surface/60 border-color ${
                errors.totalArea ? 'border-red-500' : ''
              }`}
            />
            <select
              name="areaUnit"
              value={formData.areaUnit || 'Acres'}
              onChange={onChange}
              style={{ height: '50px' }}
              className="form-input w-36 text-[15px] font-semibold px-3 rounded-[10px] bg-surface border-color text-main"
            >
              <option value="Acres">Acres</option>
              <option value="Cents">Cents</option>
              <option value="Square Feet">Square Feet</option>
              <option value="Hectares">Hectares</option>
            </select>
          </div>
          {errors.totalArea && (
            <p className="text-[14px] text-red-400 font-medium">{errors.totalArea}</p>
          )}
        </div>

        {/* Property Description (Full Width w-full) */}
        <div className="space-y-2">
          <label className="text-[14px] font-semibold text-main block">
            Property Description <span className="text-[13px] text-muted font-normal">(Optional)</span>
          </label>
          <textarea
            name="description"
            rows="3"
            value={formData.description || ''}
            onChange={onChange}
            placeholder="Example: Residential compound containing 2 teak trees and 1 coconut tree with road access."
            className="w-full form-input text-[15px] p-4 rounded-[10px] bg-surface/60 border-color leading-relaxed min-h-[90px]"
          ></textarea>
        </div>

        {/* Safety & Residential Risk Factors Sub-Card */}
        <div className="pt-5 border-t border-color/60 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-main">
                  Safety &amp; Residential Risk Factors
                </h3>
                <p className="text-[13px] text-muted mt-0.5">
                  Select any hazard factors near your property to assist contractors with felling gear &amp; site safety.
                </p>
              </div>
            </div>
            <span className="text-[12px] font-bold text-muted bg-surface/80 border border-color px-2.5 py-1 rounded-[8px] shrink-0">
              Optional
            </span>
          </div>

          {/* Interactive Risk Factor Toggle Cards (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {availableRisks.map(r => {
              const IconComp = r.icon;
              const selected = (formData.riskFactors || []).includes(r.label);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleToggleRisk(r.label)}
                  className={`p-3.5 rounded-[12px] text-[14px] font-medium text-left transition-all border flex items-center justify-between gap-3 cursor-pointer ${
                    selected
                      ? 'bg-emerald/15 border-emerald text-main shadow-glow'
                      : 'bg-surface/50 border-color/70 text-muted hover:border-emerald/40 hover:text-main hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp size={18} className={selected ? 'text-emerald' : r.accent} />
                    <span className={selected ? 'font-semibold text-main' : 'text-main/90'}>
                      {r.label}
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${
                    selected ? 'border-emerald bg-emerald text-dark' : 'border-color/80 bg-surface'
                  }`}>
                    {selected ? '✓' : ''}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Additional Risk Notes (Full Width w-full) */}
          <div className="space-y-2 pt-2">
            <label className="text-[13px] font-semibold text-muted block flex items-center gap-1.5">
              <FileText size={14} className="text-emerald" /> Additional Safety &amp; Risk Notes <span className="font-normal">(Optional)</span>
            </label>
            <textarea
              name="riskNotes"
              rows="3"
              value={formData.riskNotes || ''}
              onChange={onChange}
              placeholder="e.g. Teak tree leaning toward main house roof, or 11KV electric wire passing 3 meters away."
              className="w-full form-input text-[14px] p-4 rounded-[10px] bg-surface/60 border-color leading-relaxed min-h-[90px]"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyInformationForm;
