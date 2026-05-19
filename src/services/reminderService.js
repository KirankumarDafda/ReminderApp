/**
 * Reminder CRUD — Firestore "reminders" collection.
 *
 * Each document: { userId, name, phone, birthday, birthdayMessage,
 *                  anniversary, anniversaryMessage, specialEvents, createdAt }
 * The Firestore document id is used as the reminder's id throughout the UI.
 */

import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

// ── Fetch all reminders for a user ────────────────────────────────────────────
// NOTE: We intentionally avoid orderBy() here because combining where() +
// orderBy() on different fields requires a Firestore composite index.
// Sorting client-side is simpler and fast enough for a personal-scale app.
export const loadUserReminders = async (userId) => {
  const q = query(
    collection(db, "reminders"),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort ascending by createdAt (Firestore Timestamp or JS Date both have .toMillis / valueOf)
  return docs.sort((a, b) => {
    const ms = (v) =>
      v?.toMillis?.() ?? (v instanceof Date ? v.getTime() : 0);
    return ms(a.createdAt) - ms(b.createdAt);
  });
};

// ── Create a new reminder ─────────────────────────────────────────────────────
export const createUserReminder = async (userId, reminderData) => {
  const docRef = await addDoc(collection(db, "reminders"), {
    userId,
    ...reminderData,
    createdAt: new Date(),
  });
  return { id: docRef.id, userId, ...reminderData };
};

// ── Update an existing reminder ───────────────────────────────────────────────
export const updateUserReminder = async (id, reminderData) => {
  await updateDoc(doc(db, "reminders", id), reminderData);
  return { id, ...reminderData };
};

// ── Delete a reminder ─────────────────────────────────────────────────────────
export const deleteUserReminder = async (id) => {
  await deleteDoc(doc(db, "reminders", id));
  return { success: true };
};