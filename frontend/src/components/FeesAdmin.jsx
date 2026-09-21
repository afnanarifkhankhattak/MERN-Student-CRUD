// frontend/src/components/FeesAdmin.jsx

import { useState } from 'react';
import FeeForm from './FeeForm';
import FeeTable from './FeeTable';
import { FEES_URL as API_URL, apiFetch } from '../api';

function FeesAdmin({ showToast }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingFee, setEditingFee] = useState(null);

  const handleFeeAdded = () => {
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Fee record added ✅');
  };

  const handleEdit = (fee) => {
    setEditingFee(fee);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingFee(null);
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Fee record updated ✅');
  };

  const handleCancelEdit = () => setEditingFee(null);

  const handleDelete = async (fee) => {
    if (!window.confirm(`Delete fee record for "${fee.studentName}"?`)) return;
    try {
      const res = await apiFetch(`${API_URL}/${fee._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setRefreshTrigger((p) => p + 1);
      showToast('success', `Deleted fee record for "${fee.studentName}" ✅`);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  return (
    <>
      <FeeForm
        onFeeAdded={handleFeeAdded}
        editingFee={editingFee}
        onUpdateComplete={handleUpdateComplete}
        onCancelEdit={handleCancelEdit}
      />
      <FeeTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

export default FeesAdmin;