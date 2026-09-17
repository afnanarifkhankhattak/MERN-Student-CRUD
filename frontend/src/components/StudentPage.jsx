// frontend/src/components/StudentPage.jsx

import { useState } from 'react';
import StudentForm from './StudentForm';

function StudentPage({ username, onLogout }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleStudentAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Top bar with welcome message and logout */}
      <div style={styles.topBar}>
        <span style={styles.welcome}>👨‍🎓 Welcome, {username}</span>
        <button style={styles.logoutBtn} onClick={onLogout}>
          Logout
        </button>
      </div>

      <h1 style={styles.title}>Add Your Details</h1>

      <StudentForm
        onStudentAdded={handleStudentAdded}
        editingStudent={null}
        onUpdateComplete={null}
        onCancelEdit={null}
        knownDepartments={[]}
      />

      <div style={styles.footer}>
        Logged in as <strong>Student</strong>. You can only add your own details.
      </div>
    </div>
  );
}

const styles = {
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: '#e8f0fe',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    marginBottom: '20px',
  },
  welcome: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#1a3fa0',
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    color: '#333',
  },
  footer: {
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    color: '#6b7280',
    fontSize: '13px',
    marginTop: '20px',
  },
};

export default StudentPage;