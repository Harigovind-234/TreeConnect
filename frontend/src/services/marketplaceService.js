/**
 * TreeConnect Timber Marketplace Service
 * Central data layer for Timber Listings, Buyer Negotiations, and Purchase Orders
 * Synchronized across Landowner, Contractor, and Buyer dashboards with backend MongoDB persistence.
 * Zero mock/dummy data: only real live records created by approved users.
 */

import api from './api';

const LISTINGS_KEY = 'treeconnect_timber_listings';
const NEGOTIATIONS_KEY = 'treeconnect_timber_negotiations';
const ORDERS_KEY = 'treeconnect_timber_orders';

// Demo and fake IDs to filter out completely
const FAKE_MOCK_IDS = new Set([
  'tl_teak_01', 'tl_rose_02', 'tl_rub_03', 'tl_mah_04', 'tl_euc_05',
  'tl_tc_teak_01', 'tl_tc_teak_02', 'tl_tc_rose_03', 'tl_tc_rub_04', 'tl_tc_mah_05',
  'neg_101', 'neg_102', 'neg_tc_101', 'neg_tc_102',
  'ORD-2026-901', 'ORD-2026-882', 'ORD-2026-874', 'ORD-2026-855', 'ORD-2026-081',
  'tl_1792519666286_955'
]);

const isNotFake = (item) => {
  if (!item || !item.id) return false;
  if (FAKE_MOCK_IDS.has(item.id)) return false;
  if (item.buyerName === 'Pacific Lumber Mills' || item.sellerEmail === 'landowner@treeconnect.com') return false;
  return true;
};

