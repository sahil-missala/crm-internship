import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDashboardStats, getEnquiries } from '../../api/enquiries';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatDate';
import { 
  Users, 
  CalendarClock, 
  CheckCircle2, 
  BarChart, 
  ChevronRight, 
  Sparkles,
  Phone,
  MapPin
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_enquiries: 0,
    pending_followups: 0,
    confirmed_bookings: 0,
    this_month: 0
  });
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      setError('');
      try {
        const [statsRes, enquiriesRes] = await Promise.all([
          getDashboardStats(),
          getEnquiries({ limit: 10 }) // Get last 10 entries
        ]);

        if (statsRes.success) {
          setStats(statsRes.stats);
        }
        if (enquiriesRes.success) {
          setRecentEnquiries(enquiriesRes.data);
        }
      } catch (err) {
        console.error('Dashboard Fetch Error:', err);
        setError('Failed to fetch dashboard metrics. Please reload page.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-200">
      
      {error && (
        <div className="p-3 bg-red-50 text-danger text-xs font-semibold rounded border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Enquiries */}
        <div className="bg-white border border-borderGray p-6 rounded-card shadow-subtle flex items-center justify-between hover:shadow-card transition-all duration-300">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">
              Total Enquiries
            </span>
            <span className="text-2xl font-bold text-textMain">
              {stats.total_enquiries}
            </span>
          </div>
          <div className="h-12 w-12 rounded-full bg-slate-50 text-primary flex items-center justify-center border border-borderGray shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Pending Follow-ups */}
        <div className="bg-white border border-borderGray p-6 rounded-card shadow-subtle flex items-center justify-between hover:shadow-card transition-all duration-300">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-textMuted uppercase tracking-wider flex items-center gap-1.5">
              Pending Follow-ups
              <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
            </span>
            <span className="text-2xl font-bold text-textMain">
              {stats.pending_followups}
            </span>
          </div>
          <div className="h-12 w-12 rounded-full bg-amber-50 text-accent-dark flex items-center justify-center border border-amber-100 shrink-0">
            <CalendarClock className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Confirmed Bookings */}
        <div className="bg-white border border-borderGray p-6 rounded-card shadow-subtle flex items-center justify-between hover:shadow-card transition-all duration-300">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">
              Confirmed Bookings
            </span>
            <span className="text-2xl font-bold text-textMain">
              {stats.confirmed_bookings}
            </span>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-success flex items-center justify-center border border-emerald-100 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: This Month's Enquiries */}
        <div className="bg-white border border-borderGray p-6 rounded-card shadow-subtle flex items-center justify-between hover:shadow-card transition-all duration-300">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">
              This Month's Submissions
            </span>
            <span className="text-2xl font-bold text-textMain">
              {stats.this_month}
            </span>
          </div>
          <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <BarChart className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Recent Enquiries Section */}
      <div className="bg-white border border-borderGray rounded-card shadow-subtle flex flex-col">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-borderGray flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-accent" />
            Recent Enquiries (Last 10)
          </h3>
          <Link
            to="/dashboard/enquiries"
            className="text-xs font-bold text-primary hover:text-accent-dark flex items-center gap-1 transition-colors"
          >
            View All Enquiries
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Table Body */}
        {recentEnquiries.length === 0 ? (
          <div className="p-12">
            <EmptyState title="No recent enquiries logged" message="Your enquiry dashboard is currently empty." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-borderGray">
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em]">Customer Name</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em]">Phone</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em]">Trip Details</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em] text-center">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em] text-center">Lead Temp</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em]">Travel Date</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderGray">
                {recentEnquiries.map((enquiry) => (
                  <tr 
                    key={enquiry.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/dashboard/enquiries/${enquiry.id}`)}
                  >
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-textMain group-hover:text-primary transition-colors">
                        {enquiry.customer_name}
                      </p>
                      <span className="text-[10px] text-textMuted">
                        Source: {enquiry.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-textMuted">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3 text-textMuted/60" />
                        {enquiry.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-textMain">
                        {enquiry.trip_type}
                      </p>
                      <span className="text-[10px] text-textMuted inline-flex items-center gap-0.5 truncate max-w-xs">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {enquiry.pickup_location} → {enquiry.drop_location}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge type="status" value={enquiry.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge type="temperature" value={enquiry.lead_temperature} />
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-textMain">
                      {formatDate(enquiry.travel_date)}
                    </td>
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/dashboard/enquiries/${enquiry.id}`)}
                        className="inline-flex items-center text-xs font-bold text-primary hover:text-accent-dark transition-colors"
                      >
                        Details
                        <ChevronRight className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
