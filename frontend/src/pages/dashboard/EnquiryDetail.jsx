import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { 
  getEnquiryById, 
  updateEnquiryStatus, 
  updateEnquiryFollowUp, 
  addEnquiryNote,
  triggerTestTelegram,
  linkTelegram,
  unlinkTelegram
} from '../../api/enquiries';
import { createBooking } from '../../api/bookings';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatDate';
import { validatePhone } from '../../utils/validators';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { 
  ArrowLeft, 
  Send, 
  CheckSquare, 
  History, 
  Plus, 
  Calendar, 
  ShieldAlert, 
  Sparkles,
  Info,
  Car,
  MessageSquare,
  XCircle
} from 'lucide-react';

export default function EnquiryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core Data States
  const [enquiry, setEnquiry] = useState(null);
  const [notes, setNotes] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Right Side Action States
  const [selectedStatus, setSelectedStatus] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSettingFollowUp, setIsSettingFollowUp] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatPlatform, setChatPlatform] = useState('telegram');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [manualChatId, setManualChatId] = useState('');
  const [isLinkingTelegram, setIsLinkingTelegram] = useState(false);
  const [isUnlinkingTelegram, setIsUnlinkingTelegram] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState({ telegramConfigured: false, whatsappConfigured: false });

  // Left Side Edit Form States
  const [isEditingLeft, setIsEditingLeft] = useState(false);
  const [editFormData, setEditFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    pickup_location: '',
    drop_location: '',
    travel_date: '',
    return_date: '',
    passengers: 1,
    special_requirements: ''
  });
  const [leftErrors, setLeftErrors] = useState({});
  const [isSavingLeft, setIsSavingLeft] = useState(false);

  // Booking Confirmation Modal States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingFormData, setBookingFormData] = useState({
    vehicle_type: '',
    driver_name: '',
    driver_phone: '',
    pickup_datetime: '',
    total_amount: '',
    advance_paid: '',
    payment_status: 'Pending',
    notes: ''
  });
  const [bookingErrors, setBookingErrors] = useState({});
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);
  
  // Cancellation Modal States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [sendTelegramCancel, setSendTelegramCancel] = useState(true);
  const [sendWhatsAppCancel, setSendWhatsAppCancel] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // Load Enquiry Details
  const fetchEnquiryDetails = async () => {
    try {
      const response = await getEnquiryById(id);
      if (response.success) {
        const item = response.data;
        setEnquiry(item);
        setNotes(item.notes || []);
        setHistory(item.status_history || []);
        
        // Seed action handlers with loaded values
        setSelectedStatus(item.status);
        setFollowUpDate(item.follow_up_date ? item.follow_up_date.split('T')[0] : '');
        
        // Seed left editing form
        setEditFormData({
          customer_name: item.customer_name || '',
          phone: item.phone || '',
          email: item.email || '',
          pickup_location: item.pickup_location || '',
          drop_location: item.drop_location || '',
          travel_date: item.travel_date ? item.travel_date.split('T')[0] : '',
          return_date: item.return_date ? item.return_date.split('T')[0] : '',
          passengers: item.passengers || 1,
          special_requirements: item.special_requirements || ''
        });
      } else {
        setError(response.error || 'Enquiry details could not be found.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to fetch enquiry detail fields.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchEnquiryDetails();

    // Fetch integration configurations status
    api.get('/notifications/status')
      .then(res => {
        if (res.data.success) {
          setIntegrationStatus({
            telegramConfigured: res.data.telegramConfigured,
            whatsappConfigured: res.data.whatsappConfigured
          });
          // Default chat platform based on availability (forcing telegram since whatsapp is hidden)
          setChatPlatform('telegram');
        }
      })
      .catch(err => console.error('Failed to load integrations status:', err));
  }, [id]);

  // --- Right column: Note dispatching ---
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSavingNote(true);
    try {
      const res = await addEnquiryNote(id, newNote);
      if (res.success) {
        setNewNote('');
        // Reload details to update notes and timeline
        await fetchEnquiryDetails();
      }
    } catch (err) {
      alert('Failed to save note log.');
    } finally {
      setIsSavingNote(false);
    }
  };

  // --- Right column: Status setting ---
  const handleUpdateStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      const res = await updateEnquiryStatus(id, selectedStatus);
      if (res.success) {
        await fetchEnquiryDetails();
      }
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // --- Right column: Follow-up Scheduling ---
  const handleSetFollowUp = async () => {
    setIsSettingFollowUp(true);
    try {
      const res = await updateEnquiryFollowUp(id, followUpDate);
      if (res.success) {
        await fetchEnquiryDetails();
        alert('Follow-up date scheduled successfully.');
      }
    } catch (err) {
      alert('Failed to update follow-up date.');
    } finally {
      setIsSettingFollowUp(false);
    }
  };

  // --- Bottom: Telegram notification tester ---
  const handleSendTelegram = async () => {
    setIsTestingTelegram(true);
    try {
      const res = await triggerTestTelegram();
      if (res.success) {
        alert('✅ Connection Test dispatched to your Telegram group.');
      }
    } catch (err) {
      alert('Telegram test notification failed. Please verify credentials in your environment.');
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleSendDirectMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setIsSendingChat(true);
    try {
      const res = await api.post(`/enquiries/${id}/message`, {
        message: chatMessage,
        platform: chatPlatform
      });
      if (res.data.success) {
        setChatMessage('');
        alert(`Message successfully sent to customer via ${chatPlatform === 'telegram' ? 'Telegram' : 'WhatsApp'}!`);
        await fetchEnquiryDetails();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to send message to customer.');
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleManualLinkTelegram = async () => {
    if (!manualChatId.trim()) return;
    setIsLinkingTelegram(true);
    try {
      const res = await linkTelegram(id, manualChatId);
      if (res.success) {
        setManualChatId('');
        alert('Telegram Chat ID manually linked successfully!');
        await fetchEnquiryDetails();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to manually link Telegram Chat ID.');
    } finally {
      setIsLinkingTelegram(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!window.confirm('Are you sure you want to unlink the Telegram Chat ID from this enquiry?')) return;
    setIsUnlinkingTelegram(true);
    try {
      const res = await unlinkTelegram(id);
      if (res.success) {
        alert('Telegram Chat ID unlinked successfully!');
        await fetchEnquiryDetails();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to unlink Telegram.');
    } finally {
      setIsUnlinkingTelegram(false);
    }
  };

  // --- Left column: Inline detail editor ---
  const handleLeftFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    if (leftErrors[name]) {
      setLeftErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateLeftForm = () => {
    const errors = {};
    if (!editFormData.customer_name.trim()) errors.customer_name = 'Full name is required';
    if (!editFormData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(editFormData.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }
    if (!editFormData.pickup_location.trim()) errors.pickup_location = 'Pickup is required';
    if (!editFormData.drop_location.trim()) errors.drop_location = 'Drop is required';
    if (!editFormData.travel_date) errors.travel_date = 'Travel date is required';
    
    setLeftErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Left details (Normally we update fields, for simplicity let's mock or patch, but wait, the database schema allows status and followups. To make details completely editable, we can write a quick endpoint or update DB directly. Since the prompt states "editable inline", let's simulate saving details or update database fields using a quick query or let's update standard details!).
  // Wait, let's see. In our backend enquiries controller we can add a route PATCH /api/enquiries/:id to update all details! That makes it extremely robust.
  // Wait, did we create PATCH /api/enquiries/:id in backend? We mapped routes for status and followups. Let's add a PATCH /api/enquiries/:id route in our backend router and controller to support inline details editing! This is a minor refinement to support the approved plan. Let's make sure it handles updating the enquiry details!
  // Wait, since we are in planning mode, let's do this backend addition during compilation! Oh, I can just create/modify files. Since it was approved, we can write a controller function to update details and map it in routes.
  // Let's implement that in the backend. I can update the enquiries controller and router to add `updateEnquiryDetails`.
  // Let's write the frontend handler first:
  const handleSaveLeftDetails = async () => {
    if (!validateLeftForm()) return;
    setIsSavingLeft(true);
    try {
      const res = await api.patch(`/enquiries/${id}`, editFormData);
      if (res.data.success) {
        setIsEditingLeft(false);
        await fetchEnquiryDetails();
        alert('Enquiry details updated successfully.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save enquiry details.');
    } finally {
      setIsSavingLeft(false);
    }
  };

  // --- Booking confirmation form ---
  const handleBookingInputChange = (e) => {
    const { name, value } = e.target;
    setBookingFormData(prev => ({ ...prev, [name]: value }));
    if (bookingErrors[name]) {
      setBookingErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateBookingForm = () => {
    const errors = {};
    if (!bookingFormData.vehicle_type.trim()) errors.vehicle_type = 'Vehicle type is required';
    if (!bookingFormData.pickup_datetime) errors.pickup_datetime = 'Pickup date & time is required';
    if (!bookingFormData.total_amount || parseFloat(bookingFormData.total_amount) <= 0) {
      errors.total_amount = 'Total amount must be greater than zero';
    }
    
    setBookingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!validateBookingForm()) return;

    setIsConfirmingBooking(true);
    try {
      const payload = {
        enquiry_id: id,
        vehicle_type: bookingFormData.vehicle_type,
        driver_name: bookingFormData.driver_name,
        driver_phone: bookingFormData.driver_phone,
        pickup_datetime: bookingFormData.pickup_datetime,
        total_amount: parseFloat(bookingFormData.total_amount),
        advance_paid: parseFloat(bookingFormData.advance_paid || 0),
        notes: bookingFormData.notes
      };

      const res = await createBooking(payload);
      if (res.success) {
        setIsBookingModalOpen(false);
        alert('Booking confirmed successfully! Redirecting to bookings panel...');
        navigate('/dashboard/bookings');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to confirm booking.');
    } finally {
      setIsConfirmingBooking(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      alert('Please enter a cancellation reason.');
      return;
    }
    setIsCancelling(true);
    try {
      const res = await api.patch(`/enquiries/${id}/status`, {
        status: 'Cancelled',
        reason: cancelReason,
        sendTelegram: sendTelegramCancel,
        sendWhatsApp: sendWhatsAppCancel
      });
      if (res.data.success) {
        setIsCancelModalOpen(false);
        setCancelReason('');
        await fetchEnquiryDetails();
        alert('Booking / Enquiry cancelled successfully!');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to cancel booking/enquiry.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Combine Notes and Status History into a single chronological timeline feed
  const timelineFeed = [
    ...notes.map(n => {
      const isCustomer = n.note.startsWith('[Customer ->');
      const isOutgoing = n.note.startsWith('[Staff ->');
      let title = 'Note Logged';
      let author = n.user_name || 'Staff';
      let cleanBody = n.note;

      if (isCustomer) {
        title = 'Customer Reply';
        author = 'Customer';
        // Strip out the bracket prefix for a cleaner text display
        cleanBody = n.note.replace(/^\[Customer -> [a-zA-Z]+\]:\s*/, '');
      } else if (isOutgoing) {
        title = 'Outgoing Message';
        author = n.user_name || 'Staff';
        cleanBody = n.note.replace(/^\[Staff -> [a-zA-Z]+\]:\s*/, '');
      }

      return {
        type: 'note',
        date: new Date(n.created_at),
        title,
        body: cleanBody,
        author
      };
    }),
    ...history.map(h => ({
      type: 'history',
      date: new Date(h.changed_at),
      title: 'Status Transition',
      body: `Status updated from ${h.old_status} to ${h.new_status}`,
      author: h.user_name || 'Staff'
    }))
  ].sort((a, b) => b.date - a.date); // Newest first

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
      
      {/* Detail Header bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => navigate('/dashboard/enquiries')}
          className="flex items-center gap-1 text-xs font-bold text-primary hover:text-accent-dark transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to Enquiries List
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-textMuted uppercase tracking-wider">
            Lead Temperature:
          </span>
          <Badge type="temperature" value={enquiry.lead_temperature} />
        </div>
      </div>

      {/* Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Left Column (60%) -> Details & Editing Form */}
        <div className="lg:col-span-6 bg-white border border-borderGray rounded-card shadow-subtle p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-borderGray pb-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-4.5 w-4.5 text-accent" />
              Customer Information
            </h3>

            {!isEditingLeft ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingLeft(true)}
                disabled={enquiry.status === 'Confirmed' || enquiry.status === 'Completed' || enquiry.status === 'Cancelled'}
              >
                Edit Details
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setIsEditingLeft(false); setLeftErrors({}); }}
                  disabled={isSavingLeft}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveLeftDetails}
                  isLoading={isSavingLeft}
                >
                  Save
                </Button>
              </div>
            )}
          </div>

          {!isEditingLeft ? (
            /* Read-Only Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs font-sans">
              <div>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Customer Name</p>
                <p className="font-bold text-textMain mt-1">{enquiry.customer_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Phone Number</p>
                <p className="font-bold text-textMain mt-1">{enquiry.phone}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Email Address</p>
                <p className="font-semibold text-textMain mt-1">{enquiry.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Trip Category</p>
                <p className="font-bold text-textMain mt-1">{enquiry.trip_type}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Enquiry Source</p>
                <p className="font-semibold text-textMain mt-1">{enquiry.source}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Pickup Location</p>
                <p className="font-semibold text-textMain mt-1">{enquiry.pickup_location}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Drop Location</p>
                <p className="font-semibold text-textMain mt-1">{enquiry.drop_location}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Travel Date</p>
                <p className="font-bold text-textMain mt-1">{formatDate(enquiry.travel_date)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Passengers</p>
                <p className="font-bold text-textMain mt-1">{enquiry.passengers}</p>
              </div>
              {enquiry.trip_type === 'Round Trip' && (
                <div>
                  <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Return Date</p>
                  <p className="font-bold text-textMain mt-1">{formatDate(enquiry.return_date)}</p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Special Requirements</p>
                <p className="font-medium text-textMain mt-1 bg-slate-50 p-3 rounded border border-borderGray leading-relaxed whitespace-pre-line">
                  {enquiry.special_requirements || 'No special requirements specified.'}
                </p>
              </div>
            </div>
          ) : (
            /* Editing Input Form */
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Customer Name"
                  name="customer_name"
                  value={editFormData.customer_name}
                  onChange={handleLeftFormChange}
                  error={leftErrors.customer_name}
                  required
                />
                <Input
                  label="Phone Number"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleLeftFormChange}
                  error={leftErrors.phone}
                  required
                />
              </div>

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleLeftFormChange}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Pickup Location"
                  name="pickup_location"
                  value={editFormData.pickup_location}
                  onChange={handleLeftFormChange}
                  error={leftErrors.pickup_location}
                  required
                />
                <Input
                  label="Drop Location"
                  name="drop_location"
                  value={editFormData.drop_location}
                  onChange={handleLeftFormChange}
                  error={leftErrors.drop_location}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Travel Date"
                  name="travel_date"
                  type="date"
                  value={editFormData.travel_date}
                  onChange={handleLeftFormChange}
                  error={leftErrors.travel_date}
                  required
                />
                <Input
                  label="Passengers"
                  name="passengers"
                  type="number"
                  min="1"
                  max="20"
                  value={editFormData.passengers}
                  onChange={handleLeftFormChange}
                />
                {editFormData.trip_type === 'Round Trip' && (
                  <Input
                    label="Return Date"
                    name="return_date"
                    type="date"
                    min={editFormData.travel_date}
                    value={editFormData.return_date}
                    onChange={handleLeftFormChange}
                  />
                )}
              </div>

              <Input
                label="Special Requirements"
                name="special_requirements"
                type="textarea"
                rows={3}
                value={editFormData.special_requirements}
                onChange={handleLeftFormChange}
              />
            </div>
          )}

        </div>

        {/* Right Column (40%) -> Operational Actions & Timeline */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Status, Follow-up, and Notes Card */}
          <div className="bg-white border border-borderGray rounded-card shadow-subtle p-6 flex flex-col gap-5 no-print">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-borderGray pb-2">
              Actions Control
            </h3>

            {/* 1. Status dropdown */}
            <div className="flex items-end gap-3">
              <Input
                label="Enquiry Status"
                type="select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={['New', 'Contacted', 'Confirmed', 'Cancelled', 'Completed']}
                className="flex-1"
                disabled={enquiry.status === 'Confirmed' || enquiry.status === 'Completed' || enquiry.status === 'Cancelled'}
              />
              <Button
                variant="primary"
                onClick={handleUpdateStatus}
                isLoading={isUpdatingStatus}
                className="h-[38px]"
                disabled={enquiry.status === 'Confirmed' || enquiry.status === 'Completed' || enquiry.status === 'Cancelled'}
              >
                Update
              </Button>
            </div>

            {/* 2. Follow up date picker */}
            <div className="flex items-end gap-3 border-t border-borderGray/50 pt-4">
              <Input
                label="Follow-up Date"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="flex-1"
                disabled={enquiry.status === 'Confirmed' || enquiry.status === 'Completed' || enquiry.status === 'Cancelled'}
              />
              <Button
                variant="outline"
                onClick={handleSetFollowUp}
                isLoading={isSettingFollowUp}
                className="h-[38px]"
                disabled={enquiry.status === 'Confirmed' || enquiry.status === 'Completed' || enquiry.status === 'Cancelled'}
              >
                Set Date
              </Button>
            </div>

            {/* 3. Notes dispatcher */}
            <form onSubmit={handleSaveNote} className="flex flex-col gap-2 border-t border-borderGray/50 pt-4">
              <Input
                label="Append Follow-up Note"
                type="textarea"
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log customer response or timings..."
              />
              <Button
                type="submit"
                variant="secondary"
                isLoading={isSavingNote}
                className="w-full"
              >
                Save Note
              </Button>
            </form>
          </div>

          {/* Direct Messaging / Chat Card */}
          <div className="bg-white border border-borderGray rounded-card shadow-subtle p-6 flex flex-col gap-5 no-print">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-borderGray pb-2 flex items-center gap-1.5">
              <MessageSquare className="h-4.5 w-4.5 text-accent" />
              Chat with Customer
            </h3>

            {/* Connection Status indicator */}
            <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded border border-borderGray text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-textMuted">Telegram Bot:</span>
                {!integrationStatus.telegramConfigured ? (
                  <span className="font-bold text-danger">🔴 Disabled (Token not set)</span>
                ) : enquiry.telegram_chat_id ? (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-success flex items-center gap-1">
                      🟢 Linked (ID: {enquiry.telegram_chat_id})
                    </span>
                    <button
                      type="button"
                      onClick={handleUnlinkTelegram}
                      disabled={isUnlinkingTelegram}
                      className="text-[10px] font-bold text-danger hover:text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 hover:bg-red-100 transition-colors"
                    >
                      {isUnlinkingTelegram ? 'Unlinking...' : 'Unlink'}
                    </button>
                  </div>
                ) : (
                  <span className="font-bold text-danger">🔴 Not Linked</span>
                )}
              </div>
              
              {integrationStatus.telegramConfigured && !enquiry.telegram_chat_id && (
                <div className="mt-1 pb-1 border-t border-borderGray/50 pt-2 flex flex-col gap-1.5">
                  <p className="text-[10px] text-textMuted leading-relaxed">
                    Customer can link their Telegram bot by opening this start link:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://t.me/sahilharshagovindcrm_bot?start=enq_${id}`}
                      className="bg-white border border-borderGray text-[10px] p-1.5 rounded flex-1 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://t.me/sahilharshagovindcrm_bot?start=enq_${id}`);
                        alert('Link copied to clipboard!');
                      }}
                      className="text-[10px] font-bold text-primary hover:text-accent"
                    >
                      Copy
                    </button>
                  </div>

                  {/* Manual link input */}
                  <div className="mt-2 flex flex-col gap-1 border-t border-borderGray/50 pt-2">
                    <p className="text-[10px] font-bold text-textMuted uppercase">Or manually link Telegram Chat ID:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 987654321"
                        value={manualChatId}
                        onChange={(e) => setManualChatId(e.target.value)}
                        className="bg-white border border-borderGray text-[10px] p-1.5 rounded flex-1 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleManualLinkTelegram}
                        disabled={isLinkingTelegram}
                        className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded hover:bg-primary-dark transition-colors"
                      >
                        {isLinkingTelegram ? 'Linking...' : 'Link'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hide WhatsApp status row temporarily */}
              {false && (
                <div className="flex items-center justify-between border-t border-borderGray/50 pt-2">
                  <span className="font-semibold text-textMuted">WhatsApp:</span>
                  {integrationStatus.whatsappConfigured ? (
                    <span className="font-bold text-success flex items-center gap-1">
                      🟢 Ready (Twilio Sandbox)
                    </span>
                  ) : (
                    <span className="font-bold text-danger flex items-center gap-1">
                      🔴 Not Configured (API Keys Missing)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Direct message sender */}
            <form onSubmit={handleSendDirectMessage} className="flex flex-col gap-4">
              <div className="flex items-center gap-4 text-xs font-semibold">
                {/* Hide WhatsApp radio selector temporarily */}
                {false && (
                  <label className={`flex items-center gap-1.5 cursor-pointer ${!integrationStatus.whatsappConfigured ? 'opacity-50' : ''}`}>
                    <input
                      type="radio"
                      name="chatPlatform"
                      value="whatsapp"
                      checked={chatPlatform === 'whatsapp'}
                      onChange={() => setChatPlatform('whatsapp')}
                      disabled={!integrationStatus.whatsappConfigured}
                      className="accent-primary"
                    />
                    WhatsApp
                  </label>
                )}

                <label className={`flex items-center gap-1.5 cursor-pointer ${(!integrationStatus.telegramConfigured || !enquiry.telegram_chat_id) ? 'opacity-50' : ''}`}>
                  <input
                    type="radio"
                    name="chatPlatform"
                    value="telegram"
                    checked={chatPlatform === 'telegram'}
                    onChange={() => setChatPlatform('telegram')}
                    disabled={!integrationStatus.telegramConfigured || !enquiry.telegram_chat_id}
                    className="accent-primary"
                  />
                  Telegram
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <Input
                  label="Message Content"
                  type="textarea"
                  rows={2}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={
                    chatPlatform === 'telegram'
                      ? 'Type message to send directly to customer Telegram...'
                      : 'Type message to send directly to customer WhatsApp...'
                  }
                  required
                />
              </div>

              <Button
                type="submit"
                variant="accent"
                isLoading={isSendingChat}
                className="w-full flex items-center justify-center gap-1.5"
              >
                <Send className="h-4 w-4" />
                Send Message
              </Button>
            </form>
          </div>

          {/* Activity Timeline chronological list */}
          <div className="bg-white border border-borderGray rounded-card shadow-subtle p-6 flex flex-col gap-4 flex-1">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-borderGray pb-2 flex items-center gap-1.5">
              <History className="h-4.5 w-4.5 text-accent" />
              Activity Timeline
            </h3>

            {timelineFeed.length === 0 ? (
              <p className="text-xs text-textMuted text-center py-6">No status logs or notes recorded.</p>
            ) : (
              <div className="overflow-y-auto max-h-[350px] pr-2 flex flex-col gap-4 font-sans text-xs">
                {timelineFeed.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start border-l-2 border-borderGray pl-4 relative">
                    {/* Small timeline dot indicator */}
                    <div className={`absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ${
                      item.type === 'note' ? 'bg-primary' : 'bg-accent'
                    }`} />
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-textMain">{item.title}</span>
                        <span className="text-[10px] text-textMuted">{formatDateTime(item.date)}</span>
                      </div>
                      <p className="text-textMuted mt-1 leading-relaxed">{item.body}</p>
                      <span className="text-[10px] text-textMain/75 block mt-1">Logged by: {item.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Bottom Option Bar */}
      <div className="bg-white p-5 border border-borderGray rounded-card shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 no-print">
        <Button
          variant="outline"
          onClick={handleSendTelegram}
          isLoading={isTestingTelegram}
          className="w-full sm:w-auto"
        >
          Send Telegram Notification Test
        </Button>

        {enquiry.status !== 'Confirmed' && enquiry.status !== 'Completed' && enquiry.status !== 'Cancelled' ? (
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="danger"
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full sm:w-auto flex items-center gap-1.5"
            >
              <XCircle className="h-4.5 w-4.5" />
              Cancel Enquiry
            </Button>
            <Button
              variant="accent"
              onClick={() => setIsBookingModalOpen(true)}
              className="w-full sm:w-auto flex items-center gap-1.5"
            >
              <CheckSquare className="h-4.5 w-4.5" />
              Mark as Confirmed Booking
            </Button>
          </div>
        ) : enquiry.status === 'Confirmed' ? (
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-semibold text-success flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-badge">
              ✅ Enquiry Converted to Active Travel Booking
            </span>
            <Button
              variant="danger"
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full sm:w-auto flex items-center gap-1.5"
            >
              <XCircle className="h-4.5 w-4.5" />
              Cancel Booking
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-xs font-semibold text-textMuted bg-slate-50 border border-borderGray px-3 py-1.5 rounded-badge">
              Enquiry closed ({enquiry.status})
            </span>
            {enquiry.status === 'Cancelled' && enquiry.cancellation_reason && (
              <span className="text-[10px] text-danger font-bold uppercase tracking-wider bg-red-50 border border-red-100 px-2.5 py-1 rounded">
                Reason: {enquiry.cancellation_reason}
              </span>
            )}
          </div>
        )}
      </div>

      {/* --- CONFIRM BOOKING & GENERATE INVOICE MODAL --- */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => { setIsBookingModalOpen(false); setBookingErrors({}); }}
        title="Confirm Travel Booking & Allocate Vehicle"
        size="xl"
      >
        <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4 font-sans text-left">
          
          <div className="p-3 bg-blue-50 text-primary text-xs font-medium rounded border border-blue-100 flex gap-2">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <p>Confirming this booking automatically updates the enquiry status to <b>Confirmed</b> and issues a serialization reference invoice.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Allocated Vehicle Type"
              name="vehicle_type"
              value={bookingFormData.vehicle_type}
              onChange={handleBookingInputChange}
              placeholder="e.g. Innova Crysta / Dzire Sedan"
              error={bookingErrors.vehicle_type}
              required
            />

            <Input
              label="Pickup Date & Time"
              name="pickup_datetime"
              type="datetime-local"
              value={bookingFormData.pickup_datetime}
              onChange={handleBookingInputChange}
              error={bookingErrors.pickup_datetime}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Assigned Driver Name"
              name="driver_name"
              value={bookingFormData.driver_name}
              onChange={handleBookingInputChange}
              placeholder="e.g. Ramesh K."
            />

            <Input
              label="Driver Contact Phone"
              name="driver_phone"
              type="tel"
              value={bookingFormData.driver_phone}
              onChange={handleBookingInputChange}
              placeholder="10-digit mobile"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Total Cost Amount (₹)"
              name="total_amount"
              type="number"
              min="0"
              step="0.01"
              value={bookingFormData.total_amount}
              onChange={handleBookingInputChange}
              placeholder="Total Quote Value"
              error={bookingErrors.total_amount}
              required
            />

            <Input
              label="Advance Deposit Paid (₹)"
              name="advance_paid"
              type="number"
              min="0"
              step="0.01"
              value={bookingFormData.advance_paid}
              onChange={handleBookingInputChange}
              placeholder="0.00"
            />

            <Input
              label="Payment Status"
              name="payment_status"
              type="select"
              value={bookingFormData.payment_status}
              onChange={handleBookingInputChange}
              options={['Pending', 'Partial', 'Paid']}
              required
            />
          </div>

          <Input
            label="Additional Booking Notes"
            name="notes"
            type="textarea"
            rows={2}
            value={bookingFormData.notes}
            onChange={handleBookingInputChange}
            placeholder="Driver instructions, route restrictions, payment timelines..."
          />

          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-borderGray">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsBookingModalOpen(false); setBookingErrors({}); }}
              disabled={isConfirmingBooking}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="sm"
              isLoading={isConfirmingBooking}
              className="flex items-center gap-1"
            >
              <Car className="h-4.5 w-4.5" />
              Confirm Booking & Generate INV
            </Button>
          </div>

        </form>
      </Modal>

      {/* --- CANCEL BOOKING / ENQUIRY MODAL --- */}
      {isCancelModalOpen && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => { setIsCancelModalOpen(false); setCancelReason(''); setSendTelegramCancel(true); setSendWhatsAppCancel(true); }}
          title="Cancel Booking / Enquiry"
        >
          <form onSubmit={handleCancelSubmit} className="flex flex-col gap-4 font-sans text-left">
            
            <div className="p-3 bg-red-50 text-danger text-xs font-medium rounded border border-red-100 flex gap-2">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <p>You are about to cancel this booking/enquiry. This action will change the status to <b>Cancelled</b> and log the cancellation reason on the timeline.</p>
            </div>

            <Input
              label="Reason for Cancellation"
              type="textarea"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Type reason for cancellation here..."
              required
            />

            <div className="flex flex-col gap-2 border-t border-borderGray/50 pt-3">
              <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider">
                Send Notifications
              </span>
              
              {enquiry.telegram_chat_id ? (
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendTelegramCancel}
                    onChange={(e) => setSendTelegramCancel(e.target.checked)}
                    className="accent-primary"
                  />
                  Send cancellation alert to customer via Telegram
                </label>
              ) : (
                <p className="text-[10px] text-textMuted italic">Telegram not linked for this customer.</p>
              )}

              {/* Hide WhatsApp cancel notification checkbox temporarily */}
              {false && integrationStatus.whatsappConfigured ? (
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendWhatsAppCancel}
                    onChange={(e) => setSendWhatsAppCancel(e.target.checked)}
                    className="accent-primary"
                  />
                  Send cancellation alert to customer via WhatsApp
                </label>
              ) : (
                false && <p className="text-[10px] text-textMuted italic">WhatsApp integration is not configured.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-borderGray pt-4 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
              >
                Close
              </Button>
              <Button
                type="submit"
                variant="danger"
                isLoading={isCancelling}
              >
                Confirm Cancellation
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
