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
  apiFetch,
} from '../api';

function DashboardPage() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [feeTotals, setFeeTotals] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  // ── Load everything in parallel ────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [
          studentsRes,
          teachersRes,
          feesRes,
          coursesRes,
          classesRes,
          sectionsRes,
          subjectsRes,
        ] = await Promise.all([
          apiFetch(STUDENTS_URL),
          apiFetch(TEACHERS_URL),
          apiFetch(FEES_URL),
          apiFetch(COURSES_URL),
          apiFetch(CLASSES_URL),
          apiFetch(SECTIONS_URL),
          apiFetch(SUBJECTS_URL),
        ]);

        const sData = await studentsRes.json();
        const tData = await teachersRes.json();
        const fData = await feesRes.json();
        const cData = await coursesRes.json();
        const clData = await classesRes.json();
        const secData = await sectionsRes.json();
        const subData = await subjectsRes.json();

        if (studentsRes.ok) setStudents(sData.data || []);
        if (teachersRes.ok) setTeachers(tData.data || []);
        if (coursesRes.ok) setCourses(cData.data || []);
        if (classesRes.ok) setClasses(clData.data || []);
        if (sectionsRes.ok) setSections(secData.data || []);
        if (subjectsRes.ok) setSubjects(subData.data || []);
        if (feesRes.ok) {
          setFeeTotals({
            totalAmount: fData.totalAmount || 0,
            totalPaid: fData.totalPaid || 0,
            totalBalance: fData.totalBalance || 0,
          });
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
  const resignedTeachers = teachers.filter((t) => t.status === 'resigned').length;

  const totalClasses = classes.length;
  const totalSections = sections.length;
  const totalSubjects = subjects.length;

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

  return (
    <div className="dash-grid">
      {/* ── Row 1: Students ─────────────────── */}
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

      {/* ── Row 2: Academic + Fees ───────────── */}
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

      {/* ── Donut chart ────────────────────── */}
      <div className="panel donut-panel">
        <div className="panel-header">
          <h3>Students by Department</h3>
          <span className="panel-tag">Top {topDepts.length}</span>
        </div>
        <div className="donut-wrap">
          <div
            className="donut"
            style={{ background: buildDonutGradient(topDepts, totalStudents) }}
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

      {/* ── Fee Summary panel ──────────────── */}
      <div className="panel">
        <div className="panel-header">
          <h3>Fee Summary</h3>
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

      {/* ── Recent students ────────────────── */}
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

// ── Helpers ──────────────────────────────────────
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

// ── Fee panel inline styles ──────────────────────
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

export default DashboardPage;