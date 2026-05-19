import { useEffect, useState } from "react";
import { loadUserReminders, deleteUserReminder } from "../reminder/db";

const WaIcon = () => (
  <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 3C8.82 3 3 8.82 3 16c0 2.34.64 4.63 1.86 6.63L3 29l6.53-1.83A13 13 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.85a10.84 10.84 0 0 1-5.54-1.52l-.4-.23-4.13 1.15 1.1-4-.26-.42A10.85 10.85 0 1 1 16 26.85zm5.95-8.1c-.33-.16-1.93-.95-2.23-1.06-.3-.1-.52-.16-.74.17s-.85 1.06-1.04 1.28c-.19.22-.38.25-.7.08-.33-.16-1.38-.51-2.63-1.62-.97-.87-1.63-1.94-1.82-2.27-.19-.33-.02-.5.14-.67.15-.14.33-.38.49-.57.16-.19.22-.33.33-.55.1-.22.05-.41-.03-.57-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56l-.63-.01c-.22 0-.57.08-.87.41-.3.33-1.13 1.1-1.13 2.69s1.16 3.12 1.32 3.33c.16.22 2.28 3.48 5.53 4.88.77.33 1.37.53 1.84.68.77.24 1.48.21 2.03.13.62-.09 1.93-.79 2.2-1.55.27-.76.27-1.41.19-1.55-.08-.14-.3-.22-.63-.38z"/>
  </svg>
);

const waLink = (phone, msg) =>
  `https://wa.me/91${phone}?text=${encodeURIComponent(msg || "")}`;

export default function RemindersPage({ user, navigate, onLogout }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError]   = useState("");
  const [deleteError, setDeleteError] = useState("");

  const reload = () => {
    setLoadError("");
    setLoading(true);
    loadUserReminders(user.userId)
      .then(setReminders)
      .catch((err) => {
        console.error("Failed to load reminders:", err);
        setLoadError(
          err?.code === "permission-denied"
            ? "⛔ Access denied — check your Firestore security rules."
            : err?.code === "failed-precondition"
            ? "⚙️ Firestore index missing — see browser console for the index-creation link."
            : `Failed to load reminders: ${err?.message ?? err}`
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [user.userId]); // eslint-disable-line

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this reminder?")) return;
    setDeleteError("");
    try {
      await deleteUserReminder(id);
      reload();
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleteError(`Delete failed: ${err?.message ?? err}`);
    }
  };

  return (
    <div className="app-container">
      <div className="shape shape1"></div>
      <div className="shape shape2"></div>

      <div className="main-card wide-card">
        {/* Navbar */}
        <nav className="navbar">
          <button className="nav-btn" onClick={() => navigate("home")}>
            🏠 Home
          </button>
          <span className="nav-brand">📋 All Reminders</span>
          <div className="nav-actions">
            <button className="nav-btn" onClick={() => navigate("profile")}>
              👤 Profile
            </button>
            <button className="nav-btn nav-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </nav>

        {/* Error banners */}
        {loadError   && <p className="error-msg">⚠️ {loadError}</p>}
        {deleteError && <p className="error-msg">⚠️ {deleteError}</p>}

        {/* Page header */}
        <div className="page-header">
          <h2>
            Your Reminders{" "}
            {!loading && <span className="section-count">{reminders.length}</span>}
          </h2>
          <button
            className="primary-btn small"
            onClick={() => navigate("addReminder")}
          >
            ➕ Add New
          </button>
        </div>

        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
            <span className="spinner-label">Loading reminders…</span>
          </div>
        ) : reminders.length === 0 ? (
          <p className="empty">No reminders yet — add one! 🎈</p>
        ) : (
          <div className="reminder-list">
            {reminders.map((r) => (
              <div key={r.id} className="reminder-card">
                <div className="card-info">
                  <h3 className="card-name">{r.name}</h3>
                  <p className="card-phone">📱 {r.phone}</p>

                  {r.birthday && (
                    <div className="event-row">
                      <span className="event-date">🎂 {r.birthday}</span>
                      {r.birthdayMessage && (
                        <span className="msg-preview">
                          &ldquo;{r.birthdayMessage}&rdquo;
                        </span>
                      )}
                      <a
                        href={waLink(r.phone, r.birthdayMessage)}
                        target="_blank"
                        rel="noreferrer"
                        className="whatsapp"
                        title="Birthday Wish"
                      >
                        <WaIcon /> Wish
                      </a>
                    </div>
                  )}

                  {r.anniversary && (
                    <div className="event-row">
                      <span className="event-date">💍 {r.anniversary}</span>
                      {r.anniversaryMessage && (
                        <span className="msg-preview">
                          &ldquo;{r.anniversaryMessage}&rdquo;
                        </span>
                      )}
                      <a
                        href={waLink(r.phone, r.anniversaryMessage)}
                        target="_blank"
                        rel="noreferrer"
                        className="whatsapp"
                        title="Anniversary Wish"
                      >
                        <WaIcon /> Wish
                      </a>
                    </div>
                  )}

                  {(r.specialEvents || []).map((ev, i) => (
                    <div key={i} className="event-row">
                      <span className="event-date">✨ {ev.label} — {ev.date}</span>
                      {ev.customMessage && (
                        <span className="msg-preview">
                          &ldquo;{ev.customMessage}&rdquo;
                        </span>
                      )}
                      <a
                        href={waLink(r.phone, ev.customMessage)}
                        target="_blank"
                        rel="noreferrer"
                        className="whatsapp"
                        title={`${ev.label || "Special"} Wish`}
                      >
                        <WaIcon /> Wish
                      </a>
                    </div>
                  ))}

                  <div className="card-actions">
                    <button
                      className="action-btn"
                      title="Edit"
                      onClick={() => navigate("editReminder", { reminder: r })}
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn"
                      title="Delete"
                      onClick={() => handleDelete(r.id)}
                    >
                      ❌
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
