// Fleet & Machinery Storage Utility for TreeConnect Contractor Portal

// Legacy demo machinery items that should be purged in favor of real user values
const LEGACY_DEMO_NAMES = [
  'John Deere 843L-II Feller Buncher',
  'Caterpillar 548 Forest Machine',
  'Ashok Leyland 10-Wheeler Timber Hauler',
  'Stihl MS 661 C-M Magnum Chainsaw Rig'
];

const LEGACY_DEMO_IDS = ['eq_1', 'eq_2', 'eq_3', 'eq_4'];

export const DEFAULT_FLEET_DATA = [];

export const getStoredFleet = () => {
  try {
    const raw = localStorage.getItem('treeconnect_fleet_equipment');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out legacy fake demo machines
        const realItems = parsed.filter(item => {
          const name = item.name || item.model || '';
          const id = item.id || '';
          const isLegacyDemo = LEGACY_DEMO_NAMES.includes(name) || LEGACY_DEMO_IDS.includes(id);
          return !isLegacyDemo;
        });

        // If legacy items were purged, save the cleaned array back
        if (realItems.length !== parsed.length) {
          localStorage.setItem('treeconnect_fleet_equipment', JSON.stringify(realItems));
        }
        return realItems;
      }
    }
  } catch (e) {
    console.warn('Error reading fleet from localStorage:', e);
  }
  return [];
};

export const saveStoredFleet = (list) => {
  try {
    const safeList = Array.isArray(list) ? list : [];
    localStorage.setItem('treeconnect_fleet_equipment', JSON.stringify(safeList));
    // Dispatch custom event so any open component updates immediately
    window.dispatchEvent(new CustomEvent('treeconnect_fleet_updated', { detail: safeList }));
    return safeList;
  } catch (e) {
    console.warn('Error saving fleet to localStorage:', e);
    return list;
  }
};

