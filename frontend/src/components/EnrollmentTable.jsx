// frontend/src/components/EnrollmentTable.jsx

import { useEffect, useState } from 'react';
import {
  ENROLLMENTS_URL as API_URL,
  CLASSES_URL,
  SECTIONS_URL,
  ACADEMIC_YEARS_URL,
  apiFetch,
} from '../api';

const ENROLLMENTS_PER_PAGE = 10;

// ── Status badge colors ──────────────────────────
const STATUS_STYLE = {
  active:      { backgroundColor: '#d4edda', color: '#155724' },
  transferred: { backgroundColor: '#fef3c7', color: '#92400e' },
  completed:   { backgroundColor: '#dbeafe', color: '#1e40af' },
  dropped:     { backgroundColor: '#fee2e2', color: '#991b1b' },
};

function EnrollmentTable({ refreshTrigger, onEdit, onDelete, onViewRoster }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Dropdown data for filters
  const [classes, setClasses] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  // ── Filters ────────────────────────────────────
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    academicYear: '',
    status: '',
  });

  // ── Load filter dropdowns once ─────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [classRes, sectionRes, yearRes] = await Promise.all([
          apiFetch(CLASSES_URL),
          apiFetch(SECTIONS_URL),
          apiFetch(ACADEMIC_YEARS_URL),
        ]);
        const cData = await classRes.json();
        const secData = await sectionRes.json();
        const yData = await yearRes.json();

        if (classRes.ok) setClasses(cData.data || []);
        if (sectionRes.ok) setAllSections(secData.data || []);
        if (yearRes.ok) setAcademicYears(yData.data || []);
      } catch (e) {
        console.error('Failed to load enrollment filters', e);
      }
    };
    load();
  }, []);

  // ── Cascading section filter ───────────────────
  const filteredSections = allSections.filter((s) => {
    const sectionClassId =
      typeof s.class === 'object' ? s.class?._id : s.class;
    return sectionClassId === filters.class;
  });

  // ── Fetch enrollments ──────────────────────────
  const fetchEnrollments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.class) params.append('class', filters.class);
      if (filters.section) params.append('section', filters.section);
      if (filters.academicYear)
        params.append('academicYear', filters.academicYear);
      if (filters.status) params.append('status', filters.status);
      const query = params.toString();
      const url = query ? `${API_URL}?${query}` : API_URL;

      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || 'Failed to fetch enrollments');
      setEnrollments(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, filters.class, filters.section, filters.academicYear, filters.status]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.class, filters.section, filters.academicYear, filters.status]);

  // Auto-fix page number if out of range
  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(enrollments.length / ENROLLMENTS_PER_PAGE)
    );
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [enrollments, currentPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(enrollments.length / ENROLLMENTS_PER_PAGE)
  );
  const startIndex = (currentPage - 1) * ENROLLMENTS_PER_PAGE;
  const currentEnrollments = enrollments.slice(
    startIndex,
    startIndex + ENROLLMENTS_PER_PAGE
  );

  // Whether the "View Roster" button should be enabled
  const canViewRoster =
    filters.class && filters.section && filters.academicYear;

  // ── Filter bar ─────────────────────────────────
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
          {!filters.class ? 'Section (pick class first)' : 'All Sections'}
        </option>
        {filteredSections.map((s) => (
          <option key={s._id} value={s._id}>{s.name}</option>
        ))}
      </select>

      <select
        value={filters.academicYear}
        onChange={(e) =>
          setFilters((f) => ({ ...f, academicYear: e.target.value }))
        }
        style={styles.filterSelect}
      >
        <option value="">All Years</option>
        {academicYears.map((y) => (
          <option key={y._id} value={y._id}>
            {y.name} {y.isActive ? '(Active)' : ''}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) =>
          setFilters((f) => ({ ...f, status: e.target.value }))
        }
        style={styles.filterSelect}
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="transferred">Transferred</option>
        <option value="completed">Completed</option>
        <option value="dropped">Dropped</option>
      </select>

      <button
        type="button"
        onClick={() => onViewRoster(filters)}
        disabled={!canViewRoster}
        style={{
          ...styles.rosterBtn,
          opacity: canViewRoster ? 1 : 0.5,
          cursor: canViewRoster ? 'pointer' : 'not-allowed',
        }}
        title={
          canViewRoster
            ? 'View the class roster in a printable format'
            : 'Pick class, section, and year to view the roster'
        }
      >
        📋 View Roster
      </button>

      {(filters.class ||
        filters.section ||
        filters.academicYear ||
        filters.status) && (
        <button
          type="button"
          onClick={() =>
            setFilters({
              class: '',
              section: '',
              academicYear: '',
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
      <h2 style={styles.heading}>All Enrollments</h2>

      {renderFilters()}

      {loading ? (
        <p style={styles.info}>Loading enrollments...</p>
      ) : error ? (
        <p style={styles.error}>Error: {error}</p>
      ) : enrollments.length === 0 ? (
        <p style={styles.info}>
          No enrollments found.
          {(filters.class ||
            filters.section ||
            filters.academicYear ||
            filters.status) && <> Try clearing filters.</>}
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Class</th>
                  <th style={styles.th}>Section</th>
                  <th style={styles.th}>Year</th>
                  <th style={styles.th}>Roll</th>
                  <th style={styles.th}>Enrolled</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentEnrollments.map((e, i) => (
                  <tr key={e._id} style={styles.bodyRow}>
                    <td style={styles.td}>{startIndex + i + 1}</td>

                    <td style={styles.td}>
                      <div style={styles.studentCell}>
                        {e.student?.picture && (
                          <img
                            src={e.student.picture}
                            alt={e.student?.name}
                            style={styles.studentImg}
                            onError={(ev) => {
                              ev.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <strong>{e.student?.name || '—'}</strong>
                          {e.student?.regNo && (
                            <div style={styles.subText}>
                              {e.student.regNo}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={styles.td}>{e.class?.name || '—'}</td>
                    <td style={styles.td}>
                      <span style={styles.sectionBadge}>
                        {e.section?.name || '—'}
                      </span>
                    </td>
                    <td style={styles.td}>{e.academicYear?.name || '—'}</td>

                    <td style={styles.td}>
                      <span style={styles.rollBadge}>{e.rollNo}</span>
                    </td>

                    <td style={styles.td}>
                      {e.enrolledDate || (
                        <span style={styles.muted}>—</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(STATUS_STYLE[e.status] ||
                            STATUS_STYLE.active),
                        }}
                      >
                        ● {e.status}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actionRow}>
                        <button
                          style={{ ...styles.actionBtn, ...styles.editBtn }}
                          onClick={() => onEdit(e)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                          onClick={() => onDelete(e)}
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
                cursor:
                  currentPage === totalPages ? 'not-allowed' : 'pointer',
              }}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>

          <div style={styles.pageInfo}>
            Showing {startIndex + 1}–
            {Math.min(startIndex + ENROLLMENTS_PER_PAGE, enrollments.length)} of{' '}
            {enrollments.length} enrollments
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
  heading: { textAlign: 'center', color: '#333', marginBottom: '20px' },

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
    minWidth: '160px',
  },
  rosterBtn: {
    padding: '9px 16px',
    backgroundColor: '#6f42c1',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
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
  th: {
    padding: '10px',
    textAlign: 'left',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  td: { padding: '10px', fontSize: '13px', verticalAlign: 'middle' },

  studentCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  studentImg: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid #e3e8f0',
  },
  subText: { fontSize: '11px', color: '#6b7280', marginTop: '2px' },
  muted: { color: '#9ca3af' },

  sectionBadge: {
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
  },

  rollBadge: {
    backgroundColor: '#1e2a4a',
    color: '#ffffff',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },

  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'capitalize',
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

export default EnrollmentTable;