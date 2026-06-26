import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice, updateBooking } from '../../api/bookings';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatDate';
import { Printer, ArrowLeft, Landmark, Calendar, Phone, MapPin, ShieldAlert, CheckCircle2, CreditCard } from 'lucide-react';


export default function Invoice() {
  const { id } = useParams(); // bookingId
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setIsSubmittingPayment(true);
    try {
      const parsedAmount = parseFloat(paymentAmount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        setPaymentError('Please enter a valid payment amount.');
        setIsSubmittingPayment(false);
        return;
      }
      if (parsedAmount > parseFloat(invoice.total_amount)) {
        setPaymentError('Advance paid cannot be greater than the total amount.');
        setIsSubmittingPayment(false);
        return;
      }

      const response = await updateBooking(id, {
        advance_paid: parsedAmount,
        payment_status: paymentStatus
      });

      if (response.success) {
        // Refresh invoice data
        const refreshResponse = await getInvoice(id);
        if (refreshResponse.success) {
          setInvoice(refreshResponse.data);
        }
        setIsPaymentModalOpen(false);
      } else {
        setPaymentError(response.error || 'Failed to update payment.');
      }
    } catch (err) {
      console.error(err);
      setPaymentError('Failed to update payment.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  useEffect(() => {
    async function fetchInvoiceData() {
      setIsLoading(true);
      setError('');
      try {
        const response = await getInvoice(id);
        if (response.success) {
          setInvoice(response.data);
        } else {
          setError(response.error || 'Failed to retrieve invoice details.');
        }
      } catch (err) {
        console.error(err);
        setError('Error loading invoice details.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoiceData();
  }, [id]);

  const handlePrint = () => {
    window.print();
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

  const balance = parseFloat(invoice.total_amount) - parseFloat(invoice.advance_paid);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Top navigation actions toolbar (Hidden on Print) */}
      <div className="flex items-center justify-between no-print border-b border-borderGray pb-4">
        <button
          onClick={() => navigate('/dashboard/bookings')}
          className="flex items-center gap-1 text-xs font-bold text-primary hover:text-accent-dark transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to Bookings
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              setPaymentAmount(invoice.advance_paid || '');
              setPaymentStatus(invoice.payment_status || 'Pending');
              setIsPaymentModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <CreditCard className="h-4.5 w-4.5" />
            Update Payment
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5"
          >
            <Printer className="h-4.5 w-4.5" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document Layout sheet */}
      <div className="bg-white border border-borderGray p-8 rounded-card shadow-subtle max-w-[800px] mx-auto w-full print-card font-sans text-xs text-textMain leading-relaxed">
        
        {/* Document Header Branding */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-2 border-primary pb-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-primary tracking-tight">
              MANIVTHA TOURS & TRAVELS
            </h1>
            <p className="text-[10px] text-textMuted font-medium uppercase mt-0.5">
              Premium Car Rentals & Holiday Packages
            </p>
            <p className="text-[10px] text-textMuted mt-1 leading-tight">
              No. 42, Outer Ring Road, Kalyan Nagar, Bangalore - 560043<br />
              Contact: +91 98450 98450 | support@manivtha.com
            </p>
          </div>

          <div className="text-left md:text-right flex flex-col md:items-end gap-1">
            <span className="text-lg font-extrabold text-primary select-all">
              {invoice.invoice_number}
            </span>
            <p className="text-[10px] text-textMuted font-semibold">
              Date Issued: {formatDate(invoice.created_at)}
            </p>
            <div className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-badge text-[10px] font-bold border ${
                invoice.payment_status === 'Paid' 
                  ? 'bg-emerald-50 text-success border-emerald-200' 
                  : invoice.payment_status === 'Partial' 
                  ? 'bg-amber-50 text-accent-dark border-amber-200' 
                  : 'bg-red-50 text-danger border-red-200'
              }`}>
                {invoice.payment_status === 'Paid' ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <ShieldAlert className="h-3 w-3 mr-1" />
                )}
                Payment Status: {invoice.payment_status}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Billing Address Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-borderGray">
          <div>
            <h4 className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">
              Billed To (Customer Details)
            </h4>
            <p className="text-sm font-bold text-textMain">{invoice.customer_name}</p>
            <p className="text-xs text-textMuted mt-1 inline-flex items-center gap-1 select-all">
              <Phone className="h-3.5 w-3.5 text-textMuted/60" />
              {invoice.customer_phone}
            </p>
            {invoice.customer_email && (
              <p className="text-xs text-textMuted mt-0.5 select-all">
                {invoice.customer_email}
              </p>
            )}
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">
              Travel Allocation Details
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <span className="font-semibold text-textMuted">Trip Category:</span>
              <span className="font-bold text-textMain">{invoice.trip_type}</span>
              
              <span className="font-semibold text-textMuted">Vehicle Model:</span>
              <span className="font-bold text-textMain">{invoice.vehicle_type || 'Sedan (Standard)'}</span>
              
              <span className="font-semibold text-textMuted">Assigned Driver:</span>
              <span className="font-bold text-textMain">{invoice.driver_name || 'TBA'}</span>

              <span className="font-semibold text-textMuted">Passengers:</span>
              <span className="font-bold text-textMain">{invoice.passengers} Pax</span>
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div className="py-6 border-b border-borderGray flex flex-col gap-4">
          <h4 className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">
            Travel Schedule & Route
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-borderGray">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Pickup Point</p>
                <p className="font-bold text-textMain mt-0.5">{invoice.pickup_location}</p>
                <p className="text-[10px] text-textMuted mt-1 inline-flex items-center gap-1 font-semibold">
                  <Calendar className="h-3 w-3 text-primary" />
                  Scheduled: {formatDateTime(invoice.pickup_datetime)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Drop Destination</p>
                <p className="font-bold text-textMain mt-0.5">{invoice.drop_location}</p>
                {invoice.trip_type === 'Round Trip' && (
                  <p className="text-[10px] text-textMuted mt-1 inline-flex items-center gap-1 font-semibold">
                    <Calendar className="h-3 w-3 text-danger" />
                    Return Date: {formatDate(invoice.return_date)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Special instructions */}
        {invoice.special_requirements && (
          <div className="py-6 border-b border-borderGray">
            <h4 className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1.5">
              Booking Specific Instructions
            </h4>
            <p className="text-xs text-textMuted leading-relaxed italic bg-slate-50 p-3 rounded border border-borderGray/50">
              {invoice.special_requirements}
            </p>
          </div>
        )}

        {/* Cost Summary Table */}
        <div className="py-8 flex flex-col items-end">
          <div className="w-full sm:max-w-xs flex flex-col gap-2 border-t-2 border-borderGray pt-4">
            
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-textMuted">Total Service Charge:</span>
              <span className="text-textMain">{formatCurrency(invoice.total_amount)}</span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-success">
              <span>Advance Deposit Received:</span>
              <span>{formatCurrency(invoice.advance_paid)}</span>
            </div>

            <div className="flex justify-between items-center text-sm font-bold border-t border-dashed border-borderGray pt-2">
              <span className="text-primary">Net Balance Due:</span>
              <span className={`${balance > 0 ? 'text-danger' : 'text-success'}`}>
                {formatCurrency(balance)}
              </span>
            </div>

          </div>
        </div>

        {/* Invoice Footer Terms */}
        <div className="mt-8 pt-6 border-t border-borderGray text-center text-[10px] text-textMuted leading-relaxed">
          <div className="flex items-center justify-center gap-1.5 font-bold text-textMain mb-2 uppercase tracking-wide">
            <Landmark className="h-4 w-4 text-primary" />
            Payment Terms & Policies
          </div>
          <p className="max-w-md mx-auto">
            Payment for rentals is due prior to departure or as partial installments. Returns and cancellations are subject to local tariff rules. Balance amount must be settled directly with the driver or at the Kalyan Nagar office.
          </p>
          <p className="font-bold text-primary mt-4 uppercase select-none">
            Thank you for traveling with Manivtha!
          </p>
        </div>

      </div>

      {/* Update Payment Modal */}
      {isPaymentModalOpen && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Update Payment Details"
        >
          <form onSubmit={handleUpdatePayment} className="flex flex-col gap-4">
            {paymentError && (
              <div className="p-3 bg-red-50 text-danger text-xs font-semibold rounded border border-red-200">
                ⚠️ {paymentError}
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded border border-borderGray text-xs flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="font-semibold text-textMuted">Total Service Charge:</span>
                <span className="font-bold text-textMain">{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-textMuted">Current Paid:</span>
                <span className="font-bold text-success">{formatCurrency(invoice.advance_paid)}</span>
              </div>
              <div className="flex justify-between border-t border-borderGray/50 pt-1.5 font-bold">
                <span className="text-primary">New Balance Due:</span>
                <span className={parseFloat(invoice.total_amount) - parseFloat(paymentAmount || 0) > 0 ? 'text-danger' : 'text-success'}>
                  {formatCurrency(parseFloat(invoice.total_amount) - parseFloat(paymentAmount || 0))}
                </span>
              </div>
            </div>

            <Input
              label="Amount Paid"
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="e.g. 1500.00"
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="bg-white border border-borderGray text-xs p-2 rounded focus:outline-none focus:border-primary font-sans h-10 w-full"
              >
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 border-t border-borderGray pt-4 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isSubmittingPayment}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                isLoading={isSubmittingPayment}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
