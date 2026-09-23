// frontend/src/components/ParentForm.jsx

import { useState, useEffect } from 'react';
import { PARENTS_URL as API_URL, apiFetch } from '../api';

const EMPTY_FORM = {
  name: '',
  relation: 'father',
  phone: '',
  email: '',
  cnic: '',
  occupation: '',
  address: '',
  altPhone: '',
  notes: '',
  isActive: true,
};

const RELATIONS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

const validators = {
  name: (v) => {
    if (!v.trim()) return 'Parent name is required';
    if (v.trim().length < 2) return 'Name is too short';
    return '';
  },
  relation: (v) => (!v ? 'Please select a relation' : ''),
  phone: (v) => {
    if (!v.trim()) return 'Phone number is required';
    if (!/^\d{10,15}$/.test(v)) {
      return 'Phone must be 10–15 digits (no spaces or letters)';
    }
    return '';
  },
  email: (v) => {
    // Optional, but if provided must be valid
    if (v.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return 'Enter a valid email like name@example.com';
    }
    return '';
  },
  cnic: (v) => {
    // Optional, but if provided must match CNIC format
    // Pakistani CNIC: 5 digits - 7 digits - 1 digit, e.g. 61101-1234567-1
    if (v.trim() && !/^\d{5}-\d{7}-\d$/.test(v.trim())) {
      return 'CNIC must be in format 12345-1234567-1';
    }
    return '';
  },
  occupation: () => '',
  address: () => '',
  altPhone: (v) => {
    // Optional, but if provided must be numeric
    if (v.trim() && !/^\d{10,15}$/.test(v)) {
      return 'Alternate phone must be 10–15 digits';
    }
    return '';
  },
  notes: () => '',
};

function ParentForm({ onParentAdded, editingParent, onUpdateComplete, onCancelEdit }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isEditMode = editingParent !== null;

  useEffect(() => {
    if (editingParent) {
      setFormData({
        name: editingParent.name || '',
        relation: editingParent.relation || 'father',
        phone: editingParent.phone || '',
        email: editingParent.email || '',
        cnic: editingParent.cnic || '',
        occupation: editingParent.occupation || '',
        address: editingParent.address || '',
        altPhone: editingParent.altPhone || '',
        notes: editingParent.notes || '',
        isActive:
          editingParent.isActive !== undefined ? editingParent.isActive : true,
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData(EMPTY_FORM);
      setErrors({});
    }
  }, [editingParent]);

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
      const url = isEditMode ? `${API_URL}/${editingParent._id}` : API_URL;
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
          ? 'Parent updated successfully! ✅'
          : 'Parent saved successfully! ✅',
      });
      resetForm();

      if (isEditMode) {
        if (onUpdateComplete) onUpdateComplete();
      } else {
        if (onParentAdded) onParentAdded();
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
        {isEditMode ? '✏️ Edit Parent' : 'Add New Parent'}
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
        {/* Section: Personal Info */}
        <h3 style={styles.sectionHeading}>Personal Information</h3>

        {/* Row 1: Name + Relation */}
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: '2 1 300px' }}>
            <label style={styles.label}>Parent Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. Muhammad Ali"
              style={{
                ...styles.input,
                ...(errors.name ? styles.inputError : {}),
              }}
            />
            {renderError('name')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Relation *</label>
            <select
              name="relation"
              value={formData.relation}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...styles.select,
                ...(errors.relation ? styles.inputError : {}),
              }}
            >
              {RELATIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {renderError('relation')}
          </div>
        </div>

        {/* Row 2: CNIC + Occupation */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>CNIC (optional)</label>
            <input
              type="text"
              name="cnic"
              value={formData.cnic}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 61101-1234567-1"
              style={{
                ...styles.input,
                ...(errors.cnic ? styles.inputError : {}),
              }}
            />
            {renderError('cnic')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Occupation</label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              placeholder="e.g. Engineer, Teacher, Business"
              style={styles.input}
            />
          </div>
        </div>

        {/* Section: Contact */}
        <h3 style={styles.sectionHeading}>Contact Information</h3>

        {/* Row 3: Phone + Alt Phone */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Primary Phone *</label>
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
            <label style={styles.label}>Alternate Phone (optional)</label>
            <input
              type="text"
              name="altPhone"
              value={formData.altPhone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 03211234567"
              style={{
                ...styles.input,
                ...(errors.altPhone ? styles.inputError : {}),
              }}
            />
            {renderError('altPhone')}
          </div>
        </div>

        {/* Row 4: Email */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Email (optional)</label>
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

        {/* Section: Address */}
        <h3 style={styles.sectionHeading}>Additional Details</h3>

        {/* Row 5: Address */}
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

        {/* Row 6: Notes + Active */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Notes (optional)</label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Prefers SMS contact"
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
              ? 'Update Parent'
              : 'Save Parent'}
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

export default ParentForm;