// frontend/src/components/FeeForm.jsx

import { useState, useEffect } from 'react';
import {
  FEES_URL as API_URL,
  STUDENTS_URL,
  apiFetch,
} from '../api';

const EMPTY_FORM = {
  student: '',
  studentName: '',
  regNo: '',
  amount: '',
  paidAmount: '',
  dueDate: '',
  remarks: '',
};

function FeeForm({ onFeeAdded, editingFee, onUpdateComplete, onCancelEdit }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isEditMode = editingFee !== null;

  // Load students for the dropdown
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await apiFetch(STUDENTS_URL);
        const data = await res.json();
        if (res.ok) setStudents(data.data || []);
      } catch (e) {
        console.error('Failed to load students', e);
      }
    };
    loadStudents();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editingFee) {
      setFormData({
        student: editingFee.student || '',
        studentName: editingFee.studentName || '',
        regNo: editingFee.regNo || '',
        amount: editingFee.amount ?? '',
        paidAmount: editingFee.paidAmount ?? '',
        dueDate: editingFee.dueDate || '',
        remarks: editingFee.remarks || '',
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData(EMPTY_FORM);
      setErrors({});
    }
  }, [editingFee]);

  // ── When the student dropdown changes, save name + regNo ─
  const handleStudentChange = (e) => {
    const id = e.target.value;
    const found = students.find((s) => s._id === id);
    setFormData((prev) => ({
      ...prev,
      student: id,
      studentName: found ? found.name : '',
      regNo: found ? found.regNo : '',
    }));
    if (errors.student) {
      setErrors((prev) => ({ ...prev, student: '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateAll = () => {
    const newErrors = {};
    if (!formData.student) newErrors.student = 'Please select a student';
    if (formData.amount === '' || Number(formData.amount) < 0)
      newErrors.amount = 'Amount must be a non-negative number';
    if (formData.paidAmount === '' || Number(formData.paidAmount) < 0)
      newErrors.paidAmount = 'Paid amount must be a non-negative number';
    if (Number(formData.paidAmount) > Number(formData.amount)) {
      newErrors.paidAmount = 'Paid amount cannot exceed total amount';
    }
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
      const url = isEditMode ? `${API_URL}/${editingFee._id}` : API_URL;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount),
          paidAmount: Number(formData.paidAmount),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Something went wrong');

      setMessage({
        type: 'success',
        text: isEditMode
          ? 'Fee record updated successfully! ✅'
          : 'Fee record saved successfully! ✅',
      });
      setFormData(EMPTY_FORM);

      if (isEditMode) {
        if (onUpdateComplete) onUpdateComplete();
      } else {
        if (onFeeAdded) onFeeAdded();
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
        {isEditMode ? '✏️ Edit Fee Record' : 'Add Fee Record'}
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
        {/* Student selector */}
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: '2 1 300px' }}>
            <label style={styles.label}>Student *</label>
            <select
              name="student"
              value={formData.student}
              onChange={handleStudentChange}
              style={{
                ...styles.input,
                ...styles.select,
                ...(errors.student ? styles.inputError : {}),
              }}
            >
              <option value="">-- Select a Student --</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.regNo})
                </option>
              ))}
            </select>
            {renderError('student')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Reg No</label>
            <input
              type="text"
              value={formData.regNo}
              readOnly
              placeholder="auto-filled"
              style={{ ...styles.input, backgroundColor: '#f0f2f5' }}
            />
          </div>
        </div>

        {/* Amounts */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Total Amount (Rs) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 50000"
              style={{ ...styles.input, ...(errors.amount ? styles.inputError : {}) }}
            />
            {renderError('amount')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Paid Amount (Rs) *</label>
            <input
              type="number"
              name="paidAmount"
              value={formData.paidAmount}
              onChange={handleChange}
              placeholder="e.g. 20000"
              style={{ ...styles.input, ...(errors.paidAmount ? styles.inputError : {}) }}
            />
            {renderError('paidAmount')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        {/* Remarks */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Remarks (optional)</label>
            <input
              type="text"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="e.g. Installment 1 of 3"
              style={styles.input}
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
            {loading ? 'Saving...' : isEditMode ? 'Update Fee' : 'Save Fee'}
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
    maxWidth: '900px', margin: '20px auto', padding: '20px',
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

export default FeeForm;