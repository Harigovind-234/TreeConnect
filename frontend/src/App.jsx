import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LandownerProvider } from './context/LandownerContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GoogleCompleteRegistration from './pages/GoogleCompleteRegistration';
import NotFound from './pages/NotFound';

// Dashboards
import AdminDashboard from './pages/admin/Dashboard';
import UsersPage from './pages/admin/UsersPage';
import UserDetailPage from './pages/admin/UserDetailPage';
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage';
import PropertyDetailPage from './pages/admin/PropertyDetailPage';
import LandownerDashboard from './pages/landowner/Dashboard';
import ContractorDashboard from './pages/contractor/Dashboard';
import AssignedHarvestJobsPage from './pages/contractor/AssignedHarvestJobsPage';
import SubmitAssessmentPage from './pages/contractor/SubmitAssessmentPage';
import BuyerDashboard from './pages/buyer/Dashboard';

// Dedicated Landowner Action Pages
import RegisterProperty from './pages/landowner/RegisterProperty';
import AddTreeInventory from './pages/landowner/AddTreeInventory';
import RequestHarvesting from './pages/landowner/RequestHarvesting';
import CreateTimberListing from './pages/landowner/CreateTimberListing';
import PropertiesPage from './pages/landowner/PropertiesPage';
import TreeInventoryPage from './pages/landowner/TreeInventoryPage';
import HarvestRequestsPage from './pages/landowner/HarvestRequestsPage';
import TimberMarketplacePage from './pages/landowner/TimberMarketplacePage';

function App() {
  return (
    <AuthProvider>
      <LandownerProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/google" element={<GoogleCompleteRegistration />} />

            {/* Protected Role-Based Dashboards */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users/:userId"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/properties"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPropertiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/properties/:propertyId"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PropertyDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Landowner Routes */}
            <Route
              path="/landowner/dashboard"
              element={
                <ProtectedRoute allowedRoles={['landowner']}>
                  <LandownerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landowner/register-property"
              element={
                <ProtectedRoute allowedRoles={['landowner']}>
                  <RegisterProperty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landowner/add-inventory"
              element={
                <ProtectedRoute allowedRoles={['landowner']}>
                  <AddTreeInventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landowner/request-harvest"
              element={
                <ProtectedRoute allowedRoles={['landowner']}>
                  <RequestHarvesting />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landowner/create-timber-listing"
              element={
                <ProtectedRoute allowedRoles={['landowner']}>
                  <CreateTimberListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landowner/properties"
              element={
                <ProtectedRoute allowedRoles={['landowner']}>
                  <PropertiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landowner/inventory"
              element={
                <ProtectedRoute allowedRoles={['landowner']}>
                  <TreeInventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landowner/tree-inventory"
              element={
                <ProtectedRoute allowedRoles={['landowner']}>
                  <TreeInventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landowner/harvest-requests"
              element={
                <ProtectedRoute allowedRoles={['landowner']}>
                  <HarvestRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landowner/marketplace"
              element={
                <ProtectedRoute allowedRoles={['landowner']}>
                  <TimberMarketplacePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/contractor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['contractor']}>
                  <ContractorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contractor/assigned-jobs"
              element={
                <ProtectedRoute allowedRoles={['contractor']}>
                  <AssignedHarvestJobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contractor/assigned-harvest-requests"
              element={
                <ProtectedRoute allowedRoles={['contractor']}>
                  <AssignedHarvestJobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contractor/assessment/:requestId"
              element={
                <ProtectedRoute allowedRoles={['contractor']}>
                  <SubmitAssessmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contractor/assessment"
              element={
                <ProtectedRoute allowedRoles={['contractor']}>
                  <SubmitAssessmentPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/buyer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <BuyerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </LandownerProvider>
    </AuthProvider>
  );
}

export default App;

