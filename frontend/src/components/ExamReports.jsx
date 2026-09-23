// frontend/src/components/ExamReports.jsx

import { useState, useEffect } from 'react';
import {
  EXAMS_URL,
  SECTIONS_URL,
  apiFetch,
} from '../api';

function ExamReports({ exam, onBack, showToast }) {
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState('');
  const [loadingSections, setLoadingSections] = useState(true);

  const [rankings, setRankings] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected student for the report card view
  const [cardStudentId, setCardStudentId] = useState('');
  const [cardData, setCardData] = useState(null);
  const [loadingCard, setLoadingCard] = useState(false);

  // ── Load sections for the exam's class ─────────
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

  // ── Load rankings when section changes ─────────
  const loadRankings = async () => {
    if (!sectionId) {
      setRankings([]);
      setGrandTotal(0);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(
        `${EXAMS_URL}/${exam._id}/rankings?section=${sectionId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load rankings');
      setRankings(data.data || []);
      setGrandTotal(data.grandTotal || 0);
    } catch (e) {
      setError(e.message);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  // ── Load report card for one student ───────────
  const loadReportCard = async (studentId) => {
    if (!studentId) {
      setCardData(null);
      return;
    }
    setLoadingCard(true);
    try {
      const res = await apiFetch(
        `${EXAMS_URL}/student/${studentId}/report-card?exam=${exam._id}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load report card');
      setCardData(data.data);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
      setCardData(null);
    } finally {
      setLoadingCard(false);
    }
  };

  const handleViewCard = (studentId) => {
    setCardStudentId(studentId);
    loadReportCard(studentId);
  };

  const handlePrintCard = () => {
    window.print();
  };

  const barColor = (pct) => {
    if (pct >= 90) return '#10b981';
    if (pct >= 75) return '#4a72c4';
    if (pct >= 60) return '#f59e0b';
    return '#dc3545';
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerWrap}>
        <button style={styles.backBtn} onClick={onBack}>← Back to Exams</button>
        <h2 style={styles.heading}>📊 Exam Reports — {exam.name}</h2>
        <p style={styles.subtitle}>
          {exam.class?.name} · {exam.academicYear?.name}
        </p>
      </div>

      {/* Section picker */}
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
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Content */}
      {!sectionId ? (
        <p style={styles.hint}>Pick a section to see rankings.</p>
      ) : loading ? (
        <p style={styles.hint}>Loading rankings...</p>
      ) : rankings.length === 0 ? (
        <p style={styles.hint}>
          No marks entered yet for this section. Use the 📝 Marks tab first.
        </p>
      ) : (
        <>
          {/* Summary strip */}
          <div style={styles.summaryStrip}>
            <div style={styles.summaryCell}>
              <div style={styles.summaryLabel}>Students</div>
              <div style={styles.summaryValue}>{rankings.length}</div>
            </div>
            <div style={styles.summaryCell}>
              <div style={styles.summaryLabel}>Grand Total</div>
              <div style={styles.summaryValue}>{grandTotal}</div>
            </div>
            <div style={styles.summaryCell}>
              <div style={styles.summaryLabel}>Class Average</div>
              <div
                style={{
                  ...styles.summaryValue,
                  color: barColor(
                    rankings.reduce((s, r) => s + r.percentage, 0) /
                      rankings.length
                  ),
                }}
              >
                {Math.round(
                  rankings.reduce((s, r) => s + r.percentage, 0) /
                    rankings.length
                )}
                %
              </div>
            </div>
            <div style={styles.summaryCell}>
              <div style={styles.summaryLabel}>Top Student</div>
              <div style={styles.summaryValue}>
                {rankings[0]?.student?.name || '—'}
              </div>
            </div>
          </div>

          {/* Rankings table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Roll</th>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Obtained</th>
                  <th style={styles.th}>Out of</th>
                  <th style={styles.th}>Percentage</th>
                  <th style={styles.th}>Grade</th>
                  <th style={styles.th}>Position</th>
                  <th style={styles.th}>Report Card</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r, i) => (
                  <tr key={r.student?._id} style={styles.tr}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>
                      <span style={styles.rollBadge}>
                        {r.enrollment?.rollNo ?? '—'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.studentCell}>
                        {r.student?.picture && (
                          <img
                            src={r.student.picture}
                            alt=""
                            style={styles.avatar}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div>
                          <strong>{r.student?.name || '—'}</strong>
                          {r.student?.regNo && (
                            <div style={styles.subText}>{r.student.regNo}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <strong>{r.totalObtained}</strong>
                    </td>
                    <td style={styles.td}>{r.totalMarks}</td>
                    <td style={styles.td}>
                      <div style={styles.percentCell}>
                        <span
                          style={{
                            ...styles.percentText,
                            color: barColor(r.percentage),
                          }}
                        >
                          {r.percentage}%
                        </span>
                        <div style={styles.barOuter}>
                          <div
                            style={{
                              ...styles.barInner,
                              width: `${Math.min(100, r.percentage)}%`,
                              backgroundColor: barColor(r.percentage),
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.gradeBadge,
                          backgroundColor: barColor(r.percentage),
                        }}
                      >
                        {r.grade}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.positionBadge,
                          ...(r.position === 1
                            ? styles.position1
                            : r.position === 2
                            ? styles.position2
                            : r.position === 3
                            ? styles.position3
                            : {}),
                        }}
                      >
                        {r.position === 1 ? '🥇' : r.position === 2 ? '🥈' : r.position === 3 ? '🥉' : `#${r.position}`}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.cardBtn}
                        onClick={() => handleViewCard(r.student._id)}
                      >
                        📄 View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Report card modal */}
      {cardData && (
        <ReportCardModal
          data={cardData}
          loading={loadingCard}
          onClose={() => {
            setCardData(null);
            setCardStudentId('');
          }}
          onPrint={handlePrintCard}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Report Card Modal
// ──────────────────────────────────────────────
function ReportCardModal({ data, loading, onClose, onPrint }) {
  const { exam, student, enrollment, subjects, summary } = data || {};

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div
        style={modalStyles.modal}
        className="report-card-printable"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={modalStyles.header}>
          <div>
            <h2 style={modalStyles.title}>Report Card</h2>
            <p style={modalStyles.subtitle}>
              {exam?.name} · {exam?.class?.name} · {exam?.academicYear?.name}
            </p>
          </div>
          <button style={modalStyles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={modalStyles.body}>
          {loading ? (
            <p style={modalStyles.info}>Loading...</p>
          ) : !student ? (
            <p style={modalStyles.info}>Student data not available.</p>
          ) : (
            <>
              {/* Student info */}
              <div style={modalStyles.studentCard}>
                {student.picture && (
                  <img
                    src={student.picture}
                    alt=""
                    style={modalStyles.studentPhoto}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div style={modalStyles.studentInfo}>
                  <div style={modalStyles.studentName}>{student.name}</div>
                  <div style={modalStyles.studentMeta}>
                    Reg No: <strong>{student.regNo || '—'}</strong>
                    {enrollment?.rollNo && (
                      <> · Roll: <strong>{enrollment.rollNo}</strong></>
                    )}
                  </div>
                  {enrollment && (
                    <div style={modalStyles.studentMeta}>
                      {enrollment.class?.name} · Section {enrollment.section?.name}
                    </div>
                  )}
                </div>
                <div style={modalStyles.summaryBadge}>
                  <div style={modalStyles.summaryBadgeLabel}>Overall</div>
                  <div
                    style={{
                      ...modalStyles.summaryBadgeValue,
                      color:
                        summary?.overallPercentage >= 60
                          ? '#10b981'
                          : summary?.overallPercentage >= 40
                          ? '#f59e0b'
                          : '#dc3545',
                    }}
                  >
                    {summary?.overallPercentage}%
                  </div>
                  <div style={modalStyles.summaryBadgeGrade}>
                    Grade: {summary?.overallGrade}
                  </div>
                </div>
              </div>

              {/* Marks table */}
              <table style={modalStyles.table}>
                <thead>
                  <tr style={modalStyles.thead}>
                    <th style={modalStyles.th}>#</th>
                    <th style={modalStyles.th}>Subject</th>
                    <th style={modalStyles.th}>Total</th>
                    <th style={modalStyles.th}>Pass</th>
                    <th style={modalStyles.th}>Obtained</th>
                    <th style={modalStyles.th}>%</th>
                    <th style={modalStyles.th}>Grade</th>
                    <th style={modalStyles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects?.map((s, i) => (
                    <tr key={s.examSubjectId} style={modalStyles.tr}>
                      <td style={modalStyles.td}>{i + 1}</td>
                      <td style={modalStyles.td}>
                        <strong>{s.subject?.name}</strong>
                        {s.subject?.code && (
                          <span style={modalStyles.subText}> ({s.subject.code})</span>
                        )}
                      </td>
                      <td style={modalStyles.td}>{s.totalMarks}</td>
                      <td style={modalStyles.td}>{s.passingMarks}</td>
                      <td style={modalStyles.td}>
                        {s.isAbsent ? 'AB' : <strong>{s.obtainedMarks}</strong>}
                      </td>
                      <td style={modalStyles.td}>{s.isAbsent ? '—' : `${s.percentage}%`}</td>
                      <td style={modalStyles.td}>
                        <span
                          style={{
                            ...modalStyles.gradeBadge,
                            backgroundColor: s.isPassed ? '#d4edda' : '#fee2e2',
                            color: s.isPassed ? '#155724' : '#991b1b',
                          }}
                        >
                          {s.grade}
                        </span>
                      </td>
                      <td style={modalStyles.td}>
                        {s.isPassed ? (
                          <span style={modalStyles.passBadge}>Pass</span>
                        ) : (
                          <span style={modalStyles.failBadge}>Fail</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={modalStyles.tfoot}>
                    <td colSpan="2" style={{ ...modalStyles.td, textAlign: 'right' }}>
                      <strong>Total</strong>
                    </td>
                    <td style={modalStyles.td}><strong>{summary?.totalMarks}</strong></td>
                    <td style={modalStyles.td}>—</td>
                    <td style={modalStyles.td}><strong>{summary?.totalObtained}</strong></td>
                    <td style={modalStyles.td}><strong>{summary?.overallPercentage}%</strong></td>
                    <td style={modalStyles.td}><strong>{summary?.overallGrade}</strong></td>
                    <td style={modalStyles.td}>
                      {summary?.isPassed ? (
                        <span style={modalStyles.passBadge}>PASS</span>
                      ) : (
                        <span style={modalStyles.failBadge}>FAIL</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div style={modalStyles.footerNote}>
                This report card is generated by the school management system. For any discrepancies, contact the school office.
              </div>
            </>
          )}
        </div>

        <div style={modalStyles.footer}>
          <button style={modalStyles.printBtn} onClick={onPrint}>
            🖨️ Print Report Card
          </button>
          <button style={modalStyles.closePrimary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
  },
  headerWrap: { marginBottom: '16px' },
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
  filterField: { display: 'flex', flexDirection: 'column', minWidth: '220px' },
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

  summaryStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
    marginBottom: '16px',
  },
  summaryCell: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '12px 16px',
    border: '1px solid #eef1f6',
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1e2a4a',
    marginTop: '2px',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  thead: { backgroundColor: '#1e2a4a', color: '#fff' },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #eef1f6' },
  td: { padding: '10px 12px', fontSize: '13px', verticalAlign: 'middle' },

  rollBadge: {
    backgroundColor: '#1e2a4a',
    color: '#fff',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  studentCell: { display: 'flex', alignItems: 'center', gap: '8px' },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  subText: { fontSize: '11px', color: '#6b7280', marginTop: '2px' },

  percentCell: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: '140px' },
  percentText: { fontWeight: 'bold', fontSize: '13px', minWidth: '44px' },
  barOuter: {
    flex: 1,
    height: '8px',
    backgroundColor: '#f1f3f5',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barInner: { height: '100%', borderRadius: '4px' },

  gradeBadge: {
    padding: '3px 12px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  positionBadge: {
    padding: '3px 10px',
    borderRadius: '12px',
    backgroundColor: '#eef3fb',
    color: '#1e2a4a',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  position1: { backgroundColor: '#fef3c7', color: '#92400e', fontSize: '16px' },
  position2: { backgroundColor: '#e5e7eb', color: '#374151', fontSize: '16px' },
  position3: { backgroundColor: '#fed7aa', color: '#9a3412', fontSize: '16px' },

  cardBtn: {
    padding: '5px 12px',
    backgroundColor: '#4a72c4',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  hint: { textAlign: 'center', color: '#6b7280', padding: '40px 10px', fontSize: '14px' },
  error: {
    backgroundColor: '#fde8e8',
    color: '#991b1b',
    border: '1px solid #f5c2c2',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '12px',
  },
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
  body: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
  info: { textAlign: 'center', color: '#6b7280', padding: '30px' },

  studentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#eef3fb',
    borderRadius: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  studentPhoto: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #fff',
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: '18px', fontWeight: 'bold', color: '#1e2a4a' },
  studentMeta: { fontSize: '12px', color: '#4b5563', marginTop: '3px' },
  summaryBadge: {
    textAlign: 'center',
    padding: '8px 16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    minWidth: '120px',
  },
  summaryBadgeLabel: {
    fontSize: '10px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  summaryBadgeValue: {
    fontSize: '26px',
    fontWeight: 'bold',
    lineHeight: 1.1,
    marginTop: '2px',
  },
  summaryBadgeGrade: { fontSize: '11px', color: '#6b7280', marginTop: '2px' },

  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#1e2a4a', color: '#fff' },
  th: {
    padding: '8px 10px',
    textAlign: 'left',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tr: { borderBottom: '1px solid #eef1f6' },
  td: { padding: '8px 10px', fontSize: '13px' },
  tfoot: {
    backgroundColor: '#f8fafc',
    borderTop: '2px solid #1e2a4a',
  },
  subText: { fontSize: '11px', color: '#6b7280' },
  gradeBadge: {
    padding: '2px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  passBadge: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '2px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  failBadge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '2px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
  },

  footerNote: {
    fontSize: '11px',
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '16px',
    padding: '10px',
    borderTop: '1px dashed #e3e8f0',
  },

  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 24px',
    borderTop: '1px solid #e3e8f0',
    backgroundColor: '#fafbfd',
  },
  printBtn: {
    padding: '10px 22px',
    backgroundColor: '#6f42c1',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  closePrimary: {
    padding: '10px 22px',
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

export default ExamReports;