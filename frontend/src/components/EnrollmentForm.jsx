// frontend/src/components/EnrollmentForm.jsx

import { useState, useEffect } from 'react';
import {
  ENROLLMENTS_URL as API_URL,
  STUDENTS_URL,
  CLASSES_URL,
  SECTIONS_URL,
  ACADEMIC_YEARS_URL,
  apiFetch,
} from '../api';

const EMPTY_FORM = {
  student: '',
  class: '',
  section: '',
  academicYear: '',
  rollNo: '',
  enrolledDate: '',
  status: 'active',
  leavingDate: '',
  remarks: '',
};

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
];

const validators = {
  student: (v) => (!v ? 'Please select a student' : ''),
  class: (v) => (!v ? 'Please select a class' : ''),
  section: (v) => (!v ? 'Please select a section' : ''),
  academicYear: (v) => (!v ? 'Please select an academic year' : ''),
  rollNo: (v) => {
    if (v === '' || v === null || v === undefined) return 'Roll number is required';
    const n = Number(v);
    if (Number.isNaN(n)) return 'Roll number must be a number';
    if (n < 1) return 'Roll number must be at least 1';
    if (n > 999) return 'Roll number must be at most 999';
    return '';
  },
  enrolledDate: () => '',
  status: () => '',
  leavingDate: () => '',
  remarks: () => '',
};

