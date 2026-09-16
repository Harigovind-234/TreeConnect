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
    <div className="ld-card p-6 sm:p-8 space-y-6 shadow-2xl bg-[#0b1710] border border-emerald-500/20 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-5 border-b border-emerald-500/20">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3 tracking-tight">
            2. Basic Property Information
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
            Provide the essential details and safety indicators for your property.
          </p>
        </div>

        <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-3.5 py-1.5 rounded-md flex items-center gap-2 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span> Step 2 of 5
        </span>
      </div>

      <div className="space-y-5">
        {/* Property Name (Full Width) */}
        <div className="space-y-2">
          <label className="ld-label">
            PROPERTY NAME <span className="text-rose-400 font-bold">*</span>
          </label>
          <input
            type="text"
            name="propertyName"
            value={formData.propertyName || ''}
            onChange={onChange}
            placeholder="My Home / Green Compound / Plantation Stand #1"
            className={`ld-input ${errors.propertyName ? 'border-rose-500' : ''}`}
          />
          {errors.propertyName && (
            <p className="text-xs sm:text-sm text-rose-400 font-semibold mt-1">{errors.propertyName}</p>
          )}
        </div>

        {/* Owner Name & Contact Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="ld-label">
              OWNER NAME <span className="text-rose-400 font-bold">*</span>
            </label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName || ''}
              onChange={onChange}
              placeholder="Full legal owner name"
              className={`ld-input ${errors.ownerName ? 'border-rose-500' : ''}`}
            />
            {errors.ownerName && (
              <p className="text-xs sm:text-sm text-rose-400 font-semibold mt-1">{errors.ownerName}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="ld-label">
              CONTACT NUMBER <span className="text-rose-400 font-bold">*</span>
            </label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber || ''}
              onChange={onChange}
              placeholder="+91 98765 43210"
              className={`ld-input ${errors.contactNumber ? 'border-rose-500' : ''}`}
            />
            {errors.contactNumber && (
              <p className="text-xs sm:text-sm text-rose-400 font-semibold mt-1">{errors.contactNumber}</p>
            )}
          </div>
        </div>

        {/* Property Area & Area Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label className="ld-label">
                APPROXIMATE PROPERTY AREA {!isResidential && <span className="text-rose-400 font-bold">*</span>}
              </label>
              <span className="text-[11px] text-slate-400 italic font-normal">
                Optional for residential
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              name="totalArea"
              value={formData.totalArea || ''}
              onChange={onChange}
              placeholder="e.g. 15"
              style={{ borderRadius: '8px' }}
              className={`ld-input ${errors.totalArea ? 'border-rose-500' : ''}`}
            />
            {errors.totalArea && (
              <p className="text-xs sm:text-sm text-rose-400 font-semibold mt-1">{errors.totalArea}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="ld-label">
              AREA UNIT <span className="text-slate-400 font-normal text-xs">(measurement)</span>
            </label>
            <select
              name="areaUnit"
              value={formData.areaUnit || 'Acres'}
              onChange={onChange}
              style={{ borderRadius: '8px' }}
              className="ld-select font-bold text-emerald-400 cursor-pointer"
            >
              <option value="Acres" className="bg-[#0b1710] text-white">Acres</option>
              <option value="Cents" className="bg-[#0b1710] text-white">Cents</option>
              <option value="Square Feet" className="bg-[#0b1710] text-white">Square Feet (sq ft)</option>
              <option value="Hectares" className="bg-[#0b1710] text-white">Hectares</option>
            </select>
          </div>
        </div>

        {/* Tree Count & Main Species (Registered Quantity) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="ld-label">
              NUMBER OF STANDING TREES <span className="text-slate-400 font-normal text-xs">(logged quantity)</span>
            </label>
            <input
              type="number"
              name="approxTreesCount"
              value={formData.approxTreesCount || ''}
              onChange={onChange}
              placeholder="e.g. 5, 12, 25, 50"
              style={{ borderRadius: '8px' }}
              className="ld-input font-extrabold text-emerald-300"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <label className="ld-label">
              PRIMARY TREE SPECIES
            </label>
            <select
              name="mainSpecies"
              value={formData.mainSpecies || 'Teak'}
              onChange={onChange}
              style={{ borderRadius: '8px' }}
              className="ld-select font-bold text-emerald-400 cursor-pointer"
            >
              <option value="Teak" className="bg-[#0b1710] text-white">Teak</option>
              <option value="Teakwood" className="bg-[#0b1710] text-white">Teakwood</option>
              <option value="Mahogany" className="bg-[#0b1710] text-white">Mahogany</option>
              <option value="Rubber" className="bg-[#0b1710] text-white">Rubber</option>
              <option value="Coconut" className="bg-[#0b1710] text-white">Coconut</option>
              <option value="Rosewood" className="bg-[#0b1710] text-white">Rosewood</option>
              <option value="Eucalyptus" className="bg-[#0b1710] text-white">Eucalyptus</option>
              <option value="Pine" className="bg-[#0b1710] text-white">Pine</option>
              <option value="Jackfruit" className="bg-[#0b1710] text-white">Jackfruit</option>
              <option value="Other" className="bg-[#0b1710] text-white">Other</option>
            </select>
          </div>
        </div>

        {/* Property Description */}
        <div className="space-y-2">
          <label className="ld-label">
            PROPERTY DESCRIPTION <span className="text-slate-400 font-normal lowercase text-xs">(optional)</span>
          </label>
          <textarea
            name="description"
            rows="3"
            value={formData.description || ''}
            onChange={onChange}
            placeholder="Residential compound containing 2 teak trees and 1 coconut tree with direct road access."
            className="ld-textarea min-h-[100px]"
          ></textarea>
        </div>

        {/* Risk Factors Sub-Section Container */}
        <div className="ld-subcard space-y-4 p-5 border-2 border-emerald-600/20 bg-[#09150d] mt-4" style={{ borderRadius: '10px' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0" style={{ borderRadius: '8px' }}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Safety &amp; Risk Factors
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Select hazards near trees to inform harvesting contractors.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/50 px-3 py-1 shrink-0" style={{ borderRadius: '6px' }}>
              Optional Safety Indicator
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {availableRisks.map(r => {
              const IconComp = r.icon;
              const selected = (formData.riskFactors || []).includes(r.label);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleToggleRisk(r.label)}
                  className={`ld-risk-card ${selected ? 'selected' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp size={18} className={selected ? 'text-emerald-400' : r.accent} />
                    <span className={selected ? 'font-bold text-white text-xs sm:text-sm' : 'text-slate-200 font-semibold text-xs sm:text-sm'}>
                      {r.label}
                    </span>
                  </div>
                  <div className={`ld-risk-checkbox ${selected ? 'checked' : ''}`}>
                    {selected ? '✓' : ''}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-2 pt-2">
            <label className="ld-label flex items-center gap-2">
              <FileText size={15} className="text-emerald-400" /> Additional Risk Notes
            </label>
            <textarea
              name="riskNotes"
              rows="2"
              value={formData.riskNotes || ''}
              onChange={onChange}
              placeholder="e.g. Teak tree leaning toward main house roof."
              className="ld-textarea min-h-[70px] text-xs sm:text-sm"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyInformationForm;
