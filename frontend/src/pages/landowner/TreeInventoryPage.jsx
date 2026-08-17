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
    <div className="landowner-dashboard-page">
      <Navbar />
      <div className="landowner-dashboard-container">
        <Sidebar />

        <div className="landowner-dashboard-workspace">
          <main className="w-full flex flex-col gap-8">

            {/* Top Navigation Header styled as Hero Card */}
            <section className="ld-card ld-hero-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <button
                    onClick={() => navigate('/landowner/properties')}
                    className="ld-pill mb-3 hover:text-white cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back to My Properties
                  </button>
                  <div className="ld-hero-tag">
                    <Package size={14} /> STANDING TIMBER INVENTORY
                  </div>
                  <h1 className="ld-hero-heading mt-1">Tree Inventory Details</h1>
                  <p className="ld-hero-subtext mt-1">
                    Comprehensive standing tree species counts, health conditions, plot locations, and photo logs.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => navigate(targetPropertyId ? `/landowner/add-inventory?propertyId=${targetPropertyId}` : '/landowner/add-inventory')}
                    className="ld-btn-green"
                    style={{ padding: '10px 20px', fontSize: '13.5px', width: 'auto' }}
                  >
                    <Plus size={16} /> Add Tree Inventory
                  </button>
                </div>
              </div>
            </section>

            {/* Empty State if no properties match */}
            {displayedProperties.length === 0 ? (
              <div className="ld-card text-center py-16 space-y-4">
                <Trees size={48} className="text-emerald-500/40 mx-auto" />
                <h3 className="text-lg font-bold text-white">No Tree Inventory Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  No registered property matches the selected ID. Register your estate or add tree inventories to view full specs here.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/landowner/register-property')}
                    className="ld-btn-green inline-flex items-center gap-2 py-2.5 px-5 text-xs"
                    style={{ width: 'auto' }}
                  >
                    <Plus size={16} /> Register Property
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
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
                    <div key={pId} className="ld-card p-6 sm:p-8 space-y-8 shadow-xl">

                      {/* 1. PROPERTY HERO BANNER */}
                      <div className="space-y-6 pb-6 border-b border-emerald-500/15">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-2 max-w-2xl">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="ld-badge-green">
                                {p.propertyType || 'Residential Property'}
                              </span>
                              <span className="ld-pill text-[11px] py-0.5 px-2.5 font-mono">
                                ID: {pId}
                              </span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                              {p.propertyName}
                            </h2>

                            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 font-medium">
                              <MapPin size={15} className="text-emerald-400 shrink-0" />
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
                              className="ld-btn-green py-2 px-3.5 text-xs"
                              style={{ width: 'auto' }}
                            >
                              <Plus size={15} /> Add More Trees
                            </button>
                            <button
                              onClick={() => navigate(`/landowner/request-harvest?propertyId=${pId}`)}
                              className="ld-btn-outline py-2 px-3.5 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                              style={{ width: 'auto' }}
                            >
                              <Axe size={15} /> Request Harvest
                            </button>
                          </div>
                        </div>

                        {/* Summary Metrics Grid */}
                        <div className="ld-kpi-grid">
                          <div className="ld-kpi-box">
                            <span className="ld-kpi-label">Land Area</span>
                            <span className="ld-kpi-number text-white">
                              {p.totalArea ? `${p.totalArea} ${p.areaUnit || 'Acres'}` : 'Residential Plot'}
                            </span>
                          </div>

                          <div className="ld-kpi-box">
                            <span className="ld-kpi-label">Total Trees Logged</span>
                            <span className="ld-kpi-number text-emerald-400 flex items-center gap-1.5">
                              <Trees size={18} /> {totalTreesCount} Standing Trees
                            </span>
                          </div>

                          <div className="ld-kpi-box">
                            <span className="ld-kpi-label">Tree Groups</span>
                            <span className="ld-kpi-number text-white">
                              {allTreeGroups.length} Species Stand{allTreeGroups.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="ld-kpi-box">
                            <span className="ld-kpi-label">Status</span>
                            <div>
                              <span className="ld-pill text-xs py-1 px-3 bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold">
                                Active Inventory
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Safety & Risk Banner */}
                        {p.riskFactors && p.riskFactors.length > 0 && (
                          <div
                            className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/35 space-y-2.5 text-xs shadow-lg"
                            style={{ marginTop: '32px', marginBottom: '32px' }}
                          >
                            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11.5px]">
                              <ShieldCheck size={18} /> Flagged Safety &amp; Hazard Factors
                            </div>
                            <div className="flex flex-wrap gap-2.5 pt-1">
                              {p.riskFactors.map((rf, idx) => (
                                <span key={idx} className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-200 text-xs font-bold border border-amber-500/40 shadow-sm">
                                  {rf}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. LOGGED TREE GROUPS SPECIFICATIONS SECTION */}
                      <div className="space-y-6 pt-6">
                        <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15">
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
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {allTreeGroups.map((tg, idx) => {
                              return (
                                <div
                                  key={idx}
                                  className="ld-card p-6 transition-all duration-300 hover:border-emerald-500/40 flex flex-col justify-between space-y-5 shadow-lg"
                                >
                                  <div className="space-y-4">
                                    {/* Group Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-emerald-500/15">
                                      <div>
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                          Tree Group #{idx + 1}
                                        </span>
                                        <h4 className="text-xl font-extrabold text-white mt-0.5">
                                          {tg.species}
                                        </h4>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="ld-pill text-xs py-1 px-3">
                                          {tg.count} Trees
                                        </span>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${tg.condition === 'Healthy'
                                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                            : tg.condition === 'Damaged'
                                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                          }`}>
                                          {tg.condition}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Specifications Subcards Grid */}
                                    <div className="grid grid-cols-2 gap-3.5 text-xs">
                                      <div className="ld-subcard space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approximate Age</span>
                                        <span className="font-bold text-white text-sm block">{tg.age}</span>
                                      </div>
                                      <div className="ld-subcard space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logged Quantity</span>
                                        <span className="font-bold text-emerald-400 text-sm block">{tg.count} Standing Trees</span>
                                      </div>
                                    </div>

                                    {/* Plot Position */}
                                    <div className="ld-subcard text-xs space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location / Plot Position within Estate</span>
                                      <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                                        📍 {tg.location}
                                      </span>
                                    </div>

                                    {/* Special Notes / Observations */}
                                    {tg.notes && (
                                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                                          Special Notes / Observations
                                        </span>
                                        <p className="text-amber-200 leading-relaxed">{tg.notes}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Footer */}
                                  <div className="pt-3 border-t border-emerald-500/15 flex items-center justify-between gap-3">
                                    <span className="text-xs text-slate-400 font-medium">Ready for contractor bidding</span>
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/landowner/request-harvest?propertyId=${pId}`)}
                                      className="ld-btn-outline py-2 px-3.5 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                                      style={{ width: 'auto' }}
                                    >
                                      <Axe size={14} /> Request Harvest
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="ld-subcard p-10 text-center space-y-4">
                            <Trees size={44} className="mx-auto text-emerald-500/40" />
                            <p className="text-sm text-slate-400">No tree inventory recorded for this property yet.</p>
                            <button
                              onClick={() => navigate(`/landowner/add-inventory?propertyId=${pId}`)}
                              className="ld-btn-green py-2 px-4 text-xs"
                              style={{ width: 'auto' }}
                            >
                              <Plus size={16} /> Log Tree Inventory Now
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 3. DEDICATED STANDING TREE PHOTOS & SPECIES MEDIA GALLERY SECTION */}
                      {(() => {
                        // Collect real attached photos only
                        const realTreePhotos = [];
                        allTreeGroups.forEach((tg, idx) => {
                          if (tg.attachedPhotos && tg.attachedPhotos.length > 0) {
                            tg.attachedPhotos.forEach(ph => {
                              if (ph && typeof ph === 'string' && !ph.startsWith('blob:')) {
                                realTreePhotos.push({
                                  url: ph,
                                  species: tg.species,
                                  count: tg.count,
                                  location: tg.location,
                                  condition: tg.condition,
                                  standIndex: idx + 1
                                });
                              }
                            });
                          }
                        });

                        if (realTreePhotos.length === 0) return null;

                        return (
                          <div
                            className="space-y-6 border-t border-emerald-500/20"
                            style={{ marginTop: '48px', paddingTop: '32px' }}
                          >
                            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-emerald-500/15">
                              <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                                  <Camera size={22} className="text-emerald-400" /> Standing Tree Photos &amp; Species Gallery ({realTreePhotos.length})
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                  High resolution tree species photos, standing trunk images, and canopy visual logs.
                                </p>
                              </div>
                              <span className="ld-pill text-xs py-1 px-3">
                                Click 'View Photo' to inspect image
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              {realTreePhotos.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="ld-subcard p-0 rounded-2xl overflow-hidden shadow-lg group flex flex-col justify-between"
                                >
                                  {/* Photo Display Card */}
                                  <div className="relative h-48 w-full bg-[#0e1612] overflow-hidden group">
                                    <img
                                      src={item.url}
                                      alt={item.species}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d] via-transparent to-transparent"></div>

                                    {/* Hover Overlay */}
                                    <div
                                      onClick={() => openLightbox([item.url], 0, `${p.propertyName} - ${item.species} (${item.count} Trees)`)}
                                      className="absolute inset-0 bg-[#0a0f0d]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer backdrop-blur-xs z-10"
                                    >
                                      <div className="flex items-center gap-2 bg-[#121a16] px-4 py-2 rounded-2xl border border-emerald-500/30 shadow-2xl transform scale-95 group-hover:scale-100 transition-transform">
                                        <ZoomIn size={20} className="text-emerald-400" />
                                        <span className="text-base font-extrabold text-white tracking-wide">View</span>
                                      </div>
                                    </div>

                                    <span className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-[#0a0f0d]/80 backdrop-blur border border-emerald-500/30 text-emerald-300 text-xs font-bold shadow z-0">
                                      {item.species} ({item.count} Trees)
                                    </span>

                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-0">
                                      <span className="text-xs text-slate-300 font-semibold truncate max-w-[180px]">
                                        📍 {item.location}
                                      </span>
                                      <span className="text-xs text-emerald-400 font-bold bg-[#0a0f0d]/80 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                                        {item.condition}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Card Action Footer with View Tree Photo button */}
                                  <div className="p-4 bg-[#0e1612] border-t border-emerald-500/15 flex items-center justify-between gap-2">
                                    <span className="text-xs text-slate-400 font-medium">Tree Stand #{item.standIndex}</span>
                                    <button
                                      type="button"
                                      onClick={() => openLightbox([item.url], 0, `${p.propertyName} - ${item.species} (${item.count} Trees)`)}
                                      className="ld-btn-outline py-1.5 px-3 text-xs"
                                      style={{ width: 'auto' }}
                                    >
                                      <ZoomIn size={14} className="text-emerald-400" />
                                      <span>View Tree Photo</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 4. PROPERTY PHOTOS & ESTATE MEDIA GALLERY SECTION */}
                      {propertyPhotos.length > 0 && (
                        <div
                          className="space-y-4 border-t border-emerald-500/20"
                          style={{ marginTop: '48px', paddingTop: '32px' }}
                        >
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
                                className="group relative h-36 rounded-xl overflow-hidden border border-emerald-500/20 bg-[#0e1612] cursor-pointer shadow-md hover:border-emerald-500/60 transition-all"
                              >
                                <img
                                  src={url}
                                  alt={`Property Photo ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-[#0a0f0d]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer backdrop-blur-xs">
                                  <div className="flex items-center gap-2 bg-[#121a16] px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-lg">
                                    <ZoomIn size={16} className="text-emerald-400" />
                                    <span className="text-xs font-bold text-white tracking-wide">View</span>
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
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#0a0f0d]/95 backdrop-blur-md animate-fade-in">
                <div className="max-w-4xl w-full p-6 border border-emerald-500/30 rounded-2xl bg-[#121a16] space-y-4 shadow-2xl relative">

                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
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
                      className="p-1.5 rounded-lg bg-[#0e1612] border border-emerald-500/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Main Image View */}
                  <div className="relative max-h-[65vh] flex items-center justify-center overflow-hidden rounded-xl bg-[#0a0f0d] border border-emerald-500/20 p-2">
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
                          className="absolute left-4 p-2.5 rounded-full bg-[#0a0f0d]/80 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg cursor-pointer"
                        >
                          <ChevronLeft size={22} />
                        </button>
                        <button
                          onClick={() => setActivePhotoModal(prev => ({
                            ...prev,
                            index: prev.index === prev.photos.length - 1 ? 0 : prev.index + 1
                          }))}
                          className="absolute right-4 p-2.5 rounded-full bg-[#0a0f0d]/80 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg cursor-pointer"
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
                      className="ld-btn-outline py-2 px-5 text-xs"
                      style={{ width: 'auto' }}
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
