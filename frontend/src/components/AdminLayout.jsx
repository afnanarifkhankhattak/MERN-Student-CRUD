// frontend/src/components/AdminLayout.jsx

import './AdminLayout.css';

// ── Sidebar menu, organized into groups ─────────
const MENU_GROUPS = [
  {
    label: null,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    label: 'Academics',
    items: [
      { id: 'academic-years', label: 'Academic Years', icon: '📆' },
      { id: 'classes',        label: 'Classes',        icon: '🏫' },
      { id: 'sections',       label: 'Sections',       icon: '🔤' },
      { id: 'subjects',       label: 'Subjects',       icon: '📖' },
      { id: 'enrollments',    label: 'Enrollments',    icon: '🎓' },
    ],
  },
 {
  label: 'People',
  items: [
    { id: 'students', label: 'Students', icon: '👨‍🎓' },
    { id: 'teachers', label: 'Teachers', icon: '👨‍🏫' },
    { id: 'parents',  label: 'Parents',  icon: '👨‍👩‍👧' },
  ],
},
  {
    label: 'Finance',
    items: [
      { id: 'fees', label: 'Fees', icon: '💰' },
    ],
  },
  {
    {
  label: 'Operations',
  items: [
    { id: 'attendance', label: 'Attendance', icon: '🗓️' },
    { id: 'courses',    label: 'Courses',    icon: '📚' },
    { id: 'calendar',   label: 'Calendar',   icon: '📅' },
  ],
},
  {
    label: 'Communication',
    items: [
      { id: 'messages', label: 'Messages', icon: '💬' },
    ],
  },
  {
    label: null,
    items: [
      { id: 'settings', label: 'Settings', icon: '⚙️' },
    ],
  },
];

// Flattened helper: get the label for a given page id
const findLabel = (id) => {
  for (const group of MENU_GROUPS) {
    const found = group.items.find((item) => item.id === id);
    if (found) return found.label;
  }
  return 'Dashboard';
};

function AdminLayout({ username, activePage, onNavigate, onLogout, children }) {
  return (
    <div className="admin-shell">
      {/* ── SIDEBAR ──────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">🎓</span>
          <span className="admin-brand-text">SchoolApp</span>
        </div>

        <nav className="admin-nav">
          {MENU_GROUPS.map((group, gi) => (
            <div key={gi} className="admin-nav-group">
              {group.label && (
                <div className="admin-nav-group-label">{group.label}</div>
              )}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`admin-nav-item ${
                    activePage === item.id ? 'active' : ''
                  }`}
                  onClick={() => onNavigate(item.id)}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  <span className="admin-nav-label">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-chip">
            <div className="admin-avatar">{username.charAt(0).toUpperCase()}</div>
            <div className="admin-user-info">
              <div className="admin-user-name">{username}</div>
              <div className="admin-user-role">Administrator</div>
            </div>
          </div>
          <button className="admin-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ────────────────────────── */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h2 className="admin-topbar-title">
              {findLabel(activePage)}
            </h2>
            <p className="admin-topbar-subtitle">
              Welcome back, {username}! Here's what's happening today.
            </p>
          </div>
          <div className="admin-topbar-actions">
            <input
              type="text"
              className="admin-search"
              placeholder="🔍 Search..."
            />
            <button className="admin-icon-btn" title="Notifications">
              🔔
            </button>
          </div>
        </header>

        <section className="admin-content">{children}</section>
      </main>
    </div>
  );
}

export default AdminLayout;