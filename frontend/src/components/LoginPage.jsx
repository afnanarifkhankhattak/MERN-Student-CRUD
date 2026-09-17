// frontend/src/components/LoginPage.jsx

import { useState } from 'react';
import './LoginPage.css';

// ── Hardcoded users (for demo purposes) ──────────
// In a real app, this would live in MongoDB with hashed passwords.
const USERS = {
  student: { username: 'student', password: 'student123' },
  admin:   { username: 'admin',   password: 'admin123' },
};

function LoginPage({ onLoginSuccess }) {
  const [role, setRole] = useState('student');   // 'student' | 'admin'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const expected = USERS[role];

    if (username === expected.username && password === expected.password) {
      // Success — tell App who logged in
      onLoginSuccess({ role, username });
    } else {
      setError(`Invalid ${role} credentials. Please try again.`);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* LEFT: illustration */}
        <div className="login-left">
          {/* Inline SVG — a simple student-at-desk illustration */}
          <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
            {/* Ground line */}
            <line x1="20" y1="280" x2="380" y2="280" stroke="#000" strokeWidth="1.5" />

            {/* Left tall block */}
            <rect x="40" y="180" width="60" height="100" fill="#7a9df0" rx="3" />
            <circle cx="55" cy="200" r="3" fill="#fff" />
            <circle cx="80" cy="200" r="3" fill="#fff" />
            <circle cx="55" cy="220" r="3" fill="#fff" />
            <circle cx="80" cy="220" r="3" fill="#fff" />
            <circle cx="55" cy="240" r="3" fill="#fff" />
            <circle cx="80" cy="240" r="3" fill="#fff" />

            {/* Right shorter block */}
            <rect x="110" y="200" width="90" height="80" fill="#4a72c4" rx="3" />

            {/* Clock */}
            <circle cx="260" cy="70" r="22" fill="none" stroke="#333" strokeWidth="1.5" />
            <line x1="260" y1="70" x2="260" y2="55" stroke="#333" strokeWidth="1.5" />
            <line x1="260" y1="70" x2="272" y2="70" stroke="#333" strokeWidth="1.5" />

            {/* Wavy lines (decoration) */}
            <path d="M100 100 Q115 90, 130 100 Q145 110, 160 100" fill="none" stroke="#7a9df0" strokeWidth="1.5" />
            <path d="M60 140 Q75 130, 90 140 Q105 150, 120 140" fill="none" stroke="#7a9df0" strokeWidth="1.5" />

            {/* Small circle */}
            <circle cx="80" cy="70" r="5" fill="none" stroke="#7a9df0" strokeWidth="1.5" />

            {/* Laptop (blue diamond shape) */}
            <polygon points="200,230 260,230 240,260 180,260" fill="#2563eb" />
            <polygon points="200,228 260,228 240,232 180,232" fill="#1e40af" />

            {/* Student body — sitting */}
            <ellipse cx="180" cy="240" rx="30" ry="18" fill="#1f2937" />
            <rect x="160" y="200" width="40" height="45" fill="#1f2937" rx="6" />

            {/* Legs */}
            <path d="M170 250 L150 280" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
            <path d="M195 250 L215 280" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
            <path d="M145 280 L155 280" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
            <path d="M210 280 L220 280" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />

            {/* Arm */}
            <path d="M170 220 Q150 235, 160 250" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" fill="none" />

            {/* Head */}
            <circle cx="185" cy="180" r="18" fill="#1f2937" />

            {/* Bun (hair) */}
            <circle cx="170" cy="160" r="8" fill="#1f2937" />
            <circle cx="185" cy="155" r="10" fill="#1f2937" />

            {/* Decorative dots */}
            <circle cx="300" cy="200" r="4" fill="none" stroke="#7a9df0" strokeWidth="1.5" />
            <circle cx="320" cy="120" r="6" fill="none" stroke="#7a9df0" strokeWidth="1.5" />
          </svg>
        </div>

        {/* RIGHT: form */}
        <div className="login-right">
          <h1 className="login-title">
            {role === 'student' ? 'Student Login' : 'Admin Login'}
          </h1>
          <p className="login-subtitle">
            Hey, enter your details to sign in to your account
          </p>

          {error && <div className="login-error">{error}</div>}

          {/* Role toggle */}
          <div className="role-toggle">
            <button
              type="button"
              className={`role-btn ${role === 'student' ? 'active' : ''}`}
              onClick={() => { setRole('student'); setError(''); }}
            >
              👨‍🎓 Student
            </button>
            <button
              type="button"
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => { setRole('admin'); setError(''); }}
            >
              👨‍💼 Admin
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="login-input"
              placeholder="👤  Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />

            <input
              type="password"
              className="login-input"
              placeholder="🔒  Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <button type="submit" className="login-btn">
              Log In
            </button>
          </form>

          <div className="login-hint">
            <strong>Demo credentials</strong>
            <br />
            Student: <code>student</code> / <code>student123</code>
            <br />
            Admin: <code>admin</code> / <code>admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;