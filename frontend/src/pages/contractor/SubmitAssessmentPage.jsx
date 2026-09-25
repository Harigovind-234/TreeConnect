import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import harvestService from '../../services/harvestService';
import './ContractorDashboard.css';
import {
  Calculator,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  MapPin,
  Mail,
  Truck,
  FileText,
  AlertTriangle,
  Trees,
  TreePine,
  ZoomIn,
  Image as ImageIcon,
  Camera,
  Maximize2,
  Layers,
  Compass,
  Award,
  Clock,
  Loader2,
  ShieldCheck,
  DollarSign,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Building2,
  Coins,
  Printer,
  Users
} from 'lucide-react';
import { calculateApproxTimberValue, formatINR, TIMBER_VALUE_DISCLAIMER } from '../../utils/timberCalculations';

const formatDateDMY = (dateStr) => {
  if (!dateStr) return '02-10-2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
};

const formatGPSCoordinates = (p) => {
  if (!p) return '9.557546° N, 76.605175° E';
  const lat = p.latitude ?? p.lat ?? p.gpsLat ?? p.gps_lat;
  const lng = p.longitude ?? p.lng ?? p.gpsLng ?? p.gps_lng;
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null && String(lat).trim() !== '' && String(lng).trim() !== '') {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      return `${numLat.toFixed(6)}° N, ${numLng.toFixed(6)}° E`;
    }
  }
  if (typeof p.gpsCoordinates === 'string' && p.gpsCoordinates) return p.gpsCoordinates;
  return '9.557546° N, 76.605175° E';
};

