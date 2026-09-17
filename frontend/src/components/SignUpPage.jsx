// frontend/src/components/SignUpPage.jsx

import { useState } from 'react';
import './SignUpPage.css';
import { AUTH_URL } from '../api';

function SignUpPage({ onGoToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // ── Basic client-side validation ────────────
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting to login...');

      // Wait 1.5 seconds, then send them to login
      setTimeout(() => {
        onGoToLogin();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* LEFT: illustration (reuse the same svg) */}
        <div className="login-left">
          <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
            <line x1="20" y1="280" x2="380" y2="280" stroke="#000" strokeWidth="1.5" />
            <rect x="40" y="180" width="60" height="100" fill="#7a9df0" rx="3" />
            <circle cx="55" cy="200" r="3" fill="#fff" />
            <circle cx="80" cy="200" r="3" fill="#fff" />
            <circle cx="55" cy="220" r="3" fill="#fff" />
            <circle cx="80" cy="220" r="3" fill="#fff" />
            <rect x="110" y="200" width="90" height="80" fill="#4a72c4" rx="3" />
            <circle cx="260" cy="70" r="22" fill="none" stroke="#333" strokeWidth="1.5" />
            <line x1="260" y1="70" x2="260" y2="55" stroke="#333" strokeWidth="1.5" />
            <line x1="260" y1="70" x2="272" y2="70" stroke="#333" strokeWidth="1.5" />
            <circle cx="80" cy="70" r="5" fill="none" stroke="#7a9df0" strokeWidth="1.5" />
            <polygon points="200,230 260,230 240,260 180,260" fill="#2563eb" />
            <ellipse cx="180" cy="240" rx="30" ry="18" fill="#1f2937" />
            <rect x="160" y="200" width="40" height="45" fill="#1f2937" rx="6" />
            <circle cx="185" cy="180" r="18" fill="#1f2937" />
            <circle cx="170" cy="160" r="8" fill="#1f2937" />
            <circle cx="185" cy="155" r="10" fill="#1f2937" />
            <circle cx="300" cy="200" r="4" fill="none" stroke="#7a9df0" strokeWidth="1.5" />
            <circle cx="320" cy="120" r="6" fill="none" stroke="#7a9df0" strokeWidth="1.5" />
          </svg>
        </div>

        {/* RIGHT: form */}
        <div className="login-right">
          <h1 className="login-title">Create Account</h1>
          <p className="login-subtitle">
            Fill in your details to sign up
          </p>

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              className="login-input"
              placeholder=" Choose a username"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              disabled={loading}
            />

            <input
              type="password"
              name="password"
              className="login-input"
              placeholder="  Choose a password (min 6 chars)"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              disabled={loading}
            />

            <input
              type="password"
              name="confirmPassword"
              className="login-input"
              placeholder="  Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              disabled={loading}
            />

            {/* Role picker */}
            <div className="role-toggle">
              <button
                type="button"
                className={`role-btn ${formData.role === 'student' ? 'active' : ''}`}
                onClick={() => setFormData((p) => ({ ...p, role: 'student' }))}
                disabled={loading}
              >
                 Student
              </button>
              <button
                type="button"
                className={`role-btn ${formData.role === 'admin' ? 'active' : ''}`}
                onClick={() => setFormData((p) => ({ ...p, role: 'admin' }))}
                disabled={loading}
              >
                 Admin
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="login-footer">
            Already have an account?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={onGoToLogin}
              disabled={loading}
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;