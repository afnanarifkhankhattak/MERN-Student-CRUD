// frontend/src/components/StudentForm.jsx

import { useState, useEffect } from 'react';
import {
  STUDENTS_URL as API_URL,
  CLASSES_URL,
  SECTIONS_URL,
  ACADEMIC_YEARS_URL,
  apiFetch,
} from '../api';

// ── Form's initial empty state ──────────────────
const EMPTY_FORM = {
  // Legacy fields
  username: '',
  regNo: '',
  name: '',
  picture: '',
  phone: '',
  age: '',
  email: '',
  department: '',
  semester: '',

  // New school-style fields
  admissionNo: '',
  firstName: '',
  lastName: '',
  dob: '',
  gender: '',
  address: '',
  bloodGroup: '',
  class: '',
  section: '',
  rollNo: '',
  admissionDate: '',
  academicYear: '',
  status: 'active',
};

// ── Fixed option lists ────────────────────────────
const DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Physics',
  'Chemistry',
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'alumni', label: 'Alumni' },
];

// ── Validation rules ─────────────────────────────
const validators = {
  username: (v) => {
    if (!v.trim()) return 'Username is required';
    if (v.length < 3) return 'Username must be at least 3 characters';
    if (v.length > 30) return 'Username must be at most 30 characters';
    return '';
  },
  regNo: (v) => {
    if (!v.trim()) return 'Registration number is required';
    if (v.length < 3) return 'Registration number is too short';
    return '';
  },
  name: (v) => {
    if (!v.trim()) return 'Student name is required';
    if (v.length < 2) return 'Name is too short';
    return '';
  },
  picture: (v) => {
    if (v.trim() && !/^https?:\/\/.+/i.test(v)) {
      return 'Picture must be a valid URL (starting with http:// or https://)';
    }
    return '';
  },
  phone: (v) => {
    if (!v.trim()) return 'Phone number is required';
    if (!/^\d{10,15}$/.test(v)) {
      return 'Phone must be 10–15 digits (no spaces, dashes, or letters)';
    }
    return '';
  },
  age: (v) => {
    if (v === '') return 'Age is required';
    const num = Number(v);
    if (Number.isNaN(num)) return 'Age must be a number';
    if (num < 3) return 'Age must be at least 3';
    if (num > 80) return 'Age must be at most 80';
    return '';
  },
  email: (v) => {
    if (!v.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return 'Enter a valid email like name@example.com';
    }
    return '';
  },
  department: () => '',
  semester: () => '',
  admissionNo: () => '',
  firstName: () => '',
  lastName: () => '',
  dob: () => '',
  gender: () => '',
  address: () => '',
  bloodGroup: () => '',
  class: () => '',
  section: () => '',
  rollNo: () => '',
  admissionDate: () => '',
  academicYear: () => '',
  status: () => '',
};

