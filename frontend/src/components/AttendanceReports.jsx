// frontend/src/components/AttendanceReports.jsx

import { useState, useEffect } from 'react';
import {
  ATTENDANCE_URL,
  STUDENTS_URL,
  CLASSES_URL,
  SECTIONS_URL,
  apiFetch,
} from '../api';

// Compute a friendly first-day-of-month date string
const firstOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
};

const today = () => new Date().toISOString().split('T')[0];

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Bar color based on percentage
const barColor = (pct) => {
  if (pct >= 90) return '#10b981'; // green
  if (pct >= 75) return '#4a72c4'; // blue
  if (pct >= 60) return '#f59e0b'; // amber
  return '#dc3545';               // red
};

function AttendanceReports() {
  // ── Tab state ──────────────────────────────────
  const [tab, setTab] = useState('student'); // 'student' | 'class'

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📊 Attendance Reports</h2>

      {/* Tabs */}
      <div style={styles.tabRow}>
        <button
          onClick={() => setTab('student')}
          style={{
            ...styles.tab,
            ...(tab === 'student' ? styles.tabActive : {}),
          }}
        >
          👤 Student Report
        </button>
        <button
          onClick={() => setTab('class')}
          style={{
            ...styles.tab,
            ...(tab === 'class' ? styles.tabActive : {}),
          }}
        >
          🏫 Class Report
        </button>
      </div>

      {tab === 'student' ? <StudentReport /> : <ClassReport />}
    </div>
  );
}

