import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import {
  Package,
  Plus,
  Trees,
  MapPin,
  Axe,
  ArrowLeft,
  Camera,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  ImageIcon
} from 'lucide-react';

const speciesImagesMap = {
  Teak: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
  Rubber: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
  'Western Red Cedar': 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
  Cedar: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
  Mahogany: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  Rosewood: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  Pine: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
  'Douglas Fir': 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
  Eucalyptus: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
  Jackfruit: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
  Mango: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
  Other: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80'
};

const getTreeSpeciesPhoto = (species, attachedPhotos = []) => {
  if (attachedPhotos && attachedPhotos.length > 0) {
    const validPhoto = attachedPhotos.find(p => p && typeof p === 'string' && !p.startsWith('blob:'));
    if (validPhoto) return validPhoto;
  }
  const specKey = Object.keys(speciesImagesMap).find(
    k => (species || '').toLowerCase().includes(k.toLowerCase())
  );
  return speciesImagesMap[specKey] || speciesImagesMap.Other;
};

const TreeInventoryPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetPropertyId = searchParams.get('propertyId');

  const { properties, inventories } = useLandowner();

  // State for image lightbox modal
  const [activePhotoModal, setActivePhotoModal] = useState(null); // { photos: [], index: 0, title: '' }

  // Filter properties based on URL param
  const displayedProperties = targetPropertyId
    ? properties.filter(p => p.id === targetPropertyId || p._id === targetPropertyId || String(p.id) === String(targetPropertyId) || String(p._id) === String(targetPropertyId))
    : properties;

  // Handle Lightbox Click
  const openLightbox = (photos, index = 0, title = 'Tree Photo') => {
    const validPhotos = (photos || []).filter(p => p && typeof p === 'string' && !p.startsWith('blob:'));
    if (validPhotos.length === 0) return;
    setActivePhotoModal({ photos: validPhotos, index, title });
  };

  return (
    <div className="dashboard-layout min-h-screen bg-dark">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace flex-1">
          <main className="dashboard-content max-w-[1100px] w-[min(100%-48px,1100px)] mx-auto py-8 px-4 sm:px-6 space-y-8">

            {/* Top Navigation Header */}
            <div className="space-y-4">
              <button
                onClick={() => navigate('/landowner/properties')}
                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} /> Back to My Properties
              </button>

              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
                    <Package size={28} />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Tree Inventory Details
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                      Comprehensive standing tree species counts, health conditions, and photo logs.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(targetPropertyId ? `/landowner/add-inventory?propertyId=${targetPropertyId}` : '/landowner/add-inventory')}
                    className="py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Plus size={18} /> Add Tree Inventory
                  </button>
                </div>
              </div>
            </div>

            {/* Empty State if no properties match */}
            {displayedProperties.length === 0 ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
                <Trees size={56} className="mx-auto text-emerald-500/40" />
                <h3 className="text-xl font-bold text-white">No Tree Inventory Found</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  No registered property matches the selected ID. Register your estate or add tree inventories to view full specs here.
                </p>
                <button
                  onClick={() => navigate('/landowner/register-property')}
                  className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Plus size={16} /> Register Property
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                {displayedProperties.map((p) => {
                  const pId = p.id || p._id;

                  // Find all inventory entries logged for this property
                  const propInventories = (inventories || []).filter(
                    inv => inv.propertyId === pId || inv.propertyId === p.id || inv.propertyId === p._id || String(inv.propertyId) === String(pId) || String(inv.propertyId) === String(p.id) || String(inv.propertyId) === String(p._id)
                  );

                  let totalTreesCount = 0;
                  const allTreeGroups = [];
                  const inventoryPhotos = [];

                  propInventories.forEach(inv => {
                    if (inv.photos && inv.photos.length > 0) {
                      inv.photos.forEach(ph => {
                        if (ph && typeof ph === 'string' && !ph.startsWith('blob:') && !inventoryPhotos.includes(ph)) {
                          inventoryPhotos.push(ph);
                        }
                      });
                    }

                    (inv.speciesList || []).forEach(sp => {
                      const count = Number(sp.numberOfTrees || sp.count || 0);
                      totalTreesCount += count;
                      allTreeGroups.push({
                        id: sp.id || `sp_${allTreeGroups.length + 1}`,
                        groupName: sp.groupName || `${sp.treeSpecies || sp.species || 'Tree'} Group`,
                        species: sp.treeSpecies || sp.species || 'Teak',
                        count: count,
                        age: sp.approxAge || sp.age || '15-20 years',
                        condition: sp.treeCondition || sp.condition || 'Healthy',
                        notes: sp.notes || '',
                        location: sp.locationInProperty || sp.location || inv.treeAreaLocation || 'Main Compound Plot',
                        dbh: sp.averageDbh || sp.dbh || '',
                        height: sp.averageHeight || sp.height || '',
                        attachedPhotos: inv.photos || []
                      });
                    });
                  });

                  // Property cover photos
                  const propertyPhotos = (p.photos && p.photos.length > 0 ? p.photos : (p.image ? [p.image] : [])).filter(ph => ph && typeof ph === 'string' && !ph.startsWith('blob:'));

                  return (
                    <div key={pId} className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-6">

                      {/* 1. PROPERTY HERO BANNER */}
                      <div className="p-6 sm:p-8 bg-slate-950/80 border-b border-slate-800 space-y-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-2.5 max-w-2xl">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                                {p.propertyType || 'Residential Property'}
                              </span>
                              <span className="text-xs text-slate-400 font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                                Property ID: {pId}
                              </span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                              {p.propertyName}
                            </h2>

                            <p className="text-xs sm:text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                              <MapPin size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                              <span>
                                {p.address && `${p.address}, `}
                                {p.localBody ? `${p.localBody}, ` : ''}
                                {p.district}, {p.state} {p.pinCode && `(${p.pinCode})`}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2.5 flex-wrap">
                            <button
                              onClick={() => navigate(`/landowner/add-inventory?propertyId=${pId}`)}
                              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Plus size={15} /> Add More Trees
                            </button>
                            <button
                              onClick={() => navigate(`/landowner/request-harvest?propertyId=${pId}`)}
                              className="py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Axe size={15} /> Request Harvest
                            </button>
                          </div>
                        </div>

                        {/* Summary Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Land Area</span>
                            <span className="font-extrabold text-white text-base block">
                              {p.totalArea ? `${p.totalArea} ${p.areaUnit || 'Acres'}` : 'Residential Plot'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Total Trees Logged</span>
                            <span className="font-extrabold text-emerald-400 text-base flex items-center gap-1.5">
                              <Trees size={18} /> {totalTreesCount} Standing Trees
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Tree Groups</span>
                            <span className="font-extrabold text-white text-base block">
                              {allTreeGroups.length} Species Stand{allTreeGroups.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Status</span>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold inline-block">
                              Active Inventory
                            </span>
                          </div>
                        </div>

                        {/* Safety & Risk Banner */}
                        {p.riskFactors && p.riskFactors.length > 0 && (
                          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-2 text-xs">
                            <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                              <ShieldCheck size={15} /> Flagged Safety &amp; Hazard Factors
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {p.riskFactors.map((rf, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded-md bg-amber-900/50 text-amber-200 text-xs font-semibold border border-amber-700/60">
                                  {rf}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. LOGGED TREE GROUPS SPECIFICATIONS SECTION */}
                      <div className="p-6 sm:p-8 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                          <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                              <Trees size={22} className="text-emerald-400" /> Logged Tree Inventory ({allTreeGroups.length} Groups)
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Standing tree species specifications, quantities, location plots, and health conditions.
                            </p>
                          </div>
                        </div>

                        {allTreeGroups.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {allTreeGroups.map((tg, idx) => {
                              return (
                                <div
                                  key={idx}
                                  className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 shadow-lg flex flex-col justify-between space-y-5 group"
                                >
                                  <div className="space-y-4">
                                    {/* Clean Group Header with Species & Condition Pill */}
                                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 border-b border-slate-800">
                                      <div>
                                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                                          Tree Group #{idx + 1}
                                        </span>
                                        <h4 className="text-xl font-extrabold text-white mt-0.5">
                                          {tg.species}
                                        </h4>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-900 border border-slate-800 text-emerald-400">
                                          {tg.count} Trees
                                        </span>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                          tg.condition === 'Healthy'
                                            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                                            : tg.condition === 'Damaged'
                                            ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                                            : 'bg-red-950/90 border-red-500 text-red-300'
                                        }`}>
                                          {tg.condition}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Specifications Grid */}
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approximate Age</span>
                                        <span className="font-bold text-white text-sm block">{tg.age}</span>
                                      </div>
                                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logged Quantity</span>
                                        <span className="font-bold text-emerald-400 text-sm block">{tg.count} Standing Trees</span>
                                      </div>
                                    </div>

                                    {/* Plot Position */}
                                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location / Plot Position within Estate</span>
                                      <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                                        📍 {tg.location}
                                      </span>
                                    </div>

                                    {/* Special Notes / Observations */}
                                    {tg.notes && (
                                      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs space-y-1">
                                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                                          Special Notes / Observations
                                        </span>
                                        <p className="text-slate-300 leading-relaxed">{tg.notes}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Footer: Request Harvest */}
                                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                                    <span className="text-xs text-slate-400 font-medium">Ready for contractor bidding</span>
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/landowner/request-harvest?propertyId=${pId}`)}
                                      className="py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                      <Axe size={15} /> Request Harvest
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-10 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                            <Trees size={44} className="mx-auto text-emerald-500/40" />
                            <p className="text-sm text-slate-400">No tree inventory recorded for this property yet.</p>
                            <button
                              onClick={() => navigate(`/landowner/add-inventory?propertyId=${pId}`)}
                              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                            >
                              <Plus size={16} /> Log Tree Inventory Now
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 3. DEDICATED STANDING TREE PHOTOS & SPECIES MEDIA GALLERY SECTION */}
                      {allTreeGroups.length > 0 && (
                        <div className="p-6 sm:p-8 border-t border-slate-800 bg-slate-950/80 space-y-6">
                          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
                            <div>
                              <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                                <Camera size={22} className="text-emerald-400" /> Standing Tree Photos &amp; Species Gallery ({allTreeGroups.length})
                              </h3>
                              <p className="text-xs text-slate-400 mt-1">
                                High resolution tree species photos, standing trunk images, and canopy visual logs.
                              </p>
                            </div>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-lg">
                              Click 'View Photo' to inspect image
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allTreeGroups.map((tg, idx) => {
                              const treePhoto = getTreeSpeciesPhoto(tg.species, tg.attachedPhotos);
                              return (
                                <div
                                  key={idx}
                                  className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg group flex flex-col justify-between"
                                >
                                  {/* Photo Display Card */}
                                  <div className="relative h-48 w-full bg-slate-900 overflow-hidden group">
                                    <img
                                      src={treePhoto}
                                      alt={tg.species}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                                    {/* Hover Overlay with circular ZoomIn icon & bold View text matching user sample */}
                                    <div
                                      onClick={() => openLightbox([treePhoto], 0, `${p.propertyName} - ${tg.species} (${tg.count} Trees)`)}
                                      className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer backdrop-blur-xs z-10"
                                    >
                                      <div className="flex items-center gap-2.5 bg-slate-900/90 px-4 py-2 rounded-2xl border border-white/20 shadow-2xl transform scale-95 group-hover:scale-100 transition-transform">
                                        <ZoomIn size={24} className="text-white" />
                                        <span className="text-xl font-extrabold text-white tracking-wide">View</span>
                                      </div>
                                    </div>

                                    <span className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-950/90 backdrop-blur border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow z-0">
                                      {tg.species} ({tg.count} Trees)
                                    </span>

                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-0">
                                      <span className="text-xs text-slate-300 font-semibold truncate max-w-[180px]">
                                        📍 {tg.location}
                                      </span>
                                      <span className="text-xs text-emerald-400 font-bold bg-slate-950/90 px-2.5 py-0.5 rounded-md border border-slate-800">
                                        {tg.condition}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Card Action Footer with View Tree Photo button */}
                                  <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2">
                                    <span className="text-xs text-slate-400 font-medium">Tree Stand #{idx + 1}</span>
                                    <button
                                      type="button"
                                      onClick={() => openLightbox([treePhoto], 0, `${p.propertyName} - ${tg.species} (${tg.count} Trees)`)}
                                      className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                                    >
                                      <ZoomIn size={16} className="text-emerald-400" />
                                      <span>View Tree Photo</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 4. PROPERTY PHOTOS & ESTATE MEDIA GALLERY SECTION */}
                      {propertyPhotos.length > 0 && (
                        <div className="p-6 sm:p-8 border-t border-slate-800 bg-slate-950/60 space-y-4">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <ImageIcon size={18} className="text-emerald-400" /> Property Photos &amp; Estate Media Gallery ({propertyPhotos.length})
                              </h3>
                              <p className="text-xs text-slate-400 mt-0.5">High resolution property estate and boundary photos</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-400">Click photo to view full size</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                            {propertyPhotos.map((url, idx) => (
                              <div
                                key={idx}
                                onClick={() => openLightbox(propertyPhotos, idx, `${p.propertyName} - Property Photo #${idx + 1}`)}
                                className="group relative h-36 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer shadow-md hover:border-emerald-500/60 transition-all"
                              >
                                <img
                                  src={url}
                                  alt={`Property Photo ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer backdrop-blur-xs">
                                  <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/20 shadow-lg">
                                    <ZoomIn size={18} className="text-white" />
                                    <span className="text-sm font-bold text-white tracking-wide">View</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

            {/* 5. FULL-SCREEN LIGHTBOX MODAL */}
            {activePhotoModal && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
                <div className="max-w-4xl w-full p-6 border border-emerald-500/40 rounded-2xl bg-slate-900 space-y-4 shadow-2xl relative">

                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <Camera size={18} className="text-emerald-400" /> {activePhotoModal.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Photo {activePhotoModal.index + 1} of {activePhotoModal.photos.length}
                      </p>
                    </div>
                    <button
                      onClick={() => setActivePhotoModal(null)}
                      className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Main Image View */}
                  <div className="relative max-h-[65vh] flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800 p-2">
                    <img
                      src={activePhotoModal.photos[activePhotoModal.index]}
                      alt="Full View"
                      className="max-h-[62vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                    />

                    {/* Prev/Next Navigation Controls */}
                    {activePhotoModal.photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setActivePhotoModal(prev => ({
                            ...prev,
                            index: prev.index === 0 ? prev.photos.length - 1 : prev.index - 1
                          }))}
                          className="absolute left-4 p-2.5 rounded-full bg-slate-950/80 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg cursor-pointer"
                        >
                          <ChevronLeft size={22} />
                        </button>
                        <button
                          onClick={() => setActivePhotoModal(prev => ({
                            ...prev,
                            index: prev.index === prev.photos.length - 1 ? 0 : prev.index + 1
                          }))}
                          className="absolute right-4 p-2.5 rounded-full bg-slate-950/80 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg cursor-pointer"
                        >
                          <ChevronRight size={22} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Footer Close Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setActivePhotoModal(null)}
                      className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 cursor-pointer"
                    >
                      Close Lightbox
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default TreeInventoryPage;
