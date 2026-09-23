// frontend/src/components/ExamSubjectsModal.jsx

import { useState, useEffect } from 'react';
import {
  EXAMS_URL,
  SUBJECTS_URL,
  TEACHERS_URL,
  apiFetch,
} from '../api';

function ExamSubjectsModal({ exam, onClose, showToast, onChanged }) {
  const [subjects, setSubjects] = useState([]);          // all master subjects
  const [teachers, setTeachers] = useState([]);
  const [examSubjects, setExamSubjects] = useState([]);  // subjects already in this exam
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Add form state
  const [newRow, setNewRow] = useState({
    subject: '',
    teacher: '',
    totalMarks: 100,
    passingMarks: 40,
    examDate: '',
    room: '',
  });

  // ── Load master subjects + teachers + current exam subjects ──
  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [subjRes, teacherRes, fullRes] = await Promise.all([
        apiFetch(SUBJECTS_URL),
        apiFetch(TEACHERS_URL),
        apiFetch(`${EXAMS_URL}/${exam._id}/full`),
      ]);
      const subjData = await subjRes.json();
      const teacherData = await teacherRes.json();
      const fullData = await fullRes.json();

      if (subjRes.ok) setSubjects(subjData.data || []);
      if (teacherRes.ok) setTeachers(teacherData.data || []);
      if (fullRes.ok) setExamSubjects(fullData.data?.subjects || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam._id]);

  // Subjects not yet in the exam (available to add)
  const addedSubjectIds = new Set(
    examSubjects.map((es) =>
      typeof es.subject === 'object' ? es.subject._id : es.subject
    )
  );
  const availableSubjects = subjects.filter((s) => !addedSubjectIds.has(s._id));

  // ── Add a subject to the exam ──────────────────
  const handleAdd = async () => {
    if (!newRow.subject) {
      showToast('error', 'Pick a subject first.');
      return;
    }
    if (Number(newRow.passingMarks) > Number(newRow.totalMarks)) {
      showToast('error', 'Passing marks cannot exceed total marks.');
      return;
    }

    setBusy(true);
    try {
      const res = await apiFetch(`${EXAMS_URL}/${exam._id}/subjects`, {
        method: 'POST',
        body: JSON.stringify({
          subject: newRow.subject,
          teacher: newRow.teacher || null,
          totalMarks: Number(newRow.totalMarks),
          passingMarks: Number(newRow.passingMarks),
          examDate: newRow.examDate,
          room: newRow.room,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add subject');

      showToast('success', `Added "${data.data.subject?.name}" to exam ✅`);
      setNewRow({
        subject: '',
        teacher: '',
        totalMarks: 100,
        passingMarks: 40,
        examDate: '',
        room: '',
      });
      await loadAll();
      if (onChanged) onChanged();
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  // ── Inline update of an exam subject ───────────
  const handleUpdateRow = async (esId, updates) => {
    setBusy(true);
    try {
      const res = await apiFetch(`${EXAMS_URL}/subjects/${esId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      showToast('success', 'Subject updated ✅');
      await loadAll();
      if (onChanged) onChanged();
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  // ── Remove a subject from the exam ─────────────
  const handleRemove = async (es) => {
    const subjectName = es.subject?.name || 'this subject';
    if (
      !window.confirm(
        `Remove "${subjectName}" from this exam?\n\nAll student marks for this subject will also be deleted.`
      )
    )
      return;
    setBusy(true);
    try {
      const res = await apiFetch(`${EXAMS_URL}/subjects/${es._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Remove failed');
      showToast('success', `Removed "${subjectName}" ✅`);
      await loadAll();
      if (onChanged) onChanged();
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Manage Subjects</h2>
            <p style={styles.subtitle}>
              {exam.name} · {exam.class?.name} · {exam.academicYear?.name}
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {loading ? (
            <p style={styles.info}>Loading...</p>
          ) : error ? (
            <p style={styles.error}>{error}</p>
          ) : (
            <>
              {/* Add subject form */}
              <div style={styles.addCard}>
                <h3 style={styles.addTitle}>➕ Add a Subject</h3>
                <div style={styles.addRow}>
                  <div style={{ ...styles.field, flex: '2 1 220px' }}>
                    <label style={styles.label}>Subject *</label>
                    <select
                      value={newRow.subject}
                      onChange={(e) =>
                        setNewRow((p) => ({ ...p, subject: e.target.value }))
                      }
                      disabled={busy || availableSubjects.length === 0}
                      style={styles.input}
                    >
                      <option value="">
                        {availableSubjects.length === 0
                          ? '-- All subjects already added --'
                          : '-- Select Subject --'}
                      </option>
                      {availableSubjects.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} {s.code ? `(${s.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ ...styles.field, flex: '1 1 160px' }}>
                    <label style={styles.label}>Teacher (optional)</label>
                    <select
                      value={newRow.teacher}
                      onChange={(e) =>
                        setNewRow((p) => ({ ...p, teacher: e.target.value }))
                      }
                      disabled={busy}
                      style={styles.input}
                    >
                      <option value="">-- Unassigned --</option>
                      {teachers.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ ...styles.field, flex: '0 1 110px' }}>
                    <label style={styles.label}>Total *</label>
                    <input
                      type="number"
                      min="1"
                      value={newRow.totalMarks}
                      onChange={(e) =>
                        setNewRow((p) => ({ ...p, totalMarks: e.target.value }))
                      }
                      disabled={busy}
                      style={styles.input}
                    />
                  </div>

                  <div style={{ ...styles.field, flex: '0 1 110px' }}>
                    <label style={styles.label}>Passing *</label>
                    <input
                      type="number"
                      min="0"
                      value={newRow.passingMarks}
                      onChange={(e) =>
                        setNewRow((p) => ({
                          ...p,
                          passingMarks: e.target.value,
                        }))
                      }
                      disabled={busy}
                      style={styles.input}
                    />
                  </div>

                  <div style={{ ...styles.field, flex: '0 1 160px' }}>
                    <label style={styles.label}>Exam Date</label>
                    <input
                      type="date"
                      value={newRow.examDate}
                      onChange={(e) =>
                        setNewRow((p) => ({ ...p, examDate: e.target.value }))
                      }
                      disabled={busy}
                      style={styles.input}
                    />
                  </div>

                  <div style={{ ...styles.field, flex: '0 1 120px' }}>
                    <label style={styles.label}>Room</label>
                    <input
                      type="text"
                      placeholder="e.g. R-102"
                      value={newRow.room}
                      onChange={(e) =>
                        setNewRow((p) => ({ ...p, room: e.target.value }))
                      }
                      disabled={busy}
                      style={styles.input}
                    />
                  </div>

                  <div
                    style={{
                      ...styles.field,
                      flex: '0 0 auto',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={busy || !newRow.subject}
                      style={{
                        ...styles.addBtn,
                        opacity: busy || !newRow.subject ? 0.5 : 1,
                        cursor:
                          busy || !newRow.subject ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {busy ? '...' : '➕ Add'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Existing subjects list */}
              <h3 style={styles.listTitle}>
                📚 Subjects in This Exam ({examSubjects.length})
              </h3>

              {examSubjects.length === 0 ? (
                <p style={styles.info}>No subjects yet. Add one above.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>#</th>
                        <th style={styles.th}>Subject</th>
                        <th style={styles.th}>Teacher</th>
                        <th style={styles.th}>Total</th>
                        <th style={styles.th}>Passing</th>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Room</th>
                        <th style={styles.th}>Marks</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examSubjects.map((es, i) => (
                        <ExamSubjectRow
                          key={es._id}
                          index={i + 1}
                          es={es}
                          busy={busy}
                          onUpdate={(updates) => handleUpdateRow(es._id, updates)}
                          onRemove={() => handleRemove(es)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerInfo}>
            {examSubjects.length} subject(s) ·{' '}
            {examSubjects.reduce((s, es) => s + (es.resultCount || 0), 0)}{' '}
            marks entered
          </div>
          <button style={styles.closePrimary} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline row component with edit mode ────────
function ExamSubjectRow({ index, es, busy, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    totalMarks: es.totalMarks,
    passingMarks: es.passingMarks,
    examDate: es.examDate || '',
    room: es.room || '',
  });

  const handleSave = () => {
    if (Number(draft.passingMarks) > Number(draft.totalMarks)) {
      alert('Passing marks cannot exceed total marks.');
      return;
    }
    onUpdate({
      totalMarks: Number(draft.totalMarks),
      passingMarks: Number(draft.passingMarks),
      examDate: draft.examDate,
      room: draft.room,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft({
      totalMarks: es.totalMarks,
      passingMarks: es.passingMarks,
      examDate: es.examDate || '',
      room: es.room || '',
    });
    setEditing(false);
  };

  return (
    <tr style={rowStyles.tr}>
      <td style={rowStyles.td}>{index}</td>
      <td style={rowStyles.td}>
        <div style={rowStyles.subjectCell}>
          {es.subject?.colorHex && (
            <span
              style={{
                ...rowStyles.colorDot,
                backgroundColor: es.subject.colorHex,
              }}
            />
          )}
          <div>
            <strong>{es.subject?.name || '—'}</strong>
            {es.subject?.code && (
              <div style={rowStyles.subText}>{es.subject.code}</div>
            )}
          </div>
        </div>
      </td>
      <td style={rowStyles.td}>
        {es.teacher?.name || <span style={rowStyles.muted}>—</span>}
      </td>

      {editing ? (
        <>
          <td style={rowStyles.td}>
            <input
              type="number"
              value={draft.totalMarks}
              onChange={(e) =>
                setDraft((p) => ({ ...p, totalMarks: e.target.value }))
              }
              style={rowStyles.smallInput}
            />
          </td>
          <td style={rowStyles.td}>
            <input
              type="number"
              value={draft.passingMarks}
              onChange={(e) =>
                setDraft((p) => ({ ...p, passingMarks: e.target.value }))
              }
              style={rowStyles.smallInput}
            />
          </td>
          <td style={rowStyles.td}>
            <input
              type="date"
              value={draft.examDate}
              onChange={(e) =>
                setDraft((p) => ({ ...p, examDate: e.target.value }))
              }
              style={rowStyles.smallInput}
            />
          </td>
          <td style={rowStyles.td}>
            <input
              type="text"
              value={draft.room}
              onChange={(e) =>
                setDraft((p) => ({ ...p, room: e.target.value }))
              }
              style={rowStyles.smallInput}
            />
          </td>
        </>
      ) : (
        <>
          <td style={rowStyles.td}>{es.totalMarks}</td>
          <td style={rowStyles.td}>{es.passingMarks}</td>
          <td style={rowStyles.td}>
            {es.examDate || <span style={rowStyles.muted}>—</span>}
          </td>
          <td style={rowStyles.td}>
            {es.room || <span style={rowStyles.muted}>—</span>}
          </td>
        </>
      )}

      <td style={rowStyles.td}>
        <span style={rowStyles.resultBadge}>{es.resultCount || 0}</span>
      </td>

      <td style={rowStyles.td}>
        <div style={rowStyles.actionRow}>
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={busy}
                style={{ ...rowStyles.actionBtn, ...rowStyles.saveBtn }}
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                style={{ ...rowStyles.actionBtn, ...rowStyles.cancelBtn }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                style={{ ...rowStyles.actionBtn, ...rowStyles.editBtn }}
              >
                Edit
              </button>
              <button
                onClick={onRemove}
                disabled={busy}
                style={{ ...rowStyles.actionBtn, ...rowStyles.deleteBtn }}
              >
                Remove
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
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
    maxWidth: '1200px',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid #e3e8f0',
  },
  title: { margin: 0, fontSize: '20px', color: '#1e2a4a' },
  subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#6b7280' },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 10px',
    borderRadius: '6px',
  },

  body: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },

  addCard: {
    backgroundColor: '#eef3fb',
    padding: '16px',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  addTitle: {
    margin: '0 0 12px',
    fontSize: '14px',
    color: '#1e2a4a',
  },
  addRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
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
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
  },
  addBtn: {
    padding: '9px 20px',
    backgroundColor: '#4a72c4',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    height: '36px',
  },

  listTitle: {
    fontSize: '14px',
    color: '#1e2a4a',
    marginBottom: '10px',
    marginTop: '10px',
  },

  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#1e2a4a', color: '#fff' },
  th: {
    padding: '8px 10px',
    textAlign: 'left',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },

  info: { textAlign: 'center', color: '#6b7280', padding: '20px' },
  error: { textAlign: 'center', color: '#dc3545', padding: '20px' },

  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderTop: '1px solid #e3e8f0',
    backgroundColor: '#fafbfd',
    gap: '12px',
    flexWrap: 'wrap',
  },
  footerInfo: {
    fontSize: '12px',
    color: '#4b5563',
  },
  closePrimary: {
    padding: '10px 24px',
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

const rowStyles = {
  tr: { borderBottom: '1px solid #eef1f6' },
  td: { padding: '8px 10px', fontSize: '12px', verticalAlign: 'middle' },
  subjectCell: { display: 'flex', alignItems: 'center', gap: '8px' },
  colorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  subText: { fontSize: '10px', color: '#6b7280' },
  muted: { color: '#9ca3af' },
  smallInput: {
    padding: '5px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '12px',
    width: '80px',
    fontFamily: 'inherit',
  },
  resultBadge: {
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  actionRow: { display: 'flex', gap: '4px' },
  actionBtn: {
    padding: '4px 10px',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  editBtn: { backgroundColor: '#4a72c4' },
  deleteBtn: { backgroundColor: '#dc3545' },
  saveBtn: { backgroundColor: '#28a745' },
  cancelBtn: { backgroundColor: '#6b7280' },
};

export default ExamSubjectsModal;