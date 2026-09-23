// frontend/src/components/AttendanceAdmin.jsx

import { useState } from 'react';
import AttendanceMarker from './AttendanceMarker';
import AttendanceTable from './AttendanceTable';
import AttendanceReports from './AttendanceReports';
import { ATTENDANCE_URL as API_URL, apiFetch } from '../api';

const TABS = [
  { id: 'marker',  label: '📝 Mark Attendance', sub: 'Daily grid' },
  { id: 'records', label: '📋 Records',        sub: 'All entries' },
  { id: 'reports', label: '📊 Reports',        sub: 'Analytics' },
];

function AttendanceAdmin({ showToast }) {
  const [activeTab, setActiveTab] = useState('marker');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ── Handlers ───────────────────────────────────
  const bumpRefresh = () => setRefreshTrigger((p) => p + 1);

  const handleSaved = () => {
    // Fired after a bulk save in the marker — refresh the records table
    bumpRefresh();
  };

  const handleEdit = (record) => {
    // Simple inline edit via prompt() for now — lightweight and forgiving.
    const newStatus = window.prompt(
      `Change status for ${record.student?.name || 'student'} on ${record.date}\n\nEnter: present | absent | late | leave`,
      record.status
    );
    if (!newStatus) return;
    const allowed = ['present', 'absent', 'late', 'leave'];
    if (!allowed.includes(newStatus.toLowerCase())) {
      showToast('error', `Invalid status. Use one of: ${allowed.join(', ')}`);
      return;
    }
    handleUpdateRecord(record, newStatus.toLowerCase());
  };

  const handleUpdateRecord = async (record, newStatus) => {
    try {
      const res = await apiFetch(`${API_URL}/${record._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      bumpRefresh();
      showToast('success', `Status updated to "${newStatus}" ✅`);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  const handleDelete = async (record) => {
    const who = record.student?.name || 'this record';
    if (!window.confirm(`Delete attendance record for "${who}" on ${record.date}?`))
      return;
    try {
      const res = await apiFetch(`${API_URL}/${record._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      bumpRefresh();
      showToast('success', `Record deleted ✅`);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  // ── Render ─────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerWrap}>
        <h2 style={styles.heading}>🗓️ Attendance</h2>
        <p style={styles.subtitle}>
          Mark daily attendance, view records, and generate reports.
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
        {activeTab === 'marker' && (
          <AttendanceMarker showToast={showToast} onSaved={handleSaved} />
        )}
        {activeTab === 'records' && (
          <AttendanceTable
            refreshTrigger={refreshTrigger}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        {activeTab === 'reports' && <AttendanceReports />}
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1400px',
    margin: '20px auto',
    fontFamily: 'Arial, sans-serif',
  },
  headerWrap: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  heading: {
    margin: 0,
    fontSize: '24px',
    color: '#1e2a4a',
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: '#6b7280',
  },

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
  tabLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1e2a4a',
  },
  tabSub: {
    fontSize: '11px',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },

  content: {
    minHeight: '300px',
  },
};

export default AttendanceAdmin;