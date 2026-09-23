// frontend/src/api.js

// ── Backend base URL ────────────────────────────
export const API_BASE = 'https://mern-student-crud-tlt6.onrender.com';

// ── Existing endpoints ──────────────────────────
export const STUDENTS_URL = `${API_BASE}/students`;
export const TEACHERS_URL = `${API_BASE}/teachers`;
export const COURSES_URL = `${API_BASE}/courses`;
export const AUTH_URL = `${API_BASE}/auth`;

// ── Legacy fee endpoint ─────────────────────────
export const FEES_URL = `${API_BASE}/fees`;

// ── Academic Foundation endpoints ───────────────
export const ACADEMIC_YEARS_URL = `${API_BASE}/academic-years`;
export const CLASSES_URL = `${API_BASE}/classes`;
export const SECTIONS_URL = `${API_BASE}/sections`;
export const SUBJECTS_URL = `${API_BASE}/subjects`;
export const CLASS_SUBJECTS_URL = `${API_BASE}/class-subjects`;

// ── Parent endpoint ─────────────────────────────
export const PARENTS_URL = `${API_BASE}/parents`;

// ── Enrollment endpoint ─────────────────────────
export const ENROLLMENTS_URL = `${API_BASE}/enrollments`;

// ── Attendance endpoint ─────────────────────────
export const ATTENDANCE_URL = `${API_BASE}/attendance`;

// ── Exam endpoint ───────────────────────────────
export const EXAMS_URL = `${API_BASE}/exams`;

// ── Fee management endpoints ────────────────────
export const FEE_STRUCTURES_URL = `${API_BASE}/fee-structures`;
export const FEE_INVOICES_URL = `${API_BASE}/fee-invoices`;
export const FEE_PAYMENTS_URL = `${API_BASE}/fee-payments`;

// ── Accounting endpoints ────────────────────────
export const EXPENSES_URL = `${API_BASE}/expenses`;
export const ACCOUNTING_URL = `${API_BASE}/accounting`;

// ── NEW: Timetable endpoints (Phase 10) ─────────
export const PERIODS_URL = `${API_BASE}/periods`;
export const TIMETABLE_URL = `${API_BASE}/timetable`;

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

  if (response.status === 401) {
    clearToken();
    clearStoredUser();
    window.location.reload();
    return response;
  }

  return response;
};