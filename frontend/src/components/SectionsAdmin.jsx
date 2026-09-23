// frontend/src/components/SectionsAdmin.jsx

import { useState } from 'react';
import SectionForm from './SectionForm';
import SectionTable from './SectionTable';
import { SECTIONS_URL as API_URL, apiFetch } from '../api';

function SectionsAdmin({ showToast }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingSection, setEditingSection] = useState(null);

  const handleSectionAdded = () => {
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Section added ✅');
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingSection(null);
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Section updated ✅');
  };

  const handleCancelEdit = () => setEditingSection(null);

  const handleDelete = async (section) => {
    if (!window.confirm(`Delete section "${section.class?.name} - ${section.name}"?`)) return;
    try {
      const res = await apiFetch(`${API_URL}/${section._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setRefreshTrigger((p) => p + 1);
      showToast('success', `Deleted section "${section.name}" ✅`);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  return (
    <>
      <SectionForm
        onSectionAdded={handleSectionAdded}
        editingSection={editingSection}
        onUpdateComplete={handleUpdateComplete}
        onCancelEdit={handleCancelEdit}
      />
      <SectionTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

export default SectionsAdmin;