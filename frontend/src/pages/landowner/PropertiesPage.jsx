import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import {
  Trees,
  Plus,
  MapPin,
  ExternalLink,
  AlertTriangle,
  Edit3,
  Trash2,
  Camera,
  Video,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Axe,
  ShieldAlert,
  Layers,
  Globe,
  Compass,
  Ruler,
  User,
  Phone,
  FileText,
  CheckCircle2,
  Package,
  Sparkles,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80';

const PropertiesPage = () => {
  const navigate = useNavigate();
  const { properties, inventories, updateProperty, deleteProperty } = useLandowner();

  // Modal States
  const [activeMediaModal, setActiveMediaModal] = useState(null); // { photos: [], videos: [], title: '', index: 0, activeTab: 'photos' }
  const [editingProperty, setEditingProperty] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  // Normalize property data safely across DB & local formats
  const getNormalizedProperty = (prop) => {
    const propId = prop.id || prop._id || `prop_${Math.random()}`;
    const photos = Array.isArray(prop.photos) && prop.photos.length > 0
      ? prop.photos
      : (prop.image ? [prop.image] : []);
    const videos = Array.isArray(prop.videos) ? prop.videos : [];
    
    // Find matching inventories in LandownerContext
    const matchingInventories = (inventories || []).filter(inv => 
      inv.propertyId === propId ||
      inv.propertyId === prop.id ||
      inv.propertyId === prop._id ||
      String(inv.propertyId) === String(propId) ||
      String(inv.propertyId) === String(prop.id) ||
      String(inv.propertyId) === String(prop._id)
    );

    // Aggregate inventory groups & tree counts
    let inventoryGroups = [];
    let calculatedTreesCount = 0;

    matchingInventories.forEach(inv => {
      if (Array.isArray(inv.speciesList)) {
        inv.speciesList.forEach(sp => {
          const count = Number(sp.numberOfTrees || sp.count || 0);
          calculatedTreesCount += count;
          inventoryGroups.push({
            species: sp.treeSpecies || sp.species || 'Teak',
            count,
            health: sp.healthCondition || 'Healthy',
            age: sp.treeAge || sp.age ? `${sp.treeAge || sp.age} years` : '15 years',
            location: sp.locationOnProperty || sp.location || 'Boundary area'
          });
        });
      }
    });

    // Fallback if no specific inventory item registered yet but summary count exists
    const totalTrees = calculatedTreesCount > 0
      ? calculatedTreesCount
      : (typeof prop.approxTreesCount === 'number' ? prop.approxTreesCount : parseInt(prop.approxTreesCount) || 0);

    if (inventoryGroups.length === 0 && totalTrees > 0) {
      inventoryGroups.push({
        species: prop.mainSpecies || 'Timber Trees',
        count: totalTrees,
        health: 'Healthy',
        age: '15 years',
        location: 'Front yard / Boundary area'
      });
    }

    // Safety Hazard detection
    const hasRiskFactors = (Array.isArray(prop.riskFactors) && prop.riskFactors.length > 0) || Boolean(prop.riskNotes) || Boolean(prop.safetyHazardNote) || Boolean(prop.hasSafetyHazard);
    const riskNoteText = prop.riskNotes || prop.safetyHazardNote || (Array.isArray(prop.riskFactors) ? prop.riskFactors.join(', ') : 'Close to House / Roof Structure');

    const lat = prop.latitude || prop.gpsLat || (prop.coordinates ? prop.coordinates.lat : 9.5280);
    const lng = prop.longitude || prop.gpsLng || (prop.coordinates ? prop.coordinates.lng : 76.8221);
    
    const formattedAddress = prop.address || [prop.village, prop.localBody, prop.district, prop.state].filter(Boolean).join(', ') || 'TreeConnect address, Kottayam, Kerala';

    const mapUrl = lat && lng 
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress)}`;

    return {
      raw: prop,
      id: propId,
      name: prop.propertyName || prop.name || prop.title || 'TreeConnect Property',
      type: prop.propertyType || prop.category || 'Residential Property',
      ownerName: prop.ownerName || 'Property Owner',
      contactNumber: prop.contactNumber || '',
      address: formattedAddress,
      village: prop.village || '',
      localBody: prop.localBody || '',
      district: prop.district || '',
      state: prop.state || 'Kerala',
      pinCode: prop.pinCode || prop.postalCode || '',
      lat,
      lng,
      mapUrl,
      totalArea: prop.totalArea || prop.landArea || '12',
      areaUnit: prop.areaUnit || 'Cents',
      totalTrees,
      inventoryGroups,
      matchingInventoriesCount: matchingInventories.length,
      hasSafetyHazard: hasRiskFactors,
      safetyHazardText: riskNoteText,
      description: prop.description || '',
      photos,
      videos,
      heroImage: photos.length > 0 ? photos[0] : DEFAULT_PROPERTY_IMAGE
    };
  };

  // Summary Metrics across all landowner properties
  const normalizedProperties = (properties || []).map(getNormalizedProperty);
  const totalEstatesCount = normalizedProperties.length;
  const totalTreesLogged = normalizedProperties.reduce((acc, p) => acc + p.totalTrees, 0);
  const totalHazardsFlagged = normalizedProperties.filter(p => p.hasSafetyHazard).length;

  // Handlers for Edit Modal
  const openEditModal = (normProp) => {
    setEditingProperty(normProp);
    setEditFormData({
      propertyName: normProp.name,
      propertyType: normProp.type,
      ownerName: normProp.ownerName,
      contactNumber: normProp.contactNumber,
      totalArea: normProp.totalArea,
      areaUnit: normProp.areaUnit,
      address: normProp.address,
      village: normProp.village,
      district: normProp.district,
      description: normProp.description,
      photosText: normProp.photos.join(', '),
      videosText: normProp.videos.join(', '),
      safetyHazardText: normProp.safetyHazardText
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingProperty) return;

    const photosList = editFormData.photosText
      ? editFormData.photosText.split(',').map(s => s.trim()).filter(Boolean)
      : editingProperty.photos;

    const videosList = editFormData.videosText
      ? editFormData.videosText.split(',').map(s => s.trim()).filter(Boolean)
      : editingProperty.videos;

    const updatedPayload = {
      propertyName: editFormData.propertyName,
      propertyType: editFormData.propertyType,
      ownerName: editFormData.ownerName,
      contactNumber: editFormData.contactNumber,
      totalArea: editFormData.totalArea,
      areaUnit: editFormData.areaUnit,
      address: editFormData.address,
      village: editFormData.village,
      district: editFormData.district,
      description: editFormData.description,
      photos: photosList,
      videos: videosList,
      riskNotes: editFormData.safetyHazardText,
      safetyHazardNote: editFormData.safetyHazardText
    };

    await updateProperty(editingProperty.id, updatedPayload);
    setEditingProperty(null);
  };

  // Handlers for Delete Modal
  const openDeleteModal = (normProp) => {
    setPropertyToDelete(normProp);
  };

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;
    await deleteProperty(propertyToDelete.id);
    setPropertyToDelete(null);
  };

  // Handlers for Media Viewer Modal
  const openMediaModal = (normProp, initialTab = 'photos') => {
    const photos = normProp.photos.length > 0 ? normProp.photos : [DEFAULT_PROPERTY_IMAGE];
    const videos = normProp.videos;
    setActiveMediaModal({
      title: normProp.name,
      photos,
      videos,
      index: 0,
      activeTab: photos.length > 0 ? 'photos' : (videos.length > 0 ? 'videos' : 'photos')
    });
  };

  return (
    <div className="dashboard-layout min-h-screen bg-[#070b09] text-slate-100 flex flex-col font-sans">
      <Navbar />
      <div className="dashboard-body flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="dashboard-workspace flex-1 overflow-y-auto">
          <main className="dashboard-content max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* 1. PAGE HEADER REDESIGN */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/50 text-emerald-400 text-xs font-bold tracking-widest uppercase">
                  <Trees size={14} className="text-emerald-400" />
                  <span>Landowner Portal</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  My Properties
                </h1>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  Manage your registered properties, tree inventories, and timber operations.
                </p>
              </div>

              {/* Primary Action Button */}
              <button
                onClick={() => navigate('/landowner/register-property')}
                className="inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 transition-all duration-200 w-full md:w-auto cursor-pointer group shrink-0"
              >
                <Plus size={18} className="group-hover:scale-110 transition-transform duration-200" />
                <span>Register Property</span>
              </button>
            </div>

            {/* 2. PROPERTY SUMMARY / CONTEXT BAR (Shown when properties exist) */}
            {normalizedProperties.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Layers size={20} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Registered Estates</div>
                    <div className="text-lg font-bold text-white">{totalEstatesCount} {totalEstatesCount === 1 ? 'Estate' : 'Estates'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Trees size={20} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Trees Logged</div>
                    <div className="text-lg font-bold text-emerald-400">{totalTreesLogged} Trees</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Safety Risks</div>
                    <div className="text-lg font-bold text-amber-300">{totalHazardsFlagged} Flagged</div>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-3 lg:col-span-1 flex items-center gap-3.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Portal Status</div>
                    <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Verified Landowner
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PROPERTY CARDS GRID OR EMPTY STATE */}
            {normalizedProperties.length === 0 ? (
              /* 12. EMPTY STATE */
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-14 text-center max-w-xl mx-auto my-8 space-y-6 shadow-2xl backdrop-blur-md">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
                  <Trees size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">No properties registered yet</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                    Register your first property to begin managing trees, tree inventories, and timber harvesting operations.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/landowner/register-property')}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
                >
                  <Plus size={18} />
                  <span>Register Property</span>
                </button>
              </div>
            ) : (
              /* DESKTOP 2-COLUMN GRID / TABLET & MOBILE 1-COLUMN */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {normalizedProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700/80 hover:shadow-2xl hover:shadow-emerald-950/20 transition-all duration-300 flex flex-col group"
                  >
                    {/* 4. PROPERTY HERO IMAGE */}
                    <div className="h-[200px] sm:h-[230px] w-full relative overflow-hidden bg-slate-950">
                      <img
                        src={prop.heroImage}
                        alt={prop.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                        onError={(e) => {
                          e.target.src = DEFAULT_PROPERTY_IMAGE;
                        }}
                      />
                      {/* Gradient overlay at bottom so badges remain readable */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent pointer-events-none" />

                      {/* Property Type Badge (Top Right Pill) */}
                      <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-emerald-400 text-xs px-3 py-1 rounded-full font-semibold shadow-md z-10 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>{prop.type}</span>
                      </div>

                      {/* Compact Glass-Style Media Indicators (Bottom Left) */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                        {prop.photos.length > 0 && (
                          <button
                            onClick={() => openMediaModal(prop, 'photos')}
                            className="bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:text-white text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                            title="Click to view photos"
                          >
                            <Camera size={13} className="text-emerald-400" />
                            <span>{prop.photos.length} {prop.photos.length === 1 ? 'Photo' : 'Photos'}</span>
                          </button>
                        )}

                        {prop.videos.length > 0 && (
                          <button
                            onClick={() => openMediaModal(prop, 'videos')}
                            className="bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:text-white text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                            title="Click to view videos"
                          >
                            <Video size={13} className="text-emerald-400" />
                            <span>{prop.videos.length} {prop.videos.length === 1 ? 'Video' : 'Videos'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* CARD BODY CONTENT */}
                    <div className="p-5 sm:p-6 space-y-5 flex-1 flex flex-col">
                      
                      {/* 5. PROPERTY INFORMATION */}
                      <div className="space-y-2">
                        <h2 className="text-xl sm:text-[22px] font-bold text-white tracking-tight line-clamp-2 leading-snug">
                          {prop.name}
                        </h2>
                        
                        <div className="text-xs sm:text-sm text-slate-400 flex items-start gap-2 leading-relaxed min-w-0 break-words">
                          <MapPin size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span className="min-w-0 break-words">{prop.address}</span>
                        </div>
                      </div>

                      {/* 6. GPS / MAP LOCATION ROW */}
                      <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center justify-between gap-2 text-emerald-300/90">
                        <div className="flex items-center gap-2 truncate">
                          <Compass size={14} className="text-emerald-400 shrink-0" />
                          <span className="truncate font-mono">◎ {prop.lat}°, {prop.lng}°</span>
                        </div>
                        <a
                          href={prop.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 shrink-0 transition-colors"
                        >
                          <span>View Map</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>

                      {/* 7. LAND AREA / TREE INVENTORY METRICS */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5 sm:p-4 hover:border-slate-600/50 transition-colors">
                          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                            Land Area
                          </div>
                          <div className="text-lg sm:text-xl font-extrabold text-white">
                            {prop.totalArea} <span className="text-xs sm:text-sm font-normal text-slate-400">{prop.areaUnit}</span>
                          </div>
                        </div>

                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5 sm:p-4 hover:border-slate-600/50 transition-colors">
                          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                            Tree Inventory
                          </div>
                          <div className="text-lg sm:text-xl font-extrabold text-emerald-400">
                            {prop.totalTrees} {prop.totalTrees === 1 ? 'Tree' : 'Trees'} <span className="text-xs font-semibold text-emerald-500/80">Logged</span>
                          </div>
                        </div>
                      </div>

                      {/* 8. SAFETY & HAZARD SECTION */}
                      {prop.hasSafetyHazard && (
                        <div className="bg-amber-950/30 border border-amber-500/35 rounded-xl p-3.5 sm:p-4 space-y-2 text-amber-200/90 text-xs sm:text-sm">
                          <div className="text-[11px] font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                            <span>Safety & Hazard</span>
                          </div>
                          <div className="font-semibold text-amber-200">
                            {prop.safetyHazardText}
                          </div>
                          <div className="text-[11px] text-amber-300/80 leading-relaxed pt-0.5">
                            <span className="font-bold">Action Required:</span> Safety hazard flagged. Requires cautious felling and trained arborists.
                          </div>
                        </div>
                      )}

                      {/* 9. TREE INVENTORY SECTION */}
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <Trees size={14} className="text-emerald-400" />
                            <span>Tree Inventory</span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                            {prop.inventoryGroups.length} {prop.inventoryGroups.length === 1 ? 'Group' : 'Groups'}
                          </span>
                        </div>

                        {prop.inventoryGroups.length === 0 ? (
                          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 text-center text-xs text-slate-400">
                            No trees recorded for this estate yet.
                          </div>
                        ) : (
                          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {prop.inventoryGroups.map((group, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs hover:border-slate-700 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-100 text-xs sm:text-sm">
                                    {group.species} <span className="text-slate-400 font-normal">({group.count} {group.count === 1 ? 'Tree' : 'Trees'})</span>
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      group.health?.toLowerCase().includes('healthy')
                                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50'
                                        : group.health?.toLowerCase().includes('damage')
                                        ? 'bg-amber-950/80 text-amber-300 border-amber-800/50'
                                        : 'bg-rose-950/80 text-rose-300 border-rose-800/50'
                                    }`}
                                  >
                                    {group.health}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                                  <div className="flex items-center gap-1 truncate max-w-[200px]">
                                    <MapPin size={11} className="text-emerald-400 shrink-0" />
                                    <span className="truncate">{group.location}</span>
                                  </div>
                                  <span className="shrink-0 font-medium text-slate-400">{group.age}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* 10. ACTION BUTTONS & 11. CARD FOOTER */}
                    <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 sm:p-5 rounded-b-2xl mt-auto space-y-3">
                      {/* Primary Actions Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          onClick={() => navigate(`/landowner/inventory?propertyId=${prop.id}`)}
                          className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                        >
                          <Package size={16} />
                          <span>View Inventory ({prop.totalTrees})</span>
                        </button>

                        <button
                          onClick={() => navigate(`/landowner/request-harvest?propertyId=${prop.id}`)}
                          className="bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Axe size={16} className="text-amber-400" />
                          <span>Request Harvest</span>
                        </button>
                      </div>

                      {/* Secondary Actions Row */}
                      <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                        <button
                          onClick={() => openEditModal(prop)}
                          className="bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 hover:text-white font-medium py-2 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Edit3 size={14} />
                          <span>Edit Details</span>
                        </button>

                        <button
                          onClick={() => openDeleteModal(prop)}
                          className="bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 hover:text-rose-200 font-medium py-2 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </main>
        </div>
      </div>

      {/* 13. MEDIA VIEWER LIGHTBOX MODAL */}
      {activeMediaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div>
                <h3 className="text-lg font-bold text-white">{activeMediaModal.title}</h3>
                <p className="text-xs text-slate-400">Media Gallery & Attachments</p>
              </div>

              {/* Tab selector if both photo & video present */}
              <div className="flex items-center gap-2">
                {activeMediaModal.photos.length > 0 && (
                  <button
                    onClick={() => setActiveMediaModal(prev => ({ ...prev, activeTab: 'photos', index: 0 }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeMediaModal.activeTab === 'photos'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Photos ({activeMediaModal.photos.length})
                  </button>
                )}
                {activeMediaModal.videos.length > 0 && (
                  <button
                    onClick={() => setActiveMediaModal(prev => ({ ...prev, activeTab: 'videos', index: 0 }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeMediaModal.activeTab === 'videos'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Videos ({activeMediaModal.videos.length})
                  </button>
                )}

                <button
                  onClick={() => setActiveMediaModal(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ml-2 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Viewer Body */}
            <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
              {activeMediaModal.activeTab === 'photos' ? (
                activeMediaModal.photos.length > 0 ? (
                  <div className="relative w-full flex items-center justify-center">
                    <img
                      src={activeMediaModal.photos[activeMediaModal.index]}
                      alt="Property media"
                      className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
                    />

                    {/* Prev / Next controls */}
                    {activeMediaModal.photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveMediaModal(prev => ({
                            ...prev,
                            index: (prev.index - 1 + prev.photos.length) % prev.photos.length
                          }))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition-all cursor-pointer"
                        >
                          <ChevronLeft size={22} />
                        </button>
                        <button
                          onClick={() => setActiveMediaModal(prev => ({
                            ...prev,
                            index: (prev.index + 1) % prev.photos.length
                          }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition-all cursor-pointer"
                        >
                          <ChevronRight size={22} />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No photos attached.</p>
                )
              ) : (
                activeMediaModal.videos.length > 0 ? (
                  <div className="w-full flex items-center justify-center">
                    <video
                      src={activeMediaModal.videos[activeMediaModal.index]}
                      controls
                      autoPlay
                      className="max-h-[60vh] max-w-full rounded-xl shadow-2xl border border-slate-800"
                    />
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No videos attached.</p>
                )
              )}
            </div>

            {/* Thumbnail Strip */}
            {activeMediaModal.activeTab === 'photos' && activeMediaModal.photos.length > 1 && (
              <div className="flex items-center justify-center gap-2 p-3 bg-slate-900 border-t border-slate-800 overflow-x-auto">
                {activeMediaModal.photos.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveMediaModal(prev => ({ ...prev, index: i }))}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      i === activeMediaModal.index ? 'border-emerald-500 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 13. EDIT PROPERTY MODAL */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Property Details</h3>
                <p className="text-xs text-slate-400">Update property information, metrics, and safety flags.</p>
              </div>
              <button
                onClick={() => setEditingProperty(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
                
                {/* Section 1: Property Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <FileText size={14} />
                    <span>Property Information</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">Property Name</label>
                      <input
                        type="text"
                        value={editFormData.propertyName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, propertyName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">Property Category</label>
                      <select
                        value={editFormData.propertyType || 'Residential Property'}
                        onChange={(e) => setEditFormData({ ...editFormData, propertyType: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="Residential Property">Residential Property</option>
                        <option value="Commercial Timber Estate">Commercial Timber Estate</option>
                        <option value="Rubber Plantation">Rubber Plantation</option>
                        <option value="Forest Plantation">Forest Plantation</option>
                        <option value="Agricultural Land">Agricultural Land</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Owner Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <User size={14} />
                    <span>Owner Information</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">Owner Name</label>
                      <input
                        type="text"
                        value={editFormData.ownerName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">Contact Number</label>
                      <input
                        type="text"
                        value={editFormData.contactNumber || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Land Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <Ruler size={14} />
                    <span>Land Information</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">Land Area</label>
                      <input
                        type="text"
                        value={editFormData.totalArea || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, totalArea: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">Area Unit</label>
                      <select
                        value={editFormData.areaUnit || 'Acres'}
                        onChange={(e) => setEditFormData({ ...editFormData, areaUnit: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="Acres">Acres</option>
                        <option value="Cents">Cents</option>
                        <option value="Hectares">Hectares</option>
                        <option value="Sq. Feet">Sq. Feet</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Location */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <MapPin size={14} />
                    <span>Location</span>
                  </h4>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Address</label>
                    <textarea
                      rows={2}
                      value={editFormData.address || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">Village / Local Body</label>
                      <input
                        type="text"
                        value={editFormData.village || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, village: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">District</label>
                      <input
                        type="text"
                        value={editFormData.district || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 5: Description & Safety */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <AlertTriangle size={14} />
                    <span>Description & Safety Hazards</span>
                  </h4>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Safety & Hazard Callout Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Close to House / Roof Structure"
                      value={editFormData.safetyHazardText || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, safetyHazardText: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Property Description</label>
                    <textarea
                      rows={3}
                      value={editFormData.description || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Section 6: Media URLs */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <Camera size={14} />
                    <span>Media Links</span>
                  </h4>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Photo Image URLs (comma separated)</label>
                    <textarea
                      rows={2}
                      value={editFormData.photosText || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, photosText: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Video URLs (comma separated)</label>
                    <textarea
                      rows={2}
                      value={editFormData.videosText || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, videosText: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-950/50 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 14. DELETE CONFIRMATION MODAL */}
      {propertyToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Property</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">"{propertyToDelete.name}"</span>? Associated tree inventories and registered records for this property will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPropertyToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-medium text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-md shadow-rose-950/50 transition-colors cursor-pointer"
              >
                Delete Property
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PropertiesPage;
