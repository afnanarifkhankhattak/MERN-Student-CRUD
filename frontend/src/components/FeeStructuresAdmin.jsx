// frontend/src/components/FeeStructuresAdmin.jsx

import { useState } from 'react';
import FeeStructureForm from './FeeStructureForm';
import FeeStructureTable from './FeeStructureTable';
import { FEE_STRUCTURES_URL as API_URL, apiFetch } from '../api';

function FeeStructuresAdmin({ showToast }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingStructure, setEditingStructure] = useState(null);

  const bump = () => setRefreshTrigger((p) => p + 1);

  const handleStructureAdded = () => {
    bump();
    showToast('success', 'Fee structure created ✅');
  };

  const handleEdit = (s) => {
    setEditingStructure(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingStructure(null);
    bump();
    showToast('success', 'Fee structure updated ✅');
  };

  const handleCancelEdit = () => setEditingStructure(null);

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete fee structure "${s.name}"?`)) return;
    try {
      const res = await apiFetch(`${API_URL}/${s._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      bump();
      showToast('success', 'Fee structure deleted ✅');
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  return (
    <>
      <FeeStructureForm
        onStructureAdded={handleStructureAdded}
        editingStructure={editingStructure}
        onUpdateComplete={handleUpdateComplete}
        onCancelEdit={handleCancelEdit}
      />
      <FeeStructureTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

export default FeeStructuresAdmin;