// frontend/src/components/SectionTable.jsx

import { useEffect, useState } from 'react';
import { SECTIONS_URL as API_URL, apiFetch } from '../api';

function SectionTable({ refreshTrigger, onEdit, onDelete }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSections = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_URL);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch sections');
      setSections(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [refreshTrigger]);

  if (loading) return <p style={styles.info}>Loading sections...</p>;
  if (error) return <p style={styles.error}>Error: {error}</p>;
  if (sections.length === 0)
    return <p style={styles.info}>No sections yet. Add one above! 👆</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>All Sections</h2>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Class</th>
              <th style={styles.th}>Section</th>
              <th style={styles.th}>Class Teacher</th>
              <th style={styles.th}>Capacity</th>
              <th style={styles.th}>Room</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s, i) => (
              <tr key={s._id} style={styles.bodyRow}>
                <td style={styles.td}>{i + 1}</td>
                <td style={styles.td}>
                  {s.class?.name || '—'}
                </td>
                <td style={styles.td}>
                  <strong>{s.name}</strong>
                </td>
                <td style={styles.td}>
                  {s.classTeacher?.name || (
                    <span style={{ color: '#9ca3af' }}>Unassigned</span>
                  )}
                </td>
                <td style={styles.td}>{s.capacity}</td>
                <td style={styles.td}>{s.room || '—'}</td>
                <td style={styles.td}>
                  {s.isActive ? (
                    <span style={styles.badgeActive}>● Active</span>
                  ) : (
                    <span style={styles.badgeInactive}>○ Inactive</span>
                  )}
                </td>
                <td style={styles.td}>
                  <div style={styles.actionRow}>
                    <button
                      style={{ ...styles.actionBtn, ...styles.editBtn }}
                      onClick={() => onEdit(s)}
                    >
                      Edit
                    </button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                      onClick={() => onDelete(s)}
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
    </div>
  );
}

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
  heading: { textAlign: 'center', color: '#333', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  headerRow: { backgroundColor: '#007bff', color: 'white' },
  bodyRow: { borderBottom: '1px solid #ddd' },
  th: { padding: '10px', textAlign: 'left', fontSize: '13px' },
  td: { padding: '10px', fontSize: '13px', verticalAlign: 'middle' },
  badgeActive: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  badgeInactive: {
    backgroundColor: '#f1f3f5',
    color: '#6b7280',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  actionRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  actionBtn: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  editBtn: { backgroundColor: '#28a745' },
  deleteBtn: { backgroundColor: '#dc3545' },
  info: { textAlign: 'center', color: '#666', margin: '20px' },
  error: { textAlign: 'center', color: '#dc3545', margin: '20px' },
};

export default SectionTable;