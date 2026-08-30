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
  RefreshCw
} from 'lucide-react';

const RequestHarvesting = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPropertyId = searchParams.get('propertyId');

  const landownerCtx = useLandowner() || {};
  const { properties = [], treeInventories = [], addHarvestRequest, refreshProperties } = landownerCtx;

  // Trigger live refresh of properties from backend DB on mount
  useEffect(() => {
    if (typeof refreshProperties === 'function') {
      refreshProperties();
    }
  }, [refreshProperties]);

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
  const activeInventories = (treeInventories || []).filter(
    (inv) =>
      inv.propertyId === activePropertyId ||
      inv.propertyId === selectedPropertyId ||
      inv.property_id === activePropertyId ||
      inv.property_id === selectedPropertyId
  );

  const rawTreeGroups = [
    ...(activeProperty?.treeInventoryGroups || []),
    ...(activeProperty?.inventories || []),
    ...activeInventories
  ];

  const availableTreeGroups = (
    rawTreeGroups.length > 0
      ? rawTreeGroups
      : [
          {
            id: 'group_demo_1',
            groupName: 'Teak Stand #1',
            species: 'Teakwood',
            numberOfTrees: 24,
            approxAge: '14 years',
            condition: 'Healthy',
            location: activeProperty?.district || 'Kottayam',
            girth: '65 - 85 cm'
          }
        ]
  ).map((g, idx) => ({
    id: g.id || g._id || `group_${idx}`,
    groupName: g.groupName || g.standName || `Stand #${idx + 1} (${g.species || 'Teak'})`,
    species: g.species || 'Teak',
    numberOfTrees: g.numberOfTrees || g.count || 20,
    approxAge: g.approxAge || '15 years',
    condition: g.condition || 'Healthy',
    location: g.location || activeProperty?.village || 'Kerala',
    girth: g.girth || g.girthInfo || '60 - 90 cm'
  }));

  const [selectedTreeGroupIds, setSelectedTreeGroupIds] = useState([]);

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
  const [preferredStartDate, setPreferredStartDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [preferredEndDate, setPreferredEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  const serviceOptions = [
    { id: 'Tree felling', label: 'Tree Felling', desc: 'Professional directional felling' },
    { id: 'Cutting', label: 'Cross-cutting / Bucking', desc: 'Sizing logs to market standards' },
    { id: 'Timber extraction', label: 'Log Extraction & Skidding', desc: 'Hauling logs to roadside landing' },
    { id: 'Transportation', label: 'Log Truck Transport', desc: 'Transporting timber to buyer depot' },
    { id: 'Site clearing', label: 'Branch / Slash Clearing', desc: 'Clearing stump area post-harvest' }
  ];
  const [requiredServices, setRequiredServices] = useState(['Tree felling', 'Timber extraction', 'Transportation']);

  const handleToggleService = (serviceId) => {
    setRequiredServices((prev) =>
      prev.includes(serviceId) ? prev.filter((s) => s !== serviceId) : [...prev, serviceId]
    );
  };

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
      const selectedGroups = availableTreeGroups.filter((g) => selectedTreeGroupIds.includes(g.id));

      const payload = {
        property_id: activeProperty.id || activeProperty._id,
        propertyName: activeProperty.propertyName || activeProperty.name || 'Registered Property',
        propertyLocation: `${activeProperty.district || 'Kottayam'}, ${activeProperty.state || 'Kerala'}`,
        selected_inventory_ids: selectedTreeGroupIds,
        selected_tree_groups: selectedGroups,
        reason,
        preferred_start_date: preferredStartDate,
        preferred_end_date: preferredEndDate,
        required_services: requiredServices,
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

  const selectedTreeGroups = availableTreeGroups.filter((g) => selectedTreeGroupIds.includes(g.id));

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
                    className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      isActive
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
              <div className="ld-card space-y-6">
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

                      return (
                        <div
                          key={pId}
                          onClick={() => setSelectedPropertyId(pId)}
                          className={`harvest-property-card ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-extrabold text-white text-base">{pName}</h4>
                              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/50">
                                ID: {pId.substring(0, 10)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 flex items-center gap-1">
                              <MapPin size={13} className="text-emerald-400" /> {address}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-emerald-500/10">
                              <span>District: <strong className="text-white">{p.district || 'Kottayam'}</strong></span>
                              <span>Area: <strong className="text-white">{p.totalArea || '12'} {p.areaUnit || 'Cents'}</strong></span>
                            </div>
                          </div>

                          <div className="pt-3 flex items-center justify-between text-xs">
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              {isSelected ? <><CheckCircle2 size={14} /> Selected Property</> : 'Click to select'}
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              READ-ONLY Details
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Read-Only Summary Box for Selected Property */}
                {activeProperty && (
                  <div className="ld-subcard space-y-3">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 size={14} /> SELECTED PROPERTY SUMMARY (READ-ONLY)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Property Name:</span>
                        <span className="font-bold text-white">{activeProperty.propertyName || activeProperty.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">District & Location:</span>
                        <span className="font-bold text-white">{activeProperty.district || 'Kottayam'}, {activeProperty.state || 'Kerala'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Total Area:</span>
                        <span className="font-bold text-white">{activeProperty.totalArea || '12'} {activeProperty.areaUnit || 'Cents'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Property Type:</span>
                        <span className="font-bold text-white">{activeProperty.propertyType || 'Residential Property'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SELECT EXISTING TREES FROM INVENTORY */}
            {currentStep === 2 && (
              <div className="ld-card space-y-6">
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
                    <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-emerald-500/10">
                      <span>Selected {selectedTreeGroupIds.length} of {availableTreeGroups.length} tree stand(s)</span>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {availableTreeGroups.map((g) => {
                        const isSelected = selectedTreeGroupIds.includes(g.id);

                        return (
                          <div
                            key={g.id}
                            onClick={() => toggleTreeGroupSelection(g.id)}
                            className={`harvest-scope-card ${isSelected ? 'selected' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                                  <TreePine size={16} className="text-emerald-400" /> {g.groupName}
                                </h4>
                                <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-700/50">
                                  Species: {g.species}
                                </span>
                              </div>

                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'
                              }`}>
                                {isSelected && <Check size={14} strokeWidth={3} />}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-emerald-500/10">
                              <div>Quantity: <strong className="text-white">{g.numberOfTrees} trees</strong></div>
                              <div>Age: <strong className="text-white">{g.approxAge}</strong></div>
                              <div>Condition: <strong className="text-emerald-400">{g.condition}</strong></div>
                              <div>Location: <strong className="text-white">{g.location}</strong></div>
                            </div>

                            <div className="text-[11px] text-slate-400 bg-[#040b07] p-2 rounded-lg font-mono">
                              Inventory Measurement: {g.girth}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: HARVEST REQUIREMENTS */}
            {currentStep === 3 && (
              <div className="ld-card space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Axe className="text-emerald-400" size={20} /> Step 3: Harvesting Requirements
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Specify the reason for harvesting, preferred timeframe, and required contractor services.
                  </p>
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

                {/* Preferred Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="ld-label">Preferred Start Date *</label>
                    <input
                      type="date"
                      value={preferredStartDate}
                      onChange={(e) => setPreferredStartDate(e.target.value)}
                      className="ld-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ld-label">Preferred Completion Date *</label>
                    <input
                      type="date"
                      value={preferredEndDate}
                      onChange={(e) => setPreferredEndDate(e.target.value)}
                      className="ld-input"
                    />
                  </div>
                </div>

                {/* Required Services */}
                <div className="space-y-3">
                  <label className="ld-label">Required Harvesting Services *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {serviceOptions.map((s) => {
                      const isChecked = requiredServices.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleToggleService(s.id)}
                          className={`ld-subcard flex items-center justify-between cursor-pointer ${
                            isChecked ? 'border-[#10b981] bg-[rgba(16,185,129,0.12)]' : ''
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs text-white">{s.label}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{s.desc}</div>
                          </div>
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                            isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'
                          }`}>
                            {isChecked && <Check size={14} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: SITE CONDITIONS & SITE PHOTOS */}
            {currentStep === 4 && (
              <div className="ld-card space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Truck className="text-emerald-400" size={20} /> Step 4: Site Conditions & Access
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Provide site terrain, road access, special hazards, and upload current harvest site photos.
                  </p>
                </div>

                {/* Access & Road */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
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

                  <div className="space-y-2">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="ld-label">Approximate Distance from Main Road</label>
                    <input
                      type="text"
                      value={distanceFromRoad}
                      onChange={(e) => setDistanceFromRoad(e.target.value)}
                      placeholder="e.g. 50 meters, 200 meters"
                      className="ld-input"
                    />
                  </div>

                  <div className="space-y-2">
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
                <div className="space-y-2">
                  <label className="ld-label flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-400" /> Special Site Hazards
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {hazardOptions.map((haz) => {
                      const isChecked = hazards.includes(haz);
                      return (
                        <button
                          type="button"
                          key={haz}
                          onClick={() => toggleHazard(haz)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            isChecked
                              ? 'bg-amber-950 border-amber-500 text-amber-300'
                              : 'bg-[#050e09] border-emerald-500/20 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {isChecked ? '✓ ' : '+ '}{haz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Instructions */}
                <div className="space-y-2">
                  <label className="ld-label">Additional Instructions / Site Notes</label>
                  <textarea
                    rows={3}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Special directions, gate access codes, neighbouring house precautions..."
                    className="ld-textarea"
                  />
                </div>

                {/* Photos Upload */}
                <div className="space-y-2">
                  <label className="ld-label">Upload Current Harvest Site Photos</label>
                  <p className="text-[11px] text-slate-400">
                    Upload photos showing selected trees, access road, terrain, loading area, or hazards.
                  </p>
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
              <div className="ld-card space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <FileText className="text-emerald-400" size={20} /> Step 5: Review & Submit Request
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Review your complete harvest request summary below before submitting to the platform.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="ld-subcard space-y-4 text-xs">
                  
                  {/* PROPERTY SUMMARY */}
                  <div className="space-y-1.5 pb-4 border-b border-emerald-500/10">
                    <h4 className="font-extrabold text-emerald-400 uppercase text-[11px] tracking-wider">Property Information (Existing)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                      <div>Property: <strong className="text-white block">{activeProperty?.propertyName || activeProperty?.name}</strong></div>
                      <div>Location: <strong className="text-white block">{activeProperty?.district || 'Kottayam'}, {activeProperty?.state || 'Kerala'}</strong></div>
                      <div>Area: <strong className="text-white block">{activeProperty?.totalArea || '12'} {activeProperty?.areaUnit || 'Cents'}</strong></div>
                      <div>ID: <strong className="text-emerald-300 font-mono block">{activeProperty?.id || activeProperty?._id}</strong></div>
                    </div>
                  </div>

                  {/* SELECTED TREES SUMMARY */}
                  <div className="space-y-1.5 pb-4 border-b border-emerald-500/10">
                    <h4 className="font-extrabold text-emerald-400 uppercase text-[11px] tracking-wider">Selected Tree Inventories ({selectedTreeGroups.length} Stands)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedTreeGroups.map((g) => (
                        <div key={g.id} className="p-2.5 rounded-lg bg-[#08170e] border border-emerald-500/20">
                          <div className="font-bold text-white">{g.groupName}</div>
                          <div className="text-slate-400 text-[11px]">Species: <span className="text-emerald-300 font-bold">{g.species}</span> • Quantity: <span className="text-white font-bold">{g.numberOfTrees} trees</span></div>
                          <div className="text-slate-500 text-[10px]">Measurement: {g.girth}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* HARVEST REQUIREMENTS */}
                  <div className="space-y-1.5 pb-4 border-b border-emerald-500/10">
                    <h4 className="font-extrabold text-emerald-400 uppercase text-[11px] tracking-wider">Harvest Requirements & Services</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
                      <div>Reason: <strong className="text-white block">{reason}</strong></div>
                      <div>Preferred Period: <strong className="text-white block">{preferredStartDate} to {preferredEndDate}</strong></div>
                      <div>Services Requested: 
                        <div className="flex flex-wrap gap-1 mt-1">
                          {requiredServices.map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SITE CONDITIONS */}
                  <div className="space-y-1.5 pb-4 border-b border-emerald-500/10">
                    <h4 className="font-extrabold text-emerald-400 uppercase text-[11px] tracking-wider">Site Conditions & Hazards</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                      <div>Access: <strong className="text-white block">{accessAvailability}</strong></div>
                      <div>Road: <strong className="text-white block">{roadCondition} ({distanceFromRoad})</strong></div>
                      <div>Terrain: <strong className="text-white block">{terrain}</strong></div>
                      <div>Hazards: <strong className="text-amber-400 block">{hazards.join(', ') || 'None'}</strong></div>
                    </div>
                    {additionalNotes && (
                      <div className="mt-2 text-slate-400 text-[11px]">
                        Instructions: <span className="text-slate-200 italic">{additionalNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* OPTIONAL CONTRACTOR ASSIGNMENT */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-emerald-400 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={14} /> Assigned Admin-Approved Contractor (Optional)
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowContractorModal(true)}
                        className="ld-btn-back text-xs"
                      >
                        {selectedContractor ? 'Change Contractor' : '+ Select Approved Contractor'}
                      </button>
                    </div>

                    {selectedContractor ? (
                      <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">{selectedContractor.companyName || selectedContractor.name}</div>
                          <div className="text-[11px] text-emerald-300">{selectedContractor.location || selectedContractor.district} • Verified Contractor</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedContractor(null)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[#030905] border border-emerald-500/10 text-slate-400 text-xs">
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
