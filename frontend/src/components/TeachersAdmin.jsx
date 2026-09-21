// frontend/src/components/TeachersAdmin.jsx

import { useState } from 'react';
import TeacherForm from './TeacherForm';
import TeacherTable from './TeacherTable';
import { TEACHERS_URL as API_URL, apiFetch } from '../api';

function TeachersAdmin({ showToast }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const handleTeacherAdded = () => {
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Teacher added successfully! ✅');
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingTeacher(null);
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Teacher updated successfully! ✅');
  };

  const handleCancelEdit = () => setEditingTeacher(null);

  const handleDelete = async (teacher) => {
    if (!window.confirm(`Delete teacher "${teacher.name}"?`)) return;
    try {
      const res = await apiFetch(`${API_URL}/${teacher._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setRefreshTrigger((p) => p + 1);
      showToast('success', `Deleted "${teacher.name}" ✅`);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  const handleDuplicate = async (teacher) => {
    for (let i = 1; i <= 20; i++) {
      const suffix = i === 1 ? '-COPY' : `-COPY-${i}`;
      const payload = {
        ...teacher,
        username: `${teacher.username}${suffix}`,
        employeeId: `${teacher.employeeId}${suffix}`,
      };
      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.__v;

      try {
        const res = await apiFetch(API_URL, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          setRefreshTrigger((p) => p + 1);
          showToast('success', `Duplicated as "${payload.username}" ✅`);
          return;
        }
        if (data.message && data.message.includes('E11000')) continue;
        throw new Error(data.message || 'Failed');
      } catch (e) {
        showToast('error', `Duplicate failed: ${e.message}`);
        return;
      }
    }
    showToast('error', 'Could not find a free "-COPY" name.');
  };

  return (
    <>
      <TeacherForm
        onTeacherAdded={handleTeacherAdded}
        editingTeacher={editingTeacher}
        onUpdateComplete={handleUpdateComplete}
        onCancelEdit={handleCancelEdit}
      />
      <TeacherTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />
    </>
  );
}

export default TeachersAdmin;