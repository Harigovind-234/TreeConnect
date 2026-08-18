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
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-7 sm:p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
      <div className="border-b border-slate-800/80 pb-4">
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>2. Basic Property Information</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Provide the essential details and safety indicators for your property.
        </p>
      </div>

      <div className="space-y-5">
        {/* Property Name (Full Width) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            Property Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="propertyName"
            value={formData.propertyName || ''}
            onChange={onChange}
            placeholder="My Home / Green Compound / Plantation Stand #1"
            className={`w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all ${
              errors.propertyName ? 'border-red-500 focus:border-red-500' : ''
            }`}
          />
          {errors.propertyName && (
            <p className="text-xs text-red-400 font-medium">{errors.propertyName}</p>
          )}
        </div>

        {/* Owner Name & Contact Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Owner Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName || ''}
              onChange={onChange}
              placeholder="Full legal owner name"
              className={`w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all ${
                errors.ownerName ? 'border-red-500 focus:border-red-500' : ''
              }`}
            />
            {errors.ownerName && (
              <p className="text-xs text-red-400 font-medium">{errors.ownerName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Contact Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber || ''}
              onChange={onChange}
              placeholder="+91 98765 43210"
              className={`w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all ${
                errors.contactNumber ? 'border-red-500 focus:border-red-500' : ''
              }`}
            />
            {errors.contactNumber && (
              <p className="text-xs text-red-400 font-medium">{errors.contactNumber}</p>
            )}
          </div>
        </div>

        {/* Property Area */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Approximate Property Area {!isResidential && <span className="text-red-400">*</span>}
            </label>
            <span className="text-[11px] text-slate-400 italic">
              Optional for small residential plots.
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
              className={`w-full flex-1 px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all ${
                errors.totalArea ? 'border-red-500' : ''
              }`}
            />
            <select
              name="areaUnit"
              value={formData.areaUnit || 'Acres'}
              onChange={onChange}
              className="w-36 px-3 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Acres">Acres</option>
              <option value="Cents">Cents</option>
              <option value="Square Feet">Square Feet</option>
              <option value="Hectares">Hectares</option>
            </select>
          </div>
          {errors.totalArea && (
            <p className="text-xs text-red-400 font-medium">{errors.totalArea}</p>
          )}
        </div>

        {/* Property Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            Property Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <textarea
            name="description"
            rows="3"
            value={formData.description || ''}
            onChange={onChange}
            placeholder="Residential compound containing 2 teak trees and 1 coconut tree with direct road access."
            className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all leading-relaxed min-h-[90px]"
          ></textarea>
        </div>

        {/* Risk Factors Sub-Section */}
        <div className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Safety &amp; Risk Factors
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select hazards near trees to inform harvesting contractors.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full shrink-0">
              Optional
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
                  className={`p-3.5 rounded-xl text-xs font-semibold text-left transition-all border flex items-center justify-between gap-3 cursor-pointer ${
                    selected
                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp size={18} className={selected ? 'text-emerald-400' : r.accent} />
                    <span className={selected ? 'font-bold text-white' : 'text-slate-300'}>
                      {r.label}
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                    selected ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-700 bg-slate-900'
                  }`}>
                    {selected ? '✓' : ''}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText size={14} className="text-emerald-400" /> Additional Risk Notes
            </label>
            <textarea
              name="riskNotes"
              rows="2"
              value={formData.riskNotes || ''}
              onChange={onChange}
              placeholder="e.g. Teak tree leaning toward main house roof."
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyInformationForm;
