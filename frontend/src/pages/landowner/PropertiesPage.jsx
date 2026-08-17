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
  Search,
  Database,
  Building2,
  Mail,
  Loader2
} from 'lucide-react';

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80';

const PropertiesPage = () => {
  const navigate = useNavigate();
  const { properties, inventories, updateProperty, deleteProperty } = useLandowner();

  // Search & District Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

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

  // Summary Metrics & Filtered Properties
  const normalizedProperties = (properties || []).map(getNormalizedProperty);
  const totalEstatesCount = normalizedProperties.length;
  const totalTreesLogged = normalizedProperties.reduce((acc, p) => acc + p.totalTrees, 0);
  const totalHazardsFlagged = normalizedProperties.filter(p => p.hasSafetyHazard).length;

  const filteredProperties = normalizedProperties.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.localBody?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pinCode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDistrict =
      districtFilter === 'all' || p.district?.toLowerCase() === districtFilter.toLowerCase();

    return matchesSearch && matchesDistrict;
  });

  const districtsList = Array.from(
    new Set(normalizedProperties.map((p) => p.district).filter(Boolean))
  );

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
    <div className="landowner-dashboard-page">
      <Navbar />
      <div className="landowner-dashboard-container">
        <Sidebar />

        <div className="landowner-dashboard-workspace">
          <main className="w-full flex flex-col gap-8">
            
            {/* Header Section styled after Landowner Dashboard */}
            <section className="ld-card ld-hero-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="ld-hero-tag">
                    <Trees size={14} /> FORESTRY ESTATE PORTFOLIO
                  </div>
                  <h1 className="ld-hero-heading mt-1">My Registered Properties</h1>
                  <p className="ld-hero-subtext mt-1">
                    Directory of your forest estates, plots, and land parcels registered for tree inventory and harvest management.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <span className="ld-pill">
                    <Database size={13} className="text-emerald-400" /> <strong>{filteredProperties.length}</strong> Registered
                  </span>

                  <button
                    onClick={() => navigate('/landowner/register-property')}
                    className="ld-btn-green"
                    style={{ padding: '10px 20px', fontSize: '13.5px', width: 'auto' }}
                  >
                    <Plus size={16} /> Register Property
                  </button>
                </div>
              </div>

              {/* Controls Bar: District Filter & Search Input */}
              <div className="prop-controls-bar">
                <div className="prop-filter-group">
                  <span className="prop-filter-label">District:</span>
                  <select
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                    className="prop-filter-select"
                  >
                    <option value="all">All Districts</option>
                    {districtsList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="prop-search-box">
                  <Search size={18} className="prop-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by property name, village, local body, district, PIN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="prop-search-input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="prop-search-clear"
                      title="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Active Filter Metrics Sub-bar */}
              {(searchQuery || districtFilter !== 'all') && (
                <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-emerald-500/10 text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Showing <strong className="text-emerald-400 font-bold">{filteredProperties.length}</strong> of <strong>{normalizedProperties.length}</strong> properties
                    {districtFilter !== 'all' && <span> in <strong className="text-white">{districtFilter}</strong></span>}
                    {searchQuery && <span> matching "<strong className="text-white">{searchQuery}</strong>"</span>}
                  </span>
                  <button
                    onClick={() => { setSearchQuery(''); setDistrictFilter('all'); }}
                    className="text-emerald-400 hover:text-emerald-300 hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer ml-2 shrink-0"
                  >
                    <X size={12} /> Reset Filters
                  </button>
                </div>
              )}
            </section>

            {/* KPI Summary Context Cards */}
            {normalizedProperties.length > 0 && (
              <div className="ld-kpi-grid">
                <div className="ld-kpi-box">
                  <div className="ld-kpi-header">
                    <span className="ld-kpi-label">Registered Estates</span>
                    <div className="ld-kpi-icon">
                      <Layers size={18} />
                    </div>
                  </div>
                  <div className="ld-kpi-number">{totalEstatesCount} {totalEstatesCount === 1 ? 'Estate' : 'Estates'}</div>
                </div>

                <div className="ld-kpi-box">
                  <div className="ld-kpi-header">
                    <span className="ld-kpi-label">Trees Logged</span>
                    <div className="ld-kpi-icon">
                      <Trees size={18} />
                    </div>
                  </div>
                  <div className="ld-kpi-number" style={{ color: '#34d399' }}>{totalTreesLogged} Trees</div>
                </div>

                <div className="ld-kpi-box">
                  <div className="ld-kpi-header">
                    <span className="ld-kpi-label">Safety Risks</span>
                    <div className="ld-kpi-icon" style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.28)' }}>
                      <ShieldAlert size={18} />
                    </div>
                  </div>
                  <div className="ld-kpi-number" style={{ color: '#fbbf24' }}>{totalHazardsFlagged} Flagged</div>
                </div>

                <div className="ld-kpi-box">
                  <div className="ld-kpi-header">
                    <span className="ld-kpi-label">Portal Status</span>
                    <div className="ld-kpi-icon">
                      <Sparkles size={18} />
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Verified Landowner
                  </div>
                </div>
              </div>
            )}

            {/* Properties Grid or Empty State */}
            {filteredProperties.length === 0 ? (
              <div className="ld-card text-center py-16 space-y-4">
                <Trees size={48} className="text-emerald-500/40 mx-auto" />
                <h3 className="font-bold text-white text-lg">No Registered Properties Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {normalizedProperties.length === 0
                    ? 'Register your first property to begin managing standing trees, tree inventories, and timber harvesting operations.'
                    : 'No registered properties match your search or filter criteria. Try resetting your search query.'}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/landowner/register-property')}
                    className="ld-btn-green inline-flex items-center gap-2 py-2.5 px-5 text-xs"
                    style={{ width: 'auto' }}
                  >
                    <Plus size={16} />
                    <span>Register Property</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="ld-card p-6 flex flex-col justify-between space-y-5 transition-all duration-200 hover:border-emerald-500/40 shadow-xl"
                  >
                    <div className="space-y-4">
                      {/* Property Hero Image Cover */}
                      <div className="relative h-52 rounded-xl overflow-hidden bg-[#0e1612] border border-emerald-500/15 group">
                        <img
                          src={prop.heroImage}
                          alt={prop.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = DEFAULT_PROPERTY_IMAGE;
                          }}
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d]/90 via-transparent to-[#0a0f0d]/30" />

                        {/* Top Left Status Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="ld-badge-green shadow-md backdrop-blur-md">
                            ACTIVE ESTATE
                          </span>
                        </div>

                        {/* Top Right Land Area Badge */}
                        {prop.totalArea && (
                          <div className="absolute top-3 right-3 z-10">
                            <span className="ld-pill text-[11px] py-1 px-3 bg-[#0a0f0d]/80 backdrop-blur-md border-emerald-500/30">
                              <Ruler size={12} className="text-emerald-400" />
                              {prop.totalArea} {prop.areaUnit || 'Acres'}
                            </span>
                          </div>
                        )}

                        {/* Media Buttons bottom-left */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                          {prop.photos.length > 0 && (
                            <button
                              onClick={() => openMediaModal(prop, 'photos')}
                              className="ld-pill text-[11px] py-1 px-2.5 bg-[#0a0f0d]/80 backdrop-blur-md border-emerald-500/30 hover:text-white cursor-pointer"
                              title="Click to view photos"
                            >
                              <Camera size={12} className="text-emerald-400" />
                              <span>{prop.photos.length} Photos</span>
                            </button>
                          )}
                          {prop.videos.length > 0 && (
                            <button
                              onClick={() => openMediaModal(prop, 'videos')}
                              className="ld-pill text-[11px] py-1 px-2.5 bg-[#0a0f0d]/80 backdrop-blur-md border-emerald-500/30 hover:text-white cursor-pointer"
                              title="Click to view videos"
                            >
                              <Video size={12} className="text-emerald-400" />
                              <span>{prop.videos.length} Videos</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title & Category Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-extrabold text-white tracking-tight leading-snug">
                            {prop.name}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                            <Building2 size={13} className="text-emerald-400 shrink-0" />
                            <span>{prop.type || 'Residential Property'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Spacious 2-Column Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Owner Details Card */}
                        <div className="ld-subcard space-y-2 text-xs">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-emerald-500/10 pb-1 flex items-center justify-between">
                            <span>Owner Details</span>
                            <User size={12} className="text-emerald-400" />
                          </div>
                          
                          <div className="flex justify-between items-center pt-0.5">
                            <span className="text-slate-400 text-[11px]">Owner Name:</span>
                            <span className="font-bold text-white truncate max-w-[130px]">{prop.ownerName || 'Landowner'}</span>
                          </div>

                          {prop.contactNumber && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-[11px]">Contact Phone:</span>
                              <span className="font-bold text-slate-200">{prop.contactNumber}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-1 border-t border-emerald-500/10">
                            <span className="text-slate-400 text-[11px]">Tree Count:</span>
                            <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                              <Trees size={12} /> {prop.totalTrees} Trees
                            </span>
                          </div>
                        </div>

                        {/* Location Details Card */}
                        <div className="ld-subcard space-y-2 text-xs">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-emerald-500/10 pb-1 flex items-center justify-between">
                            <span>Property Location</span>
                            <MapPin size={12} className="text-emerald-400" />
                          </div>

                          <p className="font-bold text-white text-[12px] line-clamp-1 pt-0.5">
                            {prop.address}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {prop.village ? `${prop.village}, ` : ''}{prop.district || 'Kottayam'}, {prop.state || 'Kerala'} {prop.pinCode ? `- ${prop.pinCode}` : ''}
                          </p>

                          {prop.lat && prop.lng && (
                            <div className="pt-1 border-t border-emerald-500/10 flex justify-between items-center">
                              <span className="text-[10px] text-slate-400">GPS Map:</span>
                              <a
                                href={prop.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                              >
                                📍 {Number(prop.lat).toFixed(3)}, {Number(prop.lng).toFixed(3)}
                                <ExternalLink size={11} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Safety & Hazard Callout (if flagged) */}
                      {prop.hasSafetyHazard && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-amber-200 text-xs">
                          <div className="text-[10px] font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                            <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                            <span>Safety Hazard Flagged</span>
                          </div>
                          <p className="text-[11.5px] text-amber-300 font-medium">{prop.safetyHazardText}</p>
                        </div>
                      )}

                      {/* Tree Inventory Groups Breakdown */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Trees size={12} className="text-emerald-400" /> Inventory Species Groups
                          </span>
                          <span className="ld-pill text-[10px] py-0.5 px-2">
                            {prop.inventoryGroups.length} {prop.inventoryGroups.length === 1 ? 'Group' : 'Groups'}
                          </span>
                        </div>

                        {prop.inventoryGroups.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {prop.inventoryGroups.map((group, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-1.5 rounded-lg bg-[#0e1612] border border-emerald-500/20 text-xs flex items-center gap-2"
                              >
                                <span className="font-bold text-white">{group.species}</span>
                                <span className="text-emerald-400 font-extrabold">{group.count} trees</span>
                                <span className="text-[10px] text-slate-400">({group.health})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Bar */}
                    <div className="pt-4 border-t border-emerald-500/15 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => navigate(`/landowner/inventory?propertyId=${prop.id}`)}
                          className="ld-btn-green py-2 px-3.5 text-xs"
                          style={{ width: 'auto' }}
                        >
                          <Package size={14} /> View Inventory
                        </button>
                        <button
                          onClick={() => navigate(`/landowner/request-harvest?propertyId=${prop.id}`)}
                          className="ld-btn-outline py-2 px-3.5 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                          style={{ width: 'auto' }}
                        >
                          <Axe size={14} /> Request Harvest
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(prop)}
                          className="ld-btn-outline py-2 px-3 text-xs"
                          style={{ width: 'auto' }}
                          title="Edit Property"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(prop)}
                          className="ld-btn-outline py-2 px-3 text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                          style={{ width: 'auto' }}
                          title="Delete Property"
                        >
                          <Trash2 size={13} />
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
        <div className="fixed inset-0 z-50 bg-[#0a0f0d]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-[#121a16] border border-emerald-500/25 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/15 bg-[#0e1612]">
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
                        : 'bg-[#0e1612] text-slate-300 hover:text-white border border-emerald-500/20'
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
                        : 'bg-[#0e1612] text-slate-300 hover:text-white border border-emerald-500/20'
                    }`}
                  >
                    Videos ({activeMediaModal.videos.length})
                  </button>
                )}

                <button
                  onClick={() => setActiveMediaModal(null)}
                  className="p-1.5 rounded-lg bg-[#0e1612] border border-emerald-500/20 text-slate-400 hover:text-white transition-colors ml-2 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Viewer Body */}
            <div className="p-6 flex-1 flex flex-col items-center justify-center bg-[#0a0f0d] relative overflow-hidden">
              {activeMediaModal.activeTab === 'photos' ? (
                activeMediaModal.photos.length > 0 ? (
                  <div className="relative w-full flex items-center justify-center">
                    <img
                      src={activeMediaModal.photos[activeMediaModal.index]}
                      alt="Property media"
                      className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl border border-emerald-500/20"
                    />

                    {/* Prev / Next controls */}
                    {activeMediaModal.photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveMediaModal(prev => ({
                            ...prev,
                            index: (prev.index - 1 + prev.photos.length) % prev.photos.length
                          }))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#0a0f0d]/80 hover:bg-[#121a16] text-white border border-emerald-500/30 shadow-xl transition-all cursor-pointer"
                        >
                          <ChevronLeft size={22} />
                        </button>
                        <button
                          onClick={() => setActiveMediaModal(prev => ({
                            ...prev,
                            index: (prev.index + 1) % prev.photos.length
                          }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#0a0f0d]/80 hover:bg-[#121a16] text-white border border-emerald-500/30 shadow-xl transition-all cursor-pointer"
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
                      className="max-h-[60vh] max-w-full rounded-xl shadow-2xl border border-emerald-500/20"
                    />
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No videos attached.</p>
                )
              )}
            </div>

            {/* Thumbnail Strip */}
            {activeMediaModal.activeTab === 'photos' && activeMediaModal.photos.length > 1 && (
              <div className="flex items-center justify-center gap-2 p-3 bg-[#0e1612] border-t border-emerald-500/15 overflow-x-auto">
                {activeMediaModal.photos.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveMediaModal(prev => ({ ...prev, index: i }))}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      i === activeMediaModal.index ? 'border-emerald-500 scale-105' : 'border-emerald-500/20 opacity-60 hover:opacity-100'
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
        <div className="fixed inset-0 z-50 bg-[#0a0f0d]/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-[#121a16] border border-emerald-500/25 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/15 bg-[#0e1612]">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Property Details</h3>
                <p className="text-xs text-slate-400">Update property information, metrics, and safety flags.</p>
              </div>
              <button
                onClick={() => setEditingProperty(null)}
                className="p-1.5 rounded-lg bg-[#0e1612] border border-emerald-500/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
                
                {/* Section 1: Property Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-emerald-500/15 pb-1.5">
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
                        className="w-full bg-[#0e1612] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">Property Category</label>
                      <select
                        value={editFormData.propertyType || 'Residential Property'}
                        onChange={(e) => setEditFormData({ ...editFormData, propertyType: e.target.value })}
                        className="w-full bg-[#0e1612] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                      >
                        <option value="Residential Property" className="bg-[#0e1612] text-white">Residential Property</option>
                        <option value="Commercial Timber Estate" className="bg-[#0e1612] text-white">Commercial Timber Estate</option>
                        <option value="Rubber Plantation" className="bg-[#0e1612] text-white">Rubber Plantation</option>
                        <option value="Forest Plantation" className="bg-[#0e1612] text-white">Forest Plantation</option>
                        <option value="Agricultural Land" className="bg-[#0e1612] text-white">Agricultural Land</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Owner Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-emerald-500/15 pb-1.5">
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
                        className="w-full bg-[#0e1612] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">Contact Number</label>
                      <input
                        type="text"
                        value={editFormData.contactNumber || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
                        className="w-full bg-[#0e1612] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Land Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-emerald-500/15 pb-1.5">
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
                        className="w-full bg-[#0e1612] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">Area Unit</label>
                      <select
                        value={editFormData.areaUnit || 'Acres'}
                        onChange={(e) => setEditFormData({ ...editFormData, areaUnit: e.target.value })}
                        className="w-full bg-[#0e1612] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                      >
                        <option value="Acres" className="bg-[#0e1612] text-white">Acres</option>
                        <option value="Cents" className="bg-[#0e1612] text-white">Cents</option>
                        <option value="Hectares" className="bg-[#0e1612] text-white">Hectares</option>
                        <option value="Sq. Feet" className="bg-[#0e1612] text-white">Sq. Feet</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Location */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-emerald-500/15 pb-1.5">
                    <MapPin size={14} />
                    <span>Location</span>
                  </h4>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Address</label>
                    <textarea
                      rows={2}
                      value={editFormData.address || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full bg-[#0e1612] border border-emerald-500/20 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">Village / Local Body</label>
                      <input
                        type="text"
                        value={editFormData.village || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, village: e.target.value })}
                        className="w-full bg-[#0e1612] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">District</label>
                      <input
                        type="text"
                        value={editFormData.district || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                        className="w-full bg-[#0e1612] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 5: Description & Safety */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-emerald-500/15 pb-1.5">
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
                      className="w-full bg-[#0e1612] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Property Description</label>
                    <textarea
                      rows={3}
                      value={editFormData.description || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full bg-[#0e1612] border border-emerald-500/20 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Section 6: Media URLs */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-emerald-500/15 pb-1.5">
                    <Camera size={14} />
                    <span>Media Links</span>
                  </h4>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Photo Image URLs (comma separated)</label>
                    <textarea
                      rows={2}
                      value={editFormData.photosText || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, photosText: e.target.value })}
                      className="w-full bg-[#0e1612] border border-emerald-500/20 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Video URLs (comma separated)</label>
                    <textarea
                      rows={2}
                      value={editFormData.videosText || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, videosText: e.target.value })}
                      className="w-full bg-[#0e1612] border border-emerald-500/20 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-emerald-500/15 bg-[#0e1612]">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="ld-btn-outline py-2 px-4 text-xs"
                  style={{ width: 'auto' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ld-btn-green py-2 px-5 text-xs"
                  style={{ width: 'auto' }}
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
        <div className="fixed inset-0 z-50 bg-[#0a0f0d]/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121a16] border border-rose-500/30 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
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
                className="ld-btn-outline py-2 px-4 text-xs"
                style={{ width: 'auto' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="ld-btn-outline py-2 px-5 text-xs text-rose-400 border-rose-500/40 hover:bg-rose-500/20"
                style={{ width: 'auto' }}
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
