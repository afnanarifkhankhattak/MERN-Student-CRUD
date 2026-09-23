// frontend/src/components/AcademicYearsAdmin.jsx

import { useState } from 'react';
import AcademicYearForm from './AcademicYearForm';
import AcademicYearTable from './AcademicYearTable';
import { ACADEMIC_YEARS_URL as API_URL, apiFetch } from '../api';

function AcademicYearsAdmin({ showToast }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingYear, setEditingYear] = useState(null);

  const handleYearAdded = () => {
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Academic year added ✅');
  };

  const handleEdit = (year) => {
    setEditingYear(year);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingYear(null);
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Academic year updated ✅');
  };

  const handleCancelEdit = () => setEditingYear(null);

  const handleDelete = async (year) => {
    if (!window.confirm(`Delete academic year "${year.name}"?`)) return;
    try {
      const res = await apiFetch(`${API_URL}/${year._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setRefreshTrigger((p) => p + 1);
      showToast('success', `Deleted "${year.name}" ✅`);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  return (
    <>
      <AcademicYearForm
        onYearAdded={handleYearAdded}
        editingYear={editingYear}
        onUpdateComplete={handleUpdateComplete}
        onCancelEdit={handleCancelEdit}
      />
      <AcademicYearTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

export default AcademicYearsAdmin;