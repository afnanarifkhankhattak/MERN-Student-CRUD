// frontend/src/components/FeeStructureTable.jsx

import { useEffect, useState } from 'react';
import {
  FEE_STRUCTURES_URL as API_URL,
  CLASSES_URL,
  ACADEMIC_YEARS_URL,
  apiFetch,
} from '../api';

function FeeStructureTable({ refreshTrigger, onEdit, onDelete }) {
  const [structures, setStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    class: '',
    academicYear: '',
    isActive: '',
  });

  // Load filter options
  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, yRes] = await Promise.all([
          apiFetch(CLASSES_URL),
          apiFetch(ACADEMIC_YEARS_URL),
        ]);
        const cData = await cRes.json();
        const yData = await yRes.json();
        if (cRes.ok) setClasses(cData.data || []);
        if (yRes.ok) setAcademicYears(yData.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.class) params.append('class', filters.class);
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      if (filters.isActive !== '') params.append('isActive', filters.isActive);
      const q = params.toString();
      const url = q ? `${API_URL}?${q}` : API_URL;

      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch structures');
      setStructures(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, filters.class, filters.academicYear, filters.isActive]);

  const renderFilters = () => (
    <div style={styles.filterBar}>
      <select
        value={filters.class}
        onChange={(e) => setFilters((f) => ({ ...f, class: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Classes</option>
        {classes.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>

      <select
        value={filters.academicYear}
        onChange={(e) => setFilters((f) => ({ ...f, academicYear: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Years</option>
        {academicYears.map((y) => (
          <option key={y._id} value={y._id}>{y.name}</option>
        ))}
      </select>

      <select
        value={filters.isActive}
        onChange={(e) => setFilters((f) => ({ ...f, isActive: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Statuses</option>
        <option value="true">Active Only</option>
        <option value="false">Inactive Only</option>
      </select>

      {(filters.class || filters.academicYear || filters.isActive !== '') && (
        <button
          type="button"
          onClick={() => setFilters({ class: '', academicYear: '', isActive: '' })}
          style={styles.clearBtn}
        >
          Clear Filters
        </button>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>All Fee Structures</h2>

      {renderFilters()}

      {loading ? (
        <p style={styles.info}>Loading structures...</p>
      ) : error ? (
        <p style={styles.error}>Error: {error}</p>
      ) : structures.length === 0 ? (
        <p style={styles.info}>
          No fee structures found. Create one above! 👆
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Year</th>
                <th style={styles.th}>Heads</th>
                <th style={styles.th}>Monthly</th>
                <th style={styles.th}>One-time</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {structures.map((s, i) => (
                <tr key={s._id} style={styles.bodyRow}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>
                    <strong>{s.name}</strong>
                    {s.notes && <div style={styles.subText}>{s.notes}</div>}
                  </td>
                  <td style={styles.td}>{s.class?.name || '—'}</td>
                  <td style={styles.td}>{s.academicYear?.name || '—'}</td>
                  <td style={styles.td}>
                    <div style={styles.pillRow}>
                      {(s.heads || []).slice(0, 3).map((h, idx) => (
                        <span key={idx} style={styles.headPill}>
                          {h.head}
                        </span>
                      ))}
                      {(s.heads || []).length > 3 && (
                        <span style={styles.moreCount}>+{s.heads.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <strong>Rs {Number(s.totalMonthly || 0).toLocaleString()}</strong>
                  </td>
                  <td style={styles.td}>
                    Rs {Number(s.totalOneTime || 0).toLocaleString()}
                  </td>
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
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  heading: { textAlign: 'center', color: '#1e2a4a', marginBottom: '20px' },
  filterBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterSelect: {
    padding: '9px 14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    backgroundColor: '#fff',
    minWidth: '150px',
  },
  clearBtn: {
    padding: '9px 14px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  headerRow: { backgroundColor: '#1e2a4a', color: 'white' },
  bodyRow: { borderBottom: '1px solid #eef1f6' },
  th: {
    padding: '10px',
    textAlign: 'left',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    whiteSpace: 'nowrap',
  },
  td: { padding: '10px', fontSize: '13px', verticalAlign: 'middle' },
  subText: { fontSize: '11px', color: '#6b7280', marginTop: '2px' },
  pillRow: { display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' },
  headPill: {
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  moreCount: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: 'bold',
    marginLeft: '2px',
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

export default FeeStructureTable;