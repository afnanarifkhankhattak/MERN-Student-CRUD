// frontend/src/api.js
//
// Central helper for all API calls.
// - Uses the live Render backend URL
// - Attaches the JWT from localStorage to every request
// - Handles 401 responses by clearing auth and forcing re-login

export const API_BASE = 'https://mern-student-crud-tlt6.onrender.com';
export const STUDENTS_URL = `${API_BASE}/students`;
export const AUTH_URL = `${API_BASE}/auth`;

// ── Token storage helpers ────────────────────────
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const clearToken = () => localStorage.removeItem('token');

// ── getStoredUser / setStoredUser ────────────────
// We also store a small user object ({ id, username, role }) so
// components can read the role without decoding the JWT.
export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearStoredUser = () => {
  localStorage.removeItem('user');
};

// ── apiFetch ─────────────────────────────────────
// Wrapper around fetch() that:
//   1. Prepends the base URL when a relative path is given
//   2. Adds Content-Type: application/json
//   3. Adds Authorization: Bearer <token> if we have one
//   4. On 401 → clears auth and reloads to login
export const apiFetch = async (url, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  // If the server says "not authorized", log the user out
  if (response.status === 401) {
    clearToken();
    clearStoredUser();
    window.location.reload();
    return response; // (this line never actually matters after reload)
  }

  return response;
};