// frontend/src/components/ParentsAdmin.jsx

import { useState } from 'react';
import ParentForm from './ParentForm';
import ParentTable from './ParentTable';
import { PARENTS_URL as API_URL, apiFetch } from '../api';

function ParentsAdmin({ showToast }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingParent, setEditingParent] = useState(null);

  const handleParentAdded = () => {
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Parent added ✅');
  };

  const handleEdit = (parent) => {
    setEditingParent(parent);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingParent(null);
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Parent updated ✅');
  };

  const handleCancelEdit = () => setEditingParent(null);

  const handleDelete = async (parent) => {
    if (!window.confirm(`Delete parent "${parent.name}"?`)) return;
    try {
      const res = await apiFetch(`${API_URL}/${parent._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setRefreshTrigger((p) => p + 1);
      showToast('success', `Deleted "${parent.name}" ✅`);
    } catch (e) {
      // Note: this is where the "cannot delete — has linked students" error
      // surfaces, thanks to the referential integrity check on the backend.
      showToast('error', `${e.message}`);
    }
  };

  return (
    <>
      <ParentForm
        onParentAdded={handleParentAdded}
        editingParent={editingParent}
        onUpdateComplete={handleUpdateComplete}
        onCancelEdit={handleCancelEdit}
      />
      <ParentTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

export default ParentsAdmin;