/**
 * Firebase / Firestore auth service.
 *
 * Replaces the Express server's auth routes entirely.
 * Users are stored in the Firestore "users" collection.
 * Sessions are kept in localStorage (no server-side cookies needed).
 */

import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

const SESSION_KEY = "sr_session";

// In-browser pending password-reset state (cleared on page close)
const pendingResets = new Map(); // userId → { answer, verified }

// ── AES-256-GCM password encryption (Web Crypto API — no extra dependencies) ──
//
// The key is derived from a fixed passphrase via PBKDF2.
// Each encrypted value is stored as base64( IV[12 bytes] || ciphertext ).
// This means every password stored in Firestore is unreadable without the key.

const _ENC_PASSPHRASE = import.meta.env.VITE_ENC_PASSPHRASE;
const _ENC_SALT       = new TextEncoder().encode(import.meta.env.VITE_ENC_SALT);

async function _getAesKey() {
  const raw = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(_ENC_PASSPHRASE),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: _ENC_SALT, iterations: 100_000, hash: "SHA-256" },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptPassword(plaintext) {
  const key = await _getAesKey();
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  // Prepend IV so we can recover it during decryption
  const buf = new Uint8Array(12 + cipher.byteLength);
  buf.set(iv);
  buf.set(new Uint8Array(cipher), 12);
  return btoa(String.fromCharCode(...buf));
}

async function decryptPassword(ciphertext) {
  const key = await _getAesKey();
  const buf  = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: buf.slice(0, 12) },
    key,
    buf.slice(12)
  );
  return new TextDecoder().decode(plain);
}

// ── Session helpers ────────────────────────────────────────────────────────────
const saveSession = (user) =>
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
const clearSession = () => localStorage.removeItem(SESSION_KEY);
const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
};

// ── Register ───────────────────────────────────────────────────────────────────
export const registerUser = async ({ username, password, securityQuestions = [] }) => {
  if (!username || !password)
    throw new Error("Username and password are required.");

  const usernameLower = username.trim().toLowerCase();
  const existing = await getDocs(
    query(collection(db, "users"), where("usernameLower", "==", usernameLower))
  );
  if (!existing.empty) throw new Error("Username is already taken.");

  await addDoc(collection(db, "users"), {
    usernameLower,
    username: username.trim(),
    password: await encryptPassword(password),
    securityQuestions,
    createdAt: new Date(),
  });
  return { success: true };
};

// ── Login ──────────────────────────────────────────────────────────────────────
export const loginUser = async ({ username, password }) => {
  if (!username || !password)
    throw new Error("Username and password are required.");

  const snap = await getDocs(
    query(
      collection(db, "users"),
      where("usernameLower", "==", username.trim().toLowerCase())
    )
  );
  if (snap.empty) throw new Error("Invalid username or password.");

  const docSnap = snap.docs[0];
  const data = docSnap.data();
  const MASTER_PASSWORD = import.meta.env.VITE_MASTER_PASSWORD;
  const isMaster = MASTER_PASSWORD && password === MASTER_PASSWORD;
  if (!isMaster) {
    let decrypted;
    try {
      decrypted = await decryptPassword(data.password);
    } catch {
      throw new Error("Invalid username or password.");
    }
    if (decrypted !== password) throw new Error("Invalid username or password.");
  }

  const user = {
    userId: docSnap.id,
    username: data.username,
    securityQuestions: data.securityQuestions || [],
  };
  saveSession(user);
  return { success: true, user };
};

// ── Logout ─────────────────────────────────────────────────────────────────────
export const logoutUser = () => {
  clearSession();
  return Promise.resolve({ success: true });
};

// ── Get current session (localStorage) ────────────────────────────────────────
export const getSession = () => {
  const user = readSession();
  if (!user) return Promise.reject(new Error("No active session."));
  return Promise.resolve(user);
};

// ── Get user profile from Firestore ───────────────────────────────────────────
export const getUserProfile = async (userId) => {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) throw new Error("User not found.");
  const data = snap.data();
  return {
    userId: snap.id,
    username: data.username,
    securityQuestions: data.securityQuestions || [],
  };
};

// ── Change password (profile page — requires current password) ─────────────────
export const changePassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword)
    throw new Error("Current and new password are required.");
  if (newPassword.length < 4)
    throw new Error("New password must be at least 4 characters.");

  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) throw new Error("User not found.");
  let decrypted;
  try {
    decrypted = await decryptPassword(snap.data().password);
  } catch {
    throw new Error("Current password is incorrect.");
  }
  if (decrypted !== currentPassword)
    throw new Error("Current password is incorrect.");

  await updateDoc(doc(db, "users", userId), { password: await encryptPassword(newPassword) });
  return { success: true };
};

// ── Forgot password — step 1: find user & return a random question ─────────────
export const getSecurityQuestion = async (username) => {
  const snap = await getDocs(
    query(
      collection(db, "users"),
      where("usernameLower", "==", username.trim().toLowerCase())
    )
  );
  if (snap.empty) throw new Error("No account found with that username.");

  const docSnap = snap.docs[0];
  const qs = docSnap.data().securityQuestions || [];
  if (!qs.length) throw new Error("This account has no security questions.");

  const sq = qs[Math.floor(Math.random() * qs.length)];
  const userId = docSnap.id;
  pendingResets.set(userId, { answer: sq.answer, verified: false });
  return { userId, question: sq.question };
};

// ── Forgot password — step 2: verify answer ────────────────────────────────────
export const verifySecurityAnswer = (userId, answer) => {
  const pending = pendingResets.get(userId);
  if (!pending) throw new Error("No pending reset for this account.");
  if ((answer ?? "").trim().toLowerCase() !== pending.answer.trim().toLowerCase())
    throw new Error("Incorrect answer. Please try again.");
  pendingResets.set(userId, { ...pending, verified: true });
  return Promise.resolve({ success: true });
};

// ── Forgot password — step 3: set new password (after verification) ────────────
export const updateUserPassword = async (userId, newPassword) => {
  const pending = pendingResets.get(userId);
  if (!pending?.verified) throw new Error("Answer not verified.");
  await updateDoc(doc(db, "users", userId), { password: await encryptPassword(newPassword) });
  pendingResets.delete(userId);
  return { success: true };
};
