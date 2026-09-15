// frontend/src/components/StudentTable.jsx

import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000/students';

function StudentTable({ refreshTrigger, onEdit, onDelete }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Fetch all students from the backend ─────────
  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch students');
      }

      setStudents(data.data);   // data.data = the array of students
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

  // ── Render ──────────────────────────────────────
  if (loading) {
    return <p style={styles.info}>Loading students...</p>;
  }

  if (error) {
    return <p style={styles.error}>Error: {error}</p>;
  }

  if (students.length === 0) {
    return <p style={styles.info}>No students yet. Add one above! 👆</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>All Students</h2>

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
            {students.map((student, index) => (
              <tr key={student._id} style={styles.bodyRow}>
                <td style={styles.td}>{index + 1}</td>

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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  actionBtn: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    marginRight: '5px',
    fontSize: '13px',
  },
  editBtn: {
    backgroundColor: '#28a745',
  },
  deleteBtn: {
    backgroundColor: '#dc3545',
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