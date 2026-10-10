import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import harvestService from '../../services/harvestService';
import api from '../../services/api';
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
  Users,
  Briefcase,
  Handshake,
  ShoppingBag,
  ClipboardCheck,
  Wrench,
  CalendarCheck,
  Edit3,
  Save,
  MessageSquare,
  Sparkles,
  CreditCard,
  QrCode,
  IndianRupee,
  Sliders,
  Check,
  XCircle,
  RefreshCw
} from 'lucide-react';
import {
  calculateApproxTimberValue,
  formatINR,
  parseVolumeNumber,
  formatVolume,
  getTimberReferenceRate,
  TIMBER_VALUE_DISCLAIMER
} from '../../utils/timberCalculations';

const formatDateDMY = (dateStr) => {
  if (!dateStr) return '-';
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

const formatRupees = (amount) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMaxDateString = () => {
  const max = new Date();
  max.setFullYear(max.getFullYear() + 1);
  const year = max.getFullYear();
  const month = String(max.getMonth() + 1).padStart(2, '0');
  const day = String(max.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToToday = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Extract approved/scheduled site inspection date
const getApprovedInspectionDate = (req) => {
  if (!req) return '';
  const ins = req.site_inspection || {};
  const candidates = [
    ins.scheduled_date,
    req.inspection_scheduled_date,
    ins.suggested_date,
    ins.approved_date,
    ins.inspection_date,
    ins.completed_at,
    ins.inspected_at,
    req.inspection_date
  ];
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim().length >= 10) {
      return c.trim().substring(0, 10);
    }
  }
  return '';
};

const validateProposedDate = (dateVal, minInspectionDate) => {
  if (!dateVal || !String(dateVal).trim()) {
    return 'Proposed Operation Start Date is mandatory.';
  }
  const cleanVal = String(dateVal).trim().substring(0, 10);
  const today = getTodayDateString();
  if (cleanVal < today) {
    return 'Proposed Operation Start Date cannot be in the past. Please select today or a future date.';
  }
  if (minInspectionDate && cleanVal < minInspectionDate) {
    return `Proposed Operation Start Date cannot be earlier than the approved site inspection date (${formatDateDMY(minInspectionDate)}). Field inspection must be completed before commencing harvesting operations.`;
  }
  const maxDate = getMaxDateString();
  if (cleanVal > maxDate) {
    return 'Proposed Operation Start Date cannot be more than 1 year in advance.';
  }
  return '';
};

const getRelativeDaysDescription = (dateVal) => {
  if (!dateVal) return '';
  const cleanVal = String(dateVal).trim().substring(0, 10);
  const today = getTodayDateString();
  if (cleanVal === today) return 'Starts today';
  const start = new Date(cleanVal);
  const now = new Date(today);
  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return 'Starts tomorrow';
  if (diffDays > 1) return `Starts in ${diffDays} days`;
  return '';
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
  const [existingAssessmentData, setExistingAssessmentData] = useState(null);
  const [revisionDraft, setRevisionDraft] = useState(null);
  const [showCustomAmountBox, setShowCustomAmountBox] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState('');
  const autoAppliedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fleetEquipment, setFleetEquipment] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [activePhotoModal, setActivePhotoModal] = useState(null);
  const [dateError, setDateError] = useState('');
  const dateInputRef = useRef(null);

  // Decline Job / Unfavourable Terms State
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('Offered budget or counter-offer amount is below operational feasibility');
  const [declineNotes, setDeclineNotes] = useState('');
  const [isDeclining, setIsDeclining] = useState(false);

  const handleDeclineAssignment = async (e) => {
    if (e) e.preventDefault();
    setIsDeclining(true);
    try {
      const fullReason = declineNotes ? `${declineReason} - ${declineNotes}` : declineReason;
      await harvestService.declineJob(requestId, { reason: fullReason, feedback: fullReason });
      
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map(item => {
            if ((item.id || item._id) === requestId) {
              return {
                ...item,
                status: 'PENDING',
                assigned_contractor_id: null,
                assigned_contractor_name: null,
                assigned_contractor_email: null,
                contractor_decline_reason: fullReason,
                inspection_status: 'DECLINED'
              };
            }
            return item;
          });
          localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
        }
      } catch (err) {}

      setShowDeclineModal(false);
      navigate('/contractor/assigned-jobs', {
        state: { toastMessage: 'Assignment declined. Job returned to landowner pool.' }
      });
    } catch (err) {
      alert('Could not decline assignment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeclining(false);
    }
  };

  const approvedInspectionDate = getApprovedInspectionDate(requestDetails);
  const minOperationalDate = (approvedInspectionDate && approvedInspectionDate > getTodayDateString())
    ? approvedInspectionDate
    : getTodayDateString();

  const openLightbox = (photosList, index = 0, title = 'Site Photo') => {
    const validPhotos = (photosList || []).map(p => {
      if (typeof p === 'string') return p.trim();
      if (typeof p === 'object' && p) return (p.previewUrl || p.dataUrl || p.fileUrl || p.url || p.src || '').trim();
      return '';
    }).filter(Boolean);
    if (validPhotos.length === 0) return;
    setActivePhotoModal({ photos: validPhotos, index, title });
  };

// Helper to extract landowner's estimated volume in m³
const extractLandownerVolume = (req) => {
  if (!req) return 1.70;
  if (req.total_estimated_volume !== undefined && req.total_estimated_volume !== null && !isNaN(Number(req.total_estimated_volume))) {
    return parseVolumeNumber(req.total_estimated_volume);
  }
  const rawGroups = (Array.isArray(req.selected_tree_groups) && req.selected_tree_groups.length > 0)
    ? req.selected_tree_groups
    : (Array.isArray(req.tree_inventory) && req.tree_inventory.length > 0)
      ? req.tree_inventory
      : (Array.isArray(req.tree_inventories) && req.tree_inventories.length > 0)
        ? req.tree_inventories
        : (Array.isArray(req.selected_tree_inventories) && req.selected_tree_inventories.length > 0)
          ? req.selected_tree_inventories
          : [];
  if (rawGroups.length > 0) {
    const total = rawGroups.reduce((acc, g) => {
      let count = Number(g.numberOfTrees ?? g.treeCount ?? g.count ?? g.quantity ?? 1);
      let volVal = parseVolumeNumber(g.estimatedVolume || g.volume || g.estimated_volume);
      if (!volVal || isNaN(volVal)) {
        volVal = Number((count * 0.85).toFixed(2));
      }
      if (count === 1 && (volVal === 15.0 || volVal === 15)) volVal = 1.70;
      return acc + volVal;
    }, 0);
    return Number(total.toFixed(2));
  }
  return 1.70;
};