function StudentForm({
  onStudentAdded,
  editingStudent,
  onUpdateComplete,
  onCancelEdit,
  knownDepartments = [],
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Options loaded from the backend
  const [classes, setClasses] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const isEditMode = editingStudent !== null;

  // ── Load dropdown options on mount ────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [classRes, sectionRes, yearRes] = await Promise.all([
          apiFetch(CLASSES_URL),
          apiFetch(SECTIONS_URL),
          apiFetch(ACADEMIC_YEARS_URL),
        ]);
        const classData = await classRes.json();
        const sectionData = await sectionRes.json();
        const yearData = await yearRes.json();

        if (classRes.ok) setClasses(classData.data || []);
        if (sectionRes.ok) setAllSections(sectionData.data || []);
        if (yearRes.ok) setAcademicYears(yearData.data || []);
      } catch (e) {
        console.error('Failed to load dropdown data', e);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  // ── Filter sections by the selected class ─────
  const filteredSections = allSections.filter((s) => {
    const sectionClassId =
      typeof s.class === 'object' ? s.class?._id : s.class;
    return sectionClassId === formData.class;
  });

  // ── Populate form when editing ────────────────
  useEffect(() => {
    if (editingStudent) {
      setFormData({
        // Legacy
        username: editingStudent.username || '',
        regNo: editingStudent.regNo || '',
        name: editingStudent.name || '',
        picture: editingStudent.picture || '',
        phone: editingStudent.phone || '',
        age: editingStudent.age ?? '',
        email: editingStudent.email || '',
        department: editingStudent.department || '',
        semester: editingStudent.semester ?? '',

        // New
        admissionNo: editingStudent.admissionNo || '',
        firstName: editingStudent.firstName || '',
        lastName: editingStudent.lastName || '',
        dob: editingStudent.dob || '',
        gender: editingStudent.gender || '',
        address: editingStudent.address || '',
        bloodGroup: editingStudent.bloodGroup || '',
        class:
          typeof editingStudent.class === 'object' && editingStudent.class
            ? editingStudent.class._id
            : editingStudent.class || '',
        section:
          typeof editingStudent.section === 'object' && editingStudent.section
            ? editingStudent.section._id
            : editingStudent.section || '',
        rollNo: editingStudent.rollNo || '',
        admissionDate: editingStudent.admissionDate || '',
        academicYear:
          typeof editingStudent.academicYear === 'object' &&
          editingStudent.academicYear
            ? editingStudent.academicYear._id
            : editingStudent.academicYear || '',
        status: editingStudent.status || 'active',
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData(EMPTY_FORM);
      setErrors({});
    }
  }, [editingStudent]);

  // ── Handle input changes ──────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // When class changes, reset section (it may not belong to the new class)
      if (name === 'class') {
        next.section = '';
      }
      return next;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (validators[name]) {
      setErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
    }
  };

  // ── Validate ──────────────────────────────────
  const validateAll = () => {
    const newErrors = {};
    Object.keys(validators).forEach((field) => {
      const error = validators[field](formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Reset ─────────────────────────────────────
  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
  };

  // ── Submit ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateAll()) {
      setMessage({
        type: 'error',
        text: 'Please fix the errors below and try again.',
      });
      return;
    }

    setLoading(true);

    try {
      const url = isEditMode ? `${API_URL}/${editingStudent._id}` : API_URL;
      const method = isEditMode ? 'PUT' : 'POST';

      // Convert empty reference strings to null so Mongoose doesn't
      // try to cast "" to an ObjectId
      const payload = {
        ...formData,
        class: formData.class || null,
        section: formData.section || null,
        academicYear: formData.academicYear || null,
      };

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Something went wrong');

      setMessage({
        type: 'success',
        text: isEditMode
          ? 'Student updated successfully! ✅'
          : 'Student saved successfully! ✅',
      });
      resetForm();

      if (isEditMode) {
        if (onUpdateComplete) onUpdateComplete();
      } else {
        if (onStudentAdded) onStudentAdded();
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setMessage({ type: '', text: '' });
    if (onCancelEdit) onCancelEdit();
  };

  const renderError = (field) =>
    errors[field] ? <span style={styles.errorText}>{errors[field]}</span> : null;

  // ── Render ────────────────────────────────────
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        {isEditMode ? '✏️ Edit Student' : 'Add New Student'}
      </h2>

      {message.text && (
        <div
          style={{
            ...styles.message,
            backgroundColor:
              message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${
              message.type === 'success' ? '#c3e6cb' : '#f5c6cb'
            }`,
          }}
        >
          {message.text}
        </div>
      )}

      {loadingOptions && (
        <div style={styles.loadingMsg}>Loading form options...</div>
      )}

      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        {/* ── Section heading: Basic info ──── */}
        <h3 style={styles.sectionHeading}>Basic Information</h3>

        {/* Row 1: Username + Reg No */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. ali123"
              style={{ ...styles.input, ...(errors.username ? styles.inputError : {}) }}
            />
            {renderError('username')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Registration Number *</label>
            <input
              type="text"
              name="regNo"
              value={formData.regNo}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 2024-CS-001"
              style={{ ...styles.input, ...(errors.regNo ? styles.inputError : {}) }}
            />
            {renderError('regNo')}
          </div>
        </div>

        {/* Row 2: Full name + picture */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. Ali Khan"
              style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
            />
            {renderError('name')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Profile Picture URL</label>
            <input
              type="text"
              name="picture"
              value={formData.picture}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://..."
              style={{ ...styles.input, ...(errors.picture ? styles.inputError : {}) }}
            />
            {renderError('picture')}
          </div>
        </div>

        {/* ── Section heading: Personal ──── */}
        <h3 style={styles.sectionHeading}>Personal Details</h3>

        {/* Row 3: First + Last */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="e.g. Ali"
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="e.g. Khan"
              style={styles.input}
            />
          </div>
        </div>

        {/* Row 4: DOB + Gender */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              style={{ ...styles.input, ...styles.select }}
            >
              <option value="">-- Select --</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Blood Group</label>
            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              style={{ ...styles.input, ...styles.select }}
            >
              <option value="">-- Select --</option>
              {BLOOD_GROUPS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 5: Contact info */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Phone *</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 03001234567"
              style={{ ...styles.input, ...(errors.phone ? styles.inputError : {}) }}
            />
            {renderError('phone')}
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. ali@example.com"
              style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
            />
            {renderError('email')}
          </div>
          <div style={{ ...styles.field, flex: '0 1 120px' }}>
            <label style={styles.label}>Age *</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 12"
              style={{ ...styles.input, ...(errors.age ? styles.inputError : {}) }}
            />
            {renderError('age')}
          </div>
        </div>

        {/* Row 6: Address */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. House 12, Street 5, Islamabad"
              style={styles.input}
            />
          </div>
        </div>

        {/* ── Section heading: Academic ──── */}
        <h3 style={styles.sectionHeading}>Academic Details</h3>

        {/* Row 7: Admission No + Admission Date */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Admission Number</label>
            <input
              type="text"
              name="admissionNo"
              value={formData.admissionNo}
              onChange={handleChange}
              placeholder="e.g. ADM-2024-001"
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Admission Date</label>
            <input
              type="date"
              name="admissionDate"
              value={formData.admissionDate}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Academic Year</label>
            <select
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              disabled={loadingOptions}
              style={{ ...styles.input, ...styles.select }}
            >
              <option value="">-- Select --</option>
              {academicYears.map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name} {y.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 8: Class + Section (cascading) */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Class</label>
            <select
              name="class"
              value={formData.class}
              onChange={handleChange}
              disabled={loadingOptions}
              style={{ ...styles.input, ...styles.select }}
            >
              <option value="">-- Select Class --</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Section</label>
            <select
              name="section"
              value={formData.section}
              onChange={handleChange}
              disabled={loadingOptions || !formData.class}
              style={{ ...styles.input, ...styles.select }}
            >
              <option value="">
                {formData.class
                  ? filteredSections.length > 0
                    ? '-- Select Section --'
                    : '-- No sections for this class --'
                  : '-- Select Class first --'}
              </option>
              {filteredSections.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.field, flex: '0 1 140px' }}>
            <label style={styles.label}>Roll No</label>
            <input
              type="text"
              name="rollNo"
              value={formData.rollNo}
              onChange={handleChange}
              placeholder="e.g. 12"
              style={styles.input}
            />
          </div>
        </div>

        {/* Row 9: Legacy department + semester */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Department (legacy)</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              style={{ ...styles.input, ...styles.select }}
            >
              <option value="">-- Select --</option>
              {[...new Set([...DEPARTMENTS, ...knownDepartments])].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Semester (legacy)</label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              style={{ ...styles.input, ...styles.select }}
            >
              <option value="">-- Select --</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{ ...styles.input, ...styles.select }}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div style={styles.buttonRow}>
          <button
            type="submit"
            disabled={loading || loadingOptions}
            style={{
              ...styles.button,
              backgroundColor: isEditMode ? '#28a745' : '#007bff',
              opacity: loading || loadingOptions ? 0.6 : 1,
              cursor: loading || loadingOptions ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? 'Saving...'
              : isEditMode
              ? 'Update Student'
              : 'Save Student'}
          </button>

          {isEditMode && (
            <button
              type="button"
              onClick={handleCancel}
              style={styles.cancelButton}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Styles ───────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1000px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  heading: { textAlign: 'center', color: '#333', marginBottom: '20px' },
  sectionHeading: {
    fontSize: '14px',
    color: '#4a72c4',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #e3e8f0',
    paddingBottom: '6px',
    marginTop: '12px',
    marginBottom: '0',
  },
  loadingMsg: {
    textAlign: 'center',
    color: '#4a72c4',
    fontSize: '13px',
    marginBottom: '12px',
    fontStyle: 'italic',
  },
  message: {
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px',
    textAlign: 'center',
    fontSize: '14px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  row: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  field: { flex: '1 1 200px', display: 'flex', flexDirection: 'column' },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '13px',
    color: '#444',
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#fff',
  },
  select: { cursor: 'pointer' },
  inputError: { border: '1px solid #dc3545', backgroundColor: '#fff5f5' },
  errorText: { color: '#dc3545', fontSize: '12px', marginTop: '4px' },
  buttonRow: { display: 'flex', gap: '10px', marginTop: '10px' },
  button: {
    flex: 1,
    padding: '12px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
  },
};

export default StudentForm;