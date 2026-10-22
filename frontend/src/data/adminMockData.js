// Live baseline structured data for TreeConnect Admin Console

export const platformOverviewMetrics = [
  {
    id: 'total_users',
    label: 'TOTAL USERS',
    value: '5',
    subtext: 'Live MongoDB count',
    icon: 'Users',
    color: 'emerald'
  },
  {
    id: 'pending_contractors',
    label: 'CONTRACTOR VERIFICATION',
    value: '0',
    subtext: 'All verified',
    icon: 'ShieldCheck',
    color: 'emerald'
  },
  {
    id: 'active_properties',
    label: 'ACTIVE PROPERTIES',
    value: '1',
    subtext: '1 registered',
    icon: 'Trees',
    color: 'emerald'
  },
  {
    id: 'harvest_requests',
    label: 'HARVEST REQUESTS',
    value: '1',
    subtext: '1 completed',
    icon: 'Truck',
    color: 'blue'
  },
  {
    id: 'timber_listings',
    label: 'TIMBER LISTINGS',
    value: '1',
    subtext: '1 active in market',
    icon: 'ShoppingBag',
    color: 'purple'
  },
  {
    id: 'transactions',
    label: 'TRANSACTIONS',
    value: '₹1.10 Lakhs',
    subtext: '2 verified payments',
    icon: 'DollarSign',
    color: 'emerald'
  }
];

export const allUsersList = [
  { id: 'usr_1', name: 'Harigovind D Nair', email: 'h4hari2003@gmail.com', phone: '+91 98470 12345', role: 'landowner', location: 'Kottayam, Kerala', status: 'Active', verification: 'Verified by TreeConnect Admin', date: 'Oct 10, 2026' },
  { id: 'usr_2', name: 'Akshay Krishan', email: 'akshaykrishan34@gmail.com', phone: '+91 97452 33211', role: 'contractor', location: 'Ernakulam, Kerala', status: 'Active', verification: 'Verified by TreeConnect Admin', date: 'Oct 10, 2026' },
  { id: 'usr_3', name: 'Ram krishan', email: 'ramkrishnan@gmail.com', phone: '+91 98461 44556', role: 'contractor', location: 'Kottayam, Kerala', status: 'Active', verification: 'Verified by TreeConnect Admin', date: 'Oct 10, 2026' },
  { id: 'usr_4', name: 'Rohith kumar', email: 'rohithsh@gmail.com', phone: '+91 94473 11223', role: 'contractor', location: 'Wayanad, Kerala', status: 'Active', verification: 'Verified by TreeConnect Admin', date: 'Oct 10, 2026' },
  { id: 'usr_5', name: 'Arun K', email: 'arunbuyer@gmail.com', phone: '+91 98950 55432', role: 'buyer', location: 'Meenadom, Kerala', status: 'Active', verification: 'Verified by TreeConnect Admin', date: 'Oct 10, 2026' },
  { id: 'usr_6', name: 'TreeConnect Admin', email: 'admintc@gmail.com', phone: '+91 94470 00111', role: 'admin', location: 'Thiruvananthapuram, Kerala', status: 'Active', verification: 'Verified by TreeConnect Admin', date: 'Oct 01, 2026' }
];

export const attentionRequiredItems = [];

export const pendingContractorsList = [];

export const userManagementSummary = {
  landowners: 1,
  contractors: 3,
  buyers: 1,
  total: 5
};

export const operationsOverviewData = {
  harvestOperations: {
    pendingRequests: 0,
    contractorBidding: 0,
    surveyScheduled: 0,
    harvesting: 0,
    completed: 1
  },
  timberMarketplace: {
    activeListings: 1,
    buyerRequests: 1,
    pendingOrders: 0,
    completedSales: 0,
    transactionValue: '₹0'
  },
  transactionsSummary: {
    completedValue: '₹1.10 Lakhs',
    pendingValue: '₹0',
    failedCount: 0
  }
};

export const recentPlatformActivities = [
  {
    id: 'act_1',
    title: 'Harvest Operation Completed',
    description: 'Harvesting milestones 100% completed & settled for Harigovind D Nair.',
    timestamp: 'Recent',
    icon: 'Truck',
    color: 'emerald'
  },
  {
    id: 'act_2',
    title: 'Escrow Payment Verified',
    description: '₹1,10,000 contractor service fee verified via Razorpay.',
    timestamp: 'Recent',
    icon: 'DollarSign',
    color: 'emerald'
  },
  {
    id: 'act_3',
    title: 'Estate Registered',
    description: 'TreeConnect Property (11.0 Acres) registered in Kottayam district.',
    timestamp: 'Recent',
    icon: 'Trees',
    color: 'emerald'
  },
  {
    id: 'act_4',
    title: 'Contractor Verified',
    description: 'Akshay Krishan, Ram krishan and Rohith kumar verified by Admin.',
    timestamp: 'Recent',
    icon: 'ShieldCheck',
    color: 'emerald'
  }
];
