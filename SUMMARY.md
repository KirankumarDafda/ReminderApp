# 🎉 Smart Reminder App — Project Summary

**Version:** 0.0.1  
**Developer:** Kirankumar Dafda (dafdakiran@gmail.com)  
**Role:** Software Engineer

---

## 📌 What It Does

Smart Reminder is a personal birthday & anniversary reminder web app. Users store
contacts with key dates (birthday, anniversary, custom events) and a WhatsApp
message template. The home screen surfaces events happening within the next 30 days
and provides a one-tap WhatsApp deep-link to send a wish directly.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 + custom CSS (`src/index.css`) |
| Database | Firebase Firestore (cloud, persistent) |
| Auth | Custom Firestore-based auth (no Firebase Auth SDK) |
| Encryption | AES-256-GCM via browser Web Crypto API (zero dependencies) |
| Session | `localStorage` key `sr_session` |
| Deployment | Vercel (static `dist/` folder) |

---

## 📁 Project Structure

```
src/
├── firebase.js              # Firebase init — exports db (Firestore)
├── App.jsx                  # Root router (page-state machine)
├── main.jsx                 # React entry point
├── index.css                # All custom styles
│
├── services/
│   ├── authService.js       # All auth logic (register/login/session/forgot-pw)
│   └── reminderService.js   # Firestore CRUD for reminders
│
├── auth/
│   └── authDb.js            # Re-exports from authService (thin pass-through)
│
├── reminder/
│   └── db.js                # Re-exports from reminderService (thin pass-through)
│
└── pages/
    ├── LoginPage.jsx
    ├── RegisterPage.jsx
    ├── ForgotPasswordPage.jsx
    ├── HomePage.jsx          # Dashboard + upcoming events (next 30 days)
    ├── RemindersPage.jsx     # Full reminder list with edit / delete
    ├── AddEditReminderPage.jsx
    └── ProfilePage.jsx       # Account info + change password (edit-pencil toggle)
```

---

## 🔥 Firestore Collections

### `users`
| Field | Type | Notes |
|---|---|---|
| `username` | string | Original-case display name |
| `usernameLower` | string | Lowercase — used for Firestore `where` queries |
| `password` | string | AES-256-GCM encrypted, stored as base64 |
| `securityQuestions` | array | `[{ question, answer }]` — used for forgot-password |
| `createdAt` | timestamp | |

### `reminders`
| Field | Type | Notes |
|---|---|---|
| `userId` | string | Firestore document ID of the owner |
| `name` | string | Contact full name |
| `phone` | string | Mobile number (WhatsApp link uses `wa.me/91{phone}`) |
| `birthday` | string | ISO date `YYYY-MM-DD` |
| `birthdayMessage` | string | Pre-filled WhatsApp message |
| `anniversary` | string | ISO date |
| `anniversaryMessage` | string | |
| `specialEvents` | array | `[{ label, date, customMessage }]` |
| `createdAt` | timestamp | Used for client-side ascending sort |

---

## 🔐 Security Architecture

### Password Encryption (AES-256-GCM)
- Key derived via **PBKDF2** (100,000 iterations, SHA-256) from `VITE_ENC_PASSPHRASE`
- Random 12-byte IV prepended to every ciphertext → same password never produces the same stored value
- Stored format: `base64( IV[12 bytes] || AES-GCM ciphertext )`
- Implemented entirely with the **browser Web Crypto API** — no third-party crypto library

### Session Management
- On login, `{ userId, username, securityQuestions }` is written to `localStorage` key `sr_session`
- On logout or tab close, session is cleared
- `App.jsx` reads the session on mount to auto-restore the logged-in state

### Master Password
- `VITE_MASTER_PASSWORD` (env var) bypasses the normal encrypted-password check
- The username must still exist in Firestore — it is not a backdoor to create accounts
- If `VITE_MASTER_PASSWORD` is empty the feature is disabled automatically

---

## 🌐 Environment Variables

Defined in `.env` (git-ignored). Template in `.env.example`.

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID

VITE_MASTER_PASSWORD        # Master bypass password
VITE_ENC_PASSPHRASE         # 32-char AES key passphrase
VITE_ENC_SALT               # PBKDF2 salt string
```

> All must also be set in **Vercel → Project Settings → Environment Variables**.

---

## 🚀 Key Features

| Feature | Detail |
|---|---|
| Registration | Username + password + 2 security questions |
| Login | Username/password or master password |
| Forgot Password | 3-step: find account → verify security answer → set new password |
| Add Reminder | Name, phone, birthday, anniversary, unlimited special events |
| Edit / Delete | Inline on the All Reminders page |
| Upcoming Events | Home dashboard — next 30 days, sorted by days remaining |
| WhatsApp Wish | One-tap deep-link with pre-filled message (`wa.me/91…`) |
| Profile Page | View account info, security Q&A, change password (behind ✏️ toggle) |
| Loading States | CSS spinner shown while Firestore data is fetching on Home & Reminders |
| Error Banners | Firestore `permission-denied` / `failed-precondition` shown in UI |

---

## 🛠️ NPM Scripts

| Script | Action |
|---|---|
| `npm run dev` | Start Vite dev server (`localhost:5173`) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint check |

---

## 📋 Firestore Security Rules (recommended)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if true;
    }
    match /reminders/{reminderId} {
      allow read, write: if true;
    }
  }
}
```

> For production, tighten these rules once Firebase Authentication is integrated.

---

## 📦 Deployment (Vercel)

1. Push repo to GitHub
2. Import project in Vercel
3. Set **Build Command:** `npm run build`
4. Set **Output Directory:** `dist`
5. Add all `VITE_*` environment variables in Vercel dashboard
6. Deploy — Firestore is the persistent backend; Vercel only serves the static bundle
