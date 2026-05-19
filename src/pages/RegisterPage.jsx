import { useState } from "react";
import { registerUser } from "../auth/authDb";

export const SECURITY_QUESTIONS = [
  "What is your favorite color?",
  "What is your pet's name?",
  "What is your birth city?",
  "What is your mother's maiden name?",
  "What was your first school name?",
  "What is your favorite movie?",
];

const INIT_QUESTIONS = [
  { question: SECURITY_QUESTIONS[0], answer: "" },
  { question: SECURITY_QUESTIONS[1], answer: "" },
];

export default function RegisterPage({ navigate }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [securityQs, setSecurityQs] = useState(INIT_QUESTIONS);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateQ = (index, field, value) =>
    setSecurityQs((qs) =>
      qs.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (securityQs.some((q) => !q.answer.trim())) {
      setError("Please answer all security questions.");
      return;
    }
    setLoading(true);
    try {
      await registerUser({
        username: form.username,
        password: form.password,
        securityQuestions: securityQs,
      });
      setSuccess(true);
      setTimeout(() => navigate("login"), 1600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="shape shape1"></div>
      <div className="shape shape2"></div>

      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Set up your Smart Reminder profile.</p>

        {success ? (
          <p className="success-msg">✅ Account created! Redirecting to login…</p>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            <input
              placeholder="Username"
              required
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
            />
            <input
              type="password"
              placeholder="Confirm Password"
              required
              value={form.confirmPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, confirmPassword: e.target.value }))
              }
            />

            <label>🔐 Security Questions</label>
            {securityQs.map((sq, i) => (
              <div key={i} className="security-q-row">
                <select
                  value={sq.question}
                  onChange={(e) => updateQ(i, "question", e.target.value)}
                >
                  {SECURITY_QUESTIONS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Your answer"
                  required
                  value={sq.answer}
                  onChange={(e) => updateQ(i, "answer", e.target.value)}
                />
              </div>
            ))}

            {error && <p className="error-msg">⚠️ {error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Register"}
            </button>
          </form>
        )}

        <div className="auth-links">
          <button className="link-btn" onClick={() => navigate("login")}>
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
