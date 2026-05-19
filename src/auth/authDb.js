/**
 * Auth helpers — thin wrappers around the Firestore auth service.
 *
 * All user data lives in Firebase Firestore.
 * Sessions are persisted in localStorage (no server or cookies needed).
 */
export {
  registerUser,
  loginUser,
  logoutUser,
  getSession,
  getSecurityQuestion,
  verifySecurityAnswer,
  updateUserPassword,
} from "../services/authService";
