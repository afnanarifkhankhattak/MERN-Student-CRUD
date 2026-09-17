// frontend/src/components/LoginPage.jsx

import { useState } from 'react';
import './LoginPage.css';
import { AUTH_URL, setToken, setStoredUser } from '../api';

function LoginPage({ onLoginSuccess, onGoToSignUp }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save the JWT and user object
      setToken(data.token);
      setStoredUser(data.user);

      // Tell App the login succeeded
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* LEFT: illustration */}
        <div className="login-left">
          <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
            <line x1="20" y1="280" x2="380" y2="280" stroke="#000" strokeWidth="1.5" />

            <rect x="40" y="180" width="60" height="100" fill="#7a9df0" rx="3" />
            <circle cx="55" cy="200" r="3" fill="#fff" />
            <circle cx="80" cy="200" r="3" fill="#fff" />
            <circle cx="55" cy="220" r="3" fill="#fff" />
            <circle cx="80" cy="220" r="3" fill="#fff" />
            <circle cx="55" cy="240" r="3" fill="#fff" />
            <circle cx="80" cy="240" r="3" fill="#fff" />

            <rect x="110" y="200" width="90" height="80" fill="#4a72c4" rx="3" />

            <circle cx="260" cy="70" r="22" fill="none" stroke="#333" strokeWidth="1.5" />
            <line x1="260" y1="70" x2="260" y2="55" stroke="#333" strokeWidth="1.5" />
            <line x1="260" y1="70" x2="272" y2="70" stroke="#333" strokeWidth="1.5" />

            <path d="M100 100 Q115 90, 130 100 Q145 110, 160 100" fill="none" stroke="#7a9df0" strokeWidth="1.5" />
            <path d="M60 140 Q75 130, 90 140 Q105 150, 120 140" fill="none" stroke="#7a9df0" strokeWidth="1.5" />

            <circle cx="80" cy="70" r="5" fill="none" stroke="#7a9df0" strokeWidth="1.5" />

            <polygon points="200,230 260,230 240,260 180,260" fill="#2563eb" />
            <polygon points="200,228 260,228 240,232 180,232" fill="#1e40af" />

            <ellipse cx="180" cy="240" rx="30" ry="18" fill="#1f2937" />
            <rect x="160" y="200" width="40" height="45" fill="#1f2937" rx="6" />

            <path d="M170 250 L150 280" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
            <path d="M195 250 L215 280" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
            <path d="M145 280 L155 280" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
            <path d="M210 280 L220 280" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />

            <path d="M170 220 Q150 235, 160 250" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" fill="none" />

            <circle cx="185" cy="180" r="18" fill="#1f2937" />
            <circle cx="170" cy="160" r="8" fill="#1f2937" />
            <circle cx="185" cy="155" r="10" fill="#1f2937" />

            <circle cx="300" cy="200" r="4" fill="none" stroke="#7a9df0" strokeWidth="1.5" />
            <circle cx="320" cy="120" r="6" fill="none" stroke="#7a9df0" strokeWidth="1.5" />
          </svg>
        </div>

        {/* RIGHT: form */}
        <div className="login-right">
          <h1 className="login-title">Student Login</h1>
          <p className="login-subtitle">
            Hey, enter your details to sign in to your account
          </p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="login-input"
              placeholder="👤  Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />

            <input
              type="password"
              className="login-input"
              placeholder="🔒  Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

      <div className="login-hint">
  <strong>Demo credentials</strong>
  <br />
  Student: <code>student</code> / <code>student123</code>
  <br />
  Admin: <code>admin</code> / <code>admin123</code>
</div>

<div className="login-footer">
  Don't have an account?{' '}
  <button
    type="button"
    className="link-btn"
    onClick={onGoToSignUp}
  >
    Sign Up
  </button>
</div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;