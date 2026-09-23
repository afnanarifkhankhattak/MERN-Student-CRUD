// frontend/src/components/ExamTable.jsx

import { useEffect, useState } from 'react';
import {
  EXAMS_URL as API_URL,
  CLASSES_URL,
  ACADEMIC_YEARS_URL,
  apiFetch,
} from '../api';

const EXAMS_PER_PAGE = 10;

const EXAM_TYPE_LABELS = {
  'mid-term': 'Mid Term',
  final: 'Final Term',
  monthly: 'Monthly Test',
  quiz: 'Quiz',
  other: 'Other',
};

const STATUS_STYLE = {
  draft:     { backgroundColor: '#f1f3f5', color: '#6b7280' },
  ongoing:   { backgroundColor: '#fef3c7', color: '#92400e' },
  completed: { backgroundColor: '#dbeafe', color: '#1e40af' },
  published: { backgroundColor: '#d4edda', color: '#155724' },
};

function ExamTable({
  refreshTrigger,
  onEdit,
  onDelete,
  onManageSubjects,
  onEnterMarks,
  onViewRankings,
}) {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    class: '',
    academicYear: '',
    status: '',
    examType: '',
  });

  // Load filter options
  useEffect(() => {
    const load = async () => {
      try {
        const [classRes, yearRes] = await Promise.all([
          apiFetch(CLASSES_URL),
          apiFetch(ACADEMIC_YEARS_URL),
        ]);
        const cData = await classRes.json();
        const yData = await yearRes.json();
        if (classRes.ok) setClasses(cData.data || []);
        if (yearRes.ok) setAcademicYears(yData.data || []);
      } catch (e) {
        console.error('Failed to load filters', e);
      }
    };
    load();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.class) params.append('class', filters.class);
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      if (filters.status) params.append('status', filters.status);
      if (filters.examType) params.append('examType', filters.examType);
      const q = params.toString();
      const url = q ? `${API_URL}?${q}` : API_URL;

      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch exams');
      setExams(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, filters.class, filters.academicYear, filters.status, filters.examType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.class, filters.academicYear, filters.status, filters.examType]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(exams.length / EXAMS_PER_PAGE));
    if (currentPage > tp) setCurrentPage(tp);
  }, [exams, currentPage]);

  const totalPages = Math.max(1, Math.ceil(exams.length / EXAMS_PER_PAGE));
  const startIndex = (currentPage - 1) * EXAMS_PER_PAGE;
  const currentExams = exams.slice(startIndex, startIndex + EXAMS_PER_PAGE);

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
          <option key={y._id} value={y._id}>
            {y.name} {y.isActive ? '(Active)' : ''}
          </option>
        ))}
      </select>

      <select
        value={filters.examType}
        onChange={(e) => setFilters((f) => ({ ...f, examType: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Types</option>
        <option value="mid-term">Mid Term</option>
        <option value="final">Final Term</option>
        <option value="monthly">Monthly Test</option>
        <option value="quiz">Quiz</option>
        <option value="other">Other</option>
      </select>

      <select
        value={filters.status}
        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="ongoing">Ongoing</option>
        <option value="completed">Completed</option>
        <option value="published">Published</option>
      </select>

      {(filters.class || filters.academicYear || filters.status || filters.examType) && (
        <button
          type="button"
          onClick={() =>
            setFilters({ class: '', academicYear: '', status: '', examType: '' })
          }
          style={styles.clearBtn}
        >
          Clear Filters
        </button>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>All Exams</h2>

      {renderFilters()}

      {loading ? (
        <p style={styles.info}>Loading exams...</p>
      ) : error ? (
        <p style={styles.error}>Error: {error}</p>
      ) : exams.length === 0 ? (
        <p style={styles.info}>
          No exams found.
          {(filters.class || filters.academicYear || filters.status || filters.examType) && (
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
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Class</th>
                  <th style={styles.th}>Year</th>
                  <th style={styles.th}>Dates</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentExams.map((e, i) => (
                  <tr key={e._id} style={styles.bodyRow}>
                    <td style={styles.td}>{startIndex + i + 1}</td>
                    <td style={styles.td}>
                      <strong>{e.name}</strong>
                      {e.description && (
                        <div style={styles.subText}>{e.description}</div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.typePill}>
                        {EXAM_TYPE_LABELS[e.examType] || e.examType}
                      </span>
                    </td>
                    <td style={styles.td}>{e.class?.name || '—'}</td>
                    <td style={styles.td}>{e.academicYear?.name || '—'}</td>
                    <td style={styles.td}>
                      {e.startDate || '—'}
                      {e.endDate && ` → ${e.endDate}`}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(STATUS_STYLE[e.status] || STATUS_STYLE.draft),
                        }}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionRow}>
                        <button
                          style={{ ...styles.actionBtn, ...styles.primaryBtn }}
                          onClick={() => onManageSubjects(e)}
                          title="Add subjects to this exam"
                        >
                          📚 Subjects
                        </button>
                        <button
                          style={{ ...styles.actionBtn, ...styles.purpleBtn }}
                          onClick={() => onEnterMarks(e)}
                          title="Enter marks"
                        >
                          ✏️ Marks
                        </button>
                        <button
                          style={{ ...styles.actionBtn, ...styles.infoBtn }}
                          onClick={() => onViewRankings(e)}
                          title="View rankings"
                        >
                          🏆 Ranks
                        </button>
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
            {Math.min(startIndex + EXAMS_PER_PAGE, exams.length)} of{' '}
            {exams.length} exams
          </div>
        </>
      )}
    </div>
  );
}

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
  clearBtn: {
    padding: '9px 14px',
    backgroundColor: '#dc3545',
    color: '#fff',
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
  typePill: {
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
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
  actionRow: { display: 'flex', gap: '4px', flexWrap: 'wrap' },
  actionBtn: {
    padding: '5px 8px',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  primaryBtn: { backgroundColor: '#4a72c4' },
  purpleBtn: { backgroundColor: '#6f42c1' },
  infoBtn: { backgroundColor: '#17a2b8' },
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

export default ExamTable;