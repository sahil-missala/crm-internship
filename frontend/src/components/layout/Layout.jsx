import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const location = useLocation();

  // Helper to determine the header title based on route path
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'CRM Overview Dashboard';
    if (path.startsWith('/dashboard/enquiries/')) {
      if (path.endsWith('/invoice')) return 'Booking Invoice Receipt';
      return 'Enquiry Details Analysis';
    }
    if (path === '/dashboard/enquiries') return 'Manage Enquiries';
    if (path === '/dashboard/followups') return 'Today\'s Scheduled Follow-ups';
    if (path === '/dashboard/bookings') return 'Travel Booking Records';
    if (path === '/dashboard/reports') return 'Analytics & Reports';
    if (path === '/dashboard/settings') return 'CRM Settings Panel';
    return 'CRM Portal';
  };

  return (
    <div className="min-h-screen flex bg-surfaceBg font-sans">
      {/* Fixed Left Sidebar (240px) */}
      <Sidebar />

      {/* Main Content Area (offset by 240px) */}
      <div className="flex-1 flex flex-col min-w-0 ml-[240px] min-h-screen">
        {/* Top Navbar */}
        <Navbar title={getHeaderTitle()} />

        {/* Dynamic Nested Screen Content */}
        <main className="flex-1 p-8 mt-16 overflow-y-auto main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
