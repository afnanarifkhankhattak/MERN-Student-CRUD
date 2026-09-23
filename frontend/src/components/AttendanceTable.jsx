// frontend/src/components/AttendanceTable.jsx

import { useEffect, useState } from 'react';
import {
  ATTENDANCE_URL as API_URL,
  CLASSES_URL,
  SECTIONS_URL,
  apiFetch,
} from '../api';

const RECORDS_PER_PAGE = 15;

// ── Status badge colors ──────────────────────────
const STATUS_STYLE = {
  present: { backgroundColor: '#d4edda', color: '#155724' },
  absent:  { backgroundColor: '#fee2e2', color: '#991b1b' },
  late:    { backgroundColor: '#fef3c7', color: '#92400e' },
  leave:   { backgroundColor: '#ede9fe', color: '#5b21b6' },
};

function AttendanceTable({ refreshTrigger, onEdit, onDelete }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter dropdown data
  const [classes, setClasses] = useState([]);
  const [allSections, setAllSections] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    from: '',
    to: '',
    status: '',
  });

  // ── Load filter dropdown data once ─────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [classRes, sectionRes] = await Promise.all([
          apiFetch(CLASSES_URL),
          apiFetch(SECTIONS_URL),
        ]);
        const cData = await classRes.json();
        const sData = await sectionRes.json();
        if (classRes.ok) setClasses(cData.data || []);
        if (sectionRes.ok) setAllSections(sData.data || []);
      } catch (e) {
        console.error('Failed to load filters', e);
      }
    };
    load();
  }, []);

  // Cascading section filter
  const filteredSections = allSections.filter((s) => {
    const sectionClassId = typeof s.class === 'object' ? s.class?._id : s.class;
    return sectionClassId === filters.class;
  });

  // ── Fetch attendance records ───────────────────
  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.class) params.append('class', filters.class);
      if (filters.section) params.append('section', filters.section);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.status) params.append('status', filters.status);
      const query = params.toString();
      const url = query ? `${API_URL}?${query}` : API_URL;

      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch records');
      setRecords(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, filters.class, filters.section, filters.from, filters.to, filters.status]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.class, filters.section, filters.from, filters.to, filters.status]);

  // Auto-fix page number
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(records.length / RECORDS_PER_PAGE));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [records, currentPage]);

  const totalPages = Math.max(1, Math.ceil(records.length / RECORDS_PER_PAGE));
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const currentRecords = records.slice(startIndex, startIndex + RECORDS_PER_PAGE);

  // ── Filter bar UI ──────────────────────────────
  const renderFilters = () => (
    <div style={styles.filterBar}>
      <select
        value={filters.class}
        onChange={(e) =>
          setFilters((f) => ({ ...f, class: e.target.value, section: '' }))
        }
        style={styles.filterSelect}
      >
        <option value="">All Classes</option>
        {classes.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>

      <select
        value={filters.section}
        onChange={(e) =>
          setFilters((f) => ({ ...f, section: e.target.value }))
        }
        disabled={!filters.class}
        style={{
          ...styles.filterSelect,
          opacity: !filters.class ? 0.5 : 1,
          cursor: !filters.class ? 'not-allowed' : 'pointer',
        }}
      >
        <option value="">
          {!filters.class ? 'Section (pick class)' : 'All Sections'}
        </option>
        {filteredSections.map((s) => (
          <option key={s._id} value={s._id}>{s.name}</option>
        ))}
      </select>

      <div style={styles.dateGroup}>
        <label style={styles.dateLabel}>From</label>
        <input
          type="date"
          value={filters.from}
          onChange={(e) =>
            setFilters((f) => ({ ...f, from: e.target.value }))
          }
          style={styles.dateInput}
        />
      </div>

      <div style={styles.dateGroup}>
        <label style={styles.dateLabel}>To</label>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          style={styles.dateInput}
        />
      </div>

      <select
        value={filters.status}
        onChange={(e) =>
          setFilters((f) => ({ ...f, status: e.target.value }))
        }
        style={styles.filterSelect}
      >
        <option value="">All Statuses</option>
        <option value="present">Present</option>
        <option value="absent">Absent</option>
        <option value="late">Late</option>
        <option value="leave">Leave</option>
      </select>

      {(filters.class ||
        filters.section ||
        filters.from ||
        filters.to ||
        filters.status) && (
        <button
          type="button"
          onClick={() =>
            setFilters({
              class: '',
              section: '',
              from: '',
              to: '',
              status: '',
            })
          }
          style={styles.clearBtn}
        >
          Clear Filters
        </button>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Attendance Records</h2>

      {renderFilters()}

      {loading ? (
        <p style={styles.info}>Loading records...</p>
      ) : error ? (
        <p style={styles.error}>Error: {error}</p>
      ) : records.length === 0 ? (
        <p style={styles.info}>
          No records found.
          {(filters.class || filters.section || filters.from || filters.to || filters.status) && (
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
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Class</th>
                  <th style={styles.th}>Section</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Remarks</th>
                  <th style={styles.th}>Marked By</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((r, i) => (
                  <tr key={r._id} style={styles.bodyRow}>
                    <td style={styles.td}>{startIndex + i + 1}</td>
                    <td style={styles.td}>
                      <span style={styles.dateBadge}>{r.date}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.studentCell}>
                        {r.student?.picture && (
                          <img
                            src={r.student.picture}
                            alt={r.student?.name}
                            style={styles.avatar}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <strong>{r.student?.name || '—'}</strong>
                          {r.student?.regNo && (
                            <div style={styles.subText}>{r.student.regNo}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{r.class?.name || '—'}</td>
                    <td style={styles.td}>
                      <span style={styles.sectionBadge}>
                        {r.section?.name || '—'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(STATUS_STYLE[r.status] || STATUS_STYLE.present),
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {r.remarks || <span style={styles.muted}>—</span>}
                    </td>
                    <td style={styles.td}>
                      {r.markedBy?.username || (
                        <span style={styles.muted}>—</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionRow}>
                        <button
                          style={{ ...styles.actionBtn, ...styles.editBtn }}
                          onClick={() => onEdit(r)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                          onClick={() => onDelete(r)}
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
            {Math.min(startIndex + RECORDS_PER_PAGE, records.length)} of{' '}
            {records.length} records
          </div>
        </>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1500px',
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
  dateGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    padding: '4px 10px',
    backgroundColor: '#fff',
  },
  dateLabel: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  dateInput: {
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    background: 'transparent',
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

  dateBadge: {
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  sectionBadge: {
    backgroundColor: '#f1f3f5',
    color: '#1e2a4a',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },

  studentCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid #e3e8f0',
  },
  subText: { fontSize: '11px', color: '#6b7280', marginTop: '2px' },
  muted: { color: '#9ca3af' },

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
    backgroundColor: '#4a72c4',
    color: 'white',
    borderColor: '#4a72c4',
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

export default AttendanceTable;