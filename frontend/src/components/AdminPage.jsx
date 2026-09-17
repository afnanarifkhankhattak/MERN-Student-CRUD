// frontend/src/components/AdminPage.jsx

import { useState } from 'react';
import StudentForm from './StudentForm';
import StudentTable from './StudentTable';

const API_URL = 'https://mern-student-crud-tlt6.onrender.com/students';

function AdminPage({ username, onLogout }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingStudent, setEditingStudent] = useState(null);
  const [toast, setToast] = useState({ type: '', text: '' });
  const [knownDepartments, setKnownDepartments] = useState([]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 3500);
  };

  const handleStudentAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
    showToast('success', 'Student added successfully! ✅');
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingStudent(null);
    setRefreshTrigger((prev) => prev + 1);
    showToast('success', 'Student updated successfully! ✅');
  };

  const handleCancelEdit = () => setEditingStudent(null);

  const handleDelete = async (student) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${student.name}" (${student.username})?`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${student._id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Delete failed');

      setRefreshTrigger((prev) => prev + 1);
      showToast('success', `Deleted "${student.name}" ✅`);
      if (editingStudent && editingStudent._id === student._id) {
        setEditingStudent(null);
      }
    } catch (error) {
      showToast('error', `Error: ${error.message}`);
    }
  };

  const handleDuplicate = async (student) => {
    const originalRegNo = student.regNo;
    const originalUsername = student.username;

    for (let attempt = 1; attempt <= 20; attempt++) {
      const suffix = attempt === 1 ? '-COPY' : `-COPY-${attempt}`;
      const payload = {
        username: `${originalUsername}${suffix}`,
        regNo: `${originalRegNo}${suffix}`,
        name: student.name,
        picture: student.picture,
        phone: student.phone,
        age: student.age,
        email: student.email,
        department: student.department,
        semester: student.semester,
      };

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (response.ok) {
          setRefreshTrigger((prev) => prev + 1);
          showToast('success', `Duplicated as "${payload.username}" ✅`);
          return;
        }
        if (data.message && data.message.includes('E11000')) continue;
        throw new Error(data.message || 'Failed');
      } catch (error) {
        showToast('error', `Duplicate failed: ${error.message}`);
        return;
      }
    }
    showToast('error', 'Could not find a free "-COPY" name.');
  };

  const handleBulkUploadComplete = (count) => {
    setRefreshTrigger((prev) => prev + 1);
    if (count && count > 0) showToast('success', `${count} student(s) imported ✅`);
  };

  const handleDepartmentsLoaded = (depts) => setKnownDepartments(depts);

  return (
    <div style={{ padding: '20px' }}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <span style={styles.welcome}>👨‍💼 Welcome, {username} (Admin)</span>
        <button style={styles.logoutBtn} onClick={onLogout}>
          Logout
        </button>
      </div>

      {/* Toast */}
      {toast.text && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px',
          padding: '12px 20px', borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontFamily: 'Arial, sans-serif', fontSize: '14px',
          zIndex: 1000,
          backgroundColor: toast.type === 'success' ? '#d4edda' : '#f8d7da',
          color: toast.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${toast.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
        }}>
          {toast.text}
        </div>
      )}

      <h1 style={{ textAlign: 'center', fontFamily: 'Arial' }}>
        Student CRUD Application — Admin
      </h1>

      <StudentForm
        onStudentAdded={handleStudentAdded}
        editingStudent={editingStudent}
        onUpdateComplete={handleUpdateComplete}
        onCancelEdit={handleCancelEdit}
        knownDepartments={knownDepartments}
      />

      <StudentTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onUploadComplete={handleBulkUploadComplete}
        onDepartmentsLoaded={handleDepartmentsLoaded}
      />
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
};

export default AdminPage;