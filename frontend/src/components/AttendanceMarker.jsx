// frontend/src/components/AttendanceMarker.jsx

import { useState, useEffect } from 'react';
import {
  ATTENDANCE_URL,
  CLASSES_URL,
  SECTIONS_URL,
  ACADEMIC_YEARS_URL,
  apiFetch,
} from '../api';

// ── Status options ───────────────────────────────
const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', short: 'P', color: '#10b981' },
  { value: 'absent',  label: 'Absent',  short: 'A', color: '#dc3545' },
  { value: 'late',    label: 'Late',    short: 'L', color: '#f59e0b' },
  { value: 'leave',   label: 'Leave',   short: 'Lv', color: '#8b5cf6' },
];

function AttendanceMarker({ showToast, onSaved }) {
  const today = new Date().toISOString().split('T')[0];

  // Filters
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [date, setDate] = useState(today);

  // Dropdown data
  const [classes, setClasses] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Roster + attendance state
  const [rows, setRows] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Load dropdowns on mount ────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [classRes, sectionRes, yearRes] = await Promise.all([
          apiFetch(CLASSES_URL),
          apiFetch(SECTIONS_URL),
          apiFetch(ACADEMIC_YEARS_URL),
        ]);
        const cData = await classRes.json();
        const sData = await sectionRes.json();
        const yData = await yearRes.json();
        if (classRes.ok) setClasses(cData.data || []);
        if (sectionRes.ok) setAllSections(sData.data || []);
        if (yearRes.ok) {
          setAcademicYears(yData.data || []);
          // Auto-pick the active year if there is one
          const active = (yData.data || []).find((y) => y.isActive);
          if (active) setAcademicYearId(active._id);
        }
      } catch (e) {
        console.error('Failed to load options', e);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  // ── Cascading section filter ───────────────────
  const filteredSections = allSections.filter((s) => {
    const sectionClassId = typeof s.class === 'object' ? s.class?._id : s.class;
    return sectionClassId === classId;
  });

  // Reset section when class changes
  useEffect(() => {
    setSectionId('');
  }, [classId]);

  // ── Load roster when all filters are set ───────
  const loadRoster = async () => {
    if (!classId || !sectionId || !academicYearId || !date) {
      setRows([]);
      return;
    }
    setLoadingRoster(true);
    setError('');
    try {
      const url = `${ATTENDANCE_URL}/daily?class=${classId}&section=${sectionId}&academicYear=${academicYearId}&date=${date}`;
      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load roster');
      // Ensure every row has a status; default unmarked → present visually
      const normalized = (data.data || []).map((r) => ({
        ...r,
        // Keep "unmarked" as-is internally, but the UI will show it neutral
      }));
      setRows(normalized);
    } catch (e) {
      setError(e.message);
      setRows([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  // Auto-load roster when filters change
  useEffect(() => {
    loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, sectionId, academicYearId, date]);

  // ── Change status of a single student ──────────
  const setStatus = (studentId, status) => {
    setRows((prev) =>
      prev.map((r) =>
        r.student._id === studentId
          ? { ...r, status, remarks: r.remarks || '' }
          : r
      )
    );
  };

  const setRemarks = (studentId, remarks) => {
    setRows((prev) =>
      prev.map((r) =>
        r.student._id === studentId ? { ...r, remarks } : r
      )
    );
  };

  // ── Bulk action: mark all unmarked as present ──
  const markAllPresent = () => {
    setRows((prev) =>
      prev.map((r) =>
        r.status === 'unmarked' ? { ...r, status: 'present' } : r
      )
    );
  };

  const clearAll = () => {
    setRows((prev) => prev.map((r) => ({ ...r, status: 'unmarked', remarks: '' })));
  };

  // ── Save via bulk endpoint ─────────────────────
  const handleSave = async () => {
    const toSave = rows.filter((r) => r.status !== 'unmarked');
    if (toSave.length === 0) {
      showToast('error', 'Mark at least one student before saving.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`${ATTENDANCE_URL}/bulk`, {
        method: 'POST',
        body: JSON.stringify({
          class: classId,
          section: sectionId,
          academicYear: academicYearId,
          date,
          records: toSave.map((r) => ({
            student: r.student._id,
            status: r.status,
            remarks: r.remarks || '',
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');

      showToast(
        'success',
        `Attendance saved for ${data.savedCount} student(s) ✅`
      );
      if (onSaved) onSaved();
      // Re-fetch so we see the persisted state (markedBy, attendanceId, etc.)
      await loadRoster();
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Live summary counts ────────────────────────
  const summary = rows.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0, leave: 0, unmarked: 0 }
  );

  // Enable Mark All only when there are unmarked rows
  const hasUnmarked = summary.unmarked > 0;
  const hasAnyMarked = rows.length > 0 && summary.unmarked < rows.length;
  const rosterReady =
    classId && sectionId && academicYearId && date && !loadingRoster;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📅 Daily Attendance</h2>

      {/* ── Filter row ───────────────────────────── */}
      <div style={styles.filterRow}>
        <div style={styles.filterField}>
          <label style={styles.label}>Class *</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={loadingOptions}
            style={styles.select}
          >
            <option value="">-- Select Class --</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.filterField}>
          <label style={styles.label}>Section *</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={loadingOptions || !classId}
            style={{
              ...styles.select,
              opacity: !classId ? 0.6 : 1,
              cursor: !classId ? 'not-allowed' : 'pointer',
            }}
          >
            <option value="">
              {!classId ? '-- Pick class first --' : '-- Select Section --'}
            </option>
            {filteredSections.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.filterField}>
          <label style={styles.label}>Academic Year *</label>
          <select
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            disabled={loadingOptions}
            style={styles.select}
          >
            <option value="">-- Select Year --</option>
            {academicYears.map((y) => (
              <option key={y._id} value={y._id}>
                {y.name} {y.isActive ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterField}>
          <label style={styles.label}>Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={styles.select}
          />
        </div>
      </div>

      {/* ── Action row + summary ─────────────────── */}
      {rosterReady && rows.length > 0 && (
        <div style={styles.actionRow}>
          <button
            type="button"
            onClick={markAllPresent}
            disabled={!hasUnmarked}
            style={{
              ...styles.actionBtn,
              ...styles.btnSecondary,
              opacity: hasUnmarked ? 1 : 0.5,
              cursor: hasUnmarked ? 'pointer' : 'not-allowed',
            }}
          >
            ✅ Mark All Unmarked Present
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={!hasAnyMarked}
            style={{
              ...styles.actionBtn,
              ...styles.btnWarning,
              opacity: hasAnyMarked ? 1 : 0.5,
              cursor: hasAnyMarked ? 'pointer' : 'not-allowed',
            }}
          >
            ↺ Clear All
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasAnyMarked}
            style={{
              ...styles.actionBtn,
              ...styles.btnPrimary,
              opacity: saving || !hasAnyMarked ? 0.5 : 1,
              cursor: saving || !hasAnyMarked ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : '💾 Save Attendance'}
          </button>

          {/* Live summary */}
          <div style={styles.summaryRow}>
            <SummaryPill label="Present" count={summary.present} color="#10b981" />
            <SummaryPill label="Absent" count={summary.absent} color="#dc3545" />
            <SummaryPill label="Late" count={summary.late} color="#f59e0b" />
            <SummaryPill label="Leave" count={summary.leave} color="#8b5cf6" />
            <SummaryPill label="Unmarked" count={summary.unmarked} color="#9ca3af" />
          </div>
        </div>
      )}

      {/* ── Status messages ──────────────────────── */}
      {error && <div style={styles.error}>{error}</div>}

      {/* ── Body: table, empty state, or prompt ─── */}
      {!classId || !sectionId || !academicYearId || !date ? (
        <p style={styles.hint}>
          Pick a Class, Section, Academic Year, and Date to load the roster.
        </p>
      ) : loadingRoster ? (
        <p style={styles.hint}>Loading roster...</p>
      ) : rows.length === 0 ? (
        <p style={styles.hint}>
          No active students enrolled in this class+section+year.
          Enroll students in the <strong>Enrollments</strong> page first.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Roll</th>
                <th style={styles.th}>Student</th>
                <th style={styles.th}>Reg No</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.student._id} style={styles.bodyRow}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>
                    <span style={styles.rollBadge}>{r.rollNo}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.studentCell}>
                      {r.student.picture && (
                        <img
                          src={r.student.picture}
                          alt={r.student.name}
                          style={styles.avatar}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <strong>{r.student.name}</strong>
                    </div>
                  </td>
                  <td style={styles.td}>{r.student.regNo || '—'}</td>

                  <td style={styles.td}>
                    <div style={styles.statusGroup}>
                      {STATUS_OPTIONS.map((s) => {
                        const active = r.status === s.value;
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setStatus(r.student._id, s.value)}
                            title={s.label}
                            style={{
                              ...styles.statusBtn,
                              backgroundColor: active ? s.color : '#fff',
                              color: active ? '#fff' : s.color,
                              borderColor: s.color,
                            }}
                          >
                            {s.short}
                          </button>
                        );
                      })}
                    </div>
                  </td>

                  <td style={styles.td}>
                    <input
                      type="text"
                      value={r.remarks}
                      onChange={(e) =>
                        setRemarks(r.student._id, e.target.value)
                      }
                      placeholder="optional"
                      style={styles.remarksInput}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Small inline pill component ────────────────
function SummaryPill({ label, count, color }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: color,
        backgroundColor: color + '22',
        border: `1px solid ${color}`,
      }}
    >
      {label}: {count}
    </span>
  );
}

// ── Styles ──────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  heading: {
    textAlign: 'center',
    color: '#1e2a4a',
    marginBottom: '20px',
  },

  filterRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  filterField: {
    flex: '1 1 180px',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '4px',
    fontWeight: 'bold',
    fontSize: '12px',
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  select: {
    padding: '9px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },

  actionRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#eef3fb',
    borderRadius: '8px',
  },
  actionBtn: {
    padding: '9px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    backgroundColor: '#4a72c4',
    color: '#fff',
  },
  btnSecondary: {
    backgroundColor: '#10b981',
    color: '#fff',
  },
  btnWarning: {
    backgroundColor: '#f59e0b',
    color: '#fff',
  },

  summaryRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginLeft: 'auto',
  },

  error: {
    backgroundColor: '#fde8e8',
    color: '#991b1b',
    border: '1px solid #f5c2c2',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  hint: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '30px 10px',
    fontSize: '14px',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  headerRow: {
    backgroundColor: '#1e2a4a',
    color: '#fff',
  },
  bodyRow: {
    borderBottom: '1px solid #eef1f6',
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  td: {
    padding: '10px 12px',
    fontSize: '13px',
    verticalAlign: 'middle',
  },

  rollBadge: {
    backgroundColor: '#1e2a4a',
    color: '#fff',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },

  studentCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid #e3e8f0',
  },

  statusGroup: {
    display: 'flex',
    gap: '4px',
  },
  statusBtn: {
    width: '38px',
    height: '34px',
    border: '1.5px solid',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },

  remarksInput: {
    padding: '6px 10px',
    border: '1px solid #e3e8f0',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'inherit',
    width: '100%',
    minWidth: '150px',
  },
};

export default AttendanceMarker;