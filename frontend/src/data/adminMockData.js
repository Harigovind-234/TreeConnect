// Realistic structured mock data for TreeConnect Admin Console

export const platformOverviewMetrics = [
  {
    id: 'total_users',
    label: 'TOTAL USERS',
    value: '1,248',
    subtext: '+12% this month',
    icon: 'Users',
    color: 'emerald'
  },
  {
    id: 'pending_contractors',
    label: 'CONTRACTOR VERIFICATION',
    value: '12',
    subtext: 'Pending review',
    icon: 'ShieldCheck',
    color: 'amber'
  },
  {
    id: 'active_properties',
    label: 'ACTIVE PROPERTIES',
    value: '486',
    subtext: '+18 this month',
    icon: 'Trees',
    color: 'emerald'
  },
  {
    id: 'harvest_requests',
    label: 'HARVEST REQUESTS',
    value: '74',
    subtext: '18 pending',
    icon: 'Truck',
    color: 'blue'
  },
  {
    id: 'timber_listings',
    label: 'TIMBER LISTINGS',
    value: '126',
    subtext: '14 new this month',
    icon: 'ShoppingBag',
    color: 'purple'
  },
  {
    id: 'transactions',
    label: 'TRANSACTIONS',
    value: '₹18.4M',
    subtext: '+14.2% volume',
    icon: 'DollarSign',
    color: 'emerald'
  }
];

export const allUsersList = [
  { id: 'usr_1', name: 'Harigovind D Nair', email: 'harigovind@keralatree.in', phone: '+91 98470 12345', role: 'landowner', location: 'Kottayam, Kerala', status: 'Active', verification: 'Verified', date: 'Aug 08, 2026' },
  { id: 'usr_2', name: 'Apex Tree Services', email: 'contact@apextree.in', phone: '+91 97452 33211', role: 'contractor', location: 'Kottayam, Kerala', status: 'Active', verification: 'Pending Verification', date: 'Aug 08, 2026' },
  { id: 'usr_3', name: 'Pacific Lumber Mills', email: 'procurement@pacificlumber.in', phone: '+91 98950 55432', role: 'buyer', location: 'Ernakulam, Kerala', status: 'Active', verification: 'Verified', date: 'Aug 02, 2026' },
  { id: 'usr_4', name: 'Mathew Varghese', email: 'mathew.v@wynaadtea.com', phone: '+91 94460 77889', role: 'landowner', location: 'Wayanad, Kerala', status: 'Active', verification: 'Verified', date: 'Jul 29, 2026' },
  { id: 'usr_5', name: 'Kerala Timber Works', email: 'keralatimberworks@harvest.in', phone: '+91 98461 44556', role: 'contractor', location: 'Ernakulam, Kerala', status: 'Active', verification: 'Pending Verification', date: 'Aug 07, 2026' },
  { id: 'usr_6', name: 'South Asian Plywood Industries', email: 'rawmaterial@southasianply.com', phone: '+91 98952 11002', role: 'buyer', location: 'Perumbavoor, Kerala', status: 'Active', verification: 'Verified', date: 'Jul 24, 2026' },
  { id: 'usr_7', name: 'Robert Pine', email: 'landowner@treeconnect.com', phone: '+91 98471 99887', role: 'landowner', location: 'Wayanad, Kerala', status: 'Active', verification: 'Verified', date: 'Jul 12, 2026' },
  { id: 'usr_8', name: 'Apex Harvesting Co.', email: 'contractor@treeconnect.com', phone: '+91 94471 98765', role: 'contractor', location: 'Palakkad, Kerala', status: 'Active', verification: 'Verified by TreeConnect Admin', date: 'Jul 15, 2026' },
  { id: 'usr_9', name: 'Green Harvest Team', email: 'greenharvest@outlook.com', phone: '+91 94473 11223', role: 'contractor', location: 'Wayanad, Kerala', status: 'Active', verification: 'Pending Verification', date: 'Aug 06, 2026' },
  { id: 'usr_10', name: 'TreeConnect Admin', email: 'admin@treeconnect.com', phone: '+91 94470 00111', role: 'admin', location: 'Thiruvananthapuram, Kerala', status: 'Active', verification: 'Verified', date: 'Jul 01, 2026' }
];

