// frontend/src/App.jsx

import { useState } from 'react';
import StudentForm from './components/StudentForm';
import StudentTable from './components/StudentTable';

const API_URL = 'https://mern-student-crud-tlt6.onrender.com/students';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingStudent, setEditingStudent] = useState(null);
  const [toast, setToast] = useState({ type: '', text: '' });

  // ── Create flow ────────────────────────────────
  const handleStudentAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
    showToast('success', 'Student added successfully! ✅');
  };

  // ── Edit flow ──────────────────────────────────
  const handleEdit = (student) => {
    setEditingStudent(student);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingStudent(null);
    setRefreshTrigger((prev) => prev + 1);
    showToast('success', 'Student updated successfully! ✅');
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
  };

  // ── Delete flow ────────────────────────────────
  const handleDelete = async (student) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${student.name}" (${student.username})?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${student._id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete student');
      }

      setRefreshTrigger((prev) => prev + 1);
      showToast('success', `Deleted "${student.name}" successfully. ✅`);

      if (editingStudent && editingStudent._id === student._id) {
        setEditingStudent(null);
      }
    } catch (error) {
      showToast('error', `Error: ${error.message}`);
    }
  };

  // ── Duplicate flow ─────────────────────────────
  // Tries "-COPY", then "-COPY-2", "-COPY-3"... until a free slot is found.
  const handleDuplicate = async (student) => {
    // Fields we must make unique
    const originalRegNo = student.regNo;
    const originalUsername = student.username;

    // We'll try up to 20 suffixes before giving up.
    for (let attempt = 1; attempt <= 20; attempt++) {
      const suffix = attempt === 1 ? '-COPY' : `-COPY-${attempt}`;

      const payload = {
        // Copy everything the original student has
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
          // Success!
          setRefreshTrigger((prev) => prev + 1);
          showToast(
            'success',
            `Duplicated as "${payload.username}" ✅`
          );
          return;
        }

        // If the error is a duplicate-key error, try the next suffix.
        // Otherwise stop and show the error.
        if (data.message && data.message.includes('E11000')) {
          continue; // try next suffix
        }

        throw new Error(data.message || 'Failed to duplicate student');
      } catch (error) {
        showToast('error', `Duplicate failed: ${error.message}`);
        return;
      }
    }

    showToast(
      'error',
      'Could not find a free "-COPY" name after 20 attempts.'
    );
  };

  // ── Upload CSV complete ────────────────────────
  const handleBulkUploadComplete = (count) => {
    setRefreshTrigger((prev) => prev + 1);
    if (count && count > 0) {
      showToast('success', `${count} student(s) imported ✅`);
    }
  };

  // ── Toast helper ───────────────────────────────
  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast({ type: '', text: '' });
    }, 3500);
  };

  // ── Render ─────────────────────────────────────
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center', fontFamily: 'Arial' }}>
        Student CRUD Application
      </h1>

      {toast.text && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            zIndex: 1000,
            backgroundColor: toast.type === 'success' ? '#d4edda' : '#f8d7da',
            color: toast.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${
              toast.type === 'success' ? '#c3e6cb' : '#f5c6cb'
            }`,
          }}
        >
          {toast.text}
        </div>
      )}

      <StudentForm
        onStudentAdded={handleStudentAdded}
        editingStudent={editingStudent}
        onUpdateComplete={handleUpdateComplete}
        onCancelEdit={handleCancelEdit}
      />

      <StudentTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onUploadComplete={handleBulkUploadComplete}
      />
    </div>
  );
}

export default App;