import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import FileUploadCard from '../../components/FileUploadCard';
import ApprovedContractorSelector from '../../components/workflow/ApprovedContractorSelector';
import './LandownerDashboard.css';
import {
  Building2,
  Trees,
  TreePine,
  Axe,
  Calendar,
  Truck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  ShieldCheck,
  Send,
  MapPin,
  Check,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80';

const getPropertyImage = (p) => {
  if (!p) return DEFAULT_PROPERTY_IMAGE;
  if (Array.isArray(p.photos) && p.photos.length > 0 && typeof p.photos[0] === 'string' && p.photos[0].trim()) {
    return p.photos[0];
  }
  if (p.image && typeof p.image === 'string' && p.image.trim()) {
    return p.image;
  }
  if (p.imageUrl && typeof p.imageUrl === 'string' && p.imageUrl.trim()) {
    return p.imageUrl;
  }
  return DEFAULT_PROPERTY_IMAGE;
};

const speciesImagesMap = {
  Teak: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
  Teakwood: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
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

const getTreePhoto = (g) => {
  if (!g) return speciesImagesMap.Other;

  const extractUrl = (ph) => {
    if (!ph) return null;
    if (typeof ph === 'string' && ph.trim()) return ph;
    if (typeof ph === 'object') {
      return ph.previewUrl || ph.dataUrl || ph.fileUrl || ph.url || ph.src || null;
    }
    return null;
  };

  const directImg = extractUrl(g.image);
  if (directImg) return directImg;

  if (Array.isArray(g.photos) && g.photos.length > 0) {
    for (const ph of g.photos) {
      const u = extractUrl(ph);
      if (u) return u;
    }
  }

  const specKey = Object.keys(speciesImagesMap).find(
    k => (g.species || '').toLowerCase().includes(k.toLowerCase())
  );
  return speciesImagesMap[specKey] || speciesImagesMap.Other;
};

const RequestHarvesting = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPropertyId = searchParams.get('propertyId');

  const landownerCtx = useLandowner() || {};
  const properties = landownerCtx.properties || [];
  const treeInventories = landownerCtx.inventories || landownerCtx.treeInventories || [];
  const rawInventories = treeInventories;
  const { addHarvestRequest, refreshProperties } = landownerCtx;

  // Trigger live refresh of properties from backend DB on mount
  useEffect(() => {
    if (typeof refreshProperties === 'function') {
      refreshProperties();
    }
  }, []);

  const safeProperties = Array.isArray(properties) ? properties : [];

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Selected Property
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropertyId || '');
  const activeProperty = safeProperties.find(
    (p) => p.id === selectedPropertyId || p._id === selectedPropertyId || String(p.id) === String(selectedPropertyId)
  ) || safeProperties[0] || null;

  useEffect(() => {
    if (!selectedPropertyId && safeProperties.length > 0) {
      setSelectedPropertyId(safeProperties[0].id || safeProperties[0]._id);
    }
  }, [safeProperties]);

  // Step 2: Live Selected Tree Inventories for active property
  const activePropertyId = activeProperty?.id || activeProperty?._id;
  const activeInventories = (rawInventories || []).filter(
    (inv) =>
      !inv.propertyId ||
      inv.propertyId === activePropertyId ||
      inv.propertyId === selectedPropertyId ||
      inv.property_id === activePropertyId ||
      inv.property_id === selectedPropertyId ||
      String(inv.propertyId) === String(activePropertyId) ||
      String(inv.propertyId) === String(selectedPropertyId) ||
      String(inv.property_id) === String(activePropertyId) ||
      String(inv.property_id) === String(selectedPropertyId)
  );

  const extractedTreeGroups = [];

  // 1. Direct groups attached to activeProperty
  const directGroups = [
    ...(activeProperty?.treeInventoryGroups || []),
    ...(activeProperty?.inventories || []),
    ...(activeProperty?.treeGroups || [])
  ];

  directGroups.forEach((g, idx) => {
    if (g) {
      const treeCount = Number(g.numberOfTrees || g.count || g.quantity || 20);
      const photos = Array.isArray(g.photos) ? g.photos : (g.photo ? [g.photo] : (g.image ? [g.image] : []));
      extractedTreeGroups.push({
        id: g.id || g._id || `direct_${idx}`,
        groupName: g.groupName || g.standName || `${g.species || g.treeSpecies || 'Teak'} Stand #${idx + 1}`,
        species: g.species || g.treeSpecies || 'Teakwood',
        numberOfTrees: treeCount,
        approxAge: g.approxAge || g.age || '14 years',
        condition: g.condition || g.healthCondition || 'Healthy',
        location: g.location || g.locationOnProperty || activeProperty?.village || activeProperty?.district || 'Kottayam',
        girth: g.girth || g.girthInfo || g.averageDbh || '65 - 85 cm',
        image: photos[0] || g.image || null,
        photos: photos,
        estimatedVolume: g.estimatedVolume || `${(treeCount * 0.75).toFixed(1)} m³`
      });
    }
  });

  // 2. Unpack live inventories and their speciesList
  activeInventories.forEach((inv, invIdx) => {
    const invPhotos = Array.isArray(inv.photos) ? inv.photos : (inv.photo ? [inv.photo] : (inv.image ? [inv.image] : []));

    if (Array.isArray(inv.speciesList) && inv.speciesList.length > 0) {
      inv.speciesList.forEach((sp, spIdx) => {
        const count = Number(sp.numberOfTrees || sp.count || sp.quantity || 20);
        const spPhotos = Array.isArray(sp.photos) && sp.photos.length > 0
          ? sp.photos
          : (sp.photo ? [sp.photo] : (sp.image ? [sp.image] : invPhotos));

        extractedTreeGroups.push({
          id: sp.id || sp._id || `inv_${invIdx}_sp_${spIdx}`,
          groupName: sp.groupName || sp.standName || `${sp.treeSpecies || sp.species || 'Teak'} Stand #${spIdx + 1}`,
          species: sp.treeSpecies || sp.species || 'Teakwood',
          numberOfTrees: count,
          approxAge: sp.approxAge || sp.treeAge || sp.age || '14 years',
          condition: sp.healthCondition || sp.condition || sp.treeCondition || 'Healthy',
          location: sp.locationOnProperty || sp.locationInProperty || sp.location || inv.treeAreaLocation || activeProperty?.district || 'Kottayam',
          girth: sp.girth || sp.girthInfo || sp.averageDbh || '65 - 85 cm',
          image: spPhotos[0] || null,
          photos: spPhotos,
          estimatedVolume: sp.estimatedVolume || `${(count * 0.75).toFixed(1)} m³`
        });
      });
    } else if (inv.species || inv.treeSpecies || inv.groupName) {
      const count = Number(inv.numberOfTrees || inv.count || 20);
      extractedTreeGroups.push({
        id: inv.id || inv._id || `inv_${invIdx}`,
        groupName: inv.groupName || inv.standName || `${inv.species || inv.treeSpecies || 'Teak'} Stand #${invIdx + 1}`,
        species: inv.species || inv.treeSpecies || 'Teakwood',
        numberOfTrees: count,
        approxAge: inv.approxAge || inv.age || '14 years',
        condition: inv.condition || inv.healthCondition || 'Healthy',
        location: inv.location || inv.treeAreaLocation || activeProperty?.district || 'Kottayam',
        girth: inv.girth || inv.girthInfo || '65 - 85 cm',
        image: invPhotos[0] || null,
        photos: invPhotos,
        estimatedVolume: inv.estimatedVolume || `${(count * 0.75).toFixed(1)} m³`
      });
    }
  });

  // Custom Stand Overrides & Measurements
  const [standMeasurements, setStandMeasurements] = useState({});
  const [customTreeGroups, setCustomTreeGroups] = useState([]);
  const [showAddStandModal, setShowAddStandModal] = useState(false);

  // New Stand Modal Form State
  const [newStandName, setNewStandName] = useState('Teakwood Stand #2');
  const [newStandSpecies, setNewStandSpecies] = useState('Teakwood');
  const [newStandCount, setNewStandCount] = useState(24);
  const [newStandGirth, setNewStandGirth] = useState('65 - 85 cm');
  const [newStandVolume, setNewStandVolume] = useState('0.8 m³');
  const [newStandAge, setNewStandAge] = useState('14 years');
  const [newStandCondition, setNewStandCondition] = useState('Healthy');

  const getStandGirth = (g) => {
    if (!g) return '65 - 85 cm';
    if (standMeasurements[g.id]?.girth !== undefined) return standMeasurements[g.id].girth;
    return g.girth || '65 - 85 cm';
  };

  const getStandVolume = (g) => {
    if (!g) return '0.8 m³';
    if (standMeasurements[g.id]?.estimatedVolume !== undefined) return standMeasurements[g.id].estimatedVolume;
    return g.estimatedVolume || '0.8 m³';
  };

  const baseTreeGroups = extractedTreeGroups.length > 0
    ? extractedTreeGroups
    : [
      {
        id: 'group_demo_1',
        groupName: 'Teak Stand #1',
        species: 'Teakwood',
        numberOfTrees: 24,
        approxAge: '14 years',
        condition: 'Healthy',
        location: activeProperty?.district || 'Kottayam',
        girth: '65 - 85 cm',
        image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
        photos: ['https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80'],
        estimatedVolume: '0.8 m³'
      }
    ];

  const availableTreeGroups = [...baseTreeGroups, ...customTreeGroups];

  const [selectedTreeGroupIds, setSelectedTreeGroupIds] = useState([]);
  const selectedTreeGroups = availableTreeGroups.filter((g) => selectedTreeGroupIds.includes(g.id));

  useEffect(() => {
    if (availableTreeGroups.length > 0) {
      setSelectedTreeGroupIds(availableTreeGroups.map((g) => g.id));
    } else {
      setSelectedTreeGroupIds([]);
    }
  }, [selectedPropertyId, treeInventories]);

  const toggleTreeGroupSelection = (groupId) => {
    setSelectedTreeGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  // Step 3: Harvest Requirements
  const [reason, setReason] = useState('Mature timber');

  // Step 4: Site Conditions
  const [accessAvailability, setAccessAvailability] = useState('Heavy vehicle access');
  const [roadCondition, setRoadCondition] = useState('Paved panchayat road');
  const [distanceFromRoad, setDistanceFromRoad] = useState('50 meters');
  const [terrain, setTerrain] = useState('Gently sloped');

  const hazardOptions = [
    'Power lines nearby',
    'Nearby buildings / structures',
    'Public road adjacent',
    'Steep ravine / slope',
    'Wet / muddy ground'
  ];
  const [hazards, setHazards] = useState(['Power lines nearby']);

  const toggleHazard = (haz) => {
    setHazards((prev) => (prev.includes(haz) ? prev.filter((h) => h !== haz) : [...prev, haz]));
  };

  const [additionalNotes, setAdditionalNotes] = useState('');
  const [sitePhotos, setSitePhotos] = useState(null);

  // Step 5: Contractor Assignment (Optional)
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [showContractorModal, setShowContractorModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Step Navigation
  const handleNextStep = () => {
    setErrorMessage('');
    if (currentStep === 1 && !activeProperty) {
      setErrorMessage('Please select a registered property first.');
      return;
    }
    if (currentStep === 2 && availableTreeGroups.length > 0 && selectedTreeGroupIds.length === 0) {
      setErrorMessage('Please select at least one tree inventory group for harvest.');
      return;
    }
    if (currentStep < 5) setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeProperty) {
      setErrorMessage('No property selected.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const selectedGroups = availableTreeGroups
        .filter((g) => selectedTreeGroupIds.includes(g.id))
        .map((g) => ({
          ...g,
          girth: getStandGirth(g),
          estimatedVolume: getStandVolume(g)
        }));

      const payload = {
        property_id: activeProperty.id || activeProperty._id,
        propertyName: activeProperty.propertyName || activeProperty.name || 'Registered Property',
        propertyLocation: `${activeProperty.district || 'Kottayam'}, ${activeProperty.state || 'Kerala'}`,
        selected_inventory_ids: selectedTreeGroupIds,
        selected_tree_groups: selectedGroups,
        reason,
        preferred_start_date: new Date().toISOString().split('T')[0],
        preferred_end_date: "",
        required_services: [],
        site_conditions: {
          access_availability: accessAvailability,
          road_condition: roadCondition,
          distance_from_road: distanceFromRoad,
          terrain,
          additional_notes: additionalNotes
        },
        hazards,
        photos: sitePhotos ? [sitePhotos] : [],
        instructions: additionalNotes,
        assigned_contractor_id: selectedContractor?.id || selectedContractor?._id || null,
        assigned_contractor_name: selectedContractor?.companyName || selectedContractor?.name || null
      };

      await addHarvestRequest(payload);

      setIsSubmitting(false);
      setSuccessMessage(
        selectedContractor
          ? `Harvest request submitted and assigned to contractor ${selectedContractor.companyName || selectedContractor.name}!`
          : 'Harvest request submitted successfully! You can now select an approved contractor or await quotes.'
      );

      setTimeout(() => {
        navigate('/landowner/harvest-requests');
      }, 2000);
    } catch (err) {
      console.error('Error submitting harvest request:', err);
      setIsSubmitting(false);
      setErrorMessage('Failed to submit harvest request. Please try again.');
    }
  };

  return (
    <div className="landowner-dashboard-page">
      <Navbar />
      <div className="landowner-dashboard-container">
        <Sidebar />

        <div className="landowner-dashboard-workspace">
          <main className="w-full flex flex-col gap-6 max-w-6xl mx-auto py-2">

            {/* HERO CARD HEADER */}
            <section className="ld-card ld-hero-card">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <span className="ld-hero-tag">
                    <Axe size={14} /> HARVEST REQUEST WORKFLOW
                  </span>
                  <h1 className="ld-hero-heading mt-1">Submit Landowner Harvest Request</h1>
                  <p className="ld-hero-subtext mt-1">
                    Select your existing registered estate parcel and tree inventory records to create a harvesting job for licensed platform contractors. No duplicate property entry required.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/landowner/harvest-requests')}
                    className="ld-btn-back"
                  >
                    <ArrowLeft size={14} /> Back to Requests
                  </button>

                  <span className="ld-badge-live">
                    Step {currentStep} of 5
                  </span>
                </div>
              </div>
            </section>

            {/* STEP PROGRESS INDICATOR TABS */}
            <div className="ld-subcard flex items-center justify-between gap-3 overflow-x-auto">
              {[
                { step: 1, label: '1. Select Property' },
                { step: 2, label: '2. Select Trees' },
                { step: 3, label: '3. Requirements' },
                { step: 4, label: '4. Site Conditions' },
                { step: 5, label: '5. Review & Submit' }
              ].map((item) => {
                const isActive = currentStep === item.step;
                const isPassed = currentStep > item.step;

                return (
                  <div
                    key={item.step}
                    onClick={() => {
                      if (isPassed || (item.step === 2 && activeProperty)) {
                        setCurrentStep(item.step);
                      }
                    }}
                    className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl border text-center text-sm font-extrabold transition-all cursor-pointer ${isActive
                      ? 'bg-emerald-950 border-emerald-400 text-white shadow-md'
                      : isPassed
                        ? 'bg-[#0e1612] border-emerald-700/40 text-emerald-300'
                        : 'bg-transparent border-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                  >
                    {item.label}
                  </div>
                );
              })}
            </div>

            {/* ERROR / SUCCESS ALERTS */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-3">
                <AlertCircle size={18} className="text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                <span className="font-bold">{successMessage}</span>
              </div>
            )}

            {/* STEP 1: SELECT EXISTING PROPERTY */}
            {currentStep === 1 && (
              <div className="ld-card p-8 sm:p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <Building2 className="text-emerald-400" size={20} /> Step 1: Select Existing Property
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Choose from your live registered properties. Property details are retrieved automatically and displayed as read-only.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => refreshProperties && refreshProperties()}
                    className="ld-btn-back text-xs"
                    title="Refresh live properties"
                  >
                    <RefreshCw size={13} /> Refresh Live DB
                  </button>
                </div>

                {safeProperties.length === 0 ? (
                  <div className="ld-subcard text-center py-10 space-y-4">
                    <Trees size={44} className="text-emerald-500/40 mx-auto" />
                    <h4 className="font-bold text-white text-base">No Registered Properties Found</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      You need at least one registered property to create a harvest request.
                    </p>
                    <button
                      onClick={() => navigate('/landowner/register-property')}
                      className="ld-btn-green-sm"
                    >
                      <Plus size={15} /> Register Property First
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {safeProperties.map((p) => {
                      const pId = p.id || p._id;
                      const isSelected = selectedPropertyId === pId || String(selectedPropertyId) === String(pId);
                      const pName = p.propertyName || p.name || 'Registered Estate';
                      const address = p.address || [p.village, p.localBody, p.district, p.state].filter(Boolean).join(', ') || 'Kerala';
                      const propImg = getPropertyImage(p);

                      return (
                        <div
                          key={pId}
                          onClick={() => setSelectedPropertyId(pId)}
                          className={`harvest-property-card group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${
                            isSelected
                              ? 'bg-slate-900/90 border-emerald-400 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                              : 'bg-slate-900/50 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-slate-900/70'
                          }`}
                        >
                          {/* Property Cover Image Banner */}
                          <div className="relative w-full h-44 overflow-hidden bg-slate-950">
                            <img
                              src={propImg}
                              alt={pName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_PROPERTY_IMAGE; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                              <span className="text-[10px] font-extrabold text-emerald-300 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/30 shadow">
                                {p.propertyType || 'Forestry Estate'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-white bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-emerald-500/30 shadow">
                                ID: {pId.substring(0, 10)}
                              </span>
                            </div>

                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                                {isSelected ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center gap-1 text-xs shadow-lg">
                                    <CheckCircle2 size={14} /> Selected Estate
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/40 text-[11px] font-bold">
                                    Click to Select
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Property Info Content */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-extrabold text-white text-base group-hover:text-emerald-300 transition-colors">
                                {pName}
                              </h4>
                              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60">
                                {p.totalArea || '12'} {p.areaUnit || 'Cents'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 flex items-center gap-1.5 truncate">
                              <MapPin size={13} className="text-emerald-400 shrink-0" /> {address}
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-emerald-500/15">
                              <div>
                                <span className="text-[11px] text-slate-500 block">District:</span>
                                <strong className="text-white">{p.district || 'Kottayam'}</strong>
                              </div>
                              <div>
                                <span className="text-[11px] text-slate-500 block">Village:</span>
                                <strong className="text-white">{p.village || 'Koovapally'}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Read-Only Summary Box for Selected Property */}
                {activeProperty && (
                  <div className="ld-subcard space-y-4 border border-emerald-500/30 bg-slate-950/70 p-5 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                      <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 size={15} /> SELECTED PROPERTY DETAILS (READ-ONLY)
                      </h4>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                        {activeProperty.status || 'Active Estate'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Property Name:</span>
                        <span className="font-extrabold text-white text-sm">{activeProperty.propertyName || activeProperty.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Property Owner:</span>
                        <span className="font-bold text-white">{activeProperty.ownerName || 'Harigovind D Nair'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Contact Number:</span>
                        <span className="font-bold text-white">{activeProperty.contactNumber || '9746794654'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Property Type:</span>
                        <span className="font-bold text-emerald-300">{activeProperty.propertyType || 'Residential Property'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">District & State:</span>
                        <span className="font-bold text-white">{activeProperty.district || 'Kottayam'}, {activeProperty.state || 'Kerala'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Village / Location:</span>
                        <span className="font-bold text-white">{activeProperty.village || 'Koovapally'} ({activeProperty.localBody || 'Meenadom Panchayat'})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">PIN Code:</span>
                        <span className="font-bold text-white">{activeProperty.pinCode || '686518'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Total Registered Area:</span>
                        <span className="font-extrabold text-emerald-400">{activeProperty.totalArea || '11.93'} {activeProperty.areaUnit || 'Cents'}</span>
                      </div>
                      {activeProperty.latitude && activeProperty.longitude && (
                        <div>
                          <span className="text-slate-400 block text-[11px]">GPS Coordinates:</span>
                          <span className="font-bold text-white font-mono text-[11px]">{activeProperty.latitude.toFixed(4)}, {activeProperty.longitude.toFixed(4)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400 block text-[11px]">Registered Trees & Species:</span>
                        <span className="font-bold text-white">{activeProperty.approxTreesCount || 24} Trees ({activeProperty.mainSpecies || 'Teakwood'})</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[11px]">Estate Description / Notes:</span>
                        <span className="text-slate-300 italic">{activeProperty.description || 'Registered forestry estate plot in Kottayam district.'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SELECT EXISTING TREES FROM INVENTORY */}
            {currentStep === 2 && (
              <div className="ld-card p-8 sm:p-10 space-y-8">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Trees className="text-emerald-400" size={20} /> Step 2: Select Trees Intended for Harvesting
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Trees registered under <strong className="text-white">{activeProperty?.propertyName || activeProperty?.name}</strong> are listed below. Select the stands or tree groups to include in this harvest request.
                  </p>
                </div>

                {availableTreeGroups.length === 0 ? (
                  <div className="ld-subcard text-center py-10 space-y-4">
                    <TreePine size={44} className="text-emerald-500/40 mx-auto" />
                    <h4 className="font-bold text-white text-base">No Tree Inventory Records Found for Property</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      No registered tree stands were found for this property in Tree Inventory. You can still proceed or add inventory records first.
                    </p>
                    <button
                      onClick={() => navigate(`/landowner/add-inventory?propertyId=${activeProperty?.id || activeProperty?._id}`)}
                      className="ld-btn-green-sm"
                    >
                      <Plus size={15} /> Add Tree Inventory
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-emerald-500/10 flex-wrap gap-2">
                      <span>Selected {selectedTreeGroupIds.length} of {availableTreeGroups.length} tree stand(s)</span>
                      
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAddStandModal(true)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow"
                        >
                          <Plus size={14} /> Add Stand (Girth & Volume)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (selectedTreeGroupIds.length === availableTreeGroups.length) {
                              setSelectedTreeGroupIds([]);
                            } else {
                              setSelectedTreeGroupIds(availableTreeGroups.map((g) => g.id));
                            }
                          }}
                          className="text-emerald-400 hover:underline font-bold"
                        >
                          {selectedTreeGroupIds.length === availableTreeGroups.length ? 'Deselect All' : 'Select All Stands'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {availableTreeGroups.map((g) => {
                        const isSelected = selectedTreeGroupIds.includes(g.id);
                        const treePhoto = getTreePhoto(g);
                        const currentGirth = getStandGirth(g);
                        const currentVolume = getStandVolume(g);

                        return (
                          <div
                            key={g.id}
                            onClick={() => toggleTreeGroupSelection(g.id)}
                            className={`harvest-scope-card group cursor-pointer ${isSelected ? 'selected' : ''}`}
                          >
                            {/* Tree Stand Cover Image Banner */}
                            <div className="relative w-full h-44 mb-3 rounded-xl overflow-hidden border border-emerald-500/20 bg-slate-900 shadow-md">
                              <img
                                src={treePhoto}
                                alt={g.groupName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => { e.target.onerror = null; e.target.src = speciesImagesMap.Other; }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                              {/* Selection Checkbox Badge */}
                              <div className="absolute top-2.5 right-2.5">
                                <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                                  isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg' : 'bg-slate-950/70 border-slate-600 text-transparent'
                                }`}>
                                  {isSelected && <Check size={16} strokeWidth={3} />}
                                </div>
                              </div>

                              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/85 px-2.5 py-0.5 rounded border border-emerald-700/60 backdrop-blur-sm">
                                  Species: {g.species}
                                </span>
                                <span className="text-[10px] font-bold text-white bg-black/75 px-2 py-0.5 rounded border border-emerald-500/30 backdrop-blur-sm">
                                  {g.numberOfTrees} Trees Registered
                                </span>
                              </div>
                            </div>

                            {/* Stand Info & Title */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-black text-white text-lg flex items-center gap-2.5">
                                  <TreePine size={20} className="text-emerald-400 shrink-0" /> {g.groupName}
                                </h4>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-2 gap-4 text-sm text-slate-300 pt-3 pb-1 border-t border-emerald-500/15">
                                <div>
                                  <span className="text-xs font-semibold text-slate-400 block mb-1">Quantity:</span>
                                  <strong className="text-base font-extrabold text-white">{g.numberOfTrees} trees</strong>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-slate-400 block mb-1">Stand Age:</span>
                                  <strong className="text-sm font-bold text-white">{g.approxAge}</strong>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-slate-400 block mb-1">Health Condition:</span>
                                  <strong className="text-sm font-extrabold text-emerald-400">{g.condition}</strong>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-slate-400 block mb-1">Location on Estate:</span>
                                  <strong className="text-sm font-bold text-white">{g.location}</strong>
                                </div>
                              </div>

                              {/* Interactive Measurements & Volume Options */}
                              <div className="pt-4 border-t border-emerald-500/20 space-y-3" onClick={(e) => e.stopPropagation()}>
                                <div className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center justify-between">
                                  <span>Tree Measurements & Volume Options</span>
                                  <span className="text-[11px] text-emerald-300 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800">
                                    Custom Editable
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-200 block">Trunk Girth *</label>
                                    <input
                                      type="text"
                                      value={currentGirth}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setStandMeasurements(prev => ({
                                          ...prev,
                                          [g.id]: { ...prev[g.id], girth: val }
                                        }));
                                      }}
                                      placeholder="e.g. 65 - 85 cm"
                                      className="w-full bg-[#030a05] border border-emerald-500/40 rounded-xl px-4 py-2.5 text-sm font-extrabold text-emerald-300 shadow-inner focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-200 block">Est. Volume *</label>
                                    <input
                                      type="text"
                                      value={currentVolume}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setStandMeasurements(prev => ({
                                          ...prev,
                                          [g.id]: { ...prev[g.id], estimatedVolume: val }
                                        }));
                                      }}
                                      placeholder="e.g. 0.8 m³"
                                      className="w-full bg-[#030a05] border border-emerald-500/40 rounded-xl px-4 py-2.5 text-sm font-extrabold text-emerald-300 shadow-inner focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected Trees Summary Box */}
                    {selectedTreeGroupIds.length > 0 && (
                      <div className="ld-subcard space-y-3 mt-6">
                        <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <Trees size={16} /> SELECTED TREE HARVEST SUMMARY
                          </h4>
                          <span className="text-xs font-bold text-emerald-300 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-700/50">
                            {selectedTreeGroupIds.length} Stand(s) Selected
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Total Selected Trees:</span>
                            <span className="font-bold text-white text-sm">
                              {availableTreeGroups.filter(g => selectedTreeGroupIds.includes(g.id)).reduce((acc, curr) => acc + (curr.numberOfTrees || 0), 0)} trees
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Target Species:</span>
                            <span className="font-bold text-emerald-300">
                              {[...new Set(availableTreeGroups.filter(g => selectedTreeGroupIds.includes(g.id)).map(g => g.species))].join(', ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Average Stand Age:</span>
                            <span className="font-bold text-white">
                              {availableTreeGroups.find(g => selectedTreeGroupIds.includes(g.id))?.approxAge || '14 years'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Est. Total Timber Volume:</span>
                            <span className="font-bold text-emerald-400">
                              {availableTreeGroups.filter(g => selectedTreeGroupIds.includes(g.id)).reduce((acc, curr) => acc + (parseFloat(getStandVolume(curr)) || 0), 0).toFixed(1)} m³
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MODAL TO ADD CUSTOM TREE STAND WITH GIRTH & VOLUME */}
                {showAddStandModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                      <div className="bg-[#0b140f] border border-emerald-500/30 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                            <TreePine className="text-emerald-400" size={18} /> Add Custom Tree Stand
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowAddStandModal(false)}
                            className="text-slate-400 hover:text-white p-1"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="col-span-2 space-y-1">
                            <label className="ld-label">Stand / Group Name</label>
                            <input
                              type="text"
                              value={newStandName}
                              onChange={(e) => setNewStandName(e.target.value)}
                              className="ld-input"
                              placeholder="e.g. Teakwood Stand #2"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="ld-label">Species</label>
                            <select
                              value={newStandSpecies}
                              onChange={(e) => setNewStandSpecies(e.target.value)}
                              className="ld-select"
                            >
                              <option value="Teakwood">Teakwood</option>
                              <option value="Teak">Teak</option>
                              <option value="Mahogany">Mahogany</option>
                              <option value="Rubber">Rubber</option>
                              <option value="Cedar">Cedar</option>
                              <option value="Pine">Pine</option>
                              <option value="Rosewood">Rosewood</option>
                              <option value="Eucalyptus">Eucalyptus</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="ld-label">Number of Trees</label>
                            <input
                              type="number"
                              value={newStandCount}
                              onChange={(e) => setNewStandCount(Number(e.target.value))}
                              className="ld-input"
                              min={1}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="ld-label">Trunk Girth *</label>
                            <input
                              type="text"
                              value={newStandGirth}
                              onChange={(e) => setNewStandGirth(e.target.value)}
                              className="ld-input"
                              placeholder="e.g. 65 - 85 cm"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="ld-label">Est. Volume *</label>
                            <input
                              type="text"
                              value={newStandVolume}
                              onChange={(e) => setNewStandVolume(e.target.value)}
                              className="ld-input"
                              placeholder="e.g. 0.8 m³"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="ld-label">Approx Age</label>
                            <input
                              type="text"
                              value={newStandAge}
                              onChange={(e) => setNewStandAge(e.target.value)}
                              className="ld-input"
                              placeholder="e.g. 14 years"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="ld-label">Health Condition</label>
                            <select
                              value={newStandCondition}
                              onChange={(e) => setNewStandCondition(e.target.value)}
                              className="ld-select"
                            >
                              <option value="Healthy">Healthy</option>
                              <option value="Damaged">Damaged</option>
                              <option value="Diseased">Diseased</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-500/20">
                          <button
                            type="button"
                            onClick={() => setShowAddStandModal(false)}
                            className="ld-btn-back text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newId = `custom_stand_${Date.now()}`;
                              const newGroup = {
                                id: newId,
                                groupName: newStandName || 'Custom Tree Stand',
                                species: newStandSpecies,
                                numberOfTrees: Number(newStandCount) || 20,
                                approxAge: newStandAge || '14 years',
                                condition: newStandCondition,
                                location: activeProperty?.village || activeProperty?.district || 'Kottayam',
                                girth: newStandGirth || '65 - 85 cm',
                                estimatedVolume: newStandVolume || '0.8 m³',
                                image: speciesImagesMap[newStandSpecies] || speciesImagesMap.Other,
                                photos: [speciesImagesMap[newStandSpecies] || speciesImagesMap.Other]
                              };
                              setCustomTreeGroups((prev) => [...prev, newGroup]);
                              setSelectedTreeGroupIds((prev) => [...prev, newId]);
                              setShowAddStandModal(false);
                            }}
                            className="ld-btn-green-sm"
                          >
                            <Plus size={14} /> Add to Stand List
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* STEP 3: HARVEST REQUIREMENTS & CONTRACTOR ASSIGNMENT */}
            {currentStep === 3 && (
              <div className="ld-card p-8 sm:p-10 space-y-8">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Axe className="text-emerald-400" size={20} /> Step 3: Harvesting Requirements & Contractor Assignment
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Assign an approved contractor, specify the reason for harvesting, and target completion date.
                  </p>
                </div>

                {/* INLINE APPROVED CONTRACTOR SELECTOR WITH SEARCH & DISTRICT FILTER */}
                <div className="p-6 rounded-2xl bg-slate-950/80 border border-emerald-500/25 space-y-4 shadow-xl">
                  <ApprovedContractorSelector
                    selectedContractorId={selectedContractor?.id || selectedContractor?._id}
                    onSelectContractor={(c) => {
                      if (selectedContractor && (selectedContractor.id === c.id || selectedContractor._id === c._id)) {
                        setSelectedContractor(null);
                      } else {
                        setSelectedContractor(c);
                      }
                    }}
                    isModal={false}
                  />
                </div>

                {/* Reason for Harvesting */}
                <div className="space-y-2">
                  <label className="ld-label">Reason for Harvesting *</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="ld-select"
                  >
                    <option value="Mature timber">Mature timber</option>
                    <option value="Commercial harvest">Commercial harvest</option>
                    <option value="Diseased/damaged tree">Diseased/damaged tree</option>
                    <option value="Dangerous tree">Dangerous tree</option>
                    <option value="Land development">Land development</option>
                    <option value="Plantation rotation">Plantation rotation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 4: SITE CONDITIONS & SITE PHOTOS */}
            {currentStep === 4 && (
              <div className="ld-card p-8 sm:p-10 space-y-10">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2.5">
                    <Truck className="text-emerald-400" size={22} /> Step 4: Site Conditions & Access
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Provide site terrain, road access, special hazards, and upload current harvest site photos.
                  </p>
                </div>

                {/* Access & Road */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <label className="ld-label">Vehicle / Access Availability</label>
                    <select
                      value={accessAvailability}
                      onChange={(e) => setAccessAvailability(e.target.value)}
                      className="ld-select"
                    >
                      <option value="Heavy vehicle access">Heavy vehicle access (Log Trucks)</option>
                      <option value="4WD Tractor access">4WD Tractor access only</option>
                      <option value="Small truck / Pickup">Small truck / Pickup only</option>
                      <option value="Manual / Cable extraction required">Manual / Cable extraction required</option>
                    </select>
                  </div>

                  <div className="space-y-2.5">
                    <label className="ld-label">Road Condition</label>
                    <input
                      type="text"
                      value={roadCondition}
                      onChange={(e) => setRoadCondition(e.target.value)}
                      placeholder="e.g. Paved panchayat road, Dirt track"
                      className="ld-input"
                    />
                  </div>
                </div>

                {/* Distance & Terrain */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-emerald-500/15">
                  <div className="space-y-2.5">
                    <label className="ld-label">Approximate Distance from Main Road</label>
                    <input
                      type="text"
                      value={distanceFromRoad}
                      onChange={(e) => setDistanceFromRoad(e.target.value)}
                      placeholder="e.g. 50 meters, 200 meters"
                      className="ld-input"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="ld-label">Terrain Type</label>
                    <select
                      value={terrain}
                      onChange={(e) => setTerrain(e.target.value)}
                      className="ld-select"
                    >
                      <option value="Flat land">Flat land</option>
                      <option value="Gently sloped">Gently sloped</option>
                      <option value="Steep hillside">Steep hillside</option>
                      <option value="Marshy / Wet ground">Marshy / Wet ground</option>
                    </select>
                  </div>
                </div>

                {/* Hazards */}
                <div className="mt-14 pt-10 border-t border-emerald-500/30 space-y-6">
                  <label className="ld-label flex items-center gap-2 text-amber-400 text-sm tracking-widest mb-6">
                    <AlertTriangle size={18} className="text-amber-400 shrink-0" /> Special Site Hazards
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hazardOptions.map((haz) => {
                      const isChecked = hazards.includes(haz);
                      return (
                        <div
                          key={haz}
                          onClick={() => toggleHazard(haz)}
                          className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all shadow-md ${isChecked
                            ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-amber-950/40'
                            : 'bg-[#061209] border-emerald-500/25 text-slate-300 hover:border-emerald-500/40 hover:bg-[#0c1a10]'
                            }`}
                        >
                          <span className="font-extrabold text-sm">{haz}</span>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${isChecked ? 'bg-amber-500 border-amber-400 text-slate-950 font-black' : 'border-slate-600 bg-slate-950/50'
                            }`}>
                            {isChecked && <Check size={14} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Instructions */}
                <div className="mt-14 pt-10 border-t border-emerald-500/30 space-y-5">
                  <label className="ld-label text-sm tracking-widest text-emerald-400 mb-4 block">
                    Additional Instructions / Site Notes
                  </label>
                  <textarea
                    rows={4}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Special directions, gate access codes, neighbouring house precautions..."
                    className="ld-textarea p-4 text-sm text-white font-medium bg-[#030a05] border border-emerald-500/30 rounded-xl focus:border-emerald-400"
                  />
                </div>

                {/* Photos Upload */}
                <div className="mt-14 pt-10 border-t border-emerald-500/30 space-y-5">
                  <div className="mb-4">
                    <label className="ld-label text-sm tracking-widest text-emerald-400 block">
                      Upload Current Harvest Site Photos
                    </label>
                    <p className="text-xs text-slate-300 mt-1.5">
                      Upload photos showing selected trees, access road, terrain, loading area, or hazards.
                    </p>
                  </div>
                  <FileUploadCard
                    title="Harvest Site & Access Road Photos"
                    description="Upload clear site photos for contractor quotation inspection"
                    onFileSelect={(fileData) => setSitePhotos(fileData)}
                    selectedFile={sitePhotos}
                  />
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW & SUBMIT */}
            {currentStep === 5 && (
              <div className="ld-card p-8 sm:p-10 space-y-8">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                    <FileText className="text-emerald-400" size={24} /> Step 5: Review & Submit Request
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Review your complete harvest request summary below before submitting to the platform.
                  </p>
                </div>

                {/* Unified Summary Container */}
                <div className="ld-subcard p-6 sm:p-8 space-y-8 bg-[#061209] border border-emerald-500/30 rounded-2xl shadow-xl">

                  {/* 1. PROPERTY SUMMARY */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 flex-wrap gap-2">
                      <h4 className="font-extrabold text-emerald-400 uppercase text-xs sm:text-sm tracking-widest flex items-center gap-2.5">
                        <Building2 size={18} className="text-emerald-400" /> PROPERTY INFORMATION (EXISTING)
                      </h4>
                      <span className="ld-badge-green flex items-center gap-1.5 font-bold text-xs">
                        <CheckCircle2 size={13} /> Active Registered Estate
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-2xl bg-[#030a05] border border-emerald-500/20 shadow-md">
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Property Name</span>
                        <strong className="text-xl font-black text-white block">{activeProperty?.propertyName || activeProperty?.name}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Location</span>
                        <strong className="text-base font-extrabold text-white block">{activeProperty?.district || 'Kottayam'}, {activeProperty?.state || 'Kerala'}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Total Registered Area</span>
                        <strong className="text-lg font-black text-emerald-400 block">{activeProperty?.totalArea || '12'} {activeProperty?.areaUnit || 'Cents'}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Property Record ID</span>
                        <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/90 px-3 py-1.5 rounded-lg border border-emerald-700/80 inline-block overflow-hidden text-ellipsis max-w-full">
                          {activeProperty?.id || activeProperty?._id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. SELECTED TREES SUMMARY */}
                  <div className="mt-10 pt-6 border-t border-emerald-500/25 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 flex-wrap gap-2">
                      <h4 className="font-extrabold text-emerald-400 uppercase text-xs sm:text-sm tracking-widest flex items-center gap-2.5">
                        <Trees size={18} className="text-emerald-400" /> SELECTED TREE INVENTORIES ({selectedTreeGroups.length} STANDS)
                      </h4>
                      <span className="ld-badge-green font-bold text-xs">
                        {selectedTreeGroups.length} Stand(s) Selected
                      </span>
                    </div>

                    <div className={`grid grid-cols-1 ${selectedTreeGroups.length > 1 ? 'md:grid-cols-2' : ''} gap-6`}>
                      {selectedTreeGroups.map((g) => (
                        <div key={g.id} className="p-6 rounded-2xl bg-[#07170d] border-2 border-emerald-500/35 shadow-xl space-y-4">
                          <div className="font-black text-white text-xl flex items-center justify-between flex-wrap gap-2">
                            <span>{g.groupName}</span>
                            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/90 px-3 py-1 rounded-lg border border-emerald-700/80 shadow-sm">
                              {g.numberOfTrees} Trees
                            </span>
                          </div>
                          <div className="text-sm text-slate-200">
                            Species: <strong className="text-emerald-300 font-extrabold text-base ml-1">{g.species}</strong> • Stand Age: <strong className="text-white font-bold text-base ml-1">{g.approxAge || '14 years'}</strong>
                          </div>
                          <div className="pt-4 border-t border-emerald-500/20 flex items-center justify-between gap-4 text-sm font-mono flex-wrap">
                            <span className="bg-[#030a05] px-4 py-2 rounded-xl border border-emerald-800/60 text-emerald-300 font-extrabold flex items-center gap-2">
                              <span className="text-slate-400 font-sans text-xs">Trunk Girth:</span> {getStandGirth(g)}
                            </span>
                            <span className="bg-[#030a05] px-4 py-2 rounded-xl border border-emerald-800/60 text-emerald-300 font-extrabold flex items-center gap-2">
                              <span className="text-slate-400 font-sans text-xs">Est. Volume:</span> {getStandVolume(g)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. HARVEST REQUIREMENTS */}
                  <div className="mt-10 pt-6 border-t border-emerald-500/25 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 flex-wrap gap-2">
                      <h4 className="font-extrabold text-emerald-400 uppercase text-xs sm:text-sm tracking-widest flex items-center gap-2.5">
                        <Axe size={18} className="text-emerald-400" /> HARVEST REQUIREMENTS
                      </h4>
                      <span className="ld-badge-amber font-bold text-xs">
                        Commercial Request
                      </span>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#030a05] border border-emerald-500/20 text-base text-slate-300 font-medium shadow-md">
                      Reason for Harvesting: <strong className="text-xl font-black text-white ml-2">{reason}</strong>
                    </div>
                  </div>

                  {/* 4. SITE CONDITIONS */}
                  <div className="mt-10 pt-6 border-t border-emerald-500/25 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 flex-wrap gap-2">
                      <h4 className="font-extrabold text-emerald-400 uppercase text-xs sm:text-sm tracking-widest flex items-center gap-2.5">
                        <Truck size={18} className="text-emerald-400" /> SITE CONDITIONS & HAZARDS
                      </h4>
                      <span className="ld-badge-teal font-bold text-xs">
                        Site Profile Complete
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-2xl bg-[#030a05] border border-emerald-500/20 shadow-md">
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Access Availability</span>
                        <strong className="text-base font-extrabold text-white block">{accessAvailability}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Road Condition</span>
                        <strong className="text-base font-extrabold text-white block">{roadCondition} ({distanceFromRoad})</strong>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Terrain Type</span>
                        <strong className="text-base font-extrabold text-white block">{terrain}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Special Hazards</span>
                        <strong className="text-base font-black text-amber-400 block">{hazards.join(', ') || 'None'}</strong>
                      </div>
                    </div>

                    {additionalNotes && (
                      <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 text-sm text-slate-200 shadow-sm">
                        <strong className="text-emerald-300 block mb-1 font-bold">Special Instructions / Site Notes:</strong>
                        <span className="italic">{additionalNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* 5. ASSIGNED CONTRACTOR */}
                  <div className="mt-10 pt-6 border-t border-emerald-500/25 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 flex-wrap gap-3">
                      <h4 className="font-extrabold text-emerald-400 uppercase text-xs sm:text-sm tracking-widest flex items-center gap-2.5">
                        <ShieldCheck size={18} className="text-emerald-400" /> ASSIGNED ADMIN-APPROVED CONTRACTOR (OPTIONAL)
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowContractorModal(true)}
                        className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs shadow transition-all"
                      >
                        {selectedContractor ? 'Change Contractor' : '+ Select Approved Contractor'}
                      </button>
                    </div>

                    {selectedContractor ? (
                      <div className="p-6 rounded-2xl bg-[#030a05] border-2 border-emerald-500/40 flex items-center justify-between flex-wrap gap-4 shadow-lg">
                        <div>
                          <div className="font-extrabold text-white text-xl">{selectedContractor.companyName || selectedContractor.name}</div>
                          <div className="text-sm font-semibold text-emerald-300 mt-1">{selectedContractor.location || selectedContractor.district} • Verified Contractor</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedContractor(null)}
                          className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-bold transition-all shadow"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-[#030a05] border border-emerald-500/10 text-slate-300 text-sm font-medium">
                        No contractor selected yet. You can submit now to let approved contractors view and bid, or select a contractor directly above.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ACTION FOOTER BAR (COMPACT NEXT BUTTON ON RIGHT BOTTOM SIDE) */}
            <div className="flex items-center justify-between pt-4 border-t border-emerald-500/20">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1 || isSubmitting}
                className={`ld-btn-back ${currentStep === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <ArrowLeft size={14} /> Previous
              </button>

              <div className="flex items-center justify-end">
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="ld-btn-green-sm"
                  >
                    Next Step <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="ld-btn-green-sm"
                  >
                    {isSubmitting ? (
                      'Submitting Request...'
                    ) : (
                      <>
                        <Send size={14} /> Submit Harvest Request
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* MODAL FOR CONTRACTOR SELECTION */}
            {showContractorModal && (
              <ApprovedContractorSelector
                selectedContractorId={selectedContractor?.id || selectedContractor?._id}
                onSelectContractor={(c) => {
                  setSelectedContractor(c);
                  setShowContractorModal(false);
                }}
                onCancel={() => setShowContractorModal(false)}
                isModal={true}
              />
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default RequestHarvesting;
