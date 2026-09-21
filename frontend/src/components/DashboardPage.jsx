// frontend/src/components/DashboardPage.jsx

import { useState, useEffect } from 'react';
import './DashboardPage.css';
import { STUDENTS_URL, TEACHERS_URL, apiFetch } from '../api';

function DashboardPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);

  // Fetch students for stats + recent table
 useEffect(() => {
  const load = async () => {
    try {
      const [studentsRes, teachersRes] = await Promise.all([
        apiFetch(STUDENTS_URL),
        apiFetch(TEACHERS_URL),
      ]);
      const sData = await studentsRes.json();
      const tData = await teachersRes.json();
      if (studentsRes.ok) setStudents(sData.data || []);
      if (teachersRes.ok) setTeachers(tData.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);
  // ── Compute stats from real data ───────────
  const totalStudents = students.length;
 const totalTeachers = teachers.length;   // placeholder until we build Teachers module
  const totalFees = 296000;   // placeholder until we build Fees module
  const recentStudents = students.slice(0, 5);

  // Count by department for the donut chart (simplified)
  const deptCounts = {};
  students.forEach((s) => {
    if (s.department) {
      deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
    }
  });
  const topDepts = Object.entries(deptCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="dash-grid">
      {/* ── Top stat cards ─────────────────── */}
      <div className="stat-card">
        <div className="stat-icon blue"></div>
        <div>
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{totalStudents}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon purple"></div>
        <div>
          <div className="stat-label">Teachers</div>
          <div className="stat-value">{totalTeachers}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon green"></div>
        <div>
          <div className="stat-label">Total Fees</div>
          <div className="stat-value">Rs {totalFees.toLocaleString()}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon orange"></div>
        <div>
          <div className="stat-label">Active Courses</div>
          <div className="stat-value">12</div>
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
                  style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                />
                <span className="legend-label">{dept}</span>
                <span className="legend-count">{count}</span>
              </li>
            ))}
          </ul>
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
                <th>Department</th>
                <th>Semester</th>
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
                          e.target.src = 'https://via.placeholder.com/30?text=?';
                        }}
                      />
                      <span>{s.name}</span>
                    </div>
                  </td>
                  <td>{s.regNo}</td>
                  <td>{s.department}</td>
                  <td>{s.semester}</td>
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
  // Remaining %
  const remaining = 100 - (acc / total) * 100;
  if (remaining > 0) {
    stops.push(`#e5e7eb ${(acc / total) * 100}% 100%`);
  }
  return `conic-gradient(${stops.join(', ')})`;
}

// ── Mini calendar ────────────────────────────────
function MiniCalendar() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const totalDays = 30;
  const startOffset = 2; // Sep 2026 starts on Tue

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

export default DashboardPage;