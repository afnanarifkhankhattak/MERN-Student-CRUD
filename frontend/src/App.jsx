// frontend/src/App.jsx

import { useState } from 'react';
import LoginPage from './components/LoginPage';
import StudentPage from './components/StudentPage';
import AdminPage from './components/AdminPage';
import { getToken, getStoredUser, clearToken, clearStoredUser } from './api';

function App() {
  // Read auth from localStorage on first render
  const [user, setUser] = useState(() => {
    // Only trust the user object if we ALSO have a token
    return getToken() ? getStoredUser() : null;
  });

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    clearToken();
    clearStoredUser();
    setUser(null);
  };

  // ── Route selection ─────────────────────────────
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (user.role === 'student') {
    return <StudentPage username={user.username} onLogout={handleLogout} />;
  }

  if (user.role === 'admin') {
    return <AdminPage username={user.username} onLogout={handleLogout} />;
  }

  return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}

export default App;