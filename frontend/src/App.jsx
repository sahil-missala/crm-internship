import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Spinner from './components/common/Spinner';

// Pages
import EnquiryForm from './pages/customer/EnquiryForm';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import EnquiryList from './pages/dashboard/EnquiryList';
import EnquiryDetail from './pages/dashboard/EnquiryDetail';
import FollowUps from './pages/dashboard/FollowUps';
import Bookings from './pages/dashboard/Bookings';
import Invoice from './pages/dashboard/Invoice';
import Reports from './pages/dashboard/Reports';
import Settings from './pages/dashboard/Settings';

// Helper component for Route protection
function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surfaceBg">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public customer enquiry portals */}
          <Route path="/" element={<Navigate to="/enquiry" replace />} />
          <Route path="/enquiry" element={<EnquiryForm />} />

          {/* Authentication portal */}
          <Route path="/login" element={<Login />} />

          {/* Protected dashboard area */}
          <Route path="/dashboard" element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="enquiries" element={<EnquiryList />} />
              <Route path="enquiries/:id" element={<EnquiryDetail />} />
              <Route path="followups" element={<FollowUps />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="bookings/:id/invoice" element={<Invoice />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/enquiry" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
