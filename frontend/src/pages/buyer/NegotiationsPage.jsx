import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import marketplaceService from '../../services/marketplaceService';
import { loadRazorpay } from '../../utils/razorpay';
import './BuyerCards.css';
import {
  Handshake,
  Check,
  X,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Truck,
  DollarSign,
  Clock,
  Building,
  Building2,
  Landmark,
  Layers,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Trees,
  Calendar,
  Trash2,
  ClipboardCheck,
  CreditCard,
  QrCode,
  FileText,
  Sparkles,
  CheckSquare,
  Square,
  ArrowLeftRight,
  TrendingDown,
  Tag
} from 'lucide-react';

const formatInspectionDate = (dateStr) => {
  if (!dateStr) return 'Date Pending';
  try {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
};

const formatInspectionTimeSlot = (slotStr) => {
  if (!slotStr) return 'Flexible Timing';
  let cleaned = String(slotStr).trim();
  cleaned = cleaned.replace(/^\((.*)\)$/, '$1').trim();
  cleaned = cleaned.replace(/\s*\((.*?)\)/, ' • $1');
  return cleaned;
};

const NegotiationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const buyerName = user?.contactPerson || user?.name || user?.full_name || 'Arun K';
  const buyerCompany = user?.companyName || user?.company_name || 'timberbuyers';
  const buyerEmail = (user?.email || 'arunbuyer@gmail.com').toLowerCase().trim();
  const buyerLocalBody = user?.localBody || user?.panchayat || user?.jurisdiction || 'Meenadom Panchayat';
  const buyerAddress = user?.address || 'buyer_address';
  const buyerPin = user?.pincode || user?.pin || '686516';

  const [negotiations, setNegotiations] = useState([]);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'action' | 'inspections' | 'pending' | 'closed'
  const [toastMessage, setToastMessage] = useState('');

  // Survey Modal State
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [surveyTargetNeg, setSurveyTargetNeg] = useState(null);
  const [surveyForm, setSurveyForm] = useState({
    verifiedVolume: 1.7,
    logCount: 2,
    observedGrade: 'Grade A Prime Export (Heartwood > 75%, Clear Boles)',
    heartwoodQuality: 'High-density solid heartwood, clear end seals, zero hollow decay',
    transitClearanceVerified: true,
    offeredPricePerM3: 138833,
    offeredTotalPrice: 236016,
    destinationMill: 'Ernakulam Timber Mill Yard #2',
    deliveryPreference: 'Seller Arranged Transport to Buyer Mill',
    notes: 'On-site scaling completed with forest caliper. Debarked logs measured and physically verified.'
  });

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTargetNeg, setPaymentTargetNeg] = useState(null);
  const [paymentTargetOrder, setPaymentTargetOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'netbanking' | 'card'
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  const loadData = () => {
    const all = marketplaceService.getNegotiations();
    // Strictly real-time negotiations for this logged in buyer
    const realBuyerNegs = all.filter(n => {
      if (!n || n.id === 'neg_1792525172176_219' || n.id === 'neg_1792558834750_747') return false;
      const bEmail = (n.buyerEmail || '').toLowerCase().trim();
      const bName = (n.buyerName || '').toLowerCase().trim();
      return (buyerEmail && bEmail === buyerEmail) || (bName && bName === buyerName.toLowerCase().trim());
    });

    // Deduplicate by listingId, keeping the latest negotiation
    const map = new Map();
    for (const item of realBuyerNegs) {
      const key = item.listingId || item.id;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
    setNegotiations(Array.from(map.values()));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 5000);
  };

  useEffect(() => {
    loadData();
    marketplaceService.syncFromBackend().then(() => loadData()).catch(() => {});
    const handleUpdate = () => loadData();
    window.addEventListener('treeconnect_marketplace_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('treeconnect_marketplace_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [buyerEmail, buyerName]);

  const handleDeleteNegotiation = async (neg) => {
    if (!window.confirm(`Are you sure you want to remove the negotiation details for "${neg.timberTitle}"?`)) {
      return;
    }

    try {
      await marketplaceService.deleteNegotiation(neg.id);
      loadData();
      showToast('Negotiation details removed successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to remove negotiation details');
    }
  };

  // Action: Buyer accepts alternative date proposed by Landowner
  const handleAcceptRescheduledDate = async (neg) => {
    try {
      await marketplaceService.acceptRescheduledDate(neg.id, user);
      loadData();
      showToast(`Inspection visit confirmed for ${neg.suggestedDate || neg.surveyVisitDate}! Yard ready for your survey.`);
    } catch (err) {
      console.error(err);
      alert('Failed to accept rescheduled date');
    }
  };

  // Helper handlers for dual-synced rate & total formulation
  const handleVolumeChange = (newVol) => {
    const vol = parseFloat(newVol) || 0;
    const rate = parseFloat(surveyForm.offeredPricePerM3) || 0;
    setSurveyForm(prev => ({
      ...prev,
      verifiedVolume: newVol,
      offeredTotalPrice: vol > 0 && rate > 0 ? Math.round(rate * vol) : prev.offeredTotalPrice
    }));
  };

  const handleRateChange = (newRate) => {
    const rate = parseFloat(newRate);
    const vol = parseFloat(surveyForm.verifiedVolume) || 1;
    setSurveyForm(prev => ({
      ...prev,
      offeredPricePerM3: newRate,
      offeredTotalPrice: !isNaN(rate) && rate > 0 ? Math.round(rate * vol) : ''
    }));
  };

  const handleTotalPriceChange = (newTotal) => {
    const total = parseFloat(newTotal);
    const vol = parseFloat(surveyForm.verifiedVolume) || 1;
    setSurveyForm(prev => ({
      ...prev,
      offeredTotalPrice: newTotal,
      offeredPricePerM3: !isNaN(total) && total > 0 && vol > 0 ? Math.round(total / vol) : ''
    }));
  };

  const handleApplyPreset = (percentDiscount) => {
    const askingRate = Number(surveyTargetNeg?.originalPricePerM3 || surveyTargetNeg?.counterOffer?.pricePerM3 || 147695);
    const vol = parseFloat(surveyForm.verifiedVolume) || 1;
    const discountedRate = Math.round(askingRate * (1 - percentDiscount / 100));
    setSurveyForm(prev => ({
      ...prev,
      offeredPricePerM3: discountedRate,
      offeredTotalPrice: Math.round(discountedRate * vol)
    }));
  };

  // Action: Open Survey Details & Price Offer Modal
  const handleOpenSurveyModal = (neg) => {
    const defaultVol = Number(neg.requestedVolume || neg.listingVolume || 1.7);
    const askingRate = Number(neg.originalPricePerM3 || neg.counterOffer?.pricePerM3 || 147695);
    const defaultRate = Number(neg.offeredPricePerM3 || neg.counterOffer?.pricePerM3 || Math.round(askingRate * 0.94));
    const defaultTotal = Math.round(defaultRate * defaultVol);

    setSurveyTargetNeg(neg);
    setSurveyForm({
      verifiedVolume: defaultVol,
      logCount: neg.surveyDetails?.logCount || 2,
      observedGrade: neg.surveyDetails?.observedGrade || 'Grade A Prime Export (Heartwood > 75%, Clear Boles)',
      heartwoodQuality: neg.surveyDetails?.heartwoodQuality || 'High-density solid heartwood, clear end seals, zero hollow decay',
      transitClearanceVerified: true,
      offeredPricePerM3: defaultRate,
      offeredTotalPrice: defaultTotal,
      destinationMill: neg.destinationMill || `${buyerCompany || 'timberbuyers'} Yard`,
      deliveryPreference: neg.deliveryPreference || 'Buyer Arranged Truck Pickup from Yard',
      notes: neg.notes || 'On-site scaling completed with forest caliper. Debarked logs measured and physically verified.'
    });
    setSurveyModalOpen(true);
  };

  // Action: Submit Verified Survey & Price Offer
  const handleSubmitSurveyAndOffer = async (e) => {
    e.preventDefault();
    if (!surveyTargetNeg) return;

    try {
      const vol = Number(surveyForm.verifiedVolume) || 1;
      const rate = Number(surveyForm.offeredPricePerM3) || (Number(surveyForm.offeredTotalPrice) / vol);
      const total = Number(surveyForm.offeredTotalPrice) || Math.round(rate * vol);

      const payload = {
        ...surveyForm,
        offeredPricePerM3: Math.round(rate),
        totalOffered: Math.round(total)
      };

      await marketplaceService.submitSurveyDetailsAndOffer(surveyTargetNeg.id, payload, user);
      setSurveyModalOpen(false);
      loadData();
      showToast(`On-site survey recorded & commercial offer of ₹${Number(payload.offeredPricePerM3).toLocaleString('en-IN')}/m³ (Total: ₹${Number(payload.totalOffered).toLocaleString('en-IN')}) submitted to ${surveyTargetNeg.sellerName}!`);
    } catch (err) {
      console.error(err);
      alert('Failed to submit survey details and offer');
    }
  };

  // Action: Open Timber Purchase Payment Modal
  const handleOpenPaymentModal = (neg) => {
    const orders = marketplaceService.getOrders();
    const existingOrder = orders.find(o => o.negotiationId === neg.id || o.listingId === neg.listingId);

    setPaymentTargetNeg(neg);
    setPaymentTargetOrder(existingOrder || null);
    setPaymentSuccess(false);
    setPaymentReceipt(null);
    setPaymentModalOpen(true);
  };

  // Action: Execute Timber Escrow Payment
  const handleExecutePayment = async () => {
    if (!paymentTargetNeg) return;
    setPaymentProcessing(true);

    try {
      // Find or generate order
      let orderToPay = paymentTargetOrder;
      const finalRate = Number(paymentTargetNeg.offeredPricePerM3 || paymentTargetNeg.counterOffer?.pricePerM3 || 138833);
      const finalVol = Number(paymentTargetNeg.verifiedVolume || paymentTargetNeg.requestedVolume || 1.7);
      const totalAmount = Math.round(finalRate * finalVol);

      if (!orderToPay) {
        orderToPay = await marketplaceService.createOrder({
          negotiationId: paymentTargetNeg.id,
          listingId: paymentTargetNeg.listingId,
          timberItem: paymentTargetNeg.timberTitle,
          species: paymentTargetNeg.timberSpecies,
          volume: finalVol,
          unitPrice: finalRate,
          sellerRole: paymentTargetNeg.sellerRole,
          sellerName: paymentTargetNeg.sellerName,
          sellerEmail: paymentTargetNeg.sellerEmail,
          buyerName,
          buyerEmail,
          destinationMill: paymentTargetNeg.destinationMill || 'Ernakulam Timber Mill Yard #2',
          paymentTerms: 'TreeConnect Escrow Payment'
        }, user);
      }

      const isLoaded = await loadRazorpay();
      const amountPaise = Math.round(totalAmount * 100);

      const completeNegotiationPayment = async (payRef, methodLabel) => {
        await marketplaceService.recordOrderPayment(orderToPay.id, {
          paymentRef: payRef,
          amount: totalAmount,
          paymentMethod: methodLabel
        }, user);

        setPaymentProcessing(false);
        setPaymentModalOpen(false);
        setPaymentTargetNeg(null);
        showToast(`Payment of ₹${totalAmount.toLocaleString('en-IN')} confirmed via Razorpay!`);
        navigate('/buyer/orders', {
          state: {
            paidMessage: {
              message: `Payment of ₹${totalAmount.toLocaleString('en-IN')} verified successfully via Razorpay! Funds transferred directly to ${paymentTargetNeg.sellerName} (Landowner).`,
              payRef
            }
          }
        });
      };

      if (!isLoaded || !window.Razorpay) {
        console.warn('Razorpay SDK not loaded from CDN, running simulated fallback.');
        const fallbackRef = `pay_sim_${Date.now().toString().slice(-8)}`;
        await completeNegotiationPayment(fallbackRef, 'Razorpay Online Gateway (Simulated)');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Fur0pLo5d2MztK',
        amount: amountPaise,
        currency: 'INR',
        name: 'TreeConnect Timber Marketplace',
        description: `Direct Payment to Landowner: ${paymentTargetNeg.sellerName} for ${paymentTargetNeg.timberTitle}`,
        image: 'https://cdn-icons-png.flaticon.com/512/628/628324.png',
        prefill: {
          name: user?.name || user?.fullName || buyerName || 'Arun K',
          email: user?.email || buyerEmail || 'arunbuyer@gmail.com',
          contact: user?.phone || '9876543210'
        },
        notes: {
          negotiation_id: paymentTargetNeg.id,
          order_id: orderToPay.id,
          landowner: paymentTargetNeg.sellerName,
          timber_item: paymentTargetNeg.timberTitle
        },
        theme: {
          color: '#10b981'
        },
        modal: {
          ondismiss: function () {
            setPaymentProcessing(false);
          }
        },
        handler: async function (response) {
          const razorpayPayId = response.razorpay_payment_id || `pay_${Date.now().toString().slice(-8)}`;
          await completeNegotiationPayment(razorpayPayId, 'Razorpay Secure Gateway (UPI / Card / NetBanking)');
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        setPaymentProcessing(false);
        alert('Razorpay Payment Failed: ' + (resp.error?.description || 'Transaction cancelled or declined.'));
      });
      rzpInstance.open();

    } catch (err) {
      console.error(err);
      setPaymentProcessing(false);
      alert('Could not start Razorpay gateway. Please try again.');
    }
  };

  // Action: Accept Counter-Offer
  const handleAcceptDeal = async (neg) => {
    try {
      await marketplaceService.acceptOfferAndCreateOrder(neg.id, user);
      loadData();
      showToast(`Deal agreed at ₹${Number(neg.counterOffer ? neg.counterOffer.pricePerM3 : neg.offeredPricePerM3).toLocaleString('en-IN')}/m³! Official purchase contract created.`);
    } catch (err) {
      console.error(err);
      alert('Failed to accept deal');
    }
  };

  // Action: Decline / Walk Away
  const handleDeclineDeal = (neg) => {
    if (!window.confirm('Are you sure you want to decline this negotiation? This will close the deal with no purchase.')) {
      return;
    }

    try {
      marketplaceService.respondToNegotiation(neg.id, 'reject', {
        sender: 'Buyer',
        senderName: buyerName,
        message: 'Buyer declined the seller terms. Negotiation closed with no agreement.'
      });

      loadData();
      showToast(`Negotiation #${neg.id} closed (No Deal).`);
    } catch (err) {
      console.error(err);
      alert('Failed to decline offer');
    }
  };

  // Tabs calculation
  const actionRequiredCount = negotiations.filter(n =>
    n.status === 'Counter-Offer' ||
    n.status === 'Date Rescheduled by Landowner' ||
    n.status === 'Inspection Scheduled' ||
    (n.status === 'Accepted' && n.paymentStatus !== 'PAID')
  ).length;

  const inspectionVisits = negotiations.filter(n =>
    n.status === 'Inspection Requested' ||
    n.status === 'Date Rescheduled by Landowner' ||
    n.status === 'Inspection Scheduled'
  );

  const pendingReviews = negotiations.filter(n => n.status === 'Pending Review');
  const closedDeals = negotiations.filter(n => n.status === 'Accepted' || n.status === 'Payment Completed' || n.status === 'Rejected');

  const displayedList = negotiations.filter((n) => {
    if (filterTab === 'action') {
      return n.status === 'Counter-Offer' ||
             n.status === 'Date Rescheduled by Landowner' ||
             n.status === 'Inspection Scheduled' ||
             (n.status === 'Accepted' && n.paymentStatus !== 'PAID');
    }
    if (filterTab === 'inspections') {
      return n.status === 'Inspection Requested' ||
             n.status === 'Date Rescheduled by Landowner' ||
             n.status === 'Inspection Scheduled';
    }
    if (filterTab === 'pending') return n.status === 'Pending Review';
    if (filterTab === 'closed') return n.status === 'Accepted' || n.status === 'Payment Completed' || n.status === 'Rejected';
    return true;
  });

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace">
          <main className="dashboard-content max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
            
            {/* TOAST ALERT */}
            {toastMessage && (
              <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 flex items-center gap-3 shadow-xl animate-fade-in">
                <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
                <span className="font-semibold text-sm">{toastMessage}</span>
              </div>
            )}

            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-color">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-1.5">
                    <Handshake size={13} /> My Negotiations & Timber Surveys
                  </span>
                  <span className="text-xs text-muted font-medium">Site Inspections • Survey Logging • Price Offers • Escrow Payments</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
                  Timber Survey & Negotiation Center
                </h1>
                <p className="text-sm text-muted mt-1 max-w-2xl">
                  Align inspection dates with landowners, perform on-site log measurements & girth surveys, formulate commercial price offers, and complete safe timber escrow payments.
                </p>
              </div>

              <Link to="/buyer/marketplace" className="btn btn-secondary btn-sm flex items-center gap-2">
                <ShoppingBag size={15} /> Browse More Lots
              </Link>
            </div>

            {/* FILTER TABS */}
            <div className="flex items-center gap-2 border-b border-color overflow-x-auto pb-1 text-xs font-bold">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                All Records ({negotiations.length})
              </button>

              <button
                onClick={() => setFilterTab('action')}
                className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 relative cursor-pointer ${
                  filterTab === 'action'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                Action Required
                {actionRequiredCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500 text-black font-bold">
                    {actionRequiredCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFilterTab('inspections')}
                className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  filterTab === 'inspections'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                Site Inspections ({inspectionVisits.length})
              </button>

              <button
                onClick={() => setFilterTab('pending')}
                className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  filterTab === 'pending'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                Pending Landowner Review ({pendingReviews.length})
              </button>

              <button
                onClick={() => setFilterTab('closed')}
                className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  filterTab === 'closed'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                Agreed / Paid Deals ({closedDeals.length})
              </button>
            </div>

            {/* ========================================================= */}
            {/* NEGOTIATIONS & TIMBER SURVEY LIST */}
            {/* ========================================================= */}
            {displayedList.length === 0 ? (
              <div className="tc-buyer-card text-center py-12">
                <Handshake size={44} className="mx-auto text-amber-400 mb-3" />
                <h3 className="text-base font-bold text-main mb-1">No Records In This Category</h3>
                <p className="text-xs text-muted max-w-sm mx-auto mb-4">
                  Browse verified timber lots in the marketplace to schedule your on-site log inspection visit.
                </p>
                <Link to="/buyer/marketplace" className="tc-buyer-action-btn mx-auto inline-flex">
                  <ShoppingBag size={14} /> Go to Timber Marketplace
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {displayedList.map((neg) => {
                  const isInspectionRequested = neg.status === 'Inspection Requested';
                  const isDateRescheduled = neg.status === 'Date Rescheduled by Landowner';
                  const isInspectionScheduled = neg.status === 'Inspection Scheduled';
                  const isPendingOffer = neg.status === 'Pending Review';
                  const isCounter = neg.status === 'Counter-Offer';
                  const isAccepted = neg.status === 'Accepted';
                  const isPaid = neg.paymentStatus === 'PAID' || neg.status === 'Payment Completed';
                  const isRejected = neg.status === 'Rejected';

                  const displayedVol = Number(neg.verifiedVolume || neg.requestedVolume || neg.listingVolume || 1.7);
                  const askingRate = Number(neg.originalPricePerM3 || 147695);
                  const offeredRate = Number(neg.offeredPricePerM3 || (isCounter ? neg.counterOffer?.pricePerM3 : 0));
                  const totalValue = Number(neg.totalOffered || (offeredRate * displayedVol) || (askingRate * displayedVol));

                  return (
                    <div
                      key={neg.id}
                      className={`tc-buyer-card ${
                        isCounter || isDateRescheduled
                          ? 'tc-buyer-card-amber'
                          : isInspectionScheduled
                          ? ''
                          : isPaid
                          ? ''
                          : ''
                      }`}
                    >
                      {/* Top Header Row */}
                      <div className="tc-buyer-header">
                        <div className="tc-buyer-user-info">
                          <div className={`tc-buyer-avatar-badge ${
                            isCounter || isDateRescheduled
                              ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
                              : isInspectionScheduled || isAccepted || isPaid
                              ? 'text-emerald bg-emerald-500/15 border-emerald-500/30'
                              : 'text-blue-400 bg-blue-500/15 border-blue-500/30'
                          }`}>
                            {isPaid ? (
                              <CheckCircle2 size={22} className="text-emerald" />
                            ) : isInspectionScheduled ? (
                              <ClipboardCheck size={22} className="text-emerald" />
                            ) : isInspectionRequested ? (
                              <Calendar size={22} className="text-blue-400" />
                            ) : (
                              <Handshake size={22} />
                            )}
                          </div>
                          <div className="tc-buyer-title-group">
                            <div className="tc-buyer-title-row">
                              <span className="tc-buyer-title">{neg.timberTitle}</span>
                              <span
                                className={`tc-buyer-verified-badge ${
                                  isCounter || isDateRescheduled || isPendingOffer
                                    ? 'tc-buyer-verified-badge-amber'
                                    : isInspectionScheduled || isAccepted || isPaid
                                    ? ''
                                    : 'tc-buyer-verified-badge-blue'
                                }`}
                              >
                                {isPaid ? 'Payment Confirmed' : neg.status}
                              </span>
                            </div>
                            <p className="tc-buyer-subtitle">
                              Seller: <strong className="text-white">{neg.sellerName}</strong> ({neg.sellerRole}) • Deal ID: <span className="font-mono text-slate-300">{neg.id}</span> • Date: {neg.createdAt}
                            </p>
                          </div>
                        </div>

                        <div className="tc-buyer-header-actions">
                          {neg.sellerPhone && (
                            <a href={`tel:${neg.sellerPhone}`} className="tc-buyer-pill-btn">
                              <Phone size={13} /> {neg.sellerPhone}
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteNegotiation(neg)}
                            className="tc-buyer-pill-btn text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/60 hover:bg-red-950/40 transition-all cursor-pointer"
                            title="Remove negotiation details"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>

                      {/* 4-Cell Middle Metrics Grid */}
                      <div className="tc-buyer-metrics-grid">
                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">SELLER BENCHMARK RATE</span>
                          <div className="tc-buyer-metric-val">
                            <span>₹ {askingRate.toLocaleString('en-IN')}/m³</span>
                          </div>
                          <span className="tc-buyer-metric-hint">Official Asking Benchmark</span>
                        </div>

                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">
                            {neg.surveyCompleted || offeredRate > 0 ? 'OFFERED RATE (POST-SURVEY)' : 'INSPECTION STATUS'}
                          </span>
                          <div className={`tc-buyer-metric-val ${offeredRate > 0 ? 'text-emerald' : 'text-slate-300'}`}>
                            {offeredRate > 0 ? (
                              <span className="text-emerald">₹ {offeredRate.toLocaleString('en-IN')}/m³</span>
                            ) : (
                              <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                                <Calendar size={13} /> {formatInspectionDate(neg.surveyVisitDate)}
                              </span>
                            )}
                          </div>
                          <span className="tc-buyer-metric-hint truncate">
                            {offeredRate > 0 ? 'Verified Field Offer' : formatInspectionTimeSlot(neg.surveyTimeSlot)}
                          </span>
                        </div>

                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">INSPECTED LOT VOLUME</span>
                          <div className="tc-buyer-metric-val">
                            <Trees size={14} className="text-emerald" />
                            <span>{displayedVol} m³</span>
                          </div>
                          <span className="tc-buyer-metric-hint truncate">
                            {neg.surveyDetails?.observedGrade ? neg.surveyDetails.observedGrade.split('(')[0].trim() : (neg.deliveryPreference || 'On-Site Estate Yard')}
                          </span>
                        </div>

                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">TOTAL COMMERCIAL VALUE</span>
                          <div className="tc-buyer-metric-val text-gold">
                            <span className="text-gold">
                              {offeredRate > 0 ? `₹ ${totalValue.toLocaleString('en-IN')}` : 'To be determined'}
                            </span>
                          </div>
                          <span className="tc-buyer-metric-hint">
                            {isPaid ? '✓ Paid to Escrow' : 'TreeConnect Escrow Protected'}
                          </span>
                        </div>
                      </div>

                      {/* PHASE 2: LANDOWNER SUGGESTED ANOTHER DATE ALERT */}
                      {isDateRescheduled && (
                        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/60 space-y-3 shadow-lg animate-fade-in">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                                <RotateCcw size={16} /> Landowner Suggested Alternative Inspection Date
                              </span>
                            </div>
                            <span className="text-xs font-bold text-amber-300 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40">
                              Reschedule Proposal
                            </span>
                          </div>

                          <div className="p-3 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-slate-200 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Calendar size={14} className="text-amber-400" />
                              <span>Proposed Date: <strong className="text-white font-mono">{formatInspectionDate(neg.suggestedDate)}</strong> • <span className="text-amber-200">{formatInspectionTimeSlot(neg.suggestedTimeSlot || neg.surveyTimeSlot)}</span></span>
                            </div>
                            {neg.rescheduleReason && (
                              <div className="text-amber-200/90 text-[11px] pt-1">
                                <strong>Landowner Note:</strong> "{neg.rescheduleReason}"
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-1">
                            <button
                              onClick={() => handleAcceptRescheduledDate(neg)}
                              className="tc-buyer-action-amber-btn flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <Check size={14} /> Accept Suggested Date ({formatInspectionDate(neg.suggestedDate)})
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PHASE 2 & 3: INSPECTION APPROVED & SCHEDULED BANNER */}
                      {isInspectionScheduled && (
                        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-3 shadow-lg animate-fade-in">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                                <CheckCircle2 size={16} className="text-emerald-400" /> Site Inspection Approved & Scheduled
                              </span>
                            </div>
                            <span className="text-xs font-bold text-emerald-300 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                              Ready for On-Site Visit
                            </span>
                          </div>

                          <div className="p-3 rounded-lg bg-black/60 border border-emerald-500/30 text-xs text-slate-200 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Calendar size={14} className="text-emerald-400" />
                              <span>Scheduled Date: <strong className="text-white font-mono">{formatInspectionDate(neg.approvedInspectionDate || neg.surveyVisitDate)}</strong> • <span className="text-emerald-300">{formatInspectionTimeSlot(neg.approvedTimeSlot || neg.surveyTimeSlot)}</span></span>
                            </div>
                            <div className="text-[11px] text-emerald-300 flex items-center gap-1">
                              <MapPin size={13} /> Seller Log Yard ready for buyer inspection
                            </div>
                          </div>

                          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-emerald-500/20">
                            <span className="text-[11px] text-slate-300">
                              Visit the yard to inspect log girth, heartwood quality, debarking, & transit pass, then record survey details and price offer.
                            </span>
                            <button
                              onClick={() => handleOpenSurveyModal(neg)}
                              className="tc-buyer-action-emerald-btn flex items-center gap-2 cursor-pointer shadow-lg"
                            >
                              <ClipboardCheck size={15} /> Record Survey Details & Submit Price Offer →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PHASE 3: OFFER SUBMITTED & AWAITING LANDOWNER REVIEW BANNER */}
                      {isPendingOffer && (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 via-black/75 to-slate-950/80 border border-amber-500/35 space-y-3.5 shadow-md">
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                                <Clock size={18} className="animate-pulse" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-extrabold text-white text-sm">Commercial Survey & Price Offer Submitted</h4>
                                  <span className="text-[10px] text-amber-300 font-mono bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                                    • Awaiting Landowner Decision
                                  </span>
                                </div>
                                <p className="text-[11.5px] text-slate-300 mt-1 leading-relaxed">
                                  Your on-site survey measurements ({neg.surveyDetails?.verifiedVolume || displayedVol} m³) and purchase offer of <strong className="text-emerald-400 font-mono">₹ {offeredRate.toLocaleString('en-IN')}/m³</strong> (Total Proposed: <strong className="text-gold font-mono">₹ {totalValue.toLocaleString('en-IN')}</strong>) are currently under review by <strong>{neg.sellerName}</strong>.
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 flex items-center gap-1.5 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> PENDING REVIEW
                            </span>
                          </div>

                          {/* Proposal Summary Strip */}
                          <div className="p-3 rounded-xl bg-black/65 border border-amber-500/25 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                            <div className="flex items-center gap-2.5">
                              <DollarSign size={14} className="text-amber-400 flex-shrink-0" />
                              <div>
                                <div className="text-[9px] uppercase tracking-wider text-amber-400/90 font-bold">OFFERED RATE</div>
                                <div className="font-extrabold text-emerald-400 text-xs font-mono mt-0.5">₹ {offeredRate.toLocaleString('en-IN')} / m³</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-amber-500/20 pt-2 sm:pt-0 sm:pl-3">
                              <Trees size={14} className="text-emerald-400 flex-shrink-0" />
                              <div>
                                <div className="text-[9px] uppercase tracking-wider text-amber-400/90 font-bold">TOTAL PROPOSED LOT VALUE</div>
                                <div className="font-extrabold text-gold text-xs font-mono mt-0.5">₹ {totalValue.toLocaleString('en-IN')} <span className="text-slate-400 font-normal">({displayedVol} m³)</span></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between border-t sm:border-t-0 sm:border-l border-amber-500/20 pt-2 sm:pt-0 sm:pl-3">
                              <div className="flex items-center gap-2.5">
                                <Truck size={14} className="text-sky-400 flex-shrink-0" />
                                <div>
                                  <div className="text-[9px] uppercase tracking-wider text-amber-400/90 font-bold">HAULAGE PREFERENCE</div>
                                  <div className="font-bold text-white text-xs mt-0.5 truncate">{neg.deliveryPreference || 'Buyer Arranged Truck Pickup'}</div>
                                </div>
                              </div>
                              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                                Escrow Protected
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PHASE 3: RECORDED SURVEY FINDINGS (If Survey Completed) */}
                      {neg.surveyCompleted && neg.surveyDetails && (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-black/75 to-black/90 border border-emerald-500/30 space-y-3 shadow-md">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                              <Trees size={15} /> Recorded Timber Survey Findings
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                              Surveyor: <strong className="text-slate-200">{neg.surveyDetails.surveyorName || buyerName}</strong>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                            <div className="p-3 rounded-xl bg-black/55 border border-emerald-500/25 flex flex-col justify-between shadow-sm">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">VERIFIED VOLUME</span>
                              <div className="text-sm font-extrabold text-white font-mono mt-1">
                                {neg.surveyDetails.verifiedVolume} m³
                              </div>
                              <span className="text-[10px] text-slate-400 mt-0.5">Quarter-Girth Scale</span>
                            </div>

                            <div className="p-3 rounded-xl bg-black/55 border border-emerald-500/25 flex flex-col justify-between shadow-sm">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">DEBARKED LOGS</span>
                              <div className="text-xs font-bold text-white mt-1">
                                {neg.surveyDetails.logCount} Individual Logs
                              </div>
                              <span className="text-[10px] text-slate-400 mt-0.5">Measured & Stenciled</span>
                            </div>

                            <div className="p-3 rounded-xl bg-black/55 border border-emerald-500/25 flex flex-col justify-between shadow-sm">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">OBSERVED GRADE</span>
                              <div className="text-xs font-bold text-emerald-300 mt-1 truncate" title={neg.surveyDetails.observedGrade}>
                                {neg.surveyDetails.observedGrade ? neg.surveyDetails.observedGrade.split('(')[0].trim() : 'Grade A Prime'}
                              </div>
                              <span className="text-[10px] text-slate-400 mt-0.5 truncate">
                                {neg.surveyDetails.observedGrade?.includes('(') ? neg.surveyDetails.observedGrade.match(/\((.*?)\)/)?.[1] : 'Clear Boles'}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-black/55 border border-emerald-500/25 flex flex-col justify-between shadow-sm">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">TRANSIT CLEARANCE</span>
                              <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                                <ShieldCheck size={13} className="text-emerald-400" /> Hammer Verified
                              </div>
                              <span className="text-[10px] text-slate-400 mt-0.5">Forest Dept Registered</span>
                            </div>
                          </div>

                          {neg.surveyDetails.heartwoodQuality && (
                            <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/20 text-xs flex items-start gap-2">
                              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex-shrink-0 mt-0.5">Heartwood Assessment:</span>
                              <span className="text-slate-200 leading-relaxed">{neg.surveyDetails.heartwoodQuality}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* COUNTER-OFFER ALERT BOX */}
                      {isCounter && neg.counterOffer && (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/35 via-[#061e14]/90 to-black/95 border border-emerald-500/35 space-y-3 shadow-md">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-emerald-300 flex items-center gap-1.5">
                                <RotateCcw size={16} className="text-emerald-400" /> Seller Counter-Target Proposal:
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                                Negotiated Rate
                              </span>
                            </div>
                            <span className="font-extrabold text-emerald-300 text-base font-mono">
                              ₹ {Number(neg.counterOffer.pricePerM3).toLocaleString('en-IN')} / m³
                            </span>
                          </div>

                          {neg.counterOffer.adjustmentReason && (
                            <div className="text-xs text-slate-200 bg-black/60 p-2.5 rounded-xl border border-emerald-500/25 flex items-start gap-2 shadow-sm">
                              <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                              <span><strong className="text-emerald-400 uppercase text-[10px] tracking-wider mr-1.5 font-bold">Commercial Justification:</strong> {neg.counterOffer.adjustmentReason}</span>
                            </div>
                          )}

                          {neg.counterOffer.message && (
                            <p className="text-xs text-slate-300 italic bg-emerald-950/25 p-2.5 rounded-xl border border-emerald-500/20 leading-relaxed shadow-sm">
                              "{neg.counterOffer.message}"
                            </p>
                          )}

                          <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400 pt-2 border-t border-emerald-500/20">
                            <span>
                              Gross Proposed Deal Value: <strong className="text-gold font-mono font-bold text-sm">₹ {(Number(neg.counterOffer.pricePerM3) * Number(neg.requestedVolume || 1.7)).toLocaleString('en-IN')}</strong> for {neg.requestedVolume || 1.7} m³
                            </span>
                            <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1 bg-emerald-950/70 px-2.5 py-1 rounded-md border border-emerald-500/30 shadow-sm">
                              <CheckCircle2 size={13} className="text-emerald-400" /> Direct Timber Settlement
                            </span>
                          </div>
                        </div>
                      )}

                      {/* PHASE 4 & 5: CONTRACT ACCEPTED & READY FOR PAYMENT BANNER */}
                      {isAccepted && !isPaid && (
                        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-3 shadow-lg animate-fade-in">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                                <CheckCircle2 size={16} className="text-emerald-400" /> Timber Purchase Offer Accepted by Landowner!
                              </span>
                            </div>
                            <span className="text-xs font-bold text-emerald-300 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                              Ready for Payment
                            </span>
                          </div>

                          <div className="p-3 rounded-lg bg-black/60 border border-emerald-500/30 text-xs text-slate-200 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <span>Agreed Rate: <strong className="text-emerald font-mono">₹ {offeredRate.toLocaleString('en-IN')}/m³</strong> for {displayedVol} m³</span>
                              <div className="text-gold font-extrabold text-base font-mono mt-0.5">
                                Total Purchase Amount: ₹ {totalValue.toLocaleString('en-IN')}
                              </div>
                            </div>

                            <button
                              onClick={() => handleOpenPaymentModal(neg)}
                              className="tc-buyer-action-amber-btn flex items-center gap-2 px-5 py-2.5 text-sm font-bold shadow-xl cursor-pointer"
                            >
                              <CreditCard size={16} /> Pay for Timber Purchase (₹ {totalValue.toLocaleString('en-IN')}) →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PHASE 5: PAYMENT COMPLETED BANNER */}
                      {isPaid && (
                        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 space-y-2 shadow-lg">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={18} className="text-emerald-400" />
                              <span className="font-bold text-sm text-emerald-200">
                                Timber Purchase Payment Confirmed • Escrow Protected
                              </span>
                            </div>
                            <span className="text-xs font-mono text-emerald-300 px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/40">
                              Ref: {neg.paymentRef || 'PAY-TC-CONFIRMED'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">
                            Payment has been received in escrow. Kerala Forest Department transit pass is authorized and log hauling to your destination mill is in progress.
                          </p>
                          <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                            <Link to="/buyer/orders" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 underline">
                              <Truck size={13} /> View Logistics & Tracking in Purchase Orders →
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Discussion & Timeline History */}
                      {neg.timeline && neg.timeline.length > 0 && (
                        <div className="tc-buyer-history-box">
                          <div className="tc-buyer-history-header">
                            <span className="tc-buyer-history-title">
                              <Clock size={12} className="text-emerald" /> Inspection & Negotiation History
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{neg.timeline.length} updates</span>
                          </div>
                          <div className="tc-buyer-history-list">
                            {neg.timeline.map((msg, idx) => (
                              <div key={idx} className="tc-buyer-history-row">
                                <span className="tc-buyer-history-date">{msg.date}</span>
                                <div className="tc-buyer-history-text">
                                  <strong className="tc-buyer-history-sender">{msg.senderName || msg.sender}:</strong>
                                  <span>{msg.message}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bottom Financial / Action Row */}
                      <div className="tc-buyer-bottom-grid">
                        <div className="tc-buyer-highlight-cell">
                          <span className="tc-buyer-metric-label">LIFECYCLE STATUS</span>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            {isPaid ? (
                              <span className="text-emerald flex items-center gap-1"><CheckCircle2 size={14} /> Paid & Secured</span>
                            ) : isAccepted ? (
                              <span className="text-emerald flex items-center gap-1"><CheckCircle2 size={14} /> Deal Agreed</span>
                            ) : isInspectionScheduled ? (
                              <span className="text-emerald flex items-center gap-1"><Calendar size={14} /> Inspection Approved</span>
                            ) : isDateRescheduled ? (
                              <span className="text-amber-400 flex items-center gap-1"><RotateCcw size={14} /> Alternate Date Proposed</span>
                            ) : isInspectionRequested ? (
                              <span className="text-blue-400 flex items-center gap-1"><Clock size={14} /> Inspection Requested</span>
                            ) : isCounter ? (
                              <span className="text-amber-400 flex items-center gap-1"><RotateCcw size={14} /> Counter Received</span>
                            ) : isRejected ? (
                              <span className="text-red-400 flex items-center gap-1"><X size={14} /> Declined / Closed</span>
                            ) : (
                              <span className="text-slate-300 flex items-center gap-1"><Clock size={14} /> Waiting for Seller</span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-300">
                            {neg.surveyVisitDate ? `Visit: ${neg.surveyVisitDate}` : 'Inspection Step'}
                          </span>
                        </div>

                        {/* Middle Action Cell */}
                        {isCounter ? (
                          <div className="tc-buyer-amber-cell col-span-1 sm:col-span-2">
                            <span className="tc-buyer-metric-label text-amber-300">ACTION REQUIRED</span>
                            <div className="text-xs text-slate-200">
                              Accept seller's counter-offer to generate official purchase order, or decline to walk away.
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => handleAcceptDeal(neg)}
                                className="tc-buyer-action-amber-btn flex-1"
                              >
                                <Check size={14} /> Accept Deal (₹{Number(neg.counterOffer.pricePerM3).toLocaleString('en-IN')}/m³)
                              </button>
                              <button
                                onClick={() => handleDeclineDeal(neg)}
                                className="tc-buyer-pill-btn text-red-400 border-red-500/40 hover:bg-red-950/40"
                              >
                                <X size={14} /> Decline
                              </button>
                            </div>
                          </div>
                        ) : isDateRescheduled ? (
                          <div className="tc-buyer-amber-cell col-span-1 sm:col-span-2">
                            <span className="tc-buyer-metric-label text-amber-300">LANDOWNER RESCHEDULED INSPECTION</span>
                            <div className="text-xs text-slate-200">
                              Seller proposed: {neg.suggestedDate} ({neg.suggestedTimeSlot}). Accept to confirm inspection visit.
                            </div>
                            <button
                              onClick={() => handleAcceptRescheduledDate(neg)}
                              className="tc-buyer-action-amber-btn mt-1"
                            >
                              <Check size={14} /> Confirm New Date: {neg.suggestedDate}
                            </button>
                          </div>
                        ) : isInspectionScheduled ? (
                          <div className="tc-buyer-highlight-cell col-span-1 sm:col-span-2">
                            <span className="tc-buyer-metric-label text-emerald">INSPECTION APPROVED</span>
                            <div className="text-xs text-slate-200">
                              Inspection on <strong className="text-white">{formatInspectionDate(neg.approvedInspectionDate || neg.surveyVisitDate)}</strong> • <span className="text-emerald-300">{formatInspectionTimeSlot(neg.approvedTimeSlot || neg.surveyTimeSlot)}</span>. When on site, record survey measurements and submit price offer.
                            </div>
                            <button
                              onClick={() => handleOpenSurveyModal(neg)}
                              className="tc-buyer-action-emerald-btn mt-1"
                            >
                              <ClipboardCheck size={14} /> Record Survey Details & Price Offer →
                            </button>
                          </div>
                        ) : isInspectionRequested ? (
                          <div className="tc-buyer-highlight-cell col-span-1 sm:col-span-2">
                            <span className="tc-buyer-metric-label text-blue-400">INSPECTION VISIT REQUESTED</span>
                            <div className="text-xs text-slate-300">
                              You requested an on-site visit for <strong className="text-white">{formatInspectionDate(neg.surveyVisitDate)}</strong> • <span className="text-blue-300">{formatInspectionTimeSlot(neg.surveyTimeSlot)}</span>. Landowner is reviewing to approve or propose an alternate date.
                            </div>
                          </div>
                        ) : isAccepted && !isPaid ? (
                          <div className="tc-buyer-highlight-cell col-span-1 sm:col-span-2">
                            <span className="tc-buyer-metric-label text-emerald">OFFER ACCEPTED</span>
                            <div className="text-xs text-slate-300">
                              Timber purchase contract is ready. Complete payment into RBI escrow to authorize dispatch.
                            </div>
                            <button
                              onClick={() => handleOpenPaymentModal(neg)}
                              className="tc-buyer-action-amber-btn mt-1"
                            >
                              <CreditCard size={14} /> Proceed to Timber Payment (₹ {totalValue.toLocaleString('en-IN')})
                            </button>
                          </div>
                        ) : isPaid ? (
                          <div className="tc-buyer-highlight-cell col-span-1 sm:col-span-2">
                            <span className="tc-buyer-metric-label text-emerald">PURCHASE FULFILLMENT ACTIVE</span>
                            <div className="text-xs text-slate-300">
                              Payment confirmed. Transit pass active. Log truck hauling dispatched to {neg.destinationMill || 'your mill'}.
                            </div>
                            <Link to="/buyer/orders" className="tc-buyer-action-emerald-btn mt-1">
                              <Truck size={14} /> View in Purchase Orders →
                            </Link>
                          </div>
                        ) : (
                          <div className="tc-buyer-highlight-cell col-span-1 sm:col-span-2">
                            <span className="tc-buyer-metric-label">OFFER UNDER REVIEW</span>
                            <div className="text-xs text-slate-300">
                              Submitted offer is under review by {neg.sellerName}. You will receive a notification when accepted or countered.
                            </div>
                          </div>
                        )}

                        <div className="tc-buyer-highlight-cell">
                          <span className="tc-buyer-metric-label">TREE CONNECT ESCROW</span>
                          <div className="text-xs font-semibold text-emerald flex items-center gap-1">
                            <ShieldCheck size={14} /> 100% Protected
                          </div>
                          <span className="text-[10px] text-muted">Disbursed on mill weighbridge acceptance</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 1: RECORD ON-SITE TIMBER SURVEY & PRICE OFFER */}
            {/* ========================================================= */}
            {surveyModalOpen && surveyTargetNeg && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] overflow-y-auto p-4 sm:p-6 flex justify-center items-center">
                <div className="tc-negotiate-modal-box my-auto animate-scale-up max-w-xl w-full">
                  {/* Header */}
                  <div className="tc-modal-header">
                    <h3 className="tc-modal-title">
                      <ClipboardCheck size={18} className="text-emerald" /> Record On-Site Timber Survey & Commercial Offer
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSurveyModalOpen(false)}
                      className="tc-modal-close"
                      title="Close modal"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitSurveyAndOffer} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="tc-modal-body text-xs space-y-4">
                      {/* Top Header Card: Site Inspection Confirmed (Image 2 Style) */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-black/70 border border-emerald-500/35 space-y-3.5 shadow-md">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                              <CheckCircle2 size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold text-white text-sm">Site Inspection Confirmed</h3>
                                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                                  {surveyTargetNeg.timberSpecies || 'Teak'} #{surveyTargetNeg.id ? String(surveyTargetNeg.id).slice(-6) : '86_721'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                Log yard prepared for buyer inspection at <strong>{surveyTargetNeg.sellerName}'s</strong> estate. Verify physical scale measurements and submit your commercial price offer below.
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> CONFIRMED VISIT
                          </span>
                        </div>

                        {/* Timing Strip Container (Exact Image 2 Style) */}
                        <div className="p-3 rounded-xl bg-black/65 border border-emerald-500/25 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          <div className="flex items-center gap-2.5">
                            <Calendar size={14} className="text-emerald-400 flex-shrink-0" />
                            <div>
                              <div className="text-[9px] uppercase tracking-wider text-emerald-400/90 font-bold">CONFIRMED VISIT DATE</div>
                              <div className="font-bold text-white text-xs mt-0.5">{formatInspectionDate(surveyTargetNeg.approvedInspectionDate || surveyTargetNeg.surveyVisitDate)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-emerald-500/20 pt-2 sm:pt-0 sm:pl-3">
                            <Clock size={14} className="text-emerald-400 flex-shrink-0" />
                            <div>
                              <div className="text-[9px] uppercase tracking-wider text-emerald-400/90 font-bold">INSPECTION SLOT</div>
                              <div className="font-bold text-white text-xs mt-0.5">{formatInspectionTimeSlot(surveyTargetNeg.surveyTimeSlot)}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t sm:border-t-0 sm:border-l border-emerald-500/20 pt-2 sm:pt-0 sm:pl-3">
                            <div className="flex items-center gap-2.5">
                              <MapPin size={14} className="text-emerald-400 flex-shrink-0" />
                              <div>
                                <div className="text-[9px] uppercase tracking-wider text-emerald-400/90 font-bold">VENUE</div>
                                <div className="font-bold text-white text-xs mt-0.5">Seller Log Yard</div>
                              </div>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                              ✓ Yard Ready
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 4 Metric Cards Grid (Exact Image 2 Style) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 rounded-xl bg-black/45 border border-emerald-500/25 flex flex-col justify-between shadow-sm">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ORIGINAL ASKING</span>
                          <div className="text-sm font-extrabold text-white font-mono mt-1">
                            ₹ {Number(surveyTargetNeg.originalPricePerM3 || 147695).toLocaleString('en-IN')} <span className="text-[10px] font-normal text-slate-400">/ m³</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1">Catalogue Rate</span>
                        </div>

                        <div className="p-3 rounded-xl bg-black/45 border border-emerald-500/25 flex flex-col justify-between shadow-sm">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">INSPECTION TIMING</span>
                          <div className="text-xs font-bold text-white mt-1">
                            {formatInspectionDate(surveyTargetNeg.approvedInspectionDate || surveyTargetNeg.surveyVisitDate)}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1">{formatInspectionTimeSlot(surveyTargetNeg.surveyTimeSlot)}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-black/45 border border-emerald-500/25 flex flex-col justify-between shadow-sm">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PARCEL VOLUME</span>
                          <div className="text-sm font-extrabold text-emerald-400 font-mono mt-1">
                            {surveyTargetNeg.requestedVolume || 1.7} m³
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 truncate">{surveyForm.deliveryPreference || 'Buyer Arranged Truck Pickup'}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-black/45 border border-emerald-500/25 flex flex-col justify-between shadow-sm">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">INSPECTION STATUS</span>
                          <div className="text-xs font-extrabold text-amber-400 mt-1 flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-400" /> Date Confirmed
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1">Ready for Offer</span>
                        </div>
                      </div>

                      {/* On-Site Survey Measurement Fields */}
                      {/* Card 1: On-Site Inspection & Scaling Measurements */}
                      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Trees size={13} /> 1. On-Site Log Inspection & Scaling Measurements
                          </span>
                          <span className="text-[10px] text-emerald-300/80 font-mono font-medium">Physical Scaling</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="tc-modal-form-group mb-0">
                            <label className="tc-modal-label">
                              Verified Volume (m³) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.1"
                              value={surveyForm.verifiedVolume}
                              onChange={(e) => handleVolumeChange(e.target.value)}
                              className="tc-modal-input text-white font-mono"
                              required
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block">Quarter-girth scaling after bark deduction</span>
                          </div>

                          <div className="tc-modal-form-group mb-0">
                            <label className="tc-modal-label">
                              Debarked Logs Count *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={surveyForm.logCount}
                              onChange={(e) => setSurveyForm({ ...surveyForm, logCount: e.target.value })}
                              className="tc-modal-input text-white font-mono"
                              required
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block">Total individual logs physically verified</span>
                          </div>
                        </div>

                        <div className="tc-modal-form-group mb-0">
                          <label className="tc-modal-label">
                            Observed Log Quality Grade *
                          </label>
                          <select
                            value={surveyForm.observedGrade}
                            onChange={(e) => setSurveyForm({ ...surveyForm, observedGrade: e.target.value })}
                            className="tc-modal-input"
                            required
                          >
                            <option value="Grade A Prime Export (Heartwood > 75%, Clear Boles)">Grade A Prime Export (Heartwood &gt; 75%, Clear Boles)</option>
                            <option value="Grade B Commercial Sawlog (Standard Girth Mill Cut)">Grade B Commercial Sawlog (Standard Girth Mill Cut)</option>
                            <option value="Grade C Utility Sawlog / Veneer Core">Grade C Utility Sawlog / Veneer Core</option>
                          </select>
                        </div>

                        <div className="tc-modal-form-group mb-0">
                          <label className="tc-modal-label">
                            Heartwood & Defect Assessment
                          </label>
                          <input
                            type="text"
                            value={surveyForm.heartwoodQuality}
                            onChange={(e) => setSurveyForm({ ...surveyForm, heartwoodQuality: e.target.value })}
                            className="tc-modal-input"
                            placeholder="e.g. Solid heartwood, zero hollow, end-sealed against crack"
                          />
                        </div>

                        <div 
                          className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/25 flex items-center gap-2.5 cursor-pointer hover:bg-emerald-950/60 transition-colors"
                          onClick={() => setSurveyForm({ ...surveyForm, transitClearanceVerified: !surveyForm.transitClearanceVerified })}
                        >
                          {surveyForm.transitClearanceVerified ? (
                            <CheckSquare size={16} className="text-emerald flex-shrink-0" />
                          ) : (
                            <Square size={16} className="text-slate-400 flex-shrink-0" />
                          )}
                          <span className="text-xs text-slate-200">
                            Physical hammer mark & Kerala Forest Dept transit registry verified at the yard
                          </span>
                        </div>
                      </div>

                      {/* Card 2: Commercial Price Offer Formulation */}
                      {(() => {
                        const askingRate = Number(surveyTargetNeg.originalPricePerM3 || surveyTargetNeg.counterOffer?.pricePerM3 || 147695);
                        const vol = Number(surveyForm.verifiedVolume) || 1;
                        const askingTotal = Math.round(askingRate * vol);
                        const currentRate = Number(surveyForm.offeredPricePerM3) || 0;
                        const currentTotal = Number(surveyForm.offeredTotalPrice) || Math.round(currentRate * vol);
                        const diffPercent = (askingRate > 0 && currentRate > 0)
                          ? parseFloat((((currentRate - askingRate) / askingRate) * 100).toFixed(1))
                          : null;
                        const diffAmount = askingTotal - currentTotal;

                        return (
                          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/35 space-y-4 shadow-sm">
                            {/* Card Header & Variance Badge */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                                <DollarSign size={13} /> 2. Formulate Commercial Price Offer
                              </span>
                              {diffPercent !== null && (
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                                  diffPercent < 0 
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                                    : diffPercent === 0
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                                    : 'bg-sky-500/15 text-sky-300 border-sky-500/35'
                                }`}>
                                  {diffPercent < 0 ? (
                                    <>
                                      <TrendingDown size={11} /> {Math.abs(diffPercent)}% below asking (save ₹{Math.abs(diffAmount).toLocaleString('en-IN')})
                                    </>
                                  ) : diffPercent === 0 ? (
                                    <>
                                      <CheckCircle2 size={11} /> Matches Seller Asking Rate
                                    </>
                                  ) : (
                                    <>
                                      +{diffPercent}% above asking
                                    </>
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Benchmark Baseline Strip */}
                            <div className="tc-benchmark-bar">
                              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs">
                                <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Seller Asking Baseline:</span>
                                <span className="font-mono font-bold text-amber-200">
                                  ₹ {askingRate.toLocaleString('en-IN')} <span className="text-slate-400 text-[10px] font-normal">/ m³</span>
                                </span>
                                <span className="text-slate-500">•</span>
                                <span className="font-mono font-bold text-amber-100">
                                  ₹ {askingTotal.toLocaleString('en-IN')} <span className="text-slate-400 text-[10px] font-normal">Total ({vol} m³)</span>
                                </span>
                              </div>
                              <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                                {surveyTargetNeg.negotiable !== false ? 'Negotiable Listing' : 'Fixed Price'}
                              </span>
                            </div>

                            {/* Dual-Synced Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              <div className="tc-modal-form-group mb-0">
                                <div className="flex items-center justify-between mb-1.5 gap-2">
                                  <label className="tc-modal-label mb-0">
                                    Offered Unit Rate (₹ / m³) *
                                  </label>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                                    <ArrowLeftRight size={9} /> Auto-syncs
                                  </span>
                                </div>
                                <div className="tc-currency-input-wrap">
                                  <span className="tc-currency-prefix text-emerald">₹</span>
                                  <input
                                    type="number"
                                    min="1000"
                                    value={surveyForm.offeredPricePerM3}
                                    onChange={(e) => handleRateChange(e.target.value)}
                                    className="tc-modal-input tc-currency-input text-emerald font-extrabold font-mono"
                                    placeholder="e.g. 140000"
                                    required
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">Unit rate for verified {vol} m³</span>
                              </div>

                              <div className="tc-modal-form-group mb-0">
                                <div className="flex items-center justify-between mb-1.5 gap-2">
                                  <label className="tc-modal-label text-amber-300 mb-0">
                                    Total Proposed Deal Value (₹) *
                                  </label>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                                    <ArrowLeftRight size={9} /> Auto-syncs
                                  </span>
                                </div>
                                <div className="tc-currency-input-wrap">
                                  <span className="tc-currency-prefix text-gold">₹</span>
                                  <input
                                    type="number"
                                    min="1000"
                                    value={surveyForm.offeredTotalPrice}
                                    onChange={(e) => handleTotalPriceChange(e.target.value)}
                                    className="tc-modal-input tc-currency-input text-gold font-extrabold font-mono"
                                    placeholder="e.g. 235000"
                                    required
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">Lump sum for entire verified lot</span>
                              </div>
                            </div>

                            {/* 1-Click Offer Adjustments */}
                            <div className="pt-2 border-t border-amber-500/20 space-y-2">
                              <div className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles size={11} className="text-amber-400" /> 1-Click Offer Adjustments:
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApplyPreset(0)}
                                  className="tc-preset-chip active-asking"
                                >
                                  <span className="font-bold text-xs">Match Asking</span>
                                  <span className="text-[10px] opacity-80 font-mono">₹{askingRate.toLocaleString('en-IN')}/m³</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplyPreset(5)}
                                  className="tc-preset-chip"
                                >
                                  <span className="font-bold text-xs">-5% Below</span>
                                  <span className="text-[10px] opacity-80 font-mono">₹{Math.round(askingRate * 0.95).toLocaleString('en-IN')}/m³</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplyPreset(8)}
                                  className="tc-preset-chip"
                                >
                                  <span className="font-bold text-xs">-8% Below</span>
                                  <span className="text-[10px] opacity-80 font-mono">₹{Math.round(askingRate * 0.92).toLocaleString('en-IN')}/m³</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplyPreset(10)}
                                  className="tc-preset-chip"
                                >
                                  <span className="font-bold text-xs">-10% Below</span>
                                  <span className="text-[10px] opacity-80 font-mono">₹{Math.round(askingRate * 0.90).toLocaleString('en-IN')}/m³</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Card 3: Buyer Enterprise Credentials & Logistics Terms */}
                      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/25 space-y-3.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Building2 size={13} /> 3. Buyer Enterprise & Logistics Details
                          </span>
                          <span className="text-[10px] text-emerald-300/80 font-mono font-medium">Verified Mill Identity</span>
                        </div>

                        {/* Registered Buyer Enterprise / Jurisdiction / Physical Address Strip */}
                        <div className="tc-buyer-enterprise-strip">
                          <div className="tc-buyer-ent-item">
                            <div className="tc-buyer-ent-icon">
                              <Building2 size={16} />
                            </div>
                            <div className="tc-buyer-ent-content">
                              <span className="tc-buyer-ent-label">BUYER ENTERPRISE / FIRM</span>
                              <span className="tc-buyer-ent-value">{buyerCompany || 'timberbuyers'}</span>
                            </div>
                          </div>

                          <div className="tc-buyer-ent-item">
                            <div className="tc-buyer-ent-icon">
                              <Landmark size={16} />
                            </div>
                            <div className="tc-buyer-ent-content">
                              <span className="tc-buyer-ent-label">LOCAL BODY / JURISDICTION</span>
                              <span className="tc-buyer-ent-value">{buyerLocalBody || 'Meenadom Panchayat'}</span>
                            </div>
                          </div>

                          <div className="tc-buyer-ent-item tc-buyer-ent-item-address">
                            <div className="tc-buyer-ent-icon">
                              <MapPin size={16} />
                            </div>
                            <div className="tc-buyer-ent-content">
                              <span className="tc-buyer-ent-label">REGISTERED PHYSICAL ADDRESS</span>
                              <span className="tc-buyer-ent-value">{buyerAddress || 'buyer_address'} — PIN {buyerPin || '686516'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Logistics Preference & Notes */}
                        <div className="tc-modal-form-group mb-0 pt-1">
                          <label className="tc-modal-label">
                            Haulage & Logistics Preference
                          </label>
                          <select
                            value={surveyForm.deliveryPreference}
                            onChange={(e) => setSurveyForm({ ...surveyForm, deliveryPreference: e.target.value })}
                            className="tc-modal-input"
                          >
                            <option value="Buyer Arranged Truck Pickup from Yard">Buyer Arranged Truck Pickup from Yard</option>
                            <option value="Seller Arranged Transport to Buyer Mill">Seller Arranged Transport to Buyer Mill</option>
                            <option value="Buyer Arranged Crane Hauler Pickup">Buyer Arranged Crane Hauler Pickup</option>
                          </select>
                        </div>

                        <div className="tc-modal-form-group mb-0">
                          <label className="tc-modal-label">
                            Survey Inspection Notes & Terms
                          </label>
                          <textarea
                            rows={2}
                            value={surveyForm.notes}
                            onChange={(e) => setSurveyForm({ ...surveyForm, notes: e.target.value })}
                            className="tc-modal-input text-xs"
                            placeholder="Add scaling details or special handling terms..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="tc-modal-actions">
                      <button
                        type="button"
                        onClick={() => setSurveyModalOpen(false)}
                        className="tc-buyer-pill-btn"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="tc-buyer-action-emerald-btn flex items-center gap-2 cursor-pointer shadow-lg"
                      >
                        <ClipboardCheck size={15} /> Submit Verified Survey & Price Offer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 2: COMPLETE TIMBER PURCHASE ESCROW PAYMENT */}
            {/* ========================================================= */}
            {paymentModalOpen && paymentTargetNeg && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] overflow-y-auto p-4 sm:p-6 flex justify-center items-center animate-fade-in">
                <div className="tc-counter-modal-card my-auto">
                  {/* Header */}
                  <div className="tc-counter-header">
                    <div className="tc-counter-title-group">
                      <div className="tc-counter-icon-wrap">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <h3 className="tc-counter-title flex items-center gap-2 flex-wrap">
                          <span>Complete Timber Purchase & Direct Payment</span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap shrink-0">
                            Owner Settlement
                          </span>
                        </h3>
                        <div className="tc-counter-lot-badge">
                          Lot: <span className="text-emerald-300 font-semibold">{paymentTargetNeg.timberTitle}</span> • Landowner: <strong className="text-white">{paymentTargetNeg.sellerName}</strong> ({paymentTargetNeg.sellerRole})
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentModalOpen(false)}
                      className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                      title="Close modal"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {paymentSuccess ? (
                    <div className="tc-counter-body !items-center !justify-center text-center py-10 space-y-5">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center shadow-xl">
                        <CheckCircle2 size={36} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-extrabold text-white">Payment Confirmed & Transferred to Owner!</h3>
                        <p className="text-xs text-slate-300 max-w-sm mx-auto">
                          Payment of <strong className="text-gold font-mono">₹ {paymentReceipt?.amount?.toLocaleString('en-IN')}</strong> has been transferred directly to <strong className="text-white">{paymentTargetNeg.sellerName}</strong> (Landowner).
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 w-full max-w-sm text-xs space-y-2.5 text-left font-mono shadow-inner">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Payment Ref:</span>
                          <span className="text-emerald-400 font-bold">{paymentReceipt?.payRef}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Paid To:</span>
                          <span className="text-white font-bold">{paymentTargetNeg.sellerName} (Landowner)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Payment Mode:</span>
                          <span className="text-white">{paymentReceipt?.method}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Purchase Status:</span>
                          <span className="text-emerald-400 font-bold">100% Paid in Full</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setPaymentModalOpen(false);
                            navigate('/buyer/orders');
                          }}
                          className="tc-buyer-action-emerald-btn flex items-center gap-2 cursor-pointer shadow-lg"
                        >
                          <ShoppingBag size={15} /> View Purchased Order & Payment Details →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                      <div className="tc-counter-body">
                        {/* 1. TIMBER PURCHASE PAYMENT SPECIFICATION CARD (Image 2 Engine Box Style) */}
                        <div className="tc-counter-target-engine-box">
                          <div className="tc-counter-target-header">
                            <span className="tc-counter-target-badge">
                              <ShieldCheck size={12} /> Direct Owner Payment Settlement
                            </span>
                            <span className="text-[11px] text-slate-300">
                              Total Payable to Owner: <strong className="text-emerald-300 font-mono text-xs">₹ {Number(paymentTargetNeg.totalOffered || ((Number(paymentTargetNeg.offeredPricePerM3) || 138833) * (Number(paymentTargetNeg.verifiedVolume) || 1.7))).toLocaleString('en-IN')}</strong>
                            </span>
                          </div>

                          <div className="tc-counter-target-factors-grid">
                            <div className="tc-counter-factor-pill">
                              <span className="tc-counter-factor-label">Verified Vol</span>
                              <span className="tc-counter-factor-val text-emerald-300 font-mono">
                                {paymentTargetNeg.verifiedVolume || paymentTargetNeg.requestedVolume || 1.7} m³
                              </span>
                            </div>
                            <div className="tc-counter-factor-pill">
                              <span className="tc-counter-factor-label">Timber Grade</span>
                              <span className="tc-counter-factor-val truncate">
                                {paymentTargetNeg.gradeQuality || 'Grade A Prime Export'}
                              </span>
                            </div>
                            <div className="tc-counter-factor-pill">
                              <span className="tc-counter-factor-label">Agreed Rate</span>
                              <span className="tc-counter-factor-val font-mono text-emerald-300">
                                ₹ {Number(paymentTargetNeg.offeredPricePerM3 || paymentTargetNeg.counterOffer?.pricePerM3 || 138833).toLocaleString('en-IN')}/m³
                              </span>
                            </div>
                            <div className="tc-counter-factor-pill">
                              <span className="tc-counter-factor-label">Recipient</span>
                              <span className="tc-counter-factor-val truncate text-white">
                                {paymentTargetNeg.sellerName}
                              </span>
                            </div>
                          </div>

                          <div className="tc-counter-settlement-notice">
                            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                            <span><strong>Direct Landowner Settlement:</strong> 100% of this payment will be transferred directly to landowner {paymentTargetNeg.sellerName} upon confirmation.</span>
                          </div>
                        </div>

                        {/* 2. 3-WAY PAYMENT CHANNEL COMPARISON CARDS (Exact Image 2 3-Card Style) */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                          {/* Card 1: UPI / QR */}
                          <div 
                            onClick={() => setPaymentMethod('upi')}
                            className={`tc-counter-compare-card cursor-pointer transition-all ${
                              paymentMethod === 'upi'
                                ? 'bg-emerald-950/40 border border-emerald-500/50 shadow-md ring-1 ring-emerald-500/40'
                                : 'asking hover:border-emerald-500/30'
                            }`}
                          >
                            <span className={`tc-counter-pill ${paymentMethod === 'upi' ? 'emerald' : 'amber'}`}>
                              Instant UPI
                            </span>
                            <div className={`tc-counter-compare-rate ${paymentMethod === 'upi' ? 'text-emerald-300' : 'text-slate-200'} flex items-center gap-1.5`}>
                              <QrCode size={18} className={paymentMethod === 'upi' ? 'text-emerald-400' : 'text-slate-400'} />
                              <span>UPI / QR</span>
                            </div>
                            <div className="tc-counter-compare-sub">
                              GPay, PhonePe, Paytm
                            </div>
                          </div>

                          {/* Card 2: NEFT / NetBanking */}
                          <div 
                            onClick={() => setPaymentMethod('netbanking')}
                            className={`tc-counter-compare-card cursor-pointer transition-all ${
                              paymentMethod === 'netbanking'
                                ? 'bg-emerald-950/40 border border-emerald-500/50 shadow-md ring-1 ring-emerald-500/40'
                                : 'asking hover:border-emerald-500/30'
                            }`}
                          >
                            <span className={`tc-counter-pill ${paymentMethod === 'netbanking' ? 'emerald' : 'amber'}`}>
                              Bank Transfer
                            </span>
                            <div className={`tc-counter-compare-rate ${paymentMethod === 'netbanking' ? 'text-emerald-300' : 'text-slate-200'} flex items-center gap-1.5`}>
                              <Building size={18} className={paymentMethod === 'netbanking' ? 'text-emerald-400' : 'text-slate-400'} />
                              <span>NEFT / RTGS</span>
                            </div>
                            <div className="tc-counter-compare-sub">
                              Escrow Virtual A/C
                            </div>
                          </div>

                          {/* Card 3: Corporate Card */}
                          <div 
                            onClick={() => setPaymentMethod('card')}
                            className={`tc-counter-compare-card cursor-pointer transition-all ${
                              paymentMethod === 'card'
                                ? 'bg-emerald-950/40 border border-emerald-500/50 shadow-md ring-1 ring-emerald-500/40'
                                : 'asking hover:border-emerald-500/30'
                            }`}
                          >
                            <span className={`tc-counter-pill ${paymentMethod === 'card' ? 'emerald' : 'amber'}`}>
                              Procurement
                            </span>
                            <div className={`tc-counter-compare-rate ${paymentMethod === 'card' ? 'text-emerald-300' : 'text-slate-200'} flex items-center gap-1.5`}>
                              <CreditCard size={18} className={paymentMethod === 'card' ? 'text-emerald-400' : 'text-slate-400'} />
                              <span>Corporate</span>
                            </div>
                            <div className="tc-counter-compare-sub">
                              Direct Card Escrow
                            </div>
                          </div>
                        </div>

                        {/* 3. CHANNEL SPECIFIC INPUT (Matching Image 2 single bar input style) */}
                        <div className="tc-counter-section-card">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white uppercase tracking-wider">
                              {paymentMethod === 'upi' ? 'Virtual Payment Address (VPA / UPI ID):' : paymentMethod === 'netbanking' ? 'Escrow Virtual Beneficiary Account:' : 'Corporate Procurement Card:'}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              Protected: <strong className="text-emerald-400">100% RBI Escrow</strong>
                            </span>
                          </div>

                          {paymentMethod === 'upi' && (
                            <div>
                              <div className="tc-counter-input-box">
                                <span className="tc-counter-input-prefix">
                                  <QrCode size={18} />
                                </span>
                                <input
                                  type="text"
                                  defaultValue="arunbuyer@okhdfcbank"
                                  className="tc-counter-input-field font-mono"
                                  placeholder="buyer@upi"
                                />
                                <span className="tc-counter-input-suffix text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 size={13} /> Verified VPA
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1.5">
                                <Sparkles size={11} className="text-emerald-400" /> Instant authorization via Google Pay, PhonePe, Paytm, or BHIM.
                              </span>
                            </div>
                          )}

                          {paymentMethod === 'netbanking' && (
                            <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/25 space-y-1.5 font-mono text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Beneficiary Name:</span>
                                <span className="text-white font-bold">TreeConnect Escrow Trustee</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Virtual A/C No:</span>
                                <span className="text-emerald-400 font-bold">TCESCROW98472910</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">IFSC Code:</span>
                                <span className="text-white">HDFC0000240</span>
                              </div>
                            </div>
                          )}

                          {paymentMethod === 'card' && (
                            <div className="space-y-2.5">
                              <div className="tc-counter-input-box">
                                <span className="tc-counter-input-prefix">
                                  <CreditCard size={18} />
                                </span>
                                <input
                                  type="text"
                                  defaultValue="4111 •••• •••• 8821"
                                  className="tc-counter-input-field font-mono"
                                />
                                <span className="tc-counter-input-suffix text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/20">
                                  VISA BIZ
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2.5">
                                <input type="text" defaultValue="09/28" className="tc-counter-input-field font-mono text-center !p-2.5 !text-sm" placeholder="MM/YY" />
                                <input type="password" defaultValue="•••" className="tc-counter-input-field font-mono text-center !p-2.5 !text-sm" placeholder="CVV" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Modal Actions Footer (Image 2 Footer Style) */}
                      <div className="tc-counter-footer">
                        <div className="text-xs text-slate-300">
                          Total Payment to Landowner:{' '}
                          <strong className="text-emerald-400 font-mono font-bold text-sm">
                            ₹ {Number(paymentTargetNeg.totalOffered || ((Number(paymentTargetNeg.offeredPricePerM3) || 138833) * (Number(paymentTargetNeg.verifiedVolume) || 1.7))).toLocaleString('en-IN')}
                          </strong>{' '}
                          <span className="text-slate-400 font-mono">({paymentTargetNeg.verifiedVolume || paymentTargetNeg.requestedVolume || 1.7} m³)</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPaymentModalOpen(false)}
                            disabled={paymentProcessing}
                            className="tc-counter-btn-cancel"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleExecutePayment}
                            disabled={paymentProcessing}
                            className="tc-counter-btn-submit"
                          >
                            {paymentProcessing ? (
                              <>
                                <Clock size={16} className="animate-spin text-black" /> Processing Payment Transfer...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={16} /> Confirm & Pay Owner (₹ {Number(paymentTargetNeg.totalOffered || ((Number(paymentTargetNeg.offeredPricePerM3) || 138833) * (Number(paymentTargetNeg.verifiedVolume) || 1.7))).toLocaleString('en-IN')})
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default NegotiationsPage;
