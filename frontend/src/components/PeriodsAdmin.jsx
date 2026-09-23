// frontend/src/components/PeriodsAdmin.jsx

import { useState, useEffect } from 'react';
import {
  PERIODS_URL as API_URL,
  apiFetch,
} from '../api';

const EMPTY_FORM = {
  name: '',
  order: '',
  startTime: '',
  endTime: '',
  isBreak: false,
  isActive: true,
  notes: '',
};

function PeriodsAdmin({ showToast }) {
  const [periods, setPeriods] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Load periods ───────────────────────────────
  const loadPeriods = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_URL);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load periods');
      setPeriods(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const v = type === 'checkbox' ? checked : value;
    setFormData((p) => ({ ...p, [name]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (formData.order === '') return;

    setSaving(true);
    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        order: Number(formData.order),
      };

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');

      showToast(
        'success',
        editingId ? 'Period updated ✅' : 'Period added ✅'
      );
      setFormData(EMPTY_FORM);
      setEditingId(null);
      loadPeriods();
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    setFormData({
      name: p.name || '',
      order: p.order ?? '',
      startTime: p.startTime || '',
      endTime: p.endTime || '',
      isBreak: !!p.isBreak,
      isActive: p.isActive !== undefined ? p.isActive : true,
      notes: p.notes || '',
    });
    setEditingId(p._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete period "${p.name}"?`)) return;
    try {
      const res = await apiFetch(`${API_URL}/${p._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      showToast('success', 'Period deleted ✅');
      loadPeriods();
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  return (
    <div style={styles.container}>
      {/* Form */}
      <div style={styles.formCard}>
        <h3 style={styles.formTitle}>
          {editingId ? '✏️ Edit Period' : '➕ Add Period'}
        </h3>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={{ ...styles.field, flex: '2 1 220px' }}>
              <label style={styles.label}>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Period 1, Break, Assembly"
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.field, flex: '0 0 100px' }}>
              <label style={styles.label}>Order *</label>
              <input
                type="number"
                name="order"
                min="0"
                value={formData.order}
                onChange={handleChange}
                placeholder="1"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Start</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>End</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.field, flex: '0 0 120px' }}>
              <label style={styles.label}>Break?</label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isBreak"
                  checked={formData.isBreak}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                Break
              </label>
            </div>

            <div style={{ ...styles.field, flex: '0 0 120px' }}>
              <label style={styles.label}>Active?</label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                Active
              </label>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Notes (optional)</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any note"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.buttonRow}>
            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.primaryBtn,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : editingId ? 'Update Period' : 'Add Period'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <h3 style={styles.formTitle}>All Periods ({periods.length})</h3>

        {loading ? (
          <p style={styles.info}>Loading periods...</p>
        ) : error ? (
          <p style={styles.error}>{error}</p>
        ) : periods.length === 0 ? (
          <p style={styles.info}>
            No periods yet. Add one above to get started.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Order</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((p) => (
                  <tr key={p._id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.orderBadge}>{p.order}</span>
                    </td>
                    <td style={styles.td}>
                      <strong>{p.name}</strong>
                      {p.notes && (
                        <div style={styles.subText}>{p.notes}</div>
                      )}
                    </td>
                    <td style={styles.td}>
                      {p.startTime || '—'}
                      {p.endTime && ` – ${p.endTime}`}
                    </td>
                    <td style={styles.td}>
                      {p.isBreak ? (
                        <span style={styles.breakPill}>Break</span>
                      ) : (
                        <span style={styles.classPill}>Class</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {p.isActive ? (
                        <span style={styles.badgeActive}>● Active</span>
                      ) : (
                        <span style={styles.badgeInactive}>○ Inactive</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionRow}>
                        <button
                          onClick={() => handleEdit(p)}
                          style={{ ...styles.actionBtn, ...styles.editBtn }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formCard: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  tableCard: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  formTitle: {
    margin: '0 0 14px',
    fontSize: '15px',
    color: '#1e2a4a',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  row: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  field: { flex: '1 1 160px', display: 'flex', flexDirection: 'column' },
  label: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  input: {
    padding: '9px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 0',
    fontSize: '13px',
    cursor: 'pointer',
  },
  checkbox: { width: '16px', height: '16px', cursor: 'pointer' },
  buttonRow: { display: 'flex', gap: '10px', marginTop: '6px' },
  primaryBtn: {
    padding: '10px 22px',
    backgroundColor: '#4a72c4',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cancelBtn: {
    padding: '10px 22px',
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  thead: { backgroundColor: '#1e2a4a', color: '#fff' },
  th: {
    padding: '10px',
    textAlign: 'left',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tr: { borderBottom: '1px solid #eef1f6' },
  td: { padding: '10px', fontSize: '13px' },
  subText: { fontSize: '11px', color: '#6b7280', marginTop: '2px' },
  orderBadge: {
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  breakPill: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  classPill: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  badgeActive: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  badgeInactive: {
    backgroundColor: '#f1f3f5',
    color: '#6b7280',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  actionRow: { display: 'flex', gap: '6px' },
  actionBtn: {
    padding: '5px 12px',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  editBtn: { backgroundColor: '#28a745' },
  deleteBtn: { backgroundColor: '#dc3545' },
  info: { textAlign: 'center', color: '#6b7280', padding: '20px' },
  error: { textAlign: 'center', color: '#dc3545', padding: '20px' },
};

export default PeriodsAdmin;