function EnrollmentForm({
  onEnrollmentAdded,
  editingEnrollment,
  onUpdateComplete,
  onCancelEdit,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [fetchingRoll, setFetchingRoll] = useState(false);

  // Dropdown lists
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const isEditMode = editingEnrollment !== null;

  // ── Load dropdown data on mount ────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [studentRes, classRes, sectionRes, yearRes] = await Promise.all([
          apiFetch(STUDENTS_URL),
          apiFetch(CLASSES_URL),
          apiFetch(SECTIONS_URL),
          apiFetch(ACADEMIC_YEARS_URL),
        ]);
        const sData = await studentRes.json();
        const cData = await classRes.json();
        const secData = await sectionRes.json();
        const yData = await yearRes.json();

        if (studentRes.ok) setStudents(sData.data || []);
        if (classRes.ok) setClasses(cData.data || []);
        if (sectionRes.ok) setAllSections(secData.data || []);
        if (yearRes.ok) setAcademicYears(yData.data || []);
      } catch (e) {
        console.error('Failed to load enrollment form options', e);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  // ── Filter sections by selected class ──────────
  const filteredSections = allSections.filter((s) => {
    const sectionClassId =
      typeof s.class === 'object' ? s.class?._id : s.class;
    return sectionClassId === formData.class;
  });

  // ── Populate when editing ──────────────────────
  useEffect(() => {
    if (editingEnrollment) {
      setFormData({
        student:
          typeof editingEnrollment.student === 'object' &&
          editingEnrollment.student
            ? editingEnrollment.student._id
            : editingEnrollment.student || '',
        class:
          typeof editingEnrollment.class === 'object' && editingEnrollment.class
            ? editingEnrollment.class._id
            : editingEnrollment.class || '',
        section:
          typeof editingEnrollment.section === 'object' &&
          editingEnrollment.section
            ? editingEnrollment.section._id
            : editingEnrollment.section || '',
        academicYear:
          typeof editingEnrollment.academicYear === 'object' &&
          editingEnrollment.academicYear
            ? editingEnrollment.academicYear._id
            : editingEnrollment.academicYear || '',
        rollNo: editingEnrollment.rollNo ?? '',
        enrolledDate: editingEnrollment.enrolledDate || '',
        status: editingEnrollment.status || 'active',
        leavingDate: editingEnrollment.leavingDate || '',
        remarks: editingEnrollment.remarks || '',
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData(EMPTY_FORM);
      setErrors({});
    }
  }, [editingEnrollment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Reset section when class changes
      if (name === 'class') next.section = '';
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

  // ── Fetch the next available roll number ───────
  const fetchNextRoll = async () => {
    if (!formData.class || !formData.section || !formData.academicYear) {
      setMessage({
        type: 'error',
        text: 'Pick Class, Section, and Academic Year first.',
      });
      return;
    }

    setFetchingRoll(true);
    setMessage({ type: '', text: '' });

    try {
      const url = `${API_URL}/next-roll?class=${formData.class}&section=${formData.section}&academicYear=${formData.academicYear}`;
      const res = await apiFetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Could not fetch next roll');

      setFormData((p) => ({ ...p, rollNo: data.data.nextRoll }));
      setErrors((p) => ({ ...p, rollNo: '' }));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setFetchingRoll(false);
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
        ? `${API_URL}/${editingEnrollment._id}`
        : API_URL;
      const method = isEditMode ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        rollNo: Number(formData.rollNo),
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
          ? 'Enrollment updated successfully! ✅'
          : 'Enrollment created successfully! ✅',
      });
      resetForm();

      if (isEditMode) {
        if (onUpdateComplete) onUpdateComplete();
      } else {
        if (onEnrollmentAdded) onEnrollmentAdded();
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

  const canFetchRoll =
    formData.class && formData.section && formData.academicYear;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        {isEditMode ? '✏️ Edit Enrollment' : 'Enroll a Student'}
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
        {/* Section: Who + Where */}
        <h3 style={styles.sectionHeading}>Student & Class</h3>

        <div style={styles.row}>
          <div style={{ ...styles.field, flex: '2 1 300px' }}>
            <label style={styles.label}>Student *</label>
            <select
              name="student"
              value={formData.student}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loadingOptions}
              style={{
                ...styles.input,
                ...styles.select,
                ...(errors.student ? styles.inputError : {}),
              }}
            >
              <option value="">-- Select Student --</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.regNo || s.username})
                </option>
              ))}
            </select>
            {renderError('student')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Academic Year *</label>
            <select
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              onBlur={handleBlur}
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
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {renderError('class')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Section *</label>
            <select
              name="section"
              value={formData.section}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loadingOptions || !formData.class}
              style={{
                ...styles.input,
                ...styles.select,
                ...(errors.section ? styles.inputError : {}),
              }}
            >
              <option value="">
                {!formData.class
                  ? '-- Select Class first --'
                  : filteredSections.length > 0
                  ? '-- Select Section --'
                  : '-- No sections for this class --'}
              </option>
              {filteredSections.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            {renderError('section')}
          </div>

          {/* Roll number with "Get next" button */}
          <div style={{ ...styles.field, flex: '1 1 220px' }}>
            <label style={styles.label}>Roll No *</label>
            <div style={styles.rollRow}>
              <input
                type="number"
                name="rollNo"
                value={formData.rollNo}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. 12"
                style={{
                  ...styles.input,
                  ...styles.rollInput,
                  ...(errors.rollNo ? styles.inputError : {}),
                }}
              />
              <button
                type="button"
                onClick={fetchNextRoll}
                disabled={!canFetchRoll || fetchingRoll}
                style={{
                  ...styles.nextRollBtn,
                  opacity: !canFetchRoll || fetchingRoll ? 0.5 : 1,
                  cursor:
                    !canFetchRoll || fetchingRoll ? 'not-allowed' : 'pointer',
                }}
                title={
                  canFetchRoll
                    ? 'Auto-fill the next available roll number'
                    : 'Pick Class, Section, and Year first'
                }
              >
                {fetchingRoll ? '...' : '⚡ Next'}
              </button>
            </div>
            {renderError('rollNo')}
          </div>
        </div>

        {/* Section: Timing + Status */}
        <h3 style={styles.sectionHeading}>Enrollment Details</h3>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Enrolled Date</label>
            <input
              type="date"
              name="enrolledDate"
              value={formData.enrolledDate}
              onChange={handleChange}
              style={styles.input}
            />
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

          {/* Show leavingDate only when status is not "active" */}
          {formData.status !== 'active' && (
            <div style={styles.field}>
              <label style={styles.label}>Leaving Date</label>
              <input
                type="date"
                name="leavingDate"
                value={formData.leavingDate}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          )}
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Remarks (optional)</label>
            <input
              type="text"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="e.g. Promoted from Grade 4"
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
              cursor: loading || loadingOptions ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? 'Saving...'
              : isEditMode
              ? 'Update Enrollment'
              : 'Create Enrollment'}
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

  rollRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'stretch',
  },
  rollInput: {
    flex: 1,
  },
  nextRollBtn: {
    padding: '0 14px',
    backgroundColor: '#4a72c4',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 'bold',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
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

export default EnrollmentForm;