export const attentionRequiredItems = [
  {
    id: 'att_1',
    category: 'Contractor Verification',
    title: 'Contractor Verification Queue',
    description: '12 contractors are waiting for review',
    count: 12,
    badgeColor: 'amber',
    actionLabel: 'Review',
    target: 'verification'
  },
  {
    id: 'att_2',
    category: 'Property / Survey Issues',
    title: 'Property & Boundary Audit',
    description: '6 properties require survey attention',
    count: 6,
    badgeColor: 'blue',
    actionLabel: 'View',
    target: 'properties'
  },
  {
    id: 'att_3',
    category: 'Reported Accounts',
    title: 'Reported Account Flags',
    description: '2 reports require admin inspection',
    count: 2,
    badgeColor: 'red',
    actionLabel: 'Review',
    target: 'users'
  },
  {
    id: 'att_4',
    category: 'Marketplace Issues',
    title: 'Timber Trade Disputes',
    description: '2 disputes require attention',
    count: 2,
    badgeColor: 'purple',
    actionLabel: 'View',
    target: 'marketplace'
  },
  {
    id: 'att_5',
    category: 'Payment Issues',
    title: 'Escrow Transaction Exceptions',
    description: '3 transactions require attention',
    count: 3,
    badgeColor: 'amber',
    actionLabel: 'View',
    target: 'transactions'
  }
];

export const pendingContractorsList = [
  {
    id: 'ctr_101',
    contractorName: 'Apex Tree Services',
    contactPerson: 'K. Rajan',
    email: 'contact@apextree.in',
    phone: '+91 97452 33211',
    location: 'Kottayam, Kerala',
    experience: '8 Years',
    submittedDate: 'Aug 8, 2026',
    status: 'Pending Verification',
    docType: 'Aadhaar & Harvesting Permit',
    equipment: 'Chain Saws, Log Crane, Heavy Transport Truck',
    licensesSubmitted: 'Commercial Heavy Vehicle Permit, Panchayat Trade License'
  },
  {
    id: 'ctr_102',
    contractorName: 'Kerala Timber Works',
    contactPerson: 'Sujith K.V.',
    email: 'keralatimberworks@harvest.in',
    phone: '+91 98461 44556',
    location: 'Ernakulam, Kerala',
    experience: '5 Years',
    submittedDate: 'Aug 7, 2026',
    status: 'Pending Verification',
    docType: 'Equipment Ownership & Heavy Vehicle License',
    equipment: 'Hydraulic Log Crane, Tractor Trailer',
    licensesSubmitted: 'State Transport Department Badge'
  },
  {
    id: 'ctr_103',
    contractorName: 'Green Harvest Team',
    contactPerson: 'Varghese Thomas',
    email: 'greenharvest@outlook.com',
    phone: '+91 94473 11223',
    location: 'Wayanad, Kerala',
    experience: '3 Years',
    submittedDate: 'Aug 6, 2026',
    status: 'Pending Verification',
    docType: 'Identity Card & Worker Insurance',
    equipment: 'Power Saws, Skidder',
    licensesSubmitted: 'Worker Safety Insurance Certificate'
  }
];

export const userManagementSummary = {
  landowners: 624,
  contractors: 382,
  buyers: 242,
  total: 1248
};

export const operationsOverviewData = {
  harvestOperations: {
    pendingRequests: 18,
    contractorBidding: 24,
    surveyScheduled: 9,
    harvesting: 47,
    completed: 156
  },
  timberMarketplace: {
    activeListings: 126,
    buyerRequests: 14,
    pendingOrders: 8,
    completedSales: 87,
    transactionValue: '₹18.4M'
  },
  transactionsSummary: {
    completedValue: '₹18.4M',
    pendingValue: '₹420K',
    failedCount: 3
  }
};

export const recentPlatformActivities = [
  {
    id: 'act_1',
    title: 'New landowner registered',
    description: 'Harigovind D Nair registered in Kottayam district.',
    timestamp: '5 minutes ago',
    icon: 'Users',
    color: 'emerald'
  },
  {
    id: 'act_2',
    title: 'Contractor verification submitted',
    description: 'Apex Tree Services uploaded ID proof & harvesting permits.',
    timestamp: '18 minutes ago',
    icon: 'ShieldCheck',
    color: 'amber'
  },
  {
    id: 'act_3',
    title: 'New property registered',
    description: 'Pine Valley Rubber Estate (14.5 Acres) logged.',
    timestamp: '32 minutes ago',
    icon: 'Trees',
    color: 'emerald'
  },
  {
    id: 'act_4',
    title: 'Harvest request submitted',
    description: 'Bathery Teak Reserve submitted harvest quotation request.',
    timestamp: '1 hour ago',
    icon: 'Truck',
    color: 'blue'
  },
  {
    id: 'act_5',
    title: 'Contractor bid submitted',
    description: 'Malabar Agro Transport submitted a ₹2,40,000 proposal.',
    timestamp: '2 hours ago',
    icon: 'Gavel',
    color: 'purple'
  },
  {
    id: 'act_6',
    title: 'Timber listing created',
    description: 'A-Grade Plantation Teak Logs (120 m³) listed.',
    timestamp: '3 hours ago',
    icon: 'ShoppingBag',
    color: 'emerald'
  }
];
