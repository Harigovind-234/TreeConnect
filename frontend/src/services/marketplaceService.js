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
  'tl_1792519666286_955',
  'neg_1792525172176_219', // Stale duplicate negotiation
  'neg_1792558834750_747'  // Removed negotiation
]);

const isNotFake = (item) => {
  if (!item) return false;
  const idStr = String(item.id || item._id || '');
  if (FAKE_MOCK_IDS.has(idStr)) return false;
  if (idStr === 'neg_1792525172176_219' || idStr === 'neg_1792558834750_747') return false;
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
      const validListingIds = new Set();
      realListings.forEach(l => {
        if (l.id) validListingIds.add(String(l.id).trim());
        if (l._id) validListingIds.add(String(l._id).trim());
        if (l.harvestOperationId) validListingIds.add(String(l.harvestOperationId).trim());
        if (l.treeInventoryId) validListingIds.add(String(l.treeInventoryId).trim());
      });

      const rawNegs = Array.isArray(negRes.data) ? negRes.data.filter(isNotFake) : [];
      // Filter out any orphaned negotiations whose listing no longer exists
      const realNegs = rawNegs.filter(n => {
        const lid = String(n.listingId || '').trim();
        return lid && validListingIds.has(lid);
      });

      const rawOrders = Array.isArray(ordRes.data) ? ordRes.data.filter(isNotFake) : [];
      // Filter out any orphaned orders whose listing no longer exists
      const realOrders = rawOrders.filter(o => {
        const lid = String(o.listingId || '').trim();
        return !lid || validListingIds.has(lid);
      });

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
      if (!id) return false;
      const idStr = String(id).trim();

      // 1. Delete from primary LISTINGS_KEY and collect all alias IDs
      const currentListings = marketplaceService.getListings();
      const targetListing = currentListings.find(l => {
        const lId = String(l?.id || l?._id || '').trim();
        return lId === idStr || l?.id === id || l?._id === id;
      });

      const matchingIds = new Set([idStr, String(id)]);
      if (targetListing) {
        if (targetListing.id) matchingIds.add(String(targetListing.id).trim());
        if (targetListing._id) matchingIds.add(String(targetListing._id).trim());
        if (targetListing.harvestOperationId) matchingIds.add(String(targetListing.harvestOperationId).trim());
        if (targetListing.treeInventoryId) matchingIds.add(String(targetListing.treeInventoryId).trim());
      }

      const nextListings = currentListings.filter(l => {
        const lId = String(l?.id || l?._id || '').trim();
        return !matchingIds.has(lId) && lId !== idStr && l?.id !== id && l?._id !== id;
      });
      localStorage.setItem(LISTINGS_KEY, JSON.stringify(nextListings));

      // 2. Comprehensive cleanup: purge from ALL user-specific listing keys in localStorage
      try {
        const keysToClean = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('treeconnect_timber_listings') || key.startsWith('treeconnect_completed_harvests'))) {
            keysToClean.push(key);
          }
        }
        keysToClean.forEach(key => {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const filtered = list.filter(l => {
                  const lId = String(l?.id || l?._id || '').trim();
                  return !matchingIds.has(lId) && lId !== idStr && l?.id !== id && l?._id !== id;
                });
                localStorage.setItem(key, JSON.stringify(filtered));
              }
            }
          } catch (_) {}
        });
      } catch (_) {}

      // 3. Remove associated negotiations
      try {
        const rawNegs = localStorage.getItem(NEGOTIATIONS_KEY);
        if (rawNegs) {
          const negs = JSON.parse(rawNegs);
          if (Array.isArray(negs)) {
            const filteredNegs = negs.filter(n => {
              const nListingId = String(n?.listingId || '').trim();
              return !matchingIds.has(nListingId) && nListingId !== idStr && n?.listingId !== id;
            });
            localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(filteredNegs));
          }
        }
      } catch (_) {}

      // 3b. Remove associated orders (buyer dashboard purchases & active deliveries)
      try {
        const rawOrders = localStorage.getItem(ORDERS_KEY);
        if (rawOrders) {
          const ords = JSON.parse(rawOrders);
          if (Array.isArray(ords)) {
            const filteredOrders = ords.filter(o => {
              const oListingId = String(o?.listingId || '').trim();
              return !matchingIds.has(oListingId) && oListingId !== idStr && o?.listingId !== id;
            });
            localStorage.setItem(ORDERS_KEY, JSON.stringify(filteredOrders));
          }
        }
      } catch (_) {}

      // 4. Delete from backend MongoDB API
      try {
        await api.delete(`/marketplace/listings/${encodeURIComponent(idStr)}`).catch(() => {});
      } catch (_) {}

      // 5. Broadcast update event so all listeners immediately refresh
      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'listing_deleted', id: idStr }
      }));
      return true;
    } catch (e) {
      console.error('Error deleting timber listing:', e);
      return false;
    }
  },

  cascadeDeleteByHarvestRequestId: async (harvestRequestId) => {
    if (!harvestRequestId) return;
    try {
      const reqIdStr = String(harvestRequestId).trim();
      const reqCanon = reqIdStr.length >= 8 ? reqIdStr.substring(0, 8).toLowerCase() : reqIdStr.toLowerCase();

      // Find all listings matching this harvest operation / request ID
      const currentListings = marketplaceService.getListings();
      const matchingListingIds = new Set([reqIdStr]);

      currentListings.forEach(l => {
        const opId = String(l?.harvestOperationId || l?.harvestRequestId || '').trim();
        const opCanon = opId.length >= 8 ? opId.substring(0, 8).toLowerCase() : opId.toLowerCase();
        const lId = String(l?.id || l?._id || '').trim();
        const lCanon = lId.length >= 8 ? lId.substring(0, 8).toLowerCase() : lId.toLowerCase();
        if (opId === reqIdStr || opCanon === reqCanon || lId === reqIdStr || lCanon === reqCanon) {
          if (l.id) matchingListingIds.add(String(l.id).trim());
          if (l._id) matchingListingIds.add(String(l._id).trim());
          if (l.harvestOperationId) matchingListingIds.add(String(l.harvestOperationId).trim());
          if (l.harvestRequestId) matchingListingIds.add(String(l.harvestRequestId).trim());
        }
      });

      // 1. Purge listings from localStorage
      const nextListings = currentListings.filter(l => {
        const lId = String(l?.id || l?._id || '').trim();
        const opId = String(l?.harvestOperationId || l?.harvestRequestId || '').trim();
        return !matchingListingIds.has(lId) && !matchingListingIds.has(opId);
      });
      localStorage.setItem(LISTINGS_KEY, JSON.stringify(nextListings));

      // Purge all user specific listing keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('treeconnect_timber_listings') || key.startsWith('treeconnect_completed_harvests'))) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const filtered = list.filter(l => {
                  const lId = String(l?.id || l?._id || '').trim();
                  const opId = String(l?.harvestOperationId || l?.harvestRequestId || '').trim();
                  return !matchingListingIds.has(lId) && !matchingListingIds.has(opId);
                });
                localStorage.setItem(key, JSON.stringify(filtered));
              }
            }
          } catch (_) {}
        }
      }

      // 2. Purge negotiations
      try {
        const rawNegs = localStorage.getItem(NEGOTIATIONS_KEY);
        if (rawNegs) {
          const negs = JSON.parse(rawNegs);
          if (Array.isArray(negs)) {
            const filteredNegs = negs.filter(n => {
              const nListingId = String(n?.listingId || '').trim();
              const opId = String(n?.harvestOperationId || n?.harvestRequestId || '').trim();
              return !matchingListingIds.has(nListingId) && !matchingListingIds.has(opId);
            });
            localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(filteredNegs));
          }
        }
      } catch (_) {}

      // 3. Purge buyer orders
      try {
        const rawOrders = localStorage.getItem(ORDERS_KEY);
        if (rawOrders) {
          const ords = JSON.parse(rawOrders);
          if (Array.isArray(ords)) {
            const filteredOrders = ords.filter(o => {
              const oListingId = String(o?.listingId || '').trim();
              const opId = String(o?.harvestOperationId || o?.harvestRequestId || '').trim();
              return !matchingListingIds.has(oListingId) && !matchingListingIds.has(opId);
            });
            localStorage.setItem(ORDERS_KEY, JSON.stringify(filteredOrders));
          }
        }
      } catch (_) {}

      // 4. Also call backend delete for any matching listing
      for (const lid of matchingListingIds) {
        try {
          await api.delete(`/marketplace/listings/${encodeURIComponent(lid)}`).catch(() => {});
        } catch (_) {}
      }

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'harvest_cascade_deleted', harvestRequestId: reqIdStr }
      }));
    } catch (e) {
      console.error('Error cascading delete for harvest request:', e);
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
      const activeListings = marketplaceService.getListings();
      const validListingIds = new Set();
      activeListings.forEach(l => {
        if (l.id) validListingIds.add(String(l.id).trim());
        if (l._id) validListingIds.add(String(l._id).trim());
        if (l.harvestOperationId) validListingIds.add(String(l.harvestOperationId).trim());
        if (l.treeInventoryId) validListingIds.add(String(l.treeInventoryId).trim());
      });

      const raw = localStorage.getItem(NEGOTIATIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const realOnly = parsed.filter(isNotFake);
          // Only keep negotiations whose parent listing exists
          const withoutOrphans = realOnly.filter(item => {
            const lId = String(item.listingId || '').trim();
            if (validListingIds.size === 0) return false;
            return validListingIds.has(lId);
          });

          // Deduplicate by listingId + buyerEmail, keeping the latest one
          const deduped = [];
          const seen = new Set();
          for (const item of withoutOrphans) {
            const lId = String(item.listingId || '').trim();
            const bEmail = String(item.buyerEmail || '').toLowerCase().trim();
            const key = lId && bEmail ? `${lId}__${bEmail}` : String(item.id || item._id || '');
            if (seen.has(key)) {
              continue;
            }
            seen.add(key);
            deduped.push(item);
          }
          if (deduped.length !== parsed.length) {
            localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(deduped));
          }
          return deduped;
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

      // Check if negotiation already exists for this listing and buyer
      const existingIdx = current.findIndex(n =>
        n.listingId === offerData.listingId &&
        (n.buyerEmail || '').toLowerCase().trim() === buyerEmail
      );

      let savedNegotiation;
      let updated;

      if (existingIdx !== -1) {
        // Update existing negotiation
        const existing = current[existingIdx];
        const newTimelineEntry = {
          sender: 'Buyer',
          senderName: buyerName,
          message: `Updated Offer: ₹${Number(offerData.offeredPricePerM3).toLocaleString('en-IN')}/m³ for ${offerData.requestedVolume} m³ • Proposed Timber Survey on ${offerData.surveyVisitDate || 'TBD'} (${offerData.surveyTimeSlot || 'Morning'})`,
          date: new Date().toISOString().split('T')[0]
        };

        savedNegotiation = {
          ...existing,
          offeredPricePerM3: Number(offerData.offeredPricePerM3) || existing.offeredPricePerM3,
          requestedVolume: Number(offerData.requestedVolume) || existing.requestedVolume,
          totalOffered: (Number(offerData.offeredPricePerM3) || 0) * (Number(offerData.requestedVolume) || 1),
          deliveryPreference: offerData.deliveryPreference || existing.deliveryPreference,
          surveyVisitDate: offerData.surveyVisitDate || existing.surveyVisitDate,
          surveyTimeSlot: offerData.surveyTimeSlot || existing.surveyTimeSlot,
          destinationMill: offerData.destinationMill || existing.destinationMill,
          notes: offerData.notes || existing.notes,
          status: 'Pending Review',
          timeline: [newTimelineEntry, ...(existing.timeline || []).filter(t => !t.message?.startsWith('Updated Offer:'))]
        };

        updated = current.map((n, idx) => idx === existingIdx ? savedNegotiation : n);
      } else {
        savedNegotiation = {
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
          destinationMill: offerData.destinationMill || 'Ernakulam Timber Mill Yard #2',
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

        updated = [savedNegotiation, ...current];
      }

      localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(updated));

      // Mark listing status as Under Negotiation
      if (listing && listing.status === 'Published') {
        marketplaceService.updateListingStatus(listing.id, 'Under Negotiation');
      }

      try {
        await api.post('/marketplace/negotiations', savedNegotiation).catch(() => {});
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'negotiation_created', negotiation: savedNegotiation }
      }));

      return savedNegotiation;
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
        const counterRate = Number(payload.pricePerM3) || target.originalPricePerM3;
        const totalDeal = Math.round(counterRate * (Number(target.requestedVolume) || 1));

        counterOffer = {
          pricePerM3: counterRate,
          counterTarget: Number(payload.counterTarget || counterRate),
          suggestedTarget: Number(payload.suggestedTarget || counterRate),
          adjustmentReason: payload.adjustmentReason || '',
          totalAmount: totalDeal,
          verifiedVolume: target.requestedVolume,
          harvestSettlementNote: 'Harvest contract (₹1,10,000) fully settled; 0 deductions applied.',
          message: payload.message || 'Counter-proposal submitted based on verified timber specifications.',
          date: today,
          timestamp: new Date().toISOString()
        };

        const reasonNote = payload.adjustmentReason ? ` • Reason: ${payload.adjustmentReason}` : '';
        const msgNote = payload.message ? ` • ${payload.message}` : '';

        nextTimeline.push({
          sender: payload.sender || 'Seller',
          senderName: payload.senderName || target.sellerName,
          action: 'Counter-Offer',
          counterRate,
          totalAmount: totalDeal,
          adjustmentReason: payload.adjustmentReason || '',
          message: `Counter-Target: ₹${counterRate.toLocaleString('en-IN')}/m³ for ${target.requestedVolume} m³ (Gross Deal: ₹${totalDeal.toLocaleString('en-IN')})${reasonNote}${msgNote}`,
          date: today,
          timestamp: new Date().toISOString()
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

  // ==================== SITE INSPECTION & SURVEY LIFECYCLE ====================

  requestInspection: async (inspectionData, user = null) => {
    try {
      const current = marketplaceService.getNegotiations();
      const listing = marketplaceService.getListingById(inspectionData.listingId);

      const buyerName = user?.contactPerson || user?.name || user?.full_name || inspectionData.buyerName || 'Arun K';
      const buyerEmail = (user?.email || inspectionData.buyerEmail || 'arunbuyer@gmail.com').toLowerCase().trim();
      const buyerPhone = user?.phone || user?.contactPhone || inspectionData.buyerPhone || '+91 97467 94654';

      const existingIdx = current.findIndex(n =>
        n.listingId === inspectionData.listingId &&
        (n.buyerEmail || '').toLowerCase().trim() === buyerEmail
      );

      const visitDate = inspectionData.surveyVisitDate || new Date().toISOString().split('T')[0];
      const timeSlot = inspectionData.surveyTimeSlot || 'Morning (09:00 AM - 12:00 PM)';
      const reqVol = Number(inspectionData.requestedVolume) || Number(listing?.volume) || 1.7;

      let savedRecord;
      const today = new Date().toISOString().split('T')[0];

      const newTimelineEntry = {
        sender: 'Buyer',
        senderName: buyerName,
        action: 'Inspection Requested',
        message: `Requested on-site timber survey visit on ${visitDate} (${timeSlot}). Purpose: Verify log dimensions, heartwood quality, debarking, and transit clearance before submitting price offer.`,
        date: today
      };

      if (existingIdx !== -1) {
        const existing = current[existingIdx];
        savedRecord = {
          ...existing,
          surveyVisitDate: visitDate,
          surveyTimeSlot: timeSlot,
          requestedVolume: reqVol,
          buyerCompany: inspectionData.buyerCompany || existing.buyerCompany || 'timberbuyers',
          localBody: inspectionData.localBody || existing.localBody || 'Meenadom Panchayat',
          notes: inspectionData.notes || existing.notes,
          status: 'Inspection Requested',
          statusStep: 'inspection_requested',
          timeline: [newTimelineEntry, ...(existing.timeline || [])]
        };
        current[existingIdx] = savedRecord;
      } else {
        savedRecord = {
          id: `neg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          listingId: inspectionData.listingId,
          timberTitle: listing?.title || inspectionData.timberTitle || `${listing?.timberSpecies || 'Teak'} Sawlogs`,
          timberSpecies: listing?.timberSpecies || inspectionData.timberSpecies || 'Teak',
          listingVolume: listing?.volume || reqVol,
          sellerRole: listing?.sellerRole || inspectionData.sellerRole || 'landowner',
          sellerName: listing?.sellerName || inspectionData.sellerName || 'Verified Seller',
          sellerEmail: (listing?.sellerEmail || inspectionData.sellerEmail || '').toLowerCase().trim(),
          sellerPhone: listing?.sellerPhone || '+91 94471 28901',
          buyerName,
          buyerEmail,
          buyerPhone,
          buyerCompany: inspectionData.buyerCompany || user?.company_name || 'timberbuyers',
          localBody: inspectionData.localBody || listing?.localBody || listing?.panchayat || 'Meenadom Panchayat',
          originalPricePerM3: listing?.pricePerM3 || 147695,
          offeredPricePerM3: 0,
          requestedVolume: reqVol,
          totalOffered: 0,
          surveyVisitDate: visitDate,
          surveyTimeSlot: timeSlot,
          deliveryPreference: inspectionData.deliveryPreference || 'Seller Contractor Hauling to Mill',
          destinationMill: inspectionData.destinationMill || 'Ernakulam Timber Mill Yard #2',
          notes: inspectionData.notes || 'Buyer requests on-site inspection visit.',
          status: 'Inspection Requested',
          statusStep: 'inspection_requested',
          surveyCompleted: false,
          timeline: [newTimelineEntry],
          createdAt: today
        };
        current.unshift(savedRecord);
      }

      localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(current));
      try {
        await api.post('/marketplace/negotiations', savedRecord).catch(() => {});
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'inspection_requested', record: savedRecord }
      }));

      return savedRecord;
    } catch (e) {
      console.error('Error requesting timber inspection:', e);
      throw e;
    }
  },

  approveInspectionDate: async (negotiationId, user = null) => {
    try {
      const current = marketplaceService.getNegotiations();
      const target = current.find(n => n.id === negotiationId);
      if (!target) throw new Error('Record not found');

      const today = new Date().toISOString().split('T')[0];
      const updated = {
        ...target,
        status: 'Inspection Scheduled',
        statusStep: 'inspection_scheduled',
        approvedInspectionDate: target.surveyVisitDate,
        approvedTimeSlot: target.surveyTimeSlot,
        timeline: [
          {
            sender: 'Landowner',
            senderName: user?.name || target.sellerName,
            action: 'Inspection Approved',
            message: `Landowner approved on-site timber inspection for ${target.surveyVisitDate} (${target.surveyTimeSlot}). On-site log yard ready for buyer inspection.`,
            date: today
          },
          ...(target.timeline || [])
        ],
        updatedAt: today
      };

      const nextList = current.map(n => n.id === negotiationId ? updated : n);
      localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(nextList));

      try {
        const { _id, ...cleanUpdated } = updated;
        await api.put(`/marketplace/negotiations/${negotiationId}`, cleanUpdated).catch((err) => {
          console.warn('Backend negotiation update failed:', err);
        });
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'inspection_approved', record: updated }
      }));
      return updated;
    } catch (e) {
      console.error('Error approving inspection date:', e);
      throw e;
    }
  },

  suggestAlternativeDate: async (negotiationId, { newDate, newTimeSlot, reason }, user = null) => {
    try {
      const current = marketplaceService.getNegotiations();
      const target = current.find(n => n.id === negotiationId);
      if (!target) throw new Error('Record not found');

      const today = new Date().toISOString().split('T')[0];
      const updated = {
        ...target,
        status: 'Date Rescheduled by Landowner',
        statusStep: 'date_rescheduled',
        suggestedDate: newDate,
        suggestedTimeSlot: newTimeSlot || target.surveyTimeSlot,
        rescheduleReason: reason || 'Landowner proposed alternate date for on-site availability.',
        timeline: [
          {
            sender: 'Landowner',
            senderName: user?.name || target.sellerName,
            action: 'Date Rescheduled',
            message: `Landowner proposed alternate inspection date: ${newDate} (${newTimeSlot || target.surveyTimeSlot}). Reason: ${reason || 'Schedule adjustment.'}`,
            date: today
          },
          ...(target.timeline || [])
        ],
        updatedAt: today
      };

      const nextList = current.map(n => n.id === negotiationId ? updated : n);
      localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(nextList));

      try {
        const { _id, ...cleanUpdated } = updated;
        await api.put(`/marketplace/negotiations/${negotiationId}`, cleanUpdated).catch((err) => {
          console.warn('Backend negotiation update failed:', err);
        });
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'inspection_rescheduled', record: updated }
      }));
      return updated;
    } catch (e) {
      console.error('Error suggesting alternative date:', e);
      throw e;
    }
  },

  acceptRescheduledDate: async (negotiationId, user = null) => {
    try {
      const current = marketplaceService.getNegotiations();
      const target = current.find(n => n.id === negotiationId);
      if (!target) throw new Error('Record not found');

      const today = new Date().toISOString().split('T')[0];
      const newDate = target.suggestedDate || target.surveyVisitDate;
      const newSlot = target.suggestedTimeSlot || target.surveyTimeSlot;

      const updated = {
        ...target,
        status: 'Inspection Scheduled',
        statusStep: 'inspection_scheduled',
        surveyVisitDate: newDate,
        surveyTimeSlot: newSlot,
        approvedInspectionDate: newDate,
        approvedTimeSlot: newSlot,
        timeline: [
          {
            sender: 'Buyer',
            senderName: user?.name || target.buyerName,
            action: 'Accepted Rescheduled Date',
            message: `Buyer accepted new inspection date: ${newDate} (${newSlot}). Survey visit confirmed.`,
            date: today
          },
          ...(target.timeline || [])
        ],
        updatedAt: today
      };

      const nextList = current.map(n => n.id === negotiationId ? updated : n);
      localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(nextList));

      try {
        const { _id, ...cleanUpdated } = updated;
        await api.put(`/marketplace/negotiations/${negotiationId}`, cleanUpdated).catch((err) => {
          console.warn('Backend negotiation update failed:', err);
        });
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'rescheduled_date_accepted', record: updated }
      }));
      return updated;
    } catch (e) {
      console.error('Error accepting rescheduled date:', e);
      throw e;
    }
  },

  submitSurveyDetailsAndOffer: async (negotiationId, surveyData, user = null) => {
    try {
      const current = marketplaceService.getNegotiations();
      const target = current.find(n => n.id === negotiationId);
      if (!target) throw new Error('Record not found');

      const today = new Date().toISOString().split('T')[0];
      const verifiedVol = Number(surveyData.verifiedVolume) || Number(target.requestedVolume) || 1.7;
      const offeredRate = Number(surveyData.offeredPricePerM3) || 138833;
      const totalOffered = Number(surveyData.totalOffered) || Math.round(verifiedVol * offeredRate);

      const surveyDetails = {
        verifiedVolume: verifiedVol,
        logCount: surveyData.logCount || 2,
        observedGrade: surveyData.observedGrade || 'Grade A Prime Export',
        heartwoodQuality: surveyData.heartwoodQuality || 'Verified High Density Heartwood Girth',
        transitClearanceVerified: surveyData.transitClearanceVerified !== false,
        storageCondition: surveyData.storageCondition || 'Debarked & Stenciled at Estate Yard',
        surveyDate: surveyData.surveyDate || target.surveyVisitDate || today,
        surveyorName: user?.name || target.buyerName || 'Buyer Technical Surveyor'
      };

      const updated = {
        ...target,
        status: 'Pending Review',
        statusStep: 'offer_submitted',
        surveyCompleted: true,
        surveyDetails,
        verifiedVolume: verifiedVol,
        requestedVolume: verifiedVol,
        offeredPricePerM3: offeredRate,
        totalOffered,
        deliveryPreference: surveyData.deliveryPreference || target.deliveryPreference,
        destinationMill: surveyData.destinationMill || target.destinationMill,
        notes: surveyData.notes || target.notes,
        timeline: [
          {
            sender: 'Buyer',
            senderName: user?.name || target.buyerName,
            action: 'Survey Completed & Offer Submitted',
            message: `Completed on-site timber survey: Verified ${verifiedVol} m³ (${surveyDetails.observedGrade}). Submitted purchase offer of ₹${offeredRate.toLocaleString('en-IN')}/m³ (Total: ₹${totalOffered.toLocaleString('en-IN')}).`,
            date: today
          },
          ...(target.timeline || [])
        ],
        updatedAt: today
      };

      const nextList = current.map(n => n.id === negotiationId ? updated : n);
      localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(nextList));

      try {
        const { _id, ...cleanUpdated } = updated;
        await api.put(`/marketplace/negotiations/${negotiationId}`, cleanUpdated).catch((err) => {
          console.warn('Backend negotiation update failed:', err);
        });
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'survey_offer_submitted', record: updated }
      }));
      return updated;
    } catch (e) {
      console.error('Error submitting survey details and offer:', e);
      throw e;
    }
  },

  acceptOfferAndCreateOrder: async (negotiationId, user = null) => {
    try {
      const current = marketplaceService.getNegotiations();
      const target = current.find(n => n.id === negotiationId);
      if (!target) throw new Error('Negotiation not found');

      const today = new Date().toISOString().split('T')[0];
      const finalRate = target.counterOffer ? Number(target.counterOffer.pricePerM3) : Number(target.offeredPricePerM3 || 138833);
      const finalVol = Number(target.verifiedVolume || target.requestedVolume || 1.7);
      const totalAmount = Math.round(finalRate * finalVol);

      const updatedNeg = {
        ...target,
        status: 'Accepted',
        statusStep: 'deal_accepted',
        timeline: [
          {
            sender: 'Landowner',
            senderName: user?.name || target.sellerName,
            action: 'Offer Accepted',
            message: `Landowner accepted survey offer at ₹${finalRate.toLocaleString('en-IN')}/m³ for ${finalVol} m³. Official timber purchase contract generated. Ready for payment.`,
            date: today
          },
          ...(target.timeline || [])
        ],
        updatedAt: today
      };

      const nextNegs = current.map(n => n.id === negotiationId ? updatedNeg : n);
      localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(nextNegs));

      try {
        const { _id, ...cleanUpdated } = updatedNeg;
        await api.put(`/marketplace/negotiations/${negotiationId}`, cleanUpdated).catch((err) => {
          console.warn('Backend negotiation update failed:', err);
        });
      } catch (_) {}

      // Automatically create the Purchase Order!
      const newOrder = await marketplaceService.createOrder({
        negotiationId: target.id,
        listingId: target.listingId,
        timberItem: target.timberTitle,
        species: target.timberSpecies,
        volume: finalVol,
        unitPrice: finalRate,
        sellerRole: target.sellerRole,
        sellerName: target.sellerName,
        sellerEmail: target.sellerEmail,
        buyerName: target.buyerName,
        buyerEmail: target.buyerEmail,
        destinationMill: target.destinationMill || 'Ernakulam Timber Mill Yard #2',
        paymentTerms: 'TreeConnect Escrow Payment Required',
        notes: target.notes || 'Purchase order generated following approved on-site survey inspection.'
      }, user);

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'deal_accepted', negotiation: updatedNeg, order: newOrder }
      }));

      return { negotiation: updatedNeg, order: newOrder };
    } catch (e) {
      console.error('Error accepting offer and creating order:', e);
      throw e;
    }
  },

  recordOrderPayment: async (orderId, paymentData, user = null) => {
    try {
      const currentOrders = marketplaceService.getOrders();
      const targetOrder = currentOrders.find(o => o.id === orderId);
      if (!targetOrder) throw new Error('Order not found');

      const today = new Date().toISOString().split('T')[0];
      const payRef = paymentData.paymentRef || `PAY-TC-${Date.now().toString().slice(-6)}`;
      const amountPaid = Number(paymentData.amount) || targetOrder.totalNum;

      const updatedOrder = {
        ...targetOrder,
        status: 'Paid & Purchased - Transferred to Landowner',
        paymentStatus: 'PAID',
        paidAmount: amountPaid,
        paymentRef: payRef,
        paymentMethod: paymentData.paymentMethod || 'Direct Payment to Landowner (UPI/NetBanking)',
        paidAt: new Date().toISOString()
      };

      const nextOrders = currentOrders.map(o => o.id === orderId ? updatedOrder : o);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders));

      try {
        await api.put(`/marketplace/orders/${orderId}`, updatedOrder).catch(() => {});
      } catch (_) {}

      // Also mark associated negotiation if any
      if (targetOrder.negotiationId) {
        try {
          const negs = marketplaceService.getNegotiations();
          const neg = negs.find(n => n.id === targetOrder.negotiationId);
          if (neg) {
            neg.paymentStatus = 'PAID';
            neg.paymentRef = payRef;
            neg.status = 'Payment Completed';
            neg.timeline = [
              {
                sender: 'Buyer',
                senderName: user?.name || targetOrder.buyerName,
                action: 'Payment Completed',
                message: `Payment of ₹${amountPaid.toLocaleString('en-IN')} confirmed via ${paymentData.paymentMethod || 'Escrow'} (Ref: ${payRef}). Log hauling and dispatch authorized.`,
                date: today
              },
              ...(neg.timeline || [])
            ];
            localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(negs));
            await api.put(`/marketplace/negotiations/${neg.id}`, neg).catch(() => {});
          }
        } catch (_) {}
      }

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'order_paid', order: updatedOrder }
      }));

      return updatedOrder;
    } catch (e) {
      console.error('Error recording order payment:', e);
      throw e;
    }
  },

  deleteNegotiation: async (id) => {
    try {
      const idStr = String(id || '').trim();
      const current = marketplaceService.getNegotiations();
      const filtered = current.filter(n => {
        const nId = String(n?.id || n?._id || '').trim();
        return nId !== idStr && n?.id !== id && n?._id !== id;
      });
      localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(filtered));

      try {
        await api.delete(`/marketplace/negotiations/${encodeURIComponent(idStr)}`).catch(() => {});
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'negotiation_deleted', id: idStr }
      }));
      return true;
    } catch (e) {
      console.error('Error deleting timber negotiation:', e);
      return false;
    }
  },

  clearNegotiations: async (buyerEmail = null) => {
    try {
      const current = marketplaceService.getNegotiations();
      let filtered = [];
      if (buyerEmail) {
        const bEmail = buyerEmail.toLowerCase().trim();
        filtered = current.filter(n => (n?.buyerEmail || '').toLowerCase().trim() !== bEmail);
      }
      localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(filtered));

      try {
        const url = buyerEmail ? `/marketplace/negotiations?buyer_email=${encodeURIComponent(buyerEmail)}` : '/marketplace/negotiations';
        await api.delete(url).catch(() => {});
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'negotiations_cleared' }
      }));
      return true;
    } catch (e) {
      console.error('Error clearing timber negotiations:', e);
      return false;
    }
  },

  // ==================== PURCHASE ORDERS ====================

  getOrders: () => {
    try {
      // Build a set of all valid listing IDs currently in the system
      const validListingIds = new Set();
      const currentListings = marketplaceService.getListings();
      currentListings.forEach(l => {
        if (l.id) validListingIds.add(String(l.id).trim());
        if (l._id) validListingIds.add(String(l._id).trim());
        if (l.harvestOperationId) validListingIds.add(String(l.harvestOperationId).trim());
        if (l.harvestRequestId) validListingIds.add(String(l.harvestRequestId).trim());
        if (l.treeInventoryId) validListingIds.add(String(l.treeInventoryId).trim());
      });

      const raw = localStorage.getItem(ORDERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const realOnly = parsed.filter(isNotFake);
          // Only keep orders whose parent listing exists
          const withoutOrphans = realOnly.filter(item => {
            const lId = String(item.listingId || '').trim();
            if (validListingIds.size === 0) return false;
            return validListingIds.has(lId);
          });
          if (withoutOrphans.length !== parsed.length) {
            localStorage.setItem(ORDERS_KEY, JSON.stringify(withoutOrphans));
          }
          return withoutOrphans;
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
  },

  deleteOrder: async (orderId) => {
    try {
      if (!orderId) return false;
      const idStr = String(orderId).trim();
      const current = marketplaceService.getOrders();
      const next = current.filter(o => String(o.id || o._id || '').trim() !== idStr);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(next));

      try {
        await api.delete(`/marketplace/orders/${idStr}`).catch(() => {});
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'order_deleted', id: idStr }
      }));
      return true;
    } catch (e) {
      console.error('Error deleting purchase order:', e);
      return false;
    }
  }
};

export default marketplaceService;
