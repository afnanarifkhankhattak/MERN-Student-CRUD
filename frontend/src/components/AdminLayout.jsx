// frontend/src/components/AdminLayout.jsx

import './AdminLayout.css';

// ── Sidebar menu items ─────────────────────────
const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',  icon: '📊' },
  { id: 'students',  label: 'Students',   icon: '👨‍🎓' },
  { id: 'teachers',  label: 'Teachers',   icon: '👨‍🏫' },
  { id: 'fees',      label: 'Fees',       icon: '💰' },
  { id: 'courses',   label: 'Courses',    icon: '📚' },
  { id: 'calendar',  label: 'Calendar',   icon: '📅' },
  { id: 'messages',  label: 'Messages',   icon: '💬' },
  { id: 'settings',  label: 'Settings',   icon: '⚙️' },
];

function AdminLayout({ username, activePage, onNavigate, onLogout, children }) {
  return (
    <div className="admin-shell">
      {/* ── SIDEBAR ──────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">🎓</span>
          <span className="admin-brand-text">StudentApp</span>
        </div>

        <nav className="admin-nav">
          {MENU_ITEMS.map((item) => (
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
        {/* Top bar */}
        <header className="admin-topbar">
          <div>
            <h2 className="admin-topbar-title">
              {MENU_ITEMS.find((m) => m.id === activePage)?.label || 'Dashboard'}
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

        {/* Content — whichever page was selected */}
        <section className="admin-content">{children}</section>
      </main>
    </div>
  );
}

export default AdminLayout;