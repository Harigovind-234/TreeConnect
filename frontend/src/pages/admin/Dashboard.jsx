import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import PlatformOverview from '../../components/admin/PlatformOverview';
import ContractorVerification from '../../components/admin/ContractorVerification';
import UserSummary from '../../components/admin/UserSummary';
import RecentActivity from '../../components/admin/RecentActivity';
import OperationsOverview from '../../components/admin/OperationsOverview';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSelectMetric = (metricId) => {
    if (metricId === 'total_users' || metricId === 'pending_contractors') {
      navigate('/admin/users');
    } else if (metricId === 'active_properties') {
      navigate('/admin/properties');
    } else if (metricId === 'harvest_requests') {
      navigate('/admin/harvest-operations');
    } else if (metricId === 'timber_listings') {
      navigate('/admin/marketplace');
    } else if (metricId === 'transactions') {
      navigate('/admin/payments');
    }
  };

  return (
    <AdminLayout user={user} onLogout={logout}>
      {/* 1. PLATFORM OVERVIEW (6 Compact Metrics) */}
      <div id="overview">
        <PlatformOverview onSelectMetric={handleSelectMetric} />
      </div>

      {/* 3. CONTRACTOR VERIFICATION (Pending Contractors Review) */}
      <div id="verifications">
        <ContractorVerification />
      </div>

      {/* 4. USER MANAGEMENT SUMMARY (Landowners, Contractors, Buyers) */}
      <div id="user-summary">
        <UserSummary onManageUsers={(targetPath) => navigate(targetPath || '/admin/users')} />
      </div>

      {/* 5. RECENT PLATFORM ACTIVITY (5-6 Audit Feed Items) */}
      <div id="recent-activity">
        <RecentActivity />
      </div>

      {/* 6. OPERATIONS OVERVIEW (Harvests, Marketplace, Transactions) */}
      <div id="harvests">
        <div id="marketplace">
          <div id="transactions">
            <OperationsOverview
              onViewHarvests={() => navigate('/admin/harvest-operations')}
              onViewMarketplace={() => navigate('/admin/marketplace')}
              onViewTransactions={() => navigate('/admin/payments')}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
