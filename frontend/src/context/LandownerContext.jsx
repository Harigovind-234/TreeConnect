import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import propertyService from '../services/propertyService';
import harvestService from '../services/harvestService';
import marketplaceService from '../services/marketplaceService';
import { useAuth } from './AuthContext';

const LandownerContext = createContext();

// Mock IDs to filter out so dummy data is completely removed
const MOCK_IDS = ['p_1', 'p_2', 'inv_1', 'inv_2', 'h_op_1', 'h_op_2', 'hr_1', 'tl_1', 'sp_1', 'sp_2', 'test_commercial_plot_001'];
const filterOutMockData = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(item => {
        if (!item) return false;
        if (MOCK_IDS.includes(item.id) || MOCK_IDS.includes(item._id) || MOCK_IDS.includes(item.property_id)) return false;
        const owner = String(item.ownerName || item.landownerName || item.userEmail || '').toLowerCase();
        const prop = String(item.propertyName || '').toLowerCase();
        if (owner.includes('landowner george') || prop.includes('rubber & teak estate parcel')) return false;
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

const filterByCurrentUser = (list, email) => {
    if (!Array.isArray(list) || !email) return [];
    const cleanEmail = email.toLowerCase().trim();
    return list.filter(item => {
        if (!item) return false;
        const itemEmail = String(
            item.userEmail ||
            item.owner_email ||
            item.landowner_email ||
            item.ownerEmail ||
            ''
        ).toLowerCase().trim();
        return itemEmail === cleanEmail;
    });
};

const DEFAULT_PROPERTIES = [];

const DEFAULT_TREE_INVENTORIES = [];

export const LandownerProvider = ({ children }) => {
    const auth = useAuth();
    let location = { pathname: '/' };
    try {
        location = useLocation();
    } catch (e) {
        // Fallback if rendered outside router in tests
    }
    const storedUser = (() => {
        try {
            const raw = localStorage.getItem('treeconnect_user');
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    })();
    const user = auth?.user || storedUser;
    const currentEmail = (user?.email || '').toLowerCase().trim();

    const [loadingProperties, setLoadingProperties] = useState(false);

    // 1. Initial Properties State
    const [properties, setProperties] = useState(() => {
        try {
            if (currentEmail) {
                const userKey = `treeconnect_properties_${currentEmail}`;
                const userStored = localStorage.getItem(userKey);
                if (userStored) {
                    return filterByCurrentUser(cleanPropertyImages(filterOutMockData(JSON.parse(userStored))), currentEmail);
                }
                const stored = localStorage.getItem('treeconnect_properties');
                if (stored !== null) {
                    const parsed = JSON.parse(stored);
                    return filterByCurrentUser(cleanPropertyImages(filterOutMockData(parsed)), currentEmail);
                }
            }
        } catch (e) {
            console.warn("Could not load properties from localStorage:", e);
        }
        return DEFAULT_PROPERTIES;
    });

    // 2. Initial Tree Inventories State
    const [inventories, setInventories] = useState(() => {
        try {
            if (currentEmail) {
                const userKey = `treeconnect_inventories_${currentEmail}`;
                const userStored = localStorage.getItem(userKey);
                if (userStored) {
                    const parsed = JSON.parse(userStored);
                    const cleaned = filterByCurrentUser(filterOutMockData(parsed), currentEmail);
                    return cleaned.map(inv => {
                        const cleanPhotos = (inv.photos || []).filter(p => typeof p === 'string' && !p.includes('unsplash.com'));
                        const cleanSpeciesList = (inv.speciesList || []).map(sp => ({
                            ...sp,
                            photos: (sp.photos || []).filter(p => typeof p === 'string' && !p.includes('unsplash.com'))
                        }));
                        return { ...inv, photos: cleanPhotos, speciesList: cleanSpeciesList };
                    });
                }
                const stored = localStorage.getItem('treeconnect_inventories');
                if (stored !== null) {
                    const parsed = JSON.parse(stored);
                    const cleaned = filterByCurrentUser(filterOutMockData(parsed), currentEmail);
                    return cleaned.map(inv => {
                        const cleanPhotos = (inv.photos || []).filter(p => typeof p === 'string' && !p.includes('unsplash.com'));
                        const cleanSpeciesList = (inv.speciesList || []).map(sp => ({
                            ...sp,
                            photos: (sp.photos || []).filter(p => typeof p === 'string' && !p.includes('unsplash.com'))
                        }));
                        return { ...inv, photos: cleanPhotos, speciesList: cleanSpeciesList };
                    });
                }
            }
        } catch (e) {
            console.warn("Could not load tree inventories from localStorage:", e);
        }
        return DEFAULT_TREE_INVENTORIES;
    });

    // 3. Initial Completed Harvesting Operations State
    const [completedHarvests, setCompletedHarvests] = useState(() => {
        try {
            if (currentEmail) {
                const userKey = `treeconnect_completed_harvests_${currentEmail}`;
                const userStored = localStorage.getItem(userKey);
                if (userStored) {
                    return filterByCurrentUser(filterOutMockData(JSON.parse(userStored)), currentEmail);
                }
                const stored = localStorage.getItem('treeconnect_completed_harvests');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    return filterByCurrentUser(filterOutMockData(parsed), currentEmail);
                }
            }
        } catch (e) {
            console.warn("Could not load completed harvests from localStorage:", e);
        }
        return [];
    });

    // 4. Initial Harvest Requests State
    const [harvestRequests, setHarvestRequests] = useState(() => {
        try {
            if (currentEmail) {
                const userKey = `treeconnect_harvest_requests_${currentEmail}`;
                const userStored = localStorage.getItem(userKey);
                if (userStored) {
                    return filterByCurrentUser(filterOutMockData(JSON.parse(userStored)), currentEmail);
                }
                const stored = localStorage.getItem('treeconnect_harvest_requests');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    return filterByCurrentUser(filterOutMockData(parsed), currentEmail);
                }
            }
        } catch (e) {
            console.warn("Could not load harvest requests from localStorage:", e);
        }
        return [];
    });

    // 5. Initial Timber Listings State
    const [timberListings, setTimberListings] = useState(() => {
        try {
            if (currentEmail) {
                const userKey = `treeconnect_timber_listings_${currentEmail}`;
                const userStored = localStorage.getItem(userKey);
                if (userStored) {
                    return filterByCurrentUser(filterOutMockData(JSON.parse(userStored)), currentEmail);
                }
                const stored = localStorage.getItem('treeconnect_timber_listings');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    return filterByCurrentUser(filterOutMockData(parsed), currentEmail);
                }
            }
        } catch (e) {
            console.warn("Could not load timber listings from localStorage:", e);
        }
        return [];
    });

    // Sync properties with backend database whenever user auth state or email changes
    const fetchDBProperties = useCallback(async () => {
        if (!currentEmail) {
            setProperties([]);
            return;
        }
        setLoadingProperties(true);
        try {
            const data = await propertyService.getProperties({ userEmail: currentEmail });
            if (data && Array.isArray(data.properties)) {
                const cleanDBProps = filterByCurrentUser(cleanPropertyImages(filterOutMockData(data.properties)), currentEmail);
                setProperties(cleanDBProps);
                try {
                    localStorage.setItem(`treeconnect_properties_${currentEmail}`, JSON.stringify(cleanDBProps));
                    if (cleanDBProps.length > 0) {
                        localStorage.setItem('treeconnect_properties', JSON.stringify(cleanDBProps));
                    }
                } catch (e) {
                    console.warn("Could not cache properties to localStorage due to size limit, using React state.", e);
                }
            } else {
                setProperties([]);
            }
        } catch (err) {
            console.warn("Could not load properties from backend database:", err);
            try {
                const storedProps = localStorage.getItem(`treeconnect_properties_${currentEmail}`) || localStorage.getItem('treeconnect_properties');
                if (storedProps) {
                    const cachedProps = filterByCurrentUser(cleanPropertyImages(filterOutMockData(JSON.parse(storedProps))), currentEmail);
                    if (cachedProps.length > 0) setProperties(cachedProps);
                }
            } catch (e) {}
        } finally {
            setLoadingProperties(false);
        }
    }, [currentEmail]);

    // Sync harvest requests with backend database
    const fetchDBHarvestRequests = useCallback(async () => {
        if (!currentEmail) {
            setHarvestRequests([]);
            return;
        }
        try {
            const data = await harvestService.getHarvestRequests({ userEmail: currentEmail });
            if (data && Array.isArray(data.harvest_requests)) {
                const cleanRequests = filterByCurrentUser(filterOutMockData(data.harvest_requests), currentEmail);
                setHarvestRequests(cleanRequests);
                try {
                    localStorage.setItem(`treeconnect_harvest_requests_${currentEmail}`, JSON.stringify(cleanRequests));
                    if (cleanRequests.length > 0) {
                        localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(cleanRequests));
                    }
                } catch (e) { }
            } else {
                setHarvestRequests([]);
            }
        } catch (err) {
            console.warn("Could not load harvest requests from backend database:", err);
            try {
                const storedReqs = localStorage.getItem(`treeconnect_harvest_requests_${currentEmail}`) || localStorage.getItem('treeconnect_harvest_requests');
                if (storedReqs) {
                    const cachedReqs = filterByCurrentUser(filterOutMockData(JSON.parse(storedReqs)), currentEmail);
                    if (cachedReqs.length > 0) setHarvestRequests(cachedReqs);
                }
            } catch (e) {}
        }
    }, [currentEmail]);

    // Sync tree inventories with backend database
    const fetchDBInventories = useCallback(async () => {
        if (!currentEmail) {
            setInventories([]);
            return;
        }
        try {
            const data = await propertyService.getTreeInventories({ userEmail: currentEmail });
            if (data && Array.isArray(data.inventories)) {
                const cleanDBInvs = filterByCurrentUser(filterOutMockData(data.inventories), currentEmail);
                setInventories(cleanDBInvs);
                try {
                    localStorage.setItem(`treeconnect_inventories_${currentEmail}`, JSON.stringify(cleanDBInvs));
                    if (cleanDBInvs.length > 0) {
                        localStorage.setItem('treeconnect_inventories', JSON.stringify(cleanDBInvs));
                    }
                } catch (e) { }
            } else {
                setInventories([]);
            }
        } catch (err) {
            console.warn("Could not load tree inventories from backend database:", err);
            try {
                const storedInvs = localStorage.getItem(`treeconnect_inventories_${currentEmail}`) || localStorage.getItem('treeconnect_inventories');
                if (storedInvs) {
                    const cachedInvs = filterByCurrentUser(filterOutMockData(JSON.parse(storedInvs)), currentEmail);
                    if (cachedInvs.length > 0) setInventories(cachedInvs);
                }
            } catch (e) {}
        }
    }, [currentEmail]);

    // Immediate cleanup & refresh when logged-in landowner account changes
    useEffect(() => {
        if (!currentEmail) {
            setProperties([]);
            setHarvestRequests([]);
            setInventories([]);
            setCompletedHarvests([]);
            setTimberListings([]);
            return;
        }

        // Restore any existing cached items for the current user immediately
        try {
            const storedProps = localStorage.getItem(`treeconnect_properties_${currentEmail}`) || localStorage.getItem('treeconnect_properties');
            if (storedProps) {
                const cachedProps = filterByCurrentUser(cleanPropertyImages(filterOutMockData(JSON.parse(storedProps))), currentEmail);
                setProperties(cachedProps);
            }
        } catch (e) {}

        try {
            const storedInvs = localStorage.getItem(`treeconnect_inventories_${currentEmail}`) || localStorage.getItem('treeconnect_inventories');
            if (storedInvs) {
                const cachedInvs = filterByCurrentUser(filterOutMockData(JSON.parse(storedInvs)), currentEmail);
                setInventories(cachedInvs);
            }
        } catch (e) {}

        // Only query remote database if user is on a route requiring landowner data.
        // Public pages like Home ('/'), Login ('/login'), etc. load INSTANTLY with 0 network latency.
        const isLandownerRoute = Boolean(location?.pathname?.startsWith('/landowner'));
        if (isLandownerRoute) {
            fetchDBProperties();
            fetchDBHarvestRequests();
            fetchDBInventories();
        }
    }, [currentEmail, Boolean(location?.pathname?.startsWith('/landowner')), fetchDBProperties, fetchDBHarvestRequests, fetchDBInventories]);

    // Persist properties to localStorage whenever updated
    useEffect(() => {
        if (!currentEmail) return;
        try {
            localStorage.setItem(`treeconnect_properties_${currentEmail}`, JSON.stringify(properties));
            if (properties.length > 0) {
                localStorage.setItem('treeconnect_properties', JSON.stringify(properties));
            }
        } catch (e) { }
    }, [properties, currentEmail]);

    // Persist inventories to localStorage whenever updated
    useEffect(() => {
        if (!currentEmail) return;
        try {
            localStorage.setItem(`treeconnect_inventories_${currentEmail}`, JSON.stringify(inventories));
            if (inventories.length > 0) {
                localStorage.setItem('treeconnect_inventories', JSON.stringify(inventories));
            }
        } catch (e) { }
    }, [inventories, currentEmail]);

    // Persist completed harvest operations
    useEffect(() => {
        if (!currentEmail) return;
        try {
            localStorage.setItem(`treeconnect_completed_harvests_${currentEmail}`, JSON.stringify(completedHarvests));
            if (completedHarvests.length > 0) {
                localStorage.setItem('treeconnect_completed_harvests', JSON.stringify(completedHarvests));
            }
        } catch (e) { }
    }, [completedHarvests, currentEmail]);

    // Persist harvest requests
    useEffect(() => {
        if (!currentEmail) return;
        try {
            localStorage.setItem(`treeconnect_harvest_requests_${currentEmail}`, JSON.stringify(harvestRequests));
            if (harvestRequests.length > 0) {
                localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(harvestRequests));
            }
        } catch (e) { }
    }, [harvestRequests, currentEmail]);

    // Persist timber listings
    useEffect(() => {
        if (!currentEmail) return;
        try {
            localStorage.setItem(`treeconnect_timber_listings_${currentEmail}`, JSON.stringify(timberListings));
            if (timberListings.length > 0) {
                const globalRaw = localStorage.getItem('treeconnect_timber_listings');
                const globalList = globalRaw ? JSON.parse(globalRaw) : [];
                const otherListings = Array.isArray(globalList)
                    ? globalList.filter(l => (l.sellerEmail || '').toLowerCase().trim() !== currentEmail)
                    : [];
                const merged = [...timberListings, ...otherListings];
                localStorage.setItem('treeconnect_timber_listings', JSON.stringify(merged));
            }
        } catch (e) { }
    }, [timberListings, currentEmail]);

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
            if (err && err.message) {
                throw err;
            }
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
            id: newListing.id || `tl_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            status: newListing.status || 'Published',
            createdAt: newListing.createdAt || new Date().toISOString().split('T')[0],
            images: newListing.images || []
        };
        try {
            marketplaceService.saveListing(createdListing, activeUser);
        } catch (_) {}
        setTimberListings(prev => [createdListing, ...prev.filter(l => l.id !== createdListing.id)]);
        return createdListing;
    };

    const updateListingStatus = (id, newStatus) => {
        try {
            marketplaceService.updateListingStatus(id, newStatus);
        } catch (_) {}
        setTimberListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
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

        const idStr = String(id || '');
        const idCanon = idStr.length >= 8 ? idStr.substring(0, 8).toLowerCase() : idStr.toLowerCase();

        setHarvestRequests(prev => {
            const updated = prev.filter(r => {
                const rId = String(r.id || r._id || '');
                const rCanon = rId.length >= 8 ? rId.substring(0, 8).toLowerCase() : rId.toLowerCase();
                return rId !== idStr && rCanon !== idCanon;
            });
            try {
                localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
            } catch (e) { }
            try {
                window.dispatchEvent(new Event('treeconnect_harvest_requests_updated'));
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

    const deleteInventory = async (inventoryId, propertyId) => {
        try {
            if (inventoryId && !String(inventoryId).startsWith('sp_')) {
                await propertyService.deleteTreeInventory(inventoryId);
            }
        } catch (err) {
            console.warn("Could not delete inventory from DB API:", err);
        }

        setInventories(prev => {
            const updated = prev.filter(inv => {
                if (!inv) return false;
                if (inv.id === inventoryId || inv._id === inventoryId) return false;
                if (String(inv.id) === String(inventoryId) || String(inv._id) === String(inventoryId)) return false;
                return true;
            });
            try {
                localStorage.setItem('treeconnect_inventories', JSON.stringify(updated));
            } catch (e) { }

            if (propertyId) {
                const remainingPropInvs = updated.filter(i => i && (String(i.propertyId) === String(propertyId) || String(i.property_id) === String(propertyId)));
                let remainingTreeCount = 0;
                let remainingMainSpecies = '';
                remainingPropInvs.forEach(i => {
                    (i.speciesList || []).forEach(sp => {
                        remainingTreeCount += Number(sp.numberOfTrees || sp.count || 0);
                        if (!remainingMainSpecies) remainingMainSpecies = sp.treeSpecies || sp.species || '';
                    });
                });

                setProperties(prevProps => {
                    const updatedProps = prevProps.map(p => {
                        const isMatch = p.id === propertyId || p._id === propertyId || String(p.id) === String(propertyId) || String(p._id) === String(propertyId);
                        if (isMatch) {
                            const updatedP = {
                                ...p,
                                approxTreesCount: remainingTreeCount,
                                mainSpecies: remainingMainSpecies || (remainingTreeCount === 0 ? '' : p.mainSpecies),
                                treeInventories: remainingPropInvs,
                                inventories: remainingPropInvs,
                                inventoryCleared: remainingTreeCount === 0
                            };
                            try {
                                propertyService.updateProperty(p.id || p._id, {
                                    approxTreesCount: remainingTreeCount,
                                    mainSpecies: remainingMainSpecies || (remainingTreeCount === 0 ? '' : p.mainSpecies),
                                    treeInventories: remainingPropInvs,
                                    inventories: remainingPropInvs
                                });
                            } catch (e) { }
                            return updatedP;
                        }
                        return p;
                    });
                    try {
                        localStorage.setItem('treeconnect_properties', JSON.stringify(updatedProps));
                    } catch (e) { }
                    return updatedProps;
                });
            }

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
                deleteInventory,
                deleteTreeInventory: deleteInventory,
                addHarvestRequest,
                deleteHarvestRequest,
                assignContractorToRequest,
                addTimberListing,
                updateListingStatus,
                setHarvestRequests
            }}
        >
            {children}
        </LandownerContext.Provider>
    );
};

export const useLandowner = () => useContext(LandownerContext);

