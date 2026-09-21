// frontend/src/components/CourseTable.jsx

import { useEffect, useState } from 'react';
import { COURSES_URL as API_URL, apiFetch } from '../api';

const COURSES_PER_PAGE = 10;

function CourseTable({ refreshTrigger, onEdit, onDelete }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_URL);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch courses');
      setCourses(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, [refreshTrigger]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(courses.length / COURSES_PER_PAGE));
    if (currentPage > tp) setCurrentPage(tp);
  }, [courses, currentPage]);

  if (loading) return <p style={styles.info}>Loading courses...</p>;
  if (error) return <p style={styles.error}>Error: {error}</p>;
  if (courses.length === 0) return <p style={styles.info}>No courses yet. Add one above! 👆</p>;

  const totalPages = Math.max(1, Math.ceil(courses.length / COURSES_PER_PAGE));
  const startIndex = (currentPage - 1) * COURSES_PER_PAGE;
  const currentCourses = courses.slice(startIndex, startIndex + COURSES_PER_PAGE);

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>All Courses</h2>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Code</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Credits</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Semester</th>
              <th style={styles.th}>Teacher</th>
              <th style={styles.th}>Enrolled</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentCourses.map((c, i) => (
              <tr key={c._id} style={styles.bodyRow}>
                <td style={styles.td}>{startIndex + i + 1}</td>
                <td style={styles.td}><strong>{c.code}</strong></td>
                <td style={styles.td}>{c.title}</td>
                <td style={styles.td}>{c.credits}</td>
                <td style={styles.td}>{c.department}</td>
                <td style={styles.td}>{c.semester}</td>
                <td style={styles.td}>{c.teacherName || '—'}</td>
                <td style={styles.td}>
                  <span style={styles.pill}>{c.studentCount || 0} students</span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionRow}>
                    <button
                      style={{ ...styles.actionBtn, ...styles.editBtn }}
                      onClick={() => onEdit(c)}
                    >
                      Edit
                    </button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                      onClick={() => onDelete(c)}
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
        Showing {startIndex + 1}–{Math.min(startIndex + COURSES_PER_PAGE, courses.length)} of {courses.length} courses
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1400px', margin: '20px auto', padding: '20px',
    backgroundColor: '#f9f9f9', borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  heading: { textAlign: 'center', color: '#333', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  headerRow: { backgroundColor: '#007bff', color: 'white' },
  bodyRow: { borderBottom: '1px solid #ddd' },
  th: { padding: '10px', textAlign: 'left', fontSize: '13px' },
  td: { padding: '10px', fontSize: '13px', verticalAlign: 'middle' },
  pill: {
    backgroundColor: '#eef3fb', color: '#4a72c4',
    padding: '3px 10px', borderRadius: '20px',
    fontSize: '11px', fontWeight: 'bold',
  },
  actionRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  actionBtn: {
    padding: '5px 10px', border: 'none', borderRadius: '4px',
    color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
  },
  editBtn: { backgroundColor: '#28a745' },
  deleteBtn: { backgroundColor: '#dc3545' },
  pagination: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: '6px', marginTop: '20px', flexWrap: 'wrap',
  },
  pageBtn: {
    padding: '8px 14px', border: '1px solid #ccc', borderRadius: '6px',
    backgroundColor: '#fff', color: '#333', cursor: 'pointer',
    fontSize: '13px', fontWeight: 'bold',
  },
  pageBtnActive: {
    backgroundColor: '#007bff', color: 'white', borderColor: '#007bff',
  },
  pageInfo: {
    textAlign: 'center', marginTop: '10px', color: '#666', fontSize: '13px',
  },
  info: { textAlign: 'center', color: '#666', margin: '20px' },
  error: { textAlign: 'center', color: '#dc3545', margin: '20px' },
};

export default CourseTable;