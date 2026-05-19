/**
 * Reminder data helpers — thin wrappers around the Firestore reminder service.
 *
 * All reminder data lives in the Firebase "reminders" Firestore collection.
 * The userId is passed explicitly (read from the session stored in localStorage).
 */
export {
  loadUserReminders,
  createUserReminder,
  updateUserReminder,
  deleteUserReminder,
} from "../services/reminderService";
