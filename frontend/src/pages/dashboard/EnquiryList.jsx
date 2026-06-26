import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnquiries, createEnquiry } from '../../api/enquiries';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatDate';
import { validatePhone, validateEmail } from '../../utils/validators';
import { Search, SlidersHorizontal, Plus, Phone, MapPin, X, ArrowUpDown } from 'lucide-react';

export default function EnquiryList() {
  const navigate = useNavigate();

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [tripType, setTripType] = useState('');
  const [source, setSource] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Table Data States
  const [enquiries, setEnquiries] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Enquiry Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    source: 'Walk-in', // Default for staff manual entry
    trip_type: 'One-Way Drop',
    pickup_location: '',
    drop_location: '',
    travel_date: '',
    return_date: '',
    passengers: 1,
    special_requirements: ''
  });
  const [modalErrors, setModalErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch enquiries on search / filter updates
  useEffect(() => {
    async function fetchEnquiries() {
      setIsLoading(true);
      setError('');
      try {
        const params = {
          page,
          limit: 20,
          status: status || undefined,
          trip_type: tripType || undefined,
          source: source || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          search: search || undefined
        };
        const response = await getEnquiries(params);
        if (response.success) {
          setEnquiries(response.data);
          setTotal(response.total);
          setTotalPages(response.totalPages);
        } else {
          setError(response.error || 'Failed to retrieve enquiries.');
        }
      } catch (err) {
        console.error('Enquiries Fetch Error:', err);
        setError('Network error occurred while fetching enquiries.');
      } finally {
        setIsLoading(false);
      }
    }

    // Debounce search input to avoid overwhelming API
    const delayDebounce = setTimeout(() => {
      fetchEnquiries();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, status, tripType, source, dateFrom, dateTo, page]);

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page
  };

  // Reset Filters
  const handleClearFilters = () => {
    setStatus('');
    setTripType('');
    setSource('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setPage(1);
  };

  // --- Manual Entry Modal Submission ---
  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalData((prev) => ({ ...prev, [name]: value }));
    if (modalErrors[name]) {
      setModalErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateModalForm = () => {
    const errors = {};
    const todayStr = new Date().toISOString().split('T')[0];

    if (!modalData.customer_name.trim()) errors.customer_name = 'Full name is required';
    
    if (!modalData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(modalData.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }

    if (modalData.email && !validateEmail(modalData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!modalData.pickup_location.trim()) errors.pickup_location = 'Pickup location is required';
    if (!modalData.drop_location.trim()) errors.drop_location = 'Drop location is required';
    if (!modalData.travel_date) errors.travel_date = 'Travel date is required';
    
    if (modalData.travel_date && modalData.travel_date < todayStr) {
      errors.travel_date = 'Travel date cannot be in the past';
    }

    if (modalData.trip_type === 'Round Trip') {
      if (!modalData.return_date) {
        errors.return_date = 'Return date is required for Round Trips';
      } else if (modalData.return_date < modalData.travel_date) {
        errors.return_date = 'Return date cannot be before travel date';
      }
    }

    const pax = parseInt(modalData.passengers);
    if (isNaN(pax) || pax < 1 || pax > 20) {
      errors.passengers = 'Passengers must be between 1 and 20';
    }

    setModalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!validateModalForm()) return;

    setIsSubmitting(true);
    try {
      const payload = { ...modalData };
      if (modalData.trip_type !== 'Round Trip') {
        payload.return_date = '';
      }
      
      const response = await createEnquiry(payload);
      if (response.success) {
        setIsModalOpen(false);
        // Reset Modal Data
        setModalData({
          customer_name: '',
          phone: '',
          email: '',
          source: 'Walk-in',
          trip_type: 'One-Way Drop',
          pickup_location: '',
          drop_location: '',
          travel_date: '',
          return_date: '',
          passengers: 1,
          special_requirements: ''
        });
        setModalErrors({});
        
        // Refresh page
        setPage(1);
        setStatus('');
        setSearch('');
      } else {
        alert(response.error || 'Failed to submit enquiry.');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred during enquiry logging.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Top Banner Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 border border-borderGray rounded-card shadow-subtle no-print">
        
        {/* Search Input bar */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-textMuted/60" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2 border border-borderGray rounded-input text-xs font-semibold text-textMain placeholder-textMuted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* Actions Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {showFilters ? ' (Hide)' : ' (Show)'}
          </Button>

          <Button
            variant="accent"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4 stroke-[3px]" />
            New Enquiry
          </Button>
        </div>

      </div>

      {/* Dynamic Filter Accordion Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-white p-5 border border-borderGray rounded-card shadow-subtle animate-in slide-in-from-top-3 duration-200 no-print">
          
          <Input
            label="Status"
            type="select"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={['New', 'Contacted', 'Confirmed', 'Cancelled', 'Completed']}
            placeholder="All Statuses"
          />

          <Input
            label="Trip Type"
            type="select"
            value={tripType}
            onChange={(e) => { setTripType(e.target.value); setPage(1); }}
            options={['One-Way Drop', 'Round Trip', 'Airport Transfer', 'Outstation', 'Hill Station', 'Custom']}
            placeholder="All Trips"
          />

          <Input
            label="Source"
            type="select"
            value={source}
            onChange={(e) => { setSource(e.target.value); setPage(1); }}
            options={['Walk-in', 'Phone Call', 'WhatsApp', 'Website', 'Reference', 'Other']}
            placeholder="All Sources"
          />

          <Input
            label="Travel From"
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          />

          <Input
            label="Travel To"
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          />

          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="w-full h-[38px] text-xs font-semibold text-danger border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              Clear Filters
            </Button>
          </div>

        </div>
      )}

      {/* Main Database Table grid */}
      <div className="bg-white border border-borderGray rounded-card shadow-subtle flex flex-col min-h-[40vh]">
        {error && (
          <div className="m-6 p-3 bg-red-50 text-danger text-xs font-semibold rounded border border-red-200">
            ⚠️ {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Spinner className="h-10 w-10 text-primary" />
          </div>
        ) : enquiries.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20 px-6">
            <EmptyState 
              title="No enquiries matching criteria" 
              message="Please adjust your active search term or filter options." 
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-borderGray">
                    <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em]">Customer Name</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em]">Phone</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em]">Trip Info</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em] text-center">Status</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em] text-center">Lead Temp</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em]">Travel Date</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-textMuted uppercase tracking-[0.08em] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderGray">
                  {enquiries.map((enquiry) => (
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
                          className="text-xs font-bold text-primary hover:text-accent-dark transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Footer */}
            <div className="px-6 py-4 border-t border-borderGray flex items-center justify-between bg-slate-50/50 no-print">
              <span className="text-xs text-textMuted font-medium">
                Showing <span className="font-semibold text-textMain">{Math.min(total, (page - 1) * 20 + 1)}</span> to{' '}
                <span className="font-semibold text-textMain">{Math.min(total, page * 20)}</span> of{' '}
                <span className="font-semibold text-textMain">{total}</span> entries
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3"
                >
                  Previous
                </Button>
                
                <span className="text-xs font-bold text-textMain px-2">
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- ADD ENQUIRY MODAL (MANUAL INPUT BY STAFF) --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setModalErrors({}); }}
        title="Manual Booking Enquiry Entry"
        size="xl"
      >
        <form onSubmit={handleModalSubmit} className="flex flex-col gap-4 font-sans text-left">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer Full Name"
              name="customer_name"
              value={modalData.customer_name}
              onChange={handleModalInputChange}
              placeholder="e.g. Rahul Kumar"
              error={modalErrors.customer_name}
              required
            />

            <Input
              label="Contact Phone"
              name="phone"
              type="tel"
              value={modalData.phone}
              onChange={handleModalInputChange}
              placeholder="10-digit mobile number"
              error={modalErrors.phone}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={modalData.email}
              onChange={handleModalInputChange}
              placeholder="customer@email.com"
              error={modalErrors.email}
            />

            <Input
              label="Enquiry Source"
              name="source"
              type="select"
              value={modalData.source}
              onChange={handleModalInputChange}
              options={['Walk-in', 'Phone Call', 'WhatsApp', 'Website', 'Reference', 'Other']}
              required
            />

            <Input
              label="Trip Category"
              name="trip_type"
              type="select"
              value={modalData.trip_type}
              onChange={handleModalInputChange}
              options={['One-Way Drop', 'Round Trip', 'Airport Transfer', 'Outstation', 'Hill Station', 'Custom']}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Pickup Location Address"
              name="pickup_location"
              value={modalData.pickup_location}
              onChange={handleModalInputChange}
              placeholder="Full pickup landmark"
              error={modalErrors.pickup_location}
              required
            />

            <Input
              label="Drop Location Address"
              name="drop_location"
              value={modalData.drop_location}
              onChange={handleModalInputChange}
              placeholder="Destination landmark"
              error={modalErrors.drop_location}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Travel Date"
              name="travel_date"
              type="date"
              value={modalData.travel_date}
              onChange={handleModalInputChange}
              error={modalErrors.travel_date}
              required
            />

            <Input
              label="Passengers"
              name="passengers"
              type="number"
              min="1"
              max="20"
              value={modalData.passengers}
              onChange={handleModalInputChange}
              error={modalErrors.passengers}
              required
            />

            {modalData.trip_type === 'Round Trip' && (
              <Input
                label="Return Date"
                name="return_date"
                type="date"
                min={modalData.travel_date}
                value={modalData.return_date}
                onChange={handleModalInputChange}
                error={modalErrors.return_date}
                required
              />
            )}
          </div>

          <Input
            label="Special Preferences"
            name="special_requirements"
            type="textarea"
            rows={2}
            value={modalData.special_requirements}
            onChange={handleModalInputChange}
            placeholder="Vehicle specifications, stopovers, timing constraints..."
          />

          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-borderGray">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsModalOpen(false); setModalErrors({}); }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Save Enquiry
            </Button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
