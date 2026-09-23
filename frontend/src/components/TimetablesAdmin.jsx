// frontend/src/components/TimetablesAdmin.jsx

import { useState } from 'react';
import PeriodsAdmin from './PeriodsAdmin';
import TimetableGrid from './TimetableGrid';
import TeacherTimetable from './TeacherTimetable';

const TABS = [
  { id: 'grid',    label: '📅 Grid',         sub: 'Build the week' },
  { id: 'teacher', label: '👨‍🏫 Teacher View', sub: 'Per-teacher schedule' },
  { id: 'setup',   label: '⚙️ Setup Periods', sub: 'Define periods' },
];

function TimetablesAdmin({ showToast }) {
  const [activeTab, setActiveTab] = useState('grid');

  return (
    <div style={styles.container}>
      <div style={styles.headerWrap}>
        <h2 style={styles.heading}>📅 Timetable</h2>
        <p style={styles.subtitle}>
          Define periods, build the weekly grid, and view teacher schedules.
        </p>
      </div>

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

      <div style={styles.content}>
        {activeTab === 'grid' && <TimetableGrid showToast={showToast} />}
        {activeTab === 'teacher' && <TeacherTimetable />}
        {activeTab === 'setup' && <PeriodsAdmin showToast={showToast} />}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1600px',
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
};

export default TimetablesAdmin;