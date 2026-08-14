import React from 'react';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = ({ user, onLogout, children }) => {
  return (
    <div className="dashboard-layout min-h-screen bg-dark flex flex-col">
      <Navbar />
      <div className="dashboard-body flex flex-1 w-full">
        <Sidebar />

        <div className="dashboard-workspace flex-1 flex flex-col min-w-0 w-full">
          <AdminHeader />

          <main className="dashboard-content flex-1 w-full space-y-6 p-4 sm:p-6 custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
