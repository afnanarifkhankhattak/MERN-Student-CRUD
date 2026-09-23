// frontend/src/components/EnrollmentsAdmin.jsx

import { useState, useEffect } from 'react';
import EnrollmentForm from './EnrollmentForm';
import EnrollmentTable from './EnrollmentTable';
import {
  ENROLLMENTS_URL as API_URL,
  apiFetch,
} from '../api';

function EnrollmentsAdmin({ showToast }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingEnrollment, setEditingEnrollment] = useState(null);

  // Roster modal state
  const [rosterOpen, setRosterOpen] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterData, setRosterData] = useState([]);
  const [rosterMeta, setRosterMeta] = useState(null);

  // ── Handlers for the form + table ─────────────
  const handleEnrollmentAdded = () => {
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Enrollment created ✅');
  };

  const handleEdit = (enrollment) => {
    setEditingEnrollment(enrollment);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingEnrollment(null);
    setRefreshTrigger((p) => p + 1);
    showToast('success', 'Enrollment updated ✅');
  };

  const handleCancelEdit = () => setEditingEnrollment(null);

  const handleDelete = async (enrollment) => {
    const studentName = enrollment.student?.name || 'this student';
    if (!window.confirm(`Delete enrollment for "${studentName}"?`)) return;
    try {
      const res = await apiFetch(`${API_URL}/${enrollment._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setRefreshTrigger((p) => p + 1);
      showToast('success', `Enrollment deleted ✅`);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  // ── Roster modal handler ──────────────────────
  const handleViewRoster = async (filters) => {
    const { class: classId, section, academicYear } = filters;
    if (!classId || !section || !academicYear) {
      showToast('error', 'Pick class, section, and year to view the roster.');
      return;
    }

    setRosterOpen(true);
    setRosterLoading(true);
    setRosterData([]);
    setRosterMeta(null);

    try {
      const url = `${API_URL}/roster?class=${classId}&section=${section}&academicYear=${academicYear}`;
      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load roster');
      setRosterData(data.data || []);

      // Save meta for display (class/section/year names)
      if (data.data && data.data.length > 0) {
        const first = data.data[0];
        setRosterMeta({
          class: first.class?.name || '',
          section: first.section?.name || '',
          academicYear: first.academicYear?.name || '',
        });
      }
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
      setRosterOpen(false);
    } finally {
      setRosterLoading(false);
    }
  };

  const closeRoster = () => {
    setRosterOpen(false);
    setRosterData([]);
    setRosterMeta(null);
  };

  // Close roster on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && rosterOpen) closeRoster();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterOpen]);

  // ── Render ─────────────────────────────────────
  return (
    <>
      <EnrollmentForm
        onEnrollmentAdded={handleEnrollmentAdded}
        editingEnrollment={editingEnrollment}
        onUpdateComplete={handleUpdateComplete}
        onCancelEdit={handleCancelEdit}
      />
      <EnrollmentTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewRoster={handleViewRoster}
      />

      {rosterOpen && (
        <RosterModal
          loading={rosterLoading}
          data={rosterData}
          meta={rosterMeta}
          onClose={closeRoster}
        />
      )}
    </>
  );
}

// ────────────────────────────────────────────────
// Roster Modal (child component, same file)
// ────────────────────────────────────────────────
function RosterModal({ loading, data, meta, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        className="roster-modal"
      >
        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>
              {meta
                ? `${meta.class} - Section ${meta.section}`
                : 'Class Roster'}
            </h2>
            <p style={styles.modalSubtitle}>
              {meta ? `Academic Year ${meta.academicYear}` : 'Loading...'}
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={styles.modalBody}>
          {loading ? (
            <p style={styles.info}>Loading roster...</p>
          ) : data.length === 0 ? (
            <p style={styles.info}>
              No active students in this class for the selected year.
            </p>
          ) : (
            <table style={styles.rosterTable}>
              <thead>
                <tr style={styles.rosterHead}>
                  <th style={styles.rosterTh}>#</th>
                  <th style={styles.rosterTh}>Roll No</th>
                  <th style={styles.rosterTh}>Student Name</th>
                  <th style={styles.rosterTh}>Reg No</th>
                  <th style={styles.rosterTh}>Phone</th>
                </tr>
              </thead>
              <tbody>
                {data.map((e, i) => (
                  <tr key={e._id} style={styles.rosterBodyRow}>
                    <td style={styles.rosterTd}>{i + 1}</td>
                    <td style={styles.rosterTd}>
                      <strong>{e.rollNo}</strong>
                    </td>
                    <td style={styles.rosterTd}>
                      {e.student?.name || '—'}
                    </td>
                    <td style={styles.rosterTd}>
                      {e.student?.regNo || '—'}
                    </td>
                    <td style={styles.rosterTd}>
                      {e.student?.phone || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={styles.modalFooter}>
          <div style={styles.footerCount}>
            {!loading && data.length > 0 && (
              <>Total: <strong>{data.length}</strong> students</>
            )}
          </div>
          <div style={styles.footerActions}>
            <button
              style={styles.printBtn}
              onClick={handlePrint}
              disabled={loading || data.length === 0}
            >
              🖨️ Print
            </button>
            <button style={styles.closeBtnPrimary} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid #e3e8f0',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#1e2a4a',
  },
  modalSubtitle: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: '#6b7280',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 10px',
    borderRadius: '6px',
  },

  modalBody: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  info: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '30px 0',
  },

  rosterTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  rosterHead: {
    backgroundColor: '#1e2a4a',
    color: '#ffffff',
  },
  rosterTh: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 'bold',
    letterSpacing: '0.3px',
  },
  rosterBodyRow: {
    borderBottom: '1px solid #eef1f6',
  },
  rosterTd: {
    padding: '10px 12px',
    fontSize: '13px',
    color: '#1f2937',
  },

  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderTop: '1px solid #e3e8f0',
    backgroundColor: '#fafbfd',
    gap: '12px',
    flexWrap: 'wrap',
  },
  footerCount: {
    fontSize: '13px',
    color: '#4b5563',
  },
  footerActions: {
    display: 'flex',
    gap: '10px',
  },
  printBtn: {
    padding: '10px 20px',
    backgroundColor: '#6f42c1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  closeBtnPrimary: {
    padding: '10px 20px',
    backgroundColor: '#4a72c4',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default EnrollmentsAdmin;