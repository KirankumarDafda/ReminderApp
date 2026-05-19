import { useState, useEffect } from "react";
import { getSession, logoutUser } from "./auth/authDb";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import RemindersPage from "./pages/RemindersPage";
import AddEditReminderPage from "./pages/AddEditReminderPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  const [page, setPage] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [editingReminder, setEditingReminder] = useState(null);

  // Restore session on first load — getSession() is now async (API call)
  useEffect(() => {
    getSession()
      .then((user) => {
        setCurrentUser(user);
        setPage("home");
      })
      .catch(() => {
        /* No valid session — stay on login page */
      });
  }, []);

  const navigate = (to, params = {}) => {
    if (params.reminder !== undefined) setEditingReminder(params.reminder);
    setPage(to);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setPage("home");
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setPage("login");
  };

  const authProps = { user: currentUser, navigate, onLogout: handleLogout };

  switch (page) {
    case "register":
      return <RegisterPage navigate={navigate} />;
    case "forgotPassword":
      return <ForgotPasswordPage navigate={navigate} />;
    case "home":
      return <HomePage {...authProps} />;
    case "reminders":
      return <RemindersPage {...authProps} />;
    case "addReminder":
      return <AddEditReminderPage {...authProps} reminder={null} />;
    case "editReminder":
      return <AddEditReminderPage {...authProps} reminder={editingReminder} />;
    case "profile":
      return <ProfilePage {...authProps} />;
    default:
      return <LoginPage onLogin={handleLogin} navigate={navigate} />;
  }
}