import { useState } from "react";
import { createUserReminder, updateUserReminder } from "../reminder/db";

const EMPTY_FORM = {
  name: "",
  phone: "",
  birthday: "",
  birthdayMessage: "",
  anniversary: "",
  anniversaryMessage: "",
  specialEvents: [],
};

const EMPTY_EVENT = { label: "", date: "", customMessage: "" };

const toForm = (r) =>
  r
    ? {
        name: r.name || "",
        phone: r.phone || "",
        birthday: r.birthday || "",
        birthdayMessage: r.birthdayMessage || "",
        anniversary: r.anniversary || "",
        anniversaryMessage: r.anniversaryMessage || "",
        specialEvents: r.specialEvents || [],
      }
    : EMPTY_FORM;

export default function AddEditReminderPage({ user, navigate, reminder }) {
  const isEditing = !!reminder;
  const [form, setForm] = useState(() => toForm(reminder));
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addEvent = () =>
    setForm((f) => ({
      ...f,
      specialEvents: [...f.specialEvents, { ...EMPTY_EVENT }],
    }));

  const updateEvent = (i, key, val) =>
    setForm((f) => ({
      ...f,
      specialEvents: f.specialEvents.map((ev, idx) =>
        idx === i ? { ...ev, [key]: val } : ev
      ),
    }));

  const removeEvent = (i) =>
    setForm((f) => ({
      ...f,
      specialEvents: f.specialEvents.filter((_, idx) => idx !== i),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError("");
    setLoading(true);
    try {
      if (isEditing) {
        await updateUserReminder(reminder.id, form);
      } else {
        await createUserReminder(user.userId, form);
      }
      navigate("reminders");
    } catch (err) {
      console.error("Save failed:", err);
      setSaveError(
        err?.code === "permission-denied"
          ? "⛔ Access denied — check your Firestore security rules."
          : `Could not save reminder: ${err?.message ?? err}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="shape shape1"></div>
      <div className="shape shape2"></div>

      <div className="main-card">
        <nav className="navbar">
          <button className="nav-btn" onClick={() => navigate("reminders")}>
            ← Back
          </button>
          <span className="nav-brand">
            {isEditing ? "✏️ Edit Reminder" : "➕ Add Reminder"}
          </span>
        </nav>

        <form onSubmit={handleSubmit} className="form">
          <input
            placeholder="Full Name"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
          <input
            placeholder="Mobile Number"
            required
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />

          <label>🎂 Birthday</label>
          <input
            type="date"
            value={form.birthday}
            onChange={(e) => set("birthday", e.target.value)}
          />
          <textarea
            placeholder="Birthday Message…"
            value={form.birthdayMessage}
            onChange={(e) => set("birthdayMessage", e.target.value)}
          />

          <label>💍 Anniversary</label>
          <input
            type="date"
            value={form.anniversary}
            onChange={(e) => set("anniversary", e.target.value)}
          />
          <textarea
            placeholder="Anniversary Message…"
            value={form.anniversaryMessage}
            onChange={(e) => set("anniversaryMessage", e.target.value)}
          />

          <label>✨ Other Special Dates</label>
          {form.specialEvents.map((ev, i) => (
            <div key={i} className="special-event-row">
              <input
                placeholder="Label (e.g. Graduation)"
                value={ev.label}
                onChange={(e) => updateEvent(i, "label", e.target.value)}
              />
              <input
                type="date"
                value={ev.date}
                onChange={(e) => updateEvent(i, "date", e.target.value)}
              />
              <textarea
                placeholder="Custom Message…"
                value={ev.customMessage}
                onChange={(e) => updateEvent(i, "customMessage", e.target.value)}
              />
              <button
                type="button"
                className="remove-event-btn"
                onClick={() => removeEvent(i)}
              >
                ➖ Remove Date
              </button>
            </div>
          ))}
          <button type="button" className="add-event-btn" onClick={addEvent}>
            ➕ Add Special Date
          </button>

          {saveError && <p className="error-msg">⚠️ {saveError}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Saving…" : isEditing ? "💾 Save Changes" : "Add Reminder"}
          </button>
        </form>
      </div>
    </div>
  );
}