// ────────────────────────────────────────────────
// STUDENT REPORT
// ────────────────────────────────────────────────
function StudentReport() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(STUDENTS_URL);
        const d = await res.json();
        if (res.ok) setStudents(d.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  const fetchReport = async () => {
    if (!studentId || !from || !to) {
      setError('Pick a student and both dates.');
      return;
    }
    setLoading(true);
    setError('');
    setData(null);
    try {
      const url = `${ATTENDANCE_URL}/report?student=${studentId}&from=${from}&to=${to}`;
      const res = await apiFetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch report');
      setData(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={styles.filterRow}>
        <div style={styles.filterField}>
          <label style={styles.label}>Student *</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={loadingOptions}
            style={styles.select}
          >
            <option value="">-- Select Student --</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.regNo || s.username})
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterField}>
          <label style={styles.label}>From *</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={styles.select}
          />
        </div>

        <div style={styles.filterField}>
          <label style={styles.label}>To *</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={styles.select}
          />
        </div>

        <div style={{ ...styles.filterField, justifyContent: 'flex-end' }}>
          <button
            onClick={fetchReport}
            disabled={loading}
            style={{
              ...styles.primaryBtn,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {data && (
        <div style={styles.reportCard}>
          {data.total === 0 ? (
            <p style={styles.hint}>
              No attendance records for this student in the selected range.
            </p>
          ) : (
            <>
              <h3 style={styles.reportTitle}>
                Attendance: {data.from} to {data.to}
              </h3>

              <div style={styles.bigPercentWrap}>
                <div
                  style={{
                    ...styles.bigPercent,
                    color: barColor(data.percentage),
                  }}
                >
                  {data.percentage}%
                </div>
                <div style={styles.bigPercentSub}>
                  Attendance rate
                </div>
              </div>

              <div style={styles.breakdownList}>
                <BreakdownRow
                  label="Total Days"
                  value={data.total}
                  color="#4b5563"
                />
                <BreakdownRow
                  label="Present"
                  value={data.present}
                  total={data.total}
                  color="#10b981"
                />
                <BreakdownRow
                  label="Absent"
                  value={data.absent}
                  total={data.total}
                  color="#dc3545"
                />
                <BreakdownRow
                  label="Late"
                  value={data.late}
                  total={data.total}
                  color="#f59e0b"
                />
                <BreakdownRow
                  label="Leave"
                  value={data.leave}
                  total={data.total}
                  color="#8b5cf6"
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ────────────────────────────────────────────────
// CLASS REPORT
// ────────────────────────────────────────────────
function ClassReport() {
  const [classes, setClasses] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [month, setMonth] = useState(thisMonth());

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [classRes, sectionRes] = await Promise.all([
          apiFetch(CLASSES_URL),
          apiFetch(SECTIONS_URL),
        ]);
        const cData = await classRes.json();
        const sData = await sectionRes.json();
        if (classRes.ok) setClasses(cData.data || []);
        if (sectionRes.ok) setAllSections(sData.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  const filteredSections = allSections.filter((s) => {
    const sectionClassId = typeof s.class === 'object' ? s.class?._id : s.class;
    return sectionClassId === classId;
  });

  useEffect(() => {
    setSectionId('');
  }, [classId]);

  const fetchReport = async () => {
    if (!classId || !sectionId || !month) {
      setError('Pick class, section, and month.');
      return;
    }
    setLoading(true);
    setError('');
    setData(null);
    try {
      const url = `${ATTENDANCE_URL}/class-report?class=${classId}&section=${sectionId}&month=${month}`;
      const res = await apiFetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch report');
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <>
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
          <label style={styles.label}>Month *</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={styles.select}
          />
        </div>

        <div style={{ ...styles.filterField, justifyContent: 'flex-end' }}>
          <button
            onClick={fetchReport}
            disabled={loading}
            style={{
              ...styles.primaryBtn,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {data && (
        <div style={styles.reportCard} className="attendance-report-printable">
          {data.count === 0 ? (
            <p style={styles.hint}>
              No attendance records for this class in {data.month}.
            </p>
          ) : (
            <>
              <div style={styles.classReportHeader}>
                <div>
                  <h3 style={styles.reportTitle}>
                    Class Report — {data.month}
                  </h3>
                  <div style={styles.reportSub}>
                    {data.from} to {data.to}
                  </div>
                </div>
                <div style={styles.classAvgBox}>
                  <div style={styles.classAvgLabel}>Class Average</div>
                  <div
                    style={{
                      ...styles.classAvgValue,
                      color: barColor(data.classAverage),
                    }}
                  >
                    {data.classAverage}%
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.headerRow}>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Student</th>
                      <th style={styles.th}>Total</th>
                      <th style={styles.th}>P</th>
                      <th style={styles.th}>A</th>
                      <th style={styles.th}>L</th>
                      <th style={styles.th}>Lv</th>
                      <th style={styles.th}>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((row, i) => (
                      <tr key={row.student?._id} style={styles.bodyRow}>
                        <td style={styles.td}>{i + 1}</td>
                        <td style={styles.td}>
                          <strong>{row.student?.name || '—'}</strong>
                          {row.student?.regNo && (
                            <div style={styles.subText}>
                              {row.student.regNo}
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>{row.total}</td>
                        <td style={{ ...styles.td, color: '#10b981', fontWeight: 'bold' }}>
                          {row.present}
                        </td>
                        <td style={{ ...styles.td, color: '#dc3545', fontWeight: 'bold' }}>
                          {row.absent}
                        </td>
                        <td style={{ ...styles.td, color: '#f59e0b', fontWeight: 'bold' }}>
                          {row.late}
                        </td>
                        <td style={{ ...styles.td, color: '#8b5cf6', fontWeight: 'bold' }}>
                          {row.leave}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.percentCell}>
                            <span
                              style={{
                                ...styles.percentText,
                                color: barColor(row.percentage),
                              }}
                            >
                              {row.percentage}%
                            </span>
                            <div style={styles.barOuter}>
                              <div
                                style={{
                                  ...styles.barInner,
                                  width: `${row.percentage}%`,
                                  backgroundColor: barColor(row.percentage),
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={styles.reportFooter}>
                <span style={styles.footerCount}>
                  Total: <strong>{data.count}</strong> students
                </span>
                <button
                  onClick={handlePrint}
                  style={styles.printBtn}
                >
                  🖨️ Print Report
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ── Small breakdown row component ──────────────
function BreakdownRow({ label, value, total, color }) {
  const pct = total && total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={styles.breakdownRow}>
      <span style={styles.breakdownLabel}>{label}</span>
      <div style={styles.breakdownBarOuter}>
        <div
          style={{
            ...styles.breakdownBarInner,
            width: total ? `${pct}%` : `${value > 0 ? 100 : 0}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span style={{ ...styles.breakdownValue, color }}>{value}</span>
    </div>
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
  heading: { textAlign: 'center', color: '#1e2a4a', marginBottom: '20px' },

  tabRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  tab: {
    padding: '10px 22px',
    border: '1.5px solid #4a72c4',
    backgroundColor: '#fff',
    color: '#4a72c4',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  tabActive: {
    backgroundColor: '#4a72c4',
    color: '#fff',
  },

  filterRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '20px',
    alignItems: 'flex-end',
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
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: '#4a72c4',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    fontFamily: 'inherit',
    cursor: 'pointer',
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

  reportCard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '24px',
    marginTop: '10px',
    border: '1px solid #eef1f6',
  },
  reportTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#1e2a4a',
  },
  reportSub: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '2px',
  },

  // Student report
  bigPercentWrap: {
    textAlign: 'center',
    margin: '24px 0',
  },
  bigPercent: {
    fontSize: '56px',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  bigPercentSub: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  breakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: '520px',
    margin: '0 auto',
  },
  breakdownRow: {
    display: 'grid',
    gridTemplateColumns: '90px 1fr 50px',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
  },
  breakdownLabel: {
    fontWeight: 'bold',
    color: '#4b5563',
  },
  breakdownBarOuter: {
    height: '10px',
    backgroundColor: '#f1f3f5',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  breakdownBarInner: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '6px',
  },
  breakdownValue: {
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: '14px',
  },

  // Class report
  classReportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #eef1f6',
    flexWrap: 'wrap',
    gap: '10px',
  },
  classAvgBox: {
    textAlign: 'right',
  },
  classAvgLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  classAvgValue: {
    fontSize: '28px',
    fontWeight: 'bold',
  },

  table: { width: '100%', borderCollapse: 'collapse' },
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
  subText: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '2px',
  },

  percentCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '140px',
  },
  percentText: {
    fontWeight: 'bold',
    fontSize: '13px',
    minWidth: '40px',
  },
  barOuter: {
    flex: 1,
    height: '8px',
    backgroundColor: '#f1f3f5',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barInner: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },

  reportFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #eef1f6',
    flexWrap: 'wrap',
    gap: '10px',
  },
  footerCount: {
    fontSize: '13px',
    color: '#4b5563',
  },
  printBtn: {
    padding: '10px 20px',
    backgroundColor: '#6f42c1',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
};

export default AttendanceReports;