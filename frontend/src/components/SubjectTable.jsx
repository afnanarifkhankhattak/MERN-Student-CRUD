// frontend/src/components/SubjectTable.jsx

import { useEffect, useState } from 'react';
import { SUBJECTS_URL as API_URL, apiFetch } from '../api';

function SubjectTable({ refreshTrigger, onEdit, onDelete }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubjects = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_URL);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch subjects');
      setSubjects(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [refreshTrigger]);

  if (loading) return <p style={styles.info}>Loading subjects...</p>;
  if (error) return <p style={styles.error}>Error: {error}</p>;
  if (subjects.length === 0)
    return <p style={styles.info}>No subjects yet. Add one above! 👆</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>All Subjects</h2>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Color</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Code</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => (
              <tr key={s._id} style={styles.bodyRow}>
                <td style={styles.td}>{i + 1}</td>
                <td style={styles.td}>
                  <div
                    style={{
                      ...styles.colorDot,
                      backgroundColor: s.colorHex || '#4a72c4',
                    }}
                    title={s.colorHex}
                  />
                </td>
                <td style={styles.td}>
                  <strong>{s.name}</strong>
                </td>
                <td style={styles.td}>
                  {s.code ? (
                    <span
                      style={{
                        ...styles.codeBadge,
                        backgroundColor: s.colorHex || '#4a72c4',
                      }}
                    >
                      {s.code}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={styles.td}>
                  {s.isCore ? (
                    <span style={styles.badgeCore}>Core</span>
                  ) : (
                    <span style={styles.badgeElective}>Elective</span>
                  )}
                </td>
                <td style={styles.td}>{s.description || '—'}</td>
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
  colorDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '1px solid #e5e7eb',
  },
  codeBadge: {
    color: 'white',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  badgeCore: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  badgeElective: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
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

export default SubjectTable;