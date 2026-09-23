// frontend/src/components/ClassForm.jsx

import { useState, useEffect } from 'react';
import { CLASSES_URL as API_URL, apiFetch } from '../api';

const EMPTY_FORM = {
  name: '',
  numericLevel: '',
  description: '',
  isActive: true,
};

// Common suggestions the user can click to fill the form faster
const QUICK_PRESETS = [
  { name: 'Nursery', numericLevel: 0 },
  { name: 'KG', numericLevel: -1 },
  { name: 'Grade 1', numericLevel: 1 },
  { name: 'Grade 2', numericLevel: 2 },
  { name: 'Grade 3', numericLevel: 3 },
  { name: 'Grade 4', numericLevel: 4 },
  { name: 'Grade 5', numericLevel: 5 },
  { name: 'Grade 6', numericLevel: 6 },
  { name: 'Grade 7', numericLevel: 7 },
  { name: 'Grade 8', numericLevel: 8 },
  { name: 'Grade 9', numericLevel: 9 },
  { name: 'Grade 10', numericLevel: 10 },
];

const validators = {
  name: (v) => {
    if (!v.trim()) return 'Class name is required';
    if (v.trim().length < 2) return 'Class name is too short';
    return '';
  },
  numericLevel: (v) => {
    if (v === '' || v === null || v === undefined) return 'Numeric level is required';
    const n = Number(v);
    if (Number.isNaN(n)) return 'Numeric level must be a number';
    if (n < -5) return 'Numeric level is too low';
    if (n > 20) return 'Numeric level is too high';
    return '';
  },
  description: () => '',
};

function ClassForm({ onClassAdded, editingClass, onUpdateComplete, onCancelEdit }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isEditMode = editingClass !== null;

  useEffect(() => {
    if (editingClass) {
      setFormData({
        name: editingClass.name || '',
        numericLevel: editingClass.numericLevel ?? '',
        description: editingClass.description || '',
        isActive: editingClass.isActive !== undefined ? editingClass.isActive : true,
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData(EMPTY_FORM);
      setErrors({});
    }
  }, [editingClass]);

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

  // Click a preset to fill name + numericLevel in one go
  const applyPreset = (preset) => {
    setFormData((p) => ({
      ...p,
      name: preset.name,
      numericLevel: preset.numericLevel,
    }));
    setErrors((p) => ({ ...p, name: '', numericLevel: '' }));
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
        ? `${API_URL}/${editingClass._id}`
        : API_URL;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({
          ...formData,
          numericLevel: Number(formData.numericLevel),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setMessage({
        type: 'success',
        text: isEditMode
          ? 'Class updated successfully! ✅'
          : 'Class saved successfully! ✅',
      });
      resetForm();

      if (isEditMode) {
        if (onUpdateComplete) onUpdateComplete();
      } else {
        if (onClassAdded) onClassAdded();
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
        {isEditMode ? '✏️ Edit Class' : 'Add New Class'}
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

      {/* Quick presets — click to fill the form */}
      {!isEditMode && (
        <div style={styles.presetsWrapper}>
          <div style={styles.presetsLabel}>Quick add:</div>
          <div style={styles.presetsRow}>
            {QUICK_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                style={styles.presetBtn}
                onClick={() => applyPreset(p)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        {/* Row 1: Name + Numeric Level */}
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: '2 1 300px' }}>
            <label style={styles.label}>Class Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. Grade 5"
              style={{
                ...styles.input,
                ...(errors.name ? styles.inputError : {}),
              }}
            />
            {renderError('name')}
          </div>

          <div style={{ ...styles.field, flex: '0 1 180px' }}>
            <label style={styles.label}>Numeric Level *</label>
            <input
              type="number"
              name="numericLevel"
              value={formData.numericLevel}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 5"
              style={{
                ...styles.input,
                ...(errors.numericLevel ? styles.inputError : {}),
              }}
            />
            {renderError('numericLevel')}
          </div>
        </div>

        {/* Row 2: Description */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Description (optional)</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Primary section"
              style={styles.input}
            />
          </div>
        </div>

        {/* Row 3: Active checkbox */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                style={styles.checkbox}
              />
              <span>Active</span>
            </label>
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
              ? 'Update Class'
              : 'Save Class'}
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
  presetsWrapper: {
    padding: '12px',
    backgroundColor: '#eef3fb',
    borderRadius: '8px',
    marginBottom: '18px',
  },
  presetsLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#4a72c4',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  presetsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  presetBtn: {
    padding: '5px 12px',
    backgroundColor: '#ffffff',
    border: '1px solid #4a72c4',
    color: '#4a72c4',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease',
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
  },
  checkbox: { width: '18px', height: '18px', cursor: 'pointer' },
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

export default ClassForm;