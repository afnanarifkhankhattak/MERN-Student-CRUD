// frontend/src/components/AcademicYearTable.jsx

import { useEffect, useState } from 'react';
import { ACADEMIC_YEARS_URL as API_URL, apiFetch } from '../api';

function AcademicYearTable({ refreshTrigger, onEdit, onDelete }) {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchYears = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_URL);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch academic years');
      setYears(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, [refreshTrigger]);

  if (loading) return <p style={styles.info}>Loading academic years...</p>;
  if (error) return <p style={styles.error}>Error: {error}</p>;
  if (years.length === 0)
    return <p style={styles.info}>No academic years yet. Add one above! 👆</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>All Academic Years</h2>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Start Date</th>
              <th style={styles.th}>End Date</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {years.map((year, i) => (
              <tr key={year._id} style={styles.bodyRow}>
                <td style={styles.td}>{i + 1}</td>
                <td style={styles.td}>
                  <strong>{year.name}</strong>
                </td>
                <td style={styles.td}>{year.startDate || '—'}</td>
                <td style={styles.td}>{year.endDate || '—'}</td>
                <td style={styles.td}>
                  {year.isActive ? (
                    <span style={styles.badgeActive}>● Active</span>
                  ) : (
                    <span style={styles.badgeInactive}>○ Inactive</span>
                  )}
                </td>
                <td style={styles.td}>{year.description || '—'}</td>
                <td style={styles.td}>
                  <div style={styles.actionRow}>
                    <button
                      style={{ ...styles.actionBtn, ...styles.editBtn }}
                      onClick={() => onEdit(year)}
                    >
                      Edit
                    </button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                      onClick={() => onDelete(year)}
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
    maxWidth: '1100px',
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

export default AcademicYearTable;