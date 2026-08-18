import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import { useAuth } from '../../context/AuthContext';

// Modular Property Components
import PropertyTypeSelector from '../../components/property/PropertyTypeSelector';
import PropertyInformationForm from '../../components/property/PropertyInformationForm';
import PropertyLocationForm from '../../components/property/PropertyLocationForm';
import PropertyMap from '../../components/property/PropertyMap';
import PropertyMediaUploader from '../../components/property/PropertyMediaUploader';
import PrivacyInformation from '../../components/property/PrivacyInformation';
import NextSteps from '../../components/property/NextSteps';
import RegistrationActions from '../../components/property/RegistrationActions';
import PropertyRegistrationSuccess from '../../components/property/PropertyRegistrationSuccess';

import { authService } from '../../services/authService';
import { locationService } from '../../services/locationService';

import { ArrowLeft } from 'lucide-react';

const RegisterProperty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { registerPropertyRecord } = useLandowner();

  // Form State initialized with details entered during registration
  const [formData, setFormData] = useState({
    propertyName: '',
    propertyType: 'Residential Property',
    ownerName: user?.fullName || user?.name || '',
    contactNumber: user?.phone || '',
    description: '',
    address: user?.address || '',
    state: user?.state || 'Kerala',
    district: user?.district || 'Kottayam',
    localBody: user?.localBody || '',
    village: user?.village || '',
    pinCode: user?.postalCode || user?.pinCode || '',
    latitude: 9.5916,
    longitude: 76.5222,
    totalArea: '',
    areaUnit: 'Acres',
    photos: [],
    videos: [],
    riskFactors: [],
    riskNotes: '',
    status: 'active'
  });

  // Pre-fill location & profile fields dynamically from DB when page loads or user changes
  React.useEffect(() => {
    let isMounted = true;

    const syncWithRegisteredProfile = async () => {
      let activeProfile = user;

      if (user?.email) {
        try {
          const freshProfile = await authService.getUserProfile(user.email);
          if (freshProfile && isMounted) {
            activeProfile = freshProfile;
          }
        } catch (err) {
          console.warn('Could not fetch fresh user profile from DB:', err);
        }
      }

      if (activeProfile && isMounted) {
        const resolvedPin = activeProfile.postalCode || activeProfile.pinCode || '';
        let resolvedLocalBody = activeProfile.localBody || activeProfile.panchayat || '';

        // If localBody is empty in database profile, auto-resolve Panchayat using PIN code
        if (!resolvedLocalBody && resolvedPin && resolvedPin.length === 6) {
          try {
            const pinLoc = await locationService.fetchLocationByPinCode(resolvedPin);
            if (pinLoc?.localBody) {
              resolvedLocalBody = pinLoc.localBody;
            }
          } catch (e) {
            console.warn('Error auto-resolving Panchayat from PIN:', e);
          }
        }

        if (isMounted) {
          setFormData(prev => ({
            ...prev,
            ownerName: activeProfile.fullName || activeProfile.name || prev.ownerName,
            contactNumber: activeProfile.phone || prev.contactNumber,
            address: activeProfile.address || prev.address,
            state: activeProfile.state || prev.state,
            district: activeProfile.district || prev.district,
            localBody: resolvedLocalBody || prev.localBody,
            village: activeProfile.village || prev.village,
            pinCode: resolvedPin || prev.pinCode
          }));
        }
      }
    };

    syncWithRegisteredProfile();
    return () => { isMounted = false; };
  }, [user]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [registeredResult, setRegisteredResult] = useState(null);

  // Form Field Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Coords Handler
  const handleCoordsChange = (lat, lng, locationDetails) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      ...(locationDetails?.district ? { district: locationDetails.district } : {}),
      ...(locationDetails?.state ? { state: locationDetails.state } : {}),
      ...(locationDetails?.village ? { village: locationDetails.village } : {}),
      ...(locationDetails?.postcode ? { pinCode: locationDetails.postcode } : {}),
      ...(locationDetails?.address && !prev.address ? { address: locationDetails.address } : {})
    }));
  };

  // Media Handler
  const handleMediaChange = ({ photos, videos }) => {
    setFormData(prev => ({ ...prev, photos, videos }));
  };

  // Frontend Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.propertyType) newErrors.propertyType = 'Property type selection is required';
    if (!formData.propertyName.trim()) newErrors.propertyName = 'Property name is required';
    if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
    if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.district.trim()) newErrors.district = 'District is required';
    if (!formData.address.trim()) newErrors.address = 'House / Plot address is required';
    if (!formData.pinCode.trim()) newErrors.pinCode = 'PIN Code is required';

    // Area required for Plantation and Private Land / Estate
    if (formData.propertyType !== 'Residential Property') {
      if (!formData.totalArea || Number(formData.totalArea) <= 0) {
        newErrors.totalArea = 'Property area is required for plantations & private land';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = Boolean(
    formData.propertyType &&
    formData.propertyName.trim() &&
    formData.ownerName.trim() &&
    formData.contactNumber.trim() &&
    formData.state.trim() &&
    formData.district.trim() &&
    formData.address.trim() &&
    formData.pinCode.trim() &&
    (formData.propertyType === 'Residential Property' || (formData.totalArea && Number(formData.totalArea) > 0))
  );

  // Submit Handler
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const created = await registerPropertyRecord({
        ...formData,
        totalArea: formData.totalArea ? Number(formData.totalArea) : null
      });

      setIsSubmitting(false);
      setRegisteredResult(created);
    } catch (err) {
      console.error("Error registering property:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="landowner-dashboard-page">
      <Navbar />
      <div className="landowner-dashboard-container">
        <Sidebar />

        <div className="landowner-dashboard-workspace">
          <main className="w-full flex flex-col gap-8">

            {/* If Registered, Show Success State */}
            {registeredResult ? (
              <PropertyRegistrationSuccess registeredProperty={registeredResult} />
            ) : (
              <>
                {/* 1. PAGE HEADER */}
                <section className="ld-card ld-hero-card">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <button
                      onClick={() => navigate('/landowner/dashboard')}
                      className="ld-pill hover:text-white cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Back to Dashboard
                    </button>

                    {/* Compact Workflow Progress Indicator */}
                    <span className="ld-hero-tag">
                      <span className="ld-dot ld-dot-green"></span> Workflow Progress: Step 1: Register Property
                    </span>
                  </div>

                  <div className="mt-3">
                    <h1 className="ld-hero-heading">Register Your Property</h1>
                    <p className="ld-hero-subtext mt-1">
                      Add the property where your trees are located to TreeConnect to start logging inventory &amp; connecting with contractors.
                    </p>
                  </div>
                </section>

                {/* FORM SECTIONS (Spacious 32px vertical flex gap between cards) */}
                <form onSubmit={(e) => e.preventDefault()} className="w-full flex flex-col gap-8">

                  {/* 1. PROPERTY TYPE */}
                  <PropertyTypeSelector
                    value={formData.propertyType}
                    onChange={(typeId) => setFormData(prev => ({ ...prev, propertyType: typeId }))}
                    error={errors.propertyType}
                  />

                  {/* 2. BASIC PROPERTY INFORMATION */}
                  <PropertyInformationForm
                    formData={formData}
                    onChange={handleInputChange}
                    propertyType={formData.propertyType}
                    errors={errors}
                  />

                  {/* 3. PROPERTY LOCATION */}
                  <PropertyLocationForm
                    formData={formData}
                    onChange={handleInputChange}
                    errors={errors}
                  />

                  {/* 4. GIS MAP LOCATION */}
                  <PropertyMap
                    onCoordsChange={handleCoordsChange}
                  />

                  {/* 5. PROPERTY PHOTOS & VIDEOS */}
                  <PropertyMediaUploader
                    photos={formData.photos}
                    videos={formData.videos}
                    onChange={handleMediaChange}
                  />

                  {/* 6. PRIVACY INFORMATION CARD */}
                  <PrivacyInformation />

                  {/* 7. WHAT HAPPENS NEXT SECTION */}
                  <NextSteps />

                  {/* 8. FINAL ACTION BAR */}
                  <RegistrationActions
                    onCancel={() => navigate('/landowner/dashboard')}
                    onSubmit={handleSubmit}
                    isValid={isFormValid}
                    isSubmitting={isSubmitting}
                  />

                </form>
              </>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default RegisterProperty;
