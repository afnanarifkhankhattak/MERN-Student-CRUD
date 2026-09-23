// frontend/src/components/TimetableGrid.jsx

import { useState, useEffect } from 'react';
import {
  TIMETABLE_URL,
  PERIODS_URL,
  CLASSES_URL,
  SECTIONS_URL,
  ACADEMIC_YEARS_URL,
  SUBJECTS_URL,
  TEACHERS_URL,
  apiFetch,
} from '../api';

// Days of the week
const DAYS = [
  { id: 'monday',    label: 'Monday' },
  { id: 'tuesday',   label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday',  label: 'Thursday' },
  { id: 'friday',    label: 'Friday' },
  { id: 'saturday',  label: 'Saturday' },
];

function TimetableGrid({ showToast }) {
  // ── Filter state ────────────────────────────────
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);

  // ── Grid state ──────────────────────────────────
  const [periods, setPeriods] = useState([]);
  const [grid, setGrid] = useState({});          // { day: { periodId: { subject, teacher, room, notes } } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Modal state ─────────────────────────────────
  const [editCell, setEditCell] = useState(null); // { day, periodId }

  // ── Load all dropdown data once ─────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, sRes, yRes, subRes, tRes] = await Promise.all([
          apiFetch(CLASSES_URL),
          apiFetch(SECTIONS_URL),
          apiFetch(ACADEMIC_YEARS_URL),
          apiFetch(SUBJECTS_URL),
          apiFetch(TEACHERS_URL),
        ]);
        const [c, s, y, sub, t] = await Promise.all([
          cRes.json(), sRes.json(), yRes.json(), subRes.json(), tRes.json(),
        ]);
        if (cRes.ok) setClasses(c.data || []);
        if (sRes.ok) setSections(s.data || []);
        if (yRes.ok) {
          setAcademicYears(y.data || []);
          const active = (y.data || []).find((yy) => yy.isActive);
          if (active) setAcademicYearId(active._id);
        }
        if (subRes.ok) setSubjects(sub.data || []);
        if (tRes.ok) setTeachers(t.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  // ── Cascading section filter ────────────────────
  const filteredSections = sections.filter((s) => {
    const sectionClassId = typeof s.class === 'object' ? s.class?._id : s.class;
    return sectionClassId === classId;
  });

  useEffect(() => {
    setSectionId('');
  }, [classId]);

  // ── Load grid when filters change ───────────────
  useEffect(() => {
    if (!classId || !sectionId || !academicYearId) {
      setGrid({});
      setPeriods([]);
      return;
    }
    loadGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, sectionId, academicYearId]);

  const loadGrid = async () => {
    setLoading(true);
    setError('');
    try {
      const url = `${TIMETABLE_URL}/grid?class=${classId}&section=${sectionId}&academicYear=${academicYearId}`;
      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load grid');
      setPeriods(data.data.periods || []);
      setGrid(data.data.grid || {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Cell click → open modal ─────────────────────
  const handleCellClick = (day, period) => {
    if (period.isBreak) return; // Can't edit break slots
    const existing = grid[day]?.[period._id] || null;
    setEditCell({ day, period, existing });
  };

  // ── Save cell from modal ────────────────────────
  const handleSaveCell = (data) => {
    const { day, periodId, subject, teacher, room, notes } = data;
    setGrid((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [periodId]: {
          _id: prev[day]?.[periodId]?._id || null, // keep existing id if any
          subject,
          teacher,
          room,
          notes,
        },
      },
    }));
    setEditCell(null);
  };

  const handleClearCell = () => {
    const { day, period } = editCell;
    setGrid((prev) => {
      const dayGrid = { ...(prev[day] || {}) };
      delete dayGrid[period._id];
      return { ...prev, [day]: dayGrid };
    });
    setEditCell(null);
  };

  // ── Bulk save entire grid ───────────────────────
  const handleSaveGrid = async () => {
    if (!classId || !sectionId || !academicYearId) return;

    // Build entries array — one per populated cell
    const entries = [];
    DAYS.forEach((d) => {
      periods.forEach((p) => {
        if (p.isBreak) return;
        const cell = grid[d.id]?.[p._id];
        if (!cell) return;
        if (!cell.subject && !cell.teacher && !cell.room) return; // skip empty
        entries.push({
          day: d.id,
          period: p._id,
          subject: cell.subject || null,
          teacher: cell.teacher || null,
          room: cell.room || '',
          notes: cell.notes || '',
        });
      });
    });

    setSaving(true);
    try {
      const res = await apiFetch(`${TIMETABLE_URL}/bulk`, {
        method: 'POST',
        body: JSON.stringify({
          class: classId,
          section: sectionId,
          academicYear: academicYearId,
          entries,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');

      if (data.failedCount > 0) {
        showToast(
          'error',
          `Saved ${data.savedCount}, failed ${data.failedCount}. Check the conflicts below.`
        );
        // Print failed reasons to console for debugging
        console.warn('Failed entries:', data.failed);
      } else {
        showToast('success', `Saved ${data.savedCount} entries ✅`);
      }
      loadGrid();
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const rosterReady = classId && sectionId && academicYearId;

  return (
    <div style={styles.container}>
      {/* Filter controls */}
      <div style={styles.filters}>
        <div style={styles.field}>
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

        <div style={styles.field}>
          <label style={styles.label}>Section *</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!classId}
            style={{ ...styles.select, opacity: !classId ? 0.6 : 1 }}
          >
            <option value="">-- Select Section --</option>
            {filteredSections.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
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

        {rosterReady && (
          <button
            type="button"
            onClick={handleSaveGrid}
            disabled={saving}
            style={{
              ...styles.saveBtn,
              opacity: saving ? 0.6 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : '💾 Save Week'}
          </button>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Grid */}
      {!rosterReady ? (
        <p style={styles.hint}>
          Pick Class, Section, and Academic Year to load the timetable grid.
        </p>
      ) : loading ? (
        <p style={styles.hint}>Loading timetable...</p>
      ) : periods.length === 0 ? (
        <p style={styles.hint}>
          No periods defined. Go to the <strong>Setup</strong> tab to add them.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.thCorner}>Period</th>
                {DAYS.map((d) => (
                  <th key={d.id} style={styles.th}>{d.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p._id} style={p.isBreak ? styles.trBreak : styles.tr}>
                  <td style={styles.tdPeriod}>
                    <div style={styles.periodName}>{p.name}</div>
                    <div style={styles.periodTime}>
                      {p.startTime && p.endTime
                        ? `${p.startTime}–${p.endTime}`
                        : ''}
                    </div>
                    {p.isBreak && <div style={styles.breakTag}>Break</div>}
                  </td>

                  {p.isBreak ? (
                    // Break row: spans all days
                    <td colSpan={DAYS.length} style={styles.tdBreakRow}>
                      <span style={styles.breakText}>☕ {p.name}</span>
                    </td>
                  ) : (
                    DAYS.map((d) => {
                      const cell = grid[d.id]?.[p._id];
                      return (
                        <td
                          key={`${d.id}-${p._id}`}
                          style={styles.tdCell}
                          onClick={() => handleCellClick(d.id, p)}
                        >
                          {cell ? (
                            <div style={styles.filledCell}>
                              <div style={styles.cellSubject}>
                                {subjects.find((s) => s._id === cell.subject)?.name ||
                                 cell.subject?.name ||
                                 '—'}
                              </div>
                              <div style={styles.cellTeacher}>
                                {teachers.find((t) => t._id === cell.teacher)?.name ||
                                 cell.teacher?.name ||
                                 ''}
                              </div>
                              {cell.room && (
                                <div style={styles.cellRoom}>📍 {cell.room}</div>
                              )}
                            </div>
                          ) : (
                            <div style={styles.emptyCell}>+</div>
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cell edit modal */}
      {editCell && (
        <CellEditModal
          day={editCell.day}
          period={editCell.period}
          existing={editCell.existing}
          subjects={subjects}
          teachers={teachers}
          onSave={handleSaveCell}
          onClear={handleClearCell}
          onClose={() => setEditCell(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Cell edit modal
// ═══════════════════════════════════════════════
function CellEditModal({
  day,
  period,
  existing,
  subjects,
  teachers,
  onSave,
  onClear,
  onClose,
}) {
  const [subject, setSubject] = useState(existing?.subject || '');
  const [teacher, setTeacher] = useState(existing?.teacher || '');
  const [room, setRoom] = useState(existing?.room || '');
  const [notes, setNotes] = useState(existing?.notes || '');

  const handleSave = () => {
    onSave({
      day,
      periodId: period._id,
      subject: subject || null,
      teacher: teacher || null,
      room,
      notes,
    });
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div>
            <h3 style={modalStyles.title}>
              {existing ? '✏️ Edit Cell' : '➕ Assign Class'}
            </h3>
            <p style={modalStyles.subtitle}>
              {day.charAt(0).toUpperCase() + day.slice(1)} · {period.name}
              {period.startTime && (
                <> · {period.startTime} – {period.endTime}</>
              )}
            </p>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        </div>

        <div style={modalStyles.body}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={modalStyles.input}
            >
              <option value="">-- None (free slot) --</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Teacher</label>
            <select
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              style={modalStyles.input}
            >
              <option value="">-- Unassigned --</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Room</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Room 102"
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              style={modalStyles.input}
            />
          </div>
        </div>

        <div style={modalStyles.footer}>
          {existing && (
            <button onClick={onClear} style={modalStyles.clearBtn}>
              🗑️ Clear
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={modalStyles.cancelBtn}>
            Cancel
          </button>
          <button onClick={handleSave} style={modalStyles.saveBtn}>
            {existing ? 'Update' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1600px',
    margin: '0 auto',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: '20px',
    padding: '14px',
    backgroundColor: '#eef3fb',
    borderRadius: '10px',
  },
  field: { flex: '1 1 180px', display: 'flex', flexDirection: 'column' },
  label: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  select: {
    padding: '9px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '11px 22px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
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
    padding: '40px 10px',
    fontSize: '14px',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  thead: { backgroundColor: '#1e2a4a', color: '#fff' },
  thCorner: {
    padding: '12px 10px',
    textAlign: 'left',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    minWidth: '120px',
  },
  th: {
    padding: '12px 8px',
    textAlign: 'center',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    minWidth: '130px',
  },
  tr: { borderBottom: '1px solid #eef1f6' },
  trBreak: {
    borderBottom: '1px solid #eef1f6',
    backgroundColor: '#fef9e8',
  },
  tdPeriod: {
    padding: '10px',
    fontSize: '12px',
    backgroundColor: '#f8fafc',
    borderRight: '1px solid #eef1f6',
    minWidth: '120px',
  },
  periodName: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#1e2a4a',
  },
  periodTime: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '2px',
  },
  breakTag: {
    fontSize: '10px',
    color: '#92400e',
    backgroundColor: '#fef3c7',
    padding: '1px 6px',
    borderRadius: '8px',
    marginTop: '4px',
    display: 'inline-block',
    fontWeight: 'bold',
  },
  tdCell: {
    padding: '6px',
    verticalAlign: 'top',
    borderRight: '1px solid #eef1f6',
    cursor: 'pointer',
    minHeight: '70px',
  },
  tdBreakRow: {
    padding: '12px',
    textAlign: 'center',
    backgroundColor: '#fef9e8',
  },
  breakText: {
    fontSize: '13px',
    color: '#92400e',
    fontWeight: 'bold',
  },
  emptyCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60px',
    borderRadius: '6px',
    color: '#cbd5e1',
    fontSize: '18px',
    border: '1.5px dashed #e3e8f0',
    backgroundColor: '#fafbfd',
  },
  filledCell: {
    minHeight: '60px',
    padding: '6px 8px',
    backgroundColor: '#eef3fb',
    borderRadius: '6px',
    borderLeft: '3px solid #4a72c4',
  },
  cellSubject: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#1e2a4a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cellTeacher: {
    fontSize: '11px',
    color: '#4b5563',
    marginTop: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cellRoom: {
    fontSize: '10px',
    color: '#6b7280',
    marginTop: '2px',
  },
};

const modalStyles = {
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
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid #e3e8f0',
  },
  title: { margin: 0, fontSize: '17px', color: '#1e2a4a' },
  subtitle: { margin: '4px 0 0', fontSize: '12px', color: '#6b7280' },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 8px',
  },
  body: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  field: { display: 'flex', flexDirection: 'column' },
  label: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  input: {
    padding: '9px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
  },
  footer: {
    display: 'flex',
    gap: '10px',
    padding: '16px 24px',
    borderTop: '1px solid #e3e8f0',
    backgroundColor: '#fafbfd',
    borderRadius: '0 0 12px 12px',
  },
  clearBtn: {
    padding: '9px 16px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cancelBtn: {
    padding: '9px 18px',
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  saveBtn: {
    padding: '9px 22px',
    backgroundColor: '#4a72c4',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default TimetableGrid;