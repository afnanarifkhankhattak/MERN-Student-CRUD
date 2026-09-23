// frontend/src/api.js

// ── Backend base URL ────────────────────────────
export const API_BASE = 'https://mern-student-crud-tlt6.onrender.com';

// ── Existing endpoints ──────────────────────────
export const STUDENTS_URL = `${API_BASE}/students`;
export const TEACHERS_URL = `${API_BASE}/teachers`;
export const FEES_URL = `${API_BASE}/fees`;
export const COURSES_URL = `${API_BASE}/courses`;
export const AUTH_URL = `${API_BASE}/auth`;

// ── NEW: Academic Foundation endpoints ─────────
export const ACADEMIC_YEARS_URL = `${API_BASE}/academic-years`;
export const CLASSES_URL = `${API_BASE}/classes`;
export const SECTIONS_URL = `${API_BASE}/sections`;
export const SUBJECTS_URL = `${API_BASE}/subjects`;
export const CLASS_SUBJECTS_URL = `${API_BASE}/class-subjects`;

// ── Token storage helpers ────────────────────────
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const clearToken = () => localStorage.removeItem('token');

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
//   1. Adds Content-Type header
//   2. Attaches JWT from localStorage (if any)
//   3. Auto-logs out on 401
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
    return response;
  }

  return response;
};