import React, { useState } from 'react';
import { createEnquiry } from '../../api/enquiries';
import { validatePhone, validateEmail } from '../../utils/validators';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Compass, CalendarCheck, PhoneCall, Sparkles, Send, MessageSquare } from 'lucide-react';

export default function EnquiryForm() {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    source: 'Website', // Public website portal default
    trip_type: '',
    pickup_location: '',
    drop_location: '',
    travel_date: '',
    return_date: '',
    passengers: 1,
    special_requirements: ''
  });

  const [submissionDetails, setSubmissionDetails] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleValidation = () => {
    const newErrors = {};

    if (!formData.customer_name.trim()) newErrors.customer_name = 'Full name is required';
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.trip_type) newErrors.trip_type = 'Please select a trip type';
    if (!formData.pickup_location.trim()) newErrors.pickup_location = 'Pickup location is required';
    if (!formData.drop_location.trim()) newErrors.drop_location = 'Drop location is required';
    if (!formData.travel_date) newErrors.travel_date = 'Travel date is required';
    
    if (formData.travel_date && formData.travel_date < todayStr) {
      newErrors.travel_date = 'Travel date cannot be in the past';
    }

    if (formData.trip_type === 'Round Trip') {
      if (!formData.return_date) {
        newErrors.return_date = 'Return date is required for Round Trips';
      } else if (formData.return_date < formData.travel_date) {
        newErrors.return_date = 'Return date cannot be before travel date';
      }
    }

    const passengersNum = parseInt(formData.passengers);
    if (isNaN(passengersNum) || passengersNum < 1 || passengersNum > 20) {
      newErrors.passengers = 'Number of passengers must be between 1 and 20';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    if (!handleValidation()) return;

    setIsLoading(true);
    try {
      const payload = { ...formData };
      // If not a round trip, clear the return date
      if (formData.trip_type !== 'Round Trip') {
        payload.return_date = '';
      }
      
      const response = await createEnquiry(payload);
      if (response.success) {
        setSubmissionDetails(response);
        setIsSubmitted(true);
      } else {
        setServerError(response.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      const backendErr = err.response?.data?.errors;
      if (backendErr && Array.isArray(backendErr)) {
        // Map express-validator fields
        const fieldErrors = {};
        backendErr.forEach((e) => {
          fieldErrors[e.path] = e.msg;
        });
        setErrors(fieldErrors);
      } else {
        setServerError(err.response?.data?.error || 'Unable to submit enquiry. Please check your network connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      customer_name: '',
      phone: '',
      email: '',
      source: 'Website',
      trip_type: '',
      pickup_location: '',
      drop_location: '',
      travel_date: '',
      return_date: '',
      passengers: 1,
      special_requirements: ''
    });
    setSubmissionDetails(null);
    setErrors({});
    setIsSubmitted(false);
    setServerError('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surfaceBg pb-16 font-sans">
      {/* Hero Header Section */}
      <div className="w-full bg-gradient-to-r from-primary via-primary-light to-primary-dark text-white py-12 px-6 shadow-md relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute bottom-[-30px] left-[10%] w-36 h-36 rounded-full bg-white/5" />

        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-3 bg-white/10 px-4 py-1.5 rounded-full border border-white/15">
            <Compass className="h-5 w-5 text-accent animate-spin-slow" />
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              Manivtha Tours & Travels
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
            Plan Your Next Adventure With Us
          </h1>
          <p className="text-sm text-white/80 mt-2 max-w-md leading-relaxed font-light">
            Tell us your travel plans. We'll take care of the rest.
          </p>
        </div>
      </div>

      {/* Main Form Box */}
      <div className="flex-1 flex justify-center px-4 -mt-8 relative z-10">
        <div className="w-full max-w-[560px] bg-white rounded-card shadow-card border border-borderGray p-8">
          
          {isSubmitted ? (
            /* Successful confirmation card */
            <div className="text-center py-6 px-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="h-16 w-16 bg-emerald-50 text-success rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100">
                <CalendarCheck className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-textMain mb-1">
                Enquiry Received Successfully!
              </h2>
              <p className="text-xs text-textMuted leading-relaxed max-w-sm mx-auto mb-6">
                Our booking coordinator will review your requirements and get in touch with you within <span className="font-semibold text-primary">2 hours</span>.
              </p>

              {/* Bot Linking Section */}
              {submissionDetails && (
                <div className="bg-slate-50 border border-borderGray rounded-card p-5 mb-6 text-left flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-borderGray pb-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Get Real-Time Bot Updates
                  </h3>
                  
                  {/* Telegram */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-textMuted uppercase">Option 1: Telegram updates</span>
                    <a
                      href={`https://t.me/${submissionDetails.telegram_bot_username}?start=enq_${submissionDetails.enquiry_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-bold py-2 px-4 rounded-badge shadow-sm transition-colors w-full"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Link with Telegram Bot
                    </a>
                  </div>

                  {/* WhatsApp */}
                  {false && (
                    <div className="flex flex-col gap-1.5 border-t border-borderGray/50 pt-3">
                      <span className="text-[10px] font-bold text-textMuted uppercase">Option 2: WhatsApp updates</span>
                      <p className="text-[11px] text-textMuted leading-relaxed">
                        To receive updates via WhatsApp, save our number and send a message with the join keyword:
                      </p>
                      <div className="bg-white border border-borderGray rounded p-2 text-center text-xs font-mono font-bold text-textMain">
                        {submissionDetails.whatsapp_sandbox_keyword}
                      </div>
                      <p className="text-[9px] text-textMuted/75 italic">
                        Note: You must send this message first to opt-in due to API verification guidelines.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="border-t border-borderGray pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-bold text-accent-dark hover:text-accent hover:underline focus:outline-none"
                >
                  Submit another enquiry
                </button>
              </div>
            </div>
          ) : (
            /* Main Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-borderGray pb-3">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-accent" />
                  Travel Request Details
                </h3>
                <span className="text-[10px] font-semibold text-textMuted uppercase">All fields required *</span>
              </div>

              {serverError && (
                <div className="p-3 bg-red-50 text-danger text-xs font-semibold rounded border border-red-200">
                  ⚠️ {serverError}
                </div>
              )}

              {/* Passenger Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  error={errors.customer_name}
                  required
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                  error={errors.phone}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email Address (Optional)"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                  error={errors.email}
                />

                <Input
                  label="Trip Type"
                  name="trip_type"
                  type="select"
                  value={formData.trip_type}
                  onChange={handleInputChange}
                  placeholder="Choose trip type"
                  options={[
                    'One-Way Drop',
                    'Round Trip',
                    'Airport Transfer',
                    'Outstation',
                    'Hill Station',
                    'Custom'
                  ]}
                  error={errors.trip_type}
                  required
                />
              </div>

              {/* Pickup / Drop locations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Pickup Location"
                  name="pickup_location"
                  value={formData.pickup_location}
                  onChange={handleInputChange}
                  placeholder="Pickup address/landmark"
                  error={errors.pickup_location}
                  required
                />

                <Input
                  label="Drop Location"
                  name="drop_location"
                  value={formData.drop_location}
                  onChange={handleInputChange}
                  placeholder="Destination address/landmark"
                  error={errors.drop_location}
                  required
                />
              </div>

              {/* Dates and Passengers grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Travel Date"
                  name="travel_date"
                  type="date"
                  min={todayStr}
                  value={formData.travel_date}
                  onChange={handleInputChange}
                  error={errors.travel_date}
                  required
                />

                <Input
                  label="Number of Passengers"
                  name="passengers"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.passengers}
                  onChange={handleInputChange}
                  error={errors.passengers}
                  required
                />
              </div>

              {/* Dynamic Return Date */}
              {formData.trip_type === 'Round Trip' && (
                <div className="animate-in slide-in-from-top-3 duration-200">
                  <Input
                    label="Return Date"
                    name="return_date"
                    type="date"
                    min={formData.travel_date || todayStr}
                    value={formData.return_date}
                    onChange={handleInputChange}
                    error={errors.return_date}
                    required
                  />
                </div>
              )}

              {/* Enquiry Source (Public default Website, admin portal will display full dropdown) */}
              <input type="hidden" name="source" value="Website" />

              <Input
                label="Special Requirements (Optional)"
                name="special_requirements"
                type="textarea"
                rows={3}
                value={formData.special_requirements}
                onChange={handleInputChange}
                placeholder="Any preferences for vehicle (e.g. SUV, Sedan), stops, or specific timings?"
                error={errors.special_requirements}
              />

              <Button
                type="submit"
                variant="accent"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Submit Enquiry
              </Button>
            </form>
          )}

        </div>
      </div>

      {/* Footer Branding */}
      <footer className="text-center text-xs text-textMuted mt-12 px-6 select-none">
        <p>© 2026 Manivtha Tours & Travels CRM. All rights reserved.</p>
        <p className="mt-1 text-[10px] text-textMuted/60">Reliable car rentals and travel itineraries since 2012.</p>
      </footer>
    </div>
  );
}
