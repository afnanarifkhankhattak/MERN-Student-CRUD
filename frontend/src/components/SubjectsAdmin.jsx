// frontend/src/components/SubjectsAdmin.jsx

import { useState } from 'react';
import SubjectForm from './SubjectForm';
import SubjectTable from './SubjectTable';
import { SUBJECTS_URL as API_URL, apiFetch } from '../api';

function SubjectsAdmin({ showToast }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingSubject, setEditingSubject] = useState(null);

  const handleSubjectAdded = () => {
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Subject added ✅');
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingSubject(null);
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Subject updated ✅');
  };

  const handleCancelEdit = () => setEditingSubject(null);

  const handleDelete = async (subject) => {
    if (!window.confirm(`Delete subject "${subject.name}"?`)) return;
    try {
      const res = await apiFetch(`${API_URL}/${subject._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setRefreshTrigger((p) => p + 1);
      showToast('success', `Deleted "${subject.name}" ✅`);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  return (
    <>
      <SubjectForm
        onSubjectAdded={handleSubjectAdded}
        editingSubject={editingSubject}
        onUpdateComplete={handleUpdateComplete}
        onCancelEdit={handleCancelEdit}
      />
      <SubjectTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

export default SubjectsAdmin;