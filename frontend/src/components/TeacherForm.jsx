// frontend/src/components/TeacherForm.jsx

import { useState, useEffect } from 'react';
import { TEACHERS_URL as API_URL, apiFetch } from '../api';

const EMPTY_FORM = {
  username: '',
  employeeId: '',
  name: '',
  picture: '',
  phone: '',
  email: '',
  department: '',
  designation: '',
  experience: '',
  salary: '',
  joiningDate: '',
};

const DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Physics',
  'Chemistry',
];

const DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Lab Instructor',
];

// ── Validators ────────────────────────────────────
const validators = {
  username: (v) => {
    if (!v.trim()) return 'Username is required';
    if (v.length < 3) return 'Username must be at least 3 characters';
    return '';
  },
  employeeId: (v) => {
    if (!v.trim()) return 'Employee ID is required';
    if (v.length < 3) return 'Employee ID is too short';
    return '';
  },
  name: (v) => (!v.trim() ? 'Teacher name is required' : ''),
  picture: (v) =>
    v.trim() && !/^https?:\/\/.+/i.test(v)
      ? 'Picture must be a valid URL'
      : '',
  phone: (v) => {
    if (!v.trim()) return 'Phone is required';
    if (!/^\d{10,15}$/.test(v)) return 'Phone must be 10–15 digits';
    return '';
  },
  email: (v) => {
    if (!v.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email';
    return '';
  },
  department: (v) => (!v.trim() ? 'Department is required' : ''),
  designation: (v) => (!v.trim() ? 'Designation is required' : ''),
  experience: (v) => {
    if (v === '') return 'Experience is required';
    const n = Number(v);
    if (isNaN(n)) return 'Experience must be a number';
    if (n < 0) return 'Experience cannot be negative';
    if (n > 60) return 'Experience must be 60 or less';
    return '';
  },
  salary: (v) => {
    if (v === '') return 'Salary is required';
    const n = Number(v);
    if (isNaN(n)) return 'Salary must be a number';
    if (n < 0) return 'Salary cannot be negative';
    return '';
  },
  joiningDate: () => '', // optional
};

function TeacherForm({
  onTeacherAdded,
  editingTeacher,
  onUpdateComplete,
  onCancelEdit,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isEditMode = editingTeacher !== null;

  useEffect(() => {
    if (editingTeacher) {
      setFormData({
        username: editingTeacher.username || '',
        employeeId: editingTeacher.employeeId || '',
        name: editingTeacher.name || '',
        picture: editingTeacher.picture || '',
        phone: editingTeacher.phone || '',
        email: editingTeacher.email || '',
        department: editingTeacher.department || '',
        designation: editingTeacher.designation || '',
        experience: editingTeacher.experience ?? '',
        salary: editingTeacher.salary ?? '',
        joiningDate: editingTeacher.joiningDate || '',
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData(EMPTY_FORM);
      setErrors({});
    }
  }, [editingTeacher]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) {
      setErrors((p) => ({ ...p, [name]: validators[name](value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors((p) => ({ ...p, [name]: validators[name](value) }));
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(validators).forEach((field) => {
      const err = validators[field](formData[field]);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateAll()) {
      setMessage({ type: 'error', text: 'Please fix the errors below.' });
      return;
    }

    setLoading(true);

    try {
      const url = isEditMode
        ? `${API_URL}/${editingTeacher._id}`
        : API_URL;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Something went wrong');

      setMessage({
        type: 'success',
        text: isEditMode
          ? 'Teacher updated successfully! ✅'
          : 'Teacher saved successfully! ✅',
      });
      resetForm();

      if (isEditMode) {
        if (onUpdateComplete) onUpdateComplete();
      } else {
        if (onTeacherAdded) onTeacherAdded();
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

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        {isEditMode ? '✏️ Edit Teacher' : 'Add New Teacher'}
      </h2>

      {message.text && (
        <div
          style={{
            ...styles.message,
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        {/* Row 1 */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Username *</label>
            <input
              type="text" name="username" value={formData.username}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="e.g. prof_ali"
              style={{ ...styles.input, ...(errors.username ? styles.inputError : {}) }}
            />
            {renderError('username')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Employee ID *</label>
            <input
              type="text" name="employeeId" value={formData.employeeId}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="e.g. EMP-2024-001"
              style={{ ...styles.input, ...(errors.employeeId ? styles.inputError : {}) }}
            />
            {renderError('employeeId')}
          </div>
        </div>

        {/* Row 2 */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Teacher Name *</label>
            <input
              type="text" name="name" value={formData.name}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="e.g. Dr. Ali Khan"
              style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
            />
            {renderError('name')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Profile Picture URL (optional)</label>
            <input
              type="text" name="picture" value={formData.picture}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="https://..."
              style={{ ...styles.input, ...(errors.picture ? styles.inputError : {}) }}
            />
            {renderError('picture')}
          </div>
        </div>

        {/* Row 3 */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Phone Number *</label>
            <input
              type="text" name="phone" value={formData.phone}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="e.g. 03001234567"
              style={{ ...styles.input, ...(errors.phone ? styles.inputError : {}) }}
            />
            {renderError('phone')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email *</label>
            <input
              type="email" name="email" value={formData.email}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="e.g. ali@example.com"
              style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
            />
            {renderError('email')}
          </div>
        </div>

        {/* Row 4 — Department + Designation */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Department *</label>
            <select
              name="department" value={formData.department}
              onChange={handleChange} onBlur={handleBlur}
              style={{ ...styles.input, ...styles.select, ...(errors.department ? styles.inputError : {}) }}
            >
              <option value="">-- Select Department --</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {renderError('department')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Designation *</label>
            <select
              name="designation" value={formData.designation}
              onChange={handleChange} onBlur={handleBlur}
              style={{ ...styles.input, ...styles.select, ...(errors.designation ? styles.inputError : {}) }}
            >
              <option value="">-- Select Designation --</option>
              {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {renderError('designation')}
          </div>
        </div>

        {/* Row 5 — Experience + Salary + Joining Date */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Experience (years) *</label>
            <input
              type="number" name="experience" value={formData.experience}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="e.g. 5"
              style={{ ...styles.input, ...(errors.experience ? styles.inputError : {}) }}
            />
            {renderError('experience')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Monthly Salary (Rs) *</label>
            <input
              type="number" name="salary" value={formData.salary}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="e.g. 85000"
              style={{ ...styles.input, ...(errors.salary ? styles.inputError : {}) }}
            />
            {renderError('salary')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Joining Date (optional)</label>
            <input
              type="date" name="joiningDate" value={formData.joiningDate}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button
            type="submit" disabled={loading}
            style={{
              ...styles.button,
              backgroundColor: isEditMode ? '#28a745' : '#007bff',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Teacher' : 'Save Teacher'}
          </button>

          {isEditMode && (
            <button type="button" onClick={handleCancel} style={styles.cancelButton}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Styles (same style system as StudentForm) ──
const styles = {
  container: {
    maxWidth: '900px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  heading: { textAlign: 'center', color: '#333', marginBottom: '20px' },
  message: {
    padding: '12px', borderRadius: '4px', marginBottom: '15px',
    textAlign: 'center', fontSize: '14px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  row: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  field: { flex: '1 1 200px', display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#444' },
  input: {
    padding: '10px', border: '1px solid #ccc', borderRadius: '4px',
    fontSize: '14px', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff',
  },
  select: { cursor: 'pointer' },
  inputError: { border: '1px solid #dc3545', backgroundColor: '#fff5f5' },
  errorText: { color: '#dc3545', fontSize: '12px', marginTop: '4px' },
  buttonRow: { display: 'flex', gap: '10px', marginTop: '10px' },
  button: {
    flex: 1, padding: '12px', color: 'white', border: 'none',
    borderRadius: '4px', fontSize: '16px',
  },
  cancelButton: {
    flex: 1, padding: '12px', backgroundColor: '#6c757d', color: 'white',
    border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer',
  },
};

export default TeacherForm;