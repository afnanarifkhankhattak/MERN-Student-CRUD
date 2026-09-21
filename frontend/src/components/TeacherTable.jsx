// frontend/src/components/TeacherTable.jsx

import { useEffect, useState } from 'react';
import { TEACHERS_URL as API_URL, apiFetch } from '../api';

const TEACHERS_PER_PAGE = 10;

function TeacherTable({
  refreshTrigger,
  onEdit,
  onDelete,
  onDuplicate,
}) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_URL);
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
  }, [refreshTrigger]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(teachers.length / TEACHERS_PER_PAGE));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [teachers, currentPage]);

  if (loading) return <p style={styles.info}>Loading teachers...</p>;
  if (error) return <p style={styles.error}>Error: {error}</p>;
  if (teachers.length === 0) return <p style={styles.info}>No teachers yet. Add one above! 👆</p>;

  const totalPages = Math.max(1, Math.ceil(teachers.length / TEACHERS_PER_PAGE));
  const startIndex = (currentPage - 1) * TEACHERS_PER_PAGE;
  const currentTeachers = teachers.slice(startIndex, startIndex + TEACHERS_PER_PAGE);

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>All Teachers</h2>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Picture</th>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Employee ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Designation</th>
              <th style={styles.th}>Exp.</th>
              <th style={styles.th}>Salary</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentTeachers.map((t, i) => (
              <tr key={t._id} style={styles.bodyRow}>
                <td style={styles.td}>{startIndex + i + 1}</td>
                <td style={styles.td}>
                  <img
                    src={t.picture} alt={t.name} style={styles.img}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=?'; }}
                  />
                </td>
                <td style={styles.td}>{t.username}</td>
                <td style={styles.td}>{t.employeeId}</td>
                <td style={styles.td}>{t.name}</td>
                <td style={styles.td}>{t.phone}</td>
                <td style={styles.td}>{t.email}</td>
                <td style={styles.td}>{t.department}</td>
                <td style={styles.td}>{t.designation}</td>
                <td style={styles.td}>{t.experience} yrs</td>
                <td style={styles.td}>Rs {Number(t.salary).toLocaleString()}</td>
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
                        style={{ ...styles.actionBtn, ...styles.duplicateBtn }}
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
        Showing {startIndex + 1}–{Math.min(startIndex + TEACHERS_PER_PAGE, teachers.length)} of {teachers.length} teachers
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
  img: {
    width: '45px', height: '45px', objectFit: 'cover',
    borderRadius: '50%', border: '1px solid #ccc',
  },
  actionRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  actionBtn: {
    padding: '5px 10px', border: 'none', borderRadius: '4px',
    color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
  },
  editBtn: { backgroundColor: '#28a745' },
  deleteBtn: { backgroundColor: '#dc3545' },
  duplicateBtn: { backgroundColor: '#17a2b8' },
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

export default TeacherTable;