import { useState } from "react";
import {
  getSecurityQuestion,
  verifySecurityAnswer,
  updateUserPassword,
} from "../auth/authDb";

export default function ForgotPasswordPage({ navigate }) {
  const [step, setStep] = useState(1); // 1 → 2 → 3
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1 – find account, server picks a random question
  const handleFindUser = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await getSecurityQuestion(username);
      setUserId(data.userId);
      setQuestion(data.question);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 – send answer to server for verification
  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifySecurityAnswer(userId, answer);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 – reset password (server already verified the answer)
  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await updateUserPassword(userId, newPassword);
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
        <h1 className="auth-title">🔑 Forgot Password</h1>

        {/* Step progress indicator */}
        <div className="step-indicator">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`step-dot ${step >= s ? "active" : ""}`} />
          ))}
        </div>

        {success ? (
          <p className="success-msg">✅ Password reset! Redirecting…</p>
        ) : step === 1 ? (
          <form onSubmit={handleFindUser} className="form">
            <p className="step-hint">Enter your username to find your account.</p>
            <input
              placeholder="Username"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
            />
            {error && <p className="error-msg">⚠️ {error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Searching…" : "Find Account"}
            </button>
          </form>
        ) : step === 2 ? (
          <form onSubmit={handleVerify} className="form">
            <p className="step-hint">Answer your security question.</p>
            <p className="security-question-text">❓ {question}</p>
            <input
              placeholder="Your answer"
              required
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                setError("");
              }}
            />
            {error && <p className="error-msg">⚠️ {error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Verifying…" : "Verify Answer"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="form">
            <p className="step-hint">Choose a new password.</p>
            <input
              type="password"
              placeholder="New Password"
              required
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError("");
              }}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <p className="error-msg">⚠️ {error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Resetting…" : "Reset Password"}
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
