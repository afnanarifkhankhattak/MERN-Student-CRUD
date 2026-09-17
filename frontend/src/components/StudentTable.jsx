// frontend/src/components/StudentTable.jsx

// import { useEffect, useState } from 'react';
// import UploadCSV from './UploadCSV';

// const API_URL = 'https://mern-student-crud-tlt6.onrender.com/students';

import { useEffect, useState } from 'react';
import UploadCSV from './UploadCSV';
import { STUDENTS_URL as API_URL, apiFetch } from '../api';

const STUDENTS_PER_PAGE = 10;

function StudentTable({
  refreshTrigger,
  onEdit,
  onDelete,
  onDuplicate,
  onUploadComplete,
}) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Fetch all students from the backend ─────────
  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch students');
      }

      setStudents(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Run fetch whenever refreshTrigger changes ───
  useEffect(() => {
    fetchStudents();
  }, [refreshTrigger]);

  // ── Auto-fix currentPage if it goes out of range ─
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(students.length / STUDENTS_PER_PAGE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [students, currentPage]);

  // ── Compute the page slice ──────────────────────
  const totalPages = Math.max(1, Math.ceil(students.length / STUDENTS_PER_PAGE));
  const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE;
  const currentStudents = students.slice(
    startIndex,
    startIndex + STUDENTS_PER_PAGE
  );

  // ── Render ──────────────────────────────────────
  if (loading) {
    return <p style={styles.info}>Loading students...</p>;
  }

  if (error) {
    return <p style={styles.error}>Error: {error}</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>All Students</h2>

      {/* Upload CSV button (always visible, even if table is empty) */}
      <UploadCSV onUploadComplete={onUploadComplete} />

      {students.length === 0 ? (
        <p style={styles.info}>No students yet. Add one above! 👆</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Picture</th>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Reg No</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Age</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Semester</th>
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
                            'https://via.placeholder.com/50?text=?';
                        }}
                      />
                    </td>

                    <td style={styles.td}>{student.username}</td>
                    <td style={styles.td}>{student.regNo}</td>
                    <td style={styles.td}>{student.name}</td>
                    <td style={styles.td}>{student.phone}</td>
                    <td style={styles.td}>{student.age}</td>
                    <td style={styles.td}>{student.email}</td>
                    <td style={styles.td}>{student.department}</td>
                    <td style={styles.td}>{student.semester}</td>

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
                        <button
                          style={{ ...styles.actionBtn, ...styles.duplicateBtn }}
                          onClick={() => onDuplicate(student)}
                        >
                          Duplicate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
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

            {/* Page number buttons */}
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
            Showing {startIndex + 1}–{Math.min(startIndex + STUDENTS_PER_PAGE, students.length)} of {students.length} students
          </div>
        </>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  heading: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
  },
  headerRow: {
    backgroundColor: '#007bff',
    color: 'white',
  },
  bodyRow: {
    borderBottom: '1px solid #ddd',
  },
  th: {
    padding: '10px',
    textAlign: 'left',
    fontSize: '14px',
  },
  td: {
    padding: '10px',
    fontSize: '14px',
    verticalAlign: 'middle',
  },
  img: {
    width: '50px',
    height: '50px',
    objectFit: 'cover',
    borderRadius: '50%',
    border: '1px solid #ccc',
  },
  actionRow: {
    display: 'flex',
    gap: '8px',       // ← nice spacing between the 3 buttons
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  editBtn: {
    backgroundColor: '#28a745',
  },
  deleteBtn: {
    backgroundColor: '#dc3545',
  },
  duplicateBtn: {
    backgroundColor: '#17a2b8',
  },
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
    transition: 'background-color 0.15s ease, transform 0.1s ease',
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
  info: {
    textAlign: 'center',
    color: '#666',
    margin: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  error: {
    textAlign: 'center',
    color: '#dc3545',
    margin: '20px',
    fontFamily: 'Arial, sans-serif',
  },
};

export default StudentTable;