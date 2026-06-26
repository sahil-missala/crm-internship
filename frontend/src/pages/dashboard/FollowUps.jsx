import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFollowUpsToday, updateEnquiryStatus, addEnquiryNote } from '../../api/enquiries';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatDate';
import { Phone, Calendar, ArrowRight, MessageSquare, Compass } from 'lucide-react';

export default function FollowUps() {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null); // ID of record being updated

  const fetchTodayFollowUps = async () => {
    try {
      const response = await getFollowUpsToday();
      if (response.success) {
        setFollowups(response.data);
      } else {
        setError(response.error || 'Failed to retrieve follow-up items.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to fetch today\'s follow-up records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchTodayFollowUps();
  }, []);

  const handleMarkContacted = async (id, name) => {
    setActionId(id);
    try {
      // 1. Update status to 'Contacted'
      await updateEnquiryStatus(id, 'Contacted');
      
      // 2. Add notes logging this callback
      await addEnquiryNote(id, `Staff contacted customer ${name} on follow-up schedule.`);
      
      // 3. Reload list
      await fetchTodayFollowUps();
      
      alert(`Status updated for ${name} to Contacted.`);
    } catch (err) {
      console.error(err);
      alert('Failed to update callback status.');
    } finally {
      setActionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-danger text-xs font-semibold rounded border border-red-200">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      <div className="bg-white p-4 border border-borderGray rounded-card shadow-subtle flex items-center gap-3">
        <div className="h-9 w-9 bg-accent/10 text-accent-dark rounded-full flex items-center justify-center border border-accent/20">
          <Compass className="h-4.5 w-4.5" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-textMain">Action Plan</p>
          <p className="text-textMuted font-medium mt-0.5">Please contact the following customers who are scheduled for follow-ups today.</p>
        </div>
      </div>

      {followups.length === 0 ? (
        <div className="py-12">
          <EmptyState 
            icon={Calendar}
            title="All caught up!" 
            message="There are no follow-ups scheduled for today. Check 'All Enquiries' to schedule callbacks." 
          />
        </div>
      ) : (
        /* Dynamic Card Layout Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {followups.map((item) => (
            <div 
              key={item.id} 
              className="bg-white border border-borderGray rounded-card shadow-subtle flex flex-col justify-between hover:shadow-card transition-all duration-300 relative overflow-hidden group"
            >
              {/* Highlight bar matches lead priority temperature */}
              <div className={`h-1.5 w-full ${
                item.lead_temperature === 'Hot' ? 'bg-danger' : item.lead_temperature === 'Warm' ? 'bg-accent' : 'bg-blue-400'
              }`} />

              <div className="p-6 flex flex-col gap-4">
                
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-textMain leading-tight truncate">
                      {item.customer_name}
                    </h4>
                    <span className="text-[10px] text-textMuted uppercase font-semibold mt-1 block">
                      Source: {item.source}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge type="temperature" value={item.lead_temperature} />
                    <span className="text-[9px] text-textMuted font-bold">Priority</span>
                  </div>
                </div>

                {/* Contact phone */}
                <div className="bg-slate-50 p-3 rounded border border-borderGray flex items-center justify-between text-xs">
                  <span className="font-semibold text-textMuted">Mobile:</span>
                  <a
                    href={`tel:${item.phone}`}
                    className="font-bold text-primary hover:text-accent-dark flex items-center gap-1 bg-white px-2.5 py-1.5 rounded border border-borderGray shadow-subtle select-all"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {item.phone}
                  </a>
                </div>

                {/* Trip info */}
                <div className="text-xs">
                  <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">Trip Details</p>
                  <p className="font-semibold text-textMain">{item.trip_type} ({item.passengers} Pax)</p>
                  <p className="text-textMuted text-[10px] mt-1 flex items-start gap-0.5 leading-relaxed">
                    <span className="font-bold shrink-0">Route:</span>
                    <span className="truncate">{item.pickup_location} → {item.drop_location}</span>
                  </p>
                  <p className="text-[10px] text-textMuted font-medium mt-1">
                    Travel Date: <span className="font-bold text-textMain">{formatDate(item.travel_date)}</span>
                  </p>
                </div>

                {/* Last follow up note */}
                <div className="border-t border-borderGray/50 pt-3">
                  <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider flex items-center gap-1 mb-1">
                    <MessageSquare className="h-3 w-3 text-primary" />
                    Last Follow-up Note
                  </span>
                  <p className="text-xs text-textMuted leading-relaxed italic bg-slate-50/50 p-2.5 rounded border border-borderGray/50 line-clamp-2">
                    {item.last_note || '"No notes recorded yet."'}
                  </p>
                </div>

              </div>

              {/* Action buttons */}
              <div className="px-6 py-4 bg-slate-50 border-t border-borderGray flex items-center gap-3 justify-between">
                <button
                  onClick={() => navigate(`/dashboard/enquiries/${item.id}`)}
                  className="text-xs font-bold text-primary hover:text-accent-dark inline-flex items-center gap-0.5 transition-colors"
                >
                  View Details
                  <ArrowRight className="h-4 w-4" />
                </button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleMarkContacted(item.id, item.customer_name)}
                  isLoading={actionId === item.id}
                  disabled={actionId !== null}
                >
                  Mark as Contacted
                </Button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
