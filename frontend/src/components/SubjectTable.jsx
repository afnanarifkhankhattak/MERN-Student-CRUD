// frontend/src/components/TeacherTable.jsx

import { useEffect, useState } from 'react';
import {
  TEACHERS_URL as API_URL,
  SUBJECTS_URL,
  CLASSES_URL,
  apiFetch,
} from '../api';

const TEACHERS_PER_PAGE = 10;

// ── Status badge colors ──────────────────────────
const STATUS_STYLE = {
  active:   { backgroundColor: '#d4edda', color: '#155724' },
  inactive: { backgroundColor: '#f1f3f5', color: '#6b7280' },
  resigned: { backgroundColor: '#fee2e2', color: '#991b1b' },
};

function TeacherTable({
  refreshTrigger,
  onEdit,
  onDelete,
  onDuplicate,
}) {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Filters ────────────────────────────────────
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    class: '',
    status: '',
  });

  // ── Load subjects + classes once for the filters ─
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [subjectRes, classRes] = await Promise.all([
          apiFetch(SUBJECTS_URL),
          apiFetch(CLASSES_URL),
        ]);
        const subData = await subjectRes.json();
        const classData = await classRes.json();
        if (subjectRes.ok) setSubjects(subData.data || []);
        if (classRes.ok) setClasses(classData.data || []);
      } catch (e) {
        console.error('Failed to load filter options', e);
      }
    };
    loadOptions();
  }, []);

  // ── Fetch teachers with filters ─────────────────
  const fetchTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.search.trim()) params.append('search', filters.search.trim());
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.class) params.append('class', filters.class);
      if (filters.status) params.append('status', filters.status);
      const query = params.toString();
      const url = query ? `${API_URL}?${query}` : API_URL;

      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch teachers');
      setTeachers(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, filters.search, filters.subject, filters.class, filters.status]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.subject, filters.class, filters.status]);

  // Auto-fix currentPage if out of range
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(teachers.length / TEACHERS_PER_PAGE));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [teachers, currentPage]);

  const totalPages = Math.max(1, Math.ceil(teachers.length / TEACHERS_PER_PAGE));
  const startIndex = (currentPage - 1) * TEACHERS_PER_PAGE;
  const currentTeachers = teachers.slice(startIndex, startIndex + TEACHERS_PER_PAGE);

  // ── Filter bar UI ──────────────────────────────
  const renderFilters = () => (
    <div style={styles.filterBar}>
      <input
        type="text"
        placeholder="🔍 Search by name, employee ID, email..."
        value={filters.search}
        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        style={styles.filterInput}
      />

      <select
        value={filters.subject}
        onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Subjects</option>
        {subjects.map((s) => (
          <option key={s._id} value={s._id}>{s.name}</option>
        ))}
      </select>

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
        value={filters.status}
        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="resigned">Resigned</option>
      </select>

      {(filters.search || filters.subject || filters.class || filters.status) && (
        <button
          type="button"
          onClick={() =>
            setFilters({ search: '', subject: '', class: '', status: '' })
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
      <h2 style={styles.heading}>All Teachers</h2>

      {renderFilters()}

      {loading ? (
        <p style={styles.info}>Loading teachers...</p>
      ) : error ? (
        <p style={styles.error}>Error: {error}</p>
      ) : teachers.length === 0 ? (
        <p style={styles.info}>
          No teachers found.
          {(filters.search || filters.subject || filters.class || filters.status) && (
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
                  <th style={styles.th}>Picture</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Employee ID</th>
                  <th style={styles.th}>Designation</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Qualification</th>
                  <th style={styles.th}>Subjects</th>
                  <th style={styles.th}>Classes</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentTeachers.map((t, i) => (
                  <tr key={t._id} style={styles.bodyRow}>
                    <td style={styles.td}>{startIndex + i + 1}</td>

                    <td style={styles.td}>
                      <img
                        src={t.picture}
                        alt={t.name}
                        style={styles.img}
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+';
                        }}
                      />
                    </td>

                    <td style={styles.td}>
                      <strong>{t.name}</strong>
                      {t.email && (
                        <div style={styles.subText}>{t.email}</div>
                      )}
                    </td>

                    <td style={styles.td}>
                      <span style={styles.idBadge}>{t.employeeId}</span>
                    </td>

                    <td style={styles.td}>{t.designation}</td>
                    <td style={styles.td}>{t.phone}</td>

                    <td style={styles.td}>
                      {t.qualification || (
                        <span style={styles.mutedText}>—</span>
                      )}
                    </td>

                    {/* Subjects pills */}
                    <td style={styles.td}>
                      {!t.subjects || t.subjects.length === 0 ? (
                        <span style={styles.mutedText}>—</span>
                      ) : (
                        <div style={styles.pillRow}>
                          {t.subjects.slice(0, 3).map((sub) => (
                            <span
                              key={sub._id}
                              style={{
                                ...styles.subjectPill,
                                backgroundColor:
                                  (sub.colorHex || '#4a72c4') + '22',
                                color: sub.colorHex || '#4a72c4',
                                border: `1px solid ${
                                  sub.colorHex || '#4a72c4'
                                }`,
                              }}
                            >
                              {sub.code || sub.name}
                            </span>
                          ))}
                          {t.subjects.length > 3 && (
                            <span style={styles.moreCount}>
                              +{t.subjects.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Classes pills */}
                    <td style={styles.td}>
                      {!t.classes || t.classes.length === 0 ? (
                        <span style={styles.mutedText}>—</span>
                      ) : (
                        <div style={styles.pillRow}>
                          {t.classes.slice(0, 3).map((cl) => (
                            <span key={cl._id} style={styles.classPill}>
                              {cl.name}
                            </span>
                          ))}
                          {t.classes.length > 3 && (
                            <span style={styles.moreCount}>
                              +{t.classes.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(STATUS_STYLE[t.status] || STATUS_STYLE.active),
                        }}
                      >
                        ● {t.status || 'active'}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actionRow}>
                        <button
                          style={{ ...styles.actionBtn, ...styles.editBtn }}
                          onClick={() => onEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                          onClick={() => onDelete(t)}
                        >
                          Delete
                        </button>
                        {onDuplicate && (
                          <button
                            style={{
                              ...styles.actionBtn,
                              ...styles.duplicateBtn,
                            }}
                            onClick={() => onDuplicate(t)}
                          >
                            Duplicate
                          </button>
                        )}
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
            {Math.min(startIndex + TEACHERS_PER_PAGE, teachers.length)} of{' '}
            {teachers.length} teachers
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
  filterInput: {
    flex: '1 1 240px',
    padding: '9px 14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    minWidth: '200px',
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
  headerRow: { backgroundColor: '#007bff', color: 'white' },
  bodyRow: { borderBottom: '1px solid #ddd' },
  th: {
    padding: '10px',
    textAlign: 'left',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  td: { padding: '10px', fontSize: '13px', verticalAlign: 'middle' },
  img: {
    width: '42px',
    height: '42px',
    objectFit: 'cover',
    borderRadius: '50%',
    border: '1px solid #ccc',
  },

  subText: { fontSize: '11px', color: '#6b7280', marginTop: '2px' },
  mutedText: { color: '#9ca3af' },

  idBadge: {
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },

  pillRow: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  subjectPill: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    letterSpacing: '0.3px',
  },
  classPill: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    border: '1px solid #4a72c4',
  },
  moreCount: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: 'bold',
    marginLeft: '2px',
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
  duplicateBtn: { backgroundColor: '#17a2b8' },

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

export default TeacherTable;