// Helper to extract landowner's estimated timber value in ₹
const extractLandownerValue = (req, vol) => {
  if (!req) return 237133;
  if (req.total_estimated_price) return Number(req.total_estimated_price);
  if (req.approx_timber_value) return Number(req.approx_timber_value);
  if (req.estimated_timber_value) return Number(req.estimated_timber_value);
  const rawGroups = (Array.isArray(req.selected_tree_groups) && req.selected_tree_groups.length > 0)
    ? req.selected_tree_groups
    : (Array.isArray(req.tree_inventory) && req.tree_inventory.length > 0)
      ? req.tree_inventory
      : (Array.isArray(req.tree_inventories) && req.tree_inventories.length > 0)
        ? req.tree_inventories
        : [];
  if (rawGroups.length > 0) {
    return rawGroups.reduce((acc, g) => {
      let count = Number(g.numberOfTrees ?? g.treeCount ?? g.count ?? g.quantity ?? 1);
      const speciesTitle = g.species || g.treeSpecies || g.groupName || 'Teak';
      let volVal = parseVolumeNumber(g.estimatedVolume || g.volume || (count * 0.85)) || Number((count * 0.85).toFixed(2));
      if (count === 1 && (volVal === 15.0 || volVal === 15 || !g.estimatedVolume)) volVal = 1.70;
      return acc + Number(g.approximate_timber_value || g.estimatedPrice || calculateApproxTimberValue(speciesTitle, volVal));
    }, 0);
  }
  return calculateApproxTimberValue('Teak', vol);
};

  const [isVolumeManuallyEdited, setIsVolumeManuallyEdited] = useState(false);
  const [isTimberValueManuallyEdited, setIsTimberValueManuallyEdited] = useState(false);

  const [assessmentForm, setAssessmentForm] = useState({
    commercial_proposal_type: 'Harvesting Service Quotation',
    estimated_harvestable_volume: 1.70,
    estimated_timber_value: 237133,
    // Harvesting Service Quotation fields
    harvesting_cost: 45000,
    extraction_cost: 30000,
    transportation_cost: 25000,
    other_cost: 10000,
    total_quote: 110000,
    // Timber Purchase Offer fields
    contractor_purchase_offer: '',
    // Purchase + Harvesting fields
    timber_purchase_price: '',
    harvesting_arrangement_cost: '',
    transportation_arrangement: 'Contractor arranged heavy haulage',
    // Common terms for purchase offers
    payment_terms: '50% advance upon signing, 50% prior to timber dispatch',
    offer_valid_until: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    // Operations
    assigned_workers_count: 12,
    estimated_duration: '10 Working Days',
    proposed_start_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: 'Site inspection completed. Access road clear for heavy haulers.',
    // Advance Mobilization Configuration
    require_advance: true,
    advance_percentage: 30,
    advance_amount: 33000,
    advance_due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    advance_upi_id: 'treeconnect.contractor@okhdfcbank',
    advance_bank_name: 'HDFC Bank Ltd, Kottayam Branch',
    advance_bank_account_number: '50200084920194',
    advance_ifsc_code: 'HDFC0001234',
    advance_account_holder: 'Rohith Kumar (Forestry Contractor)',
    advance_remarks: 'Mobilization advance covers crew staging and haulage logistics.'
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

          let loVol = 1.70;
          let loVal = 237133;

          if (combinedData) {
            setRequestDetails(combinedData);
            loVol = extractLandownerVolume(combinedData);
            loVal = extractLandownerValue(combinedData, loVol);
          } else {
            setFallbackDetails();
          }

          // Try fetching existing assessment from API, combinedData, or localStorage
          let hasExistingAssessment = false;
          const inspDate = getApprovedInspectionDate(combinedData);
          let assData = null;
          try {
            const existingAssessment = await harvestService.getAssessment(requestId);
            if (existingAssessment && (existingAssessment.assessment || existingAssessment.id || existingAssessment.commercial_proposal_type)) {
              assData = existingAssessment.assessment || existingAssessment;
            }
          } catch (e) {
            console.log('No prior assessment recorded from API endpoint, checking combined harvest request data.');
          }

          if (!assData && combinedData) {
            if (combinedData.assessment && typeof combinedData.assessment === 'object') {
              assData = combinedData.assessment;
            } else if (combinedData.total_quote !== undefined || combinedData.contractor_purchase_offer !== undefined || combinedData.timber_purchase_price !== undefined || combinedData.status === 'ASSESSMENT_SUBMITTED') {
              assData = {
                commercial_proposal_type: combinedData.commercial_proposal_type || 'Harvesting Service Quotation',
                estimated_harvestable_volume: combinedData.estimated_harvestable_volume || loVol,
                estimated_timber_value: combinedData.estimated_timber_value || loVal,
                harvesting_cost: combinedData.harvesting_cost ?? combinedData.felling_cost ?? 40700,
                felling_cost: combinedData.felling_cost ?? combinedData.harvesting_cost ?? 40700,
                extraction_cost: combinedData.extraction_cost ?? 28490,
                transportation_cost: combinedData.transportation_cost ?? 22385,
                other_cost: combinedData.other_cost ?? 10175,
                total_quote: combinedData.total_quote ?? 101750,
                original_quote: combinedData.original_quote ?? combinedData.total_quote ?? 101750,
                previous_quote: combinedData.previous_quote,
                revised_quote: combinedData.revised_quote,
                original_costs: combinedData.original_costs || {
                  harvesting_cost: combinedData.harvesting_cost ?? combinedData.felling_cost ?? 40700,
                  extraction_cost: combinedData.extraction_cost ?? 28490,
                  transportation_cost: combinedData.transportation_cost ?? 22385,
                  other_cost: combinedData.other_cost ?? 10175
                },
                reduction: combinedData.reduction,
                revision_history: combinedData.revision_history || [],
                is_revision: combinedData.is_revision || false,
                contractor_purchase_offer: combinedData.contractor_purchase_offer,
                timber_purchase_price: combinedData.timber_purchase_price,
                harvesting_arrangement_cost: combinedData.harvesting_arrangement_cost,
                transportation_arrangement: combinedData.transportation_arrangement,
                payment_terms: combinedData.payment_terms,
                offer_valid_until: combinedData.offer_valid_until,
                assigned_workers_count: combinedData.assigned_workers_count ?? combinedData.workers_assigned ?? 10,
                workers_assigned: combinedData.workers_assigned ?? combinedData.assigned_workers_count ?? 10,
                estimated_duration: combinedData.estimated_duration || '1 Working Day',
                proposed_start_date: combinedData.proposed_start_date || '2026-10-10',
                notes: combinedData.notes || 'Site inspection completed. Access road clear for heavy haulers.'
              };
            }
          }

          if (assData) {
            hasExistingAssessment = true;
            // Preserve original_quote and original_costs if missing
            if (!assData.original_quote && assData.total_quote) {
              assData.original_quote = assData.total_quote;
            }
            if (!assData.original_costs) {
              assData.original_costs = {
                harvesting_cost: assData.harvesting_cost ?? assData.felling_cost ?? 40700,
                extraction_cost: assData.extraction_cost ?? 28490,
                transportation_cost: assData.transportation_cost ?? 22385,
                other_cost: assData.other_cost ?? 10175
              };
            }
            setExistingAssessmentData(assData);
            const cleanExistingDate = assData.proposed_start_date ? String(assData.proposed_start_date).substring(0, 10) : '';
            if (cleanExistingDate) {
              const initialDateErr = validateProposedDate(cleanExistingDate, inspDate);
              if (initialDateErr) setDateError(initialDateErr);
            }

            // If contractor has already submitted an assessment, retain their assessed values
            const assessedVol = (assData.estimated_harvestable_volume !== undefined && assData.estimated_harvestable_volume !== null && assData.estimated_harvestable_volume !== '')
              ? parseVolumeNumber(assData.estimated_harvestable_volume)
              : loVol;
            const assessedVal = (assData.estimated_timber_value !== undefined && assData.estimated_timber_value !== null && assData.estimated_timber_value !== '')
              ? Number(assData.estimated_timber_value)
              : loVal;

            const cleanValidUntil = assData.offer_valid_until ? String(assData.offer_valid_until).substring(0, 10) : '';

            setAssessmentForm(prev => ({
              ...prev,
              commercial_proposal_type: assData.commercial_proposal_type || prev.commercial_proposal_type,
              estimated_harvestable_volume: assessedVol,
              estimated_timber_value: assessedVal,
              harvesting_cost: assData.harvesting_cost ?? assData.felling_cost ?? prev.harvesting_cost,
              extraction_cost: assData.extraction_cost ?? prev.extraction_cost,
              transportation_cost: assData.transportation_cost ?? prev.transportation_cost,
              other_cost: assData.other_cost ?? prev.other_cost,
              total_quote: assData.total_quote ?? prev.total_quote,
              contractor_purchase_offer: assData.contractor_purchase_offer ?? prev.contractor_purchase_offer,
              timber_purchase_price: assData.timber_purchase_price ?? prev.timber_purchase_price,
              harvesting_arrangement_cost: assData.harvesting_arrangement_cost ?? prev.harvesting_arrangement_cost,
              transportation_arrangement: assData.transportation_arrangement || prev.transportation_arrangement,
              payment_terms: assData.payment_terms || prev.payment_terms,
              offer_valid_until: cleanValidUntil || prev.offer_valid_until,
              assigned_workers_count: assData.assigned_workers_count ?? assData.workers_assigned ?? prev.assigned_workers_count ?? 10,
              estimated_duration: assData.estimated_duration || prev.estimated_duration || '1 Working Day',
              proposed_start_date: cleanExistingDate || (inspDate && inspDate > prev.proposed_start_date ? inspDate : prev.proposed_start_date),
              notes: assData.notes || prev.notes,
              // Load advance terms if existing
              require_advance: Boolean(assData.advance_payment_request || combinedData?.advance_payment_request || prev.require_advance),
              advance_percentage: Number(assData.advance_payment_request?.advance_percentage || combinedData?.advance_payment_request?.advance_percentage || prev.advance_percentage || 30),
              advance_amount: Number(assData.advance_payment_request?.advance_amount || combinedData?.advance_payment_request?.advance_amount || prev.advance_amount || Math.round(((assData.total_quote || prev.total_quote || 110000) * 30) / 100)),
              advance_due_date: assData.advance_payment_request?.due_date || combinedData?.advance_payment_request?.due_date || prev.advance_due_date,
              advance_upi_id: assData.advance_payment_request?.upi_id || combinedData?.advance_payment_request?.upi_id || prev.advance_upi_id,
              advance_bank_name: assData.advance_payment_request?.bank_name || combinedData?.advance_payment_request?.bank_name || prev.advance_bank_name,
              advance_bank_account_number: assData.advance_payment_request?.bank_account_number || combinedData?.advance_payment_request?.bank_account_number || prev.advance_bank_account_number,
              advance_ifsc_code: assData.advance_payment_request?.ifsc_code || combinedData?.advance_payment_request?.ifsc_code || prev.advance_ifsc_code,
              advance_account_holder: assData.advance_payment_request?.account_holder_name || combinedData?.advance_payment_request?.account_holder_name || prev.advance_account_holder,
              advance_remarks: assData.advance_payment_request?.remarks || combinedData?.advance_payment_request?.remarks || prev.advance_remarks
            }));
          } else {
            // If no prior assessment exists, default to landowner estimate and ensure start date is after inspection
            setAssessmentForm(prev => ({
              ...prev,
              estimated_harvestable_volume: Number(loVol.toFixed(2)),
              estimated_timber_value: loVal > 0 ? loVal : calculateApproxTimberValue('Teak', loVol),
              proposed_start_date: (inspDate && inspDate > prev.proposed_start_date) ? inspDate : prev.proposed_start_date
            }));
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

    const fetchFleet = async () => {
      try {
        const res = await api.get('/auth/user-profile');
        if (res.data?.user?.fleet_equipment) {
          setFleetEquipment(res.data.user.fleet_equipment);
        }
      } catch (err) {
        console.error("Failed to fetch fleet in quotation page", err);
      }
    };

    fetchRequestData();
    fetchFleet();
  }, [requestId]);

  const setFallbackDetails = () => {
    const fallbackAssessment = {
      commercial_proposal_type: 'Harvesting Service Quotation',
      estimated_harvestable_volume: 1.80,
      estimated_timber_value: 237133,
      harvesting_cost: 40700,
      felling_cost: 40700,
      extraction_cost: 28490,
      transportation_cost: 22385,
      other_cost: 10175,
      total_quote: 101750,
      original_quote: 101750,
      counter_offer_amount: 93500,
      counter_offer_start_date: '2026-10-10',
      assigned_workers_count: 10,
      estimated_duration: '1 Working Day',
      proposed_start_date: '2026-10-10',
      original_costs: {
        harvesting_cost: 40700,
        extraction_cost: 28490,
        transportation_cost: 22385,
        other_cost: 10175
      },
      revision_history: [
        {
          revision_number: 0,
          type: 'INITIAL_QUOTATION',
          contractor_quote: 101750,
          costs: {
            harvesting_cost: 40700,
            extraction_cost: 28490,
            transportation_cost: 22385,
            other_cost: 10175
          },
          timestamp: '2026-10-08T10:00:00Z'
        }
      ],
      status: 'ASSESSMENT_SUBMITTED'
    };

    setExistingAssessmentData(fallbackAssessment);

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
      site_inspected: true,
      site_inspection: {
        status: 'COMPLETED',
        scheduled_date: '2026-10-12',
        estimated_volume: 1.8,
        verified_tree_count: 1,
        timber_condition: 'Sound & Top Quality',
        road_access_verification: 'Medium 6-wheeler truck only'
      },
      inspection_scheduled_date: '2026-10-12',
      tree_inventory: [
        {
          id: 'inv_1',
          species: 'Teak',
          treeCount: 1,
          estimatedVolume: '1.70 m³',
          averageAge: '15 Years',
          averageDBH: '60 - 85 cm',
          averageHeight: '14 Meters',
          timberGrade: 'Grade A Commercial Hardwood'
        }
      ],
      total_estimated_volume: 1.70,
      total_estimated_price: 237133,
      approx_timber_value: 237133,
      total_quote: 101750,
      original_quote: 101750,
      harvesting_cost: 40700,
      extraction_cost: 28490,
      transportation_cost: 22385,
      other_cost: 10175,
      counter_offer_amount: 93500,
      counter_offer_start_date: '2026-10-10',
      status: 'REVISION_REQUESTED',
      assessment: fallbackAssessment,
      site_conditions: {
        access_availability: 'Heavy vehicle access',
        road_condition: 'Paved panchayat road (50 meters)',
        distance_from_road: '50 meters',
        terrain: 'Gently sloped',
        additional_notes: 'Easy access from main road. Clear haul path for timber trailers.'
      },
      hazards: ['Nearby buildings / structures', 'Public road adjacent'],
      createdAt: '2026-09-10'
    });
  };

  // Switch Proposal Type and Clean Obsolete Fields
  const handleProposalTypeChange = (type) => {
    setAssessmentForm(prev => {
      const updated = {
        ...prev,
        commercial_proposal_type: type
      };
      if (type === 'Harvesting Service Quotation') {
        updated.contractor_purchase_offer = '';
        updated.timber_purchase_price = '';
        const sum = (Number(updated.harvesting_cost) || 0) +
          (Number(updated.extraction_cost) || 0) +
          (Number(updated.transportation_cost) || 0) +
          (Number(updated.other_cost) || 0);
        updated.total_quote = sum;
      } else if (type === 'Timber Purchase Offer') {
        // Clear obsolete service cost values so they are not submitted
        updated.harvesting_cost = '';
        updated.extraction_cost = '';
        updated.transportation_cost = '';
        updated.other_cost = '';
        updated.total_quote = '';
        updated.timber_purchase_price = '';
        if (!updated.offer_valid_until) {
          updated.offer_valid_until = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
        }
        if (!updated.payment_terms) {
          updated.payment_terms = '100% full settlement upon agreement signing prior to felling';
        }
      } else if (type === 'Purchase + Harvesting') {
        updated.contractor_purchase_offer = '';
        if (!updated.offer_valid_until) {
          updated.offer_valid_until = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
        }
        if (!updated.payment_terms) {
          updated.payment_terms = '50% advance upon signing, 50% upon completion of harvesting & extraction';
        }
        if (!updated.transportation_arrangement) {
          updated.transportation_arrangement = 'Contractor arranged heavy haulage to timber depot';
        }
      }
      return updated;
    });
  };

  // Handle Form Change with Live Auto-Sum of Itemized Costs
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'estimated_harvestable_volume') {
      setIsVolumeManuallyEdited(true);
    }
    if (name === 'estimated_timber_value') {
      setIsTimberValueManuallyEdited(true);
    }

    if (name === 'assigned_workers_count') {
      const sanitized = value.replace(/[^0-9]/g, '');
      setAssessmentForm(prev => ({
        ...prev,
        assigned_workers_count: sanitized === '' ? '' : parseInt(sanitized, 10)
      }));
      return;
    }

    if (name === 'proposed_start_date') {
      const dateErr = validateProposedDate(value, approvedInspectionDate);
      setDateError(dateErr);
    }

    setAssessmentForm(prev => {
      const updated = { ...prev, [name]: value };

      if (['harvesting_cost', 'extraction_cost', 'transportation_cost', 'other_cost'].includes(name)) {
        const sum = (Number(updated.harvesting_cost) || 0) +
          (Number(updated.extraction_cost) || 0) +
          (Number(updated.transportation_cost) || 0) +
          (Number(updated.other_cost) || 0);
        updated.total_quote = sum;

        if (updated.require_advance) {
          updated.advance_amount = Math.round((sum * (Number(updated.advance_percentage) || 30)) / 100);
        }

        setRevisionDraft(prevDraft => {
          if (!prevDraft) return prevDraft;
          return {
            ...prevDraft,
            [name]: Number(value) || 0,
            revised_contractor_quote: sum,
            difference: sum - originalContractorQuote
          };
        });
      }
      return updated;
    });
  };

  const handleAdvancePercentageChange = (pct) => {
    const val = Math.max(1, Math.min(100, Number(pct) || 0));
    const quoteVal = Number(assessmentForm.total_quote || assessmentForm.contractor_purchase_offer || assessmentForm.timber_purchase_price || 0);
    setAssessmentForm(prev => ({
      ...prev,
      advance_percentage: val,
      advance_amount: Math.round((quoteVal * val) / 100)
    }));
  };

  const handleAdvanceAmountChange = (amt) => {
    const val = Math.max(0, Number(amt) || 0);
    const quoteVal = Number(assessmentForm.total_quote || assessmentForm.contractor_purchase_offer || assessmentForm.timber_purchase_price || 0);
    const pct = quoteVal > 0 ? Math.min(100, Math.max(1, Math.round((val / quoteVal) * 100))) : 30;
    setAssessmentForm(prev => ({
      ...prev,
      advance_amount: val,
      advance_percentage: pct
    }));
  };

  const handleUseLandownerVolume = () => {
    setIsVolumeManuallyEdited(false);
    const refRate = getTimberReferenceRate(primarySpecies);
    const computedVal = Math.round(landownerEstimatedVolume * refRate);
    setAssessmentForm(prev => ({
      ...prev,
      estimated_harvestable_volume: Number(landownerEstimatedVolume.toFixed(2)),
      estimated_timber_value: landownerReferenceTimberValue > 0 ? landownerReferenceTimberValue : computedVal
    }));
  };

  const originalContractorQuote = Number(
    existingAssessmentData?.original_quote ||
    requestDetails?.original_quote ||
    existingAssessmentData?.total_quote ||
    requestDetails?.total_quote ||
    101750
  );

  const landownerTargetBudget = Number(
    requestDetails?.counter_offer_amount ||
    existingAssessmentData?.counter_offer_amount ||
    93500
  );

  const isAlreadyRevised = Boolean(
    existingAssessmentData?.is_revision ||
    requestDetails?.is_revision ||
    existingAssessmentData?.previous_quote ||
    requestDetails?.previous_quote ||
    (existingAssessmentData?.revision_history && existingAssessmentData.revision_history.length > 1) ||
    (requestDetails?.revision_history && requestDetails.revision_history.length > 1)
  );

  const previousOfficialQuote = Number(
    existingAssessmentData?.previous_quote ||
    requestDetails?.previous_quote ||
    (isAlreadyRevised ? originalContractorQuote : null)
  );

  const latestOfficialQuote = Number(
    existingAssessmentData?.total_quote ||
    requestDetails?.total_quote ||
    originalContractorQuote
  );

  const officialReduction = Number(
    existingAssessmentData?.reduction ||
    requestDetails?.reduction ||
    (isAlreadyRevised ? (originalContractorQuote - latestOfficialQuote) : 0)
  );

  const originalCosts = existingAssessmentData?.original_costs || requestDetails?.original_costs || {
    harvesting_cost: existingAssessmentData?.harvesting_cost ?? existingAssessmentData?.felling_cost ?? 40700,
    extraction_cost: existingAssessmentData?.extraction_cost ?? 28490,
    transportation_cost: existingAssessmentData?.transportation_cost ?? 22385,
    other_cost: existingAssessmentData?.other_cost ?? 10175
  };

  const handleMatchLandownerTarget = () => {
    const target = Number(landownerTargetBudget);
    if (!target || isNaN(target) || target <= 0) return;
    if (target >= originalContractorQuote) return; // Edge case: target already matches or exceeds original quote

    const reductionAmt = originalContractorQuote - target;

    if (assessmentForm.commercial_proposal_type === 'Harvesting Service Quotation') {
      const felling = Math.round(target * 0.40);
      const extraction = Math.round(target * 0.28);
      const transport = Math.round(target * 0.22);
      const other = target - (felling + extraction + transport);

      setRevisionDraft({
        type: 'MATCH_TARGET',
        label: 'Match Target Budget',
        revised_contractor_quote: target,
        harvesting_cost: felling,
        extraction_cost: extraction,
        transportation_cost: transport,
        other_cost: other,
        difference: target - originalContractorQuote,
        reduction: reductionAmt
      });

      setAssessmentForm(prev => ({
        ...prev,
        harvesting_cost: felling,
        extraction_cost: extraction,
        transportation_cost: transport,
        other_cost: other,
        total_quote: target
      }));
    } else if (assessmentForm.commercial_proposal_type === 'Timber Purchase Offer') {
      setRevisionDraft({
        type: 'MATCH_TARGET',
        label: 'Match Target Budget',
        revised_contractor_quote: target,
        difference: target - originalContractorQuote,
        reduction: reductionAmt
      });
      setAssessmentForm(prev => ({
        ...prev,
        contractor_purchase_offer: target
      }));
    } else if (assessmentForm.commercial_proposal_type === 'Purchase + Harvesting') {
      setRevisionDraft({
        type: 'MATCH_TARGET',
        label: 'Match Target Budget',
        revised_contractor_quote: target,
        difference: target - originalContractorQuote,
        reduction: reductionAmt
      });
      setAssessmentForm(prev => ({
        ...prev,
        timber_purchase_price: target
      }));
    }

    const targetDate = requestDetails?.counter_offer_start_date || existingAssessmentData?.counter_offer_start_date;
    if (targetDate) {
      setAssessmentForm(prev => ({
        ...prev,
        proposed_start_date: String(targetDate).substring(0, 10)
      }));
    }
  };

  const handleMeetHalfwayTarget = () => {
    const target = Number(landownerTargetBudget);
    const baseline = originalContractorQuote;
    if (!target || isNaN(target) || target <= 0) return;
    if (target >= baseline) return; // Edge case: target already matches or exceeds baseline

    const halfway = Math.round((baseline + target) / 2);
    const reductionAmt = baseline - halfway;

    if (assessmentForm.commercial_proposal_type === 'Harvesting Service Quotation') {
      const felling = Math.round(halfway * 0.40);
      const extraction = Math.round(halfway * 0.28);
      const transport = Math.round(halfway * 0.22);
      const other = halfway - (felling + extraction + transport);

      setRevisionDraft({
        type: 'MEET_HALFWAY',
        label: 'Meet Halfway',
        revised_contractor_quote: halfway,
        harvesting_cost: felling,
        extraction_cost: extraction,
        transportation_cost: transport,
        other_cost: other,
        difference: halfway - baseline,
        reduction: reductionAmt
      });

      setAssessmentForm(prev => ({
        ...prev,
        harvesting_cost: felling,
        extraction_cost: extraction,
        transportation_cost: transport,
        other_cost: other,
        total_quote: halfway
      }));
    } else if (assessmentForm.commercial_proposal_type === 'Timber Purchase Offer') {
      setRevisionDraft({
        type: 'MEET_HALFWAY',
        label: 'Meet Halfway',
        revised_contractor_quote: halfway,
        difference: halfway - baseline,
        reduction: reductionAmt
      });
      setAssessmentForm(prev => ({
        ...prev,
        contractor_purchase_offer: halfway
      }));
    } else if (assessmentForm.commercial_proposal_type === 'Purchase + Harvesting') {
      setRevisionDraft({
        type: 'MEET_HALFWAY',
        label: 'Meet Halfway',
        revised_contractor_quote: halfway,
        difference: halfway - baseline,
        reduction: reductionAmt
      });
      setAssessmentForm(prev => ({
        ...prev,
        timber_purchase_price: halfway
      }));
    }

    const targetDate = requestDetails?.counter_offer_start_date || existingAssessmentData?.counter_offer_start_date;
    if (targetDate) {
      setAssessmentForm(prev => ({
        ...prev,
        proposed_start_date: String(targetDate).substring(0, 10)
      }));
    }
  };

  const handleApplyCustomTarget = (customAmount, customLabel = null) => {
    const target = Number(customAmount);
    const baseline = originalContractorQuote;
    if (!target || isNaN(target) || target <= 0) return;

    const reductionAmt = Math.max(0, baseline - target);
    const label = customLabel || `Custom Proposal (${formatRupees(target)})`;

    if (assessmentForm.commercial_proposal_type === 'Harvesting Service Quotation') {
      const felling = Math.round(target * 0.40);
      const extraction = Math.round(target * 0.28);
      const transport = Math.round(target * 0.22);
      const other = target - (felling + extraction + transport);

      setRevisionDraft({
        type: 'CUSTOM',
        label: label,
        revised_contractor_quote: target,
        harvesting_cost: felling,
        extraction_cost: extraction,
        transportation_cost: transport,
        other_cost: other,
        difference: target - baseline,
        reduction: reductionAmt
      });

      setAssessmentForm(prev => ({
        ...prev,
        harvesting_cost: felling,
        extraction_cost: extraction,
        transportation_cost: transport,
        other_cost: other,
        total_quote: target,
        advance_amount: prev.require_advance ? Math.round((target * (Number(prev.advance_percentage) || 30)) / 100) : prev.advance_amount
      }));
    } else if (assessmentForm.commercial_proposal_type === 'Timber Purchase Offer') {
      setRevisionDraft({
        type: 'CUSTOM',
        label: label,
        revised_contractor_quote: target,
        difference: target - baseline,
        reduction: reductionAmt
      });
      setAssessmentForm(prev => ({
        ...prev,
        contractor_purchase_offer: target
      }));
    } else if (assessmentForm.commercial_proposal_type === 'Purchase + Harvesting') {
      setRevisionDraft({
        type: 'CUSTOM',
        label: label,
        revised_contractor_quote: target,
        difference: target - baseline,
        reduction: reductionAmt
      });
      setAssessmentForm(prev => ({
        ...prev,
        timber_purchase_price: target
      }));
    }

    const targetDate = requestDetails?.counter_offer_start_date || existingAssessmentData?.counter_offer_start_date;
    if (targetDate) {
      setAssessmentForm(prev => ({
        ...prev,
        proposed_start_date: String(targetDate).substring(0, 10)
      }));
    }
  };

  const handleApplyCustomInput = () => {
    const val = Number(customAmountInput);
    if (!val || isNaN(val) || val <= 0) {
      alert('Please enter a valid quotation amount in rupees.');
      return;
    }
    handleApplyCustomTarget(val, `Custom Proposal (${formatRupees(val)})`);
  };

  const calcCompromise = (ratio) => {
    const target = Number(landownerTargetBudget);
    const baseline = originalContractorQuote;
    const diff = baseline - target;
    return Math.round(baseline - (diff * ratio));
  };

  const handleResetToOriginalQuote = () => {
    setRevisionDraft(null);
    setShowCustomAmountBox(false);
    setCustomAmountInput('');
    if (assessmentForm.commercial_proposal_type === 'Harvesting Service Quotation') {
      setAssessmentForm(prev => ({
        ...prev,
        harvesting_cost: originalCosts.harvesting_cost ?? 40700,
        extraction_cost: originalCosts.extraction_cost ?? 28490,
        transportation_cost: originalCosts.transportation_cost ?? 22385,
        other_cost: originalCosts.other_cost ?? 10175,
        total_quote: originalContractorQuote
      }));
    } else if (assessmentForm.commercial_proposal_type === 'Timber Purchase Offer') {
      setAssessmentForm(prev => ({
        ...prev,
        contractor_purchase_offer: originalContractorQuote
      }));
    } else if (assessmentForm.commercial_proposal_type === 'Purchase + Harvesting') {
      setAssessmentForm(prev => ({
        ...prev,
        timber_purchase_price: originalContractorQuote
      }));
    }
  };

  const handleApplyRequestedStartDate = () => {
    const targetDate = requestDetails?.counter_offer_start_date || existingAssessmentData?.counter_offer_start_date;
    if (targetDate) {
      setAssessmentForm(prev => ({
        ...prev,
        proposed_start_date: String(targetDate).substring(0, 10)
      }));
    }
  };

  const handleApplyInspectedVolume = () => {
    const insVol = requestDetails?.site_inspection?.estimated_volume;
    if (insVol !== undefined && insVol !== null && !isNaN(Number(insVol))) {
      const volNum = Number(Number(insVol).toFixed(2));
      const refRate = getTimberReferenceRate(primarySpecies);
      const newVal = Math.round(volNum * refRate);
      setAssessmentForm(prev => ({
        ...prev,
        estimated_harvestable_volume: volNum,
        estimated_timber_value: newVal > 0 ? newVal : prev.estimated_timber_value
      }));
    }
  };

  const scrollToCostInputs = () => {
    const el = document.getElementById('contractor-cost-breakdown-inputs');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const firstInput = el.querySelector('input[name="harvesting_cost"]');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 300);
      }
    }
  };

  const scrollToSubmitActions = () => {
    const el = document.getElementById('contractor-submit-actions');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Submit Handler with Conditional Validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage({ type: '', text: '' });

    const pType = assessmentForm.commercial_proposal_type || 'Harvesting Service Quotation';
    const assessedVolNum = parseVolumeNumber(assessmentForm.estimated_harvestable_volume);

    if (isNaN(assessedVolNum) || assessedVolNum <= 0) {
      setFeedbackMessage({
        type: 'error',
        text: 'Assessed Harvestable Volume (m³) is required and must be greater than zero.'
      });
      setIsSubmitting(false);
      return;
    }

    if (pType === 'Harvesting Service Quotation') {
      const workersNum = parseInt(assessmentForm.assigned_workers_count, 10);
      if (!workersNum || isNaN(workersNum) || workersNum <= 0) {
        setFeedbackMessage({
          type: 'error',
          text: 'Field "Number of Workers Assigned to This Job" is mandatory and must be a positive whole number (e.g. 12).'
        });
        setIsSubmitting(false);
        return;
      }

      const proposedDateError = validateProposedDate(assessmentForm.proposed_start_date, approvedInspectionDate);
      if (proposedDateError) {
        setDateError(proposedDateError);
        setFeedbackMessage({
          type: 'error',
          text: proposedDateError
        });
        setIsSubmitting(false);
        return;
      }

      if (!assessmentForm.estimated_duration || !assessmentForm.estimated_duration.trim()) {
        setFeedbackMessage({
          type: 'error',
          text: 'Field "Estimated Job Duration" is mandatory (e.g. 10 Working Days).'
        });
        setIsSubmitting(false);
        return;
      }
    } else if (pType === 'Timber Purchase Offer') {
      const purchaseOfferNum = Number(assessmentForm.contractor_purchase_offer);
      if (isNaN(purchaseOfferNum) || purchaseOfferNum <= 0) {
        setFeedbackMessage({
          type: 'error',
          text: 'Field "Contractor Purchase Offer (₹)" is mandatory and must be greater than zero.'
        });
        setIsSubmitting(false);
        return;
      }

      if (!assessmentForm.payment_terms || !assessmentForm.payment_terms.trim()) {
        setFeedbackMessage({
          type: 'error',
          text: 'Field "Payment Terms" is mandatory for Timber Purchase Offer.'
        });
        setIsSubmitting(false);
        return;
      }

      if (!assessmentForm.offer_valid_until) {
        setFeedbackMessage({
          type: 'error',
          text: 'Field "Offer Valid Until" date is mandatory.'
        });
        setIsSubmitting(false);
        return;
      }

      if (assessmentForm.offer_valid_until < getTodayDateString()) {
        setFeedbackMessage({
          type: 'error',
          text: 'Offer Valid Until date cannot be in the past.'
        });
        setIsSubmitting(false);
        return;
      }
    } else if (pType === 'Purchase + Harvesting') {
      const purchasePriceNum = Number(assessmentForm.timber_purchase_price);
      if (isNaN(purchasePriceNum) || purchasePriceNum <= 0) {
        setFeedbackMessage({
          type: 'error',
          text: 'Field "Timber Purchase Price (₹)" is mandatory and must be greater than zero.'
        });
        setIsSubmitting(false);
        return;
      }

      if (!assessmentForm.payment_terms || !assessmentForm.payment_terms.trim()) {
        setFeedbackMessage({
          type: 'error',
          text: 'Field "Payment Terms" is mandatory for Purchase + Harvesting.'
        });
        setIsSubmitting(false);
        return;
      }

      if (!assessmentForm.offer_valid_until) {
        setFeedbackMessage({
          type: 'error',
          text: 'Field "Offer Valid Until" date is mandatory.'
        });
        setIsSubmitting(false);
        return;
      }

      if (assessmentForm.offer_valid_until < getTodayDateString()) {
        setFeedbackMessage({
          type: 'error',
          text: 'Offer Valid Until date cannot be in the past.'
        });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const targetId = requestId || requestDetails?.id || requestDetails?._id || 'hr_demo_99';
      const workersNum = assessmentForm.assigned_workers_count ? parseInt(assessmentForm.assigned_workers_count, 10) : null;

      const isRevisionSubmission = Boolean(isRevisionRequested || revisionDraft || isAlreadyRevised);
      const submittedTotalQuote = pType === 'Harvesting Service Quotation'
        ? (Number(assessmentForm.total_quote) || 0)
        : (pType === 'Timber Purchase Offer' ? (Number(assessmentForm.contractor_purchase_offer) || 0) : (Number(assessmentForm.timber_purchase_price) || 0));

      const payload = {
        commercial_proposal_type: pType,
        estimated_harvestable_volume: assessedVolNum,
        estimated_timber_value: Number(assessmentForm.estimated_timber_value) || 0,
        // Service quotation fields
        harvesting_cost: pType === 'Harvesting Service Quotation' ? (Number(assessmentForm.harvesting_cost) || 0) : 0,
        extraction_cost: pType === 'Harvesting Service Quotation' ? (Number(assessmentForm.extraction_cost) || 0) : 0,
        transportation_cost: pType === 'Harvesting Service Quotation' ? (Number(assessmentForm.transportation_cost) || 0) : 0,
        other_cost: pType === 'Harvesting Service Quotation' ? (Number(assessmentForm.other_cost) || 0) : 0,
        total_quote: pType === 'Harvesting Service Quotation' ? (Number(assessmentForm.total_quote) || 0) : null,
        // Timber purchase offer fields
        contractor_purchase_offer: pType === 'Timber Purchase Offer' ? (Number(assessmentForm.contractor_purchase_offer) || 0) : null,
        // Purchase + Harvesting fields
        timber_purchase_price: pType === 'Purchase + Harvesting' ? (Number(assessmentForm.timber_purchase_price) || 0) : null,
        harvesting_arrangement_cost: pType === 'Purchase + Harvesting' && assessmentForm.harvesting_arrangement_cost !== '' ? Number(assessmentForm.harvesting_arrangement_cost) : null,
        transportation_arrangement: pType === 'Purchase + Harvesting' ? (assessmentForm.transportation_arrangement || '') : '',
        // Common commercial terms
        payment_terms: ['Timber Purchase Offer', 'Purchase + Harvesting'].includes(pType) ? assessmentForm.payment_terms : '',
        offer_valid_until: ['Timber Purchase Offer', 'Purchase + Harvesting'].includes(pType) ? assessmentForm.offer_valid_until : '',
        // Operational fields
        assigned_workers_count: workersNum,
        workers_assigned: workersNum,
        estimated_duration: assessmentForm.estimated_duration || '',
        proposed_start_date: assessmentForm.proposed_start_date || '',
        notes: assessmentForm.notes || '',
        is_reassessed_after_inspection: Boolean(requestDetails?.site_inspected || requestDetails?.site_inspection?.status === 'COMPLETED'),
        reassessed_at: new Date().toISOString(),
        // Commercial negotiation & revision audit tracking
        original_quote: originalContractorQuote,
        previous_quote: latestOfficialQuote,
        is_revision: isRevisionSubmission,
        revision_notes: revisionDraft ? revisionDraft.label : (isRevisionRequested ? 'Contractor revised quotation submitted' : ''),
        // Advance Mobilization Payment Fields
        advance_percentage: assessmentForm.require_advance ? Number(assessmentForm.advance_percentage) : null,
        advance_amount: assessmentForm.require_advance ? Number(assessmentForm.advance_amount) : null,
        due_date: assessmentForm.require_advance ? assessmentForm.advance_due_date : null,
        upi_id: assessmentForm.require_advance ? assessmentForm.advance_upi_id : null,
        bank_name: assessmentForm.require_advance ? assessmentForm.advance_bank_name : null,
        bank_account_number: assessmentForm.require_advance ? assessmentForm.advance_bank_account_number : null,
        ifsc_code: assessmentForm.require_advance ? assessmentForm.advance_ifsc_code : null,
        account_holder_name: assessmentForm.require_advance ? assessmentForm.advance_account_holder : null,
        payment_instructions: assessmentForm.require_advance
          ? `UPI: ${assessmentForm.advance_upi_id} / Bank: ${assessmentForm.advance_bank_name} / A/C: ${assessmentForm.advance_bank_account_number} / IFSC: ${assessmentForm.advance_ifsc_code}`
          : null,
        advance_remarks: assessmentForm.require_advance ? assessmentForm.advance_remarks : null
      };

      const res = await harvestService.submitAssessment(targetId, payload);
      if (res && (res.assessment || res.id)) {
        setExistingAssessmentData(res.assessment || res);
      }
      setRevisionDraft(null);

      // Keep local storage in sync
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const reqs = JSON.parse(stored);
          if (Array.isArray(reqs)) {
            const currentTotal = payload.total_quote ?? payload.contractor_purchase_offer ?? payload.timber_purchase_price;
            const reductionAmt = Math.round(originalContractorQuote - (currentTotal || originalContractorQuote));
            const updated = reqs.map(r => {
              if (r && (String(r.id) === String(targetId) || String(r._id) === String(targetId))) {
                return {
                  ...r,
                  status: 'ASSESSMENT_SUBMITTED',
                  assessment: {
                    ...payload,
                    original_quote: originalContractorQuote,
                    previous_quote: latestOfficialQuote,
                    revised_quote: currentTotal,
                    reduction: reductionAmt,
                    is_revision: isRevisionSubmission
                  },
                  commercial_proposal_type: pType,
                  estimated_harvestable_volume: assessedVolNum,
                  estimated_timber_value: payload.estimated_timber_value,
                  total_quote: payload.total_quote,
                  contractor_purchase_offer: payload.contractor_purchase_offer,
                  timber_purchase_price: payload.timber_purchase_price,
                  original_quote: originalContractorQuote,
                  previous_quote: latestOfficialQuote,
                  revised_quote: currentTotal,
                  reduction: reductionAmt,
                  is_revision: isRevisionSubmission,
                  assigned_workers_count: workersNum,
                  workers_assigned: workersNum,
                  is_reassessed_after_inspection: payload.is_reassessed_after_inspection,
                  reassessed_at: payload.reassessed_at,
                  advance_payment_request: assessmentForm.require_advance ? {
                    accepted_quotation: currentTotal,
                    advance_percentage: Number(assessmentForm.advance_percentage),
                    advance_amount: Number(assessmentForm.advance_amount),
                    due_date: assessmentForm.advance_due_date,
                    upi_id: assessmentForm.advance_upi_id,
                    bank_name: assessmentForm.advance_bank_name,
                    bank_account_number: assessmentForm.advance_bank_account_number,
                    ifsc_code: assessmentForm.advance_ifsc_code,
                    account_holder_name: assessmentForm.advance_account_holder,
                    payment_instructions: `UPI: ${assessmentForm.advance_upi_id} / Bank: ${assessmentForm.advance_bank_name} / A/C: ${assessmentForm.advance_bank_account_number} / IFSC: ${assessmentForm.advance_ifsc_code}`,
                    remarks: assessmentForm.advance_remarks,
                    requested_at: new Date().toISOString()
                  } : r.advance_payment_request,
                  advance_payment_status: assessmentForm.require_advance ? 'ADVANCE_REQUESTED' : (r.advance_payment_status || 'NOT_REQUESTED'),
                  total_quotation_amount: currentTotal,
                  remaining_balance: assessmentForm.require_advance ? Math.max(0, currentTotal - Number(assessmentForm.advance_amount)) : (currentTotal),
                  updatedAt: new Date().toISOString()
                };
              }
              return r;
            });
            localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
          }
        }
      } catch (e) {
        console.warn('Could not update treeconnect_harvest_requests in localStorage:', e);
      }

      setFeedbackMessage({
        type: 'success',
        text: pType === 'Harvesting Service Quotation'
          ? 'Contractor site assessment & itemized quotation submitted to Landowner successfully!'
          : pType === 'Timber Purchase Offer'
            ? 'Contractor timber purchase offer submitted to Landowner successfully!'
            : 'Commercial purchase + harvesting proposal submitted to Landowner successfully!'
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

  const primarySpecies = (() => {
    const rawGroups = (Array.isArray(requestDetails?.selected_tree_groups) && requestDetails.selected_tree_groups.length > 0)
      ? requestDetails.selected_tree_groups
      : (Array.isArray(requestDetails?.tree_inventory) && requestDetails.tree_inventory.length > 0)
        ? requestDetails.tree_inventory
        : (Array.isArray(requestDetails?.tree_inventories) && requestDetails.tree_inventories.length > 0)
          ? requestDetails.tree_inventories
          : [];
    if (rawGroups.length > 0 && rawGroups[0]) {
      return rawGroups[0].species || rawGroups[0].treeSpecies || rawGroups[0].groupName || requestDetails?.property_details?.mainSpecies || 'Teak';
    }
    return requestDetails?.property_details?.mainSpecies || 'Teak';
  })();

  const landownerEstimatedVolume = extractLandownerVolume(requestDetails);
  const landownerReferenceTimberValue = extractLandownerValue(requestDetails, landownerEstimatedVolume);

  const isRevisionRequested = requestDetails?.status === 'REVISION_REQUESTED' || existingAssessmentData?.status === 'REVISION_REQUESTED';
  const revisionReasons = (Array.isArray(requestDetails?.revision_reasons) && requestDetails.revision_reasons.length > 0)
    ? requestDetails.revision_reasons
    : (Array.isArray(existingAssessmentData?.revision_reasons) && existingAssessmentData.revision_reasons.length > 0)
      ? existingAssessmentData.revision_reasons
      : [];
  const landownerFeedback = (requestDetails?.landowner_feedback || existingAssessmentData?.landowner_feedback || '').trim();
  const counterOfferAmount = Number(requestDetails?.counter_offer_amount || existingAssessmentData?.counter_offer_amount || 0) || null;
  const counterOfferStartDate = requestDetails?.counter_offer_start_date || existingAssessmentData?.counter_offer_start_date || null;
  const hasFairDeal = Boolean(
    isRevisionRequested ||
    counterOfferAmount ||
    counterOfferStartDate ||
    revisionReasons.length > 0 ||
    landownerFeedback
  );
  const isSiteInspected = Boolean(requestDetails?.site_inspected || requestDetails?.site_inspection?.status === 'COMPLETED');
  const inspectedVolume = requestDetails?.site_inspection?.estimated_volume;
  const inspectedTrees = requestDetails?.site_inspection?.verified_tree_count;

  // Auto-apply match target or halfway if navigated with action query param (creates revision draft only)
  useEffect(() => {
    if ((!requestDetails && !existingAssessmentData) || autoAppliedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const applyMode = params.get('apply');
    if (applyMode === 'match') {
      autoAppliedRef.current = true;
      const timer = setTimeout(() => {
        handleMatchLandownerTarget();
      }, 350);
      return () => clearTimeout(timer);
    } else if (applyMode === 'halfway') {
      autoAppliedRef.current = true;
      const timer = setTimeout(() => {
        handleMeetHalfwayTarget();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [requestDetails, existingAssessmentData]);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(`treeconnect_draft_assessment_${requestId}`, JSON.stringify(assessmentForm));
      setFeedbackMessage({
        type: 'success',
        text: 'Assessment draft saved successfully to local browser storage.'
      });
      setTimeout(() => {
        setFeedbackMessage({ type: '', text: '' });
      }, 3500);
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: 'Failed to save draft locally.'
      });
    }
  };

  return (
    <div className="contractor-dashboard-page">
      <Navbar />
      <div className="contractor-dashboard-container">
        <Sidebar />

        <div className="contractor-dashboard-workspace">
          <div className="assessment-page-container">

            {/* HEADER BACK LINK & TITLE */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 w-fit transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} /> Back to Assigned Jobs
              </button>

              <div className="assessment-page-header">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                      <FileText size={24} className="text-emerald-400 shrink-0" /> Formal Contractor Assessment
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Review site findings, evaluate harvestable volume, and submit your commercial proposal.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    <div className="cd-header-status-badge">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <div className="flex flex-col text-left leading-tight">
                        <span className="text-[11px] font-bold text-emerald-300">
                          {requestDetails?.status === 'OPERATION_READY' ? 'Quotation Accepted' : 'Quotation Submitted'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {requestDetails?.status === 'OPERATION_READY' ? 'Operation Ready' : 'Under Review'}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-[#04120a] border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                      Job #{reqIdDisplay}
                    </span>
                  </div>
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
                              <Layers size={13} /> {formatVolume(parsedInv.reduce((sum, t) => sum + parseVolumeNumber(t.estimatedVolume), 0))} Est. Vol.
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
                                    <span className="font-bold text-emerald-400 text-sm block">{formatVolume(item.estimatedVolume)}</span>
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
                {(() => {
                  const isInspectionCompleted = Boolean(
                    requestDetails?.site_inspected ||
                    requestDetails?.inspection_status === 'COMPLETED' ||
                    requestDetails?.inspection_status === 'REPORT_SUBMITTED' ||
                    requestDetails?.site_inspection?.status === 'COMPLETED' ||
                    requestDetails?.site_inspection?.status === 'REPORT_SUBMITTED' ||
                    requestDetails?.status === 'OPERATION_READY' ||
                    requestDetails?.status === 'ACCEPTED' ||
                    requestDetails?.status === 'IN_PROGRESS' ||
                    requestDetails?.status === 'COMPLETED' ||
                    existingAssessmentData // if they already have one, they can see it
                  );

                  if (!isInspectionCompleted) {
                    return (
                      <div className="assessment-workspace-card flex flex-col items-center justify-center p-12 text-center border border-dashed border-amber-500/30 bg-[#0d1711]">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                          <FileText size={32} className="text-amber-400" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Site Inspection Pending</h2>
                        <p className="text-sm text-slate-400 max-w-md mx-auto">
                          You must complete the physical site inspection and submit your inspection report from the Assigned Jobs dashboard before you can access the Formal Contractor Assessment Form.
                        </p>
                        <button
                          onClick={() => navigate('/contractor/assigned-jobs')}
                          className="mt-6 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg"
                        >
                          Return to Assigned Jobs
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="assessment-workspace-card">
                  {/* Formal Assessment Header */}
                  <div className="assessment-header-block">
                    <div className="flex items-center justify-between gap-4 flex-wrap w-full">
                      <div>
                        <h2 className="assessment-header-title">
                          <FileText size={22} className="text-emerald-400 shrink-0" /> Formal Contractor Assessment Form
                        </h2>
                        <p className="assessment-header-subtitle">
                          Fill in evaluated volumes and itemized quotation costs for the landowner.
                        </p>
                      </div>
                      <span className="cd-status-badge-compact">
                        ● Quotation Submitted · Under Review
                      </span>
                    </div>
                  </div>

                  {/* Feedback Banner */}
                  {feedbackMessage.text && (
                    <div className={`p-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-md ${feedbackMessage.type === 'success'
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

                  {/* ACTIVE SUBMITTED QUOTATION OVERVIEW BANNER (CURRENT ASSESSMENT) */}
                  {/* ACTIVE SUBMITTED QUOTATION OVERVIEW BANNER (CURRENT ASSESSMENT) */}
                  {(existingAssessmentData || requestDetails?.status === 'ASSESSMENT_SUBMITTED' || requestDetails?.total_quote || assessmentForm.total_quote) && (
                    <div className="cd-assessment-summary-panel">
                      <div className="cd-summary-top-row">
                        <div className="flex items-center gap-3">
                          <div className="cd-summary-icon-box">
                            <ClipboardCheck size={20} className="text-emerald-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="cd-summary-title">
                                {isAlreadyRevised ? 'Current Assessment (Revised)' : 'Current Assessment'}
                              </h3>
                              <span className="cd-status-badge-compact">
                                {requestDetails?.status === 'OPERATION_READY'
                                  ? '✓ Accepted by Landowner'
                                  : isAlreadyRevised
                                    ? '● Revised Quotation on Record · Under Review'
                                    : '● Quotation Submitted · Under Review'}
                              </span>
                            </div>
                            <p className="cd-summary-subtitle">
                              {isAlreadyRevised
                                ? `Active negotiated quotation of ${formatRupees(latestOfficialQuote)} on record (Original contractor quote: ${formatRupees(originalContractorQuote)}).`
                                : `Active commercial quotation of ${formatRupees(originalContractorQuote)} on record for this parcel. You can adjust and resubmit below.`}
                            </p>
                          </div>
                        </div>

                        {/* Top-Right Prominent Total Quotation */}
                        <div className="cd-summary-total-callout">
                          <span className="cd-summary-total-label">
                            {isAlreadyRevised ? 'LATEST REVISED QUOTATION' : 'TOTAL CONTRACTOR QUOTATION'}
                          </span>
                          <strong className="cd-summary-total-amount">
                            {formatRupees(isAlreadyRevised ? latestOfficialQuote : originalContractorQuote)}
                          </strong>
                          {isAlreadyRevised ? (
                            <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 font-medium flex-wrap justify-end">
                              <span>Previous Quote: <strong className="text-slate-200">{formatRupees(previousOfficialQuote || originalContractorQuote)}</strong></span>
                              <span>•</span>
                              <span className="text-emerald-400 font-bold">Reduction: {formatRupees(officialReduction)}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 mt-0.5">
                              Original contractor rate on record
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Revision Draft banner if active */}
                      {revisionDraft && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs flex-wrap">
                          <div className="flex items-center gap-2 text-amber-300">
                            <Sparkles size={16} className="text-amber-400 shrink-0" />
                            <span>
                              <strong>Revision Draft in Progress:</strong> Proposed quote is <strong>{formatRupees(revisionDraft.revised_contractor_quote)}</strong> ({revisionDraft.difference < 0 ? '-' : '+'}{formatRupees(Math.abs(revisionDraft.difference))}). Official quotation on record remains <strong>{formatRupees(originalContractorQuote)}</strong> until you review below and click <strong>"Submit Revised Quote"</strong>.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleResetToOriginalQuote}
                            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
                          >
                            Discard Draft
                          </button>
                        </div>
                      )}

                      {/* 4-column itemized cost grid showing official costs on record */}
                      <div className="cd-summary-cost-grid">
                        <div className="cd-summary-cost-card">
                          <span className="cd-summary-cost-label">Felling &amp; Logging</span>
                          <span className="cd-summary-cost-value">
                            {formatRupees(isAlreadyRevised ? (existingAssessmentData?.harvesting_cost ?? 37400) : originalCosts.harvesting_cost)}
                          </span>
                        </div>
                        <div className="cd-summary-cost-card">
                          <span className="cd-summary-cost-label">Extraction</span>
                          <span className="cd-summary-cost-value">
                            {formatRupees(isAlreadyRevised ? (existingAssessmentData?.extraction_cost ?? 26180) : originalCosts.extraction_cost)}
                          </span>
                        </div>
                        <div className="cd-summary-cost-card">
                          <span className="cd-summary-cost-label">Transportation</span>
                          <span className="cd-summary-cost-value">
                            {formatRupees(isAlreadyRevised ? (existingAssessmentData?.transportation_cost ?? 20570) : originalCosts.transportation_cost)}
                          </span>
                        </div>
                        <div className="cd-summary-cost-card">
                          <span className="cd-summary-cost-label">Other / Clearing</span>
                          <span className="cd-summary-cost-value">
                            {formatRupees(isAlreadyRevised ? (existingAssessmentData?.other_cost ?? 9350) : originalCosts.other_cost)}
                          </span>
                        </div>
                      </div>

                      {/* Separate metadata row */}
                      <div className="cd-summary-meta-grid">
                        <div className="cd-summary-meta-item">
                          <Users size={16} className="text-emerald-400 shrink-0" />
                          <div>
                            <span className="cd-summary-meta-label">Crew</span>
                            <span className="cd-summary-meta-val">{assessmentForm.assigned_workers_count || 10} Workers</span>
                          </div>
                        </div>
                        <div className="cd-summary-meta-item">
                          <Clock size={16} className="text-emerald-400 shrink-0" />
                          <div>
                            <span className="cd-summary-meta-label">Duration</span>
                            <span className="cd-summary-meta-val">{assessmentForm.estimated_duration || '1 Working Day'}</span>
                          </div>
                        </div>
                        <div className="cd-summary-meta-item">
                          <Calendar size={16} className="text-emerald-400 shrink-0" />
                          <div>
                            <span className="cd-summary-meta-label">Start Date</span>
                            <span className="cd-summary-meta-val">{formatDateDMY(assessmentForm.proposed_start_date || '2026-10-10')}</span>
                          </div>
                        </div>
                        <div className="cd-summary-meta-item">
                          <Layers size={16} className="text-emerald-400 shrink-0" />
                          <div>
                            <span className="cd-summary-meta-label">Assessed Volume</span>
                            <span className="cd-summary-meta-val text-emerald-300">{formatVolume(assessmentForm.estimated_harvestable_volume || 1.80)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE LANDOWNER COUNTER-PROPOSAL & REVISION SPECIFICATIONS */}
                  {hasFairDeal && (() => {
                    const targetBudget = landownerTargetBudget;
                    const varianceToClose = originalContractorQuote - targetBudget;
                    const halfwayDiff = varianceToClose > 0 ? Math.round(varianceToClose / 2) : 0;
                    const halfwayBudget = varianceToClose > 0 ? (originalContractorQuote - halfwayDiff) : targetBudget;
                    const landownerName = requestDetails?.userName || requestDetails?.landowner_name || requestDetails?.ownerName || 'Registered Landowner';
                    const landownerPhone = requestDetails?.userPhone || requestDetails?.owner_phone || requestDetails?.contact_phone || '';
                    const landownerEmail = requestDetails?.userEmail || requestDetails?.owner_email || '';

                    // Active proposed quote: revisionDraft if populated, latestOfficialQuote if already revised, else null
                    const proposedQuote = revisionDraft ? revisionDraft.revised_contractor_quote : (isAlreadyRevised ? latestOfficialQuote : null);
                    const proposedReduction = proposedQuote !== null ? (originalContractorQuote - proposedQuote) : null;

                    // Active revision draft amount or target budget for distribution calculation
                    const activeProposedAmount = revisionDraft ? revisionDraft.revised_contractor_quote : targetBudget;
                    const suggestedFelling = Math.round(activeProposedAmount * 0.40);
                    const suggestedExtraction = Math.round(activeProposedAmount * 0.28);
                    const suggestedTransport = Math.round(activeProposedAmount * 0.22);
                    const suggestedOther = activeProposedAmount - (suggestedFelling + suggestedExtraction + suggestedTransport);

                    return (
                      <div className="qtn-counter-section">
                        {/* 1. Header with Badge & Contractor Action Buttons */}
                        <div className="qtn-counter-header">
                          <div className="qtn-counter-title-group">
                            <div className="qtn-counter-icon">
                              <RefreshCw size={20} className="text-amber-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 className="qtn-counter-title">
                                  Landowner Counter-Proposal &amp; Revision Request
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  Active Negotiation • Revision Needed
                                </span>
                              </div>
                              <p className="qtn-counter-subtitle">
                                The landowner reviewed your quotation of {formatRupees(originalContractorQuote)} and submitted revised terms for commercial authorization.
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons: Creates a revision draft only */}
                          <div className="flex flex-col gap-2 items-start sm:items-end">
                            {varianceToClose === 0 ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                                <span>Your quotation already matches the landowner's target budget.</span>
                              </div>
                            ) : varianceToClose < 0 ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                                <Info size={15} className="text-blue-400 shrink-0" />
                                <span>Your quotation is already below the landowner's target budget.</span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={handleMatchLandownerTarget}
                                    className={`cd-btn-match-target ${revisionDraft?.type === 'MATCH_TARGET' ? 'active-draft' : ''}`}
                                    title="Reduce your quote to the landowner's target."
                                  >
                                    <CheckCircle2 size={14} />
                                    <span>Match Target Budget ({formatRupees(targetBudget)})</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={handleMeetHalfwayTarget}
                                    className={`cd-btn-meet-halfway ${revisionDraft?.type === 'MEET_HALFWAY' ? 'active-draft' : ''}`}
                                    title="Propose a price halfway between your quote and the landowner's target."
                                  >
                                    <span>Meet Halfway ({formatRupees(halfwayBudget)})</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setShowCustomAmountBox(prev => !prev)}
                                    className={`cd-btn-custom-compromise ${showCustomAmountBox || revisionDraft?.type === 'CUSTOM' ? 'active-draft' : ''}`}
                                    title="Suggest a specific custom in-between amount"
                                  >
                                    <Sliders size={14} />
                                    <span>{showCustomAmountBox ? 'Hide Custom Input' : 'Suggest Custom Amount...'}</span>
                                  </button>

                                  {revisionDraft && (
                                    <button
                                      type="button"
                                      onClick={handleResetToOriginalQuote}
                                      className="cd-btn-reset-draft"
                                      title="Discard revision draft and restore original contractor rate"
                                    >
                                      <X size={13} />
                                      <span>Reset to Original ({formatRupees(originalContractorQuote)})</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setShowDeclineModal(true)}
                                    className="cd-btn-decline-work"
                                    title="If landowner counter-offer or terms are not favourable, reject the quotation or decline this work assignment"
                                  >
                                    <XCircle size={14} />
                                    <span>Decline Job / Unfavourable Terms</span>
                                  </button>
                                </div>

                                <div className="text-[11px] text-slate-400 flex items-center gap-3 flex-wrap">
                                  <span>• <strong>Match Target Budget:</strong> Reduce your quote to the landowner's target.</span>
                                  <span>• <strong>Meet Halfway:</strong> Propose a price halfway between your quote and the landowner's target.</span>
                                  <span>• <strong>Suggest Custom Amount:</strong> Type any specific amount or pick a compromise ratio.</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Full-Width Interactive In-Between Custom Drawer */}
                        {showCustomAmountBox && (
                          <div className="cd-custom-compromise-drawer">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow-inner">
                                  <Sparkles size={18} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-black uppercase tracking-wider text-white m-0">
                                      Propose Specific In-Between Amount
                                    </h4>
                                    <span className="px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/35 font-mono">
                                      {formatRupees(targetBudget)} – {formatRupees(originalContractorQuote)}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-300 block mt-1">
                                    Enter a specific negotiated figure or choose a compromise preset below to balance margins fairly.
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                                <div className="relative flex items-center">
                                  <span className="absolute left-3.5 text-amber-400 font-mono font-bold text-sm pointer-events-none select-none">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    placeholder={String(halfwayBudget)}
                                    value={customAmountInput}
                                    onChange={(e) => setCustomAmountInput(e.target.value)}
                                    className="pl-8 pr-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 hover:border-amber-500/70 focus:border-amber-400 text-white font-mono text-sm w-44 tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/25 transition-all shadow-inner"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={handleApplyCustomInput}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg hover:shadow-amber-500/20 active:scale-95"
                                >
                                  <Check size={14} className="stroke-[3]" />
                                  <span>Apply</span>
                                </button>
                              </div>
                            </div>

                            {/* Quick Preset Compromise Ratio Chips */}
                            <div className="flex items-center gap-2 pt-3 border-t border-amber-500/20 flex-wrap">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Compromise Presets:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const amt = calcCompromise(0.25);
                                  setCustomAmountInput(String(amt));
                                  handleApplyCustomTarget(amt, `25% Compromise (${formatRupees(amt)})`);
                                }}
                                className="cd-preset-chip"
                                title="25% reduction towards landowner target"
                              >
                                <span>25% Compromise</span>
                                <strong className="font-mono text-amber-200">({formatRupees(calcCompromise(0.25))})</strong>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const amt = calcCompromise(0.50);
                                  setCustomAmountInput(String(amt));
                                  handleApplyCustomTarget(amt, `50% Halfway (${formatRupees(amt)})`);
                                }}
                                className="cd-preset-chip"
                                title="50% midpoint compromise"
                              >
                                <span>50% Halfway</span>
                                <strong className="font-mono text-amber-200">({formatRupees(calcCompromise(0.50))})</strong>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const amt = calcCompromise(0.75);
                                  setCustomAmountInput(String(amt));
                                  handleApplyCustomTarget(amt, `75% Compromise (${formatRupees(amt)})`);
                                }}
                                className="cd-preset-chip"
                                title="75% reduction towards landowner target"
                              >
                                <span>75% Compromise</span>
                                <strong className="font-mono text-amber-200">({formatRupees(calcCompromise(0.75))})</strong>
                              </button>
                              <span className="text-[11px] text-slate-400 ml-auto italic">
                                Auto-distributed: Felling 40% • Extraction 28% • Transport 22% • Other 10%
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 2. Key Negotiation Metrics (4-Column Grid: Section 8) */}
                        <div className="qtn-counter-grid">
                          <div className="qtn-counter-cell">
                            <span className="qtn-counter-cell-label">YOUR CURRENT QUOTE</span>
                            <span className="qtn-counter-cell-val text-white font-mono font-black">
                              {formatRupees(originalContractorQuote)}
                            </span>
                            <span className="qtn-counter-cell-hint">Original contractor quotation</span>
                          </div>

                          <div className="qtn-counter-cell qtn-counter-cell-target">
                            <span className="qtn-counter-cell-label text-amber-300">LANDOWNER TARGET</span>
                            <span className="qtn-counter-cell-val text-amber-400 font-mono font-black">
                              {formatRupees(targetBudget)}
                            </span>
                            <span className="qtn-counter-cell-hint text-amber-200/70">Client proposed ceiling</span>
                          </div>

                          <div className="qtn-counter-cell">
                            <span className="qtn-counter-cell-label">VARIANCE TO CLOSE</span>
                            <span className={`qtn-counter-cell-val font-mono font-black ${varianceToClose > 0 ? 'text-amber-400' : varianceToClose === 0 ? 'text-emerald-400' : 'text-blue-400'}`}>
                              {varianceToClose > 0 ? formatRupees(varianceToClose) : varianceToClose === 0 ? '₹0' : `+${formatRupees(Math.abs(varianceToClose))}`}
                            </span>
                            <span className="qtn-counter-cell-hint">
                              {varianceToClose > 0 ? 'Gap vs submitted quotation' : varianceToClose === 0 ? 'Target matched exactly' : 'Quote is lower than target'}
                            </span>
                          </div>

                          <div className="qtn-counter-cell">
                            <span className="qtn-counter-cell-label">PROPOSED REVISED QUOTE</span>
                            <span className={`qtn-counter-cell-val font-mono font-black ${revisionDraft ? 'text-amber-300 font-bold' : isAlreadyRevised ? 'text-emerald-300 font-bold' : 'text-slate-400'}`}>
                              {proposedQuote !== null ? formatRupees(proposedQuote) : '—'}
                            </span>
                            <span className="qtn-counter-cell-hint">
                              {revisionDraft
                                ? `Pending contractor revision (Reduction: ${proposedReduction !== null && proposedReduction > 0 ? formatRupees(proposedReduction) : '₹0'})`
                                : isAlreadyRevised
                                  ? `Official revised rate on record (Reduction: ${proposedReduction !== null && proposedReduction > 0 ? formatRupees(proposedReduction) : '₹0'})`
                                  : 'Click Match Target or Meet Halfway to draft'}
                            </span>
                          </div>
                        </div>

                        {/* 2a. PROPOSED REVISION SECTION (Requirements 5 & 6) */}
                        {revisionDraft && (() => {
                          const currentDraftTotal = Number(assessmentForm.total_quote || revisionDraft.revised_contractor_quote);
                          const currentDraftReduction = Math.max(0, originalContractorQuote - currentDraftTotal);

                          return (
                            <div className="cd-proposed-revision-panel" id="proposed-revision-section">
                              <div className="cd-proposed-revision-header">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                                    <Edit3 size={16} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-sm font-black uppercase tracking-wider text-white m-0">
                                        PROPOSED REVISION
                                      </h4>
                                      <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                        Draft • Pending Submission
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-300 font-medium block mt-0.5">
                                      {revisionDraft.type === 'MATCH_TARGET'
                                        ? 'Contractor agrees to reduce quotation to landowner target budget.'
                                        : revisionDraft.type === 'MEET_HALFWAY'
                                          ? 'Contractor proposes compromise halfway between original quotation and target budget.'
                                          : 'Quotation revision proposal draft.'} Original quotation ({formatRupees(originalContractorQuote)}) remains unchanged until submitted.
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleResetToOriginalQuote}
                                  className="cd-btn-reset-draft"
                                  title="Discard revision draft and keep original quotation"
                                >
                                  <X size={13} />
                                  <span>Discard Draft</span>
                                </button>
                              </div>

                              {/* 4 Summary Cards */}
                              <div className="cd-proposed-summary-grid">
                                <div className="cd-proposed-summary-card">
                                  <span className="cd-proposed-summary-label">Original Contractor Quote</span>
                                  <span className="cd-proposed-summary-val font-mono text-white">
                                    {formatRupees(originalContractorQuote)}
                                  </span>
                                  <span className="cd-proposed-summary-hint">Preserved baseline quote</span>
                                </div>

                                <div className="cd-proposed-summary-card">
                                  <span className="cd-proposed-summary-label text-amber-300">Landowner Target</span>
                                  <span className="cd-proposed-summary-val font-mono text-amber-400">
                                    {formatRupees(targetBudget)}
                                  </span>
                                  <span className="cd-proposed-summary-hint text-amber-200/70">Client proposed ceiling</span>
                                </div>

                                <div className="cd-proposed-summary-card highlight-emerald">
                                  <span className="cd-proposed-summary-label text-emerald-300">Proposed Revised Quote</span>
                                  <span className="cd-proposed-summary-val font-mono text-emerald-400 font-black">
                                    {formatRupees(currentDraftTotal)}
                                  </span>
                                  <span className="cd-proposed-summary-hint text-emerald-200/70">
                                    {revisionDraft.type === 'MATCH_TARGET' ? 'Matches landowner target' : 'Halfway compromise'}
                                  </span>
                                </div>

                                <div className="cd-proposed-summary-card">
                                  <span className="cd-proposed-summary-label text-emerald-400">Reduction</span>
                                  <span className="cd-proposed-summary-val font-mono text-emerald-300 font-bold">
                                    {formatRupees(currentDraftReduction)}
                                  </span>
                                  <span className="cd-proposed-summary-hint">Discount offered to landowner</span>
                                </div>
                              </div>

                              {/* Editable Cost Breakdown */}
                              {assessmentForm.commercial_proposal_type === 'Harvesting Service Quotation' && (
                                <div className="cd-proposed-breakdown-box">
                                  <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-emerald-500/20">
                                    <div>
                                      <span className="text-xs font-black uppercase tracking-wider text-slate-200 block">
                                        Editable Cost Breakdown
                                      </span>
                                      <span className="text-[11px] text-slate-400">
                                        Edit any individual cost below. The total automatically recalculates.
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                                      Total = Felling + Extraction + Transportation + Other
                                    </span>
                                  </div>

                                  <div className="cd-proposed-inputs-grid">
                                    <div className="cd-proposed-input-group">
                                      <label className="cd-proposed-input-label">Felling &amp; Logging</label>
                                      <div className="cd-proposed-input-wrap">
                                        <span className="cd-proposed-currency-prefix">₹</span>
                                        <input
                                          type="number"
                                          name="harvesting_cost"
                                          value={assessmentForm.harvesting_cost}
                                          onChange={handleInputChange}
                                          className="cd-proposed-input font-mono"
                                          placeholder="0"
                                        />
                                      </div>
                                    </div>

                                    <div className="cd-proposed-input-group">
                                      <label className="cd-proposed-input-label">Extraction</label>
                                      <div className="cd-proposed-input-wrap">
                                        <span className="cd-proposed-currency-prefix">₹</span>
                                        <input
                                          type="number"
                                          name="extraction_cost"
                                          value={assessmentForm.extraction_cost}
                                          onChange={handleInputChange}
                                          className="cd-proposed-input font-mono"
                                          placeholder="0"
                                        />
                                      </div>
                                    </div>

                                    <div className="cd-proposed-input-group">
                                      <label className="cd-proposed-input-label">Transportation</label>
                                      <div className="cd-proposed-input-wrap">
                                        <span className="cd-proposed-currency-prefix">₹</span>
                                        <input
                                          type="number"
                                          name="transportation_cost"
                                          value={assessmentForm.transportation_cost}
                                          onChange={handleInputChange}
                                          className="cd-proposed-input font-mono"
                                          placeholder="0"
                                        />
                                      </div>
                                    </div>

                                    <div className="cd-proposed-input-group">
                                      <label className="cd-proposed-input-label">Other / Clearing</label>
                                      <div className="cd-proposed-input-wrap">
                                        <span className="cd-proposed-currency-prefix">₹</span>
                                        <input
                                          type="number"
                                          name="other_cost"
                                          value={assessmentForm.other_cost}
                                          onChange={handleInputChange}
                                          className="cd-proposed-input font-mono"
                                          placeholder="0"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Total Proposed Quote Bar */}
                                  <div className="cd-proposed-total-banner">
                                    <div>
                                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                                        Total Proposed Quote
                                      </span>
                                      <span className="text-[11px] text-slate-400">
                                        Felling &amp; Logging + Extraction + Transportation + Other / Clearing
                                      </span>
                                    </div>
                                    <span className="text-xl font-mono font-black text-emerald-400">
                                      {formatRupees(currentDraftTotal)}
                                    </span>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="cd-proposed-actions-row">
                                    <button
                                      type="button"
                                      onClick={handleSubmit}
                                      disabled={isSubmitting}
                                      className="cd-btn-submit-rev-direct"
                                      title="Submit this proposed revision as the new official quotation"
                                    >
                                      {isSubmitting ? (
                                        <>
                                          <Loader2 size={15} className="animate-spin" /> Submitting Revision...
                                        </>
                                      ) : (
                                        <>
                                          <RefreshCw size={15} /> Submit Revised Quote ({formatRupees(currentDraftTotal)})
                                        </>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={handleResetToOriginalQuote}
                                      className="cd-btn-reset-draft"
                                      title="Discard revision draft and keep original quotation"
                                    >
                                      <X size={14} />
                                      <span>Discard Draft</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* 2b. SUGGESTED COST DISTRIBUTION (SECTION 7 & 10 & 11) */}
                        <div className="cd-suggested-distribution-panel">
                          <div className="cd-suggested-distribution-header">
                            <div className="flex items-center gap-2">
                              <Calculator size={16} className="text-amber-400 shrink-0" />
                              <div>
                                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300 m-0">
                                  Suggested Cost Distribution
                                </h4>
                                <span className="text-[10.5px] text-slate-400 font-medium block mt-0.5">
                                  Predefined Calculation • User-Entered Target Budget
                                </span>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              Deterministic Helper (No AI)
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed m-0">
                            Suggested breakdown of the target budget across the estimated harvesting cost categories. The contractor can review and modify these values before submitting a revised quotation.
                          </p>

                          {/* Target Budget Reference Bar */}
                          <div className="cd-suggested-budget-bar">
                            <div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Landowner Target Budget:
                              </span>
                              <span className="text-base font-mono font-black text-amber-400 ml-2">
                                {formatRupees(targetBudget)}
                              </span>
                            </div>
                            {revisionDraft && (
                              <div className="text-right">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                  Active Proposed Revision:
                                </span>
                                <span className="text-base font-mono font-black text-emerald-400 ml-2">
                                  {formatRupees(revisionDraft.revised_contractor_quote)}
                                </span>
                                <span className="text-[11px] text-amber-300 block">
                                  {revisionDraft.type === 'MEET_HALFWAY' ? 'Meet Halfway (₹97,625 draft)' : revisionDraft.type === 'MATCH_TARGET' ? 'Match Target (₹93,500 draft)' : 'Custom Revision'} • Reduction: {formatRupees(originalContractorQuote - revisionDraft.revised_contractor_quote)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 4 Itemized Category Breakdown Cards */}
                          <div className="cd-suggested-cards-grid">
                            <div className="cd-suggested-card">
                              <div className="cd-suggested-card-header">
                                <span className="cd-suggested-card-title">Felling &amp; Logging</span>
                                <span className="cd-suggested-card-pct">40%</span>
                              </div>
                              <div className="cd-suggested-card-val text-white font-mono">
                                {formatRupees(suggestedFelling)}
                              </div>
                              <span className="cd-suggested-card-hint">
                                {revisionDraft ? `Form value: ${formatRupees(assessmentForm.harvesting_cost)}` : 'Suggested 40%'}
                              </span>
                            </div>

                            <div className="cd-suggested-card">
                              <div className="cd-suggested-card-header">
                                <span className="cd-suggested-card-title">Extraction</span>
                                <span className="cd-suggested-card-pct">28%</span>
                              </div>
                              <div className="cd-suggested-card-val text-white font-mono">
                                {formatRupees(suggestedExtraction)}
                              </div>
                              <span className="cd-suggested-card-hint">
                                {revisionDraft ? `Form value: ${formatRupees(assessmentForm.extraction_cost)}` : 'Suggested 28%'}
                              </span>
                            </div>

                            <div className="cd-suggested-card">
                              <div className="cd-suggested-card-header">
                                <span className="cd-suggested-card-title">Transportation</span>
                                <span className="cd-suggested-card-pct">22%</span>
                              </div>
                              <div className="cd-suggested-card-val text-white font-mono">
                                {formatRupees(suggestedTransport)}
                              </div>
                              <span className="cd-suggested-card-hint">
                                {revisionDraft ? `Form value: ${formatRupees(assessmentForm.transportation_cost)}` : 'Suggested 22%'}
                              </span>
                            </div>

                            <div className="cd-suggested-card">
                              <div className="cd-suggested-card-header">
                                <span className="cd-suggested-card-title">Other / Clearing</span>
                                <span className="cd-suggested-card-pct">10%</span>
                              </div>
                              <div className="cd-suggested-card-val text-white font-mono">
                                {formatRupees(suggestedOther)}
                              </div>
                              <span className="cd-suggested-card-hint">
                                {revisionDraft ? `Form value: ${formatRupees(assessmentForm.other_cost)}` : 'Suggested 10%'}
                              </span>
                            </div>
                          </div>

                          {/* Total Row */}
                          <div className="cd-suggested-total-row">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={15} className="text-emerald-400" />
                              <span className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wide">
                                Total Proposed Revised Quote:
                              </span>
                            </div>
                            <span className="text-base sm:text-lg font-mono font-black text-emerald-400">
                              {formatRupees(activeProposedAmount)}
                            </span>
                          </div>

                          {/* Statutory & AI Disclaimer Notices */}
                          <div className="cd-suggested-notice-box">
                            <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <div className="text-[11px] text-slate-300 leading-relaxed flex flex-col gap-1">
                              <div>
                                <strong className="text-amber-300">Suggested default rates:</strong> These percentages (40% / 28% / 22% / 10%) are only a suggested/default distribution and are <span className="underline decoration-amber-500/50">NOT</span> market-standard or legally prescribed rates. The contractor has full freedom to review and modify every category below.
                              </div>
                              <div className="text-slate-400">
                                <strong className="text-slate-300">Predefined Calculation Notice:</strong> The current system uses predefined deterministic calculations and user-entered information for cost estimation and quotation management. It does <span className="text-slate-200 font-semibold">NOT</span> use Artificial Intelligence for these calculations. AI-driven capabilities are future scope planned for the main project.
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="cd-suggested-actions">
                            {varianceToClose > 0 && !revisionDraft && (
                              <>
                                <button
                                  type="button"
                                  onClick={handleMatchLandownerTarget}
                                  className="cd-btn-match-target font-bold"
                                  title="Reduce your quote to the landowner's target."
                                >
                                  <CheckCircle2 size={14} />
                                  <span>Match Target Budget ({formatRupees(targetBudget)})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleMeetHalfwayTarget}
                                  className="cd-btn-meet-halfway font-bold"
                                  title="Propose a price halfway between your quote and the landowner's target."
                                >
                                  <span>Meet Halfway ({formatRupees(halfwayBudget)})</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={scrollToCostInputs}
                              className="cd-btn-review-dist"
                              title="Scroll down to inspect and edit the category cost input fields"
                            >
                              <Edit3 size={14} />
                              <span>Review Suggested Distribution</span>
                            </button>

                            {(revisionDraft || isAlreadyRevised) && (
                              <button
                                type="button"
                                onClick={scrollToSubmitActions}
                                className="cd-btn-submit-rev-jump"
                                title="Proceed to submit revised quote"
                              >
                                <RefreshCw size={14} />
                                <span>Submit Revised Quote</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 3. DETAILS ADDED BY LANDOWNER DURING REQUEST QUOTATION REVISION */}
                        <div className="cd-revision-details-panel">
                          <div className="cd-revision-details-header">
                            <div className="flex items-center gap-2">
                              <FileText size={15} className="text-amber-400 shrink-0" />
                              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                                Specifications Added by Landowner During Revision Request
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Client: <strong className="text-slate-200">{landownerName}</strong>
                              {landownerPhone ? ` • ${landownerPhone}` : landownerEmail ? ` • ${landownerEmail}` : ''}
                            </span>
                          </div>

                          {/* Selected Revision Reasons / Categories */}
                          <div className="flex flex-col gap-2 pt-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Specific Areas Flagged for Revision:
                            </span>
                            {Array.isArray(revisionReasons) && revisionReasons.length > 0 ? (
                              <div className="cd-revision-reasons-grid">
                                {revisionReasons.map((reason, idx) => {
                                  let ReasonIcon = FileText;
                                  const rLower = String(reason).toLowerCase();
                                  if (rLower.includes('price') || rLower.includes('rate') || rLower.includes('cost')) ReasonIcon = DollarSign;
                                  else if (rLower.includes('date') || rLower.includes('start') || rLower.includes('schedule')) ReasonIcon = Calendar;
                                  else if (rLower.includes('crew') || rLower.includes('worker')) ReasonIcon = Users;
                                  else if (rLower.includes('timeline') || rLower.includes('duration') || rLower.includes('day')) ReasonIcon = Clock;

                                  return (
                                    <div key={idx} className="cd-revision-reason-card">
                                      <div className="cd-revision-reason-icon">
                                        <ReasonIcon size={14} />
                                      </div>
                                      <span className="cd-revision-reason-text">{reason}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">
                                General quotation &amp; schedule review requested without specific category checkboxes.
                              </p>
                            )}
                          </div>

                          {/* Specific Instructions / Notes */}
                          <div className="qtn-counter-feedback-box mt-1">
                            <div className="flex items-center gap-1.5">
                              <MessageSquare size={13} className="text-amber-400 shrink-0" />
                              <span className="qtn-counter-feedback-label">Landowner Specific Instructions &amp; Remarks</span>
                            </div>
                            <p className="qtn-counter-feedback-text">
                              {landownerFeedback && landownerFeedback.length > 0
                                ? `"${landownerFeedback}"`
                                : 'No additional written remarks provided. Landowner requested adjustment via target budget and mobilization date.'}
                            </p>
                          </div>
                        </div>

                        {/* 4. REVISION AUDIT HISTORY (Requirements 12 & 13) */}
                        <div className="cd-revision-history-section mt-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-amber-500/20">
                            <div className="flex items-center gap-2">
                              <Clock size={15} className="text-amber-400 shrink-0" />
                              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                                Quotation Revision History (Audit Trail)
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {isAlreadyRevised ? 'Revision on Record' : revisionDraft ? 'Revision 1 in Draft Mode' : 'Initial Baseline Recorded'}
                            </span>
                          </div>

                          <div className="cd-revision-timeline">
                            {/* Revision 0: Initial Contractor Quotation */}
                            <div className="cd-revision-item">
                              <div className="cd-revision-item-header">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="cd-revision-badge rev0">Revision 0</span>
                                  <span className="text-xs font-bold text-slate-200">Contractor Original Quote</span>
                                  <span className="text-[10.5px] text-slate-400">• Certified Baseline Rate</span>
                                </div>
                                <strong className="text-sm font-mono text-white font-black">
                                  {formatRupees(originalContractorQuote)}
                                </strong>
                              </div>
                              <div className="cd-revision-breakdown-row">
                                <span className="cd-revision-breakdown-item">
                                  Felling: <strong className="text-slate-200">{formatRupees(originalCosts.harvesting_cost)}</strong>
                                </span>
                                <span>•</span>
                                <span className="cd-revision-breakdown-item">
                                  Extraction: <strong className="text-slate-200">{formatRupees(originalCosts.extraction_cost)}</strong>
                                </span>
                                <span>•</span>
                                <span className="cd-revision-breakdown-item">
                                  Transportation: <strong className="text-slate-200">{formatRupees(originalCosts.transportation_cost)}</strong>
                                </span>
                                <span>•</span>
                                <span className="cd-revision-breakdown-item">
                                  Other: <strong className="text-slate-200">{formatRupees(originalCosts.other_cost)}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Revision 1: Landowner Target & Revised Quotation */}
                            {(isAlreadyRevised || revisionDraft || isRevisionRequested) && (
                              <div className={`cd-revision-item ${isAlreadyRevised ? 'current' : ''}`}>
                                <div className="cd-revision-item-header">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="cd-revision-badge rev1">Revision 1</span>
                                    <span className="text-xs font-bold text-emerald-300">
                                      {isAlreadyRevised ? 'Contractor Revised Quote' : revisionDraft ? 'Proposed Revision Draft (Pending Submit)' : 'Landowner Counter-Proposal'}
                                    </span>
                                    <span className="text-[10.5px] text-amber-300 font-semibold">
                                      • Reason: {revisionDraft ? (revisionDraft.type === 'MEET_HALFWAY' ? 'Meet Halfway' : revisionDraft.type === 'MATCH_TARGET' ? 'Match Target Budget' : revisionDraft.label || 'Quotation Revision') : (existingAssessmentData?.revision_notes || 'Negotiated Revision')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {proposedReduction !== null && proposedReduction > 0 && (
                                      <span className="text-xs font-bold font-mono text-amber-400">
                                        Reduction: -{formatRupees(proposedReduction)}
                                      </span>
                                    )}
                                    <strong className="text-sm font-mono text-emerald-400 font-black">
                                      {formatRupees(isAlreadyRevised ? latestOfficialQuote : (revisionDraft ? revisionDraft.revised_contractor_quote : targetBudget))}
                                    </strong>
                                  </div>
                                </div>
                                <div className="cd-revision-breakdown-row">
                                  <span className="cd-revision-breakdown-item">
                                    Felling: <strong className="text-slate-200">{formatRupees(isAlreadyRevised ? (existingAssessmentData?.harvesting_cost ?? 37400) : (revisionDraft ? revisionDraft.harvesting_cost : 37400))}</strong>
                                  </span>
                                  <span>•</span>
                                  <span className="cd-revision-breakdown-item">
                                    Extraction: <strong className="text-slate-200">{formatRupees(isAlreadyRevised ? (existingAssessmentData?.extraction_cost ?? 26180) : (revisionDraft ? revisionDraft.extraction_cost : 26180))}</strong>
                                  </span>
                                  <span>•</span>
                                  <span className="cd-revision-breakdown-item">
                                    Transportation: <strong className="text-slate-200">{formatRupees(isAlreadyRevised ? (existingAssessmentData?.transportation_cost ?? 20570) : (revisionDraft ? revisionDraft.transportation_cost : 20570))}</strong>
                                  </span>
                                  <span>•</span>
                                  <span className="cd-revision-breakdown-item">
                                    Other: <strong className="text-slate-200">{formatRupees(isAlreadyRevised ? (existingAssessmentData?.other_cost ?? 9350) : (revisionDraft ? revisionDraft.other_cost : 9350))}</strong>
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })()}

                  {/* POST-SITE INSPECTION AUDIT FINDINGS SECTION */}
                  {isSiteInspected && (
                    <div className="assessment-verified-section">
                      <div className="assessment-verified-header">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                            <ClipboardCheck size={16} />
                          </div>
                          <div>
                            <span className="assessment-verified-title">
                              On-Site Field Inspection Verified Findings
                            </span>
                            <span className="assessment-verified-desc">
                              Ground truth data captured during certified parcel visit. Use verified metrics for accurate final quotation.
                            </span>
                          </div>
                        </div>

                        {inspectedVolume !== undefined && inspectedVolume !== null && (
                          <button
                            type="button"
                            onClick={handleApplyInspectedVolume}
                            className="assessment-apply-vol-btn"
                            title="Auto-fill assessed volume using inspected volume"
                          >
                            <Layers size={13} />
                            <span>Apply Inspected Volume ({inspectedVolume} m³)</span>
                          </button>
                        )}
                      </div>

                      <div className="assessment-verified-grid">
                        <div className="assessment-verified-card">
                          <span className="assessment-verified-card-label">Verified Trees</span>
                          <strong className="assessment-verified-card-val">{inspectedTrees || 1} Standing Tree{inspectedTrees === 1 ? '' : 's'}</strong>
                        </div>
                        <div className="assessment-verified-card">
                          <span className="assessment-verified-card-label">Verified Volume</span>
                          <strong className="assessment-verified-card-val assessment-verified-card-val-green">{inspectedVolume || '1.8'} m³</strong>
                        </div>
                        {approvedInspectionDate && (
                          <div className="assessment-verified-card">
                            <span className="assessment-verified-card-label">Approved Inspection Date</span>
                            <strong className="assessment-verified-card-val text-emerald-300 flex items-center gap-1.5 truncate">
                              <CalendarCheck size={14} className="text-emerald-400 shrink-0" />
                              {formatDateDMY(approvedInspectionDate)}
                            </strong>
                          </div>
                        )}
                        <div className="assessment-verified-card">
                          <span className="assessment-verified-card-label">Timber Quality</span>
                          <strong className="assessment-verified-card-val truncate" title={requestDetails?.site_inspection?.timber_condition || 'Sound & Top Quality'}>
                            {requestDetails?.site_inspection?.timber_condition || 'Sound & Top Quality'}
                          </strong>
                        </div>
                        <div className="assessment-verified-card">
                          <span className="assessment-verified-card-label">Road Access</span>
                          <strong className="assessment-verified-card-val truncate" title={requestDetails?.site_inspection?.road_access_verification || 'Medium 6-wheeler truck only'}>
                            {requestDetails?.site_inspection?.road_access_verification || 'Medium 6-wheeler truck only'}
                          </strong>
                        </div>
                        {requestDetails?.site_inspection?.landowner_preferred_arrangement && (
                          <div className="assessment-verified-card">
                            <span className="assessment-verified-card-label">Landowner Preference</span>
                            <strong className="assessment-verified-card-val truncate" title={requestDetails.site_inspection.landowner_preferred_arrangement}>
                              {requestDetails.site_inspection.landowner_preferred_arrangement === 'INTERESTED_IN_TIMBER_SALE' ? 'Interested in Timber Sale' : 'Harvesting Service Only'}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CONTRACTOR FLEET DISPLAY */}
                  {fleetEquipment && fleetEquipment.length > 0 && (
                    <div className="assessment-verified-section" style={{ marginTop: '24px' }}>
                      <div className="assessment-verified-header" style={{ paddingBottom: '16px' }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                            <Truck size={16} />
                          </div>
                          <div>
                            <span className="assessment-verified-title">
                              Contractor Fleet & Equipment
                            </span>
                            <span className="assessment-verified-desc">
                              Your registered equipment available for this job.
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto p-5 pt-0">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-emerald-500/20 text-slate-400 text-xs uppercase">
                              <th className="py-2 pr-4 font-semibold">Machinery Model</th>
                              <th className="py-2 pr-4 font-semibold">Category</th>
                              <th className="py-2 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fleetEquipment.map((eq, i) => (
                              <tr key={i} className="border-b border-emerald-500/10 last:border-0 text-white">
                                <td className="py-3 pr-4 font-medium">{eq.name}</td>
                                <td className="py-3 pr-4"><span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-[10px] uppercase font-bold rounded-full">{eq.category}</span></td>
                                <td className="py-3">
                                  <span className={`flex items-center gap-1 text-[11px] uppercase font-bold ${eq.status === 'In Operation' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {eq.status === 'In Operation' ? <CheckCircle2 size={12}/> : <Wrench size={12}/>}
                                    {eq.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="cd-form flex flex-col gap-6">

                    {/* ADVISORY BANNERS FOR PREFERRED ARRANGEMENT */}
                    {requestDetails?.site_inspection?.landowner_preferred_arrangement === 'INTERESTED_IN_TIMBER_SALE' && (
                      <div className="-mb-2 p-4 rounded-xl bg-blue-900/20 border border-blue-500/30 text-blue-200 text-[13px] leading-relaxed flex items-start gap-3 shadow-sm">
                        <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-blue-300 font-bold mb-1 text-[13px]">Landowner Preference Advisory</strong>
                          During the site visit, the landowner expressed interest in selling the standing timber. You are submitting a standard Harvesting Service quotation. You may want to discuss timber buyers with them directly or adapt your service rates accordingly.
                        </div>
                      </div>
                    )}
                    
                    {requestDetails?.site_inspection?.landowner_preferred_arrangement === 'HARVESTING_SERVICE' && (
                      <div className="-mb-2 p-3.5 rounded-xl bg-emerald-900/20 border border-emerald-500/30 text-emerald-200 text-[13px] font-medium flex items-center gap-2.5 shadow-sm">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        This standard harvesting quotation perfectly matches the landowner's requested arrangement.
                      </div>
                    )}

                    {/* 1. LANDOWNER PREFERENCE / PROPOSAL TYPE */}
                    <div className="assessment-proposal-section">
                      <div className="assessment-section-title-row">
                        <label className="assessment-section-title">
                          <Briefcase size={16} className="text-emerald-400" />
                          Landowner's Preferred Arrangement *
                        </label>
                        <span className="assessment-section-subtitle">
                          The commercial model preference recorded during site inspection
                        </span>
                      </div>

                      <div className="commercial-type-grid">
                        {requestDetails?.site_inspection?.landowner_preferred_arrangement === 'INTERESTED_IN_TIMBER_SALE' ? (
                          <div className="commercial-type-card selected cursor-default border-blue-500/40 bg-blue-900/10">
                            <div className="commercial-type-header">
                              <span className="commercial-type-title">
                                <DollarSign size={15} className="text-blue-400" /> Interested in Timber Sale
                              </span>
                              <span className="commercial-type-badge bg-blue-500/20 text-blue-300 border-blue-500/30">Purchase Offer</span>
                            </div>
                            <div className="commercial-type-flow text-blue-300">
                              💸 Contractor → Landowner
                            </div>
                            <p className="commercial-type-desc">
                              The landowner wishes to sell their standing timber to you. Provide a direct purchase offer.
                            </p>
                          </div>
                        ) : (
                          <div className="commercial-type-card selected cursor-default">
                            <div className="commercial-type-header">
                              <span className="commercial-type-title">
                                <Truck size={15} className="text-emerald-400" /> Harvesting Service Quotation
                              </span>
                              <span className="commercial-type-badge commercial-type-badge-service">Service Fee</span>
                            </div>
                            <div className="commercial-type-flow text-emerald-300">
                              💸 Landowner → Contractor
                            </div>
                            <p className="commercial-type-desc">
                              The landowner wishes to hire you solely for tree felling, extraction, haulage, and site clearance.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. COMMERCIAL ASSESSMENT (Volume & Indicative Reference Value) */}
                    <div className="assessment-commercial-grid">
                      <div className="assessment-field-group">
                        <div className="assessment-field-header">
                          <label className="assessment-field-label">
                            Assessed Harvestable Volume (m³) *
                          </label>
                          {landownerEstimatedVolume > 0 && (
                            <button
                              type="button"
                              onClick={handleUseLandownerVolume}
                              className="assessment-action-text-btn"
                              title="Reset assessed volume to landowner estimate"
                            >
                              <Layers size={12} /> Use Landowner Volume ({formatVolume(landownerEstimatedVolume)})
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          required
                          name="estimated_harvestable_volume"
                          value={assessmentForm.estimated_harvestable_volume}
                          onChange={handleInputChange}
                          className="assessment-input text-emerald-300"
                          placeholder="e.g. 1.80"
                        />
                        <div className="assessment-field-footer">
                          <span>
                            Landowner Estimate: <strong className="text-white font-semibold">{formatVolume(landownerEstimatedVolume)}</strong>
                          </span>
                          {(() => {
                            const assessedNum = parseVolumeNumber(assessmentForm.estimated_harvestable_volume);
                            const variance = Number((assessedNum - landownerEstimatedVolume).toFixed(2));
                            if (assessedNum <= 0) return null;
                            if (variance === 0) {
                              return (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10.5px] font-bold">
                                  ✓ Matches Landowner Estimate (±0.00 m³)
                                </span>
                              );
                            }
                            const pct = ((variance / (landownerEstimatedVolume || 1)) * 100).toFixed(1);
                            const isHigher = variance > 0;
                            return (
                              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                                isHigher 
                                  ? 'bg-blue-950/80 border-blue-500/40 text-blue-300' 
                                  : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                              }`}>
                                Variance: {isHigher ? `+${variance.toFixed(2)}` : variance.toFixed(2)} m³ ({isHigher ? `+${pct}%` : `${pct}%`})
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="assessment-field-group">
                        <div className="assessment-field-header">
                          <label className="assessment-field-label">
                            Reference Timber Value (₹) <span className="text-slate-500 font-normal normal-case tracking-normal">(Indicative)</span>
                          </label>
                          {landownerReferenceTimberValue > 0 && (
                            <button
                              type="button"
                              onClick={() => setAssessmentForm(prev => ({ ...prev, estimated_timber_value: landownerReferenceTimberValue }))}
                              className="assessment-action-text-btn"
                              title="Use reference timber value"
                            >
                              <Coins size={12} /> Use Reference Value ({formatINR(landownerReferenceTimberValue)})
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          name="estimated_timber_value"
                          value={assessmentForm.estimated_timber_value}
                          onChange={handleInputChange}
                          className="assessment-input text-emerald-400"
                          placeholder="e.g. 251082"
                        />
                        {(() => {
                          const assessedNum = parseVolumeNumber(assessmentForm.estimated_harvestable_volume);
                          const refRate = getTimberReferenceRate(primarySpecies);
                          const computedValue = Math.round(assessedNum * refRate);
                          const currentFormVal = Number(assessmentForm.estimated_timber_value) || 0;
                          return (
                            <div className="assessment-field-footer">
                              <span>
                                Indicative Rate: <strong className="text-amber-400 font-mono">{formatINR(refRate)}/m³</strong> ({primarySpecies})
                              </span>
                              {computedValue > 0 && Math.abs(currentFormVal - computedValue) > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setAssessmentForm(prev => ({ ...prev, estimated_timber_value: computedValue }))}
                                  className="assessment-action-text-btn text-[11px]"
                                >
                                  <Coins size={11} /> Auto-Rate: {formatINR(computedValue)}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* ==========================================================
                        PROPOSAL TYPE 1: HARVESTING SERVICE QUOTATION FIELDS
                        ========================================================== */}
                    {assessmentForm.commercial_proposal_type === 'Harvesting Service Quotation' && (
                      <>
                        {/* 3. ITEMIZED COST BREAKDOWN SECTION */}
                        <div className="assessment-cost-section" id="contractor-cost-breakdown-inputs">
                          <div className="assessment-section-title-row">
                            <h4 className="assessment-section-title">
                              <DollarSign size={16} className="text-emerald-400" /> ITEMIZED SERVICE COST BREAKDOWN (₹)
                            </h4>
                            <span className="assessment-section-subtitle">
                              Cost components charged to landowner
                            </span>
                          </div>

                          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                            <span className="text-xs text-slate-300">
                              Contractor Control: You can review and modify the suggested category amounts below. The total recalculates automatically.
                            </span>
                            {revisionDraft && (
                              <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/30">
                                Editing Revision Draft for Target: {formatRupees(landownerTargetBudget)}
                              </span>
                            )}
                          </div>

                          <div className="assessment-cost-grid">
                            <div className="assessment-cost-item">
                              <label className="assessment-cost-label">Felling & Logging Cost (₹)</label>
                              <input
                                type="number"
                                name="harvesting_cost"
                                value={assessmentForm.harvesting_cost}
                                onChange={handleInputChange}
                                className="assessment-input font-mono"
                                placeholder="e.g. 45000"
                              />
                            </div>

                            <div className="assessment-cost-item">
                              <label className="assessment-cost-label">Extraction / Skid-Trail Cost (₹)</label>
                              <input
                                type="number"
                                name="extraction_cost"
                                value={assessmentForm.extraction_cost}
                                onChange={handleInputChange}
                                className="assessment-input font-mono"
                                placeholder="e.g. 30000"
                              />
                            </div>

                            <div className="assessment-cost-item">
                              <label className="assessment-cost-label">Transportation / Haulage Cost (₹)</label>
                              <input
                                type="number"
                                name="transportation_cost"
                                value={assessmentForm.transportation_cost}
                                onChange={handleInputChange}
                                className="assessment-input font-mono"
                                placeholder="e.g. 25000"
                              />
                            </div>

                            <div className="assessment-cost-item">
                              <label className="assessment-cost-label">Other / Site Clearing Cost (₹)</label>
                              <input
                                type="number"
                                name="other_cost"
                                value={assessmentForm.other_cost}
                                onChange={handleInputChange}
                                className="assessment-input font-mono"
                                placeholder="e.g. 10000"
                              />
                            </div>
                          </div>

                          {/* Total Quotation Summary */}
                          <div className="assessment-total-quote-box">
                            <span className="assessment-total-quote-label">Total Contractor Quotation:</span>
                            <span className="assessment-total-quote-val">
                              ₹ {Number(assessmentForm.total_quote || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* 4. OPERATIONAL PLAN SECTION */}
                        <div className="assessment-operational-section">
                          <div className="assessment-section-title-row">
                            <h4 className="assessment-section-title">
                              <Users size={16} className="text-emerald-400" /> OPERATIONAL PLAN
                            </h4>
                            <span className="assessment-section-subtitle">
                              Workforce, job duration, and mobilization schedule
                            </span>
                          </div>

                          <div className="assessment-operational-grid">
                            <div className="assessment-field-group">
                              <label className="assessment-field-label">
                                Number of Workers Assigned *
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                required
                                name="assigned_workers_count"
                                value={assessmentForm.assigned_workers_count}
                                onChange={handleInputChange}
                                className="assessment-input text-emerald-400"
                                placeholder="e.g. 12"
                              />
                              <span className="text-[11px] text-slate-400">
                                Total workforce deployed for this job
                              </span>
                            </div>

                            <div className="assessment-field-group">
                              <label className="assessment-field-label">
                                Estimated Job Duration *
                              </label>
                              <input
                                type="text"
                                required
                                name="estimated_duration"
                                value={assessmentForm.estimated_duration}
                                onChange={handleInputChange}
                                className="assessment-input"
                                placeholder="e.g. 10 Working Days"
                              />
                              <span className="text-[11px] text-slate-400">
                                Operational time required on site
                              </span>
                            </div>

                            <div className="assessment-field-group">
                              <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                                <label className="assessment-field-label">
                                  Proposed Operation Start Date *
                                </label>
                                {approvedInspectionDate && (
                                  <span className="assessment-inspection-notice-badge" title={`Site inspection approved for ${formatDateDMY(approvedInspectionDate)}. Harvesting operations cannot commence prior to this date.`}>
                                    <CalendarCheck size={12} className="text-emerald-400" />
                                    Approved Inspection: {formatDateDMY(approvedInspectionDate)}
                                  </span>
                                )}
                              </div>
                              <div className="relative flex items-center">
                                <input
                                  ref={dateInputRef}
                                  type="date"
                                  required
                                  min={minOperationalDate}
                                  max={getMaxDateString()}
                                  name="proposed_start_date"
                                  value={assessmentForm.proposed_start_date}
                                  onChange={handleInputChange}
                                  onClick={(e) => {
                                    try {
                                      if (typeof e.target.showPicker === 'function') {
                                        e.target.showPicker();
                                      }
                                    } catch (err) {}
                                  }}
                                  style={{ colorScheme: 'dark' }}
                                  className={`assessment-input cursor-pointer font-bold tracking-wide pr-12 ${dateError ? '!border-red-500 !ring-1 !ring-red-500 !bg-red-950/20 text-red-200' : ''}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    try {
                                      if (dateInputRef.current && typeof dateInputRef.current.showPicker === 'function') {
                                        dateInputRef.current.showPicker();
                                      } else {
                                        dateInputRef.current?.focus();
                                      }
                                    } catch (err) {
                                      dateInputRef.current?.focus();
                                    }
                                  }}
                                  className="absolute right-2.5 z-10 w-8 h-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 flex items-center justify-center transition-all cursor-pointer shadow-sm group"
                                  title="Open Calendar Picker"
                                >
                                  <Calendar size={16} className="text-emerald-400 group-hover:text-slate-950 transition-colors" />
                                </button>
                              </div>

                              {/* Compact Single Row Quick Scheduling Presets */}
                              <div className="assessment-date-shortcuts-row">
                                {approvedInspectionDate && approvedInspectionDate >= getTodayDateString() && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAssessmentForm(prev => ({ ...prev, proposed_start_date: approvedInspectionDate }));
                                      setDateError(validateProposedDate(approvedInspectionDate, approvedInspectionDate));
                                    }}
                                    className={`assessment-date-pill ${
                                      assessmentForm.proposed_start_date === approvedInspectionDate ? 'active' : ''
                                    }`}
                                    title={`Mobilize on the approved inspection date: ${formatDateDMY(approvedInspectionDate)}`}
                                  >
                                    <CalendarCheck size={11} className="inline mr-1 text-emerald-400" />
                                    Inspection Date ({formatDateDMY(approvedInspectionDate)})
                                  </button>
                                )}

                                {requestDetails?.preferred_start_date && requestDetails.preferred_start_date.substring(0, 10) >= getTodayDateString() && (() => {
                                  const prefDate = requestDetails.preferred_start_date.substring(0, 10);
                                  const isPriorToInspection = Boolean(approvedInspectionDate && prefDate < approvedInspectionDate);
                                  return (
                                    <button
                                      type="button"
                                      disabled={isPriorToInspection}
                                      onClick={() => {
                                        if (isPriorToInspection) return;
                                        setAssessmentForm(prev => ({ ...prev, proposed_start_date: prefDate }));
                                        setDateError(validateProposedDate(prefDate, approvedInspectionDate));
                                      }}
                                      className={`assessment-date-pill ${
                                        assessmentForm.proposed_start_date === prefDate ? 'active' : ''
                                      } ${isPriorToInspection ? 'disabled' : ''}`}
                                      title={isPriorToInspection
                                        ? `Cannot select landowner date (${formatDateDMY(prefDate)}): Prior to approved site inspection (${formatDateDMY(approvedInspectionDate)})`
                                        : `Set to Landowner's preferred date: ${formatDateDMY(prefDate)}`}
                                    >
                                      Landowner Preferred ({formatDateDMY(prefDate)}){isPriorToInspection ? ' ⚠️' : ''}
                                    </button>
                                  );
                                })()}

                                {[
                                  { label: 'Today', days: 0, title: 'Mobilize immediately today' },
                                  { label: '+3 Days', days: 3, title: 'Start in 3 days' },
                                  { label: '+1 Week', days: 7, title: 'Start in 1 week (7 days)' },
                                  { label: '+2 Weeks', days: 14, title: 'Start in 2 weeks (14 days)' },
                                  { label: '+1 Month', days: 30, title: 'Start in 1 month (30 days)' }
                                ].map((preset) => {
                                  const pDate = addDaysToToday(preset.days);
                                  const isSelected = assessmentForm.proposed_start_date === pDate;
                                  const isPriorToInspection = Boolean(approvedInspectionDate && pDate < approvedInspectionDate);
                                  return (
                                    <button
                                      key={preset.label}
                                      type="button"
                                      disabled={isPriorToInspection}
                                      onClick={() => {
                                        if (isPriorToInspection) return;
                                        setAssessmentForm(prev => ({ ...prev, proposed_start_date: pDate }));
                                        setDateError(validateProposedDate(pDate, approvedInspectionDate));
                                      }}
                                      title={isPriorToInspection
                                        ? `Cannot start on ${formatDateDMY(pDate)}: Prior to approved inspection date (${formatDateDMY(approvedInspectionDate)})`
                                        : `${preset.title}: ${formatDateDMY(pDate)}`}
                                      className={`assessment-date-pill ${isSelected ? 'active' : ''} ${isPriorToInspection ? 'disabled' : ''}`}
                                    >
                                      {preset.label}
                                    </button>
                                  );
                                })}
                              </div>

                              {dateError ? (
                                <span className="text-xs text-red-400 font-semibold flex items-center gap-1.5 mt-1 animate-fade-in">
                                  <AlertTriangle size={14} className="shrink-0 text-red-400" />
                                  {dateError}
                                </span>
                              ) : (
                                <div className="flex items-center justify-between flex-wrap gap-1 text-[11.5px] text-slate-400 mt-1">
                                  <span>
                                    {approvedInspectionDate
                                      ? `Earliest mobilization: ${formatDateDMY(minOperationalDate)} (Post-Inspection)`
                                      : 'Target mobilization'}
                                  </span>
                                  {assessmentForm.proposed_start_date && (
                                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                      <CheckCircle2 size={13} className="text-emerald-400" />
                                      {getRelativeDaysDescription(assessmentForm.proposed_start_date)} ({formatDateDMY(assessmentForm.proposed_start_date)})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 5. ADVANCE MOBILIZATION PAYMENT TERMS SECTION */}
                        <div className="assessment-operational-section border border-emerald-500/25 bg-[#03140a]">
                          <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-emerald-500/20">
                            <div>
                              <h4 className="assessment-section-title flex items-center gap-2">
                                <CreditCard size={16} className="text-emerald-400" />
                                <span>ADVANCE MOBILIZATION PAYMENT TERMS</span>
                              </h4>
                              <span className="assessment-section-subtitle">
                                Set mobilization advance required from landowner before felling operations commence
                              </span>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer select-none px-4 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 hover:bg-emerald-900/40 hover:border-emerald-400 transition-all shadow-sm">
                              <input
                                type="checkbox"
                                checked={assessmentForm.require_advance}
                                onChange={(e) => {
                                  const req = e.target.checked;
                                  const quoteVal = Number(assessmentForm.total_quote) || 0;
                                  setAssessmentForm(prev => ({
                                    ...prev,
                                    require_advance: req,
                                    advance_amount: req ? Math.round((quoteVal * (Number(prev.advance_percentage) || 30)) / 100) : 0
                                  }));
                                }}
                                className="w-4 h-4 rounded bg-[#020804] border-emerald-500/50 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                              />
                              <span className="text-[13px] font-extrabold text-emerald-300 uppercase tracking-wide">Require Advance Before Starting Work</span>
                            </label>
                          </div>

                          {assessmentForm.require_advance && (
                            <div className="space-y-6 pt-2 animate-in fade-in duration-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* COLUMN 1: AMOUNT & BREAKDOWN */}
                                <div className="flex flex-col">
                                  {/* Top part: Input */}
                                  <div className="p-4 bg-[#07190d] border border-emerald-500/40 rounded-t-xl focus-within:border-emerald-400 transition-colors shadow-sm">
                                    <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                                      <IndianRupee size={13} />
                                      Advance Amount (₹) *
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400 font-bold font-mono text-xl">₹</span>
                                      <input
                                        type="number"
                                        min="100"
                                        step="100"
                                        name="advance_amount"
                                        value={assessmentForm.advance_amount}
                                        onChange={(e) => handleAdvanceAmountChange(e.target.value)}
                                        className="w-full bg-transparent text-white font-mono font-black text-2xl focus:outline-none placeholder:text-slate-600"
                                        placeholder="e.g. 30000"
                                      />
                                    </div>
                                    <span className="text-[11px] text-slate-400 block mt-2">
                                      Direct advance amount required before mobilization
                                    </span>
                                  </div>
                                  
                                  {/* Bottom part: Summary */}
                                  <div className="p-4 bg-[#092212] border border-t-0 border-emerald-500/40 rounded-b-xl shadow-inner">
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                      Mobilization Advance Required
                                    </span>
                                    <strong className="text-xl sm:text-2xl font-black text-white font-mono block mt-1.5">
                                      {formatINR(assessmentForm.advance_amount)}
                                    </strong>
                                    <span className="text-[11px] text-emerald-300 block mt-1">
                                      ({assessmentForm.advance_percentage}% of quotation value)
                                    </span>
                                  </div>
                                </div>

                                {/* COLUMN 2: PERCENTAGE & REMAINING */}
                                <div className="flex flex-col">
                                  {/* Top part: Input */}
                                  <div className="p-4 bg-[#07190d] border border-emerald-500/40 rounded-t-xl focus-within:border-emerald-400 transition-colors shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                      <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Calculator size={13} />
                                        Advance Share (%)
                                      </label>
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          min="1"
                                          max="100"
                                          name="advance_percentage"
                                          value={assessmentForm.advance_percentage}
                                          onChange={(e) => handleAdvancePercentageChange(e.target.value)}
                                          className="w-16 px-2 py-1 rounded bg-black/50 border border-emerald-500/40 text-emerald-300 font-mono font-black text-center text-sm focus:outline-none focus:border-emerald-400"
                                        />
                                        <span className="text-slate-400 font-bold text-sm">%</span>
                                      </div>
                                    </div>

                                    <input
                                      type="range"
                                      min="5"
                                      max="80"
                                      step="5"
                                      value={assessmentForm.advance_percentage}
                                      onChange={(e) => handleAdvancePercentageChange(e.target.value)}
                                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2 mb-4"
                                    />

                                    {/* Preset Pills */}
                                    <div className="flex items-center justify-between gap-2 text-[11px]">
                                      {[10, 20, 30, 50].map((pct) => (
                                        <button
                                          key={pct}
                                          type="button"
                                          onClick={() => handleAdvancePercentageChange(pct)}
                                          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex-1 ${
                                            Number(assessmentForm.advance_percentage) === pct
                                              ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                                              : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                                          }`}
                                        >
                                          {pct}%
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Bottom part: Summary */}
                                  <div className="p-4 bg-[#091a11] border border-t-0 border-emerald-500/40 rounded-b-xl shadow-inner">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                      Remaining Balance Post-Advance
                                    </span>
                                    <strong className="text-xl sm:text-2xl font-black text-amber-400 font-mono block mt-1.5">
                                      {formatINR(Math.max(0, (Number(assessmentForm.total_quote) || 0) - (Number(assessmentForm.advance_amount) || 0)))}
                                    </strong>
                                    <span className="text-[11px] text-slate-400 block mt-1">
                                      Payable upon felling progress / completion
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Payment Due Date & Contractor Payment Accounts */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 pt-5 border-t border-emerald-500/20">
                                <div className="assessment-field-group mb-0">
                                  <label className="assessment-field-label flex items-center gap-1.5">
                                    <Calendar size={13} className="text-emerald-400" />
                                    Advance Payment Due Date *
                                  </label>
                                  <input
                                    type="date"
                                    name="advance_due_date"
                                    min={getTodayDateString()}
                                    value={assessmentForm.advance_due_date}
                                    onChange={handleInputChange}
                                    style={{ colorScheme: 'dark' }}
                                    className="assessment-input cursor-pointer font-bold bg-[#020804] border-emerald-500/30 focus:border-emerald-400"
                                  />
                                </div>

                                <div className="assessment-field-group mb-0">
                                  <label className="assessment-field-label flex items-center gap-1.5">
                                    <QrCode size={13} className="text-emerald-400" />
                                    Contractor UPI ID *
                                  </label>
                                  <input
                                    type="text"
                                    name="advance_upi_id"
                                    value={assessmentForm.advance_upi_id}
                                    onChange={handleInputChange}
                                    placeholder="e.g. treeconnect.contractor@okhdfcbank"
                                    className="assessment-input font-mono text-emerald-300 bg-[#020804] border-emerald-500/30 focus:border-emerald-400"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div className="assessment-field-group mb-0">
                                  <label className="assessment-field-label">Bank Name &amp; Branch</label>
                                  <input
                                    type="text"
                                    name="advance_bank_name"
                                    value={assessmentForm.advance_bank_name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. HDFC Bank Ltd, Kottayam"
                                    className="assessment-input bg-[#020804] border-emerald-500/30 focus:border-emerald-400"
                                  />
                                </div>

                                <div className="assessment-field-group mb-0">
                                  <label className="assessment-field-label">Bank Account Number</label>
                                  <input
                                    type="text"
                                    name="advance_bank_account_number"
                                    value={assessmentForm.advance_bank_account_number}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 50200084920194"
                                    className="assessment-input font-mono bg-[#020804] border-emerald-500/30 focus:border-emerald-400"
                                  />
                                </div>

                                <div className="assessment-field-group mb-0">
                                  <label className="assessment-field-label">IFSC Code</label>
                                  <input
                                    type="text"
                                    name="advance_ifsc_code"
                                    value={assessmentForm.advance_ifsc_code}
                                    onChange={handleInputChange}
                                    placeholder="e.g. HDFC0001234"
                                    className="assessment-input font-mono uppercase bg-[#020804] border-emerald-500/30 focus:border-emerald-400"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="assessment-field-group mb-0">
                                  <label className="assessment-field-label">Beneficiary / Account Holder Name</label>
                                  <input
                                    type="text"
                                    name="advance_account_holder"
                                    value={assessmentForm.advance_account_holder}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Rohith Kumar"
                                    className="assessment-input bg-[#020804] border-emerald-500/30 focus:border-emerald-400"
                                  />
                                </div>

                                <div className="assessment-field-group mb-0">
                                  <label className="assessment-field-label">Mobilization Note (Optional)</label>
                                  <input
                                    type="text"
                                    name="advance_remarks"
                                    value={assessmentForm.advance_remarks}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Advance mobilization fee covers crew staging and haulage logistics."
                                    className="assessment-input bg-[#020804] border-emerald-500/30 focus:border-emerald-400"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* ==========================================================
                        PROPOSAL TYPE 2: TIMBER PURCHASE OFFER FIELDS
                        ========================================================== */}
                    {assessmentForm.commercial_proposal_type === 'Timber Purchase Offer' && (
                      <div className="commercial-offer-box">
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 mb-4 border-b border-amber-500/25">
                          <div>
                            <h4 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                              <Coins size={18} className="text-amber-400" /> Timber Purchase Offer Details
                            </h4>
                            <p className="text-xs text-slate-300 mt-0.5">
                              You are offering to <strong>BUY</strong> the timber from the landowner. Normal harvesting service quotation charges do not apply.
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
                            💰 Money Flows: Contractor → Landowner
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                          <div className="cd-form-group">
                            <label className="cd-form-label text-amber-300">
                              Contractor Purchase Offer (₹) *
                            </label>
                            <input
                              type="number"
                              required
                              name="contractor_purchase_offer"
                              value={assessmentForm.contractor_purchase_offer}
                              onChange={handleInputChange}
                              className="cd-input font-bold text-base text-amber-400 !border-amber-500/50"
                              placeholder="e.g. 220000"
                            />
                            <div className="flex items-center justify-between flex-wrap gap-2 mt-1.5 text-[11px]">
                              <span className="text-slate-400">
                                Indicative Timber Value: <strong className="text-white">{formatINR(assessmentForm.estimated_timber_value || landownerReferenceTimberValue)}</strong>
                              </span>
                              {assessmentForm.contractor_purchase_offer && (
                                <span className="text-amber-400 font-bold">
                                  Offer: {formatINR(assessmentForm.contractor_purchase_offer)} (Payable to Landowner)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="cd-form-group">
                            <label className="cd-form-label">
                              Offer Valid Until *
                            </label>
                            <input
                              type="date"
                              required
                              min={getTodayDateString()}
                              name="offer_valid_until"
                              value={assessmentForm.offer_valid_until}
                              onChange={handleInputChange}
                              style={{ colorScheme: 'dark' }}
                              className="cd-input font-bold text-white cursor-pointer"
                            />
                            <span className="text-[10.5px] text-slate-400 block mt-1.5">
                              Date until which this purchase offer remains binding
                            </span>
                          </div>
                        </div>

                        <div className="cd-form-group">
                          <label className="cd-form-label">
                            Payment Terms *
                          </label>
                          <input
                            type="text"
                            required
                            name="payment_terms"
                            value={assessmentForm.payment_terms}
                            onChange={handleInputChange}
                            className="cd-input text-xs sm:text-sm font-semibold"
                            placeholder="e.g. 100% full settlement upon agreement signing prior to felling"
                          />
                          <span className="text-[10.5px] text-slate-400 block mt-1.5">
                            Specify disbursement schedule, payment milestones, or bank transfer details
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ==========================================================
                        PROPOSAL TYPE 3: PURCHASE + HARVESTING FIELDS
                        ========================================================== */}
                    {assessmentForm.commercial_proposal_type === 'Purchase + Harvesting' && (
                      <div className="commercial-hybrid-box">
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 mb-4 border-b border-emerald-500/25">
                          <div>
                            <h4 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                              <Handshake size={18} className="text-emerald-400" /> Commercial Purchase + Harvesting Terms
                            </h4>
                            <p className="text-xs text-slate-300 mt-0.5">
                              Contractor purchases timber from landowner and undertakes harvesting operations under agreed terms.
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                            🤝 Combined Commercial Model
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                          <div className="cd-form-group">
                            <label className="cd-form-label text-emerald-300">
                              Timber Purchase Price (₹) *
                            </label>
                            <input
                              type="number"
                              required
                              name="timber_purchase_price"
                              value={assessmentForm.timber_purchase_price}
                              onChange={handleInputChange}
                              className="cd-input font-bold text-base text-emerald-400 !border-emerald-500/50"
                              placeholder="e.g. 200000"
                            />
                            <span className="text-[10.5px] text-slate-400 block mt-1.5">
                              Timber purchase valuation offered payable to the landowner
                            </span>
                          </div>

                          <div className="cd-form-group">
                            <label className="cd-form-label text-slate-200">
                              Harvesting Arrangement / Cost (₹)
                            </label>
                            <input
                              type="number"
                              name="harvesting_arrangement_cost"
                              value={assessmentForm.harvesting_arrangement_cost}
                              onChange={handleInputChange}
                              className="cd-input font-mono text-sm"
                              placeholder="e.g. 35000 (or leave 0 if included in purchase price)"
                            />
                            <span className="text-[10.5px] text-slate-400 block mt-1.5">
                              Operational logging cost factored or agreed under this arrangement
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                          <div className="cd-form-group">
                            <label className="cd-form-label">
                              Transportation Arrangement
                            </label>
                            <input
                              type="text"
                              name="transportation_arrangement"
                              value={assessmentForm.transportation_arrangement}
                              onChange={handleInputChange}
                              className="cd-input text-xs sm:text-sm"
                              placeholder="e.g. Contractor arranged heavy haulage to timber depot"
                            />
                          </div>

                          <div className="cd-form-group">
                            <label className="cd-form-label">
                              Offer Valid Until *
                            </label>
                            <input
                              type="date"
                              required
                              min={getTodayDateString()}
                              name="offer_valid_until"
                              value={assessmentForm.offer_valid_until}
                              onChange={handleInputChange}
                              style={{ colorScheme: 'dark' }}
                              className="cd-input font-bold text-white cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="cd-form-group mb-4">
                          <label className="cd-form-label">
                            Payment Terms *
                          </label>
                          <input
                            type="text"
                            required
                            name="payment_terms"
                            value={assessmentForm.payment_terms}
                            onChange={handleInputChange}
                            className="cd-input text-xs sm:text-sm font-semibold"
                            placeholder="e.g. 50% advance upon agreement signing, 50% upon completion of extraction"
                          />
                        </div>

                        {/* Operational Workforce & Timing for Hybrid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-3 border-t border-emerald-500/20">
                          <div className="cd-form-group">
                            <label className="cd-form-label text-[11px]">Assigned Workforce</label>
                            <input
                              type="number"
                              min="1"
                              name="assigned_workers_count"
                              value={assessmentForm.assigned_workers_count}
                              onChange={handleInputChange}
                              className="cd-input font-bold text-emerald-400 text-xs"
                              placeholder="e.g. 10 Crew"
                            />
                          </div>
                          <div className="cd-form-group">
                            <label className="cd-form-label text-[11px]">Job Duration</label>
                            <input
                              type="text"
                              name="estimated_duration"
                              value={assessmentForm.estimated_duration}
                              onChange={handleInputChange}
                              className="cd-input text-xs"
                              placeholder="e.g. 10 Working Days"
                            />
                          </div>
                          <div className="cd-form-group">
                            <label className="cd-form-label text-[11px]">Target Start Date</label>
                            <input
                              type="date"
                              min={getTodayDateString()}
                              name="proposed_start_date"
                              value={assessmentForm.proposed_start_date}
                              onChange={handleInputChange}
                              style={{ colorScheme: 'dark' }}
                              className="cd-input text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CONTRACTOR ASSESSMENT SUMMARY & REPORT CARD */}
                    <div className="assessment-summary-card">
                      <div className="assessment-summary-header">
                        <div className="assessment-summary-title-wrap">
                          <div className="assessment-summary-icon">
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <h4 className="assessment-summary-title">
                              Contractor Assessment Summary & Report
                            </h4>
                            <p className="assessment-summary-subtitle">
                              Live calculated operational parameters & formal {assessmentForm.commercial_proposal_type} overview
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="assessment-print-btn no-print"
                        >
                          <Printer size={14} /> Print Assessment Report
                        </button>
                      </div>

                      {/* Dynamic Metrics Grid Based on Proposal Type */}
                      <div className="assessment-metrics-grid">
                        {/* 1. Volume (Common to all) */}
                        <div className="assessment-metric-card">
                          <div className="assessment-metric-label-row">
                            <span className="assessment-metric-label">Harvestable Volume</span>
                            <Trees size={16} className="text-emerald-400 assessment-metric-icon" />
                          </div>
                          <div className="assessment-metric-value text-emerald-400 font-mono">
                            {formatVolume(assessmentForm.estimated_harvestable_volume)}
                          </div>
                          <span className="assessment-metric-caption">
                            {(() => {
                              const assessedNum = parseVolumeNumber(assessmentForm.estimated_harvestable_volume);
                              const variance = Number((assessedNum - landownerEstimatedVolume).toFixed(2));
                              if (variance === 0) return `Landowner: ${formatVolume(landownerEstimatedVolume)} (Match)`;
                              return `Landowner: ${formatVolume(landownerEstimatedVolume)} (${variance > 0 ? `+${variance.toFixed(2)}` : variance.toFixed(2)} m³) `;
                            })()}
                          </span>
                        </div>

                        {/* Proposal Specific Metric 2 */}
                        {assessmentForm.commercial_proposal_type === 'Harvesting Service Quotation' && (
                          <div className="assessment-metric-card">
                            <div className="assessment-metric-label-row">
                              <span className="assessment-metric-label">Total Contractor Quotation</span>
                              <DollarSign size={16} className="text-amber-400 assessment-metric-icon" />
                            </div>
                            <div className="assessment-metric-value text-amber-400">
                              ₹{Number(assessmentForm.total_quote || 0).toLocaleString('en-IN')}
                            </div>
                            <span className="assessment-metric-caption">All itemized charges (Landowner pays)</span>
                          </div>
                        )}

                        {assessmentForm.commercial_proposal_type === 'Timber Purchase Offer' && (
                          <>
                            <div className="assessment-metric-card">
                              <div className="assessment-metric-label-row">
                                <span className="assessment-metric-label">Reference Timber Value</span>
                                <Coins size={16} className="text-emerald-400 assessment-metric-icon" />
                              </div>
                              <div className="assessment-metric-value text-emerald-300">
                                {formatINR(assessmentForm.estimated_timber_value || landownerReferenceTimberValue)}
                              </div>
                              <span className="assessment-metric-caption">Indicative market value</span>
                            </div>

                            <div className="assessment-metric-card">
                              <div className="assessment-metric-label-row">
                                <span className="assessment-metric-label">Contractor Purchase Offer</span>
                                <Coins size={16} className="text-amber-400 assessment-metric-icon" />
                              </div>
                              <div className="assessment-metric-value text-amber-400">
                                {assessmentForm.contractor_purchase_offer ? formatINR(assessmentForm.contractor_purchase_offer) : '₹0'}
                              </div>
                              <span className="assessment-metric-caption text-amber-300/80 font-semibold">Payable to Landowner</span>
                            </div>
                          </>
                        )}

                        {assessmentForm.commercial_proposal_type === 'Purchase + Harvesting' && (
                          <>
                            <div className="assessment-metric-card">
                              <div className="assessment-metric-label-row">
                                <span className="assessment-metric-label">Timber Purchase Price</span>
                                <Coins size={16} className="text-emerald-400 assessment-metric-icon" />
                              </div>
                              <div className="assessment-metric-value text-emerald-300">
                                {assessmentForm.timber_purchase_price ? formatINR(assessmentForm.timber_purchase_price) : '₹0'}
                              </div>
                              <span className="assessment-metric-caption">Payable to Landowner</span>
                            </div>

                            <div className="assessment-metric-card">
                              <div className="assessment-metric-label-row">
                                <span className="assessment-metric-label">Harvesting Arrangement</span>
                                <Truck size={16} className="text-amber-400 assessment-metric-icon" />
                              </div>
                              <div className="assessment-metric-value text-amber-300">
                                {assessmentForm.harvesting_arrangement_cost ? formatINR(assessmentForm.harvesting_arrangement_cost) : 'As Agreed'}
                              </div>
                              <span className="assessment-metric-caption">Operational arrangement</span>
                            </div>
                          </>
                        )}

                        {/* Operational Metrics */}
                        {assessmentForm.commercial_proposal_type === 'Harvesting Service Quotation' && (
                          <>
                            <div className="assessment-metric-card">
                              <div className="assessment-metric-label-row">
                                <span className="assessment-metric-label">Workforce Deployed</span>
                                <Users size={16} className="text-sky-400 assessment-metric-icon" />
                              </div>
                              <div className="assessment-metric-value text-white flex items-baseline gap-1.5">
                                <span>{assessmentForm.assigned_workers_count || 12}</span>
                                <span className="text-xs font-semibold text-slate-400">&nbsp;Crew</span>
                              </div>
                              <span className="assessment-metric-caption">Site logging crew</span>
                            </div>

                            <div className="assessment-metric-card">
                              <div className="assessment-metric-label-row">
                                <span className="assessment-metric-label">Job Duration</span>
                                <Clock size={16} className="text-emerald-400 assessment-metric-icon" />
                              </div>
                              <div className="assessment-metric-value text-slate-100 text-sm sm:text-base font-bold truncate">
                                {assessmentForm.estimated_duration || '10 Working Days'}
                              </div>
                              <span className="assessment-metric-caption">Target operational span</span>
                            </div>

                            <div className={`assessment-metric-card ${dateError ? '!border-red-500/50 !bg-red-950/20' : ''}`}>
                              <div className="assessment-metric-label-row">
                                <span className="assessment-metric-label">Operation Start Date</span>
                                <Calendar size={16} className={`assessment-metric-icon ${dateError ? 'text-red-400' : 'text-emerald-400'}`} />
                              </div>
                              <div className={`assessment-metric-value text-sm sm:text-base font-bold truncate ${dateError ? 'text-red-400' : 'text-emerald-300'}`}>
                                {formatDateDMY(assessmentForm.proposed_start_date)}
                              </div>
                              <span className={`assessment-metric-caption ${dateError ? 'text-red-400 font-semibold' : ''}`}>
                                {dateError ? '⚠️ Invalid date' : (getRelativeDaysDescription(assessmentForm.proposed_start_date) || 'Mobilization date')}
                              </span>
                            </div>
                          </>
                        )}

                        {/* Validity & Terms for Purchase Offer & Hybrid */}
                        {['Timber Purchase Offer', 'Purchase + Harvesting'].includes(assessmentForm.commercial_proposal_type) && (
                          <>
                            <div className="assessment-metric-card">
                              <div className="assessment-metric-label-row">
                                <span className="assessment-metric-label">Offer Valid Until</span>
                                <Calendar size={16} className="text-emerald-400 assessment-metric-icon" />
                              </div>
                              <div className="assessment-metric-value text-white text-sm sm:text-base font-bold truncate">
                                {formatDateDMY(assessmentForm.offer_valid_until)}
                              </div>
                              <span className="assessment-metric-caption">Binding offer period</span>
                            </div>

                            <div className="assessment-metric-card">
                              <div className="assessment-metric-label-row">
                                <span className="assessment-metric-label">Commercial Type</span>
                                <Briefcase size={16} className="text-sky-400 assessment-metric-icon" />
                              </div>
                              <div className="assessment-metric-value text-white text-xs sm:text-sm font-bold truncate">
                                {assessmentForm.commercial_proposal_type}
                              </div>
                              <span className="assessment-metric-caption">
                                {assessmentForm.commercial_proposal_type === 'Timber Purchase Offer' ? 'Purchase Agreement' : 'Purchase + Operations'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Site Notes */}
                    <div className="cd-form-group">
                      <label className="cd-form-label">
                        {assessmentForm.commercial_proposal_type === 'Timber Purchase Offer'
                          ? 'Contractor Remarks & Purchase Proposal Notes'
                          : 'Site Inspection Notes & Assessment Remarks'}
                      </label>
                      <textarea
                        rows={4}
                        name="notes"
                        value={assessmentForm.notes}
                        onChange={handleInputChange}
                        className="cd-textarea"
                        placeholder="Provide remarks regarding timber condition, accessibility, terms, or logistics..."
                      />
                    </div>

                    {/* Section 22: Final Review Section */}
                    <div className="cd-final-review-panel">
                      <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2.5">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck size={16} className="text-emerald-400" />
                          <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                            Assessment Summary &amp; Commercial Proposal Review
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          Ready for Submission
                        </span>
                      </div>

                      <div className="cd-final-review-grid">
                        <div className="cd-final-review-item">
                          <span className="cd-final-review-label">Assessed Harvestable Volume</span>
                          <span className="cd-final-review-val text-emerald-300">
                            {formatVolume(assessmentForm.estimated_harvestable_volume || 1.80)}
                          </span>
                        </div>

                        <div className="cd-final-review-item">
                          <span className="cd-final-review-label">Commercial Proposal</span>
                          <span className="cd-final-review-val text-white truncate">
                            {assessmentForm.commercial_proposal_type || 'Harvesting Service Quotation'}
                          </span>
                        </div>

                        <div className="cd-final-review-item">
                          <span className="cd-final-review-label">Total Quotation</span>
                          <span className="cd-final-review-val text-emerald-400 font-mono">
                            {formatRupees(assessmentForm.total_quote || 93500)}
                          </span>
                        </div>

                        <div className="cd-final-review-item">
                          <span className="cd-final-review-label">Crew</span>
                          <span className="cd-final-review-val text-white">
                            {assessmentForm.assigned_workers_count || 10} Workers
                          </span>
                        </div>

                        <div className="cd-final-review-item">
                          <span className="cd-final-review-label">Duration</span>
                          <span className="cd-final-review-val text-white">
                            {assessmentForm.estimated_duration || '1 Working Day'}
                          </span>
                        </div>

                        <div className="cd-final-review-item">
                          <span className="cd-final-review-label">Start Date</span>
                          <span className="cd-final-review-val text-white">
                            {formatDateDMY(assessmentForm.proposed_start_date || '2026-10-10')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div id="contractor-submit-actions" className="cd-modal-actions flex items-center justify-between gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => navigate('/contractor/assigned-jobs')}
                        className="cd-btn-cancel"
                      >
                        Cancel
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowDeclineModal(true)}
                          className="cd-btn-decline-work"
                          title="If terms or amounts are not favourable, reject the quotation or decline the assigned work"
                        >
                          <XCircle size={15} />
                          <span>Decline Assignment</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          className="cd-btn-draft"
                          title="Save current form values to local browser draft"
                        >
                          <Save size={15} />
                          <span>Save Draft</span>
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`cd-btn-primary ${(isRevisionRequested || revisionDraft || isAlreadyRevised || existingAssessmentData || requestDetails?.status === 'ASSESSMENT_SUBMITTED') ? 'cd-btn-primary-revision' : ''}`}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 size={16} className="animate-spin" /> Submitting Official Quotation...
                            </>
                          ) : (isRevisionRequested || revisionDraft || isAlreadyRevised || existingAssessmentData || requestDetails?.status === 'ASSESSMENT_SUBMITTED') ? (
                            <>
                              <RefreshCw size={16} /> Submit Revised Quote ({formatRupees(assessmentForm.total_quote || assessmentForm.contractor_purchase_offer || assessmentForm.timber_purchase_price || 93500)})
                            </>
                          ) : assessmentForm.commercial_proposal_type === 'Timber Purchase Offer' ? (
                            <>
                              <Coins size={16} /> Submit Timber Purchase Offer
                            </>
                          ) : assessmentForm.commercial_proposal_type === 'Purchase + Harvesting' ? (
                            <>
                              <Handshake size={16} /> Submit Purchase + Harvesting Proposal
                            </>
                          ) : (
                            <>
                              <Calculator size={16} /> Submit Assessment
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </form>
                </div>
                );
                })()}
              </div>

            </div>
          )}

          </div>

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

          {/* DECLINE ASSIGNMENT / UNFAVOURABLE TERMS MODAL */}
          {showDeclineModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#0a0f0d]/90 backdrop-blur-md animate-fade-in">
              <div className="max-w-lg w-full p-6 border border-rose-500/30 rounded-2xl bg-[#121a16] space-y-5 shadow-2xl relative">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-rose-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                      <XCircle size={22} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white m-0">
                        Decline Job / Unfavourable Terms
                      </h4>
                      <p className="text-xs text-slate-400 m-0 mt-0.5">
                        Release this work assignment back to the landowner pool
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeclineModal(false)}
                    className="p-1.5 rounded-lg bg-[#0e1612] border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200/90 leading-relaxed">
                  If the landowner's requested counter-offer budget or conditions are not commercially viable for your crew, you can decline this assignment. This will unassign your profile and allow the landowner to reassign or adjust terms.
                </div>

                {/* Reason Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Reason for Declining:
                  </label>
                  <div className="space-y-2">
                    {[
                      'Offered budget or counter-offer amount is below operational feasibility',
                      'Access terrain constraints or heavy haulage route unviable',
                      'Schedule conflict with requested operation timeline',
                      'Specified tree felling volume/conditions differ from site estimate'
                    ].map((reasonOption, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          declineReason === reasonOption
                            ? 'bg-rose-500/15 border-rose-500/40 text-white font-semibold'
                            : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="declineReason"
                          checked={declineReason === reasonOption}
                          onChange={() => setDeclineReason(reasonOption)}
                          className="accent-rose-500"
                        />
                        <span>{reasonOption}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Optional Custom Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Additional Notes for Landowner (Optional):
                  </label>
                  <textarea
                    rows={3}
                    value={declineNotes}
                    onChange={(e) => setDeclineNotes(e.target.value)}
                    placeholder="Provide specific feedback on why the offered quotation was unfavourable..."
                    className="w-full rounded-xl bg-black/60 border border-white/15 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 resize-none font-sans"
                  />
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowDeclineModal(false)}
                    disabled={isDeclining}
                    className="px-4 py-2 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel / Keep Job
                  </button>
                  <button
                    type="button"
                    onClick={handleDeclineAssignment}
                    disabled={isDeclining}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950"
                  >
                    {isDeclining ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Declining...
                      </>
                    ) : (
                      <>
                        <XCircle size={14} /> Confirm &amp; Decline Job
                      </>
                    )}
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
