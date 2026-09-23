// frontend/src/components/TeacherForm.jsx

import { useState, useEffect } from 'react';
import {
  TEACHERS_URL as API_URL,
  SUBJECTS_URL,
  CLASSES_URL,
  apiFetch,
} from '../api';

const EMPTY_FORM = {
  // Existing
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

  // New
  cnic: '',
  dob: '',
  gender: '',
  qualification: '',
  address: '',
  subjects: [],       // array of Subject ObjectIds
  classes: [],        // array of Class ObjectIds
  status: 'active',
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

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'resigned', label: 'Resigned' },
];

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
    v.trim() && !/^https?:\/\/.+/i.test(v) ? 'Picture must be a valid URL' : '',
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
  department: () => '',
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
  // Optional
  joiningDate: () => '',
  cnic: (v) => {
    if (v.trim() && !/^\d{5}-\d{7}-\d$/.test(v.trim())) {
      return 'CNIC must be 12345-1234567-1';
    }
    return '';
  },
  dob: () => '',
  gender: () => '',
  qualification: () => '',
  address: () => '',
  subjects: () => '',
  classes: () => '',
  status: () => '',
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

  // Dropdown data
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const isEditMode = editingTeacher !== null;

  // ── Load subjects + classes for multi-selects ──
  useEffect(() => {
    const load = async () => {
      try {
        const [subjectRes, classRes] = await Promise.all([
          apiFetch(SUBJECTS_URL),
          apiFetch(CLASSES_URL),
        ]);
        const subData = await subjectRes.json();
        const classData = await classRes.json();
        if (subjectRes.ok) setSubjects(subData.data || []);
        if (classRes.ok) setClasses(classData.data || []);
      } catch (e) {
        console.error('Failed to load teacher form options', e);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  // ── Populate form when editing ────────────────
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

        cnic: editingTeacher.cnic || '',
        dob: editingTeacher.dob || '',
        gender: editingTeacher.gender || '',
        qualification: editingTeacher.qualification || '',
        address: editingTeacher.address || '',
        // Convert populated subjects/classes → array of _ids
        subjects: Array.isArray(editingTeacher.subjects)
          ? editingTeacher.subjects.map((s) =>
              typeof s === 'object' ? s._id : s
            )
          : [],
        classes: Array.isArray(editingTeacher.classes)
          ? editingTeacher.classes.map((c) =>
              typeof c === 'object' ? c._id : c
            )
          : [],
        status: editingTeacher.status || 'active',
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
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (validators[name]) {
      setErrors((p) => ({ ...p, [name]: validators[name](value) }));
    }
  };

  // ── Toggle helpers for multi-select arrays ────
  const toggleSubject = (id) => {
    setFormData((p) => ({
      ...p,
      subjects: p.subjects.includes(id)
        ? p.subjects.filter((x) => x !== id)
        : [...p.subjects, id],
    }));
  };

  const toggleClass = (id) => {
    setFormData((p) => ({
      ...p,
      classes: p.classes.includes(id)
        ? p.classes.filter((x) => x !== id)
        : [...p.classes, id],
    }));
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
      const url = isEditMode ? `${API_URL}/${editingTeacher._id}` : API_URL;
      const method = isEditMode ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        experience: Number(formData.experience),
        salary: Number(formData.salary),
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
        {/* ── Section: Personal ── */}
        <h3 style={styles.sectionHeading}>Personal Information</h3>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. Dr. Ali Khan"
              style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
            />
            {renderError('name')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. prof_ali"
              style={{ ...styles.input, ...(errors.username ? styles.inputError : {}) }}
            />
            {renderError('username')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Employee ID *</label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. EMP-2024-001"
              style={{ ...styles.input, ...(errors.employeeId ? styles.inputError : {}) }}
            />
            {renderError('employeeId')}
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>CNIC</label>
            <input
              type="text"
              name="cnic"
              value={formData.cnic}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 61101-1234567-1"
              style={{ ...styles.input, ...(errors.cnic ? styles.inputError : {}) }}
            />
            {renderError('cnic')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              style={{ ...styles.input, ...styles.select }}
            >
              <option value="">-- Select --</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Phone *</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 03001234567"
              style={{ ...styles.input, ...(errors.phone ? styles.inputError : {}) }}
            />
            {renderError('phone')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. ali@example.com"
              style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
            />
            {renderError('email')}
          </div>
        </div>

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
          <div style={{ ...styles.field, flex: '0 1 250px' }}>
            <label style={styles.label}>Profile Picture URL</label>
            <input
              type="text"
              name="picture"
              value={formData.picture}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://..."
              style={{ ...styles.input, ...(errors.picture ? styles.inputError : {}) }}
            />
            {renderError('picture')}
          </div>
        </div>

        {/* ── Section: Professional ── */}
        <h3 style={styles.sectionHeading}>Professional Information</h3>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Designation *</label>
            <select
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...styles.select,
                ...(errors.designation ? styles.inputError : {}),
              }}
            >
              <option value="">-- Select Designation --</option>
              {DESIGNATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {renderError('designation')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Department (legacy)</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              style={{ ...styles.input, ...styles.select }}
            >
              <option value="">-- Select --</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Qualification</label>
            <input
              type="text"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              placeholder="e.g. M.Phil Physics"
              style={styles.input}
            />
          </div>
          <div style={{ ...styles.field, flex: '0 1 150px' }}>
            <label style={styles.label}>Experience (yrs) *</label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 5"
              style={{ ...styles.input, ...(errors.experience ? styles.inputError : {}) }}
            />
            {renderError('experience')}
          </div>
          <div style={{ ...styles.field, flex: '0 1 180px' }}>
            <label style={styles.label}>Salary (Rs) *</label>
            <input
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 85000"
              style={{ ...styles.input, ...(errors.salary ? styles.inputError : {}) }}
            />
            {renderError('salary')}
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Joining Date</label>
            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate}
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
        </div>

        {/* ── Section: Teaching Assignments ── */}
        <h3 style={styles.sectionHeading}>Teaching Assignments</h3>

        <div style={styles.row}>
          {/* Subjects multi-select */}
          <div style={{ ...styles.field, flex: '1 1 400px' }}>
            <label style={styles.label}>
              Subjects ({formData.subjects.length} selected)
            </label>
            <div style={styles.multiBox}>
              {subjects.length === 0 ? (
                <span style={styles.mutedText}>No subjects available.</span>
              ) : (
                subjects.map((s) => {
                  const checked = formData.subjects.includes(s._id);
                  return (
                    <label
                      key={s._id}
                      style={{
                        ...styles.checkboxItem,
                        backgroundColor: checked
                          ? s.colorHex + '22'
                          : '#ffffff',
                        borderColor: checked ? s.colorHex : '#e3e8f0',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSubject(s._id)}
                        style={styles.checkboxInput}
                      />
                      <span
                        style={{
                          ...styles.colorDot,
                          backgroundColor: s.colorHex || '#4a72c4',
                        }}
                      />
                      <span style={styles.checkboxLabelText}>
                        {s.name}
                        {s.code && (
                          <span style={styles.codeText}> ({s.code})</span>
                        )}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Classes multi-select */}
          <div style={{ ...styles.field, flex: '1 1 400px' }}>
            <label style={styles.label}>
              Classes ({formData.classes.length} selected)
            </label>
            <div style={styles.multiBox}>
              {classes.length === 0 ? (
                <span style={styles.mutedText}>No classes available.</span>
              ) : (
                classes.map((c) => {
                  const checked = formData.classes.includes(c._id);
                  return (
                    <label
                      key={c._id}
                      style={{
                        ...styles.checkboxItem,
                        backgroundColor: checked ? '#eef3fb' : '#ffffff',
                        borderColor: checked ? '#4a72c4' : '#e3e8f0',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleClass(c._id)}
                        style={styles.checkboxInput}
                      />
                      <span style={styles.checkboxLabelText}>{c.name}</span>
                    </label>
                  );
                })
              )}
            </div>
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
              ? 'Update Teacher'
              : 'Save Teacher'}
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

  // Multi-select styles
  multiBox: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '12px',
    border: '1px solid #e3e8f0',
    borderRadius: '6px',
    backgroundColor: '#fafbfd',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    border: '1.5px solid',
    borderRadius: '20px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none',
  },
  checkboxInput: {
    margin: 0,
    cursor: 'pointer',
  },
  checkboxLabelText: {
    fontWeight: '500',
    color: '#1f2937',
  },
  codeText: {
    color: '#6b7280',
    fontSize: '11px',
  },
  colorDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  mutedText: {
    color: '#9ca3af',
    fontSize: '13px',
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

export default TeacherForm;