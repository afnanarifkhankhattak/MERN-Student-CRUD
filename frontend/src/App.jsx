// frontend/src/App.jsx

import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import StudentPage from './components/StudentPage';
import AdminPage from './components/AdminPage';
import { getToken, getStoredUser, clearToken, clearStoredUser } from './api';

// Apply the saved theme on app mount
useEffect(() => {
  const savedTheme = localStorage.getItem('settings_theme') || 'light';
  document.body.classList.toggle('theme-dark', savedTheme === 'dark');
}, []);

function App() {
  // Read auth from localStorage on first render
  const [user, setUser] = useState(() => {
    return getToken() ? getStoredUser() : null;
  });

  // Which auth screen to show when not logged in
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    clearToken();
    clearStoredUser();
    setUser(null);
    setAuthView('login');
  };

  // ── Route selection ─────────────────────────────
  if (!user) {
    if (authView === 'signup') {
      return <SignUpPage onGoToLogin={() => setAuthView('login')} />;
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onGoToSignUp={() => setAuthView('signup')}
      />
    );
  }

  if (user.role === 'student') {
    return <StudentPage username={user.username} onLogout={handleLogout} />;
  }

  if (user.role === 'admin') {
    return <AdminPage username={user.username} onLogout={handleLogout} />;
  }

  // Fallback
  return (
    <LoginPage
      onLoginSuccess={handleLoginSuccess}
      onGoToSignUp={() => setAuthView('signup')}
    />
  );
}

export default App;