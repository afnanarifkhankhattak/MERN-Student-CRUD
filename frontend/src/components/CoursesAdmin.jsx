// frontend/src/components/CoursesAdmin.jsx

import { useState } from 'react';
import CourseForm from './CourseForm';
import CourseTable from './CourseTable';
import { COURSES_URL as API_URL, apiFetch } from '../api';

function CoursesAdmin({ showToast }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingCourse, setEditingCourse] = useState(null);

  const handleCourseAdded = () => {
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Course added ✅');
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingCourse(null);
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Course updated ✅');
  };

  const handleCancelEdit = () => setEditingCourse(null);

  const handleDelete = async (course) => {
    if (!window.confirm(`Delete course "${course.title}"?`)) return;
    try {
      const res = await apiFetch(`${API_URL}/${course._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setRefreshTrigger((p) => p + 1);
      showToast('success', `Deleted "${course.title}" ✅`);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  return (
    <>
      <CourseForm
        onCourseAdded={handleCourseAdded}
        editingCourse={editingCourse}
        onUpdateComplete={handleUpdateComplete}
        onCancelEdit={handleCancelEdit}
      />
      <CourseTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

export default CoursesAdmin;