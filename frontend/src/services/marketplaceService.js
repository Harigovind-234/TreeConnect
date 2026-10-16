/**
 * TreeConnect Timber Marketplace Service
 * Central data layer for Timber Listings, Buyer Negotiations, and Purchase Orders
 * Synchronized across Landowner, Contractor, and Buyer dashboards.
 */

const LISTINGS_KEY = 'treeconnect_timber_listings';
const NEGOTIATIONS_KEY = 'treeconnect_timber_negotiations';
const ORDERS_KEY = 'treeconnect_timber_orders';

// Curated default seed listings from both Landowners and Harvesting Contractors
const SEED_LISTINGS = [
  {
    id: 'tl_teak_01',
    title: 'Grade A1 Nilambur Teak Sawlogs',
    timberSpecies: 'Teakwood',
    timberType: 'Sawlogs',
    volume: 240,
    quantity: 65,
    gradeQuality: 'Grade A Prime Export',
    logDimensions: 'Avg Length 4.5m, Girth 130-170cm',
    askingPrice: 10200000,
    pricePerM3: 42500,
    negotiable: 'Yes',
    district: 'Wayanad',
    storageLocation: 'Sulthan Bathery Forest Parcel #3',
    pickupLocation: 'Forest Gate Depot, NH-766 Road Access',
    sellerRole: 'landowner',
    sellerName: 'Mathews Thomas',
    sellerEmail: 'landowner@treeconnect.com',
    sellerPhone: '+91 94471 28901',
    propertyName: 'Wayanad Hillside Estate',
    description: 'High-density natural matured teak logs harvested from 35-year plantation. Clean straight boled, bark stripped, debarked with end-seal to prevent checking.',
    status: 'Published',
    fscCert: 'FSC-C012984 Certified',
    transportAvailable: false,
    images: [],
    createdAt: '2026-09-12'
  },
  {
    id: 'tl_rose_02',
    title: 'Premium Malabar Rosewood Peeler & Veneer Logs',
    timberSpecies: 'Rosewood',
    timberType: 'Veneer Logs',
    volume: 180,
    quantity: 42,
    gradeQuality: 'Premium Veneer Grade',
    logDimensions: 'Avg Length 3.8m, Girth 140-190cm',
    askingPrice: 10440000,
    pricePerM3: 58000,
    negotiable: 'Yes',
    district: 'Palakkad',
    storageLocation: 'Walayar Estate Stand #1',
    pickupLocation: 'Palakkad Industrial Corridor Log Yard',
    sellerRole: 'landowner',
    sellerName: 'Susan Varghese',
    sellerEmail: 'susan.varghese@keralaestate.in',
    sellerPhone: '+91 98460 55123',
    propertyName: 'Palakkad Heritage Timber Reserve',
    description: 'Deep violet-black heartwood with uniform grain texture. Ideal for high-end luxury veneer slicing and musical instrument fabrication. Forest department transit pass cleared.',
    status: 'Published',
    fscCert: 'FSC-C088210 Verified',
    transportAvailable: false,
    images: [],
    createdAt: '2026-09-18'
  },
  {
    id: 'tl_rub_03',
    title: 'Seasoned Rubberwood Industrial Sawlogs',
    timberSpecies: 'Rubberwood',
    timberType: 'Sawlogs',
    volume: 450,
    quantity: 210,
    gradeQuality: 'Industrial Furniture Grade',
    logDimensions: 'Avg Length 3.0m, Girth 80-110cm',
    askingPrice: 5760000,
    pricePerM3: 12800,
    negotiable: 'Yes',
    district: 'Kottayam',
    storageLocation: 'Apex Central Yard, Pala',
    pickupLocation: 'Main Highway Bypass Yard #4',
    sellerRole: 'contractor',
    sellerName: 'Apex Harvesting & Logistics',
    sellerEmail: 'contractor@treeconnect.com',
    sellerPhone: '+91 97455 33002',
    propertyName: 'Apex Log Marshalling Yard',
    description: 'Freshly harvested rubberwood logs from replanting contract. Vacuum pressure treated with borate preservative. Free from fungal stains, ready for kilning.',
    status: 'Published',
    fscCert: 'PEFC Certified Sustainable',
    transportAvailable: true,
    transportNotes: 'Contractor fleet can haul within 150km radius',
    images: [],
    createdAt: '2026-09-25'
  },
  {
    id: 'tl_mah_04',
    title: 'Plantation Mahogany Commercial Baulks & Logs',
    timberSpecies: 'Mahogany',
    timberType: 'Sawlogs',
    volume: 310,
    quantity: 90,
    gradeQuality: 'Joinery Grade #1',
    logDimensions: 'Avg Length 4.0m, Girth 110-145cm',
    askingPrice: 7440000,
    pricePerM3: 24000,
    negotiable: 'Yes',
    district: 'Idukki',
    storageLocation: 'High Range Timber Reserve Depot',
    pickupLocation: 'Munnar Valley Access Road',
    sellerRole: 'contractor',
    sellerName: 'Highland Timber Contractors',
    sellerEmail: 'info@highlandlogging.in',
    sellerPhone: '+91 94462 88129',
    propertyName: 'Idukki Forestry Concession Yard',
    description: 'Rich reddish-brown heartwood with interlocking grain. Excellent dimensional stability for architectural millwork, door frames, and cabinet manufacturing.',
    status: 'Published',
    fscCert: 'FSC-C099411 Verified',
    transportAvailable: true,
    transportNotes: 'Hydraulic log loaders and heavy trucks available on-site',
    images: [],
    createdAt: '2026-10-02'
  },
  {
    id: 'tl_euc_05',
    title: 'Eucalyptus Debarked Round Poles & Pulpwood',
    timberSpecies: 'Eucalyptus',
    timberType: 'Poles',
    volume: 380,
    quantity: 400,
    gradeQuality: 'Construction & Scaffolding Pole Grade',
    logDimensions: 'Avg Length 6.0m, Girth 45-70cm',
    askingPrice: 3230000,
    pricePerM3: 8500,
    negotiable: 'No',
    district: 'Ernakulam',
    storageLocation: 'Perumbavoor Plywood Cluster Depot',
    pickupLocation: 'Perumbavoor Industrial Area Gate #1',
    sellerRole: 'landowner',
    sellerName: 'George Kurian',
    sellerEmail: 'kurian.timber@gmail.com',
    sellerPhone: '+91 94470 12099',
    propertyName: 'Perumbavoor Agroforest Holding',
    description: 'Straight cylindrical poles suitable for construction staging, rural electrification poles, or pulp chip processing. Uniform moisture content.',
    status: 'Published',
    fscCert: 'Verified Farm Forestry',
    transportAvailable: false,
    images: [],
    createdAt: '2026-10-05'
  }
];

