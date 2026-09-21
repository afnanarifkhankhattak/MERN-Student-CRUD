// frontend/src/components/CourseForm.jsx

import { useState, useEffect } from 'react';
import {
  COURSES_URL as API_URL,
  TEACHERS_URL,
  apiFetch,
} from '../api';

const EMPTY_FORM = {
  title: '',
  code: '',
  credits: '',
  department: '',
  semester: '',
  teacher: '',
  teacherName: '',
  description: '',
};

const DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Physics',
  'Chemistry',
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

function CourseForm({ onCourseAdded, editingCourse, onUpdateComplete, onCancelEdit }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isEditMode = editingCourse !== null;

  // Load teachers for the dropdown
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(TEACHERS_URL);
        const data = await res.json();
        if (res.ok) setTeachers(data.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  // Populate when editing
  useEffect(() => {
    if (editingCourse) {
      setFormData({
        title: editingCourse.title || '',
        code: editingCourse.code || '',
        credits: editingCourse.credits ?? '',
        department: editingCourse.department || '',
        semester: editingCourse.semester ?? '',
        teacher: editingCourse.teacher || '',
        teacherName: editingCourse.teacherName || '',
        description: editingCourse.description || '',
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData(EMPTY_FORM);
      setErrors({});
    }
  }, [editingCourse]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleTeacherChange = (e) => {
    const id = e.target.value;
    const found = teachers.find((t) => t._id === id);
    setFormData((p) => ({
      ...p,
      teacher: id,
      teacherName: found ? found.name : '',
    }));
  };

  const validateAll = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.code.trim()) newErrors.code = 'Course code is required';
    if (formData.credits === '' || Number(formData.credits) < 1 || Number(formData.credits) > 6)
      newErrors.credits = 'Credits must be 1–6';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.semester) newErrors.semester = 'Semester is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      const url = isEditMode ? `${API_URL}/${editingCourse._id}` : API_URL;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({
          ...formData,
          credits: Number(formData.credits),
          semester: Number(formData.semester),
          teacher: formData.teacher || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Something went wrong');

      setMessage({
        type: 'success',
        text: isEditMode
          ? 'Course updated successfully! ✅'
          : 'Course saved successfully! ✅',
      });
      setFormData(EMPTY_FORM);

      if (isEditMode) {
        if (onUpdateComplete) onUpdateComplete();
      } else {
        if (onCourseAdded) onCourseAdded();
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setMessage({ type: '', text: '' });
    if (onCancelEdit) onCancelEdit();
  };

  const renderError = (field) =>
    errors[field] ? <span style={styles.errorText}>{errors[field]}</span> : null;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        {isEditMode ? '✏️ Edit Course' : 'Add New Course'}
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
        {/* Row 1: Title + Code */}
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: '2 1 300px' }}>
            <label style={styles.label}>Course Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Data Structures"
              style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
            />
            {renderError('title')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Course Code *</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g. CS-201"
              style={{ ...styles.input, ...(errors.code ? styles.inputError : {}) }}
            />
            {renderError('code')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Credits *</label>
            <input
              type="number"
              name="credits"
              min="1"
              max="6"
              value={formData.credits}
              onChange={handleChange}
              placeholder="1–6"
              style={{ ...styles.input, ...(errors.credits ? styles.inputError : {}) }}
            />
            {renderError('credits')}
          </div>
        </div>

        {/* Row 2: Department + Semester + Teacher */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Department *</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...styles.select,
                ...(errors.department ? styles.inputError : {}),
              }}
            >
              <option value="">-- Select --</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
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
              style={{
                ...styles.input,
                ...styles.select,
                ...(errors.semester ? styles.inputError : {}),
              }}
            >
              <option value="">-- Select --</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
            {renderError('semester')}
          </div>

          <div style={{ ...styles.field, flex: '2 1 250px' }}>
            <label style={styles.label}>Assigned Teacher</label>
            <select
              name="teacher"
              value={formData.teacher}
              onChange={handleTeacherChange}
              style={{ ...styles.input, ...styles.select }}
            >
              <option value="">-- Unassigned --</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Description (optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Short course description..."
              rows="2"
              style={{ ...styles.input, resize: 'vertical', fontFamily: 'Arial' }}
            />
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
            {loading ? 'Saving...' : isEditMode ? 'Update Course' : 'Save Course'}
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

const styles = {
  container: {
    maxWidth: '1000px', margin: '20px auto', padding: '20px',
    backgroundColor: '#f9f9f9', borderRadius: '8px',
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

export default CourseForm;