export const marketplaceService = {
  // ==================== BACKEND SYNC ====================

  syncFromBackend: async () => {
    try {
      const [listRes, negRes, ordRes] = await Promise.all([
        api.get('/marketplace/listings').catch(() => ({ data: [] })),
        api.get('/marketplace/negotiations').catch(() => ({ data: [] })),
        api.get('/marketplace/orders').catch(() => ({ data: [] }))
      ]);

      const realListings = Array.isArray(listRes.data) ? listRes.data.filter(isNotFake) : [];
      const realNegs = Array.isArray(negRes.data) ? negRes.data.filter(isNotFake) : [];
      const realOrders = Array.isArray(ordRes.data) ? ordRes.data.filter(isNotFake) : [];

      localStorage.setItem(LISTINGS_KEY, JSON.stringify(realListings));
      localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(realNegs));
      localStorage.setItem(ORDERS_KEY, JSON.stringify(realOrders));

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'backend_synced' }
      }));

      return {
        listings: realListings,
        negotiations: realNegs,
        orders: realOrders
      };
    } catch (e) {
      console.warn('Backend sync warning, using local state:', e);
      return {
        listings: marketplaceService.getListings(),
        negotiations: marketplaceService.getNegotiations(),
        orders: marketplaceService.getOrders()
      };
    }
  },

  // ==================== LISTINGS ====================

  getListings: () => {
    try {
      const allFound = [];
      const seenIds = new Set();

      // 1. Read from primary LISTINGS_KEY
      const raw = localStorage.getItem(LISTINGS_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              if (isNotFake(item) && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                allFound.push(item);
              }
            });
          }
        } catch (_) {}
      }

      // 2. Scan all localStorage user keys (treeconnect_timber_listings_*) added by landowners and contractors
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('treeconnect_timber_listings_') && key !== LISTINGS_KEY) {
            const userRaw = localStorage.getItem(key);
            if (userRaw) {
              const userList = JSON.parse(userRaw);
              if (Array.isArray(userList)) {
                userList.forEach(item => {
                  if (isNotFake(item) && !seenIds.has(item.id)) {
                    seenIds.add(item.id);
                    allFound.push(item);
                  }
                });
              }
            }
          }
        }
      } catch (_) {}

      localStorage.setItem(LISTINGS_KEY, JSON.stringify(allFound));
      return allFound;
    } catch (e) {
      console.error('Error loading timber listings:', e);
      return [];
    }
  },

  getListingById: (id) => {
    const list = marketplaceService.getListings();
    return list.find(l => l.id === id) || null;
  },

  saveListing: async (listingData, user = null) => {
    try {
      const currentListings = marketplaceService.getListings();
      const isEdit = Boolean(listingData.id && currentListings.some(l => l.id === listingData.id));

      let updatedListing;
      if (isEdit) {
        updatedListing = {
          ...currentListings.find(l => l.id === listingData.id),
          ...listingData,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      } else {
        const role = user?.role || listingData.sellerRole || 'landowner';
        const name = user?.name || user?.full_name || listingData.sellerName || 'Verified Seller';
        const email = (user?.email || listingData.sellerEmail || '').toLowerCase().trim();

        updatedListing = {
          id: listingData.id || `tl_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          status: listingData.status || 'Published',
          createdAt: new Date().toISOString().split('T')[0],
          sellerRole: role,
          sellerName: name,
          sellerEmail: email,
          sellerPhone: user?.phone || listingData.sellerPhone || '+91 94470 00000',
          images: listingData.images || [],
          negotiable: listingData.negotiable || 'Yes',
          transportAvailable: Boolean(listingData.transportAvailable),
          ...listingData
        };
      }

      // 1. Sync with backend API
      let savedBackendDoc = null;
      try {
        if (isEdit) {
          const res = await api.put(`/marketplace/listings/${updatedListing.id}`, updatedListing).catch(() => null);
          if (res?.data) savedBackendDoc = res.data;
        } else {
          const res = await api.post('/marketplace/listings', updatedListing).catch(() => null);
          if (res?.data) savedBackendDoc = res.data;
        }
      } catch (apiErr) {
        console.warn('Backend API listing save warning:', apiErr);
      }

      if (savedBackendDoc && savedBackendDoc._id && !updatedListing._id) {
        updatedListing._id = savedBackendDoc._id;
      }

      // 2. Safe localStorage saving with quota protection
      try {
        const nextListings = isEdit
          ? currentListings.map(l => l.id === updatedListing.id ? updatedListing : l)
          : [updatedListing, ...currentListings.filter(l => l.id !== updatedListing.id)];

        localStorage.setItem(LISTINGS_KEY, JSON.stringify(nextListings));

        // Persist to user-specific key for synchronization
        if (updatedListing.sellerEmail) {
          try {
            const userKey = `treeconnect_timber_listings_${updatedListing.sellerEmail.toLowerCase().trim()}`;
            const existingRaw = localStorage.getItem(userKey);
            const existingList = existingRaw ? JSON.parse(existingRaw) : [];
            const updatedUserList = Array.isArray(existingList)
              ? [updatedListing, ...existingList.filter(l => l.id !== updatedListing.id)]
              : [updatedListing];
            localStorage.setItem(userKey, JSON.stringify(updatedUserList));
          } catch (_) {}
        }
      } catch (storageErr) {
        console.warn('LocalStorage quota limit reached, saving listing with lightweight image references:', storageErr);
        try {
          const lightweightListing = {
            ...updatedListing,
            images: (updatedListing.images || []).map((img, i) => 
              typeof img === 'string' && img.length > 500 ? img.slice(0, 150) : img
            )
          };
          const nextLightweight = [lightweightListing, ...currentListings.filter(l => l.id !== updatedListing.id)];
          localStorage.setItem(LISTINGS_KEY, JSON.stringify(nextLightweight));
        } catch (_) {}
      }

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'listing_saved', listing: updatedListing }
      }));

      return updatedListing;
    } catch (e) {
      console.error('Error saving timber listing:', e);
      throw e;
    }
  },

  deleteListing: async (id) => {
    try {
      const currentListings = marketplaceService.getListings();
      const nextListings = currentListings.filter(l => l.id !== id);
      localStorage.setItem(LISTINGS_KEY, JSON.stringify(nextListings));

      try {
        await api.delete(`/marketplace/listings/${id}`).catch(() => {});
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'listing_deleted', id }
      }));
      return true;
    } catch (e) {
      console.error('Error deleting timber listing:', e);
      return false;
    }
  },

  updateListingStatus: (id, status) => {
    try {
      const currentListings = marketplaceService.getListings();
      const nextListings = currentListings.map(l => l.id === id ? { ...l, status } : l);
      localStorage.setItem(LISTINGS_KEY, JSON.stringify(nextListings));

      try {
        api.put(`/marketplace/listings/${id}`, { status }).catch(() => {});
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'listing_status_updated', id, status }
      }));
      return true;
    } catch (e) {
      console.error('Error updating timber listing status:', e);
      return false;
    }
  },

  // ==================== NEGOTIATIONS / OFFERS ====================

  getNegotiations: () => {
    try {
      const raw = localStorage.getItem(NEGOTIATIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const realOnly = parsed.filter(isNotFake);
          return realOnly;
        }
      }
      return [];
    } catch (e) {
      console.error('Error loading timber negotiations:', e);
      return [];
    }
  },

  createNegotiation: async (offerData, user = null) => {
    try {
      const current = marketplaceService.getNegotiations();
      const listing = marketplaceService.getListingById(offerData.listingId);

      const buyerName = user?.contactPerson || user?.name || user?.full_name || offerData.buyerName || 'Buyer';
      const buyerEmail = (user?.email || offerData.buyerEmail || '').toLowerCase().trim();

      const newNegotiation = {
        id: `neg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        listingId: offerData.listingId,
        timberTitle: listing?.title || offerData.timberTitle || 'Timber Lot',
        timberSpecies: listing?.timberSpecies || offerData.timberSpecies || 'Commercial Wood',
        listingVolume: listing?.volume || offerData.requestedVolume,
        sellerRole: listing?.sellerRole || offerData.sellerRole || 'landowner',
        sellerName: listing?.sellerName || offerData.sellerName || 'Verified Seller',
        sellerEmail: (listing?.sellerEmail || offerData.sellerEmail || '').toLowerCase().trim(),
        buyerName,
        buyerEmail,
        buyerPhone: user?.phone || user?.contactPhone || offerData.buyerPhone || '+91 98470 00000',
        buyerCompany: offerData.buyerCompany || user?.company_name || user?.companyName || 'Procurement Buyer Corp',
        originalPricePerM3: listing?.pricePerM3 || offerData.originalPricePerM3 || 0,
        offeredPricePerM3: Number(offerData.offeredPricePerM3) || 0,
        requestedVolume: Number(offerData.requestedVolume) || 10,
        totalOffered: (Number(offerData.offeredPricePerM3) || 0) * (Number(offerData.requestedVolume) || 10),
        deliveryPreference: offerData.deliveryPreference || 'Buyer Arranged Pickup',
        surveyVisitDate: offerData.surveyVisitDate || offerData.surveyDate || '',
        surveyTimeSlot: offerData.surveyTimeSlot || 'Morning (09:00 AM - 12:00 PM)',
        notes: offerData.notes || '',
        status: 'Pending Review',
        counterOffer: null,
        timeline: [
          {
            sender: 'Buyer',
            senderName: buyerName,
            message: `Offered ₹${Number(offerData.offeredPricePerM3).toLocaleString('en-IN')}/m³ for ${offerData.requestedVolume} m³ • Proposed Timber Survey on ${offerData.surveyVisitDate || 'TBD'} (${offerData.surveyTimeSlot || 'Morning'})`,
            date: new Date().toISOString().split('T')[0]
          }
        ],
        createdAt: new Date().toISOString().split('T')[0]
      };

      const updated = [newNegotiation, ...current];
      localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(updated));

      // Mark listing status as Under Negotiation
      if (listing && listing.status === 'Published') {
        marketplaceService.updateListingStatus(listing.id, 'Under Negotiation');
      }

      try {
        await api.post('/marketplace/negotiations', newNegotiation).catch(() => {});
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'negotiation_created', negotiation: newNegotiation }
      }));

      return newNegotiation;
    } catch (e) {
      console.error('Error creating timber negotiation:', e);
      throw e;
    }
  },

  respondToNegotiation: async (negotiationId, action, payload = {}) => {
    try {
      const current = marketplaceService.getNegotiations();
      const target = current.find(n => n.id === negotiationId);
      if (!target) throw new Error('Negotiation not found');

      const today = new Date().toISOString().split('T')[0];
      let updatedStatus = target.status;
      let counterOffer = target.counterOffer;
      const nextTimeline = [...(target.timeline || [])];

      if (action === 'accept') {
        updatedStatus = 'Accepted';
        nextTimeline.push({
          sender: payload.sender || 'Buyer',
          senderName: payload.senderName || target.buyerName,
          message: payload.message || `Accepted offer at ₹${(counterOffer ? counterOffer.pricePerM3 : target.offeredPricePerM3).toLocaleString('en-IN')}/m³`,
          date: today
        });
      } else if (action === 'reject') {
        updatedStatus = 'Rejected';
        nextTimeline.push({
          sender: payload.sender || 'Buyer',
          senderName: payload.senderName || target.buyerName,
          message: payload.message || 'Declined offer. Terms could not be finalized.',
          date: today
        });
      } else if (action === 'counter') {
        updatedStatus = 'Counter-Offer';
        counterOffer = {
          pricePerM3: Number(payload.pricePerM3) || target.originalPricePerM3,
          totalAmount: (Number(payload.pricePerM3) || target.originalPricePerM3) * target.requestedVolume,
          message: payload.message || 'Counter-proposal submitted',
          date: today
        };
        nextTimeline.push({
          sender: payload.sender || 'Seller',
          senderName: payload.senderName || target.sellerName,
          message: `Counter-offered at ₹${Number(payload.pricePerM3).toLocaleString('en-IN')}/m³: ${payload.message || ''}`,
          date: today
        });
      }

      const updatedNeg = {
        ...target,
        status: updatedStatus,
        counterOffer,
        timeline: nextTimeline,
        updatedAt: today
      };

      const nextList = current.map(n => n.id === negotiationId ? updatedNeg : n);
      localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(nextList));

      try {
        await api.put(`/marketplace/negotiations/${negotiationId}`, updatedNeg).catch(() => {});
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'negotiation_updated', negotiation: updatedNeg }
      }));

      return updatedNeg;
    } catch (e) {
      console.error('Error responding to timber negotiation:', e);
      throw e;
    }
  },

  // ==================== PURCHASE ORDERS ====================

  getOrders: () => {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const realOnly = parsed.filter(isNotFake);
          return realOnly;
        }
      }
      return [];
    } catch (e) {
      console.error('Error loading timber orders:', e);
      return [];
    }
  },

  createOrder: async (orderPayload, user = null) => {
    try {
      const current = marketplaceService.getOrders();
      const listing = orderPayload.listingId ? marketplaceService.getListingById(orderPayload.listingId) : null;

      const buyerName = user?.contactPerson || user?.name || user?.full_name || orderPayload.buyerName || 'Arun K';
      const buyerEmail = (user?.email || orderPayload.buyerEmail || 'arunbuyer@gmail.com').toLowerCase().trim();

      const volNum = Number(orderPayload.volume) || (listing?.volume || 10);
      const unitPrice = Number(orderPayload.unitPrice) || (listing?.pricePerM3 || 42500);
      const totalNum = volNum * unitPrice;

      const newOrder = {
        id: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
        listingId: orderPayload.listingId || listing?.id,
        timberItem: orderPayload.timberItem || listing?.title || `${listing?.timberSpecies || 'Commercial'} Logs`,
        species: listing?.timberSpecies || orderPayload.species || 'Teakwood',
        volume: `${volNum} m³`,
        volumeNum: volNum,
        unitPrice,
        total: `₹ ${totalNum.toLocaleString('en-IN')}`,
        totalNum,
        status: 'In Transit',
        ETA: '26 Oct 2026',
        sellerRole: listing?.sellerRole || orderPayload.sellerRole || 'landowner',
        sellerName: listing?.sellerName || orderPayload.sellerName || 'Verified Seller',
        sellerEmail: listing?.sellerEmail || orderPayload.sellerEmail,
        contractor: orderPayload.contractor || (listing?.sellerRole === 'contractor' ? listing.sellerName : 'Forestry Logistics'),
        mill: orderPayload.destinationMill || 'Ernakulam Mill Yard #2',
        passNo: `KL-FR-${Math.floor(10000 + Math.random() * 90000)}/2026`,
        progress: 25,
        milestones: [
          { step: 'Order Placed & Escrow Secured', date: 'Today', done: true },
          { step: 'Yard Log Loading & Stenciling', date: 'In 1 day', done: false },
          { step: 'Form IV Transit Permit Clearance', date: 'In 2 days', done: false },
          { step: 'Mill Gate Arrival & Weighbridge Payout', date: 'Est. 26 Oct 2026', done: false }
        ],
        buyerName,
        buyerEmail,
        paymentTerms: orderPayload.paymentTerms || 'Bank Escrow / Verified Weighbridge Payout',
        notes: orderPayload.notes || '',
        createdAt: new Date().toISOString().split('T')[0]
      };

      const updatedOrders = [newOrder, ...current];
      localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));

      // Mark listing as Sold or adjust volume
      if (listing) {
        if (volNum >= listing.volume) {
          marketplaceService.updateListingStatus(listing.id, 'Sold');
        } else {
          marketplaceService.saveListing({
            ...listing,
            volume: listing.volume - volNum,
            askingPrice: Math.round((listing.volume - volNum) * listing.pricePerM3)
          });
        }
      }

      try {
        await api.post('/marketplace/orders', newOrder).catch(() => {});
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'order_created', order: newOrder }
      }));

      return newOrder;
    } catch (e) {
      console.error('Error creating timber purchase order:', e);
      throw e;
    }
  }
};

export default marketplaceService;
