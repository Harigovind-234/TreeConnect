import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import FileUploadCard from '../../components/FileUploadCard';
import './LandownerDashboard.css';
import {
  Trees,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  X,
  MapPin,
  Camera,
  ShieldCheck,
  Building2
} from 'lucide-react';

const AddTreeInventory = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const landownerCtx = useLandowner() || {};
  const properties = landownerCtx.properties || [];
  const addInventory = landownerCtx.addInventory || (() => { });

  const safeProperties = Array.isArray(properties) ? properties : [];

  const urlPropId = searchParams.get('propertyId') || '';
  const [selectedPropertyId, setSelectedPropertyId] = useState(urlPropId);

  // Sync selectedPropertyId when properties or URL params update
  useEffect(() => {
    const propIdFromUrl = searchParams.get('propertyId');
    if (propIdFromUrl) {
      setSelectedPropertyId(propIdFromUrl);
    } else if (safeProperties.length > 0) {
      const firstId = safeProperties[0]?.id || safeProperties[0]?._id || '';
      setSelectedPropertyId(prev => prev || firstId);
    }
  }, [searchParams, safeProperties]);

  // Find selected property by id or _id
  const selectedProperty = safeProperties.find(
    p => p && (p.id === selectedPropertyId || p._id === selectedPropertyId)
  ) || safeProperties[0] || null;

  // Helper for blank basic tree group
  const createBlankTreeGroup = (idNum) => {
    const propTreeCount = Number(selectedProperty?.approxTreesCount);
    const defaultTreesCount = (propTreeCount && propTreeCount > 0) ? propTreeCount : 5;
    const defaultSpecies = selectedProperty?.mainSpecies || 'Teak';

    return {
      id: `T-${Date.now()}-${idNum}`,
      groupName: `${defaultSpecies} Stand #${idNum}`,
      species: defaultSpecies,
      numberOfTrees: defaultTreesCount,
      approxAge: '15 years',
      condition: 'Healthy',
      locationInProperty: 'Front yard / Boundary area',
      notes: ''
    };
  };

  const [treeGroups, setTreeGroups] = useState([createBlankTreeGroup(1)]);
  const [photos, setPhotos] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});

  const speciesOptions = [
    'Teak',
    'Coconut',
    'Rubber',
    'Mahogany',
    'Western Red Cedar',
    'Douglas Fir',
    'Rosewood',
    'Eucalyptus',
    'Pine',
    'Jackfruit',
    'Mango',
    'Other'
  ];

  const conditionOptions = ['Healthy', 'Damaged', 'Diseased', 'Dead'];

  const handleGroupChange = (index, field, value) => {
    const updated = [...treeGroups];
    updated[index][field] = value;
    setTreeGroups(updated);
    if (errors[`${field}_${index}`]) {
      setErrors(prev => ({ ...prev, [`${field}_${index}`]: null }));
    }
  };

  const handleAddGroup = () => {
    setTreeGroups(prev => [...prev, createBlankTreeGroup(prev.length + 1)]);
  };

  const handleRemoveGroup = (index) => {
    if (treeGroups.length <= 1) return;
    setTreeGroups(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedPropertyId && !selectedProperty) newErrors.property = 'Please select a property';
    treeGroups.forEach((tg, idx) => {
      if (!tg.species) newErrors[`species_${idx}`] = 'Species is required';
      if (!tg.numberOfTrees || Number(tg.numberOfTrees) <= 0) newErrors[`count_${idx}`] = 'Number of trees must be greater than 0';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const activePropId = selectedProperty?.id || selectedProperty?._id || selectedPropertyId;
    const activePropName = selectedProperty?.propertyName || 'Registered Property';

    let photoUrls = [];
    if (photos) {
      if (typeof photos === 'string') {
        photoUrls = [photos];
      } else if (Array.isArray(photos)) {
        photoUrls = photos.map(p => typeof p === 'string' ? p : (p.dataUrl || p.previewUrl || p.url)).filter(Boolean);
      } else if (photos.dataUrl || photos.previewUrl || photos.url) {
        photoUrls = [photos.dataUrl || photos.previewUrl || photos.url];
      }
    }

    const newInventoryRecord = {
      propertyId: activePropId,
      propertyName: activePropName,
      speciesList: treeGroups.map(tg => ({
        id: tg.id,
        treeSpecies: tg.species,
        species: tg.species,
        numberOfTrees: Number(tg.numberOfTrees),
        approxAge: tg.approxAge,
        treeCondition: tg.condition,
        notes: tg.notes,
        locationInProperty: tg.locationInProperty,
        photos: photoUrls,
        attachedPhotos: photoUrls,
        image: photoUrls[0] || null
      })),
      treeAreaLocation: treeGroups[0]?.locationInProperty || 'Main Estate Area',
      photos: photoUrls,
      attachedPhotos: photoUrls
    };

    try {
      await addInventory(newInventoryRecord);
      setSuccessMessage('Tree inventory information saved successfully!');
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/landowner/properties');
      }, 1000);
    } catch (err) {
      console.error("Error saving tree inventory:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="landowner-dashboard-page">
      <Navbar />
      <div className="landowner-dashboard-container">
        <Sidebar />

        <div className="landowner-dashboard-workspace">
          <main className="w-full flex flex-col gap-8">

            {/* Header Banner Card */}
            <section className="ld-card ld-hero-card">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/landowner/dashboard')}
                  className="ld-pill hover:text-white cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to Dashboard
                </button>

                <span className="ld-hero-tag">
                  <span className="ld-dot ld-dot-green"></span> Workflow Progress: Step 2: Add Trees
                </span>
              </div>

              <div className="mt-3">
                <h1 className="ld-hero-heading flex items-center gap-3">
                  <Trees className="text-emerald-400" size={32} /> Add Tree Inventory
                </h1>
                <p className="ld-hero-subtext mt-1.5">
                  Log tree species, standing tree counts, age profiles, and health conditions for your registered property.
                </p>
              </div>
            </section>

            {/* Success Banner Toast */}
            {successMessage && (
              <div className="ld-card flex items-center gap-3 bg-emerald-500/15 border border-emerald-500/40 p-4 shadow-lg">
                <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
                <span className="font-bold text-sm text-white">
                  {successMessage} Redirecting to Properties...
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">

              {/* STEP 1: SELECT PROPERTY CARD */}
              <div className="ld-card p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-emerald-500/15">
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                    <Building2 size={22} className="text-emerald-400" /> 1. Select Target Property
                  </h2>
                  <span className="ld-badge-green text-xs font-bold py-1 px-3">
                    {safeProperties.length} Estates Available
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Choose which registered property these standing trees are located on.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <label className="ld-label">
                      Target Estate / Plot <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                      style={{ borderRadius: '8px' }}
                      className="ld-select text-sm sm:text-base font-semibold"
                    >
                      {safeProperties.length > 0 ? (
                        safeProperties.map(p => {
                          const pId = p.id || p._id;
                          return (
                            <option key={pId} value={pId} className="bg-[#0e1612] text-white py-1">
                              {p.propertyName} ({p.district || p.state})
                            </option>
                          );
                        })
                      ) : (
                        <option value="" className="bg-[#0e1612] text-slate-400">No properties registered yet</option>
                      )}
                    </select>
                    {errors.property && <p className="text-xs sm:text-sm text-rose-400 font-medium mt-1.5">{errors.property}</p>}
                  </div>

                  {selectedProperty && (
                    <div className="ld-subcard p-5 flex items-center justify-between gap-4" style={{ borderRadius: '10px' }}>
                      <div>
                        <span className="text-base sm:text-lg font-extrabold text-white block">
                          {selectedProperty.propertyName}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 mt-1.5">
                          <MapPin size={15} className="text-emerald-400 shrink-0" />
                          {selectedProperty.address && `${selectedProperty.address}, `}
                          {selectedProperty.district}, {selectedProperty.state}
                        </span>
                      </div>
                      <span className="ld-pill text-xs sm:text-sm font-bold py-1 px-3.5 shrink-0" style={{ borderRadius: '6px' }}>
                        {selectedProperty.propertyType || 'Estate'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 2: TREE GROUPS CARD */}
              <div className="ld-card p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-emerald-500/15">
                  <div>
                    <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                      <Trees size={22} className="text-emerald-400" /> 2. Tree Species &amp; Quantities
                    </h2>
                    <p className="text-sm text-slate-300 mt-1">
                      Specify the species, count, age, and general condition of standing trees.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddGroup}
                    style={{ borderRadius: '8px' }}
                    className="px-4 py-2.5 bg-[#18241e] hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-bold text-xs sm:text-sm border border-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0"
                  >
                    <Plus size={16} />
                    <span>Add Tree Group</span>
                  </button>
                </div>

                {/* Grid of Tree Groups with generous 24px gap between groups */}
                <div className="flex flex-col gap-6">
                  {treeGroups.map((tg, idx) => (
                    <div key={tg.id} className="ld-subcard p-6 sm:p-7 space-y-5 border border-emerald-500/20 bg-[#0e1612] shadow-lg" style={{ borderRadius: '12px' }}>
                      <div className="flex items-center justify-between pb-3.5 border-b border-emerald-500/15">
                        <span className="ld-hero-tag text-xs sm:text-sm font-bold tracking-wider">
                          <ShieldCheck size={16} /> TREE GROUP #{idx + 1}
                        </span>
                        {treeGroups.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGroup(idx)}
                            style={{ borderRadius: '6px' }}
                            className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Trash2 size={15} /> Remove Group
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Group Designation */}
                        <div>
                          <label className="ld-label">
                            Group Designation
                          </label>
                          <input
                            type="text"
                            value={tg.groupName}
                            onChange={(e) => handleGroupChange(idx, 'groupName', e.target.value)}
                            placeholder="e.g. Frontyard Teak Stand"
                            style={{ borderRadius: '8px' }}
                            className="ld-input"
                          />
                        </div>

                        {/* Tree Species */}
                        <div>
                          <label className="ld-label">
                            Tree Species <span className="text-rose-400">*</span>
                          </label>
                          <select
                            value={tg.species}
                            onChange={(e) => handleGroupChange(idx, 'species', e.target.value)}
                            style={{ borderRadius: '8px' }}
                            className="ld-select font-extrabold text-emerald-400"
                          >
                            {speciesOptions.map(opt => (
                              <option key={opt} value={opt} className="bg-[#0e1612] text-white font-semibold py-1">{opt}</option>
                            ))}
                          </select>
                          {errors[`species_${idx}`] && <p className="text-xs sm:text-sm text-rose-400 font-medium mt-1.5">{errors[`species_${idx}`]}</p>}
                        </div>

                        {/* Number of Trees */}
                        <div>
                          <label className="ld-label">
                            Number of Trees <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="number"
                            value={tg.numberOfTrees}
                            onChange={(e) => handleGroupChange(idx, 'numberOfTrees', e.target.value)}
                            placeholder="e.g. 5"
                            style={{ borderRadius: '8px' }}
                            className="ld-input font-extrabold"
                          />
                          {errors[`count_${idx}`] && <p className="text-xs sm:text-sm text-rose-400 font-medium mt-1.5">{errors[`count_${idx}`]}</p>}
                        </div>

                        {/* Approximate Age */}
                        <div>
                          <label className="ld-label">
                            Approximate Age
                          </label>
                          <input
                            type="text"
                            value={tg.approxAge}
                            onChange={(e) => handleGroupChange(idx, 'approxAge', e.target.value)}
                            placeholder="e.g. 15-20 years"
                            style={{ borderRadius: '8px' }}
                            className="ld-input"
                          />
                        </div>

                        {/* Location within Property */}
                        <div className="md:col-span-2">
                          <label className="ld-label">
                            Location / Plot Position within Property
                          </label>
                          <input
                            type="text"
                            value={tg.locationInProperty}
                            onChange={(e) => handleGroupChange(idx, 'locationInProperty', e.target.value)}
                            placeholder="e.g. Near main house compound wall / East boundary"
                            style={{ borderRadius: '8px' }}
                            className="ld-input"
                          />
                        </div>

                        {/* Tree Health & Condition */}
                        <div className="md:col-span-3">
                          <label className="ld-label">
                            General Tree Health &amp; Condition
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {conditionOptions.map(cond => {
                              const isSelected = tg.condition === cond;
                              return (
                                <button
                                  key={cond}
                                  type="button"
                                  onClick={() => handleGroupChange(idx, 'condition', cond)}
                                  style={{ borderRadius: '8px' }}
                                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer flex items-center gap-2 ${isSelected
                                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                                      : 'bg-[#050e08] border-emerald-600/20 text-slate-300 hover:border-emerald-500/40 hover:bg-[#0c1810]'
                                    }`}
                                >
                                  <span style={{ borderRadius: '3px' }} className={`w-3 h-3 border ${isSelected ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-400/80 border-amber-500'}`}></span>
                                  {cond}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-3">
                          <label className="ld-label">
                            Special Notes / Hazards <span className="text-slate-400 font-normal lowercase text-xs">(optional)</span>
                          </label>
                          <input
                            type="text"
                            value={tg.notes}
                            onChange={(e) => handleGroupChange(idx, 'notes', e.target.value)}
                            placeholder="e.g. Mature teak trees near front gate access with high timber volume."
                            style={{ borderRadius: '8px' }}
                            className="ld-input"
                          />
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 3: PHOTOS & VIDEO UPLOAD CARD */}
              <div className="ld-card p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between pb-3.5 border-b border-emerald-500/15">
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                    <Camera size={22} className="text-emerald-400" /> 3. Tree Photos &amp; Optional Video
                  </h2>
                </div>
                <FileUploadCard
                  id="tree-photos-uploader"
                  label="Upload Tree Photos &amp; Optional Video"
                  helperText="Upload photos showing trunk diameter, canopy, and surrounding compound area (JPG, PNG, WEBP, PDF, MP4 supported)"
                  acceptedFormatsText="JPG, PNG, WEBP, PDF, MP4"
                  acceptedMimeTypes="image/*,video/*,.pdf,.jpg,.jpeg,.png,.webp"
                  maxSizeMB={10}
                  fileData={photos}
                  onFileChange={(f) => setPhotos(f)}
                />
              </div>

              {/* FORM ACTIONS */}
              <div className="flex items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/landowner/dashboard')}
                  className="ld-btn-outline text-xs sm:text-sm font-bold py-3 px-6"
                  style={{ width: 'auto' }}
                  disabled={isSubmitting}
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  type="submit"
                  className="ld-btn-green text-xs sm:text-sm font-bold py-3 px-8"
                  style={{ width: 'auto' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Save size={18} /> Save Tree Inventory</span>
                  )}
                </button>
              </div>

            </form>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AddTreeInventory;
