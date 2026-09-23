// frontend/src/components/StudentTable.jsx

import { useEffect, useState } from 'react';
import UploadCSV from './UploadCSV';
import {
  STUDENTS_URL as API_URL,
  CLASSES_URL,
  apiFetch,
} from '../api';

const STUDENTS_PER_PAGE = 10;

// ── Status badge colors ──────────────────────────
const STATUS_STYLE = {
  active:   { backgroundColor: '#d4edda', color: '#155724' },
  inactive: { backgroundColor: '#f1f3f5', color: '#6b7280' },
  alumni:   { backgroundColor: '#dbeafe', color: '#1e40af' },
};

function StudentTable({
  refreshTrigger,
  onEdit,
  onDelete,
  onDuplicate,
  onUploadComplete,
  onDepartmentsLoaded,
}) {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Filter state ────────────────────────────────
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    class: '',
  });

  // ── Load classes once for the filter dropdown ───
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await apiFetch(CLASSES_URL);
        const data = await res.json();
        if (res.ok) setClasses(data.data || []);
      } catch (e) {
        console.error('Failed to load classes for filter', e);
      }
    };
    loadClasses();
  }, []);

  // ── Fetch students (applying filters) ───────────
  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.search.trim()) params.append('search', filters.search.trim());
      if (filters.status) params.append('status', filters.status);
      if (filters.class) params.append('class', filters.class);
      const query = params.toString();
      const url = query ? `${API_URL}?${query}` : API_URL;

      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch students');
      setStudents(data.data || []);

      // Tell parent about unique departments (for the form's dropdown)
      if (onDepartmentsLoaded) {
        const uniqueDepts = Array.from(
          new Set(
            (data.data || []).map((s) => s.department).filter(Boolean)
          )
        );
        onDepartmentsLoaded(uniqueDepts);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Re-fetch when refreshTrigger or filters change ─
  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, filters.search, filters.status, filters.class]);

  // ── Reset to page 1 when filters change ─────────
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.status, filters.class]);

  // ── Auto-fix currentPage if out of range ────────
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(students.length / STUDENTS_PER_PAGE));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [students, currentPage]);

  const totalPages = Math.max(1, Math.ceil(students.length / STUDENTS_PER_PAGE));
  const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE;
  const currentStudents = students.slice(startIndex, startIndex + STUDENTS_PER_PAGE);

  // ── Filter bar UI ───────────────────────────────
  const renderFilters = () => (
    <div style={styles.filterBar}>
      <input
        type="text"
        placeholder="🔍 Search by name, username, reg no..."
        value={filters.search}
        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        style={styles.filterInput}
      />

      <select
        value={filters.status}
        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="alumni">Alumni</option>
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

      {(filters.search || filters.status || filters.class) && (
        <button
          type="button"
          onClick={() => setFilters({ search: '', status: '', class: '' })}
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
      <h2 style={styles.heading}>All Students</h2>

      <UploadCSV onUploadComplete={onUploadComplete} />

      {renderFilters()}

      {loading ? (
        <p style={styles.info}>Loading students...</p>
      ) : error ? (
        <p style={styles.error}>Error: {error}</p>
      ) : students.length === 0 ? (
        <p style={styles.info}>
          No students found.
          {(filters.search || filters.status || filters.class) && (
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
                  <th style={styles.th}>Adm #</th>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Class</th>
                  <th style={styles.th}>Section</th>
                  <th style={styles.th}>Roll</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Age</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.map((student, i) => (
                  <tr key={student._id} style={styles.bodyRow}>
                    <td style={styles.td}>{startIndex + i + 1}</td>

                    <td style={styles.td}>
                      <img
                        src={student.picture}
                        alt={student.name}
                        style={styles.img}
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+';
                        }}
                      />
                    </td>

                    <td style={styles.td}>
                      {student.admissionNo ? (
                        <span style={styles.admBadge}>{student.admissionNo}</span>
                      ) : (
                        <span style={styles.mutedText}>—</span>
                      )}
                    </td>

                    <td style={styles.td}>{student.username}</td>

                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        <strong>{student.name}</strong>
                        {student.regNo && (
                          <span style={styles.subText}>{student.regNo}</span>
                        )}
                      </div>
                    </td>

                    <td style={styles.td}>
                      {student.class?.name || (
                        <span style={styles.mutedText}>—</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      {student.section?.name || (
                        <span style={styles.mutedText}>—</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      {student.rollNo || (
                        <span style={styles.mutedText}>—</span>
                      )}
                    </td>

                    <td style={styles.td}>{student.phone}</td>
                    <td style={styles.td}>{student.age}</td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(STATUS_STYLE[student.status] || STATUS_STYLE.active),
                        }}
                      >
                        ● {student.status || 'active'}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actionRow}>
                        <button
                          style={{ ...styles.actionBtn, ...styles.editBtn }}
                          onClick={() => onEdit(student)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                          onClick={() => onDelete(student)}
                        >
                          Delete
                        </button>
                        {onDuplicate && (
                          <button
                            style={{ ...styles.actionBtn, ...styles.duplicateBtn }}
                            onClick={() => onDuplicate(student)}
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
            {Math.min(startIndex + STUDENTS_PER_PAGE, students.length)} of{' '}
            {students.length} students
          </div>
        </>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────
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

  // Filter bar
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

  // Table
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  headerRow: { backgroundColor: '#007bff', color: 'white' },
  bodyRow: { borderBottom: '1px solid #ddd' },
  th: { padding: '10px', textAlign: 'left', fontSize: '13px', whiteSpace: 'nowrap' },
  td: { padding: '10px', fontSize: '13px', verticalAlign: 'middle' },
  img: {
    width: '45px',
    height: '45px',
    objectFit: 'cover',
    borderRadius: '50%',
    border: '1px solid #ccc',
  },

  nameCell: { display: 'flex', flexDirection: 'column' },
  subText: { fontSize: '11px', color: '#6b7280', marginTop: '2px' },
  mutedText: { color: '#9ca3af' },

  admBadge: {
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
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

export default StudentTable;