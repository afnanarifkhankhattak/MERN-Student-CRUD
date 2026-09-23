// frontend/src/components/FeeStructureForm.jsx

import { useState, useEffect } from 'react';
import {
  FEE_STRUCTURES_URL as API_URL,
  CLASSES_URL,
  ACADEMIC_YEARS_URL,
  apiFetch,
} from '../api';

// A brand-new blank head
const newHead = () => ({
  head: '',
  amount: '',
  frequency: 'monthly',
  isOptional: false,
  description: '',
});

const EMPTY_FORM = {
  name: '',
  class: '',
  academicYear: '',
  notes: '',
  isActive: true,
  heads: [{ head: 'Tuition', amount: '', frequency: 'monthly', isOptional: false, description: '' }],
};

const FREQUENCIES = [
  { value: 'monthly',   label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'term',      label: 'Per Term' },
  { value: 'annual',    label: 'Annual' },
  { value: 'one-time',  label: 'One-time' },
];

// ── Compute totals live (mirrors backend) ──────
const computeTotals = (heads) => {
  let monthly = 0;
  let oneTime = 0;
  heads.forEach((h) => {
    const amt = Number(h.amount) || 0;
    if (h.frequency === 'monthly') monthly += amt;
    else if (h.frequency === 'one-time') oneTime += amt;
  });
  return { totalMonthly: monthly, totalOneTime: oneTime };
};