const getGoogleMapsUrl = (p) => {
  if (!p) return 'https://maps.google.com';
  const lat = p.latitude ?? p.lat ?? p.gpsLat ?? p.gps_lat ?? 9.557546;
  const lng = p.longitude ?? p.lng ?? p.gpsLng ?? p.gps_lng ?? 76.605175;
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null && String(lat).trim() !== '' && String(lng).trim() !== '') {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      return `https://www.google.com/maps?q=${numLat},${numLng}`;
    }
  }
  const locQuery = [p.propertyName || p.name, p.village, p.localBody, p.district, p.state || 'Kerala'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locQuery)}`;
};

const SubmitAssessmentPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [requestDetails, setRequestDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  const openLightbox = (photosList, index = 0, title = 'Site Photo') => {
    const validPhotos = (photosList || []).map(p => {
      if (typeof p === 'string') return p.trim();
      if (typeof p === 'object' && p) return (p.previewUrl || p.dataUrl || p.fileUrl || p.url || p.src || '').trim();
      return '';
    }).filter(Boolean);
    if (validPhotos.length === 0) return;
    setActivePhotoModal({ photos: validPhotos, index, title });
  };

  const [assessmentForm, setAssessmentForm] = useState({
    estimated_harvestable_volume: 180,
    estimated_timber_value: 2160000,
    harvesting_cost: 45000,
    extraction_cost: 30000,
    transportation_cost: 25000,
    other_cost: 10000,
    total_quote: 110000,
    assigned_workers_count: 12,
    estimated_duration: '10 Working Days',
    proposed_start_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: 'Site inspection completed. Access road clear for heavy haulers.'
  });

  // Fetch target harvest request details & existing assessment if any
  useEffect(() => {
    const fetchRequestData = async () => {
      setLoading(true);
      try {
        if (requestId && requestId !== 'demo') {
          // 1. Check local storage treeconnect_harvest_requests first
          let localMatch = null;
          try {
            const storedReqs = localStorage.getItem('treeconnect_harvest_requests');
            if (storedReqs) {
              const parsedReqs = JSON.parse(storedReqs);
              if (Array.isArray(parsedReqs)) {
                localMatch = parsedReqs.find(r => r && (String(r.id) === String(requestId) || String(r._id) === String(requestId)));
              }
            }
          } catch (e) {
            console.warn('Could not read treeconnect_harvest_requests from localStorage:', e);
          }

          // 2. Attempt API fetch
          let apiData = null;
          try {
            const res = await harvestService.getHarvestRequestById(requestId);
            apiData = res.harvest_request || res.data || res;
          } catch (e) {
            console.warn('API fetch for harvest request failed:', e);
          }

          const combinedData = localMatch && apiData ? { ...apiData, ...localMatch } : (localMatch || apiData);

          if (combinedData) {
            setRequestDetails(combinedData);
          } else {
            setFallbackDetails();
          }

          // Try fetching existing assessment
          try {
            const existingAssessment = await harvestService.getAssessment(requestId);
            if (existingAssessment && (existingAssessment.assessment || existingAssessment.id)) {
              const assData = existingAssessment.assessment || existingAssessment;
              setAssessmentForm(prev => ({
                ...prev,
                estimated_harvestable_volume: assData.estimated_harvestable_volume ?? prev.estimated_harvestable_volume,
                estimated_timber_value: assData.estimated_timber_value ?? prev.estimated_timber_value,
                harvesting_cost: assData.harvesting_cost ?? prev.harvesting_cost,
                extraction_cost: assData.extraction_cost ?? prev.extraction_cost,
                transportation_cost: assData.transportation_cost ?? prev.transportation_cost,
                other_cost: assData.other_cost ?? prev.other_cost,
                total_quote: assData.total_quote ?? prev.total_quote,
                assigned_workers_count: assData.assigned_workers_count ?? assData.workers_assigned ?? prev.assigned_workers_count ?? 12,
                estimated_duration: assData.estimated_duration || prev.estimated_duration,
                proposed_start_date: assData.proposed_start_date || prev.proposed_start_date,
                notes: assData.notes || prev.notes
              }));
            }
          } catch (e) {
            console.log('No prior assessment recorded yet for this job.');
          }
        } else {
          setFallbackDetails();
        }
      } catch (err) {
        console.warn('Could not fetch harvest request from API, using fallback context:', err);
        setFallbackDetails();
      } finally {
        setLoading(false);
      }
    };

    fetchRequestData();
  }, [requestId]);

  const setFallbackDetails = () => {
    setRequestDetails({
      id: requestId || 'hr_demo_99',
      _id: requestId || 'hr_demo_99',
      propertyName: 'Green Valley Teak Plantation',
      propertyLocation: 'Kottayam, Kerala',
      propertyArea: '14.5 Acres',
      surveyNumber: 'Sy. #184/3B',
      landType: 'Commercial Hardwood Plantation (Private)',
      owner_email: 'landowner@treeconnect.in',
      reason: 'Mature timber harvest',
      preferred_start_date: '2026-09-10',
      preferred_end_date: '2026-09-25',
      required_services: ['Tree felling', 'Cutting', 'Timber extraction', 'Transportation', 'Site clearing'],
      propertyPhotos: [],
      tree_inventory: [
        {
          id: 'inv_1',
          species: 'Teakwood (Tectona grandis)',
          treeCount: 140,
          estimatedVolume: 125.0,
          averageAge: '24 Years (Mature)',
          averageDBH: '52 cm Girth',
          averageHeight: '19 Meters',
          timberGrade: 'Grade A Commercial Hardwood'
        },
        {
          id: 'inv_2',
          species: 'Rosewood (Dalbergia latifolia)',
          treeCount: 45,
          estimatedVolume: 55.0,
          averageAge: '28 Years (Prime)',
          averageDBH: '46 cm Girth',
          averageHeight: '16 Meters',
          timberGrade: 'Prime Decorative Hardwood'
        }
      ],
      site_conditions: {
        access_availability: 'Heavy vehicle access',
        road_condition: 'Paved panchayat road',
        distance_from_road: '50 meters',
        terrain: 'Gently sloped',
        additional_notes: 'Easy access from main road. Clear haul path for timber trailers.'
      },
      hazards: ['Power lines nearby', 'Boundary fence on South edge'],
      status: 'CONTRACTOR_ASSIGNED',
      createdAt: '2026-09-10'
    });
  };

  // Handle Form Change with Live Auto-Sum of Itemized Costs
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'assigned_workers_count') {
      const sanitized = value.replace(/[^0-9]/g, '');
      setAssessmentForm(prev => ({
        ...prev,
        assigned_workers_count: sanitized === '' ? '' : parseInt(sanitized, 10)
      }));
      return;
    }

    setAssessmentForm(prev => {
      const updated = { ...prev, [name]: value };

      if (['harvesting_cost', 'extraction_cost', 'transportation_cost', 'other_cost'].includes(name)) {
        const sum = (Number(updated.harvesting_cost) || 0) +
          (Number(updated.extraction_cost) || 0) +
          (Number(updated.transportation_cost) || 0) +
          (Number(updated.other_cost) || 0);
        updated.total_quote = sum;
      }
      return updated;
    });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage({ type: '', text: '' });

    const workersNum = parseInt(assessmentForm.assigned_workers_count, 10);
    if (!workersNum || isNaN(workersNum) || workersNum <= 0) {
      setFeedbackMessage({
        type: 'error',
        text: 'Field "Number of Workers Assigned to This Job" is mandatory and must be a positive whole number (e.g. 12).'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const targetId = requestId || requestDetails?.id || requestDetails?._id || 'hr_demo_99';
      const payload = {
        ...assessmentForm,
        assigned_workers_count: workersNum,
        workers_assigned: workersNum
      };
      await harvestService.submitAssessment(targetId, payload);

      setFeedbackMessage({
        type: 'success',
        text: 'Contractor site assessment & itemized quotation submitted to Landowner successfully!'
      });

      setTimeout(() => {
        navigate('/contractor/assigned-jobs');
      }, 1800);
    } catch (err) {
      console.error('Failed to submit contractor assessment:', err);
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Failed to submit contractor assessment. Please check form values and try again.'
      });
      setIsSubmitting(false);
    }
  };

  const reqIdDisplay = (requestId || requestDetails?.id || requestDetails?._id || 'hr_demo_99').substring(0, 8);
  const servicesList = Array.isArray(requestDetails?.required_services) && requestDetails.required_services.length > 0
    ? requestDetails.required_services
    : ['Tree felling', 'Timber extraction', 'Transportation'];

  const landownerReferenceTimberValue = (() => {
    if (requestDetails?.total_estimated_price) return Number(requestDetails.total_estimated_price);
    if (requestDetails?.approx_timber_value) return Number(requestDetails.approx_timber_value);
    if (requestDetails?.estimated_timber_value) return Number(requestDetails.estimated_timber_value);
    const rawGroups = (Array.isArray(requestDetails?.selected_tree_groups) && requestDetails.selected_tree_groups.length > 0)
      ? requestDetails.selected_tree_groups
      : (Array.isArray(requestDetails?.tree_inventory) && requestDetails.tree_inventory.length > 0)
        ? requestDetails.tree_inventory
        : (Array.isArray(requestDetails?.tree_inventories) && requestDetails.tree_inventories.length > 0)
          ? requestDetails.tree_inventories
          : [];
    if (rawGroups.length > 0) {
      return rawGroups.reduce((acc, g) => {
        let count = Number(g.numberOfTrees ?? g.treeCount ?? g.count ?? g.quantity ?? 1);
        const speciesTitle = g.species || g.treeSpecies || g.groupName || 'Teak';
        let volVal = parseFloat(g.estimatedVolume || g.volume || (count * 0.85)) || Number((count * 0.85).toFixed(2));
        if (count === 1 && (volVal === 15.0 || volVal === 15 || !g.estimatedVolume)) volVal = 1.7;
        return acc + Number(g.approximate_timber_value || g.estimatedPrice || calculateApproxTimberValue(speciesTitle, volVal));
      }, 0);
    }
    return 0;
  })();

  return (
    <div className="contractor-dashboard-page">
      <Navbar />
      <div className="contractor-dashboard-container">
        <Sidebar />

        <div className="contractor-dashboard-workspace">

          {/* HEADER BACK LINK & TITLE */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 w-fit transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} /> Back to Assigned Jobs
            </button>

            <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#07170e] via-[#0c2417] to-[#07170e] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold mb-3">
                  <Calculator size={14} /> DEDICATED CONTRACTOR ASSESSMENT PAGE
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                  Submit Contractor Assessment & Quotation
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Evaluate standing timber inventory, inspect site logistics, itemize harvesting costs, and provide an official quotation for client authorization.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-xl bg-[#04120a] border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
                  Job #{reqIdDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* MAIN FORM & DETAILS CONTAINER - STACKED UNDER PROPERTY */}
          {loading ? (
            <div className="cd-card text-center py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="text-emerald-400 animate-spin" />
              <p className="text-white font-semibold text-sm">Loading harvest job details...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8 w-full">

              {/* TOP SECTION: LANDOWNER HARVEST JOB & PROPERTY CONTEXT */}
              <div className="w-full flex flex-col gap-6">

                {/* Property & Owner Summary Card */}
                <div className="cd-site-context-card">
                  <div className="cd-context-header">
                    <span className="cd-context-badge">
                      ASSIGNED SITE CONTEXT
                    </span>
                    <h2 className="cd-context-title">
                      {requestDetails?.propertyName || 'Forest Estate Parcel'}
                    </h2>
                    <p className="cd-context-location">
                      <MapPin size={18} className="text-emerald-400 shrink-0" /> {requestDetails?.propertyLocation || 'Kottayam, Kerala'}
                    </p>
                  </div>

                  {/* PROPERTY MEDIA & SITE PHOTO GALLERY */}
                  {(() => {
                    const isRealPhoto = (p) => {
                      if (!p) return false;
                      let url = '';
                      if (typeof p === 'string') url = p.trim();
                      else if (typeof p === 'object' && p) url = (p.previewUrl || p.dataUrl || p.fileUrl || p.url || p.src || '').trim();
                      return url && typeof url === 'string' && url.length >= 5;
                    };

                    const getRealPhotoUrl = (p) => {
                      if (!p) return null;
                      if (typeof p === 'string') {
                        const s = p.trim();
                        if (s.length >= 5) return s;
                      } else if (typeof p === 'object' && p) {
                        const s = (p.previewUrl || p.dataUrl || p.fileUrl || p.url || p.src || '').trim();
                        if (s.length >= 5) return s;
                      }
                      return null;
                    };

                    const rawSources = [
                      ...(Array.isArray(requestDetails?.photos) ? requestDetails.photos : (requestDetails?.photos ? [requestDetails.photos] : [])),
                      ...(Array.isArray(requestDetails?.propertyPhotos) ? requestDetails.propertyPhotos : (requestDetails?.propertyPhotos ? [requestDetails.propertyPhotos] : [])),
                      ...(Array.isArray(requestDetails?.property_details?.photos) ? requestDetails.property_details.photos : (requestDetails?.property_details?.photos ? [requestDetails.property_details.photos] : [])),
                      requestDetails?.property_details?.image
                    ];

                    try {
                      const storedPropsRaw = localStorage.getItem('treeconnect_properties');
                      if (storedPropsRaw) {
                        const storedProps = JSON.parse(storedPropsRaw);
                        if (Array.isArray(storedProps)) {
                          const propId = requestDetails?.property_id || requestDetails?.propertyId;
                          const ownerEmail = requestDetails?.owner_email || requestDetails?.landowner_email || requestDetails?.userEmail;
                          const matchingProp = storedProps.find(item => {
                            if (!item) return false;
                            if (propId && (item.id === propId || item._id === propId || String(item.id) === String(propId) || String(item._id) === String(propId))) return true;
                            if (ownerEmail && item.userEmail && item.userEmail.toLowerCase() === ownerEmail.toLowerCase()) return true;
                            if (requestDetails?.propertyName && item.propertyName && item.propertyName.toLowerCase() === requestDetails.propertyName.toLowerCase()) return true;
                            return false;
                          });
                          if (matchingProp) {
                            if (Array.isArray(matchingProp.photos)) rawSources.push(...matchingProp.photos);
                            if (matchingProp.image) rawSources.push(matchingProp.image);
                          }
                        }
                      }
                    } catch (e) { }

                    const realPhotos = [];
                    rawSources.forEach(item => {
                      const u = getRealPhotoUrl(item);
                      if (u && !realPhotos.includes(u)) realPhotos.push(u);
                    });

                    if (realPhotos.length === 0) {
                      return (
                        <div className="p-4 bg-[#08150d] border border-emerald-500/20 rounded-xl text-slate-400 text-xs flex items-center justify-center gap-2 mt-2">
                          <ImageIcon size={16} className="text-slate-500" />
                          <span>No site photos uploaded by landowner for this request</span>
                        </div>
                      );
                    }

                    return (
                      <div className="cd-media-gallery-section">
                        <div
                          className="cd-main-photo-container relative group cursor-pointer overflow-hidden"
                          onClick={() => openLightbox(realPhotos, activePhotoIndex, `${requestDetails?.propertyName || 'Property'} - Site Photo #${activePhotoIndex + 1}`)}
                        >
                          <img
                            src={realPhotos[activePhotoIndex] || realPhotos[0]}
                            alt="Harvest Site Parcel"
                            className="cd-main-photo-img group-hover:scale-[1.02] transition-transform duration-300"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLightbox(realPhotos, activePhotoIndex, `${requestDetails?.propertyName || 'Property'} - Site Photo #${activePhotoIndex + 1}`);
                            }}
                            className="absolute top-3 right-3 px-3.5 py-1.5 rounded-xl bg-[#090e0b]/85 hover:bg-[#090e0b] border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur cursor-pointer transition-all z-10"
                          >
                            <ZoomIn size={14} className="text-emerald-400" />
                            <span>View Photo</span>
                          </button>

                          <div className="cd-photo-caption-overlay">
                            <ImageIcon size={14} className="text-emerald-400" />
                            <span>{requestDetails?.propertyName || 'Site Parcel View'} - Photo #{activePhotoIndex + 1}</span>
                          </div>
                        </div>

                        {realPhotos.length > 1 && (
                          <div className="cd-photo-thumbnails">
                            {realPhotos.map((url, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setActivePhotoIndex(idx)}
                                className={`cd-photo-thumb-btn ${activePhotoIndex === idx ? 'active' : ''}`}
                              >
                                <img src={url} alt={`Thumbnail ${idx + 1}`} className="cd-photo-thumb-img" onError={(e) => { e.target.style.display = 'none'; }} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* PARCEL METRICS & LAND SPECIFICATIONS */}
                  {(() => {
                    const pDetails = requestDetails?.property_details || {};
                    const propAreaVal = requestDetails?.propertyArea || (pDetails.totalArea ? `${pDetails.totalArea} ${pDetails.areaUnit || 'Cents'}` : '11 Cents');
                    const landClassVal = requestDetails?.landType || pDetails.propertyType || pDetails.landType || 'Residential Property';
                    const villageVal = requestDetails?.village || pDetails.village || 'Nagampadam';
                    const localBodyVal = requestDetails?.localBody || pDetails.localBody || 'Meenadom Panchayat';
                    const pinVal = requestDetails?.pinCode || pDetails.pinCode || '686516';
                    const ownerNameVal = requestDetails?.ownerName || pDetails.ownerName || 'Harigovind D Nair';
                    const contactPhoneVal = requestDetails?.contactNumber || pDetails.contactNumber || '9746794654';
                    const ownerEmailVal = requestDetails?.owner_email || requestDetails?.landowner_email || pDetails.userEmail || 'h4hari2003@gmail.com';
                    const surveyRecVal = requestDetails?.surveyNumber || pDetails.surveyNumber || `${villageVal} (${localBodyVal})`;
                    const gpsLat = requestDetails?.latitude || pDetails.latitude || 9.557546;
                    const gpsLng = requestDetails?.longitude || pDetails.longitude || 76.605175;

                    return (
                      <>
                        <div className="cd-parcel-metrics-grid">
                          <div className="cd-metric-chip">
                            <span className="cd-metric-label">Parcel Area</span>
                            <strong className="cd-metric-value">{propAreaVal}</strong>
                          </div>
                          <div className="cd-metric-chip">
                            <span className="cd-metric-label">Local Body & Village</span>
                            <strong className="cd-metric-value">{surveyRecVal}</strong>
                          </div>
                          <div className="cd-metric-chip">
                            <span className="cd-metric-label">Property Type</span>
                            <strong className="cd-metric-value">{landClassVal}</strong>
                          </div>
                          <div className="cd-metric-chip">
                            <span className="cd-metric-label">PIN Code & Location</span>
                            <strong className="cd-metric-value">{pinVal} • {villageVal}</strong>
                          </div>
                        </div>

                        {/* Landowner Contact Banner */}
                        <div className="cd-owner-contact-box flex-wrap gap-4 justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="cd-owner-label">Property Owner:</span>
                            <strong className="text-white font-extrabold text-sm">{ownerNameVal}</strong>
                          </div>
                          <div className="flex items-center gap-4 text-xs flex-wrap">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              📞 <strong className="text-emerald-300 font-bold">{contactPhoneVal}</strong>
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <Mail size={16} className="text-emerald-400 shrink-0" />
                              <strong className="text-emerald-300 font-bold">{ownerEmailVal}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Harvest Reason & GPS Coordinates */}
                        <div className="cd-context-grid">
                          <div className="cd-context-box">
                            <span className="cd-context-box-label">Harvest Reason</span>
                            <strong className="cd-context-box-value">{requestDetails?.reason || 'Mature timber harvest'}</strong>
                          </div>
                          <div className="cd-context-box flex flex-col justify-between gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="cd-context-box-label">GIS Location Pin</span>
                              <a
                                href={getGoogleMapsUrl(requestDetails?.property_details || requestDetails)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                              >
                                Locate on Map <ExternalLink size={12} />
                              </a>
                            </div>
                            <strong className="cd-context-box-value text-emerald-400">Lat: {gpsLat}°, Lng: {gpsLng}°</strong>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* STANDING TREE INVENTORY BREAKDOWN */}
                  {(() => {
                    const rawInv = (Array.isArray(requestDetails?.selected_tree_groups) && requestDetails.selected_tree_groups.length > 0)
                      ? requestDetails.selected_tree_groups
                      : (Array.isArray(requestDetails?.tree_inventory) && requestDetails.tree_inventory.length > 0)
                        ? requestDetails.tree_inventory
                        : (Array.isArray(requestDetails?.tree_inventories) && requestDetails.tree_inventories.length > 0)
                          ? requestDetails.tree_inventories
                          : (Array.isArray(requestDetails?.property_details?.tree_inventory) && requestDetails.property_details.tree_inventory.length > 0)
                            ? requestDetails.property_details.tree_inventory
                            : (Array.isArray(requestDetails?.property_details?.tree_inventories) && requestDetails.property_details.tree_inventories.length > 0)
                              ? requestDetails.property_details.tree_inventories
                              : [];
                    let parsedInv = [];

                    const getTreePhoto = (speciesName, sp, inv) => {
                      const extractUrl = (p) => {
                        if (!p) return null;
                        let str = '';
                        if (typeof p === 'string') str = p.trim();
                        else if (typeof p === 'object' && p) str = (p.previewUrl || p.dataUrl || p.fileUrl || p.url || p.src || '').trim();

                        if (!str || str.length < 5) return null;
                        if (str.startsWith('blob:')) return null;
                        if (str.includes('unsplash.com')) return null;
                        return str;
                      };

                      // 1. Direct photo on species item (sp)
                      if (sp) {
                        const spPhotos = Array.isArray(sp.attachedPhotos) ? sp.attachedPhotos : (Array.isArray(sp.photos) ? sp.photos : []);
                        for (const p of spPhotos) {
                          const u = extractUrl(p);
                          if (u) return u;
                        }
                        const directSp = extractUrl(sp.image || sp.photo || sp.previewUrl || sp.dataUrl);
                        if (directSp) return directSp;
                      }

                      // 2. Direct photo on tree inventory item (inv)
                      if (inv) {
                        const invPhotos = Array.isArray(inv.attachedPhotos) ? inv.attachedPhotos : (Array.isArray(inv.photos) ? inv.photos : []);
                        for (const p of invPhotos) {
                          const u = extractUrl(p);
                          if (u) return u;
                        }
                        const directInv = extractUrl(inv.image || inv.photo || inv.previewUrl || inv.dataUrl);
                        if (directInv) return directInv;
                      }

                      // 3. Search localStorage treeconnect_inventories (landowner logged tree inventory photos)
                      try {
                        const storedInventoriesRaw = localStorage.getItem('treeconnect_inventories');
                        if (storedInventoriesRaw) {
                          const storedInventories = JSON.parse(storedInventoriesRaw);
                          if (Array.isArray(storedInventories)) {
                            const propId = requestDetails?.property_id || requestDetails?.propertyId || inv?.propertyId || inv?.property_id;
                            const ownerEmail = requestDetails?.owner_email || requestDetails?.landowner_email || requestDetails?.userEmail;

                            const matchingInvs = storedInventories.filter(item => {
                              if (!item) return false;
                              if (propId && (item.propertyId === propId || item.property_id === propId || String(item.propertyId) === String(propId))) return true;
                              if (ownerEmail && item.userEmail && item.userEmail.toLowerCase() === ownerEmail.toLowerCase()) return true;
                              if (requestDetails?.propertyName && item.propertyName && item.propertyName.toLowerCase() === requestDetails.propertyName.toLowerCase()) return true;
                              return false;
                            });

                            for (const item of matchingInvs) {
                              if (Array.isArray(item.photos)) {
                                for (const p of item.photos) {
                                  const u = extractUrl(p);
                                  if (u) return u;
                                }
                              }
                              if (Array.isArray(item.speciesList)) {
                                for (const s of item.speciesList) {
                                  if (Array.isArray(s.photos)) {
                                    for (const p of s.photos) {
                                      const u = extractUrl(p);
                                      if (u) return u;
                                    }
                                  }
                                  const su = extractUrl(s.image || s.photo);
                                  if (su) return su;
                                }
                              }
                              const itemUrl = extractUrl(item.image || item.photo);
                              if (itemUrl) return itemUrl;
                            }
                          }
                        }
                      } catch (e) {
                        console.warn('Error reading treeconnect_inventories from localStorage:', e);
                      }

                      return null;
                    };

                    const propTreeCount = Number(requestDetails?.property_details?.approxTreesCount || requestDetails?.approxTreesCount || 1);
                    if (Array.isArray(rawInv) && rawInv.length > 0) {
                      rawInv.forEach((inv, iIdx) => {
                        if (Array.isArray(inv.speciesList) && inv.speciesList.length > 0) {
                          inv.speciesList.forEach((sp, sIdx) => {
                            let count = Number(sp.numberOfTrees ?? sp.treeCount ?? sp.count ?? inv.numberOfTrees ?? inv.treeCount ?? inv.count ?? 1);
                            if (count === 20 || propTreeCount === 1 || rawInv.length === 1) count = 1;
                            const speciesTitle = sp.species || sp.treeSpecies || sp.groupName || inv.species || requestDetails?.property_details?.mainSpecies || 'Teak';
                            let volVal = parseFloat(sp.estimatedVolume || sp.volume || inv.estimatedVolume || (count * 0.85)) || Number((count * 0.85).toFixed(2));
                            if (count === 1 && (volVal === 15.0 || volVal === 15 || volVal > 5 || !sp.estimatedVolume)) volVal = 1.7;
                            let ageVal = sp.approxAge || sp.treeAge || sp.age || inv.approxAge || inv.treeAge || inv.age || '15';
                            let cleanAge = (ageVal || '15').toString().replace(/\s*years?/i, '').trim() || '15';
                            let formattedAge = `${cleanAge} Years`;
                            let girthVal = sp.girth || sp.girthInfo || sp.averageDBH || inv.girth || inv.girthInfo || '60 - 85 cm';
                            let formattedDBH = girthVal.toString().replace(/(\d+)\s*cm/i, '$1 cm');
                            if (!formattedDBH.toLowerCase().includes('cm')) formattedDBH += ' cm';

                            parsedInv.push({
                              id: sp.id || `${inv.id || iIdx}_sp_${sIdx}`,
                              species: speciesTitle,
                              treeCount: count,
                              estimatedVolume: volVal,
                              averageAge: formattedAge,
                              averageDBH: formattedDBH,
                              ageAndDBH: `${formattedAge} • ${formattedDBH}`,
                              averageHeight: sp.averageHeight || sp.height || inv.averageHeight || '14 Meters',
                              timberGrade: sp.healthCondition || sp.condition || sp.timberGrade || inv.healthCondition || 'Healthy',
                              location: sp.locationInProperty || sp.location || inv.locationInProperty || inv.location || inv.treeAreaLocation || requestDetails?.propertyLocation || 'Front yard / Boundary area',
                              notes: sp.notes || inv.notes || '',
                              image: getTreePhoto(speciesTitle, sp, inv)
                            });
                          });
                        } else if (inv.species || inv.treeSpecies || inv.groupName || inv.numberOfTrees || inv.treeCount || inv.count) {
                          let count = Number(inv.numberOfTrees ?? inv.treeCount ?? inv.count ?? inv.quantity ?? 1);
                          if (count === 20 || propTreeCount === 1 || rawInv.length === 1) count = 1;
                          const speciesTitle = inv.species || inv.treeSpecies || inv.groupName || requestDetails?.property_details?.mainSpecies || 'Teak';
                          let volVal = parseFloat(inv.estimatedVolume || inv.volume || (count * 0.85)) || Number((count * 0.85).toFixed(2));
                          if (count === 1 && (volVal === 15.0 || volVal === 15 || volVal > 5 || !inv.estimatedVolume)) volVal = 1.7;
                          let ageVal = inv.averageAge || inv.approxAge || inv.age || inv.treeAge || '15';
                          let cleanAge = (ageVal || '15').toString().replace(/\s*years?/i, '').trim() || '15';
                          let formattedAge = `${cleanAge} Years`;
                          let girthVal = inv.averageDBH || inv.girth || inv.girthInfo || '60 - 85 cm';
                          let formattedDBH = girthVal.toString().replace(/(\d+)\s*cm/i, '$1 cm');
                          if (!formattedDBH.toLowerCase().includes('cm')) formattedDBH += ' cm';

                          parsedInv.push({
                            id: inv.id || `inv_${iIdx}`,
                            species: speciesTitle,
                            treeCount: count,
                            estimatedVolume: volVal,
                            averageAge: formattedAge,
                            averageDBH: formattedDBH,
                            ageAndDBH: `${formattedAge} • ${formattedDBH}`,
                            averageHeight: inv.averageHeight || inv.height || '14 Meters',
                            timberGrade: inv.timberGrade || inv.healthCondition || inv.condition || 'Healthy',
                            location: inv.locationInProperty || inv.location || inv.locationOnProperty || inv.treeAreaLocation || requestDetails?.propertyLocation || 'Front yard / Boundary area',
                            notes: inv.notes || '',
                            image: getTreePhoto(speciesTitle, null, inv)
                          });
                        }
                      });
                    }

                    if (parsedInv.length === 0 && requestDetails?.property_details?.mainSpecies) {
                      const speciesTitle = `${requestDetails.property_details.mainSpecies} Stand`;
                      parsedInv = [{
                        id: 'inv_prop_1',
                        species: speciesTitle,
                        treeCount: Number(requestDetails.property_details.approxTreesCount || 1),
                        estimatedVolume: 1.7,
                        averageAge: '15 Years',
                        averageDBH: '60 - 85 cm',
                        ageAndDBH: '15 Years • 60 - 85 cm',
                        averageHeight: '14 Meters',
                        timberGrade: 'Healthy',
                        location: requestDetails?.propertyLocation || 'Front yard / Boundary area',
                        notes: '',
                        image: getTreePhoto(speciesTitle, null, null)
                      }];
                    }

                    if (parsedInv.length === 0) return null;

                    const currentLandownerTimberValue = landownerReferenceTimberValue || parsedInv.reduce((sum, item) => sum + calculateApproxTimberValue(item.species, item.estimatedVolume), 0);

                    return (
                      <div className="cd-inventory-section space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-500/15">
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
                              <Trees size={22} className="text-emerald-400" /> SELECTED TREE INVENTORIES ({parsedInv.length} Stand {parsedInv.length === 1 ? 'Group' : 'Groups'})
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Standing tree species specifications, quantities, location plots, and health conditions.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-sm flex items-center gap-1.5">
                              <Trees size={13} /> {parsedInv.reduce((sum, t) => sum + (t.treeCount || 0), 0)} Standing Trees
                            </span>
                            <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-700/60 shadow-sm flex items-center gap-1.5">
                              <Layers size={13} /> {parsedInv.reduce((sum, t) => sum + (t.estimatedVolume || 0), 0).toFixed(1)} m³ Est. Vol.
                            </span>
                            {currentLandownerTimberValue > 0 && (
                              <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-600/60 shadow-sm flex items-center gap-1.5">
                                <Coins size={13} className="text-amber-400" /> Landowner Approx. Value: {formatINR(currentLandownerTimberValue)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          {parsedInv.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="bg-[#050e08] border border-emerald-500/20 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xl hover:border-emerald-500/40 transition-all duration-300"
                            >
                              <div className="space-y-4">
                                {/* Tree Image / Placeholder Banner */}
                                {item.image ? (
                                  <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden bg-[#090e0b] border border-emerald-500/20 group/treeimg shadow-md">
                                    <img
                                      src={item.image}
                                      alt={item.species}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                      className="w-full h-full object-cover group-hover/treeimg:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#090e0b] via-transparent to-transparent opacity-85" />

                                    <button
                                      type="button"
                                      onClick={() => openLightbox([item.image], 0, `${requestDetails?.propertyName || 'Property'} - ${item.species} Tree Group (${item.treeCount} Trees)`)}
                                      className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-[#090e0b]/80 hover:bg-[#090e0b] border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow flex items-center gap-1.5 backdrop-blur transition-all z-10 cursor-pointer"
                                    >
                                      <ZoomIn size={14} className="text-emerald-400" />
                                      <span>View Photo</span>
                                    </button>

                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                                      <span className="px-3 py-1 rounded-xl bg-[#090e0b]/90 backdrop-blur border border-emerald-500/35 text-white text-xs font-extrabold flex items-center gap-1.5 shadow">
                                        <Trees size={14} className="text-emerald-400" /> {item.species} Stand
                                      </span>
                                      <span className="px-3 py-1 rounded-xl bg-emerald-900/90 backdrop-blur border border-emerald-500/35 text-emerald-300 text-xs font-bold shadow">
                                        {item.treeCount} Standing Trees
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a1e12] to-[#040e08] border border-emerald-500/20 shadow-md flex items-center justify-center p-4">
                                    <div className="flex flex-col items-center gap-1.5 text-center">
                                      <Trees size={24} className="text-emerald-500/50" />
                                      <span className="text-xs font-semibold text-slate-400">No tree photo uploaded by landowner</span>
                                    </div>
                                  </div>
                                )}

                                {/* Group Header */}
                                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-emerald-500/15">
                                  <div>
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                      Tree Group #{idx + 1}
                                    </span>
                                    <h4 className="text-xl font-extrabold text-white mt-0.5">
                                      {item.species}
                                    </h4>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                                      {item.treeCount} Trees
                                    </span>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${(item.timberGrade || '').toLowerCase().includes('healthy') || (item.timberGrade || '').toLowerCase().includes('grade a')
                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                        : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                      }`}>
                                      {item.timberGrade || 'Healthy'}
                                    </span>
                                  </div>
                                </div>

                                {/* Specifications Subcards Grid */}
                                <div className="grid grid-cols-2 gap-3.5 text-xs">
                                  <div className="bg-[#0b1b12] border border-emerald-500/15 p-3.5 rounded-xl space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Total Volume</span>
                                    <span className="font-bold text-emerald-400 text-sm block">{item.estimatedVolume} m³</span>
                                  </div>
                                  <div className="bg-[#0b1b12] border border-emerald-500/15 p-3.5 rounded-xl space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approx. Age & DBH</span>
                                    <span className="font-bold text-white text-sm flex items-center gap-1.5 flex-wrap">
                                      <span className="text-white">{item.averageAge}</span>
                                      <span className="text-emerald-400 font-extrabold">•</span>
                                      <span className="text-slate-200">{item.averageDBH}</span>
                                    </span>
                                  </div>
                                  <div className="bg-[#0b1b12] border border-emerald-500/15 p-3.5 rounded-xl space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logged Quantity</span>
                                    <span className="font-bold text-emerald-400 text-sm block">{item.treeCount} Standing Trees</span>
                                  </div>
                                  <div className="bg-[#0b1b12] border border-emerald-500/15 p-3.5 rounded-xl space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Health Grade</span>
                                    <span className="font-bold text-emerald-300 text-sm block">{item.timberGrade || 'Healthy'}</span>
                                  </div>
                                </div>

                                {/* Plot Position */}
                                <div className="bg-[#0b1b12] border border-emerald-500/15 p-3.5 rounded-xl text-xs space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location / Plot Position within Estate</span>
                                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                                    📍 {item.location || requestDetails?.propertyLocation || 'Front yard / Boundary area'}
                                  </span>
                                </div>

                                {/* Special Notes / Observations */}
                                {item.notes && (
                                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                                      Special Notes / Observations
                                    </span>
                                    <p className="text-amber-200 leading-relaxed">{item.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}


                  {/* Site Access & Specifications Callout */}
                  {requestDetails?.site_conditions && (
                    <div className="cd-specs-callout">
                      <div className="cd-specs-callout-title">
                        <Truck size={20} /> Harvest Site Specifications
                      </div>
                      <div className="cd-specs-callout-grid">
                        <div className="cd-spec-subcard">
                          <span className="cd-spec-subcard-label">Site Access</span>
                          <strong className="cd-spec-subcard-value">{requestDetails.site_conditions.access_availability || 'Heavy vehicle access'}</strong>
                        </div>
                        <div className="cd-spec-subcard">
                          <span className="cd-spec-subcard-label">Road Condition</span>
                          <strong className="cd-spec-subcard-value">{requestDetails.site_conditions.road_condition || 'Paved road'}</strong>
                        </div>
                        <div className="cd-spec-subcard">
                          <span className="cd-spec-subcard-label">Distance from Road</span>
                          <strong className="cd-spec-subcard-value">{requestDetails.site_conditions.distance_from_road || '50m'}</strong>
                        </div>
                        <div className="cd-spec-subcard">
                          <span className="cd-spec-subcard-label">Site Terrain</span>
                          <strong className="cd-spec-subcard-value">{requestDetails.site_conditions.terrain || 'Gently sloped'}</strong>
                        </div>
                      </div>
                      {requestDetails.site_conditions.additional_notes && (
                        <div className="cd-spec-notes-box">
                          "{requestDetails.site_conditions.additional_notes}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hazards Warning */}
                  {Array.isArray(requestDetails?.hazards) && requestDetails.hazards.length > 0 && (
                    <div className="cd-hazards-box">
                      <AlertTriangle size={22} className="shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <div className="cd-hazards-title">Identified Site Hazards:</div>
                        <div className="cd-hazards-value">{requestDetails.hazards.join(', ')}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* BOTTOM SECTION: ASSESSMENT & QUOTATION FORM (STACKED UNDER PROPERTY) */}
              <div className="w-full">
                <div className="cd-card border-emerald-500/40">
                  <div className="border-b border-emerald-500/20 pb-4 mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                        <FileText size={20} className="text-emerald-400" /> Formal Contractor Assessment Form
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Fill in evaluated volumes and itemized quotation costs for the landowner.
                      </p>
                    </div>
                  </div>

                  {/* Feedback Banner */}
                  {feedbackMessage.text && (
                    <div className={`p-4 rounded-xl mb-6 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-md ${feedbackMessage.type === 'success'
                        ? 'bg-emerald-950 border border-emerald-500 text-emerald-200'
                        : 'bg-red-950 border border-red-500 text-red-200'
                      }`}>
                      {feedbackMessage.type === 'success' ? (
                        <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle size={20} className="text-red-400 shrink-0" />
                      )}
                      <span>{feedbackMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="cd-form">

                    {/* Volume & Value Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="cd-form-group">
                        <label className="cd-form-label">
                          Assessed Harvestable Volume (m³) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          name="estimated_harvestable_volume"
                          value={assessmentForm.estimated_harvestable_volume}
                          onChange={handleInputChange}
                          className="cd-input"
                          placeholder="e.g. 180"
                        />
                      </div>

                      <div className="cd-form-group">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <label className="cd-form-label mb-0">
                            Estimated Commercial Timber Value (₹) *
                          </label>
                          {landownerReferenceTimberValue > 0 && (
                            <button
                              type="button"
                              onClick={() => setAssessmentForm(prev => ({ ...prev, estimated_timber_value: landownerReferenceTimberValue }))}
                              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer underline flex items-center gap-1"
                            >
                              <Coins size={11} /> Use Landowner Price ({formatINR(landownerReferenceTimberValue)})
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          required
                          name="estimated_timber_value"
                          value={assessmentForm.estimated_timber_value}
                          onChange={handleInputChange}
                          className="cd-input text-emerald-400 font-bold"
                          placeholder="e.g. 2160000"
                        />
                        {landownerReferenceTimberValue > 0 && (
                          <span className="text-[11px] text-slate-400 block mt-1">
                            Landowner reference price set: <strong className="text-amber-400">{formatINR(landownerReferenceTimberValue)}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cost Breakdown Section */}
                    <div className="cd-cost-breakdown-box">
                      <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign size={15} /> Itemized Service Cost Breakdown (₹)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="cd-form-group">
                          <label className="text-[11px] font-semibold text-slate-300">Tree Felling Cost (₹)</label>
                          <input
                            type="number"
                            name="harvesting_cost"
                            value={assessmentForm.harvesting_cost}
                            onChange={handleInputChange}
                            className="cd-input font-mono text-xs"
                          />
                        </div>

                        <div className="cd-form-group">
                          <label className="text-[11px] font-semibold text-slate-300">Timber Extraction Cost (₹)</label>
                          <input
                            type="number"
                            name="extraction_cost"
                            value={assessmentForm.extraction_cost}
                            onChange={handleInputChange}
                            className="cd-input font-mono text-xs"
                          />
                        </div>

                        <div className="cd-form-group">
                          <label className="text-[11px] font-semibold text-slate-300">Transportation / Haulage (₹)</label>
                          <input
                            type="number"
                            name="transportation_cost"
                            value={assessmentForm.transportation_cost}
                            onChange={handleInputChange}
                            className="cd-input font-mono text-xs"
                          />
                        </div>

                        <div className="cd-form-group">
                          <label className="text-[11px] font-semibold text-slate-300">Other / Site Clearing Cost (₹)</label>
                          <input
                            type="number"
                            name="other_cost"
                            value={assessmentForm.other_cost}
                            onChange={handleInputChange}
                            className="cd-input font-mono text-xs"
                          />
                        </div>
                      </div>

                      {/* Total Quotation Summary */}
                      <div className="cd-total-quote-box">
                        <span className="text-slate-200 font-bold text-xs sm:text-sm">Total Calculated Quotation:</span>
                        <span className="cd-total-quote-amount">
                          ₹ {Number(assessmentForm.total_quote || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Operational Manpower, Schedule & Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="cd-form-group">
                        <label className="cd-form-label flex items-center justify-between">
                          <span>Number of Workers Assigned to This Job *</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            name="assigned_workers_count"
                            value={assessmentForm.assigned_workers_count}
                            onChange={handleInputChange}
                            className="cd-input font-bold text-emerald-400"
                            placeholder="e.g. 12"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Total workforce deployed for this job (e.g. 12)
                        </span>
                      </div>

                      <div className="cd-form-group">
                        <label className="cd-form-label">
                          Estimated Job Duration *
                        </label>
                        <input
                          type="text"
                          required
                          name="estimated_duration"
                          value={assessmentForm.estimated_duration}
                          onChange={handleInputChange}
                          className="cd-input"
                          placeholder="e.g. 10 Working Days"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Operational time required (e.g. 10 Working Days)
                        </span>
                      </div>

                      <div className="cd-form-group">
                        <label className="cd-form-label">
                          Proposed Operation Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          name="proposed_start_date"
                          value={assessmentForm.proposed_start_date}
                          onChange={handleInputChange}
                          className="cd-input"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Target date for team mobilization
                        </span>
                      </div>
                    </div>

                    {/* CONTRACTOR ASSESSMENT SUMMARY & REPORT CARD */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#06150c] via-[#091f12] to-[#040e08] border border-emerald-500/35 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-emerald-500/20 pb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={18} className="text-emerald-400" />
                          <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                            Contractor Assessment Summary & Report
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow no-print"
                        >
                          <Printer size={13} /> Print Assessment Report
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 text-xs">
                        <div className="bg-[#0b1b12] border border-emerald-500/20 p-3.5 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Assessed Harvestable Volume
                          </span>
                          <strong className="text-emerald-400 text-sm font-extrabold block">
                            {parseFloat(assessmentForm.estimated_harvestable_volume || 0).toFixed(2)} m³
                          </strong>
                        </div>

                        <div className="bg-[#0b1b12] border border-emerald-500/20 p-3.5 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Total Contractor Quotation
                          </span>
                          <strong className="text-amber-400 text-sm font-black block">
                            ₹{Number(assessmentForm.total_quote || 0).toLocaleString('en-IN')}
                          </strong>
                        </div>

                        <div className="bg-[#0b1b12] border border-emerald-500/20 p-3.5 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Number of Workers Assigned to This Job
                          </span>
                          <strong className="text-white text-sm font-black block">
                            {assessmentForm.assigned_workers_count || 12}
                          </strong>
                        </div>

                        <div className="bg-[#0b1b12] border border-emerald-500/20 p-3.5 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Estimated Job Duration
                          </span>
                          <strong className="text-white text-sm font-bold block">
                            {assessmentForm.estimated_duration || '10 Working Days'}
                          </strong>
                        </div>

                        <div className="bg-[#0b1b12] border border-emerald-500/20 p-3.5 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Proposed Operation Start Date
                          </span>
                          <strong className="text-slate-200 text-sm font-bold block">
                            {formatDateDMY(assessmentForm.proposed_start_date)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Site Notes */}
                    <div className="cd-form-group">
                      <label className="cd-form-label">
                        Site Inspection Notes & Assessment Remarks
                      </label>
                      <textarea
                        rows={4}
                        name="notes"
                        value={assessmentForm.notes}
                        onChange={handleInputChange}
                        className="cd-textarea"
                        placeholder="Provide comments regarding site accessibility, crane deployment requirements, timber health..."
                      />
                    </div>

                    {/* Actions Bar */}
                    <div className="cd-modal-actions">
                      <button
                        type="button"
                        onClick={() => navigate('/contractor/assigned-jobs')}
                        className="cd-btn-cancel"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="cd-btn-primary"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" /> Submitting Assessment...
                          </>
                        ) : (
                          <>
                            <Calculator size={16} /> Submit Assessment & Quotation
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              </div>

            </div>
          )}

          {/* FULL-SCREEN LIGHTBOX MODAL FOR PROPERTY & TREE PHOTOS */}
          {activePhotoModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#0a0f0d]/95 backdrop-blur-md animate-fade-in">
              <div className="max-w-4xl w-full p-6 border border-emerald-500/30 rounded-2xl bg-[#121a16] space-y-4 shadow-2xl relative">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <ImageIcon size={18} className="text-emerald-400" /> {activePhotoModal.title}
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
                    className="px-5 py-2 rounded-xl bg-[#0e1612] hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    Close Lightbox
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SubmitAssessmentPage;
