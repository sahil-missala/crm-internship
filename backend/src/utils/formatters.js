/**
 * Calculate the dynamic Lead Temperature (Hot, Warm, Cold) based on enquiry details.
 * @param {Object} enquiry - The enquiry database record.
 * @param {number} notesCount - The number of notes attached to the enquiry.
 * @returns {string} 'Hot' | 'Warm' | 'Cold'
 */
function getLeadTemperature(enquiry, notesCount = 0) {
  const status = enquiry.status || 'New';
  
  // Completed or Cancelled leads are immediately Cold
  if (status === 'Completed' || status === 'Cancelled') {
    return 'Cold';
  }

  const travelDate = new Date(enquiry.travel_date);
  const today = new Date();
  
  // Set times to midnight to calculate date-only difference
  today.setHours(0, 0, 0, 0);
  travelDate.setHours(0, 0, 0, 0);

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.ceil((travelDate - today) / msPerDay);

  // If travel date has already passed, categorize as Cold
  if (diffDays < 0) {
    return 'Cold';
  }

  const passengers = parseInt(enquiry.passengers || 1);
  const source = enquiry.source || 'Other';

  // --- 1. HOT LEAD RULES ---
  // A. Travel date within 3 days and still active
  const travelDateSoon = diffDays <= 3 && (status === 'New' || status === 'Contacted');
  // B. WhatsApp/Phone Call source and travel date within 7 days
  const directSourceSoon = (source === 'WhatsApp' || source === 'Phone Call') && diffDays <= 7;
  // C. High capacity group travel (8+ passengers)
  const groupBooking = passengers >= 8;

  if (travelDateSoon || directSourceSoon || groupBooking) {
    return 'Hot';
  }

  // --- 2. WARM LEAD RULES ---
  // A. Travel date within 14 days
  const travelDateMedium = diffDays <= 14;
  // B. Word-of-mouth Reference and travel date within 30 days
  const referenceMedium = source === 'Reference' && diffDays <= 30;
  // C. Active callbacks with notes saved but not yet booked
  const activeEngagement = status === 'Contacted' && notesCount > 0;

  if (travelDateMedium || referenceMedium || activeEngagement) {
    return 'Warm';
  }

  // --- 3. DEFAULT COLD LEAD ---
  return 'Cold';
}

/**
 * Padds booking IDs to 4-digits for invoice serialization.
 */
function formatInvoiceNumber(bookingId, createdDate = new Date()) {
  const year = createdDate.getFullYear();
  const month = String(createdDate.getMonth() + 1).padStart(2, '0');
  const paddedId = String(bookingId).padStart(4, '0');
  return `INV-${year}-${month}-${paddedId}`;
}

module.exports = {
  getLeadTemperature,
  formatInvoiceNumber
};
