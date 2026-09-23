// frontend/src/components/SubjectForm.jsx

import { useState, useEffect } from 'react';
import { SUBJECTS_URL as API_URL, apiFetch } from '../api';

const EMPTY_FORM = {
  name: '',
  code: '',
  description: '',
  isCore: true,
  colorHex: '#4a72c4',
  isActive: true,
};

// Common subject suggestions
const QUICK_SUBJECTS = [
  { name: 'Mathematics', code: 'MATH', colorHex: '#4a72c4' },
  { name: 'English', code: 'ENG', colorHex: '#10b981' },
  { name: 'Urdu', code: 'URD', colorHex: '#8b5cf6' },
  { name: 'Islamiat', code: 'ISL', colorHex: '#059669' },
  { name: 'Pakistan Studies', code: 'PAK', colorHex: '#0d9488' },
  { name: 'Physics', code: 'PHY', colorHex: '#f59e0b' },
  { name: 'Chemistry', code: 'CHEM', colorHex: '#ef4444' },
  { name: 'Biology', code: 'BIO', colorHex: '#22c55e' },
  { name: 'Computer Science', code: 'CS', colorHex: '#3b82f6' },
  { name: 'Social Studies', code: 'SST', colorHex: '#a855f7' },
];

// A small palette for the color picker
const COLOR_PALETTE = [
  '#4a72c4', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#14b8a6', // teal
];

const validators = {
  name: (v) => {
    if (!v.trim()) return 'Subject name is required';
    if (v.trim().length < 2) return 'Subject name is too short';
    return '';
  },
  code: (v) => {
    // Optional, but if provided, must be uppercase letters only
    if (v.trim() && !/^[A-Z0-9-]{2,10}$/.test(v.trim()))
      return 'Code must be 2–10 uppercase letters/digits';
    return '';
  },
  colorHex: (v) =>
    !/^#[0-9A-Fa-f]{6}$/.test(v) ? 'Color must be a hex value like #4a72c4' : '',
  description: () => '',
};

function SubjectForm({
  onSubjectAdded,
  editingSubject,
  onUpdateComplete,
  onCancelEdit,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isEditMode = editingSubject !== null;

  useEffect(() => {
    if (editingSubject) {
      setFormData({
        name: editingSubject.name || '',
        code: editingSubject.code || '',
        description: editingSubject.description || '',
        isCore: editingSubject.isCore !== undefined ? editingSubject.isCore : true,
        colorHex: editingSubject.colorHex || '#4a72c4',
        isActive:
          editingSubject.isActive !== undefined ? editingSubject.isActive : true,
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData(EMPTY_FORM);
      setErrors({});
    }
  }, [editingSubject]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    // Auto-uppercase the code as the user types
    if (name === 'code' && typeof newValue === 'string') {
      newValue = newValue.toUpperCase();
    }
    setFormData((p) => ({ ...p, [name]: newValue }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (validators[name]) {
      setErrors((p) => ({ ...p, [name]: validators[name](value) }));
    }
  };

  const applyQuickPreset = (preset) => {
    setFormData((p) => ({
      ...p,
      name: preset.name,
      code: preset.code,
      colorHex: preset.colorHex,
    }));
    setErrors((p) => ({ ...p, name: '', code: '' }));
  };

  const setColor = (hex) => {
    setFormData((p) => ({ ...p, colorHex: hex }));
    setErrors((p) => ({ ...p, colorHex: '' }));
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
      const url = isEditMode ? `${API_URL}/${editingSubject._id}` : API_URL;
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
          ? 'Subject updated successfully! ✅'
          : 'Subject saved successfully! ✅',
      });
      resetForm();

      if (isEditMode) {
        if (onUpdateComplete) onUpdateComplete();
      } else {
        if (onSubjectAdded) onSubjectAdded();
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
        {isEditMode ? '✏️ Edit Subject' : 'Add New Subject'}
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

      {/* Quick presets */}
      {!isEditMode && (
        <div style={styles.presetsWrapper}>
          <div style={styles.presetsLabel}>Quick add:</div>
          <div style={styles.presetsRow}>
            {QUICK_SUBJECTS.map((p) => (
              <button
                key={p.name}
                type="button"
                style={{
                  ...styles.presetBtn,
                  borderColor: p.colorHex,
                  color: p.colorHex,
                }}
                onClick={() => applyQuickPreset(p)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        {/* Row 1: Name + Code */}
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: '2 1 300px' }}>
            <label style={styles.label}>Subject Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. Mathematics"
              style={{
                ...styles.input,
                ...(errors.name ? styles.inputError : {}),
              }}
            />
            {renderError('name')}
          </div>

          <div style={{ ...styles.field, flex: '0 1 180px' }}>
            <label style={styles.label}>Code (optional)</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. MATH"
              style={{
                ...styles.input,
                ...(errors.code ? styles.inputError : {}),
              }}
            />
            {renderError('code')}
          </div>
        </div>

        {/* Row 2: Color picker */}
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: '1 1 100%' }}>
            <label style={styles.label}>Color Tag</label>
            <div style={styles.colorRow}>
              {/* Swatch preview */}
              <div
                style={{
                  ...styles.colorSwatch,
                  backgroundColor: formData.colorHex,
                }}
                title={formData.colorHex}
              />
              {/* Hex input */}
              <input
                type="text"
                name="colorHex"
                value={formData.colorHex}
                onChange={handleChange}
                onBlur={handleBlur}
                style={{
                  ...styles.input,
                  ...styles.colorHexInput,
                  ...(errors.colorHex ? styles.inputError : {}),
                }}
              />
              {/* Native color picker */}
              <input
                type="color"
                value={formData.colorHex}
                onChange={(e) => setColor(e.target.value)}
                style={styles.nativeColorPicker}
                title="Pick a color"
              />
              {/* Preset palette dots */}
              <div style={styles.palette}>
                {COLOR_PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    style={{
                      ...styles.paletteDot,
                      backgroundColor: hex,
                      border:
                        formData.colorHex.toLowerCase() === hex.toLowerCase()
                          ? '3px solid #1e2a4a'
                          : '2px solid #ffffff',
                    }}
                    title={hex}
                  />
                ))}
              </div>
            </div>
            {renderError('colorHex')}
          </div>
        </div>

        {/* Row 3: Description */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Description (optional)</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Core subject with algebra, geometry"
              style={styles.input}
            />
          </div>
        </div>

        {/* Row 4: Toggles */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isCore"
                checked={formData.isCore}
                onChange={handleChange}
                style={styles.checkbox}
              />
              <span>Core Subject (compulsory)</span>
            </label>
          </div>

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
              ? 'Update Subject'
              : 'Save Subject'}
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
    border: '1px solid',
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

  // Color picker styles
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    flexShrink: 0,
  },
  colorHexInput: {
    width: '120px',
    textAlign: 'center',
    fontFamily: 'monospace',
    textTransform: 'lowercase',
  },
  nativeColorPicker: {
    width: '44px',
    height: '44px',
    padding: 0,
    border: '1px solid #ccc',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
  },
  palette: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  paletteDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    cursor: 'pointer',
    padding: 0,
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

export default SubjectForm;