import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLandowner } from '../../context/LandownerContext';
import { CheckCircle2, Plus, Trees, LayoutDashboard, MapPin, Camera, Film, ArrowRight, ShieldCheck, Building2, X, ZoomIn, ChevronLeft, ChevronRight, Package } from 'lucide-react';

const PropertyRegistrationSuccess = ({ registeredProperty }) => {
  const navigate = useNavigate();
  const { inventories } = useLandowner();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!registeredProperty) return null;

  const regPropId = registeredProperty.id || registeredProperty._id;
  const propInventories = (inventories || []).filter(
    inv => inv.propertyId === regPropId || inv.propertyId === registeredProperty.id || inv.propertyId === registeredProperty._id || String(inv.propertyId) === String(regPropId) || String(inv.propertyId) === String(registeredProperty.id) || String(inv.propertyId) === String(registeredProperty._id)
  );
  const hasTreeInventory = propInventories.length > 0;

  const photosList = registeredProperty.photos && registeredProperty.photos.length > 0
    ? registeredProperty.photos
    : (registeredProperty.image ? [registeredProperty.image] : []);

  const photoCount = photosList.length;
  const videoCount = registeredProperty.videos?.length || 0;

  const handleOpenPhoto = (index) => {
    setActivePhotoIndex(index);
    setIsImageModalOpen(true);
  };

  const handlePrevPhoto = () => {
    setActivePhotoIndex((prev) => (prev === 0 ? photosList.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setActivePhotoIndex((prev) => (prev === photosList.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="max-w-[950px] w-full mx-auto space-y-6 animate-fade-in py-2">
      {/* 1. SUCCESS HERO HEADER */}
      <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl relative overflow-hidden">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 size={36} />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
            <ShieldCheck size={14} /> Property Successfully Registered
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug break-words">
            {registeredProperty.propertyName}
          </h2>
          <p className="text-sm text-slate-300 font-normal leading-relaxed">
            Your property has been saved to TreeConnect and is ready for tree inventory logging and contractor requests.
          </p>
        </div>
      </div>

      {/* 2. REGISTERED PROPERTY DETAILS & MEDIA CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
            <Building2 size={20} className="text-emerald-400" /> Property Registration Summary
          </h3>
          <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold tracking-wider uppercase">
            Active &amp; Registered
          </span>
        </div>

        {/* 2-Column Balanced Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Property Name
              </span>
              <span className="text-base font-bold text-emerald-400 block break-words">
                {registeredProperty.propertyName}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Property Category
              </span>
              <span className="text-sm font-semibold text-white block">
                {registeredProperty.propertyType}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Location &amp; Address
              </span>
              <span className="text-sm font-medium text-slate-200 flex items-start gap-2 mt-1 leading-relaxed break-words">
                <MapPin size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  {registeredProperty.address && `${registeredProperty.address}, `}
                  {registeredProperty.localBody ? `${registeredProperty.localBody}, ` : ''}
                  {registeredProperty.district}, {registeredProperty.state} {registeredProperty.pinCode && `(${registeredProperty.pinCode})`}
                </span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Land Area
              </span>
              <span className="text-sm font-semibold text-white block">
                {registeredProperty.totalArea ? `${registeredProperty.totalArea} ${registeredProperty.areaUnit}` : 'Residential Plot'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Media Attachments
              </span>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-200 pt-0.5">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Camera size={15} /> {photoCount} Photo{photoCount !== 1 ? 's' : ''}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Film size={15} /> {videoCount} Video{videoCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {registeredProperty.riskFactors && registeredProperty.riskFactors.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-amber-400" /> Flagged Safety &amp; Risk Factors
                </span>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {registeredProperty.riskFactors.map((rf, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-900/50 text-amber-200 text-xs font-semibold border border-amber-700/60 shadow-sm leading-relaxed">
                      {rf}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Clickable Photo Gallery Thumbnails */}
            {photoCount > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Attached Property Photos ({photoCount})
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <ZoomIn size={13} /> Expand photo
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {photosList.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleOpenPhoto(idx)}
                      className="relative h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer group shadow-sm hover:border-emerald-500/60 transition-all"
                      title={`Click to view photo #${idx + 1}`}
                    >
                      <img
                        src={url}
                        alt={`Property Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[9px] font-bold shadow">
                          Cover
                        </span>
                      )}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold gap-1">
                        <ZoomIn size={14} /> View
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. WORKFLOW PROGRESS STAGE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Overall Workflow Progress
          </span>
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-lg">
            {hasTreeInventory ? 'Step 2 of 5 Completed' : 'Step 1 of 5 Completed'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs text-center font-medium">
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold shadow-sm flex items-center justify-center gap-1.5">
            <CheckCircle2 size={14} /> 1. Registered
          </div>
          {hasTreeInventory ? (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold shadow-sm flex items-center justify-center gap-1.5">
              <CheckCircle2 size={14} /> 2. Tree Inventory
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-white font-bold shadow-sm">
              2. Tree Inventory ⏳
            </div>
          )}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-slate-500">
            3. Contractor
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-slate-500">
            4. Site Survey
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-slate-500">
            5. Harvesting
          </div>
        </div>
      </div>

      {/* 4. DASHBOARD ACTION BUTTONS */}
      <div className="space-y-3.5 pt-1">
        {hasTreeInventory ? (
          <button
            onClick={() => navigate(`/landowner/inventory?propertyId=${regPropId}`)}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.005] cursor-pointer"
          >
            <Package size={20} /> Show Tree Inventory <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={() => navigate(`/landowner/add-inventory?propertyId=${regPropId}`)}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.005] cursor-pointer"
          >
            <Plus size={20} /> Proceed to Step 2: Add Tree Inventory <ArrowRight size={18} />
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/landowner/properties')}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Trees size={16} /> View My Properties
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus size={16} /> Register Another Property
          </button>

          <button
            onClick={() => navigate('/landowner/dashboard')}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LayoutDashboard size={16} /> Go to Dashboard
          </button>
        </div>
      </div>

      {/* 5. INTERACTIVE PHOTO LIGHTBOX MODAL (Supports multiple photos) */}
      {isImageModalOpen && photoCount > 0 && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-dark/85 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-4xl w-full bg-card border border-emerald/40 rounded-[18px] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-color pb-3">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-emerald" />
                <h4 className="font-bold text-main text-[16px]">
                  {registeredProperty.propertyName} - Photo {activePhotoIndex + 1} of {photoCount}
                </h4>
              </div>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="p-1.5 rounded-lg bg-surface border border-color text-muted hover:text-main transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Display full image with navigation arrows */}
            <div className="relative max-h-[68vh] flex items-center justify-center overflow-hidden rounded-xl bg-dark border border-color p-2">
              <img
                src={photosList[activePhotoIndex]}
                alt={`Property Photo ${activePhotoIndex + 1}`}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
              />

              {/* Prev / Next Arrows if multiple photos */}
              {photoCount > 1 && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-4 p-2 rounded-full bg-dark/80 border border-emerald/40 text-emerald hover:bg-emerald hover:text-dark transition-all shadow-lg"
                    title="Previous Photo"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-4 p-2 rounded-full bg-dark/80 border border-emerald/40 text-emerald hover:bg-emerald hover:text-dark transition-all shadow-lg"
                    title="Next Photo"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Modal Bottom Gallery Bar */}
            <div className="flex items-center justify-between text-xs text-muted pt-1">
              <div className="flex items-center gap-1.5">
                {photosList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      activePhotoIndex === idx
                        ? 'bg-emerald w-6 shadow-glow'
                        : 'bg-muted/40 hover:bg-muted'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="btn btn-secondary btn-xs px-4 py-1.5 text-xs rounded-lg"
              >
                Close Gallery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyRegistrationSuccess;
