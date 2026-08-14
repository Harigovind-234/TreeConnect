import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import FileUploadCard from '../../components/FileUploadCard';
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
  const { properties, addInventory } = useLandowner();

  const urlPropId = searchParams.get('propertyId') || '';
  const [selectedPropertyId, setSelectedPropertyId] = useState(urlPropId);

  // Sync selectedPropertyId when properties or URL params update
  useEffect(() => {
    const propIdFromUrl = searchParams.get('propertyId');
    if (propIdFromUrl) {
      setSelectedPropertyId(propIdFromUrl);
    } else if (properties && properties.length > 0 && !selectedPropertyId) {
      const firstId = properties[0].id || properties[0]._id || '';
      setSelectedPropertyId(firstId);
    }
  }, [searchParams, properties]);

  // Find selected property by id or _id
  const selectedProperty = properties.find(
    p => p.id === selectedPropertyId || p._id === selectedPropertyId
  ) || properties[0];

  // Helper for blank basic tree group
  const createBlankTreeGroup = (idNum) => ({
    id: `T-${idNum < 10 ? '00' : '0'}${idNum}`,
    groupName: `Tree Group #${idNum}`,
    species: 'Teak',
    numberOfTrees: 5,
    approxAge: '15 years',
    condition: 'Healthy',
    locationInProperty: 'Front yard / Boundary area',
    notes: ''
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const activePropId = selectedProperty?.id || selectedProperty?._id || selectedPropertyId;
    const activePropName = selectedProperty?.propertyName || 'Registered Property';

    let photoUrls = [];
    if (photos) {
      if (typeof photos === 'string') {
        photoUrls = [photos];
      } else if (photos.dataUrl) {
        photoUrls = [photos.dataUrl];
      } else if (photos.previewUrl) {
        photoUrls = [photos.previewUrl];
      }
    }

    const newInventoryRecord = {
      propertyId: activePropId,
      propertyName: activePropName,
      speciesList: treeGroups.map(tg => ({
        id: tg.id,
        treeSpecies: tg.species,
        numberOfTrees: Number(tg.numberOfTrees),
        approxAge: tg.approxAge,
        treeCondition: tg.condition,
        notes: tg.notes,
        locationInProperty: tg.locationInProperty
      })),
      treeAreaLocation: treeGroups[0]?.locationInProperty || 'Main Estate Area',
      photos: photoUrls
    };

    try {
      addInventory(newInventoryRecord);
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
    <div className="dashboard-layout min-h-screen bg-dark">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace flex-1">
          <main className="dashboard-content max-w-[1100px] w-[min(100%-48px,1100px)] mx-auto py-8 px-4 sm:px-6 space-y-8">

            {/* Header */}
            <div className="space-y-4">
              <button
                onClick={() => navigate('/landowner/dashboard')}
                className="btn btn-secondary btn-sm flex items-center gap-1.5 text-muted hover:text-main text-[14px]"
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </button>

              <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-color/50">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
                    <Trees size={28} />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Add Tree Inventory
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                      Log tree species, counts, and conditions for your property.
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
                  <span className="text-slate-400">Workflow Progress: </span>
                  <span className="text-emerald-400 font-bold">Step 2: Add Trees ⏳</span>
                </div>
              </div>
            </div>

            {/* Success Banner */}
            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 flex items-center gap-3 animate-fade-in shadow-xl">
                <CheckCircle2 size={22} className="text-emerald-400 flex-shrink-0" />
                <span className="font-bold text-sm">{successMessage} Redirecting to Dashboard...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* STEP 1: SELECT PROPERTY */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3.5">
                  <Building2 size={20} className="text-emerald-400" />
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    1. Select Target Property
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Choose which registered property these trees are located on.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Target Estate / Plot <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                      className="w-full form-input text-base font-semibold px-4 py-3 rounded-xl bg-slate-950 border-slate-800 text-white"
                    >
                      {properties && properties.length > 0 ? (
                        properties.map(p => {
                          const pId = p.id || p._id;
                          return (
                            <option key={pId} value={pId}>
                              {p.propertyName} ({p.district || p.state})
                            </option>
                          );
                        })
                      ) : (
                        <option value="">No properties registered yet</option>
                      )}
                    </select>
                    {errors.property && <p className="text-xs text-red-400 mt-1">{errors.property}</p>}
                  </div>

                  {selectedProperty && (
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs space-y-1">
                      <div>
                        <span className="font-bold text-emerald-400 text-base block">{selectedProperty.propertyName}</span>
                        <span className="text-slate-400 flex items-center gap-1.5 mt-1">
                          <MapPin size={14} className="text-emerald-400" />
                          {selectedProperty.address && `${selectedProperty.address}, `}
                          {selectedProperty.district}, {selectedProperty.state}
                        </span>
                      </div>
                      <span className="font-semibold text-white px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                        {selectedProperty.propertyType}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 2: TREE GROUPS */}
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                      <Trees size={20} className="text-emerald-400" /> 2. Tree Species &amp; Quantities
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Specify the species, count, age, and general condition of standing trees.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddGroup}
                    className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={16} /> Add Another Tree Group
                  </button>
                </div>

                {treeGroups.map((tg, idx) => (
                  <div key={tg.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl relative">

                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                      <span className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                        <ShieldCheck size={16} /> Tree Group #{idx + 1}
                      </span>
                      {treeGroups.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGroup(idx)}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-800/40 cursor-pointer"
                        >
                          <Trash2 size={14} /> Remove Group
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                      {/* Tree / Group Name */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Group Designation
                        </label>
                        <input
                          type="text"
                          value={tg.groupName}
                          onChange={(e) => handleGroupChange(idx, 'groupName', e.target.value)}
                          placeholder="e.g. Frontyard Teak Stand"
                          className="w-full form-input text-sm px-4 py-3 rounded-xl bg-slate-950 border-slate-800 text-white"
                        />
                      </div>

                      {/* Species */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Tree Species <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={tg.species}
                          onChange={(e) => handleGroupChange(idx, 'species', e.target.value)}
                          className="w-full form-input text-sm px-4 py-3 rounded-xl bg-slate-950 border-slate-800 text-white font-semibold"
                        >
                          {speciesOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {errors[`species_${idx}`] && <p className="text-xs text-red-400 mt-1">{errors[`species_${idx}`]}</p>}
                      </div>

                      {/* Number of Trees */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Number of Trees <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="number"
                          value={tg.numberOfTrees}
                          onChange={(e) => handleGroupChange(idx, 'numberOfTrees', e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full form-input text-sm px-4 py-3 rounded-xl bg-slate-950 border-slate-800 text-white font-semibold"
                        />
                        {errors[`count_${idx}`] && <p className="text-xs text-red-400 mt-1">{errors[`count_${idx}`]}</p>}
                      </div>

                      {/* Approximate Age */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Approximate Age
                        </label>
                        <input
                          type="text"
                          value={tg.approxAge}
                          onChange={(e) => handleGroupChange(idx, 'approxAge', e.target.value)}
                          placeholder="e.g. 15-20 years"
                          className="w-full form-input text-sm px-4 py-3 rounded-xl bg-slate-950 border-slate-800 text-white"
                        />
                      </div>

                      {/* Location within Property */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Location / Plot Position within Property
                        </label>
                        <input
                          type="text"
                          value={tg.locationInProperty}
                          onChange={(e) => handleGroupChange(idx, 'locationInProperty', e.target.value)}
                          placeholder="e.g. Near main house compound wall / East boundary"
                          className="w-full form-input text-sm px-4 py-3 rounded-xl bg-slate-950 border-slate-800 text-white"
                        />
                      </div>

                      {/* Tree Condition */}
                      <div className="space-y-2 md:col-span-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          General Tree Health &amp; Condition
                        </label>
                        <div className="flex flex-wrap gap-2.5 pt-1">
                          {conditionOptions.map(cond => {
                            const isSelected = tg.condition === cond;
                            return (
                              <button
                                key={cond}
                                type="button"
                                onClick={() => handleGroupChange(idx, 'condition', cond)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isSelected
                                    ? cond === 'Healthy' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm' :
                                      cond === 'Damaged' ? 'bg-amber-500/20 border-amber-500 text-amber-300' :
                                        cond === 'Diseased' ? 'bg-orange-500/20 border-orange-500 text-orange-300' :
                                          'bg-red-500/20 border-red-500 text-red-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                  }`}
                              >
                                {cond}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2 md:col-span-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Special Notes / Hazards <span className="font-normal text-slate-500">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={tg.notes}
                          onChange={(e) => handleGroupChange(idx, 'notes', e.target.value)}
                          placeholder="e.g. Mature teak trees near front gate access with high timber volume."
                          className="w-full form-input text-xs px-4 py-3 rounded-xl bg-slate-950 border-slate-800 text-white"
                        />
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {/* PHOTOS & VIDEO UPLOAD */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                  <Camera size={20} className="text-emerald-400" />
                  <h2 className="text-lg font-bold text-white tracking-tight">Tree Photos &amp; Optional Video</h2>
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

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/landowner/dashboard')}
                  className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  type="submit"
                  className="py-3.5 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.005] cursor-pointer min-w-44"
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
