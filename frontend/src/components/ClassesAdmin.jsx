// frontend/src/components/ClassesAdmin.jsx

import { useState } from 'react';
import ClassForm from './ClassForm';
import ClassTable from './ClassTable';
import { CLASSES_URL as API_URL, apiFetch } from '../api';

function ClassesAdmin({ showToast }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingClass, setEditingClass] = useState(null);

  const handleClassAdded = () => {
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Class added ✅');
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingClass(null);
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Class updated ✅');
  };

  const handleCancelEdit = () => setEditingClass(null);

  const handleDelete = async (cls) => {
    if (!window.confirm(`Delete class "${cls.name}"?`)) return;
    try {
      const res = await apiFetch(`${API_URL}/${cls._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setRefreshTrigger((p) => p + 1);
      showToast('success', `Deleted "${cls.name}" ✅`);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  return (
    <>
      <ClassForm
        onClassAdded={handleClassAdded}
        editingClass={editingClass}
        onUpdateComplete={handleUpdateComplete}
        onCancelEdit={handleCancelEdit}
      />
      <ClassTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

export default ClassesAdmin;