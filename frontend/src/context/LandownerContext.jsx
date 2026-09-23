import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import propertyService from '../services/propertyService';
import harvestService from '../services/harvestService';
import { useAuth } from './AuthContext';

const LandownerContext = createContext();

// Mock IDs to filter out so dummy data is completely removed
const MOCK_IDS = ['p_1', 'p_2', 'inv_1', 'inv_2', 'h_op_1', 'h_op_2', 'hr_1', 'tl_1', 'sp_1', 'sp_2'];
const filterOutMockData = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(item => {
        if (!item) return false;
        if (MOCK_IDS.includes(item.id) || MOCK_IDS.includes(item._id)) return false;
        return true;
    });
};

const cleanPropertyImages = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(item => {
        if (!item) return item;
        const photos = Array.isArray(item.photos)
            ? item.photos.filter(p => typeof p === 'string' && !p.includes('unsplash.com'))
            : [];
        const image = (item.image && typeof item.image === 'string' && !item.image.includes('unsplash.com'))
            ? item.image
            : (photos.length > 0 ? photos[0] : null);
        return {
            ...item,
            photos,
            image
        };
    });
};

const DEFAULT_PROPERTIES = [];

const DEFAULT_TREE_INVENTORIES = [];

export const LandownerProvider = ({ children }) => {
    const auth = useAuth();
    const user = auth?.user;

    const [loadingProperties, setLoadingProperties] = useState(false);

    // 1. Initial Properties State
    const [properties, setProperties] = useState(() => {
        try {
            const stored = localStorage.getItem('treeconnect_properties');
            if (stored !== null) {
                const parsed = JSON.parse(stored);
                return cleanPropertyImages(filterOutMockData(parsed));
            }
        } catch (e) {
            console.warn("Could not load properties from localStorage:", e);
        }
        return DEFAULT_PROPERTIES;
    });

    // 2. Initial Tree Inventories State
    const [inventories, setInventories] = useState(() => {
        try {
            const stored = localStorage.getItem('treeconnect_inventories');
            if (stored !== null) {
                const parsed = JSON.parse(stored);
                const cleaned = filterOutMockData(parsed);
                return cleaned.map(inv => {
                    const cleanPhotos = (inv.photos || []).filter(p => typeof p === 'string' && !p.includes('unsplash.com'));
                    const cleanSpeciesList = (inv.speciesList || []).map(sp => ({
                        ...sp,
                        photos: (sp.photos || []).filter(p => typeof p === 'string' && !p.includes('unsplash.com'))
                    }));
                    return { ...inv, photos: cleanPhotos, speciesList: cleanSpeciesList };
                });
            }
        } catch (e) {
            console.warn("Could not load tree inventories from localStorage:", e);
        }
        return DEFAULT_TREE_INVENTORIES;
    });

    // 3. Initial Completed Harvesting Operations State
    const [completedHarvests, setCompletedHarvests] = useState(() => {
        try {
            const stored = localStorage.getItem('treeconnect_completed_harvests');
            if (stored) {
                const parsed = JSON.parse(stored);
                return filterOutMockData(parsed);
            }
        } catch (e) {
            console.warn("Could not load completed harvests from localStorage:", e);
        }
        return [];
    });

    // 4. Initial Harvest Requests State
    const [harvestRequests, setHarvestRequests] = useState(() => {
        try {
            const stored = localStorage.getItem('treeconnect_harvest_requests');
            if (stored) {
                const parsed = JSON.parse(stored);
                return filterOutMockData(parsed);
            }
        } catch (e) {
            console.warn("Could not load harvest requests from localStorage:", e);
        }
        return [];
    });

    // 5. Initial Timber Listings State
    const [timberListings, setTimberListings] = useState(() => {
        try {
            const stored = localStorage.getItem('treeconnect_timber_listings');
            if (stored) {
                const parsed = JSON.parse(stored);
                return filterOutMockData(parsed);
            }
        } catch (e) {
            console.warn("Could not load timber listings from localStorage:", e);
        }
        return [];
    });

    // Sync properties with backend database whenever user auth state or email changes
    const fetchDBProperties = useCallback(async () => {
        setLoadingProperties(true);
        try {
            const storedUserStr = localStorage.getItem('treeconnect_user');
            const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
            const userEmail = user?.email || storedUser?.email || '';

            const data = await propertyService.getProperties({ all_records: true });
            if (data && Array.isArray(data.properties)) {
                const cleanDBProps = cleanPropertyImages(filterOutMockData(data.properties));
                if (cleanDBProps.length > 0) {
                    setProperties(cleanDBProps);
                    try {
                        localStorage.setItem('treeconnect_properties', JSON.stringify(cleanDBProps));
                    } catch (e) {
                        console.warn("Could not cache properties to localStorage due to size limit, using React state.", e);
                    }
                }
            }
        } catch (err) {
            console.warn("Could not load properties from backend database:", err);
        } finally {
            setLoadingProperties(false);
        }
    }, [user?.email]);

    // Sync harvest requests with backend database
    const fetchDBHarvestRequests = useCallback(async () => {
        try {
            const storedUserStr = localStorage.getItem('treeconnect_user');
            const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
            const userEmail = user?.email || storedUser?.email || '';

            const data = await harvestService.getHarvestRequests(userEmail ? { userEmail } : {});
            if (data && Array.isArray(data.harvest_requests)) {
                const cleanRequests = filterOutMockData(data.harvest_requests);
                setHarvestRequests(cleanRequests);
                try {
                    localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(cleanRequests));
                } catch (e) { }
            }
        } catch (err) {
            console.warn("Could not load harvest requests from backend database:", err);
        }
    }, [user?.email]);

    // Sync tree inventories with backend database
    const fetchDBInventories = useCallback(async () => {
        try {
            const data = await propertyService.getTreeInventories({ all_records: true });
            if (data && Array.isArray(data.inventories)) {
                const cleanDBInvs = filterOutMockData(data.inventories);
                if (cleanDBInvs.length > 0) {
                    setInventories(cleanDBInvs);
                    try {
                        localStorage.setItem('treeconnect_inventories', JSON.stringify(cleanDBInvs));
                    } catch (e) { }
                }
            }
        } catch (err) {
            console.warn("Could not load tree inventories from backend database:", err);
        }
    }, []);

    useEffect(() => {
        fetchDBProperties();
        fetchDBHarvestRequests();
        fetchDBInventories();
    }, [fetchDBProperties, fetchDBHarvestRequests, fetchDBInventories, user?.email]);

    // Persist properties to localStorage whenever updated
    useEffect(() => {
        try {
            localStorage.setItem('treeconnect_properties', JSON.stringify(properties));
        } catch (e) { }
    }, [properties]);

    // Persist inventories to localStorage whenever updated
    useEffect(() => {
        try {
            localStorage.setItem('treeconnect_inventories', JSON.stringify(inventories));
        } catch (e) { }
    }, [inventories]);

    // Persist completed harvest operations
    useEffect(() => {
        try {
            localStorage.setItem('treeconnect_completed_harvests', JSON.stringify(completedHarvests));
        } catch (e) { }
    }, [completedHarvests]);

    // Persist harvest requests
    useEffect(() => {
        try {
            localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(harvestRequests));
        } catch (e) { }
    }, [harvestRequests]);

    // Persist timber listings
    useEffect(() => {
        try {
            localStorage.setItem('treeconnect_timber_listings', JSON.stringify(timberListings));
        } catch (e) { }
    }, [timberListings]);

    // Handlers
    const addProperty = async (newProp) => {
        const photosList = newProp.photos || [];
        const videosList = newProp.videos || [];

        let savedProp;
        try {
            // Save to MongoDB database via propertyService
            const res = await propertyService.registerProperty({
                ...newProp,
                photos: photosList,
                videos: videosList
            });

            savedProp = res.property || {
                ...newProp,
                id: `p_${Date.now()}`,
                _id: `p_${Date.now()}`,
                status: 'Active Estate',
                createdAt: new Date().toISOString().split('T')[0],
                photos: photosList,
                videos: videosList
            };
        } catch (err) {
            console.error("Error storing property in database:", err);
            savedProp = {
                ...newProp,
                id: `p_${Date.now()}`,
                _id: `p_${Date.now()}`,
                status: 'Active Estate',
                createdAt: new Date().toISOString().split('T')[0],
                photos: photosList,
                videos: videosList
            };
        }

        setProperties(prev => {
            const updated = [savedProp, ...prev.filter(p => p.id !== savedProp.id && p._id !== savedProp._id)];
            try {
                localStorage.setItem('treeconnect_properties', JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });

        return savedProp;
    };

    const addInventory = async (newInv) => {
        const storedUserStr = localStorage.getItem('treeconnect_user');
        const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
        const userEmail = user?.email || storedUser?.email || '';

        let createdInv;
        try {
            const res = await propertyService.addTreeInventory({
                ...newInv,
                userEmail: newInv.userEmail || userEmail
            });
            createdInv = res.inventory || {
                ...newInv,
                id: `inv_${Date.now()}`,
                _id: `inv_${Date.now()}`,
                updatedAt: new Date().toISOString().split('T')[0]
            };
        } catch (err) {
            console.error("Error saving tree inventory to backend database:", err);
            createdInv = {
                ...newInv,
                id: `inv_${Date.now()}`,
                _id: `inv_${Date.now()}`,
                updatedAt: new Date().toISOString().split('T')[0]
            };
        }

        setInventories(prev => {
            const updatedInventories = [createdInv, ...prev.filter(inv => inv.id !== createdInv.id && inv._id !== createdInv._id)];
            try {
                localStorage.setItem('treeconnect_inventories', JSON.stringify(updatedInventories));
            } catch (e) {
                console.warn("Failed to persist tree inventories to localStorage:", e);
            }
            return updatedInventories;
        });

        // Calculate tree count and primary species to update property summary state & DB
        let addedTreesCount = 0;
        let primarySpecies = '';
        if (newInv.speciesList && newInv.speciesList.length > 0) {
            primarySpecies = newInv.speciesList[0].treeSpecies || newInv.speciesList[0].species || 'Teak';
            newInv.speciesList.forEach(sp => {
                addedTreesCount += Number(sp.numberOfTrees || sp.count || 0);
            });
        }

        const targetPropId = newInv.propertyId;
        const matchingProp = properties.find(p => p.id === targetPropId || p._id === targetPropId || String(p.id) === String(targetPropId) || String(p._id) === String(targetPropId));
        if (matchingProp) {
            const currentCount = typeof matchingProp.approxTreesCount === 'number'
                ? matchingProp.approxTreesCount
                : parseInt(matchingProp.approxTreesCount) || 0;
            const newTotalCount = currentCount + addedTreesCount;
            const updatedMainSpecies = primarySpecies || matchingProp.mainSpecies || 'Timber Trees';

            try {
                await propertyService.updateProperty(matchingProp.id || matchingProp._id, {
                    approxTreesCount: newTotalCount,
                    mainSpecies: updatedMainSpecies
                });
            } catch (err) {
                console.warn("Could not update property tree count in DB:", err);
            }
        }

        // Update target property summary fields in properties state
        setProperties(prevProps => {
            const updatedProps = prevProps.map(p => {
                const isMatch = p.id === newInv.propertyId ||
                    p._id === newInv.propertyId ||
                    String(p.id) === String(newInv.propertyId) ||
                    String(p._id) === String(newInv.propertyId);
                if (isMatch) {
                    const currentCount = typeof p.approxTreesCount === 'number'
                        ? p.approxTreesCount
                        : parseInt(p.approxTreesCount) || 0;
                    return {
                        ...p,
                        mainSpecies: primarySpecies || p.mainSpecies || 'Timber Trees',
                        approxTreesCount: currentCount + addedTreesCount
                    };
                }
                return p;
            });
            try {
                localStorage.setItem('treeconnect_properties', JSON.stringify(updatedProps));
            } catch (e) { }
            return updatedProps;
        });

        return createdInv;
    };

    const addHarvestRequest = async (newReq) => {
        let savedReq;
        try {
            const res = await harvestService.createHarvestRequest({
                ...newReq,
                userEmail: newReq.userEmail || user?.email || ''
            });
            savedReq = res.harvest_request || {
                ...newReq,
                id: `hr_${Date.now()}`,
                _id: `hr_${Date.now()}`,
                status: newReq.assigned_contractor_id ? 'CONTRACTOR_ASSIGNED' : 'PENDING',
                createdAt: new Date().toISOString().split('T')[0]
            };
        } catch (err) {
            console.error("Error storing harvest request in DB:", err);
            savedReq = {
                ...newReq,
                id: `hr_${Date.now()}`,
                _id: `hr_${Date.now()}`,
                status: newReq.assigned_contractor_id ? 'CONTRACTOR_ASSIGNED' : 'PENDING',
                createdAt: new Date().toISOString().split('T')[0]
            };
        }

        setHarvestRequests(prev => {
            const updated = [savedReq, ...prev.filter(r => r.id !== savedReq.id && r._id !== savedReq._id)];
            try {
                localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });

        return savedReq;
    };

    const assignContractorToRequest = async (requestId, contractorData) => {
        const updatedAssignedName = contractorData.contractor_name || contractorData.companyName || contractorData.name || 'Assigned Contractor';
        const updatedAssignedEmail = contractorData.contractor_email || contractorData.email || '';
        const updatedAssignedId = contractorData.contractor_id || contractorData.id || contractorData._id || '';

        // Optimistically update local React state & localStorage
        setHarvestRequests(prev => {
            const updated = prev.map(req => {
                const isMatch = req.id === requestId || req._id === requestId || String(req.id) === String(requestId) || String(req._id) === String(requestId);
                if (isMatch) {
                    return {
                        ...req,
                        assigned_contractor_id: updatedAssignedId,
                        assigned_contractor_name: updatedAssignedName,
                        assigned_contractor_email: updatedAssignedEmail,
                        status: 'CONTRACTOR_ASSIGNED',
                        updatedAt: new Date().toISOString()
                    };
                }
                return req;
            });
            try {
                localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });

        try {
            await harvestService.assignContractor(requestId, {
                contractor_id: updatedAssignedId,
                contractor_name: updatedAssignedName,
                contractor_email: updatedAssignedEmail
            });
            await fetchDBHarvestRequests();
        } catch (err) {
            console.error("Error assigning contractor to harvest request on backend:", err);
        }
    };

    const addTimberListing = (newListing) => {
        const createdListing = {
            ...newListing,
            id: `tl_${Date.now()}`,
            status: newListing.status || 'Published',
            createdAt: new Date().toISOString().split('T')[0],
            images: newListing.images || []
        };
        setTimberListings(prev => {
            const updated = [createdListing, ...prev];
            try {
                localStorage.setItem('treeconnect_timber_listings', JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });
        return createdListing;
    };

    const updateListingStatus = (id, newStatus) => {
        setTimberListings(prev => {
            const updated = prev.map(l => l.id === id ? { ...l, status: newStatus } : l);
            try {
                localStorage.setItem('treeconnect_timber_listings', JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });
    };

    const updateProperty = async (id, updatedFields) => {
        try {
            await propertyService.updateProperty(id, updatedFields);
        } catch (err) {
            console.error("Error updating property in DB:", err);
        }

        setProperties(prev => {
            const updated = prev.map(p => {
                if (p.id === id || p._id === id) {
                    const photosList = updatedFields.photos || p.photos || [];
                    return {
                        ...p,
                        ...updatedFields,
                        image: photosList.length > 0 ? photosList[0] : (updatedFields.image || p.image)
                    };
                }
                return p;
            });
            try {
                localStorage.setItem('treeconnect_properties', JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });
    };

    const deleteHarvestRequest = async (id) => {
        try {
            await harvestService.deleteHarvestRequest(id);
        } catch (err) {
            console.error("Error deleting harvest request from DB:", err);
        }

        setHarvestRequests(prev => {
            const updated = prev.filter(r => r.id !== id && r._id !== id);
            try {
                localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });
    };

    const deleteProperty = async (id) => {
        try {
            await propertyService.deleteProperty(id);
        } catch (err) {
            console.error("Error deleting property from DB:", err);
        }

        setProperties(prev => {
            const updated = prev.filter(p => p.id !== id && p._id !== id);
            try {
                localStorage.setItem('treeconnect_properties', JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });

        // Also clean up inventories for deleted property
        setInventories(prev => {
            const updated = prev.filter(inv => inv.propertyId !== id && String(inv.propertyId) !== String(id) && inv.property_id !== id && String(inv.property_id) !== String(id));
            try {
                localStorage.setItem('treeconnect_inventories', JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });

        // Also clean up harvest requests for deleted property
        setHarvestRequests(prev => {
            const updated = prev.filter(hr => hr.property_id !== id && String(hr.property_id) !== String(id) && hr.propertyId !== id && String(hr.propertyId) !== String(id));
            try {
                localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });
    };

    return (
        <LandownerContext.Provider
            value={{
                properties,
                inventories,
                treeInventories: inventories,
                completedHarvests,
                harvestRequests,
                timberListings,
                loadingProperties,
                refreshProperties: fetchDBProperties,
                refreshHarvestRequests: fetchDBHarvestRequests,
                addProperty,
                registerPropertyRecord: addProperty,
                updateProperty,
                deleteProperty,
                addInventory,
                addHarvestRequest,
                deleteHarvestRequest,
                assignContractorToRequest,
                addTimberListing,
                updateListingStatus
            }}
        >
            {children}
        </LandownerContext.Provider>
    );
};

export const useLandowner = () => useContext(LandownerContext);

