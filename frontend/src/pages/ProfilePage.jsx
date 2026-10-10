import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { ShieldCheck, User, Mail, Briefcase, MapPin, Calendar, FileText, Phone, Upload, CheckCircle2 } from 'lucide-react';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(user || {});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.email) {
      authService.getUserProfile(user.email).then(data => {
        if (data) setProfile(data);
      });
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      // Mock upload delay
      setTimeout(() => {
        const fakeAvatarUrl = URL.createObjectURL(file);
        const updatedProfile = { ...profile, avatar: fakeAvatarUrl };
        setProfile(updatedProfile);
        
        // Mock updating local storage for persistence
        const stored = localStorage.getItem('treeconnect_registered_users');
        if (stored) {
          const users = JSON.parse(stored);
          const emailKey = profile.email?.trim().toLowerCase();
          if (users[emailKey]) {
             users[emailKey].avatar = fakeAvatarUrl;
             localStorage.setItem('treeconnect_registered_users', JSON.stringify(users));
          }
        }
        
        // Update user context (if you have a setUser in context, otherwise this is just local state)
        // setUser && setUser(updatedProfile);
        
        setIsUploading(false);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B08] text-[#F5F7F5] selection:bg-[#43C58A]/30 selection:text-white pb-12">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col gap-6">
          
          {/* Header Section */}
          <div className="bg-[#101C14] border border-[#263B2E] rounded-[24px] p-6 sm:p-10 shadow-lg flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#43C58A]/10 to-transparent"></div>
            
            <div className="relative group shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[#101C14] shadow-2xl overflow-hidden bg-[#0C130F] flex items-center justify-center relative z-10 transition-transform group-hover:scale-[1.02]">
                <img 
                  src={profile?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=treeconnect'} 
                  alt={profile?.name} 
                  className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100'}`}
                />
                
                {/* Upload Overlay */}
                <div 
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={24} className="text-[#F5F7F5] mb-2" />
                  <span className="text-xs font-bold text-[#F5F7F5] px-2 text-center">Change Photo</span>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
              
              {profile?.isVerified !== false && profile?.status !== 'Pending' && (
                <div className="absolute bottom-1 right-2 sm:right-3 w-10 h-10 bg-[#43C58A] rounded-full border-4 border-[#101C14] flex items-center justify-center z-30 text-[#070B08] shadow-lg" title="Verified User">
                  <ShieldCheck size={20} />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center md:items-start flex-1 z-10 pt-2 sm:pt-6 w-full text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#F5F7F5]">{profile?.name}</h1>
              <div className="flex flex-col sm:flex-row items-center md:items-start gap-2 sm:gap-6 mt-2">
                <p className="text-[#9CAAA1] font-medium flex items-center gap-2 text-sm sm:text-base">
                  <Mail size={16} /> {profile?.email}
                </p>
                {profile?.phone && (
                  <p className="text-[#9CAAA1] font-medium flex items-center gap-2 text-sm sm:text-base">
                    <Phone size={16} /> {profile?.phone}
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                <span className="px-4 py-1.5 rounded-full bg-[#43C58A]/10 border border-[#43C58A]/30 text-[#43C58A] text-xs font-bold uppercase tracking-wider">
                  {profile?.role === 'landowner' ? 'Landowner' : 
                   profile?.role === 'contractor' ? 'Contractor' : 
                   profile?.role === 'buyer' ? 'Buyer' : profile?.role}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-[#263B2E] text-[#9CAAA1] text-xs font-bold flex items-center gap-2">
                  <Calendar size={14} /> Registered Member
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Verification Status Card */}
            <div className="lg:col-span-1 bg-[#101C14] border border-[#263B2E] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 h-full">
              <div className="flex items-center gap-3 pb-4 border-b border-[#263B2E]">
                <ShieldCheck className="text-[#43C58A]" size={24} />
                <h2 className="text-xl font-bold text-[#F5F7F5]">Verification</h2>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="bg-[#070B08] border border-[#263B2E] rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden text-center">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#43C58A]"></div>
                  
                  <div className="w-16 h-16 rounded-full bg-[#43C58A]/10 border border-[#43C58A]/20 flex items-center justify-center mx-auto text-[#43C58A] mb-2">
                    <CheckCircle2 size={32} />
                  </div>
                  
                  <div>
                    <h3 className="font-black text-lg text-[#F5F7F5] mb-1">
                      {profile?.status === 'Pending' ? 'Pending Approval' : 'Active & Verified'}
                    </h3>
                    <p className="text-[#9CAAA1] text-sm leading-relaxed">
                      {profile?.status === 'Pending' 
                        ? 'Your registration is currently under review by TreeConnect administrators.'
                        : 'Verified by TreeConnect Administrator. Authorized for platform operations based on submitted documentation.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Data */}
            <div className="lg:col-span-2 bg-[#101C14] border border-[#263B2E] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center gap-3 pb-4 border-b border-[#263B2E]">
                <FileText className="text-[#43C58A]" size={24} />
                <h2 className="text-xl font-bold text-[#F5F7F5]">Registration Details</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="bg-[#070B08] border border-[#263B2E] rounded-xl p-5 hover:border-[#43C58A]/30 transition-colors">
                  <span className="text-[10px] font-bold text-[#9CAAA1] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <User size={12} /> Full Legal Name
                  </span>
                  <span className="text-base font-bold text-[#F5F7F5]">{profile?.fullName || profile?.name}</span>
                </div>
                
                <div className="bg-[#070B08] border border-[#263B2E] rounded-xl p-5 hover:border-[#43C58A]/30 transition-colors">
                  <span className="text-[10px] font-bold text-[#9CAAA1] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Briefcase size={12} /> Account Type
                  </span>
                  <span className="text-base font-bold text-[#F5F7F5] capitalize">
                    {profile?.businessType || profile?.buyerType || profile?.role || 'Individual'}
                  </span>
                </div>

                <div className="bg-[#070B08] border border-[#263B2E] rounded-xl p-5 hover:border-[#43C58A]/30 transition-colors">
                  <span className="text-[10px] font-bold text-[#9CAAA1] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Phone size={12} /> Contact Number
                  </span>
                  <span className="text-base font-bold text-[#F5F7F5]">{profile?.phone || 'Not Provided'}</span>
                </div>

                <div className="bg-[#070B08] border border-[#263B2E] rounded-xl p-5 hover:border-[#43C58A]/30 transition-colors">
                  <span className="text-[10px] font-bold text-[#9CAAA1] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <FileText size={12} /> Tax / GST Number
                  </span>
                  <span className="text-base font-mono font-bold text-[#F5F7F5]">{profile?.gstNumber || 'Not Applicable'}</span>
                </div>

                <div className="bg-[#070B08] border border-[#263B2E] rounded-xl p-5 sm:col-span-2 hover:border-[#43C58A]/30 transition-colors">
                  <span className="text-[10px] font-bold text-[#9CAAA1] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <MapPin size={12} /> Registered Address
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-[#F5F7F5]">
                      {profile?.address || 'Address not provided'}
                    </span>
                    <span className="text-sm text-[#9CAAA1]">
                      {[profile?.village, profile?.localBody, profile?.district, profile?.state, profile?.pinCode || profile?.postalCode]
                        .filter(Boolean).join(', ') || 'Kerala, India'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
