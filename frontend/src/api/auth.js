import api from './api';

/**
 * Perform login request
 */
export async function login(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}
