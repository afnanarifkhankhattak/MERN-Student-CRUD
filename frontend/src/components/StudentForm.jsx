// frontend/src/components/StudentForm.jsx

import { useState, useEffect } from 'react';

const API_URL = 'https://mern-student-crud-tlt6.onrender.com/students';

const EMPTY_FORM = {
  username: '',
  regNo: '',
  name: '',
  picture: '',
  phone: '',
  age: '',
  email: '',
  department: '',
  semester: '',
};

// ── Options for our dropdowns ────────────────────
const DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Physics',
  'Chemistry',
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// ── Validation rules ────────────────────────────
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
    if (num < 15) return 'Age must be at least 15';
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
  department: (v) => {
    if (!v.trim()) return 'Department is required';
    return '';
  },
  semester: (v) => {
    if (v === '') return 'Semester is required';
    const num = Number(v);
    if (Number.isNaN(num)) return 'Semester must be a number';
    if (num < 1) return 'Semester must be at least 1';
    if (num > 8) return 'Semester must be at most 8';
    return '';
  },
};

function StudentForm({
  onStudentAdded,
  editingStudent,
  onUpdateComplete,
  onCancelEdit,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isEditMode = editingStudent !== null;

  // ── When editingStudent changes → fill the form ──
  useEffect(() => {
    if (editingStudent) {
      setFormData({
        username: editingStudent.username || '',
        regNo: editingStudent.regNo || '',
        name: editingStudent.name || '',
        picture: editingStudent.picture || '',
        phone: editingStudent.phone || '',
        age: editingStudent.age || '',
        email: editingStudent.email || '',
        department: editingStudent.department || '',
        semester: editingStudent.semester || '',
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData(EMPTY_FORM);
      setErrors({});
    }
  }, [editingStudent]);

  // ── Input change ────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
    }
  };

  // ── On blur ─────────────────────────────────────
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
  };

  // ── Validate the whole form ─────────────────────
  const validateAll = () => {
    const newErrors = {};
    Object.keys(validators).forEach((field) => {
      const error = validators[field](formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Reset form ──────────────────────────────────
  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
  };

  // ── Submit ──────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const isValid = validateAll();
    if (!isValid) {
      setMessage({
        type: 'error',
        text: 'Please fix the errors below and try again.',
      });
      return;
    }

    setLoading(true);

    try {
      const url = isEditMode
        ? `${API_URL}/${editingStudent._id}`
        : API_URL;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

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
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // ── Cancel edit ─────────────────────────────────
  const handleCancel = () => {
    resetForm();
    setMessage({ type: '', text: '' });
    if (onCancelEdit) onCancelEdit();
  };

  // ── Helper: error text under a field ────────────
  const renderError = (field) =>
    errors[field] ? (
      <span style={styles.errorText}>{errors[field]}</span>
    ) : null;

  // ── Render ──────────────────────────────────────
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

      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        {/* Row 1: Username + Registration Number */}
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
              style={{
                ...styles.input,
                ...(errors.username ? styles.inputError : {}),
              }}
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
              style={{
                ...styles.input,
                ...(errors.regNo ? styles.inputError : {}),
              }}
            />
            {renderError('regNo')}
          </div>
        </div>

        {/* Row 2: Student Name + Picture URL */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Student Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. Ali Khan"
              style={{
                ...styles.input,
                ...(errors.name ? styles.inputError : {}),
              }}
            />
            {renderError('name')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Profile Picture URL (optional)</label>
            <input
              type="text"
              name="picture"
              value={formData.picture}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://..."
              style={{
                ...styles.input,
                ...(errors.picture ? styles.inputError : {}),
              }}
            />
            {renderError('picture')}
          </div>
        </div>

        {/* Row 3: Phone + Age */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Phone Number *</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 03001234567"
              style={{
                ...styles.input,
                ...(errors.phone ? styles.inputError : {}),
              }}
            />
            {renderError('phone')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Age *</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 20"
              style={{
                ...styles.input,
                ...(errors.age ? styles.inputError : {}),
              }}
            />
            {renderError('age')}
          </div>
        </div>

        {/* Row 4: Email */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. ali@example.com"
              style={{
                ...styles.input,
                ...(errors.email ? styles.inputError : {}),
              }}
            />
            {renderError('email')}
          </div>
        </div>

        {/* Row 5: Department (dropdown) + Semester (dropdown) */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Department *</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...styles.select,
                ...(errors.department ? styles.inputError : {}),
              }}
            >
              <option value="">-- Select Department --</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {renderError('department')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Semester *</label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...styles.select,
                ...(errors.semester ? styles.inputError : {}),
              }}
            >
              <option value="">-- Select Semester --</option>
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
            {renderError('semester')}
          </div>
        </div>

        {/* Buttons */}
        <div style={styles.buttonRow}>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              backgroundColor: isEditMode ? '#28a745' : '#007bff',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
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

// ── Styles ────────────────────────────────────────
const styles = {
  container: {
    maxWidth: '800px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  heading: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px',
  },
  message: {
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px',
    textAlign: 'center',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  row: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
  },
  field: {
    flex: '1 1 200px',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '14px',
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
  select: {
    cursor: 'pointer',
    appearance: 'auto',
  },
  inputError: {
    border: '1px solid #dc3545',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#dc3545',
    fontSize: '12px',
    marginTop: '4px',
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
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