// frontend/src/components/ExpenseForm.jsx

import { useState, useEffect } from 'react';
import {
  EXPENSES_URL as API_URL,
  apiFetch,
} from '../api';

const EMPTY_FORM = {
  title: '',
  category: 'utilities',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  vendor: '',
  paymentMethod: 'cash',
  referenceNo: '',
  department: '',
  notes: '',
};

// Human-readable labels for categories
const CATEGORY_LABELS = {
  salary: '💰 Salary',
  utilities: '⚡ Utilities',
  internet: '🌐 Internet/Phone',
  rent: '🏢 Rent',
  maintenance: '🔧 Maintenance',
  transport: '🚌 Transport',
  supplies: '📎 Supplies',
  sports: '⚽ Sports',
  events: '🎉 Events',
  marketing: '📢 Marketing',
  legal: '⚖️ Legal',
  charity: '❤️ Charity',
  other: '📦 Other',
};

const PAYMENT_METHODS = [
  { value: 'cash',           label: '💵 Cash' },
  { value: 'bank-transfer',  label: '🏦 Bank Transfer' },
  { value: 'cheque',         label: '📝 Cheque' },
  { value: 'card',           label: '💳 Card' },
  { value: 'online',         label: '🌐 Online' },
  { value: 'other',          label: '📎 Other' },
];

function ExpenseForm({
  onExpenseAdded,
  editingExpense,
  onUpdateComplete,
  onCancelEdit,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isEditMode = editingExpense !== null;

  // Fetch categories from the backend on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`${API_URL}/categories`);
        const data = await res.json();
        if (res.ok) setCategories(data.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editingExpense) {
      setFormData({
        title: editingExpense.title || '',
        category: editingExpense.category || 'utilities',
        amount: editingExpense.amount ?? '',
        date: editingExpense.date || new Date().toISOString().split('T')[0],
        vendor: editingExpense.vendor || '',
        paymentMethod: editingExpense.paymentMethod || 'cash',
        referenceNo: editingExpense.referenceNo || '',
        department: editingExpense.department || '',
        notes: editingExpense.notes || '',
      });
      setErrors({});
      setMessage({ type: '', text: '' });
    } else {
      setFormData(EMPTY_FORM);
      setErrors({});
    }
  }, [editingExpense]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validateAll = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.category) errs.category = 'Category is required';

    const amt = Number(formData.amount);
    if (formData.amount === '' || isNaN(amt) || amt < 1) {
      errs.amount = 'Amount must be a positive number';
    }

    if (!formData.date) errs.date = 'Date is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
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
      const url = isEditMode ? `${API_URL}/${editingExpense._id}` : API_URL;
      const method = isEditMode ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        amount: Number(formData.amount),
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
          ? 'Expense updated successfully! ✅'
          : 'Expense recorded successfully! ✅',
      });
      setFormData(EMPTY_FORM);

      if (isEditMode) {
        if (onUpdateComplete) onUpdateComplete();
      } else {
        if (onExpenseAdded) onExpenseAdded();
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
        {isEditMode ? '✏️ Edit Expense' : 'Record New Expense'}
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

      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        {/* Row 1: Title + Category */}
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: '2 1 300px' }}>
            <label style={styles.label}>Expense Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. November electricity bill"
              style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
            />
            {renderError('title')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{ ...styles.input, ...styles.select, ...(errors.category ? styles.inputError : {}) }}
            >
              {categories.length === 0 ? (
                <option value="other">Loading categories...</option>
              ) : (
                categories.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c] || c}
                  </option>
                ))
              )}
            </select>
            {renderError('category')}
          </div>

          <div style={{ ...styles.field, flex: '0 1 160px' }}>
            <label style={styles.label}>Amount (Rs) *</label>
            <input
              type="number"
              min="1"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 45000"
              style={{ ...styles.input, ...(errors.amount ? styles.inputError : {}) }}
            />
            {renderError('amount')}
          </div>
        </div>

        {/* Row 2: Date + Payment Method */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Expense Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              style={{ ...styles.input, ...(errors.date ? styles.inputError : {}) }}
            />
            {renderError('date')}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Payment Method</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              style={{ ...styles.input, ...styles.select }}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Vendor / Payee</label>
            <input
              type="text"
              name="vendor"
              value={formData.vendor}
              onChange={handleChange}
              placeholder="e.g. IESCO, ABC Stationers"
              style={styles.input}
            />
          </div>
        </div>

        {/* Row 3: Reference + Department */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Reference No / Bill #</label>
            <input
              type="text"
              name="referenceNo"
              value={formData.referenceNo}
              onChange={handleChange}
              placeholder="e.g. TXN-2025-1234, cheque #012345"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Department (optional)</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g. Computer Science, Sports"
              style={styles.input}
            />
          </div>
        </div>

        {/* Row 4: Notes */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Notes (optional)</label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional detail"
              style={styles.input}
            />
          </div>
        </div>

        {/* Buttons */}
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
              ? 'Update Expense'
              : 'Save Expense'}
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

export default ExpenseForm;