import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookings } from '../../api/bookings';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatDate';
import { Car, FileText, Calendar, Phone, MapPin, User, ChevronRight } from 'lucide-react';

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookingsList = async () => {
    try {
      const response = await getBookings();
      if (response.success) {
        setBookings(response.data);
      } else {
        setError(response.error || 'Failed to retrieve bookings.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to fetch bookings from the database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchBookingsList();
  }, []);

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
      
      {/* Table grid listing */}
      <div className="bg-white border border-borderGray rounded-card shadow-subtle flex flex-col min-h-[45vh]">
        
        {bookings.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20 px-6">
            <EmptyState 
              icon={Car}
              title="No bookings confirmed yet" 
              message="Confirm bookings by clicking 'Mark as Confirmed Booking' on any active enquiry details sheet." 
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-borderGray">
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em]">Invoice Ref</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em]">Customer Name</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em]">Vehicle / Driver</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em]">Pickup Schedule</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em] text-right">Financials</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em] text-center">Payment</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em] text-center">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderGray font-sans text-xs">
                {bookings.map((booking) => {
                  const balance = parseFloat(booking.total_amount) - parseFloat(booking.advance_paid);
                  
                  // Color codes for payment status badges
                  const paymentBadgeColor = {
                    Pending: 'bg-red-50 text-danger border border-red-200',
                    Partial: 'bg-amber-50 text-accent-dark border border-amber-200',
                    Paid: 'bg-emerald-50 text-success border border-emerald-200'
                  };

                  return (
                    <tr 
                      key={booking.id} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/bookings/${booking.id}/invoice`)}
                    >
                      {/* Invoice Reference code */}
                      <td className="px-6 py-4 font-bold text-primary whitespace-nowrap">
                        {booking.invoice_number}
                      </td>

                      {/* Customer Name */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-textMain">{booking.customer_name}</p>
                        <span className="text-[10px] text-textMuted inline-flex items-center gap-0.5">
                          <Phone className="h-3 w-3" />
                          {booking.customer_phone}
                        </span>
                      </td>

                      {/* Allocated transport and driver details */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-textMain flex items-center gap-1">
                          <Car className="h-3.5 w-3.5 text-primary" />
                          {booking.vehicle_type || 'Unspecified'}
                        </p>
                        {booking.driver_name ? (
                          <span className="text-[10px] text-textMuted inline-flex items-center gap-0.5 mt-0.5">
                            <User className="h-3 w-3" />
                            {booking.driver_name} ({booking.driver_phone || 'No phone'})
                          </span>
                        ) : (
                          <span className="text-[10px] text-danger font-medium mt-0.5 block">Driver not assigned</span>
                        )}
                      </td>

                      {/* Pickup Timing */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-textMain">{formatDateTime(booking.pickup_datetime)}</p>
                        <span className="text-[10px] text-textMuted inline-flex items-center gap-0.5 mt-0.5 max-w-xs truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {booking.pickup_location}
                        </span>
                      </td>

                      {/* Financial breakdown */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <p className="font-bold text-textMain">Tot: {formatCurrency(booking.total_amount)}</p>
                        <p className="text-[10px] text-success font-medium">Adv: {formatCurrency(booking.advance_paid)}</p>
                        {balance > 0 ? (
                          <p className="text-[10px] text-danger font-bold">Bal: {formatCurrency(balance)}</p>
                        ) : (
                          <p className="text-[9px] font-bold text-success uppercase mt-0.5">Cleared</p>
                        )}
                      </td>

                      {/* Payment Status badge */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-badge ${paymentBadgeColor[booking.payment_status] || 'bg-gray-100'}`}>
                          {booking.payment_status}
                        </span>
                      </td>

                      {/* Click to open invoice */}
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/dashboard/bookings/${booking.id}/invoice`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-primary hover:text-accent-dark rounded border border-borderGray shadow-subtle transition-all duration-200 text-[10px] font-bold uppercase tracking-wider"
                        >
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          Print INV
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
