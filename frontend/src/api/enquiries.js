import api from './api';

/**
 * Public enquiry creation
 */
export async function createEnquiry(enquiryData) {
  const response = await api.post('/enquiries', enquiryData);
  return response.data;
}

/**
 * Fetch enquiries with dynamic filters (paginated)
 */
export async function getEnquiries(params = {}) {
  const response = await api.get('/enquiries', { params });
  return response.data;
}

/**
 * Fetch a single enquiry details (including status history and note threads)
 */
export async function getEnquiryById(id) {
  const response = await api.get(`/enquiries/${id}`);
  return response.data;
}

/**
 * Update the status of an enquiry (triggers Telegram alert on Confirmed)
 */
export async function updateEnquiryStatus(id, status) {
  const response = await api.patch(`/enquiries/${id}/status`, { status });
  return response.data;
}

/**
 * Update the follow-up date for an enquiry
 */
export async function updateEnquiryFollowUp(id, followUpDate) {
  const response = await api.patch(`/enquiries/${id}/followup`, { follow_up_date: followUpDate });
  return response.data;
}

/**
 * Add a new executive note to the enquiry
 */
export async function addEnquiryNote(id, noteText) {
  const response = await api.post(`/enquiries/${id}/notes`, { note: noteText });
  return response.data;
}

/**
 * Get active follow-ups due today
 */
export async function getFollowUpsToday() {
  const response = await api.get('/enquiries/followups/today');
  return response.data;
}

/**
 * Retrieve dashboard summaries
 */
export async function getDashboardStats() {
  const response = await api.get('/dashboard/stats');
  return response.data;
}

/**
 * Send test Telegram alert
 */
export async function triggerTestTelegram() {
  const response = await api.post('/notifications/telegram/test');
  return response.data;
}

/**
 * Link Telegram Chat ID manually
 */
export async function linkTelegram(id, telegramChatId) {
  const response = await api.patch(`/enquiries/${id}/telegram`, { telegram_chat_id: telegramChatId });
  return response.data;
}

/**
 * Unlink Telegram Chat ID
 */
export async function unlinkTelegram(id) {
  const response = await api.patch(`/enquiries/${id}/telegram`, { telegram_chat_id: null });
  return response.data;
}
