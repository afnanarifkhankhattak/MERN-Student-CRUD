// frontend/src/App.jsx

import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import StudentPage from './components/StudentPage';
import AdminPage from './components/AdminPage';

function App() {
  // Read saved login from localStorage on first render
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Save auth to localStorage whenever it changes
  useEffect(() => {
    if (auth) {
      localStorage.setItem('auth', JSON.stringify(auth));
    } else {
      localStorage.removeItem('auth');
    }
  }, [auth]);

  const handleLoginSuccess = ({ role, username }) => {
    setAuth({ role, username });
  };

  const handleLogout = () => {
    setAuth(null);
  };

  // ── Route selection ─────────────────────────────
  // No auth → login page
  if (!auth) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Student → student page
  if (auth.role === 'student') {
    return <StudentPage username={auth.username} onLogout={handleLogout} />;
  }

  // Admin → admin page
  if (auth.role === 'admin') {
    return <AdminPage username={auth.username} onLogout={handleLogout} />;
  }

  // Fallback (should never happen)
  return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}

export default App;