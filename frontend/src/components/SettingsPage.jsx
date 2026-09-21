// frontend/src/components/SettingsPage.jsx

import { useState, useEffect } from 'react';
import './SettingsPage.css';
import { getStoredUser, setStoredUser, clearToken, clearStoredUser } from '../api';

// ── localStorage keys ────────────────────────────
const KEY_PROFILE = 'settings_profile';
const KEY_THEME = 'settings_theme';
const KEY_NOTIFS = 'settings_notifications';

// ── Defaults ─────────────────────────────────────
const DEFAULT_PROFILE = {
  name: '',
  email: '',
  avatar: 'https://i.pravatar.cc/150?img=12',
  bio: '',
};

const DEFAULT_NOTIFS = {
  email: true,
  push: true,
  weeklyReport: false,
};

function SettingsPage() {
  // ── Profile ────────────────────────────────────
  const storedUser = getStoredUser();
  const [profile, setProfile] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY_PROFILE) || 'null');
      if (saved) return saved;
    } catch {
      /* ignore */
    }
    return {
      ...DEFAULT_PROFILE,
      name: storedUser?.username || 'Admin',
      email: storedUser?.email || '',
    };
  });
  const [profileMsg, setProfileMsg] = useState('');

  // ── Password ───────────────────────────────────
  const [passwords, setPasswords] = useState({
    current: '',
    newPw: '',
    confirm: '',
  });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // ── Appearance ─────────────────────────────────
  const [theme, setTheme] = useState(
    () => localStorage.getItem(KEY_THEME) || 'light'
  );

  // ── Notifications ──────────────────────────────
  const [notifs, setNotifs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY_NOTIFS) || 'null');
      if (saved) return saved;
    } catch {
      /* ignore */
    }
    return DEFAULT_NOTIFS;
  });

  // ── Apply theme to body ────────────────────────
  useEffect(() => {
    document.body.classList.toggle('theme-dark', theme === 'dark');
    localStorage.setItem(KEY_THEME, theme);
  }, [theme]);

  // ── Save handlers ──────────────────────────────
  const saveProfile = () => {
    localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
    // Update the stored user's username as well
    if (storedUser) {
      setStoredUser({ ...storedUser, username: profile.name });
    }
    setProfileMsg('Profile saved ✅');
    setTimeout(() => setProfileMsg(''), 2500);
  };

  const savePassword = (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (!passwords.current) {
      setPasswordMsg({ type: 'error', text: 'Current password is required' });
      return;
    }
    if (passwords.newPw.length < 6) {
      setPasswordMsg({
        type: 'error',
        text: 'New password must be at least 6 characters',
      });
      return;
    }
    if (passwords.newPw !== passwords.confirm) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    // Demo: we don't actually call the backend.
    // In a real app, send POST /auth/change-password with current + new.
    setPasswordMsg({
      type: 'success',
      text: 'Demo only — password change not connected to backend yet.',
    });
    setPasswords({ current: '', newPw: '', confirm: '' });
  };

  const toggleNotif = (key) => {
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    localStorage.setItem(KEY_NOTIFS, JSON.stringify(updated));
  };

  const handleLogoutEverywhere = () => {
    if (!window.confirm('Log out from all devices? You will be redirected to login.')) return;
    clearToken();
    clearStoredUser();
    window.location.reload();
  };

  const handleClearCache = () => {
    if (!window.confirm('Clear all locally saved settings? (Profile, theme, notifications)')) return;
    localStorage.removeItem(KEY_PROFILE);
    localStorage.removeItem(KEY_THEME);
    localStorage.removeItem(KEY_NOTIFS);
    window.location.reload();
  };

  return (
    <div className="set-wrap">
      {/* ── SECTION: Profile ──────────────────── */}
      <section className="set-card">
        <h2 className="set-title">Profile</h2>
        <p className="set-sub">Update your personal information.</p>

        <div className="set-avatar-row">
          <img
            src={profile.avatar}
            alt="Avatar"
            className="set-avatar"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/80?text=?';
            }}
          />
          <div className="set-avatar-info">
            <div className="set-avatar-name">{profile.name || 'Admin'}</div>
            <div className="set-avatar-role">Administrator</div>
          </div>
        </div>

        <div className="set-row">
          <div className="set-field">
            <label className="set-label">Full Name</label>
            <input
              type="text"
              className="set-input"
              value={profile.name}
              onChange={(e) =>
                setProfile((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="e.g. Afnan Arif"
            />
          </div>
          <div className="set-field">
            <label className="set-label">Email</label>
            <input
              type="email"
              className="set-input"
              value={profile.email}
              onChange={(e) =>
                setProfile((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="set-row">
          <div className="set-field set-field-full">
            <label className="set-label">Avatar URL</label>
            <input
              type="text"
              className="set-input"
              value={profile.avatar}
              onChange={(e) =>
                setProfile((p) => ({ ...p, avatar: e.target.value }))
              }
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="set-row">
          <div className="set-field set-field-full">
            <label className="set-label">Bio (optional)</label>
            <textarea
              className="set-input"
              rows="3"
              value={profile.bio}
              onChange={(e) =>
                setProfile((p) => ({ ...p, bio: e.target.value }))
              }
              placeholder="A short description about you..."
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        <div className="set-actions">
          <button className="set-btn primary" onClick={saveProfile}>
            Save Profile
          </button>
          {profileMsg && <span className="set-msg">{profileMsg}</span>}
        </div>
      </section>

      {/* ── SECTION: Password ────────────────── */}
      <section className="set-card">
        <h2 className="set-title">Change Password</h2>
        <p className="set-sub">
          Choose a strong password of at least 6 characters.
        </p>

        {passwordMsg.text && (
          <div
            className={`set-alert ${
              passwordMsg.type === 'success' ? 'ok' : 'err'
            }`}
          >
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={savePassword}>
          <div className="set-row">
            <div className="set-field set-field-full">
              <label className="set-label">Current Password</label>
              <input
                type="password"
                className="set-input"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, current: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="set-row">
            <div className="set-field">
              <label className="set-label">New Password</label>
              <input
                type="password"
                className="set-input"
                value={passwords.newPw}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, newPw: e.target.value }))
                }
              />
            </div>
            <div className="set-field">
              <label className="set-label">Confirm New Password</label>
              <input
                type="password"
                className="set-input"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, confirm: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="set-actions">
            <button type="submit" className="set-btn primary">
              Update Password
            </button>
          </div>
        </form>
      </section>

      {/* ── SECTION: Appearance ──────────────── */}
      <section className="set-card">
        <h2 className="set-title">Appearance</h2>
        <p className="set-sub">Choose how the dashboard looks.</p>

        <div className="set-toggle-row">
          <div>
            <div className="set-toggle-label">Dark Mode</div>
            <div className="set-toggle-hint">
              Switch between light and dark theme.
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
            />
            <span className="slider" />
          </label>
        </div>
      </section>

      {/* ── SECTION: Notifications ───────────── */}
      <section className="set-card">
        <h2 className="set-title">Notifications</h2>
        <p className="set-sub">Choose what you want to be notified about.</p>

        <div className="set-toggle-row">
          <div>
            <div className="set-toggle-label">Email Notifications</div>
            <div className="set-toggle-hint">
              Receive updates about students and fees by email.
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={notifs.email}
              onChange={() => toggleNotif('email')}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="set-toggle-row">
          <div>
            <div className="set-toggle-label">Push Notifications</div>
            <div className="set-toggle-hint">
              Show browser notifications for urgent events.
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={notifs.push}
              onChange={() => toggleNotif('push')}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="set-toggle-row">
          <div>
            <div className="set-toggle-label">Weekly Report</div>
            <div className="set-toggle-hint">
              Receive a weekly summary every Sunday.
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={notifs.weeklyReport}
              onChange={() => toggleNotif('weeklyReport')}
            />
            <span className="slider" />
          </label>
        </div>
      </section>

      {/* ── SECTION: Danger Zone ─────────────── */}
      <section className="set-card danger">
        <h2 className="set-title danger-title">Danger Zone</h2>
        <p className="set-sub">
          These actions are irreversible. Please be careful.
        </p>

        <div className="set-danger-row">
          <div>
            <div className="set-toggle-label">Log out from all devices</div>
            <div className="set-toggle-hint">
              Sign out of your account everywhere.
            </div>
          </div>
          <button className="set-btn danger-btn" onClick={handleLogoutEverywhere}>
            Log out everywhere
          </button>
        </div>

        <div className="set-danger-row">
          <div>
            <div className="set-toggle-label">Clear local settings</div>
            <div className="set-toggle-hint">
              Reset profile, theme, and notification preferences.
            </div>
          </div>
          <button className="set-btn danger-btn" onClick={handleClearCache}>
            Clear cache
          </button>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;