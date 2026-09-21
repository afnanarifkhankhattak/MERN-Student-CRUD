// frontend/src/components/CalendarPage.jsx

import { useState, useEffect, useMemo } from 'react';
import './CalendarPage.css';
import { FEES_URL, COURSES_URL, apiFetch } from '../api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Format a Date as "YYYY-MM-DD"
const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function CalendarPage() {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(toISODate(today));
  const [fees, setFees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Load fees and courses to build events ─────
  useEffect(() => {
    const load = async () => {
      try {
        const [feesRes, coursesRes] = await Promise.all([
          apiFetch(FEES_URL),
          apiFetch(COURSES_URL),
        ]);
        const fData = await feesRes.json();
        const cData = await coursesRes.json();
        if (feesRes.ok) setFees(fData.data || []);
        if (coursesRes.ok) setCourses(cData.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Build events map: { "2026-09-18": [event, event, ...] }
  const eventsByDate = useMemo(() => {
    const map = {};

    // Fee events
    fees.forEach((f) => {
      if (!f.dueDate) return;
      const dateKey = f.dueDate.split('T')[0]; // handle ISO strings
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push({
        type: 'fee',
        title: `Fee due: ${f.studentName}`,
        subtitle: `Rs ${Number(f.balance ?? f.amount).toLocaleString()} • ${f.status}`,
      });
    });

    // Course events — we'll place them at the start of each semester's month
    // (Simulated: each course gets an event on day 1 of its semester month)
    courses.forEach((c) => {
      if (!c.semester) return;
      const monthIndex = (Number(c.semester) - 1) % 12; // semester 1 → Jan
      const dateKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push({
        type: 'course',
        title: `Course: ${c.code}`,
        subtitle: `${c.title} • Sem ${c.semester}`,
      });
    });

    return map;
  }, [fees, courses, currentYear]);

  // ── Navigate months ───────────────────────────
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(toISODate(today));
  };

  // ── Build grid cells ──────────────────────────
  const gridCells = useMemo(() => {
    const firstOfMonth = new Date(currentYear, currentMonth, 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const cells = [];
    // Blank cells before day 1
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, dateKey: null });
    }
    // Days 1..daysInMonth
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateKey });
    }
    // Fill to a multiple of 7 (6 weeks max)
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateKey: null });
    }
    return cells;
  }, [currentYear, currentMonth]);

  const todayKey = toISODate(today);
  const selectedEvents = eventsByDate[selectedDate] || [];

  if (loading) {
    return <p style={{ textAlign: 'center', color: '#666', margin: '40px' }}>Loading calendar...</p>;
  }

  return (
    <div className="cal-wrap">
      {/* ── Calendar grid ─────────────────────── */}
      <div className="cal-main">
        <div className="cal-header">
          <div className="cal-nav-group">
            <button className="cal-nav-btn" onClick={goToPrevMonth}>◀</button>
            <h2 className="cal-title">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button className="cal-nav-btn" onClick={goToNextMonth}>▶</button>
          </div>
          <button className="cal-today-btn" onClick={goToToday}>Today</button>
        </div>

        <div className="cal-grid-head">
          {DAY_NAMES.map((d) => (
            <div key={d} className="cal-day-name">{d}</div>
          ))}
        </div>

        <div className="cal-grid">
          {gridCells.map((cell, i) => {
            if (!cell.day) return <div key={i} className="cal-cell empty" />;

            const events = eventsByDate[cell.dateKey] || [];
            const isToday = cell.dateKey === todayKey;
            const isSelected = cell.dateKey === selectedDate;

            return (
              <div
                key={i}
                className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedDate(cell.dateKey)}
              >
                <div className="cal-day-number">{cell.day}</div>
                {events.length > 0 && (
                  <div className="cal-dots">
                    {events.slice(0, 3).map((ev, idx) => (
                      <span
                        key={idx}
                        className={`cal-dot dot-${ev.type}`}
                        title={ev.title}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Side panel: selected day's events ─── */}
      <aside className="cal-side">
        <h3 className="cal-side-title">
          {selectedDate === todayKey ? 'Today' : selectedDate}
        </h3>

        {selectedEvents.length === 0 ? (
          <p className="cal-empty">No events on this day.</p>
        ) : (
          <ul className="cal-event-list">
            {selectedEvents.map((ev, i) => (
              <li key={i} className={`cal-event ${ev.type}`}>
                <div className="cal-event-title">{ev.title}</div>
                <div className="cal-event-sub">{ev.subtitle}</div>
              </li>
            ))}
          </ul>
        )}

        <div className="cal-legend">
          <div className="cal-legend-item">
            <span className="cal-legend-dot dot-fee" /> Fee Due
          </div>
          <div className="cal-legend-item">
            <span className="cal-legend-dot dot-course" /> Course
          </div>
        </div>
      </aside>
    </div>
  );
}

export default CalendarPage;