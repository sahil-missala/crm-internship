/**
 * Formats a date string (YYYY-MM-DD) into a user-friendly format (e.g. "24 Jun 2026").
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Formats an ISO datetime string into a readable datetime string (e.g. "24 Jun 2026, 06:00 AM").
 */
export function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '-';
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return dateTimeString;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

  return `${day} ${month} ${year}, ${timeStr}`;
}

/**
 * Formats a numeric string or number as Indian Rupee (INR).
 */
export function formatCurrency(amount) {
  const value = parseFloat(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(value);
}
