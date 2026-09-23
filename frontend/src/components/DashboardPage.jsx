// frontend/src/components/DashboardPage.jsx

import { useState, useEffect } from 'react';
import './DashboardPage.css';
import {
  STUDENTS_URL,
  TEACHERS_URL,
  FEES_URL,
  COURSES_URL,
  CLASSES_URL,
  SECTIONS_URL,
  SUBJECTS_URL,
  ATTENDANCE_URL,
  EXAMS_URL,
  FEE_INVOICES_URL,
  apiFetch,
} from '../api';

function DashboardPage() {
  // ── State: data ────────────────────────────────
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [feeTotals, setFeeTotals] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalBalance: 0,
  });
  const [feeSummary, setFeeSummary] = useState({
    count: 0,
    billed: 0,
    collected: 0,
    outstanding: 0,
    byStatus: { unpaid: 0, partial: 0, paid: 0, overdue: 0, waived: 0 },
  });
  const [todayAttendance, setTodayAttendance] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);

  // ── Load everything in parallel ────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        const [
          studentsRes,
          teachersRes,
          feesRes,
          coursesRes,
          classesRes,
          sectionsRes,
          subjectsRes,
          attendanceRes,
          examsRes,
          feeSummaryRes,
        ] = await Promise.all([
          apiFetch(STUDENTS_URL),
          apiFetch(TEACHERS_URL),
          apiFetch(FEES_URL),
          apiFetch(COURSES_URL),
          apiFetch(CLASSES_URL),
          apiFetch(SECTIONS_URL),
          apiFetch(SUBJECTS_URL),
          apiFetch(`${ATTENDANCE_URL}?date=${today}`),
          apiFetch(EXAMS_URL),
          apiFetch(`${FEE_INVOICES_URL}/summary`),
        ]);

        const sData = await studentsRes.json();
        const tData = await teachersRes.json();
        const fData = await feesRes.json();
        const cData = await coursesRes.json();
        const clData = await classesRes.json();
        const secData = await sectionsRes.json();
        const subData = await subjectsRes.json();
        const aData = await attendanceRes.json();
        const eData = await examsRes.json();
        const fsData = await feeSummaryRes.json();

        if (studentsRes.ok) setStudents(sData.data || []);
        if (teachersRes.ok) setTeachers(tData.data || []);
        if (coursesRes.ok) setCourses(cData.data || []);
        if (classesRes.ok) setClasses(clData.data || []);
        if (sectionsRes.ok) setSections(secData.data || []);
        if (subjectsRes.ok) setSubjects(subData.data || []);
        if (examsRes.ok) setExams(eData.data || []);

        if (feesRes.ok) {
          setFeeTotals({
            totalAmount: fData.totalAmount || 0,
            totalPaid: fData.totalPaid || 0,
            totalBalance: fData.totalBalance || 0,
          });
        }

        if (feeSummaryRes.ok && fsData.data) {
          setFeeSummary(fsData.data);
        }

        if (attendanceRes.ok) {
          const records = aData.data || [];
          const present = records.filter((r) => r.status === 'present').length;
          const absent = records.filter((r) => r.status === 'absent').length;
          const late = records.filter((r) => r.status === 'late').length;
          const leave = records.filter((r) => r.status === 'leave').length;
          const total = records.length;
          const attended = present + late;
          const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
          setTodayAttendance({ total, present, absent, late, leave, percentage });
        }
      } catch (e) {
        console.error('Failed to load dashboard data', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Derived stats ──────────────────────────────
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 'active').length;

  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter((t) => t.status === 'active').length;

  const totalClasses = classes.length;
  const totalSections = sections.length;
  const totalSubjects = subjects.length;

  // Exam stats
  const totalExams = exams.length;
  const publishedExams = exams.filter((e) => e.status === 'published').length;
  const ongoingExams = exams.filter((e) => e.status === 'ongoing').length;
  const draftExams = exams.filter((e) => e.status === 'draft').length;
  const recentExam = exams[0] || null;

  // Department breakdown for the donut
  const deptCounts = {};
  students.forEach((s) => {
    if (s.department) {
      deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
    }
  });
  const topDepts = Object.entries(deptCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const recentStudents = students.slice(0, 5);

  // ── Render ─────────────────────────────────────
  return (
    <div className="dash-grid">
      {/* ── Row 1 of stat cards ─────────────── */}
      <div className="stat-card">
        <div className="stat-icon blue">👨‍🎓</div>
        <div>
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{totalStudents}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon green">✅</div>
        <div>
          <div className="stat-label">Active Students</div>
          <div className="stat-value">{activeStudents}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon purple">👨‍🏫</div>
        <div>
          <div className="stat-label">Total Teachers</div>
          <div className="stat-value">{totalTeachers}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon green">👨‍🏫</div>
        <div>
          <div className="stat-label">Active Teachers</div>
          <div className="stat-value">{activeTeachers}</div>
        </div>
      </div>

      {/* ── Row 2 of stat cards ─────────────── */}
      <div className="stat-card">
        <div className="stat-icon blue">🏫</div>
        <div>
          <div className="stat-label">Classes</div>
          <div className="stat-value">{totalClasses}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon purple">🔤</div>
        <div>
          <div className="stat-label">Sections</div>
          <div className="stat-value">{totalSections}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon orange">📖</div>
        <div>
          <div className="stat-label">Subjects</div>
          <div className="stat-value">{totalSubjects}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon orange">📉</div>
        <div>
          <div className="stat-label">Outstanding Fees</div>
          <div className="stat-value">
            Rs {feeTotals.totalBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ── Donut chart: students by dept ──── */}
      <div className="panel donut-panel">
        <div className="panel-header">
          <h3>Students by Department</h3>
          <span className="panel-tag">Top {topDepts.length}</span>
        </div>
        <div className="donut-wrap">
          <div
            className="donut"
            style={{
              background: buildDonutGradient(topDepts, totalStudents),
            }}
          >
            <div className="donut-center">
              <div className="donut-number">{totalStudents}</div>
              <div className="donut-sub">Total</div>
            </div>
          </div>
          <ul className="legend">
            {topDepts.map(([dept, count], i) => (
              <li key={dept}>
                <span
                  className="legend-dot"
                  style={{
                    backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                  }}
                />
                <span className="legend-label">{dept}</span>
                <span className="legend-count">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Exams Overview widget ──────────── */}
      <div className="panel">
        <div className="panel-header">
          <h3>Exams Overview</h3>
          <span className="panel-tag">Live</span>
        </div>
        <ExamsWidget
          total={totalExams}
          published={publishedExams}
          ongoing={ongoingExams}
          draft={draftExams}
          recentExam={recentExam}
        />
      </div>

      {/* ── Fee Collections widget ─────────── */}
      <div className="panel">
        <div className="panel-header">
          <h3>Fee Collections</h3>
          <span className="panel-tag">Live</span>
        </div>
        <FeeWidget summary={feeSummary} />
      </div>

      {/* ── Today's Attendance widget ──────── */}
      <div className="panel">
        <div className="panel-header">
          <h3>Today's Attendance</h3>
          <span className="panel-tag">Live</span>
        </div>
        <AttendanceWidget data={todayAttendance} />
      </div>

      {/* ── Fee Summary panel (legacy) ─────── */}
      <div className="panel">
        <div className="panel-header">
          <h3>Fee Summary (Legacy)</h3>
          <span className="panel-tag">Live</span>
        </div>
        <div style={feePanelStyle}>
          <div style={feeRowStyle}>
            <span style={feeLabelStyle}>Total Billed</span>
            <span style={feeValueStyle}>
              Rs {feeTotals.totalAmount.toLocaleString()}
            </span>
          </div>
          <div style={feeRowStyle}>
            <span style={feeLabelStyle}>Collected</span>
            <span style={{ ...feeValueStyle, color: '#10b981' }}>
              Rs {feeTotals.totalPaid.toLocaleString()}
            </span>
          </div>
          <div style={feeRowStyle}>
            <span style={feeLabelStyle}>Outstanding</span>
            <span style={{ ...feeValueStyle, color: '#dc3545' }}>
              Rs {feeTotals.totalBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Notice board ───────────────────── */}
      <div className="panel">
        <div className="panel-header">
          <h3>Notice Board</h3>
          <span className="panel-tag">Today</span>
        </div>
        <ul className="notice-list">
          <li>
            <div className="notice-date">18 SEP</div>
            <div>
              <div className="notice-title">Sports Day Announcement</div>
              <div className="notice-sub">Friday, 2:00 PM — Main Ground</div>
            </div>
          </li>
          <li>
            <div className="notice-date">20 SEP</div>
            <div>
              <div className="notice-title">Fee Submission Reminder</div>
              <div className="notice-sub">Last date: 25 Sep</div>
            </div>
          </li>
          <li>
            <div className="notice-date">22 SEP</div>
            <div>
              <div className="notice-title">Mid-Term Exams Begin</div>
              <div className="notice-sub">Check timetable</div>
            </div>
          </li>
        </ul>
      </div>

      {/* ── Mini calendar ──────────────────── */}
      <div className="panel">
        <div className="panel-header">
          <h3>September 2026</h3>
          <span className="panel-tag">Calendar</span>
        </div>
        <MiniCalendar />
      </div>

      {/* ── Recent students table ──────────── */}
      <div className="panel recent-panel">
        <div className="panel-header">
          <h3>Recently Added Students</h3>
          <span className="panel-tag">Latest 5</span>
        </div>
        {loading ? (
          <p style={{ color: '#6b7280' }}>Loading...</p>
        ) : recentStudents.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No students yet.</p>
        ) : (
          <table className="recent-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Reg No</th>
                <th>Class</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className="student-cell">
                      <img
                        src={s.picture}
                        alt={s.name}
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+';
                        }}
                      />
                      <span>{s.name}</span>
                    </div>
                  </td>
                  <td>{s.regNo}</td>
                  <td>{s.class?.name || '—'}</td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textTransform: 'capitalize',
                        backgroundColor:
                          s.status === 'active'
                            ? '#d4edda'
                            : s.status === 'alumni'
                            ? '#dbeafe'
                            : '#f1f3f5',
                        color:
                          s.status === 'active'
                            ? '#155724'
                            : s.status === 'alumni'
                            ? '#1e40af'
                            : '#6b7280',
                      }}
                    >
                      {s.status || 'active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// Helper components & utilities
// ════════════════════════════════════════════════

// ── Attendance Widget ──────────────────────────
function AttendanceWidget({ data }) {
  const { total, present, absent, late, leave, percentage } = data;

  const tierColor = (pct) => {
    if (pct >= 90) return '#10b981';
    if (pct >= 75) return '#4a72c4';
    if (pct >= 60) return '#f59e0b';
    return '#dc3545';
  };

  if (total === 0) {
    return (
      <div style={widgetStyles.empty}>
        <div style={widgetStyles.emptyIcon}>📭</div>
        <div style={widgetStyles.emptyText}>No attendance marked today.</div>
        <div style={widgetStyles.emptyHint}>
          Go to Attendance → Mark Attendance to get started.
        </div>
      </div>
    );
  }

  const color = tierColor(percentage);

  return (
    <div style={widgetStyles.wrap}>
      <div style={widgetStyles.bigWrap}>
        <div style={{ ...widgetStyles.bigPercent, color }}>
          {percentage}%
        </div>
        <div style={widgetStyles.bigLabel}>Attendance rate</div>
      </div>

      <div style={widgetStyles.barOuter}>
        <div
          style={{
            ...widgetStyles.barInner,
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <div style={widgetStyles.grid}>
        <StatChip label="Present" value={present} color="#10b981" />
        <StatChip label="Absent"  value={absent}  color="#dc3545" />
        <StatChip label="Late"    value={late}    color="#f59e0b" />
        <StatChip label="Leave"   value={leave}   color="#8b5cf6" />
      </div>

      <div style={widgetStyles.totalLine}>
        Total marked: <strong>{total}</strong> student{total === 1 ? '' : 's'}
      </div>
    </div>
  );
}

// ── Exams Overview Widget ──────────────────────
function ExamsWidget({ total, published, ongoing, draft, recentExam }) {
  if (total === 0) {
    return (
      <div style={examsWidgetStyles.empty}>
        <div style={examsWidgetStyles.emptyIcon}>📝</div>
        <div style={examsWidgetStyles.emptyText}>No exams yet.</div>
        <div style={examsWidgetStyles.emptyHint}>
          Go to Exams → 📋 Exams List to create one.
        </div>
      </div>
    );
  }

  const statusColors = {
    draft: '#6b7280',
    ongoing: '#f59e0b',
    completed: '#4a72c4',
    published: '#10b981',
  };

  return (
    <div style={examsWidgetStyles.wrap}>
      <div style={examsWidgetStyles.bigWrap}>
        <div style={examsWidgetStyles.bigNumber}>{total}</div>
        <div style={examsWidgetStyles.bigLabel}>Total Exams</div>
      </div>

      <div style={examsWidgetStyles.grid}>
        <StatusChip label="Published" count={published} color="#10b981" />
        <StatusChip label="Ongoing" count={ongoing} color="#f59e0b" />
        <StatusChip label="Draft" count={draft} color="#6b7280" />
      </div>

      {recentExam && (
        <div style={examsWidgetStyles.recentWrap}>
          <div style={examsWidgetStyles.recentLabel}>Most Recent</div>
          <div style={examsWidgetStyles.recentCard}>
            <div style={examsWidgetStyles.recentInfo}>
              <div style={examsWidgetStyles.recentName}>
                {recentExam.name}
              </div>
              <div style={examsWidgetStyles.recentMeta}>
                {recentExam.class?.name || '—'} ·{' '}
                {recentExam.academicYear?.name || '—'}
              </div>
            </div>
            <span
              style={{
                ...examsWidgetStyles.recentStatus,
                backgroundColor:
                  (statusColors[recentExam.status] || '#6b7280') + '22',
                color: statusColors[recentExam.status] || '#6b7280',
              }}
            >
              {recentExam.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Fee Management Widget ──────────────────────
function FeeWidget({ summary }) {
  const { count, billed, collected, outstanding, byStatus } = summary;

  if (count === 0) {
    return (
      <div style={feeWidgetStyles.empty}>
        <div style={feeWidgetStyles.emptyIcon}>💵</div>
        <div style={feeWidgetStyles.emptyText}>No invoices yet.</div>
        <div style={feeWidgetStyles.emptyHint}>
          Go to Fee Management → Invoices to generate them.
        </div>
      </div>
    );
  }

  const collectionRate =
    billed > 0 ? Math.round((collected / billed) * 100) : 0;

  const barColor =
    collectionRate >= 90
      ? '#10b981'
      : collectionRate >= 70
      ? '#4a72c4'
      : collectionRate >= 50
      ? '#f59e0b'
      : '#dc3545';

  return (
    <div style={feeWidgetStyles.wrap}>
      <div style={feeWidgetStyles.bigWrap}>
        <div style={{ ...feeWidgetStyles.bigPercent, color: barColor }}>
          {collectionRate}%
        </div>
        <div style={feeWidgetStyles.bigLabel}>Collection Rate</div>
      </div>

      <div style={feeWidgetStyles.barOuter}>
        <div
          style={{
            ...feeWidgetStyles.barInner,
            width: `${collectionRate}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      <div style={feeWidgetStyles.amountsList}>
        <div style={feeWidgetStyles.amountRow}>
          <span style={feeWidgetStyles.amountLabel}>Billed</span>
          <span style={feeWidgetStyles.amountValue}>
            Rs {Number(billed).toLocaleString()}
          </span>
        </div>
        <div style={feeWidgetStyles.amountRow}>
          <span style={feeWidgetStyles.amountLabel}>Collected</span>
          <span style={{ ...feeWidgetStyles.amountValue, color: '#10b981' }}>
            Rs {Number(collected).toLocaleString()}
          </span>
        </div>
        <div style={feeWidgetStyles.amountRow}>
          <span style={feeWidgetStyles.amountLabel}>Outstanding</span>
          <span style={{ ...feeWidgetStyles.amountValue, color: '#dc3545' }}>
            Rs {Number(outstanding).toLocaleString()}
          </span>
        </div>
      </div>

      <div style={feeWidgetStyles.statusRow}>
        <span style={feeWidgetStyles.statusPill}>
          📄 {count} invoices
        </span>
        <span
          style={{
            ...feeWidgetStyles.statusPill,
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderColor: '#fecaca',
          }}
        >
          {byStatus?.unpaid || 0} unpaid
        </span>
        <span
          style={{
            ...feeWidgetStyles.statusPill,
            backgroundColor: '#fef3c7',
            color: '#92400e',
            borderColor: '#fde68a',
          }}
        >
          {byStatus?.partial || 0} partial
        </span>
      </div>
    </div>
  );
}

// Small chip for the attendance mini stats
function StatChip({ label, value, color }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px',
        borderRadius: '8px',
        backgroundColor: color + '15',
        border: `1px solid ${color}40`,
      }}
    >
      <span
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: color,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: '10px',
          color: '#4b5563',
          marginTop: '3px',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// Small chip for the exams status breakdown
function StatusChip({ label, count, color }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px',
        borderRadius: '8px',
        backgroundColor: color + '15',
        border: `1px solid ${color}40`,
      }}
    >
      <span
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: color,
          lineHeight: 1,
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontSize: '10px',
          color: '#4b5563',
          marginTop: '3px',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Donut gradient builder ─────────────────────
const DONUT_COLORS = ['#4a72c4', '#7a9df0', '#a7c0f7', '#1e2a4a'];

function buildDonutGradient(topDepts, total) {
  if (total === 0) return '#e5e7eb';
  let acc = 0;
  const stops = topDepts.map(([, count], i) => {
    const from = (acc / total) * 100;
    acc += count;
    const to = (acc / total) * 100;
    return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${from}% ${to}%`;
  });
  const remaining = 100 - (acc / total) * 100;
  if (remaining > 0) {
    stops.push(`#e5e7eb ${(acc / total) * 100}% 100%`);
  }
  return `conic-gradient(${stops.join(', ')})`;
}

// ── Mini calendar ──────────────────────────────
function MiniCalendar() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const totalDays = 30;
  const startOffset = 2;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  return (
    <div className="mini-cal">
      <div className="mini-cal-grid">
        {days.map((d, i) => (
          <div key={i} className="mini-cal-dow">{d}</div>
        ))}
        {cells.map((d, i) => (
          <div
            key={i}
            className={`mini-cal-day ${d === 18 ? 'today' : ''} ${!d ? 'empty' : ''}`}
          >
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Fee panel inline styles (legacy) ───────────
const feePanelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  paddingTop: '6px',
};

const feeRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid #eef1f6',
};

const feeLabelStyle = {
  fontSize: '13px',
  color: '#6b7280',
};

const feeValueStyle = {
  fontSize: '15px',
  fontWeight: 'bold',
  color: '#1e2a4a',
};

// ── Widget styles (attendance) ─────────────────
const widgetStyles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingTop: '6px',
  },
  bigWrap: { textAlign: 'center', padding: '8px 0 4px' },
  bigPercent: { fontSize: '48px', fontWeight: 'bold', lineHeight: 1 },
  bigLabel: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  barOuter: {
    height: '8px',
    backgroundColor: '#f1f3f5',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '4px',
  },
  barInner: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '6px',
    marginTop: '6px',
  },
  totalLine: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: '4px',
  },
  empty: { padding: '20px 10px', textAlign: 'center' },
  emptyIcon: { fontSize: '32px', marginBottom: '6px' },
  emptyText: { fontSize: '14px', fontWeight: 'bold', color: '#4b5563' },
  emptyHint: { fontSize: '12px', color: '#9ca3af', marginTop: '4px' },
};

// ── Widget styles (exams) ──────────────────────
const examsWidgetStyles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingTop: '6px',
  },
  bigWrap: { textAlign: 'center', padding: '8px 0 4px' },
  bigNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#1e2a4a',
    lineHeight: 1,
  },
  bigLabel: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
  },
  recentWrap: {
    marginTop: '6px',
    paddingTop: '10px',
    borderTop: '1px solid #eef1f6',
  },
  recentLabel: {
    fontSize: '10px',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  recentCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #eef1f6',
  },
  recentInfo: { flex: 1, minWidth: 0 },
  recentName: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#1e2a4a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  recentMeta: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '2px',
  },
  recentStatus: {
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'capitalize',
    whiteSpace: 'nowrap',
  },
  empty: { padding: '20px 10px', textAlign: 'center' },
  emptyIcon: { fontSize: '32px', marginBottom: '6px' },
  emptyText: { fontSize: '14px', fontWeight: 'bold', color: '#4b5563' },
  emptyHint: { fontSize: '12px', color: '#9ca3af', marginTop: '4px' },
};

// ── Widget styles (fee management) ─────────────
const feeWidgetStyles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingTop: '6px',
  },
  bigWrap: { textAlign: 'center', padding: '8px 0 4px' },
  bigPercent: { fontSize: '48px', fontWeight: 'bold', lineHeight: 1 },
  bigLabel: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  barOuter: {
    height: '8px',
    backgroundColor: '#f1f3f5',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '4px',
  },
  barInner: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  amountsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginTop: '6px',
  },
  amountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    borderBottom: '1px solid #f4f6fa',
  },
  amountLabel: { fontSize: '12px', color: '#6b7280' },
  amountValue: { fontSize: '13px', fontWeight: 'bold', color: '#1e2a4a' },
  statusRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #eef1f6',
  },
  statusPill: {
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    border: '1px solid #c8e0f9',
  },
  empty: { padding: '20px 10px', textAlign: 'center' },
  emptyIcon: { fontSize: '32px', marginBottom: '6px' },
  emptyText: { fontSize: '14px', fontWeight: 'bold', color: '#4b5563' },
  emptyHint: { fontSize: '12px', color: '#9ca3af', marginTop: '4px' },
};

export default DashboardPage;