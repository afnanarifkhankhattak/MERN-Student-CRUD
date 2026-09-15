// frontend/src/App.jsx

import { useState } from 'react';
import StudentForm from './components/StudentForm';
import StudentTable from './components/StudentTable';

const API_URL = 'http://localhost:5000/students';

function App() {
  // Refresh trigger: bumping this number tells StudentTable to re-fetch
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Currently-edited student (null = we're in "create" mode)
  const [editingStudent, setEditingStudent] = useState(null);

  // Global toast message (for delete success/error)
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
    // 1. Ask the user for confirmation
    const confirmed = window.confirm(
      `Are you sure you want to delete "${student.name}" (${student.username})?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    // 2. Send DELETE to backend
    try {
      const response = await fetch(`${API_URL}/${student._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete student');
      }

      // 3. Refresh the table
      setRefreshTrigger((prev) => prev + 1);
      showToast('success', `Deleted "${student.name}" successfully. ✅`);

      // 4. If we were editing THIS student, exit edit mode
      if (editingStudent && editingStudent._id === student._id) {
        setEditingStudent(null);
      }
    } catch (error) {
      showToast('error', `Error: ${error.message}`);
    }
  };

  // ── Toast helper ───────────────────────────────
  const showToast = (type, text) => {
    setToast({ type, text });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast({ type: '', text: '' });
    }, 3000);
  };

  // ── Render ─────────────────────────────────────
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center', fontFamily: 'Arial' }}>
        Student CRUD Application
      </h1>

      {/* Toast message (fixed at top-right) */}
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
      />
    </div>
  );
}

export default App;