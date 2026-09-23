// frontend/src/components/ExamMarksEntry.jsx

import { useState, useEffect } from 'react';
import {
  EXAMS_URL,
  SECTIONS_URL,
  apiFetch,
} from '../api';

// Letter grade from percentage — mirrors backend
function computeGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  if (pct >= 40) return 'E';
  return 'F';
}

function ExamMarksEntry({ exam, onBack, onSaved, showToast }) {
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState('');
  const [loadingSections, setLoadingSections] = useState(true);

  const [subjects, setSubjects] = useState([]);
  const [grid, setGrid] = useState([]);       // array of student rows
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Load sections belonging to this exam's class ─
  useEffect(() => {
    const load = async () => {
      setLoadingSections(true);
      try {
        const res = await apiFetch(`${SECTIONS_URL}?class=${exam.class?._id}`);
        const data = await res.json();
        if (res.ok) setSections(data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSections(false);
      }
    };
    if (exam?.class?._id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?._id]);

  // ── Load grid when a section is chosen ───────────
  const loadGrid = async () => {
    if (!sectionId) {
      setGrid([]);
      setSubjects([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const url = `${EXAMS_URL}/${exam._id}/marks-sheet?section=${sectionId}`;
      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load marks sheet');

      setSubjects(data.data.subjects || []);
      // Convert to a mutable structure: rows with `cells` keyed by examSubjectId
      const rows = (data.data.rows || []).map((r) => {
        const cells = {};
        r.results.forEach((c) => {
          cells[c.examSubjectId] = {
            obtainedMarks: c.obtainedMarks === '' ? '' : String(c.obtainedMarks),
            isAbsent: c.isAbsent || false,
            remarks: c.remarks || '',
            resultId: c.resultId,
          };
        });
        return {
          student: r.student,
          enrollmentId: r.enrollmentId,
          rollNo: r.rollNo,
          cells,
        };
      });
      setGrid(rows);
    } catch (e) {
      setError(e.message);
      setGrid([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  // ── Update a single cell ────────────────────────
  const updateCell = (studentIdx, subjectId, patch) => {
    setGrid((prev) =>
      prev.map((row, i) =>
        i !== studentIdx
          ? row
          : {
              ...row,
              cells: {
                ...row.cells,
                [subjectId]: {
                  ...row.cells[subjectId],
                  ...patch,
                },
              },
            }
      )
    );
  };

  // ── Helpers: parse a cell ───────────────────────
  const parseCell = (subjectId, cell) => {
    if (!cell) return { obtained: 0, isAbsent: false, isEmpty: true };
    if (cell.isAbsent) return { obtained: 0, isAbsent: true, isEmpty: false };
    if (cell.obtainedMarks === '' || cell.obtainedMarks === null)
      return { obtained: 0, isAbsent: false, isEmpty: true };
    return {
      obtained: Number(cell.obtainedMarks) || 0,
      isAbsent: false,
      isEmpty: false,
    };
  };

  // ── Compute total marks per student (for display) ─
  const computeStudentTotal = (row) => {
    let total = 0;
    let grand = 0;
    let anyEntered = false;
    subjects.forEach((s) => {
      const cell = row.cells[s._id];
      const p = parseCell(s._id, cell);
      grand += s.totalMarks;
      if (!p.isEmpty) {
        anyEntered = true;
        total += p.obtained;
      }
    });
    const pct = grand > 0 ? Math.round((total / grand) * 100 * 100) / 100 : 0;
    return { total, grand, pct, grade: computeGrade(pct), anyEntered };
  };

  // ── Progress: how many cells are filled? ────────
  const progress = (() => {
    const totalCells = grid.length * subjects.length;
    if (totalCells === 0) return { filled: 0, total: 0, pct: 0 };
    let filled = 0;
    grid.forEach((row) => {
      subjects.forEach((s) => {
        const p = parseCell(s._id, row.cells[s._id]);
        if (!p.isEmpty) filled += 1;
      });
    });
    return { filled, total: totalCells, pct: Math.round((filled / totalCells) * 100) };
  })();

  // ── Save: one bulk request per subject ──────────
  const handleSave = async () => {
    if (subjects.length === 0 || grid.length === 0) {
      showToast('error', 'Nothing to save.');
      return;
    }
    setSaving(true);
    setError('');

    let totalSaved = 0;
    let totalFailed = 0;
    const errors = [];

    try {
      // Fire all subject bulk saves in parallel
      const results = await Promise.all(
        subjects.map(async (subject) => {
          const records = grid.map((row) => {
            const p = parseCell(subject._id, row.cells[subject._id]);
            return {
              student: row.student._id,
              enrollment: row.enrollmentId,
              obtainedMarks: p.isAbsent ? 0 : p.obtained,
              isAbsent: p.isAbsent,
              remarks: row.cells[subject._id]?.remarks || '',
            };
          });

          const res = await apiFetch(
            `${EXAMS_URL}/${exam._id}/bulk-marks`,
            {
              method: 'POST',
              body: JSON.stringify({
                examSubject: subject._id,
                records,
              }),
            }
          );
          const data = await res.json();
          if (!res.ok) {
            return { ok: false, subject: subject.subject?.name, error: data.message };
          }
          return {
            ok: true,
            saved: data.savedCount || 0,
            failed: data.failedCount || 0,
          };
        })
      );

      results.forEach((r) => {
        if (r.ok) {
          totalSaved += r.saved;
          totalFailed += r.failed;
        } else {
          errors.push(`${r.subject}: ${r.error}`);
        }
      });

      if (errors.length > 0) {
        showToast('error', `Some subjects failed: ${errors.join(' | ')}`);
      } else if (totalFailed > 0) {
        showToast('success', `Saved ${totalSaved} marks (${totalFailed} failed)`);
      } else {
        showToast('success', `Marks saved for ${totalSaved} entr${totalSaved === 1 ? 'y' : 'ies'} ✅`);
      }
      if (onSaved) onSaved();
      await loadGrid();
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Mark every empty cell "Absent" for a student ─
  const markStudentAbsentAll = (studentIdx) => {
    setGrid((prev) =>
      prev.map((row, i) => {
        if (i !== studentIdx) return row;
        const nextCells = { ...row.cells };
        subjects.forEach((s) => {
          nextCells[s._id] = {
            ...nextCells[s._id],
            obtainedMarks: '',
            isAbsent: true,
          };
        });
        return { ...row, cells: nextCells };
      })
    );
  };

  const clearStudent = (studentIdx) => {
    setGrid((prev) =>
      prev.map((row, i) => {
        if (i !== studentIdx) return row;
        const nextCells = { ...row.cells };
        subjects.forEach((s) => {
          nextCells[s._id] = {
            ...nextCells[s._id],
            obtainedMarks: '',
            isAbsent: false,
            remarks: '',
          };
        });
        return { ...row, cells: nextCells };
      })
    );
  };

  // ── Render ─────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <button style={styles.backBtn} onClick={onBack}>
            ← Back to Exams
          </button>
          <h2 style={styles.heading}>
            Marks Entry — {exam.name}
          </h2>
          <p style={styles.subtitle}>
            {exam.class?.name} · {exam.academicYear?.name}
          </p>
        </div>
      </div>

      {/* Filter row */}
      <div style={styles.filterRow}>
        <div style={styles.filterField}>
          <label style={styles.label}>Section *</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={loadingSections}
            style={styles.select}
          >
            <option value="">-- Select Section --</option>
            {sections.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        {sectionId && grid.length > 0 && (
          <>
            <div style={styles.progressBox}>
              <div style={styles.progressLabel}>Progress</div>
              <div style={styles.progressValue}>
                {progress.filled} / {progress.total}
              </div>
              <div style={styles.progressBarOuter}>
                <div
                  style={{
                    ...styles.progressBarInner,
                    width: `${progress.pct}%`,
                    backgroundColor:
                      progress.pct === 100
                        ? '#10b981'
                        : progress.pct > 50
                        ? '#4a72c4'
                        : '#f59e0b',
                  }}
                />
              </div>
            </div>

            <div style={{ flex: '1 1 auto' }} />

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                ...styles.saveBtn,
                opacity: saving ? 0.6 : 1,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : '💾 Save All Marks'}
            </button>
          </>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Body */}
      {!sectionId ? (
        <p style={styles.hint}>
          Pick a section to load the marks entry grid.
        </p>
      ) : loading ? (
        <p style={styles.hint}>Loading students...</p>
      ) : grid.length === 0 ? (
        <p style={styles.hint}>
          No students enrolled in this section for {exam.academicYear?.name}.
        </p>
      ) : subjects.length === 0 ? (
        <p style={styles.hint}>
          This exam has no subjects yet. Add subjects first (📚 Subjects button on the exam list).
        </p>
      ) : (
        <div style={styles.gridWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.thSticky}>#</th>
                <th style={styles.thStickyLeft}>Roll</th>
                <th style={styles.thStickyLeft}>Student</th>
                {subjects.map((s) => (
                  <th key={s._id} style={styles.th}>
                    <div>{s.subject?.name || '—'}</div>
                    <div style={styles.thSub}>/{s.totalMarks}</div>
                  </th>
                ))}
                <th style={styles.thTotal}>Total</th>
                <th style={styles.thTotal}>Grade</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grid.map((row, i) => {
                const tot = computeStudentTotal(row);
                return (
                  <tr key={row.student._id} style={styles.tr}>
                    <td style={styles.tdSticky}>{i + 1}</td>
                    <td style={styles.tdStickyLeft}>
                      <span style={styles.rollBadge}>{row.rollNo}</span>
                    </td>
                    <td style={styles.tdStickyLeft}>
                      <div style={styles.studentCell}>
                        {row.student.picture && (
                          <img
                            src={row.student.picture}
                            alt=""
                            style={styles.avatar}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <strong>{row.student.name}</strong>
                      </div>
                    </td>

                    {subjects.map((s) => {
                      const cell = row.cells[s._id] || {};
                      const obtained = cell.obtainedMarks;
                      const numObtained = Number(obtained);
                      const overMax =
                        !cell.isAbsent &&
                        obtained !== '' &&
                        !isNaN(numObtained) &&
                        numObtained > s.totalMarks;

                      return (
                        <td key={s._id} style={styles.td}>
                          <div style={styles.cellWrap}>
                            <input
                              type="number"
                              min="0"
                              max={s.totalMarks}
                              disabled={cell.isAbsent}
                              value={cell.isAbsent ? '' : obtained}
                              onChange={(e) =>
                                updateCell(i, s._id, {
                                  obtainedMarks: e.target.value,
                                  isAbsent: false,
                                })
                              }
                              placeholder={cell.isAbsent ? 'AB' : '—'}
                              style={{
                                ...styles.cellInput,
                                ...(overMax ? styles.cellError : {}),
                                ...(cell.isAbsent ? styles.cellAbsent : {}),
                              }}
                            />
                            <label style={styles.absLabel} title="Mark absent">
                              <input
                                type="checkbox"
                                checked={!!cell.isAbsent}
                                onChange={(e) =>
                                  updateCell(i, s._id, {
                                    isAbsent: e.target.checked,
                                    obtainedMarks: '',
                                  })
                                }
                              />
                              AB
                            </label>
                          </div>
                        </td>
                      );
                    })}

                    <td style={styles.tdTotal}>
                      {tot.anyEntered ? `${tot.total} / ${tot.grand}` : '—'}
                    </td>
                    <td style={styles.tdTotal}>
                      {tot.anyEntered ? (
                        <span style={styles.gradeBadge}>{tot.grade}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionCell}>
                        <button
                          onClick={() => markStudentAbsentAll(i)}
                          title="Mark this student absent for all subjects"
                          style={{ ...styles.miniBtn, ...styles.absBtn }}
                        >
                          All AB
                        </button>
                        <button
                          onClick={() => clearStudent(i)}
                          title="Clear all marks for this student"
                          style={{ ...styles.miniBtn, ...styles.clearBtn }}
                        >
                          Clear
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {sectionId && grid.length > 0 && subjects.length > 0 && (
        <div style={styles.legend}>
          <span style={styles.legendItem}>
            <span style={styles.legendBoxOk} /> Filled
          </span>
          <span style={styles.legendItem}>
            <span style={styles.legendBoxError} /> Over max
          </span>
          <span style={styles.legendItem}>
            <span style={styles.legendBoxAb} /> AB
          </span>
          <span style={styles.legendItem}>
            Tab moves between cells. Click <strong>💾 Save</strong> when done.
          </span>
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1600px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '14px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#4a72c4',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '6px',
    fontFamily: 'inherit',
  },
  heading: { margin: 0, color: '#1e2a4a', fontSize: '22px' },
  subtitle: { margin: '2px 0 0', color: '#6b7280', fontSize: '13px' },

  filterRow: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  filterField: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '220px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },

  progressBox: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '160px',
  },
  progressLabel: {
    fontSize: '11px',
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    fontWeight: 'bold',
  },
  progressValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1e2a4a',
    marginTop: '2px',
  },
  progressBarOuter: {
    height: '6px',
    backgroundColor: '#e3e8f0',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '6px',
  },
  progressBarInner: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '3px',
  },

  saveBtn: {
    padding: '11px 24px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
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

  gridWrap: {
    overflow: 'auto',
    maxHeight: '65vh',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e3e8f0',
  },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  thead: {
    backgroundColor: '#1e2a4a',
    color: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  th: {
    padding: '8px 10px',
    textAlign: 'center',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    whiteSpace: 'nowrap',
  },
  thSub: {
    fontSize: '10px',
    color: '#a7c0f7',
    marginTop: '2px',
  },
  thSticky: {
    padding: '8px 10px',
    textAlign: 'center',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    position: 'sticky',
    left: 0,
    backgroundColor: '#1e2a4a',
    zIndex: 3,
    width: '36px',
  },
  thStickyLeft: {
    padding: '8px 10px',
    textAlign: 'left',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    position: 'sticky',
    backgroundColor: '#1e2a4a',
    zIndex: 3,
  },
  thTotal: {
    padding: '8px 10px',
    textAlign: 'center',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    backgroundColor: '#0f172a',
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #eef1f6' },
  td: {
    padding: '6px 8px',
    fontSize: '13px',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  tdSticky: {
    padding: '6px 8px',
    fontSize: '12px',
    textAlign: 'center',
    position: 'sticky',
    left: 0,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  tdStickyLeft: {
    padding: '6px 10px',
    fontSize: '13px',
    position: 'sticky',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  tdTotal: {
    padding: '6px 10px',
    fontSize: '13px',
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: '#fafbfd',
  },

  rollBadge: {
    backgroundColor: '#1e2a4a',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  studentCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: '140px',
  },
  avatar: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    objectFit: 'cover',
  },

  cellWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    justifyContent: 'center',
  },
  cellInput: {
    width: '60px',
    padding: '6px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '13px',
    textAlign: 'center',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.1s ease',
  },
  cellError: {
    borderColor: '#dc3545',
    backgroundColor: '#fef2f2',
  },
  cellAbsent: {
    backgroundColor: '#f1f3f5',
    color: '#9ca3af',
  },
  absLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    fontSize: '9px',
    color: '#6b7280',
    cursor: 'pointer',
    userSelect: 'none',
  },

  gradeBadge: {
    backgroundColor: '#4a72c4',
    color: '#fff',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
  },

  actionCell: {
    display: 'flex',
    gap: '3px',
    justifyContent: 'center',
  },
  miniBtn: {
    padding: '3px 8px',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  absBtn: { backgroundColor: '#dc3545' },
  clearBtn: { backgroundColor: '#6b7280' },

  legend: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginTop: '12px',
    fontSize: '12px',
    color: '#6b7280',
    flexWrap: 'wrap',
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px' },
  legendBoxOk: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
  },
  legendBoxError: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    border: '1px solid #dc3545',
    backgroundColor: '#fef2f2',
  },
  legendBoxAb: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    backgroundColor: '#f1f3f5',
    border: '1px solid #ccc',
  },
};

export default ExamMarksEntry;