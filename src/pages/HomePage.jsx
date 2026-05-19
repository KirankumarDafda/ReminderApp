import { useEffect, useState } from "react";
import { loadUserReminders } from "../reminder/db";

const WaIcon = () => (
  <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 3C8.82 3 3 8.82 3 16c0 2.34.64 4.63 1.86 6.63L3 29l6.53-1.83A13 13 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.85a10.84 10.84 0 0 1-5.54-1.52l-.4-.23-4.13 1.15 1.1-4-.26-.42A10.85 10.85 0 1 1 16 26.85zm5.95-8.1c-.33-.16-1.93-.95-2.23-1.06-.3-.1-.52-.16-.74.17s-.85 1.06-1.04 1.28c-.19.22-.38.25-.7.08-.33-.16-1.38-.51-2.63-1.62-.97-.87-1.63-1.94-1.82-2.27-.19-.33-.02-.5.14-.67.15-.14.33-.38.49-.57.16-.19.22-.33.33-.55.1-.22.05-.41-.03-.57-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56l-.63-.01c-.22 0-.57.08-.87.41-.3.33-1.13 1.1-1.13 2.69s1.16 3.12 1.32 3.33c.16.22 2.28 3.48 5.53 4.88.77.33 1.37.53 1.84.68.77.24 1.48.21 2.03.13.62-.09 1.93-.79 2.2-1.55.27-.76.27-1.41.19-1.55-.08-.14-.3-.22-.63-.38z"/>
  </svg>
);

// ── Upcoming logic ────────────────────────────────────────────────────────────
const daysUntilNext = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next - today) / 86_400_000);
};

const getUpcomingEvents = (reminders, windowDays = 30) => {
  const events = [];
  reminders.forEach((r) => {
    const push = (type, date, message) => {
      const days = daysUntilNext(date);
      if (days !== null && days <= windowDays)
        events.push({ name: r.name, phone: r.phone, type, date, message, days });
    };
    push("Birthday 🎂", r.birthday, r.birthdayMessage);
    push("Anniversary 💍", r.anniversary, r.anniversaryMessage);
    (r.specialEvents || []).forEach((ev) =>
      push(`${ev.label || "Event"} ✨`, ev.date, ev.customMessage)
    );
  });
  return events.sort((a, b) => a.days - b.days);
};

const waLink = (phone, msg) =>
  `https://wa.me/91${phone}?text=${encodeURIComponent(msg || "")}`;

// ── Developer info ────────────────────────────────────────────────────────────
const ABOUT = {
  name: "Kirankumar Dafda",
  email: "********@gmail.com",
  role: "Software Engineer",
  version: "0.0.1",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function HomePage({ user, navigate, onLogout }) {
  const [reminders, setReminders] = useState([]);
  const [showAbout, setShowAbout] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadUserReminders(user.userId)
      .then(setReminders)
      .catch((err) => console.error("Failed to load reminders:", err))
      .finally(() => setLoading(false));
  }, [user.userId]); // eslint-disable-line

  const upcoming = getUpcomingEvents(reminders).slice(0, 3);

  return (
    <div className="app-container">
      <div className="shape shape1"></div>
      <div className="shape shape2"></div>

      {/* About modal */}
      {showAbout && (
        <div className="about-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-modal" onClick={(e) => e.stopPropagation()}>
            <button className="about-close" onClick={() => setShowAbout(false)}>✕</button>
            <h2 className="about-title">About</h2>
            <div className="about-avatar">👨‍💻</div>
            <div className="about-fields">
              <div className="about-row"><span className="about-label">Name</span><span className="about-val">{ABOUT.name}</span></div>
              <div className="about-row"><span className="about-label">Email</span><span className="about-val">{ABOUT.email}</span></div>
              <div className="about-row"><span className="about-label">Role</span><span className="about-val">{ABOUT.role}</span></div>
              <div className="about-row"><span className="about-label">Version</span><span className="about-val">{ABOUT.version}</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="main-card wide-card">
        {/* Navbar */}
        <nav className="navbar">
          <span className="nav-brand">🎉 Smart Reminder</span>
          <div className="nav-actions">
            <button className="nav-btn" onClick={() => navigate("reminders")}>
              📋 All Reminders
            </button>
            <button className="nav-btn" onClick={() => navigate("profile")}>
              👤 Profile
            </button>
            <button className="nav-btn nav-logout" onClick={onLogout}>
              Logout
            </button>
            <button className="about-icon-btn" title="About" onClick={() => setShowAbout(true)}>
              ❤️
            </button>
          </div>
        </nav>

        {/* Hero */}
        <div className="hero-section">
          <p className="hero-greeting">
            Hello, <strong>{user.username}</strong> 👋
          </p>
          <h2 className="hero-message">
            Never miss a moment to remind your loved ones
            <br />
            how much they matter ❤️
          </h2>
          <button
            className="primary-btn"
            onClick={() => navigate("addReminder")}
          >
            ➕ Add New Reminder
          </button>
        </div>

        {/* Upcoming */}
        <div className="section-header">
          <h3>📅 Upcoming — next 30 days</h3>
          {!loading && <span className="section-count">Nearest {upcoming.length}</span>}
        </div>

        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
            <span className="spinner-label">Loading reminders…</span>
          </div>
        ) : upcoming.length === 0 ? (
          <p className="empty">No upcoming events in the next 30 days. 🎈</p>
        ) : (
          <div className="upcoming-list">
            {upcoming.map((ev, i) => (
              <div key={i} className="upcoming-card">
                <div className="upcoming-info">
                  <span className="upcoming-name">{ev.name}</span>
                  <span className="upcoming-type">{ev.type}</span>
                  <span className="upcoming-date">{ev.date}</span>
                </div>

                {ev.message && (
                  <div className="upcoming-center">
                    &ldquo;{ev.message}&rdquo;
                  </div>
                )}
                <div className="upcoming-right">
                  <span
                    className={`days-badge${ev.days === 0 ? " today" : ev.days <= 7 ? " soon" : ""}`}
                  >
                    {ev.days === 0 ? "Today 🎊" : `${ev.days}d`}
                  </span>
                  {ev.phone && (
                    <a
                      href={waLink(ev.phone, ev.message)}
                      target="_blank"
                      rel="noreferrer"
                      className="whatsapp"
                      title="Send Wish on WhatsApp"
                    >
                      <WaIcon /> Wish
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
