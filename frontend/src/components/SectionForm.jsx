// frontend/src/components/SectionForm.jsx

import { useState, useEffect } from 'react';
import {
  SECTIONS_URL as API_URL,
  CLASSES_URL,
  TEACHERS_URL,
  apiFetch,
} from '../api';

const EMPTY_FORM = {
  name: '',
  class: '',
  classTeacher: '',
  capacity: 40,
  room: '',
  isActive: true,
};

const validators = {
  name: (v) => {
    if (!v.trim()) return 'Section name is required';
    if (v.trim().length > 10) return 'Section name is too long (max 10)';
    return '';
  },
  class: (v) => (!v ? 'Please select a class' : ''),
  capacity: (v) => {
    if (v === '' || v === null || v === undefined) return 'Capacity is required';
    const n = Number(v);
    if (Number.isNaN(n)) return 'Capacity must be a number';
    if (n < 1) return 'Capacity must be at least 1';
    if (n > 200) return 'Capacity is too high';
    return '';
  },
  room: () => '',
  classTeacher: () => '',
};

function SectionForm({
  onSectionAdded,
  editingSection,
  onUpdateComplete,
  onCancelEdit,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Lists loaded from other APIs
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const isEditMode = editingSection !== null;

  // ── Load classes + teachers for the dropdowns ──
  useEffect(() => {
    const load = async () => {
      try {
        const [classRes, teacherRes] = await Promise.all([
          apiFetch(CLASSES_URL),
          apiFetch(TEACHERS_URL),
        ]);
        const classData = await classRes.json();
        const teacherData = await teacherRes.json();
        if (classRes.ok) setClasses(classData.data || []);
        if (teacherRes.ok) setTeachers(teacherData.data || []);
      } catch (e) {
        console.error('Failed to load dropdown data', e);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  // ── Populate form when editing ──
  useEffect(() => {
    if (editingSection) {
      setFormData({
        name: editingSection.name || '',
        // The API returns populated objects, so we extract the _id
        class:
          typeof editingSection.class === 'object'
            ? editingSection.class._id
            : editingSection.class || '',
        classTeacher:
          typeof editingSection.classTeacher === 'object' && editingSection.classTeacher
            ? editingSection.classTeacher._id
            : editingSection.classTeacher || '',
        capacity: editingSection.capacity ?? 40,
        room: editingSection.room || '',
        isActive:
          editingSection.isActive !== undefined ? editingSection.isActive : true,
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData(EMPTY_FORM);
      setErrors({});
    }
  }, [editingSection]);

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
      const url = isEditMode ? `${API_URL}/${editingSection._id}` : API_URL;
      const method = isEditMode ? 'PUT' : 'POST';

      // Convert classTeacher "" to null (so backend doesn't try to cast it)
      const payload = {
        ...formData,
        capacity: Number(formData.capacity),
        classTeacher: formData.classTeacher || null,
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
          ? 'Section updated successfully! ✅'
          : 'Section saved successfully! ✅',
      });
      resetForm();

      if (isEditMode) {
        if (onUpdateComplete) onUpdateComplete();
      } else {
        if (onSectionAdded) onSectionAdded();
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
        {isEditMode ? '✏️ Edit Section' : 'Add New Section'}
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
        <div style={styles.loading}>Loading dropdown options...</div>
      )}

      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        {/* Row 1: Class + Section Name */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Class *</label>
            <select
              name="class"
              value={formData.class}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loadingOptions}
              style={{
                ...styles.input,
                ...styles.select,
                ...(errors.class ? styles.inputError : {}),
              }}
            >
              <option value="">-- Select Class --</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {renderError('class')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Section Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. A"
              style={{
                ...styles.input,
                ...(errors.name ? styles.inputError : {}),
              }}
            />
            {renderError('name')}
          </div>
        </div>

        {/* Row 2: Class Teacher + Capacity */}
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: '2 1 300px' }}>
            <label style={styles.label}>Class Teacher (optional)</label>
            <select
              name="classTeacher"
              value={formData.classTeacher}
              onChange={handleChange}
              disabled={loadingOptions}
              style={{ ...styles.input, ...styles.select }}
            >
              <option value="">-- Unassigned --</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                  {t.department ? ` (${t.department})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.field, flex: '0 1 150px' }}>
            <label style={styles.label}>Capacity *</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              onBlur={handleBlur}
              min="1"
              max="200"
              style={{
                ...styles.input,
                ...(errors.capacity ? styles.inputError : {}),
              }}
            />
            {renderError('capacity')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Room (optional)</label>
            <input
              type="text"
              name="room"
              value={formData.room}
              onChange={handleChange}
              placeholder="e.g. Room 102"
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
              ? 'Update Section'
              : 'Save Section'}
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
    maxWidth: '1000px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  heading: { textAlign: 'center', color: '#333', marginBottom: '20px' },
  loading: {
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
  select: { cursor: 'pointer' },
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

export default SectionForm;