// Default sample negotiations
const SEED_NEGOTIATIONS = [
  {
    id: 'neg_101',
    listingId: 'tl_teak_01',
    timberTitle: 'Grade A1 Nilambur Teak Sawlogs',
    timberSpecies: 'Teakwood',
    listingVolume: 240,
    sellerRole: 'landowner',
    sellerName: 'Mathews Thomas',
    sellerEmail: 'landowner@treeconnect.com',
    buyerName: 'Pacific Lumber Mills',
    buyerEmail: 'buyer@treeconnect.com',
    buyerPhone: '+91 98470 99410',
    buyerCompany: 'Pacific Lumber Processing Corp',
    originalPricePerM3: 42500,
    offeredPricePerM3: 39500,
    requestedVolume: 120,
    totalOffered: 4740000,
    deliveryPreference: 'Mill Delivery to Ernakulam Yard',
    paymentTerms: '50% Advance Escrow + 50% Post-Weighbridge',
    notes: 'We are ready to procure 120 m³ immediately if the rate of ₹39,500/m³ is acceptable. We can arrange transit permits.',
    status: 'Counter-Offer',
    counterOffer: {
      pricePerM3: 41000,
      totalAmount: 4920000,
      message: 'We can accept ₹41,000/m³ for 120 m³ lot if buyer collects from Sulthan Bathery depot.',
      date: '2026-10-12'
    },
    timeline: [
      {
        sender: 'Buyer',
        senderName: 'Pacific Lumber Mills',
        message: 'Submitted initial offer of ₹39,500/m³ for 120 m³',
        date: '2026-10-11'
      },
      {
        sender: 'Seller',
        senderName: 'Mathews Thomas',
        message: 'Counter-offered at ₹41,000/m³ with depot pickup condition',
        date: '2026-10-12'
      }
    ],
    createdAt: '2026-10-11'
  },
  {
    id: 'neg_102',
    listingId: 'tl_rub_03',
    timberTitle: 'Seasoned Rubberwood Industrial Sawlogs',
    timberSpecies: 'Rubberwood',
    listingVolume: 450,
    sellerRole: 'contractor',
    sellerName: 'Apex Harvesting & Logistics',
    sellerEmail: 'contractor@treeconnect.com',
    buyerName: 'Pacific Lumber Mills',
    buyerEmail: 'buyer@treeconnect.com',
    buyerPhone: '+91 98470 99410',
    buyerCompany: 'Pacific Lumber Processing Corp',
    originalPricePerM3: 12800,
    offeredPricePerM3: 12000,
    requestedVolume: 200,
    totalOffered: 2400000,
    deliveryPreference: 'Contractor Fleet Hauling to Ernakulam',
    paymentTerms: '100% Escrow on Dispatch',
    notes: 'Interested in consistent monthly delivery of 200 m³. Seeking slight discount for long-term supply agreement.',
    status: 'Pending Review',
    counterOffer: null,
    timeline: [
      {
        sender: 'Buyer',
        senderName: 'Pacific Lumber Mills',
        message: 'Submitted offer of ₹12,000/m³ for 200 m³ with contractor delivery',
        date: '2026-10-13'
      }
    ],
    createdAt: '2026-10-13'
  }
];

