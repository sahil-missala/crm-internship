import api from './api';

/**
 * Confirm a booking from an enquiry (automatically marks status as Confirmed)
 */
export async function createBooking(bookingData) {
  const response = await api.post('/bookings', bookingData);
  return response.data;
}

/**
 * Get all confirmed bookings
 */
export async function getBookings() {
  const response = await api.get('/bookings');
  return response.data;
}

/**
 * Fetch invoice details for a specific booking
 */
export async function getInvoice(bookingId) {
  const response = await api.get(`/bookings/${bookingId}/invoice`);
  return response.data;
}

/**
 * Update an existing booking
 */
export async function updateBooking(bookingId, bookingData) {
  const response = await api.patch(`/bookings/${bookingId}`, bookingData);
  return response.data;
}
