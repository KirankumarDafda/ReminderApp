import { useEffect, useState } from "react";
import { getUserProfile, changePassword } from "../services/authService";

export default function ProfilePage({ user, navigate, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");

  // Change-password form state
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleTogglePasswordEdit = () => {
    // Reset all form state whenever the panel is toggled
    setIsEditingPassword((open) => !open);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwdError("");
    setPwdSuccess("");
  };

  useEffect(() => {
    getUserProfile(user.userId)
      .then(setProfile)
      .catch(() => setLoadError("Could not load profile."));
  }, [user.userId]); // eslint-disable-line

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");
    if (newPassword !== confirmPassword)
      return setPwdError("New passwords do not match.");
    setSaving(true);
    try {
      await changePassword(user.userId, currentPassword, newPassword);
      setPwdSuccess("Password changed successfully! ✅");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Collapse the form after a short delay so the user sees the success message
      setTimeout(() => setIsEditingPassword(false), 1500);
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setSaving(false);
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
          <span className="nav-brand">👤 Profile</span>
          <button className="nav-btn nav-logout" onClick={onLogout}>
            Logout
          </button>
        </nav>

        {loadError && <p className="error-msg">⚠️ {loadError}</p>}

        {profile && (
          <>
            {/* Account info */}
            <div className="profile-section">
              <h3 className="profile-section-title">Account Info</h3>
              <div className="profile-field">
                <span className="profile-label">Username</span>
                <span className="profile-value">{profile.username}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">User ID</span>
                <span className="profile-value profile-muted">{profile.userId}</span>
              </div>
            </div>

            {/* Security Questions */}
            <div className="profile-section">
              <h3 className="profile-section-title">Security Questions</h3>
              {(profile.securityQuestions || []).length === 0 ? (
                <p className="profile-muted">No security questions set.</p>
              ) : (
                <div className="profile-qa-list">
                  {profile.securityQuestions.map((sq, i) => (
                    <div key={i} className="profile-qa-item">
                      <span className="profile-question">Q: {sq.question}</span>
                      <span className="profile-answer">A: {sq.answer}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="profile-section">
              <div className="profile-section-header" style={isEditingPassword
                    ? { borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }
                    : { borderBottom: 'none', padding: 0, margin: 0 }}>
                <h3 className="profile-section-title">Change Password</h3>
                <button
                  type="button"
                  className="edit-icon-btn"
                  title={isEditingPassword ? "Cancel" : "Edit password"}
                  onClick={handleTogglePasswordEdit}
                >
                  {isEditingPassword ? "❌" : "✏️"}
                </button>
              </div>

              {isEditingPassword && (
                <form className="profile-pwd-form form" onSubmit={handleChangePassword}>
                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {pwdError && <p className="error-msg">⚠️ {pwdError}</p>}
                  {pwdSuccess && <p className="success-msg">{pwdSuccess}</p>}
                  <button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "🔒 Update Password"}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
