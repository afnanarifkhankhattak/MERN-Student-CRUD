// frontend/src/components/AcademicYearForm.jsx

import { useState, useEffect } from 'react';
import { ACADEMIC_YEARS_URL as API_URL, apiFetch } from '../api';

const EMPTY_FORM = {
  name: '',
  startDate: '',
  endDate: '',
  isActive: false,
  description: '',
};

const validators = {
  name: (v) => {
    if (!v.trim()) return 'Academic year name is required';
    if (!/^\d{4}-\d{4}$/.test(v.trim()))
      return 'Format must be YYYY-YYYY (e.g. 2024-2025)';
    return '';
  },
  startDate: (v) => (!v ? 'Start date is required' : ''),
  endDate: (v) => (!v ? 'End date is required' : ''),
  description: () => '',
};

function AcademicYearForm({
  onYearAdded,
  editingYear,
  onUpdateComplete,
  onCancelEdit,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isEditMode = editingYear !== null;

  // Populate form when editing
  useEffect(() => {
    if (editingYear) {
      setFormData({
        name: editingYear.name || '',
        startDate: editingYear.startDate || '',
        endDate: editingYear.endDate || '',
        isActive: editingYear.isActive || false,
        description: editingYear.description || '',
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData(EMPTY_FORM);
      setErrors({});
    }
  }, [editingYear]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData((p) => ({ ...p, [name]: newValue }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (validators[name]) {
      setErrors((p) => ({ ...p, [name]: validators[name](value) }));
    }
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
        ? `${API_URL}/${editingYear._id}`
        : API_URL;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setMessage({
        type: 'success',
        text: isEditMode
          ? 'Academic year updated successfully! ✅'
          : 'Academic year saved successfully! ✅',
      });
      resetForm();

      if (isEditMode) {
        if (onUpdateComplete) onUpdateComplete();
      } else {
        if (onYearAdded) onYearAdded();
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
        {isEditMode ? '✏️ Edit Academic Year' : 'Add Academic Year'}
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
        {/* Row 1: Name */}
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: '2 1 300px' }}>
            <label style={styles.label}>Academic Year *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 2024-2025"
              style={{
                ...styles.input,
                ...(errors.name ? styles.inputError : {}),
              }}
            />
            {renderError('name')}
          </div>
        </div>

        {/* Row 2: Start + End dates */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Start Date *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...(errors.startDate ? styles.inputError : {}),
              }}
            />
            {renderError('startDate')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>End Date *</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...(errors.endDate ? styles.inputError : {}),
              }}
            />
            {renderError('endDate')}
          </div>
        </div>

        {/* Row 3: Active + Description */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Description (optional)</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Current session"
              style={styles.input}
            />
          </div>

          <div
            style={{
              ...styles.field,
              flex: '0 1 200px',
              justifyContent: 'flex-end',
            }}
          >
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                style={styles.checkbox}
              />
              <span>Set as Active Year</span>
            </label>
            <span style={styles.hint}>
              Only one year can be active at a time.
            </span>
          </div>
        </div>

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
              ? 'Update Year'
              : 'Save Year'}
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
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px',
    textAlign: 'center',
    fontSize: '14px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  row: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  field: { flex: '1 1 200px', display: 'flex', flexDirection: 'column' },
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
  inputError: { border: '1px solid #dc3545', backgroundColor: '#fff5f5' },
  errorText: { color: '#dc3545', fontSize: '12px', marginTop: '4px' },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#444',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '4px',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
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

export default AcademicYearForm;