// Default sample orders
const SEED_ORDERS = [
  {
    id: 'ORD-2026-901',
    listingId: 'tl_teak_01',
    timberItem: 'Teakwood Sawlogs (Grade A1)',
    species: 'Teakwood',
    volume: '200 m³',
    volumeNum: 200,
    unitPrice: 42500,
    total: '₹ 85,00,000',
    totalNum: 8500000,
    status: 'In Transit',
    ETA: '18 Oct 2026',
    sellerRole: 'landowner',
    sellerName: 'Mathews Thomas',
    contractor: 'Apex Harvesting Co.',
    mill: 'Ernakulam Mill Yard #1',
    passNo: 'KL-FR-88219/2026',
    progress: 75,
    milestones: [
      { step: 'Forest Yard Loading & Stenciling', date: '10 Oct 2026', done: true },
      { step: 'Transit Permit & Forest Pass Verification', date: '12 Oct 2026', done: true },
      { step: 'Highway Transit (Wayanad to Ernakulam)', date: 'Active Transit (75%)', done: true },
      { step: 'Mill Gate Weighbridge & Moisture Inspection', date: 'Est. 18 Oct 2026', done: false }
    ],
    buyerName: 'Pacific Lumber Mills',
    buyerEmail: 'buyer@treeconnect.com',
    createdAt: '2026-10-10'
  },
  {
    id: 'ORD-2026-882',
    listingId: 'tl_rose_02',
    timberItem: 'Rosewood Veneer Logs',
    species: 'Rosewood',
    volume: '150 m³',
    volumeNum: 150,
    unitPrice: 58000,
    total: '₹ 87,00,000',
    totalNum: 8700000,
    status: 'Delivered to Mill',
    ETA: '04 Oct 2026',
    sellerRole: 'landowner',
    sellerName: 'Susan Varghese',
    contractor: 'Malabar Logging Ops',
    mill: 'Kochi Lumber Processing Port',
    passNo: 'KL-FR-77102/2026',
    progress: 100,
    milestones: [
      { step: 'Forest Yard Loading & Stenciling', date: '28 Sep 2026', done: true },
      { step: 'Transit Permit Verification', date: '30 Sep 2026', done: true },
      { step: 'Highway Transit', date: '02 Oct 2026', done: true },
      { step: 'Mill Gate Weighbridge Acceptance', date: '04 Oct 2026', done: true }
    ],
    buyerName: 'Pacific Lumber Mills',
    buyerEmail: 'buyer@treeconnect.com',
    createdAt: '2026-09-28'
  }
];

