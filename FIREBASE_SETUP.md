# Firebase Setup Guide

This project currently uses Firebase for payment screenshot uploads (`Storage`) and is ready for `Firestore` rules/index deployment.

## 1) Create Firebase Project

- Project name: `kalisnugon-dev` (or your preferred name)
- Plan: start with `Spark` (free), move to `Blaze` only when needed
- Database type: `Cloud Firestore`
- Firestore mode/API: `Native mode`
- Firestore location: choose nearest to users (for PH, usually `asia-southeast1`)

## 2) Create Firestore Database

In Firebase Console:
- Go to `Firestore Database`
- Click `Create database`
- Select `Production mode`
- Select location (`asia-southeast1` recommended for PH users)

## 3) Enable Firebase Storage

In Firebase Console:
- Go to `Storage`
- Click `Get started`
- Select same location as Firestore

## 4) Register Web App + Copy Config

- Go to Project Settings -> Your apps -> Web app
- Copy these values into `.env`:

```
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
```

Restart the dev server after editing `.env`.

## 5) Deploy Rules and Indexes

Install Firebase CLI globally (once):

```bash
npm install -g firebase-tools
```

Login and link project:

```bash
firebase login
firebase use --add
```

Deploy security rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 6) Notes About Current Rules

- `firestore.rules` currently uses secure deny-all by default.
- `storage.rules` allows only image uploads up to 15MB under `payment-screenshots/`.
- If you later add Firebase Authentication, tighten `storage.rules` to require `request.auth != null`.
