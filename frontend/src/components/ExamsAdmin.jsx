// frontend/src/components/ExamsAdmin.jsx

import { useState } from 'react';
import ExamForm from './ExamForm';
import ExamTable from './ExamTable';
import ExamSubjectsModal from './ExamSubjectsModal';
import ExamMarksEntry from './ExamMarksEntry';
import ExamReports from './ExamReports';
import { EXAMS_URL as API_URL, apiFetch } from '../api';

const TABS = [
  { id: 'list',    label: '📋 Exams List',   sub: 'Create & manage' },
  { id: 'marks',   label: '📝 Marks Entry',  sub: 'Enter student marks' },
  { id: 'reports', label: '📊 Reports',      sub: 'Rankings & cards' },
];

function ExamsAdmin({ showToast }) {
  const [activeTab, setActiveTab] = useState('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingExam, setEditingExam] = useState(null);

  // Modal state: which exam's subjects are being managed
  const [subjectModalExam, setSubjectModalExam] = useState(null);

  // Which exam is being used for marks entry or reports
  const [selectedExamForMarks, setSelectedExamForMarks] = useState(null);
  const [selectedExamForReports, setSelectedExamForReports] = useState(null);

  const bump = () => setRefreshTrigger((p) => p + 1);

  // ── Handlers ───────────────────────────────────
  const handleExamAdded = () => {
    bump();
    showToast('success', 'Exam created ✅');
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingExam(null);
    bump();
    showToast('success', 'Exam updated ✅');
  };

  const handleCancelEdit = () => setEditingExam(null);

  const handleDelete = async (exam) => {
    if (
      !window.confirm(
        `Delete exam "${exam.name}"?\n\nAll subjects and student marks under this exam will also be deleted. This cannot be undone.`
      )
    )
      return;
    try {
      const res = await apiFetch(`${API_URL}/${exam._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      bump();
      showToast('success', `Exam "${exam.name}" deleted ✅`);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  // Open the subjects modal
  const handleManageSubjects = (exam) => setSubjectModalExam(exam);

  // Switch to Marks tab with a specific exam
  const handleEnterMarks = (exam) => {
    setSelectedExamForMarks(exam);
    setActiveTab('marks');
  };

  // Switch to Reports tab with a specific exam
  const handleViewRankings = (exam) => {
    setSelectedExamForReports(exam);
    setActiveTab('reports');
  };

  const clearExamSelection = (tab) => {
    if (tab === 'marks') setSelectedExamForMarks(null);
    if (tab === 'reports') setSelectedExamForReports(null);
  };

  // ── Render ─────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerWrap}>
        <h2 style={styles.heading}>📝 Exams</h2>
        <p style={styles.subtitle}>
          Create exams, add subjects, enter marks, and generate report cards.
        </p>
      </div>

      {/* Tab bar */}
      <div style={styles.tabBar}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              ...styles.tab,
              ...(activeTab === t.id ? styles.tabActive : {}),
            }}
          >
            <span style={styles.tabLabel}>{t.label}</span>
            <span
              style={{
                ...styles.tabSub,
                color: activeTab === t.id ? '#4a72c4' : '#9ca3af',
              }}
            >
              {t.sub}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'list' && (
          <>
            <ExamForm
              onExamAdded={handleExamAdded}
              editingExam={editingExam}
              onUpdateComplete={handleUpdateComplete}
              onCancelEdit={handleCancelEdit}
            />
            <ExamTable
              refreshTrigger={refreshTrigger}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onManageSubjects={handleManageSubjects}
              onEnterMarks={handleEnterMarks}
              onViewRankings={handleViewRankings}
            />
          </>
        )}

        {activeTab === 'marks' && (
          <>
            {selectedExamForMarks ? (
              <ExamMarksEntry
                exam={selectedExamForMarks}
                onBack={() => clearExamSelection('marks')}
                onSaved={bump}
                showToast={showToast}
              />
            ) : (
              <div style={styles.placeholder}>
                <p style={styles.placeholderText}>
                  Pick an exam from the <strong>📋 Exams List</strong> tab and
                  click the <strong>✏️ Marks</strong> button to enter marks.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'reports' && (
          <>
            {selectedExamForReports ? (
              <ExamReports
                exam={selectedExamForReports}
                onBack={() => clearExamSelection('reports')}
                showToast={showToast}
              />
            ) : (
              <div style={styles.placeholder}>
                <p style={styles.placeholderText}>
                  Pick an exam from the <strong>📋 Exams List</strong> tab and
                  click the <strong>🏆 Ranks</strong> button to view rankings and
                  report cards.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Subjects Modal */}
      {subjectModalExam && (
        <ExamSubjectsModal
          exam={subjectModalExam}
          showToast={showToast}
          onClose={() => setSubjectModalExam(null)}
          onChanged={bump}
        />
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1500px',
    margin: '20px auto',
    fontFamily: 'Arial, sans-serif',
  },
  headerWrap: { textAlign: 'center', marginBottom: '20px' },
  heading: { margin: 0, fontSize: '24px', color: '#1e2a4a' },
  subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#6b7280' },

  tabBar: {
    display: 'flex',
    gap: '8px',
    padding: '6px',
    backgroundColor: '#eef3fb',
    borderRadius: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  tab: {
    flex: '1 1 180px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 6px rgba(30, 42, 74, 0.08)',
  },
  tabLabel: { fontSize: '14px', fontWeight: 'bold', color: '#1e2a4a' },
  tabSub: {
    fontSize: '11px',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },

  content: { minHeight: '400px' },

  placeholder: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderRadius: '10px',
    border: '1px dashed #ccc',
  },
  placeholderText: {
    margin: 0,
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: 1.6,
  },
};

export default ExamsAdmin;