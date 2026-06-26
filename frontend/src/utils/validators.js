/**
 * Checks if a string is a valid 10-digit phone number.
 */
export function validatePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
}

/**
 * Checks if a string is a valid email address.
 */
export function validateEmail(email) {
  if (!email) return true; // Email is optional in some places
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}
