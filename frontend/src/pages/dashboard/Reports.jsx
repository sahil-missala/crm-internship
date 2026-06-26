import React, { useState, useEffect } from 'react';
import { getEnquiries } from '../../api/enquiries';
import { getBookings } from '../../api/bookings';
import Spinner from '../../components/common/Spinner';
import { BarChart3, TrendingUp, HelpCircle, Compass, PieChart, Info } from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState({
    total: 0,
    converted: 0,
    cancelled: 0,
    active: 0,
    sourceCounts: {},
    tripCounts: {},
    statusCounts: {}
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReportMetrics() {
      setIsLoading(true);
      try {
        const [enqRes, bookingsRes] = await Promise.all([
          getEnquiries({ limit: 1000 }), // Get all entries
          getBookings()
        ]);

        if (enqRes.success) {
          const list = enqRes.data;
          const total = list.length;
          
          let converted = 0;
          let cancelled = 0;
          let active = 0;
          const sourceCounts = {};
          const tripCounts = {};
          const statusCounts = {};

          list.forEach((item) => {
            // Count status
            const status = item.status;
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            if (status === 'Confirmed') converted++;
            else if (status === 'Cancelled') cancelled++;
            else if (status === 'New' || status === 'Contacted') active++;

            // Count source
            const source = item.source || 'Other';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;

            // Count trip type
            const trip = item.trip_type || 'Custom';
            tripCounts[trip] = (tripCounts[trip] || 0) + 1;
          });

          setData({
            total,
            converted,
            cancelled,
            active,
            sourceCounts,
            tripCounts,
            statusCounts
          });
        }
      } catch (err) {
        console.error('Reports Fetch Error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReportMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }

  const conversionRate = data.total > 0 ? ((data.converted / data.total) * 100).toFixed(1) : '0.0';
  const cancellationRate = data.total > 0 ? ((data.cancelled / data.total) * 100).toFixed(1) : '0.0';
  const activeRate = data.total > 0 ? ((data.active / data.total) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Top Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Conversion Rate */}
        <div className="bg-white border border-borderGray p-6 rounded-card shadow-subtle flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Lead Conversion Rate</p>
              <h3 className="text-2xl font-bold text-textMain mt-1">{conversionRate}%</h3>
            </div>
            <div className="h-8 w-8 rounded-full bg-emerald-50 text-success flex items-center justify-center border border-emerald-100 shrink-0">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
            <div className="bg-success h-full" style={{ width: `${conversionRate}%` }} />
          </div>
        </div>

        {/* Card 2: Active Leads Rate */}
        <div className="bg-white border border-borderGray p-6 rounded-card shadow-subtle flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Active Pipeline Rate</p>
              <h3 className="text-2xl font-bold text-textMain mt-1">{activeRate}%</h3>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <Compass className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
            <div className="bg-blue-500 h-full" style={{ width: `${activeRate}%` }} />
          </div>
        </div>

        {/* Card 3: Cancellation Rate */}
        <div className="bg-white border border-borderGray p-6 rounded-card shadow-subtle flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Cancellation Rate</p>
              <h3 className="text-2xl font-bold text-textMain mt-1">{cancellationRate}%</h3>
            </div>
            <div className="h-8 w-8 rounded-full bg-red-50 text-danger flex items-center justify-center border border-red-100 shrink-0">
              <Info className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
            <div className="bg-danger h-full" style={{ width: `${cancellationRate}%` }} />
          </div>
        </div>

      </div>

      {/* Bar Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Graph 1: Trip Type Distribution */}
        <div className="bg-white border border-borderGray rounded-card shadow-subtle p-6 flex flex-col gap-4">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-borderGray pb-2 flex items-center gap-1">
            <BarChart3 className="h-4.5 w-4.5 text-accent" />
            Trip Category Breakdown
          </h4>

          <div className="flex flex-col gap-4 font-sans text-xs">
            {Object.entries(data.tripCounts).length === 0 ? (
              <p className="text-textMuted text-center py-12">No data logged.</p>
            ) : (
              Object.entries(data.tripCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => {
                  const percent = ((count / data.total) * 100).toFixed(1);
                  return (
                    <div key={type} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center font-semibold text-textMain">
                        <span>{type}</span>
                        <span>{count} Enquiry ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Graph 2: Source Distribution */}
        <div className="bg-white border border-borderGray rounded-card shadow-subtle p-6 flex flex-col gap-4">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-borderGray pb-2 flex items-center gap-1">
            <PieChart className="h-4.5 w-4.5 text-accent" />
            Customer Acquisition Channels (Source)
          </h4>

          <div className="flex flex-col gap-4 font-sans text-xs">
            {Object.entries(data.sourceCounts).length === 0 ? (
              <p className="text-textMuted text-center py-12">No data logged.</p>
            ) : (
              Object.entries(data.sourceCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([sourceName, count]) => {
                  const percent = ((count / data.total) * 100).toFixed(1);
                  return (
                    <div key={sourceName} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center font-semibold text-textMain">
                        <span>{sourceName}</span>
                        <span>{count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-accent h-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
