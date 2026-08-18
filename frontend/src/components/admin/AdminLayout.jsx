import React from 'react';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import AdminHeader from './AdminHeader';
import '../../pages/admin/AdminDashboard.css';

const AdminLayout = ({ user, onLogout, children }) => {
  return (
    <div className="admin-dashboard-page">
      <Navbar />
      <div className="admin-dashboard-container">
        <Sidebar />

        <div className="admin-dashboard-workspace">
          <AdminHeader />

          <main className="w-full flex flex-col gap-8 mt-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