function FeeStructureForm({
  onStructureAdded,
  editingStructure,
  onUpdateComplete,
  onCancelEdit,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const isEditMode = editingStructure !== null;

  // ── Load dropdowns ─────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [classRes, yearRes] = await Promise.all([
          apiFetch(CLASSES_URL),
          apiFetch(ACADEMIC_YEARS_URL),
        ]);
        const cData = await classRes.json();
        const yData = await yearRes.json();
        if (classRes.ok) setClasses(cData.data || []);
        if (yearRes.ok) {
          setAcademicYears(yData.data || []);
          if (!editingStructure) {
            const active = (yData.data || []).find((y) => y.isActive);
            if (active) setFormData((p) => ({ ...p, academicYear: active._id }));
          }
        }
      } catch (e) {
        console.error('Failed to load options', e);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Populate form when editing ─────────────────
  useEffect(() => {
    if (editingStructure) {
      setFormData({
        name: editingStructure.name || '',
        class:
          typeof editingStructure.class === 'object' && editingStructure.class
            ? editingStructure.class._id
            : editingStructure.class || '',
        academicYear:
          typeof editingStructure.academicYear === 'object' &&
          editingStructure.academicYear
            ? editingStructure.academicYear._id
            : editingStructure.academicYear || '',
        notes: editingStructure.notes || '',
        isActive: editingStructure.isActive !== undefined ? editingStructure.isActive : true,
        heads:
          Array.isArray(editingStructure.heads) && editingStructure.heads.length > 0
            ? editingStructure.heads.map((h) => ({
                head: h.head || '',
                amount: h.amount ?? '',
                frequency: h.frequency || 'monthly',
                isOptional: !!h.isOptional,
                description: h.description || '',
              }))
            : [newHead()],
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData((p) => ({ ...EMPTY_FORM, academicYear: p.academicYear }));
      setErrors({});
    }
  }, [editingStructure]);

  // ── Field handlers ─────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const v = type === 'checkbox' ? checked : value;
    setFormData((p) => ({ ...p, [name]: v }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  // Update one head's field
  const updateHead = (index, field, value) => {
    setFormData((p) => ({
      ...p,
      heads: p.heads.map((h, i) => (i === index ? { ...h, [field]: value } : h)),
    }));
  };

  const addHead = () => {
    setFormData((p) => ({ ...p, heads: [...p.heads, newHead()] }));
  };

  const removeHead = (index) => {
    if (formData.heads.length === 1) {
      setMessage({ type: 'error', text: 'At least one fee head is required.' });
      return;
    }
    setFormData((p) => ({
      ...p,
      heads: p.heads.filter((_, i) => i !== index),
    }));
  };

  // ── Validate ───────────────────────────────────
  const validateAll = () => {
    const errs = {};

    if (!formData.name.trim()) errs.name = 'Structure name is required';
    if (!formData.class) errs.class = 'Class is required';
    if (!formData.academicYear) errs.academicYear = 'Academic year is required';

    formData.heads.forEach((h, i) => {
      if (!h.head.trim()) errs[`head_${i}`] = 'Head name required';
      const amt = Number(h.amount);
      if (h.amount === '' || isNaN(amt) || amt < 0) {
        errs[`amount_${i}`] = 'Invalid amount';
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ─────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateAll()) {
      setMessage({ type: 'error', text: 'Please fix the errors below.' });
      return;
    }

    setLoading(true);

    try {
      const url = isEditMode ? `${API_URL}/${editingStructure._id}` : API_URL;
      const method = isEditMode ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        heads: formData.heads.map((h) => ({
          head: h.head.trim(),
          amount: Number(h.amount),
          frequency: h.frequency,
          isOptional: h.isOptional,
          description: h.description || '',
        })),
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
          ? 'Fee structure updated successfully! ✅'
          : 'Fee structure created successfully! ✅',
      });
      setFormData((p) => ({ ...EMPTY_FORM, academicYear: p.academicYear }));

      if (isEditMode) {
        if (onUpdateComplete) onUpdateComplete();
      } else {
        if (onStructureAdded) onStructureAdded();
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData((p) => ({ ...EMPTY_FORM, academicYear: p.academicYear }));
    setErrors({});
    setMessage({ type: '', text: '' });
    if (onCancelEdit) onCancelEdit();
  };

  // ── Live totals ────────────────────────────────
  const totals = computeTotals(formData.heads);

  // ── Render ─────────────────────────────────────
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        {isEditMode ? '✏️ Edit Fee Structure' : 'Create Fee Structure'}
      </h2>

      {message.text && (
        <div
          style={{
            ...styles.message,
            backgroundColor:
              message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {loadingOptions && <div style={styles.loading}>Loading options...</div>}

      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        {/* Row 1: Name + Class + Year */}
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: '2 1 280px' }}>
            <label style={styles.label}>Structure Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Grade 5 Standard 2024-2025"
              style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
            />
            {errors.name && <span style={styles.errorText}>{errors.name}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Class *</label>
            <select
              name="class"
              value={formData.class}
              onChange={handleChange}
              disabled={loadingOptions}
              style={{ ...styles.input, ...styles.select, ...(errors.class ? styles.inputError : {}) }}
            >
              <option value="">-- Select Class --</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {errors.class && <span style={styles.errorText}>{errors.class}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Academic Year *</label>
            <select
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              disabled={loadingOptions}
              style={{ ...styles.input, ...styles.select, ...(errors.academicYear ? styles.inputError : {}) }}
            >
              <option value="">-- Select Year --</option>
              {academicYears.map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name} {y.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>
            {errors.academicYear && <span style={styles.errorText}>{errors.academicYear}</span>}
          </div>
        </div>

        {/* Fee heads section */}
        <div style={styles.headsHeader}>
          <h3 style={styles.sectionTitle}>💵 Fee Heads</h3>
          <button
            type="button"
            onClick={addHead}
            style={styles.addHeadBtn}
          >
            ➕ Add Fee Head
          </button>
        </div>

        <div style={styles.headsWrap}>
          {formData.heads.map((h, i) => (
            <div key={i} style={styles.headRow}>
              <div style={{ ...styles.headField, flex: '2 1 200px' }}>
                <label style={styles.headLabel}>Head *</label>
                <input
                  type="text"
                  value={h.head}
                  onChange={(e) => updateHead(i, 'head', e.target.value)}
                  placeholder="e.g. Tuition"
                  style={{ ...styles.input, ...(errors[`head_${i}`] ? styles.inputError : {}) }}
                />
              </div>

              <div style={{ ...styles.headField, flex: '0 1 130px' }}>
                <label style={styles.headLabel}>Amount *</label>
                <input
                  type="number"
                  min="0"
                  value={h.amount}
                  onChange={(e) => updateHead(i, 'amount', e.target.value)}
                  placeholder="e.g. 5000"
                  style={{ ...styles.input, ...(errors[`amount_${i}`] ? styles.inputError : {}) }}
                />
              </div>

              <div style={{ ...styles.headField, flex: '0 1 150px' }}>
                <label style={styles.headLabel}>Frequency</label>
                <select
                  value={h.frequency}
                  onChange={(e) => updateHead(i, 'frequency', e.target.value)}
                  style={{ ...styles.input, ...styles.select }}
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ ...styles.headField, flex: '0 0 90px' }}>
                <label style={styles.headLabel}>Optional</label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={h.isOptional}
                    onChange={(e) => updateHead(i, 'isOptional', e.target.checked)}
                    style={styles.checkbox}
                  />
                  <span style={{ fontSize: '12px' }}>Optional</span>
                </label>
              </div>

              <div style={{ ...styles.headField, flex: '2 1 200px' }}>
                <label style={styles.headLabel}>Description</label>
                <input
                  type="text"
                  value={h.description}
                  onChange={(e) => updateHead(i, 'description', e.target.value)}
                  placeholder="Optional note"
                  style={styles.input}
                />
              </div>

              <button
                type="button"
                onClick={() => removeHead(i)}
                style={styles.removeBtn}
                title="Remove this head"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Totals preview */}
        <div style={styles.totalsBox}>
          <div style={styles.totalItem}>
            <span style={styles.totalLabel}>Total Monthly:</span>
            <span style={styles.totalValue}>Rs {totals.totalMonthly.toLocaleString()}</span>
          </div>
          <div style={styles.totalItem}>
            <span style={styles.totalLabel}>Total One-time:</span>
            <span style={styles.totalValue}>Rs {totals.totalOneTime.toLocaleString()}</span>
          </div>
          <div style={styles.totalHint}>
            (Optional heads are shown above but excluded from invoice generation by default)
          </div>
        </div>

        {/* Notes */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Notes (optional)</label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Approved by principal on 15 March"
              style={styles.input}
            />
          </div>
          <div style={{ ...styles.field, flex: '0 0 120px' }}>
            <label style={styles.label}>Active</label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                style={styles.checkbox}
              />
              <span style={{ fontSize: '13px' }}>Active</span>
            </label>
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
            {loading ? 'Saving...' : isEditMode ? 'Update Structure' : 'Save Structure'}
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

// ── Styles ──────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  heading: { textAlign: 'center', color: '#1e2a4a', marginBottom: '20px' },
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
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  row: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  field: { flex: '1 1 180px', display: 'flex', flexDirection: 'column' },
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

  headsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    borderBottom: '1px solid #e3e8f0',
    paddingBottom: '8px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '14px',
    color: '#4a72c4',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  addHeadBtn: {
    padding: '7px 14px',
    backgroundColor: '#4a72c4',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  headsWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: '#eef3fb',
    padding: '12px',
    borderRadius: '8px',
  },
  headRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #dbe4f0',
    flexWrap: 'wrap',
  },
  headField: { display: 'flex', flexDirection: 'column' },
  headLabel: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: 'bold',
    marginBottom: '3px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    padding: '10px 0',
  },
  checkbox: { width: '18px', height: '18px', cursor: 'pointer' },
  removeBtn: {
    padding: '8px 12px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    marginBottom: '1px',
  },

  totalsBox: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    border: '1px solid #c8e0f9',
    padding: '10px 16px',
    borderRadius: '8px',
    flexWrap: 'wrap',
  },
  totalItem: { display: 'flex', gap: '8px', alignItems: 'baseline' },
  totalLabel: { fontSize: '12px', color: '#4b5563' },
  totalValue: { fontSize: '16px', fontWeight: 'bold', color: '#1e2a4a' },
  totalHint: {
    fontSize: '11px',
    color: '#6b7280',
    fontStyle: 'italic',
    marginLeft: 'auto',
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

export default FeeStructureForm;