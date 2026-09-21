// frontend/src/components/AdminPage.jsx

import { useState } from 'react';
import AdminLayout from './AdminLayout';
import DashboardPage from './DashboardPage';
import StudentForm from './StudentForm';
import StudentTable from './StudentTable';
import TeachersAdmin from './TeachersAdmin';
import FeesAdmin from './FeesAdmin';

const API_URL = 'https://mern-student-crud-tlt6.onrender.com/students';

// Simple toast helper used by AdminPage
function useToast() {
  const [toast, setToast] = useState({ type: '', text: '' });
  const show = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 3500);
  };
  return { toast, show };
}

function AdminPage({ username, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');

  // Only kept here so Students page can use them
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingStudent, setEditingStudent] = useState(null);
  const [knownDepartments, setKnownDepartments] = useState([]);

  const { toast, show } = useToast();

  // ── Handlers used by the Students page ────
  const handleStudentAdded = () => {
    setRefreshTrigger((p) => p + 1);
    show('success', 'Student added successfully! ✅');
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingStudent(null);
    setRefreshTrigger((p) => p + 1);
    show('success', 'Student updated successfully! ✅');
  };

  const handleCancelEdit = () => setEditingStudent(null);

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete "${student.name}"?`)) return;
    try {
      const r = await fetch(`${API_URL}/${student._id}`, { method: 'DELETE' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Delete failed');
      setRefreshTrigger((p) => p + 1);
      show('success', `Deleted "${student.name}" ✅`);
    } catch (e) {
      show('error', `Error: ${e.message}`);
    }
  };

  const handleDuplicate = async (student) => {
    for (let i = 1; i <= 20; i++) {
      const suffix = i === 1 ? '-COPY' : `-COPY-${i}`;
      const payload = {
        ...student,
        username: `${student.username}${suffix}`,
        regNo: `${student.regNo}${suffix}`,
      };
      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.__v;

      try {
        const r = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const d = await r.json();
        if (r.ok) {
          setRefreshTrigger((p) => p + 1);
          show('success', `Duplicated as "${payload.username}" ✅`);
          return;
        }
        if (d.message && d.message.includes('E11000')) continue;
        throw new Error(d.message);
      } catch (e) {
        show('error', `Duplicate failed: ${e.message}`);
        return;
      }
    }
    show('error', 'Could not find a free "-COPY" name.');
  };

  const handleBulkUploadComplete = (count) => {
    setRefreshTrigger((p) => p + 1);
    if (count > 0) show('success', `${count} student(s) imported ✅`);
  };

  const handleDepartmentsLoaded = (depts) => setKnownDepartments(depts);

  // ── Which page to render? ──────────────────
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;

      case 'students':
        return (
          <>
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
          </>
        );

case 'teachers':
  return <TeachersAdmin showToast={show} />;

case 'fees':
  return <FeesAdmin showToast={show} />;

case 'courses':
case 'calendar':
case 'messages':
case 'settings':
  return (
    <div style={placeholder}>
      <h2 style={{ margin: 0 }}>🚧 Coming Soon</h2>
      <p style={{ color: '#6b7280' }}>
        The <strong>{activePage}</strong> module will be built in the next stage.
      </p>
    </div>
  );
      default:
        return <DashboardPage />;
    }
  };

  return (
    <>
      <AdminLayout
        username={username}
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={onLogout}
      >
        {renderPage()}
      </AdminLayout>

      {/* Toast — same as before */}
      {toast.text && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '14px',
            zIndex: 1000,
            backgroundColor: toast.type === 'success' ? '#d4edda' : '#f8d7da',
            color: toast.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${toast.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {toast.text}
        </div>
      )}
    </>
  );
}

const placeholder = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '60px',
  textAlign: 'center',
  color: '#1e2a4a',
};

export default AdminPage;