// frontend/src/components/ParentTable.jsx

import { useEffect, useState } from 'react';
import { PARENTS_URL as API_URL, apiFetch } from '../api';

const PARENTS_PER_PAGE = 10;

// ── Relation badge colors ────────────────────────
const RELATION_STYLE = {
  father:   { backgroundColor: '#dbeafe', color: '#1e40af' },
  mother:   { backgroundColor: '#fce7f3', color: '#9d174d' },
  guardian: { backgroundColor: '#fef3c7', color: '#92400e' },
  other:    { backgroundColor: '#f1f3f5', color: '#6b7280' },
};

function ParentTable({ refreshTrigger, onEdit, onDelete }) {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Filter state ────────────────────────────────
  const [filters, setFilters] = useState({
    search: '',
    relation: '',
  });

  // ── Fetch parents ──────────────────────────────
  const fetchParents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.search.trim()) params.append('search', filters.search.trim());
      if (filters.relation) params.append('relation', filters.relation);
      const query = params.toString();
      const url = query ? `${API_URL}?${query}` : API_URL;

      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch parents');
      setParents(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, filters.search, filters.relation]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.relation]);

  // Auto-fix page number if we went out of range
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(parents.length / PARENTS_PER_PAGE));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [parents, currentPage]);

  const totalPages = Math.max(1, Math.ceil(parents.length / PARENTS_PER_PAGE));
  const startIndex = (currentPage - 1) * PARENTS_PER_PAGE;
  const currentParents = parents.slice(startIndex, startIndex + PARENTS_PER_PAGE);

  // ── Filter bar ─────────────────────────────────
  const renderFilters = () => (
    <div style={styles.filterBar}>
      <input
        type="text"
        placeholder="🔍 Search by name, phone, CNIC, email..."
        value={filters.search}
        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        style={styles.filterInput}
      />

      <select
        value={filters.relation}
        onChange={(e) => setFilters((f) => ({ ...f, relation: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Relations</option>
        <option value="father">Father</option>
        <option value="mother">Mother</option>
        <option value="guardian">Guardian</option>
        <option value="other">Other</option>
      </select>

      {(filters.search || filters.relation) && (
        <button
          type="button"
          onClick={() => setFilters({ search: '', relation: '' })}
          style={styles.clearBtn}
        >
          Clear Filters
        </button>
      )}
    </div>
  );

  // ── Render ──────────────────────────────────────
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>All Parents</h2>

      {renderFilters()}

      {loading ? (
        <p style={styles.info}>Loading parents...</p>
      ) : error ? (
        <p style={styles.error}>Error: {error}</p>
      ) : parents.length === 0 ? (
        <p style={styles.info}>
          No parents found.
          {(filters.search || filters.relation) && (
            <> Try clearing filters.</>
          )}
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Relation</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Alt Phone</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>CNIC</th>
                  <th style={styles.th}>Occupation</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentParents.map((p, i) => (
                  <tr key={p._id} style={styles.bodyRow}>
                    <td style={styles.td}>{startIndex + i + 1}</td>

                    <td style={styles.td}>
                      <strong>{p.name}</strong>
                      {p.address && (
                        <div style={styles.subText}>{p.address}</div>
                      )}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.relationBadge,
                          ...(RELATION_STYLE[p.relation] || RELATION_STYLE.other),
                        }}
                      >
                        {p.relation}
                      </span>
                    </td>

                    <td style={styles.td}>{p.phone}</td>
                    <td style={styles.td}>
                      {p.altPhone || <span style={styles.muted}>—</span>}
                    </td>
                    <td style={styles.td}>
                      {p.email || <span style={styles.muted}>—</span>}
                    </td>
                    <td style={styles.td}>
                      {p.cnic ? (
                        <span style={styles.cnicBadge}>{p.cnic}</span>
                      ) : (
                        <span style={styles.muted}>—</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {p.occupation || <span style={styles.muted}>—</span>}
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
                          style={{ ...styles.actionBtn, ...styles.editBtn }}
                          onClick={() => onEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                          onClick={() => onDelete(p)}
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

          {/* Pagination */}
          <div style={styles.pagination}>
            <button
              style={{
                ...styles.pageBtn,
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              }}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                style={{
                  ...styles.pageBtn,
                  ...(page === currentPage ? styles.pageBtnActive : {}),
                }}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              style={{
                ...styles.pageBtn,
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              }}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>

          <div style={styles.pageInfo}>
            Showing {startIndex + 1}–
            {Math.min(startIndex + PARENTS_PER_PAGE, parents.length)} of{' '}
            {parents.length} parents
          </div>
        </>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────
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
  heading: { textAlign: 'center', color: '#333', marginBottom: '20px' },

  filterBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterInput: {
    flex: '1 1 260px',
    padding: '9px 14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    minWidth: '220px',
    outline: 'none',
  },
  filterSelect: {
    padding: '9px 14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    backgroundColor: '#fff',
    minWidth: '160px',
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
  headerRow: { backgroundColor: '#007bff', color: 'white' },
  bodyRow: { borderBottom: '1px solid #ddd' },
  th: { padding: '10px', textAlign: 'left', fontSize: '13px', whiteSpace: 'nowrap' },
  td: { padding: '10px', fontSize: '13px', verticalAlign: 'middle' },

  subText: { fontSize: '11px', color: '#6b7280', marginTop: '2px' },
  muted: { color: '#9ca3af' },

  relationBadge: {
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },

  cnicBadge: {
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
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

  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    marginTop: '20px',
    flexWrap: 'wrap',
  },
  pageBtn: {
    padding: '8px 14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#333',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  pageBtnActive: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  },
  pageInfo: {
    textAlign: 'center',
    marginTop: '10px',
    color: '#666',
    fontSize: '13px',
  },
  info: { textAlign: 'center', color: '#666', margin: '20px' },
  error: { textAlign: 'center', color: '#dc3545', margin: '20px' },
};

export default ParentTable;