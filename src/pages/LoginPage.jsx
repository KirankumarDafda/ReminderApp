import { useState } from "react";
import { loginUser } from "../auth/authDb";

export default function LoginPage({ onLogin, navigate }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginUser(form);
      onLogin(result.user);
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
        <div className="auth-logo">🎉</div>
        <h1 className="auth-title">Smart Reminder</h1>
        <p className="auth-subtitle">Welcome back! Sign in to continue.</p>

        <form onSubmit={handleSubmit} className="form">
          <input
            placeholder="Username"
            required
            autoComplete="username"
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({ ...f, username: e.target.value }))
            }
          />
          <input
            type="password"
            placeholder="Password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
          />

          {error && <p className="error-msg">⚠️ {error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        <div className="auth-links">
          <button
            className="link-btn"
            onClick={() => navigate("forgotPassword")}
          >
            Forgot Password?
          </button>
          <button className="link-btn" onClick={() => navigate("register")}>
            Create Account →
          </button>
        </div>
      </div>
    </div>
  );
}