export const marketplaceService = {
  // ==================== LISTINGS ====================

  getListings: () => {
    try {
      const raw = localStorage.getItem(LISTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Initialize with seed listings
      localStorage.setItem(LISTINGS_KEY, JSON.stringify(SEED_LISTINGS));
      return SEED_LISTINGS;
    } catch (e) {
      console.error('Error loading timber listings:', e);
      return SEED_LISTINGS;
    }
  },

  getListingById: (id) => {
    const list = marketplaceService.getListings();
    return list.find(l => l.id === id) || null;
  },

  saveListing: (listingData, user = null) => {
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
          id: `tl_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          status: 'Published',
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

      const nextListings = isEdit
        ? currentListings.map(l => l.id === updatedListing.id ? updatedListing : l)
        : [updatedListing, ...currentListings];

      localStorage.setItem(LISTINGS_KEY, JSON.stringify(nextListings));

      // Also persist to user-specific key for backward compatibility
      if (updatedListing.sellerEmail) {
        try {
          const userKey = `treeconnect_timber_listings_${updatedListing.sellerEmail}`;
          const userOnly = nextListings.filter(l => (l.sellerEmail || '').toLowerCase() === updatedListing.sellerEmail.toLowerCase());
          localStorage.setItem(userKey, JSON.stringify(userOnly));
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

  deleteListing: (id) => {
    try {
      const currentListings = marketplaceService.getListings();
      const nextListings = currentListings.filter(l => l.id !== id);
      localStorage.setItem(LISTINGS_KEY, JSON.stringify(nextListings));

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      localStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(SEED_NEGOTIATIONS));
      return SEED_NEGOTIATIONS;
    } catch (e) {
      console.error('Error loading timber negotiations:', e);
      return SEED_NEGOTIATIONS;
    }
  },

  createNegotiation: (offerData, user = null) => {
    try {
      const current = marketplaceService.getNegotiations();
      const listing = marketplaceService.getListingById(offerData.listingId);

      const buyerName = user?.name || user?.full_name || offerData.buyerName || 'Buyer';
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
        buyerPhone: user?.phone || offerData.buyerPhone || '+91 98470 00000',
        buyerCompany: offerData.buyerCompany || user?.company_name || 'Procurement Buyer Corp',
        originalPricePerM3: listing?.pricePerM3 || offerData.originalPricePerM3 || 0,
        offeredPricePerM3: Number(offerData.offeredPricePerM3) || 0,
        requestedVolume: Number(offerData.requestedVolume) || 10,
        totalOffered: (Number(offerData.offeredPricePerM3) || 0) * (Number(offerData.requestedVolume) || 10),
        deliveryPreference: offerData.deliveryPreference || 'Buyer Arranged Pickup',
        paymentTerms: offerData.paymentTerms || '50% Advance Escrow + 50% Post-Weighbridge',
        notes: offerData.notes || '',
        status: 'Pending Review',
        counterOffer: null,
        timeline: [
          {
            sender: 'Buyer',
            senderName: buyerName,
            message: `Offered ₹${Number(offerData.offeredPricePerM3).toLocaleString('en-IN')}/m³ for ${offerData.requestedVolume} m³ (${offerData.deliveryPreference})`,
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

      window.dispatchEvent(new CustomEvent('treeconnect_marketplace_updated', {
        detail: { type: 'negotiation_created', negotiation: newNegotiation }
      }));

      return newNegotiation;
    } catch (e) {
      console.error('Error creating timber negotiation:', e);
      throw e;
    }
  },

  respondToNegotiation: (negotiationId, action, payload = {}) => {
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
          sender: payload.sender || 'Seller',
          senderName: payload.senderName || target.sellerName,
          message: payload.message || `Accepted offer at ₹${(counterOffer ? counterOffer.pricePerM3 : target.offeredPricePerM3).toLocaleString('en-IN')}/m³`,
          date: today
        });
      } else if (action === 'reject') {
        updatedStatus = 'Rejected';
        nextTimeline.push({
          sender: payload.sender || 'Seller',
          senderName: payload.senderName || target.sellerName,
          message: payload.message || 'Declined offer. The terms could not be met.',
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      localStorage.setItem(ORDERS_KEY, JSON.stringify(SEED_ORDERS));
      return SEED_ORDERS;
    } catch (e) {
      console.error('Error loading timber orders:', e);
      return SEED_ORDERS;
    }
  },

  createOrder: (orderPayload, user = null) => {
    try {
      const current = marketplaceService.getOrders();
      const listing = orderPayload.listingId ? marketplaceService.getListingById(orderPayload.listingId) : null;

      const buyerName = user?.name || user?.full_name || orderPayload.buyerName || 'Pacific Lumber Mills';
      const buyerEmail = (user?.email || orderPayload.buyerEmail || '').toLowerCase().trim();

      const volNum = Number(orderPayload.volume) || (listing?.volume || 50);
      const unitPrice = Number(orderPayload.unitPrice) || (listing?.pricePerM3 || 25000);
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
        status: 'Order Confirmed - Dispatch Scheduled',
        ETA: '26 Oct 2026',
        sellerRole: listing?.sellerRole || orderPayload.sellerRole || 'landowner',
        sellerName: listing?.sellerName || orderPayload.sellerName || 'Verified Seller',
        sellerEmail: listing?.sellerEmail || orderPayload.sellerEmail,
        contractor: orderPayload.contractor || (listing?.sellerRole === 'contractor' ? listing.sellerName : 'Kerala Agro Logistics'),
        mill: orderPayload.destinationMill || 'Ernakulam Timber Processing Yard #2',
        passNo: `KL-FR-${Math.floor(10000 + Math.random() * 90000)}/2026`,
        progress: 15,
        milestones: [
          { step: 'Order Placed & Escrow Secured', date: 'Today', done: true },
          { step: 'Yard Log Loading & Stenciling', date: 'In 2 days', done: false },
          { step: 'Transit Pass Clearance (KL Forest Dept)', date: 'In 4 days', done: false },
          { step: 'Mill Gate Arrival & Quality Check', date: 'Est. 26 Oct 2026', done: false }
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
