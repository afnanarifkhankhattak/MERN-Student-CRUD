// frontend/src/components/TeacherTimetable.jsx

import { useState, useEffect } from 'react';
import {
  TIMETABLE_URL,
  TEACHERS_URL,
  ACADEMIC_YEARS_URL,
  apiFetch,
} from '../api';

const DAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

function TeacherTimetable() {
  const [teachers, setTeachers] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');

  const [byDay, setByDay] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalEntries, setTotalEntries] = useState(0);

  // Load teachers + years
  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, yRes] = await Promise.all([
          apiFetch(TEACHERS_URL),
          apiFetch(ACADEMIC_YEARS_URL),
        ]);
        const tData = await tRes.json();
        const yData = await yRes.json();
        if (tRes.ok) setTeachers(tData.data || []);
        if (yRes.ok) {
          setAcademicYears(yData.data || []);
          const active = (yData.data || []).find((y) => y.isActive);
          if (active) setAcademicYearId(active._id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load teacher's week
  const loadSchedule = async () => {
    if (!teacherId) {
      setByDay({});
      setTotalEntries(0);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const qs = academicYearId ? `?academicYear=${academicYearId}` : '';
      const res = await apiFetch(`${TIMETABLE_URL}/teacher/${teacherId}${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load schedule');
      setByDay(data.data.byDay || {});
      setTotalEntries(data.data.totalEntries || 0);
    } catch (e) {
      setError(e.message);
      setByDay({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, academicYearId]);

  const handlePrint = () => {
    window.print();
  };

  const selectedTeacher = teachers.find((t) => t._id === teacherId);

  return (
    <div style={styles.container} className="teacher-timetable-printable">
      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.field}>
          <label style={styles.label}>Teacher *</label>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            style={styles.select}
          >
            <option value="">-- Select Teacher --</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Academic Year</label>
          <select
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            style={styles.select}
          >
            <option value="">-- All Years --</option>
            {academicYears.map((y) => (
              <option key={y._id} value={y._id}>
                {y.name} {y.isActive ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>

        {teacherId && (
          <button style={styles.printBtn} onClick={handlePrint}>
            🖨️ Print
          </button>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Body */}
      {!teacherId ? (
        <p style={styles.hint}>
          Pick a teacher to see their weekly schedule.
        </p>
      ) : loading ? (
        <p style={styles.hint}>Loading schedule...</p>
      ) : totalEntries === 0 ? (
        <p style={styles.hint}>
          No timetable entries for <strong>{selectedTeacher?.name}</strong>
          {academicYearId ? ' for this academic year' : ''}.
          Build the timetable from the <strong>Timetable Grid</strong> tab.
        </p>
      ) : (
        <>
          {/* Header (visible in print) */}
          <div style={styles.printHeader}>
            <div style={styles.printHeaderSchool}>🎓 SchoolApp</div>
            <div style={styles.printHeaderTeacher}>
              {selectedTeacher?.name}
            </div>
            <div style={styles.printHeaderMeta}>
              {academicYears.find((y) => y._id === academicYearId)?.name ||
                'All academic years'}{' '}
              · {totalEntries} period(s) per week
            </div>
          </div>

          {/* Days */}
          <div style={styles.daysList}>
            {DAY_ORDER.map((day) => {
              const entries = byDay[day] || [];
              // Sort by period order
              const sorted = [...entries].sort(
                (a, b) => (a.period?.order || 0) - (b.period?.order || 0)
              );

              return (
                <div key={day} style={styles.dayCard}>
                  <div style={styles.dayHeader}>
                    <span style={styles.dayLabel}>{DAY_LABELS[day]}</span>
                    <span style={styles.dayCount}>
                      {sorted.length} period{sorted.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {sorted.length === 0 ? (
                    <div style={styles.dayEmpty}>No classes</div>
                  ) : (
                    <div style={styles.periodsList}>
                      {sorted.map((e) => (
                        <div key={e._id} style={styles.periodRow}>
                          <div style={styles.timeCol}>
                            <div style={styles.timeText}>
                              {e.period?.startTime || '—'}
                            </div>
                            <div style={styles.timeEnd}>
                              {e.period?.endTime || ''}
                            </div>
                          </div>

                          <div style={styles.subjectCol}>
                            <div style={styles.subjectName}>
                              {e.subject?.name || '—'}
                            </div>
                            {e.notes && (
                              <div style={styles.subjectNote}>{e.notes}</div>
                            )}
                          </div>

                          <div style={styles.classCol}>
                            <div style={styles.className}>
                              {e.class?.name}
                              {e.section?.name && ` - ${e.section.name}`}
                            </div>
                            {e.room && (
                              <div style={styles.roomText}>📍 {e.room}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={styles.footerNote}>
            This schedule is generated by the school management system.
          </div>
        </>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
  },
  controls: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: '20px',
    padding: '14px',
    backgroundColor: '#eef3fb',
    borderRadius: '10px',
  },
  field: { flex: '1 1 220px', display: 'flex', flexDirection: 'column' },
  label: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  printBtn: {
    padding: '10px 20px',
    backgroundColor: '#6f42c1',
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

  printHeader: {
    textAlign: 'center',
    paddingBottom: '16px',
    borderBottom: '2px solid #1e2a4a',
    marginBottom: '20px',
  },
  printHeaderSchool: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1e2a4a',
  },
  printHeaderTeacher: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#1e2a4a',
    marginTop: '8px',
  },
  printHeaderMeta: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },

  daysList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '14px 18px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: '1px solid #eef1f6',
  },
  dayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '1px solid #eef1f6',
  },
  dayLabel: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#1e2a4a',
  },
  dayCount: {
    fontSize: '11px',
    color: '#6b7280',
    backgroundColor: '#f1f3f5',
    padding: '2px 10px',
    borderRadius: '12px',
    fontWeight: 'bold',
  },
  dayEmpty: {
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
    padding: '6px 0',
  },
  periodsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  periodRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '8px 10px',
    borderRadius: '8px',
    backgroundColor: '#fafbfd',
    border: '1px solid #f4f6fa',
  },
  timeCol: {
    minWidth: '70px',
    textAlign: 'left',
  },
  timeText: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#4a72c4',
    fontFamily: 'monospace',
  },
  timeEnd: {
    fontSize: '11px',
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  subjectCol: {
    flex: '2 1 150px',
  },
  subjectName: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#1e2a4a',
  },
  subjectNote: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '2px',
    fontStyle: 'italic',
  },
  classCol: {
    flex: '1 1 120px',
    textAlign: 'right',
  },
  className: {
    fontSize: '13px',
    color: '#1f2937',
  },
  roomText: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '2px',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: '20px',
    paddingTop: '14px',
    borderTop: '1px dashed #e3e8f0',
  },
};

export default TeacherTimetable;