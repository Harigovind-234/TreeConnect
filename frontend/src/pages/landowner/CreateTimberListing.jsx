import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLandowner } from '../../context/LandownerContext';
import FileUploadCard from '../../components/FileUploadCard';
import marketplaceService from '../../services/marketplaceService';
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  MapPin,
  FileText,
  Upload,
  X,
  AlertCircle,
  Tag,
  Sparkles,
  Truck,
  Building,
  Trees,
  Check,
  Camera,
  Image as ImageIcon,
  Trash2,
  Plus,
  Star,
  Layers,
  Eye
} from 'lucide-react';
import './CreateTimberListing.css';

const CreateTimberListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { completedHarvests = [], properties = [], harvestRequests = [] } = useLandowner();

  const userRole = user?.role || 'landowner';
  const isContractor = userRole === 'contractor';

  const incomingOp = location.state?.operation;
  const incomingOpId = searchParams.get('operationId') || incomingOp?.id;

  const [realtimeRequests, setRealtimeRequests] = useState([]);

  // Fetch realtime harvest requests directly from database API to ensure freshest on-site measurements
  useEffect(() => {
    let isMounted = true;
    const fetchRealtime = async () => {
      try {
        const res = await harvestService.getHarvestRequests({ all_records: true });
        const list = Array.isArray(res?.harvest_requests)
          ? res.harvest_requests
          : (Array.isArray(res) ? res : (res?.requests || []));
        if (isMounted && list.length > 0) {
          setRealtimeRequests(list);
        }
      } catch (e) {
        console.warn('Realtime harvest request fetch:', e);
      }
    };
    fetchRealtime();
    return () => { isMounted = false; };
  }, []);

  // Helper to sanitize and ensure genuine inspected girth is used without assuming uninspected log length
  const sanitizeDimensions = (dim, fallbackGirth) => {
    const g = fallbackGirth || '60 - 80cm';
    if (!dim || String(dim).includes('120-150cm') || String(dim).includes('120 - 150cm')) {
      return `Avg girth: ${g}`;
    }
    if (String(dim).includes('4.2m')) {
      return String(dim).replace(/Avg length:\s*4\.2m,?\s*/gi, '').replace(/4\.2m,?\s*/gi, '').trim() || `Avg girth: ${g}`;
    }
    return dim;
  };

  // Purge any old cached drafts in localStorage that contain the stale 120-150cm or 4.2m length strings
  useEffect(() => {
    try {
      const draftStr = localStorage.getItem('treeconnect_active_listing_draft');
      if (draftStr && (draftStr.includes('120-150cm') || draftStr.includes('4.2m'))) {
        const draftObj = JSON.parse(draftStr);
        draftObj.logDimensions = 'Avg girth: 60 - 80cm';
        localStorage.setItem('treeconnect_active_listing_draft', JSON.stringify(draftObj));
      }
      const storedCompStr = localStorage.getItem('treeconnect_completed_harvests');
      if (storedCompStr && (storedCompStr.includes('120-150cm') || storedCompStr.includes('4.2m'))) {
        const storedComp = JSON.parse(storedCompStr);
        const fixed = storedComp.map(c => ({
          ...c,
          logDimensions: (c.logDimensions && (c.logDimensions.includes('120-150cm') || c.logDimensions.includes('4.2m')))
            ? 'Avg girth: 60 - 80cm'
            : c.logDimensions
        }));
        localStorage.setItem('treeconnect_completed_harvests', JSON.stringify(fixed));
      }
    } catch (e) {}
  }, []);

  // Retrieve cached completed harvests and active draft from localStorage
  const cachedCompleted = useMemo(() => {
    try {
      const stored = localStorage.getItem('treeconnect_completed_harvests');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const cachedDraft = useMemo(() => {
    try {
      const draft = localStorage.getItem('treeconnect_active_listing_draft');
      return draft ? JSON.parse(draft) : null;
    } catch (e) {
      return null;
    }
  }, []);

  // Synthesize all completed harvests from Context, LocalStorage, and Harvest Requests
  const allCompletedHarvests = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    const addOp = (op) => {
      if (!op || !op.id) return;
      const cKey = String(op.id).toLowerCase().trim();
      const sanitized = {
        ...op,
        logDimensions: sanitizeDimensions(op.logDimensions, op.siteInspectionGirth)
      };
      if (!seenIds.has(cKey)) {
        seenIds.add(cKey);
        list.push(sanitized);
      }
    };

    // 1. Incoming state from navigation
    if (incomingOp) addOp(incomingOp);

    // 2. Active draft from HarvestOperations click
    if (cachedDraft) addOp(cachedDraft);

    // 3. User cached completed harvests
    cachedCompleted.forEach(addOp);
    completedHarvests.forEach(addOp);

    // 4. Completed / Verified Harvest Requests from Realtime DB & Context
    const combinedRequests = [...realtimeRequests, ...(harvestRequests || [])];
    combinedRequests.forEach(r => {
      const isComp = r.status === 'COMPLETED';
      const stages = r.harvest_stages || {};
      const verifiedCount = ['stage_1', 'stage_2', 'stage_3', 'stage_4'].filter(s => {
        const st = String(stages[s]?.status || '').toUpperCase();
        return st === 'VERIFIED' || st === 'COMPLETED';
      }).length;

      if (isComp || verifiedCount === 4) {
        const s3 = stages.stage_3?.stage_data || {};
        const s4 = stages.stage_4?.stage_data || {};
        const rawVol = s4.estimatedVolume || stages.stage_4?.measured_volume || r.estimated_harvestable_volume || '1.70';
        const vol = parseFloat(String(rawVol).replace(/[^\d.]/g, '')) || 1.70;
        const rawCount = s4.logsMeasured || s3.logsProduced || stages.stage_4?.logs_measured || stages.stage_3?.logs_produced || 2;
        const qty = parseInt(String(rawCount).replace(/\D+/g, ''), 10) || 2;
        const sp = r.selected_tree_groups?.[0]?.species || r.tree_groups?.[0]?.species || r.species || r.treeSpecies || 'Teakwood';
        const prop = r.propertyName || properties[0]?.propertyName || properties[0]?.name || 'TreeConnect Property';
        const dist = r.propertyDistrict || r.district || properties[0]?.district || 'Kottayam';
        const rId = String(r.id || r._id || 'op_6ad30c17');

        const rawHarvestDate = 
          stages.stage_2?.completed_at ||
          stages.stage_2?.verified_at ||
          stages.stage_2?.updated_at ||
          stages.stage_4?.completed_at ||
          stages.stage_4?.verified_at ||
          stages.stage_4?.updated_at ||
          r.actual_completion_date ||
          r.completed_at ||
          r.completionDate ||
          r.actual_harvest_date ||
          r.confirmed_harvest_date ||
          r.proposed_harvest_date;

        let parsedHarvestDate = new Date().toISOString().split('T')[0];
        if (rawHarvestDate) {
          try {
            const d = new Date(rawHarvestDate);
            if (!isNaN(d.getTime())) {
              parsedHarvestDate = d.toISOString().split('T')[0];
            }
          } catch (e) {}
        }

        const inspectionGirth = 
          r.site_inspection?.measured_avg_dbh || 
          r.site_inspection?.girth || 
          r.selected_tree_groups?.[0]?.girth || 
          r.tree_groups?.[0]?.girth || 
          '60 - 80cm';

        addOp({
          id: rId,
          operationTitle: `${sp} Sawlogs (${prop})`,
          propertyName: prop,
          species: sp,
          timberSpecies: sp,
          timberType: 'Sawlogs',
          quantity: qty,
          harvestedVolume: vol,
          volume: vol,
          gradeQuality: 'Grade A Prime Export',
          logDimensions: `Avg girth: ${inspectionGirth}`,
          siteInspectionGirth: inspectionGirth,
          harvestDate: parsedHarvestDate,
          storageLocation: `${prop} On-Site Log Yard`,
          district: dist,
          pickupLocation: r.propertyLocation || 'Main Highway Access Gate #1',
          transportAvailable: true,
          transportNotes: 'Heavy log transport available for mill delivery across Kerala',
          pricePerM3: 42500,
          askingPrice: Math.round(vol * 42500),
          description: `Matured, high-density Kerala ${sp} logs debarked with end-seal from ${prop}. Measured at ${vol} m³ (${qty} logs). Forest transit clearance ready.`
        });
      }
    });

    return list;
  }, [completedHarvests, cachedCompleted, cachedDraft, harvestRequests, realtimeRequests, incomingOp, properties]);

  // Selection mode: 'harvest_operation' or 'direct_inventory'
  const hasHarvestOps = allCompletedHarvests.length > 0;
  const [listingSource, setListingSource] = useState(hasHarvestOps || incomingOpId ? 'harvest_operation' : 'direct_inventory');

  // Determine initial selected operation
  const targetInitialOp = useMemo(() => {
    if (incomingOp) return incomingOp;
    if (incomingOpId) {
      const found = allCompletedHarvests.find(h => 
        String(h.id).toLowerCase().includes(String(incomingOpId).toLowerCase()) ||
        String(incomingOpId).toLowerCase().includes(String(h.id).toLowerCase())
      );
      if (found) return found;
    }
    if (cachedDraft) return cachedDraft;
    return allCompletedHarvests[0] || null;
  }, [incomingOp, incomingOpId, cachedDraft, allCompletedHarvests]);

  const [selectedOperationId, setSelectedOperationId] = useState(targetInitialOp?.id || allCompletedHarvests[0]?.id || '');

  // Default property name from registered properties or standard TreeConnect property
  const defaultPropName = properties[0]?.propertyName || properties[0]?.name || 'TreeConnect Property';
  const defaultDistrict = properties[0]?.district || 'Kottayam';

  // Form State
  const [formData, setFormData] = useState(() => {
    if (targetInitialOp) {
      const vol = Number(targetInitialOp.harvestedVolume || targetInitialOp.volume) || 1.70;
      const rate = Number(targetInitialOp.pricePerM3) || 42500;
      const qty = Number(targetInitialOp.quantity) || 2;
      const sp = targetInitialOp.species || targetInitialOp.timberSpecies || 'Teakwood';
      const prop = targetInitialOp.propertyName || defaultPropName;

      return {
        title: targetInitialOp.operationTitle || `Grade A Prime Export ${sp} Sawlogs (${prop})`,
        propertyName: prop,
        timberSpecies: sp,
        timberType: targetInitialOp.timberType || 'Sawlogs',
        quantity: qty,
        volume: vol,
        gradeQuality: targetInitialOp.gradeQuality || 'Grade A Prime Export',
        logDimensions: sanitizeDimensions(targetInitialOp.logDimensions, targetInitialOp.siteInspectionGirth),
        harvestDate: targetInitialOp.harvestDate || new Date().toISOString().split('T')[0],
        askingPrice: targetInitialOp.askingPrice || Math.round(vol * rate),
        pricePerM3: rate,
        negotiable: 'Yes',
        district: targetInitialOp.district || defaultDistrict,
        storageLocation: targetInitialOp.storageLocation || `${prop} On-Site Log Yard`,
        pickupLocation: targetInitialOp.pickupLocation || 'Main Highway Access Gate #1',
        transportAvailable: true,
        transportNotes: targetInitialOp.transportNotes || 'Heavy log transport available for mill delivery across Kerala',
        description: targetInitialOp.description || `Matured, high-density Kerala ${sp} logs debarked with end-seal from ${prop}. Measured at ${vol} m³ (${qty} logs). Forest transit clearance ready.`,
        status: 'Published'
      };
    }

    return {
      title: `Grade A Prime Export Teakwood Sawlogs (${defaultPropName})`,
      propertyName: defaultPropName,
      timberSpecies: 'Teakwood',
      timberType: 'Sawlogs',
      quantity: 2,
      volume: 1.70,
      gradeQuality: 'Grade A Prime Export',
      logDimensions: 'Avg girth: 60 - 80cm',
      harvestDate: new Date().toISOString().split('T')[0],
      askingPrice: 72250,
      pricePerM3: 42500,
      negotiable: 'Yes',
      district: defaultDistrict,
      storageLocation: `${defaultPropName} On-Site Log Yard`,
      pickupLocation: 'Main Highway Access Gate #1',
      transportAvailable: true,
      transportNotes: 'Heavy log transport available for mill delivery across Kerala',
      description: `Matured, high-density Kerala Teakwood logs with clean straight boles and uniform grain from ${defaultPropName}. Debarked with end-seal to prevent checking. Forest transit clearance ready.`,
      status: 'Published'
    };
  });

  const [logPhotos, setLogPhotos] = useState([]);
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const multiFileInputRef = React.useRef(null);

  const compressImage = (file, maxWidth = 1000, quality = 0.72) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleFilesUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const compressedUrl = await compressImage(file);
        if (compressedUrl) {
          setLogPhotos(prev => {
            if (prev.length >= 12) return prev;
            return [
              ...prev,
              {
                id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                name: file.name,
                size: (Math.round(compressedUrl.length * 0.75 / 1024)) + ' KB',
                previewUrl: compressedUrl
              }
            ];
          });
        }
      } catch (_) {}
    }
  };

  const handleRemovePhoto = (id) => {
    setLogPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleSetCoverPhoto = (id) => {
    setLogPhotos(prev => {
      const target = prev.find(p => p.id === id);
      if (!target) return prev;
      return [target, ...prev.filter(p => p.id !== id)];
    });
  };

  const handleImportHarvestPhotos = () => {
    const allReqs = [...realtimeRequests, ...(harvestRequests || [])];
    const match = allReqs.find(r => {
      const rId = String(r.id || r._id || '').toLowerCase();
      const selId = String(selectedOperationId || incomingOpId || '').toLowerCase();
      return selId && (rId.includes(selId) || selId.includes(rId));
    }) || allReqs[0];

    if (!match) return;

    const stages = match.harvest_stages || {};
    const importedMedia = [];
    ['stage_4', 'stage_3', 'stage_2', 'stage_1'].forEach(sKey => {
      const s = stages[sKey];
      if (s && Array.isArray(s.media)) {
        s.media.forEach((m, idx) => {
          if (m && m.url && typeof m.url === 'string') {
            importedMedia.push({
              id: `imported_${sKey}_${idx}`,
              name: `${s.title || sKey} Evidence`,
              size: 'Verified Milestone',
              previewUrl: m.url,
              tag: sKey === 'stage_4' ? 'Scaled Logs' : (sKey === 'stage_3' ? 'Bucked Billets' : 'Felling Evidence')
            });
          }
        });
      }
    });

    if (importedMedia.length > 0) {
      setLogPhotos(prev => {
        const existingUrls = new Set(prev.map(p => p.previewUrl));
        const filteredNew = importedMedia.filter(m => !existingUrls.has(m.previewUrl));
        return [...prev, ...filteredNew];
      });
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});

  const handleSourceChange = (mode) => {
    setListingSource(mode);
    if (mode === 'harvest_operation' && hasHarvestOps) {
      handleOperationChange(allCompletedHarvests[0]?.id);
    }
  };

  const handleOperationChange = (opId) => {
    setSelectedOperationId(opId);
    const target = allCompletedHarvests.find(h => 
      String(h.id).toLowerCase() === String(opId).toLowerCase() ||
      String(h.id).toLowerCase().includes(String(opId).toLowerCase()) ||
      String(opId).toLowerCase().includes(String(h.id).toLowerCase())
    );

    if (target) {
      const vol = Number(target.harvestedVolume || target.volume) || 1.70;
      const rate = Number(target.pricePerM3) || 42500;
      const qty = Number(target.quantity) || 2;
      const sp = target.species || target.timberSpecies || 'Teakwood';
      const prop = target.propertyName || defaultPropName;

      setFormData(prev => ({
        ...prev,
        title: target.operationTitle || `Grade A Prime Export ${sp} Sawlogs (${prop})`,
        propertyName: prop,
        timberSpecies: sp,
        timberType: target.timberType || 'Sawlogs',
        quantity: qty,
        volume: vol,
        gradeQuality: target.gradeQuality || 'Grade A Prime Export',
        logDimensions: sanitizeDimensions(target.logDimensions, target.siteInspectionGirth),
        harvestDate: target.harvestDate || new Date().toISOString().split('T')[0],
        storageLocation: target.storageLocation || `${prop} On-Site Log Yard`,
        district: target.district || defaultDistrict,
        pickupLocation: target.pickupLocation || prev.pickupLocation || 'Main Highway Access Gate #1',
        pricePerM3: rate,
        askingPrice: Math.round(vol * rate),
        transportAvailable: true,
        description: target.description || `Matured, high-density Kerala ${sp} logs debarked with end-seal from ${prop}. Measured at ${vol} m³ (${qty} logs). Forest transit clearance ready.`
      }));
    }
  };

  // Sync when incoming target operation changes or component mounts
  useEffect(() => {
    if (targetInitialOp) {
      setListingSource('harvest_operation');
      setSelectedOperationId(targetInitialOp.id);
      handleOperationChange(targetInitialOp.id);
    }
  }, [targetInitialOp]);

  // Realtime inspection synchronization effect: updates formData when real records arrive from database
  useEffect(() => {
    const allReqs = [...realtimeRequests, ...(harvestRequests || [])];
    if (allReqs.length === 0) return;
    
    const match = allReqs.find(r => {
      const rId = String(r.id || r._id || '').toLowerCase();
      const selId = String(selectedOperationId || incomingOpId || '').toLowerCase();
      return (selId && (rId.includes(selId) || selId.includes(rId))) || r.status === 'COMPLETED';
    }) || allReqs[0];

    if (match) {
      const realGirth = 
        match.site_inspection?.measured_avg_dbh || 
        match.site_inspection?.girth ||
        match.selected_tree_groups?.[0]?.girth || 
        match.tree_groups?.[0]?.girth || 
        '60 - 80cm';

      const correctDims = `Avg girth: ${realGirth}`;
      setFormData(prev => {
        if (!prev.logDimensions || prev.logDimensions.includes('120-150cm') || prev.logDimensions.includes('120 - 150cm') || prev.logDimensions.includes('4.2m')) {
          return { ...prev, logDimensions: correctDims };
        }
        return prev;
      });
    }
  }, [selectedOperationId, incomingOpId, realtimeRequests, harvestRequests]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const updated = { ...prev, [name]: val };
      if (name === 'askingPrice' || name === 'volume') {
        const vol = Number(name === 'volume' ? value : updated.volume) || 1;
        const total = Number(name === 'askingPrice' ? value : updated.askingPrice) || 0;
        if (vol > 0 && name === 'askingPrice') {
          updated.pricePerM3 = Math.round(total / vol);
        } else if (name === 'volume') {
          updated.askingPrice = Math.round(vol * (Number(updated.pricePerM3) || 30000));
        }
      } else if (name === 'pricePerM3') {
        const vol = Number(updated.volume) || 1;
        const rate = Number(value) || 0;
        updated.askingPrice = Math.round(vol * rate);
      }
      return updated;
    });

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.timberSpecies) newErrors.timberSpecies = 'Timber species is required';
    if (!formData.volume || Number(formData.volume) <= 0) newErrors.volume = 'Valid volume (m³) is required';
    if (!formData.askingPrice || Number(formData.askingPrice) <= 0) newErrors.askingPrice = 'Asking price is required';
    if (!formData.district) newErrors.district = 'District location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        title: formData.title || `${formData.gradeQuality} ${formData.timberSpecies} Logs`,
        volume: Number(formData.volume),
        quantity: Number(formData.quantity) || 1,
        askingPrice: Number(formData.askingPrice),
        pricePerM3: Number(formData.pricePerM3),
        sellerRole: userRole,
        sellerName: user?.name || user?.full_name || (isContractor ? 'Verified Contractor' : 'Registered Landowner'),
        sellerEmail: user?.email || '',
        sellerPhone: user?.phone || '+91 94470 00000',
        harvestOperationId: listingSource === 'harvest_operation' ? selectedOperationId : null,
        images: logPhotos.map(p => p.previewUrl)
      };

      await marketplaceService.saveListing(payload, user);

      setIsSubmitting(false);
      setSuccessMessage('Timber listing published successfully on Marketplace!');

      setTimeout(() => {
        if (isContractor) {
          navigate('/contractor/marketplace');
        } else {
          navigate('/landowner/marketplace');
        }
      }, 1200);
    } catch (err) {
      console.error('Failed to publish listing:', err);
      setIsSubmitting(false);
      setErrors({ form: err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to publish listing. Please check required fields and try again.' });
    }
  };

  const returnPath = isContractor ? '/contractor/marketplace' : '/landowner/marketplace';

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace">
          <main className="ctl-wrapper">

            {/* Header */}
            <div className="ctl-header">
              <button
                type="button"
                onClick={() => navigate(returnPath)}
                className="ctl-back-btn"
              >
                <ArrowLeft size={16} /> Back to Marketplace
              </button>

              <div className="ctl-title-bar">
                <div className="ctl-title-icon">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h1 className="ctl-title">
                    {isContractor ? 'List Harvested Timber for Sale' : 'List Estate Timber for Sale'}
                  </h1>
                  <p className="ctl-subtitle">
                    {isContractor
                      ? 'Publish harvested logs or yard stocks to verified commercial buyers across Kerala.'
                      : 'List felled logs or standing estate timber for buyers to browse, negotiate, and purchase.'}
                  </p>
                </div>
              </div>
            </div>

            {/* SUCCESS BANNER */}
            {successMessage && (
              <div className="ctl-alert-success animate-fade-in">
                <CheckCircle2 size={20} />
                <span>{successMessage}</span>
              </div>
            )}

            {errors.form && (
              <div className="ctl-alert-error animate-fade-in">
                <AlertCircle size={20} />
                <span>{errors.form}</span>
              </div>
            )}

            {(incomingOp || incomingOpId) && (
              <div className="ctl-alert-success animate-fade-in mb-5">
                <CheckCircle2 size={18} />
                <span>
                  <strong>Harvest Operation Linked:</strong> Pre-filled {formData.volume} m³ ({formData.quantity} logs) of {formData.timberSpecies} from <strong>{formData.propertyName}</strong>. Review details and publish to the marketplace.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* LISTING SOURCE SELECTION */}
              <div className="ctl-card">
                <div className="ctl-card-header">
                  <div className="ctl-card-title-wrap">
                    <div className="ctl-card-icon">
                      <Tag size={18} />
                    </div>
                    <h2 className="ctl-card-title">Listing Inventory Source</h2>
                  </div>
                  <span className="ctl-card-badge">Source Selection</span>
                </div>

                <div className="ctl-source-grid">
                  <button
                    type="button"
                    onClick={() => handleSourceChange('direct_inventory')}
                    className={`ctl-source-card ${listingSource === 'direct_inventory' ? 'active' : ''}`}
                  >
                    <div>
                      <div className="ctl-source-top">
                        <span className="ctl-source-label">
                          <Trees size={18} /> Direct Timber Stock / Felled Wood
                        </span>
                        {listingSource === 'direct_inventory' ? (
                          <div className="ctl-source-indicator">
                            <CheckCircle2 size={16} />
                          </div>
                        ) : (
                          <div className="ctl-source-indicator-empty" />
                        )}
                      </div>
                      <p className="ctl-source-desc">
                        List timber logs, seasoned baulks, or standing trees directly from your property or yard.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSourceChange('harvest_operation')}
                    disabled={!hasHarvestOps}
                    className={`ctl-source-card ${listingSource === 'harvest_operation' ? 'active' : ''}`}
                  >
                    <div>
                      <div className="ctl-source-top">
                        <span className="ctl-source-label">
                          <CheckCircle2 size={18} /> Completed Harvesting Operation
                        </span>
                        {hasHarvestOps && listingSource === 'harvest_operation' ? (
                          <div className="ctl-source-indicator">
                            <CheckCircle2 size={16} />
                          </div>
                        ) : (
                          <div className="ctl-source-indicator-empty" />
                        )}
                      </div>
                      <p className="ctl-source-desc">
                        {hasHarvestOps
                          ? 'Auto-fill specs from verified completed contractor harvests in your profile.'
                          : 'No completed harvests recorded yet (use Direct Timber Stock above).'}
                      </p>
                    </div>
                  </button>
                </div>

                {/* If Harvest Operation Selected */}
                {listingSource === 'harvest_operation' && hasHarvestOps && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="ctl-group">
                      <label className="ctl-label">
                        Select Harvest Operation Record:
                      </label>
                      <select
                        value={selectedOperationId}
                        onChange={(e) => handleOperationChange(e.target.value)}
                        className="ctl-select font-semibold"
                      >
                        {allCompletedHarvests.map(h => (
                          <option key={h.id} value={h.id}>
                            {h.operationTitle || `${h.species || 'Teakwood'} Harvest`} — {h.species || 'Teakwood'} ({h.harvestedVolume || h.volume || 1.70} m³ available)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* TIMBER SPECIFICATIONS */}
              <div className="ctl-card">
                <div className="ctl-card-header">
                  <div className="ctl-card-title-wrap">
                    <div className="ctl-card-icon">
                      <Tag size={18} />
                    </div>
                    <h2 className="ctl-card-title">Timber Details & Specifications</h2>
                  </div>
                  <span className="ctl-card-badge">Lot Specifications</span>
                </div>

                <div className="ctl-form-grid ctl-form-grid-3">
                  <div className="ctl-group ctl-col-span-2">
                    <label className="ctl-label">Listing Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Grade A1 Matured Nilambur Teak Sawlogs"
                      className="ctl-input"
                    />
                  </div>

                  <div className="ctl-group">
                    <label className="ctl-label">Estate / Yard Name</label>
                    <input
                      type="text"
                      name="propertyName"
                      value={formData.propertyName}
                      onChange={handleInputChange}
                      placeholder="e.g. Wayanad Estate Stand #2"
                      className="ctl-input"
                    />
                  </div>

                  <div className="ctl-group">
                    <label className="ctl-label">
                      <span>Timber Species</span>
                      <span className="ctl-required">*</span>
                    </label>
                    <select
                      name="timberSpecies"
                      value={formData.timberSpecies}
                      onChange={handleInputChange}
                      className="ctl-select"
                    >
                      <option value="Teakwood">Teakwood (Tectona grandis)</option>
                      <option value="Rosewood">Rosewood (Dalbergia latifolia)</option>
                      <option value="Rubberwood">Rubberwood (Hevea brasiliensis)</option>
                      <option value="Mahogany">Mahogany (Swietenia macrophylla)</option>
                      <option value="Eucalyptus">Eucalyptus / Nilgiri</option>
                      <option value="Jackfruit">Jackfruit (Artocarpus heterophyllus)</option>
                      <option value="Acacia">Acacia (Mangium / Auriculiformis)</option>
                      <option value="Anjili">Anjili (Artocarpus hirsutus)</option>
                      <option value="Other Commercial Wood">Other Commercial Hardwood</option>
                    </select>
                    {errors.timberSpecies && <p className="ctl-error-text">{errors.timberSpecies}</p>}
                  </div>

                  <div className="ctl-group">
                    <label className="ctl-label">Timber Type</label>
                    <select
                      name="timberType"
                      value={formData.timberType}
                      onChange={handleInputChange}
                      className="ctl-select"
                    >
                      <option value="Sawlogs">Sawlogs (Standard Cut)</option>
                      <option value="Veneer Logs">Peeler / Veneer Logs</option>
                      <option value="Poles">Poles & Scaffolding Posts</option>
                      <option value="Pulpwood">Pulpwood / Chip Logs</option>
                      <option value="Firewood">Firewood & Biomass</option>
                      <option value="Sawn Baulks">Rough Sawn Baulks</option>
                    </select>
                  </div>

                  <div className="ctl-group">
                    <label className="ctl-label">Grade / Quality</label>
                    <select
                      name="gradeQuality"
                      value={formData.gradeQuality}
                      onChange={handleInputChange}
                      className="ctl-select"
                    >
                      <option value="Grade A Prime Export">Grade A Prime Export (Straight, defect-free)</option>
                      <option value="Grade B Sawlog">Grade B Sawlog (Standard commercial)</option>
                      <option value="Premium Veneer Grade">Premium Veneer Grade</option>
                      <option value="Industrial Furniture Grade">Industrial Furniture Grade</option>
                      <option value="Joinery Grade #1">Joinery Grade #1</option>
                      <option value="Construction Grade">Construction Grade</option>
                    </select>
                  </div>

                  <div className="ctl-group">
                    <label className="ctl-label">
                      <span>Volume (m³)</span>
                      <span className="ctl-required">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      name="volume"
                      value={formData.volume}
                      onChange={handleInputChange}
                      className="ctl-input ctl-input-mono ctl-input-highlight"
                    />
                    {errors.volume && <p className="ctl-error-text">{errors.volume}</p>}
                  </div>

                  <div className="ctl-group">
                    <label className="ctl-label">Quantity (logs / units)</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="ctl-input ctl-input-mono"
                    />
                  </div>

                  <div className="ctl-group">
                    <label className="ctl-label">Harvest / Felling Date</label>
                    <input
                      type="date"
                      name="harvestDate"
                      value={formData.harvestDate}
                      onChange={handleInputChange}
                      className="ctl-input"
                    />
                  </div>

                  <div className="ctl-group ctl-col-span-3">
                    <label className="ctl-label">Log Dimensions & Girth Specifications</label>
                    <input
                      type="text"
                      name="logDimensions"
                      value={formData.logDimensions}
                      onChange={handleInputChange}
                      placeholder="e.g. Avg girth: 60 - 80cm"
                      className="ctl-input"
                    />
                  </div>
                </div>
              </div>

              {/* PRICING & COMMERCIAL TERMS */}
              <div className="ctl-card">
                <div className="ctl-card-header">
                  <div className="ctl-card-title-wrap">
                    <div className="ctl-card-icon">
                      <DollarSign size={18} />
                    </div>
                    <h2 className="ctl-card-title">Pricing & Negotiation Terms</h2>
                  </div>
                  <span className="ctl-card-badge">Commercials</span>
                </div>

                <div className="ctl-form-grid ctl-form-grid-3">
                  <div className="ctl-group">
                    <label className="ctl-label">
                      <span>Price per m³ (₹ / m³)</span>
                      <span className="ctl-required">*</span>
                    </label>
                    <input
                      type="number"
                      name="pricePerM3"
                      value={formData.pricePerM3}
                      onChange={handleInputChange}
                      className="ctl-input ctl-input-mono ctl-input-highlight"
                    />
                  </div>

                  <div className="ctl-group">
                    <label className="ctl-label">
                      <span>Total Asking Price (₹)</span>
                      <span className="ctl-required">*</span>
                    </label>
                    <input
                      type="number"
                      name="askingPrice"
                      value={formData.askingPrice}
                      onChange={handleInputChange}
                      className="ctl-input ctl-input-mono ctl-input-highlight"
                    />
                    {errors.askingPrice && <p className="ctl-error-text">{errors.askingPrice}</p>}
                  </div>

                  <div className="ctl-group">
                    <label className="ctl-label">Price Open for Negotiation?</label>
                    <select
                      name="negotiable"
                      value={formData.negotiable}
                      onChange={handleInputChange}
                      className="ctl-select font-medium"
                    >
                      <option value="Yes">Yes — Allow Buyers to Submit Counter-Offers</option>
                      <option value="No">No — Fixed Price Only</option>
                    </select>
                  </div>
                </div>

                {/* Auto Calculated Valuation Ribbon */}
                <div className="ctl-valuation-ribbon">
                  <div className="ctl-val-item">
                    <span>Calculated Valuation:</span>
                    <strong className="highlight">₹ {Number(formData.askingPrice || 0).toLocaleString('en-IN')}</strong>
                    <span className="ctl-val-badge">₹{(formData.volume || 1)} m³ × ₹{(formData.pricePerM3 || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="ctl-val-item">
                    <span>Effective Unit Rate:</span>
                    <strong className="highlight">₹ {Number(formData.pricePerM3 || 0).toLocaleString('en-IN')} / m³</strong>
                  </div>
                </div>
              </div>

              {/* LOCATION & LOGISTICS */}
              <div className="ctl-card">
                <div className="ctl-card-header">
                  <div className="ctl-card-title-wrap">
                    <div className="ctl-card-icon">
                      <MapPin size={18} />
                    </div>
                    <h2 className="ctl-card-title">Location & Logistics Support</h2>
                  </div>
                  <span className="ctl-card-badge">Dispatch Point</span>
                </div>

                <div className="ctl-form-grid ctl-form-grid-3">
                  <div className="ctl-group">
                    <label className="ctl-label">
                      <span>District in Kerala</span>
                      <span className="ctl-required">*</span>
                    </label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="ctl-select"
                    >
                      <option value="Wayanad">Wayanad</option>
                      <option value="Palakkad">Palakkad</option>
                      <option value="Kottayam">Kottayam</option>
                      <option value="Idukki">Idukki</option>
                      <option value="Ernakulam">Ernakulam</option>
                      <option value="Thrissur">Thrissur</option>
                      <option value="Malappuram">Malappuram</option>
                      <option value="Kannur">Kannur</option>
                      <option value="Kozhikode">Kozhikode</option>
                      <option value="Pathanamthitta">Pathanamthitta</option>
                      <option value="Kollam">Kollam</option>
                      <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                      <option value="Alappuzha">Alappuzha</option>
                      <option value="Kasaragod">Kasaragod</option>
                    </select>
                    {errors.district && <p className="ctl-error-text">{errors.district}</p>}
                  </div>

                  <div className="ctl-group">
                    <label className="ctl-label">Storage Yard / Depot</label>
                    <input
                      type="text"
                      name="storageLocation"
                      value={formData.storageLocation}
                      onChange={handleInputChange}
                      placeholder="e.g. Central Yard, Pala"
                      className="ctl-input"
                    />
                  </div>

                  <div className="ctl-group">
                    <label className="ctl-label">Pickup & Loading Point</label>
                    <input
                      type="text"
                      name="pickupLocation"
                      value={formData.pickupLocation}
                      onChange={handleInputChange}
                      placeholder="e.g. State Highway 1 Gate Access"
                      className="ctl-input"
                    />
                  </div>

                  {/* Transport capability as a dedicated full-width card */}
                  <div className="ctl-col-span-3">
                    <div className={`ctl-transport-box ${formData.transportAvailable ? 'active' : ''}`}>
                      <label className="ctl-transport-checkbox-label">
                        <input
                          type="checkbox"
                          name="transportAvailable"
                          checked={formData.transportAvailable}
                          onChange={handleInputChange}
                          style={{ display: 'none' }}
                        />
                        <div className={`ctl-custom-checkbox ${formData.transportAvailable ? 'checked' : ''}`}>
                          {formData.transportAvailable && <Check size={14} strokeWidth={3} />}
                        </div>
                        <span className="ctl-transport-title">
                          <Truck size={18} /> Hauling / Delivery Transport Available by Seller
                        </span>
                      </label>

                      {formData.transportAvailable && (
                        <div className="ctl-transport-notes-wrap">
                          <label className="ctl-label mb-1.5">Transport & Haulage Notes</label>
                          <input
                            type="text"
                            name="transportNotes"
                            value={formData.transportNotes}
                            onChange={handleInputChange}
                            placeholder="e.g. Heavy log trailers available for transport up to 150km at subsidized freight"
                            className="ctl-input text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* DESCRIPTION, PHOTOS & STATUS */}
              <div className="ctl-card">
                <div className="ctl-card-header">
                  <div className="ctl-card-title-wrap">
                    <div className="ctl-card-icon">
                      <Sparkles size={18} />
                    </div>
                    <h2 className="ctl-card-title">Description, Photos & Status</h2>
                  </div>
                  <span className="ctl-card-badge">Media & Visibility</span>
                </div>

                <div className="ctl-group mb-5">
                  <label className="ctl-label">Timber Lot Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide details on wood density, bark removal, seasoning, sawmill or veneer suitability, and forest transit passes..."
                    className="ctl-textarea"
                  ></textarea>
                </div>

                {/* TIMBER YARD & LOG PHOTOS (MULTI-UPLOAD) */}
                <div className="ctl-multi-photo-box">
                  <div className="ctl-photo-top-bar">
                    <div className="ctl-photo-title-group">
                      <h4>
                        <Camera size={20} className="text-emerald-400" />
                        Timber Yard &amp; Log Photos
                        <span className="ctl-photo-badge-count">
                          {logPhotos.length} / 8 Photos
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Upload high-resolution photos of timber stacks, log ends, girth measurements, and storage landing bay for buyers.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleImportHarvestPhotos}
                        className="ctl-import-btn"
                        title="Import verified evidence photos from the completed harvest operation"
                      >
                        <Sparkles size={15} />
                        Import Harvest Stage Photos
                      </button>

                      <button
                        type="button"
                        onClick={() => multiFileInputRef.current?.click()}
                        className="ctl-btn-cancel text-xs py-1.5 px-3"
                      >
                        <Plus size={14} /> Add Photos
                      </button>
                    </div>
                  </div>

                  {/* Hidden multiple file input */}
                  <input
                    type="file"
                    ref={multiFileInputRef}
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFilesUpload(e.target.files)}
                  />

                  {/* Drag and drop zone */}
                  <div
                    className={`ctl-multi-dropzone ${isDraggingPhotos ? 'dragging' : ''}`}
                    onClick={() => multiFileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingPhotos(true); }}
                    onDragLeave={() => setIsDraggingPhotos(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPhotos(false);
                      handleFilesUpload(e.dataTransfer.files, 'Log Photo');
                    }}
                  >
                    <div className="ctl-dropzone-icon">
                      <Upload size={24} />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">
                      Click to browse or drag &amp; drop timber photos here
                    </p>
                    <p className="text-xs text-slate-400">
                      Upload multiple JPG, PNG, or WEBP photos (up to 10 MB each). Add multiple angles for higher buyer inquiries.
                    </p>
                  </div>

                  {/* Uploaded Gallery Grid */}
                  {logPhotos.length > 0 && (
                    <div className="ctl-gallery-grid">
                      {logPhotos.map((photo, index) => (
                        <div
                          key={photo.id}
                          className={`ctl-gallery-card ${index === 0 ? 'primary' : ''}`}
                        >
                          <img
                            src={photo.previewUrl}
                            alt={photo.name || 'Log Photo'}
                            className="ctl-gallery-thumb"
                          />
                          {index === 0 && (
                            <span className="ctl-primary-badge">
                              <Star size={10} fill="#03140c" /> Primary Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(photo.id);
                            }}
                            className="ctl-delete-photo-btn"
                            title="Remove photo"
                          >
                            <Trash2 size={13} />
                          </button>
                          <div className="ctl-gallery-info">
                            <span className="ctl-gallery-tag" title={photo.name}>{photo.name || 'Timber Photo'}</span>
                            <div className="ctl-gallery-meta">
                              <span>{photo.size}</span>
                              {index !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSetCoverPhoto(photo.id)}
                                  className="ctl-set-cover-btn"
                                >
                                  Make Cover
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Publishing Status & Marketplace Visibility */}
                <div className="ctl-card" style={{ marginTop: '1.5rem' }}>
                  <div className="ctl-status-box">
                    <div className="ctl-group">
                      <label className="ctl-label">Publishing Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="ctl-select font-semibold"
                      >
                        <option value="Published">Published (Active on Marketplace)</option>
                        <option value="Draft">Save as Draft (Private)</option>
                      </select>
                    </div>

                    <div className="ctl-status-notice">
                      <AlertCircle size={18} />
                      <div>
                        <strong className="block text-white font-semibold mb-1">Marketplace Visibility</strong>
                        When published, verified commercial timber mills, sawmills, and buyers across Kerala will immediately be able to view your lot, examine your log photos, submit negotiation proposals, or confirm purchase.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="ctl-actions">
                <button
                  type="button"
                  onClick={() => navigate(returnPath)}
                  className="ctl-btn-cancel"
                  disabled={isSubmitting}
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  type="submit"
                  className="ctl-btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-emerald-900 border-t-emerald-400 rounded-full animate-spin" />
                      Publishing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShoppingBag size={18} /> Publish Timber Listing
                    </span>
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

export default CreateTimberListing;
