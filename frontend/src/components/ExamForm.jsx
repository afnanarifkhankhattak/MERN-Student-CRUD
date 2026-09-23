// frontend/src/components/ExamForm.jsx

import { useState, useEffect } from 'react';
import {
  EXAMS_URL as API_URL,
  CLASSES_URL,
  ACADEMIC_YEARS_URL,
  apiFetch,
} from '../api';

const EMPTY_FORM = {
  name: '',
  examType: 'mid-term',
  class: '',
  academicYear: '',
  startDate: '',
  endDate: '',
  description: '',
  status: 'draft',
};

const EXAM_TYPES = [
  { value: 'mid-term', label: 'Mid Term' },
  { value: 'final', label: 'Final Term' },
  { value: 'monthly', label: 'Monthly Test' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'other', label: 'Other' },
];

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'published', label: 'Published' },
];

const validators = {
  name: (v) => {
    if (!v.trim()) return 'Exam name is required';
    if (v.trim().length < 2) return 'Name is too short';
    return '';
  },
  examType: (v) => (!v ? 'Exam type is required' : ''),
  class: (v) => (!v ? 'Class is required' : ''),
  academicYear: (v) => (!v ? 'Academic year is required' : ''),
  startDate: () => '',
  endDate: () => '',
  description: () => '',
  status: () => '',
};

function ExamForm({ onExamAdded, editingExam, onUpdateComplete, onCancelEdit }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Dropdowns
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const isEditMode = editingExam !== null;

  // Load dropdowns
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
          // Auto-pick active year for new exams
          if (!editingExam) {
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

  // Populate on edit
  useEffect(() => {
    if (editingExam) {
      setFormData({
        name: editingExam.name || '',
        examType: editingExam.examType || 'mid-term',
        class:
          typeof editingExam.class === 'object' && editingExam.class
            ? editingExam.class._id
            : editingExam.class || '',
        academicYear:
          typeof editingExam.academicYear === 'object' && editingExam.academicYear
            ? editingExam.academicYear._id
            : editingExam.academicYear || '',
        startDate: editingExam.startDate || '',
        endDate: editingExam.endDate || '',
        description: editingExam.description || '',
        status: editingExam.status || 'draft',
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData((p) => ({ ...EMPTY_FORM, academicYear: p.academicYear }));
      setErrors({});
    }
  }, [editingExam]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
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
    // Extra: endDate cannot be before startDate
    if (
      formData.startDate &&
      formData.endDate &&
      formData.endDate < formData.startDate
    ) {
      newErrors.endDate = 'End date cannot be before start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData((p) => ({ ...EMPTY_FORM, academicYear: p.academicYear }));
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
      const url = isEditMode ? `${API_URL}/${editingExam._id}` : API_URL;
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
          ? 'Exam updated successfully! ✅'
          : 'Exam created successfully! ✅',
      });
      resetForm();

      if (isEditMode) {
        if (onUpdateComplete) onUpdateComplete();
      } else {
        if (onExamAdded) onExamAdded();
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
        {isEditMode ? '✏️ Edit Exam' : 'Create New Exam'}
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

      {loadingOptions && <div style={styles.loading}>Loading options...</div>}

      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        {/* Row 1: Name + Type */}
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: '2 1 300px' }}>
            <label style={styles.label}>Exam Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. Mid Term 2024"
              style={{
                ...styles.input,
                ...(errors.name ? styles.inputError : {}),
              }}
            />
            {renderError('name')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Exam Type *</label>
            <select
              name="examType"
              value={formData.examType}
              onChange={handleChange}
              style={{ ...styles.input, ...styles.select }}
            >
              {EXAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {renderError('examType')}
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

        {/* Row 2: Class + Year */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Class *</label>
            <select
              name="class"
              value={formData.class}
              onChange={handleChange}
              disabled={loadingOptions}
              style={{
                ...styles.input,
                ...styles.select,
                ...(errors.class ? styles.inputError : {}),
              }}
            >
              <option value="">-- Select Class --</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {renderError('class')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Academic Year *</label>
            <select
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              disabled={loadingOptions}
              style={{
                ...styles.input,
                ...styles.select,
                ...(errors.academicYear ? styles.inputError : {}),
              }}
            >
              <option value="">-- Select Year --</option>
              {academicYears.map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name} {y.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>
            {renderError('academicYear')}
          </div>
        </div>

        {/* Row 3: Dates */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(errors.endDate ? styles.inputError : {}),
              }}
            />
            {renderError('endDate')}
          </div>
        </div>

        {/* Row 4: Description */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Description (optional)</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. First term examination"
              style={styles.input}
            />
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
              cursor:
                loading || loadingOptions ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? 'Saving...'
              : isEditMode
              ? 'Update Exam'
              : 'Create Exam'}
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

export default ExamForm;